#!/usr/bin/env python3
"""Собирает многоразмерный .ico из SVG-иконки.

    python3 tools/svg-to-ico.py platform/front/apps/landing/public/favicon.svg \
                                platform/front/apps/landing/public/favicon.ico

Нужен только Python 3 (stdlib) и любой Chromium/Chrome для растеризации —
путь берётся из $CHROME_BIN либо ищется среди обычных мест установки
(в т.ч. в браузерах Playwright). Ни PIL, ни ImageMagick не требуются:
декодирование PNG, ресемплинг и запись ICO — здесь же.

Так собран platform/front/apps/*/public/favicon.ico. При правке
favicon.svg пересобирать оба приложения, знак должен совпадать.
"""
import glob
import os
import struct
import subprocess
import sys
import tempfile
import zlib

SIZES = (16, 32, 48)
# Растеризуем крупно и усредняем вниз: 512 кратно 16 и 32, для 48 остаётся
# дробное покрытие, которое честно считает area_resample().
RENDER = 512

CHROME_CANDIDATES = (
    '/opt/pw-browsers/chromium-*/chrome-linux/chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
)


def find_chrome():
    if os.environ.get('CHROME_BIN'):
        return os.environ['CHROME_BIN']
    for pattern in CHROME_CANDIDATES:
        found = sorted(glob.glob(pattern))
        if found:
            return found[-1]
    sys.exit('Не найден Chromium — укажите путь в $CHROME_BIN')


def rasterize(svg_path, out_png, size):
    """SVG -> PNG size x size с прозрачным фоном."""
    svg = open(svg_path, encoding='utf-8').read()
    # Явные width/height и display:block: без них инлайновый <svg> получает
    # baseline-отступ строки и картинка уезжает вниз.
    svg = svg.replace(
        '<svg ', f'<svg width="{size}" height="{size}" style="display:block" ', 1)
    with tempfile.TemporaryDirectory() as tmp:
        page = os.path.join(tmp, 'render.html')
        shot = os.path.join(tmp, 'shot.png')
        open(page, 'w', encoding='utf-8').write(
            '<body style="margin:0;padding:0;line-height:0">' + svg + '</body>')
        # Окно берём с запасом: headless отдаёт вьюпорт ниже запрошенного
        # окна и картинка ровно в size пикселей обрезается снизу.
        subprocess.run([find_chrome(), '--headless', '--disable-gpu', '--no-sandbox',
                        '--hide-scrollbars', '--force-device-scale-factor=1',
                        '--default-background-color=00000000',
                        f'--window-size={size + 128},{size + 248}',
                        f'--screenshot={shot}', page],
                       check=True, capture_output=True)
        w, h, px = read_png(shot)
    if w < size or h < size:
        sys.exit(f'Рендер вышел меньше запрошенного: {w}x{h}')
    # Кроп левого верхнего угла ровно в size x size.
    crop = bytearray()
    for y in range(size):
        crop += px[y * w * 4:y * w * 4 + size * 4]
    write_png(out_png, size, crop)
    return size, size, crop


def read_png(path):
    """Минимальный декодер PNG: только 8 бит RGBA без интерлейса."""
    data = open(path, 'rb').read()
    assert data[:8] == b'\x89PNG\r\n\x1a\n', 'не PNG'
    pos, idat, header = 8, [], None
    while pos < len(data):
        length, kind = struct.unpack('>I4s', data[pos:pos + 8])
        body = data[pos + 8:pos + 8 + length]
        if kind == b'IHDR':
            header = struct.unpack('>IIBBBBB', body)
        elif kind == b'IDAT':
            idat.append(body)
        pos += 12 + length
    width, height, depth, ctype, _, _, interlace = header
    assert (depth, ctype, interlace) == (8, 6, 0), f'неподдержанный PNG: {header}'
    raw = zlib.decompress(b''.join(idat))
    bpp, stride = 4, width * 4
    out, prev, pos = bytearray(), bytearray(stride), 0
    for _ in range(height):
        ftype = raw[pos]
        line = bytearray(raw[pos + 1:pos + 1 + stride])
        pos += 1 + stride
        for i in range(stride):
            left = line[i - bpp] if i >= bpp else 0
            up = prev[i]
            upleft = prev[i - bpp] if i >= bpp else 0
            if ftype == 1:
                line[i] = (line[i] + left) & 255
            elif ftype == 2:
                line[i] = (line[i] + up) & 255
            elif ftype == 3:
                line[i] = (line[i] + (left + up) // 2) & 255
            elif ftype == 4:
                pa, pb, pc = abs(up - upleft), abs(left - upleft), abs(left + up - 2 * upleft)
                best = left if (pa <= pb and pa <= pc) else (up if pb <= pc else upleft)
                line[i] = (line[i] + best) & 255
        out += line
        prev = line
    return width, height, out


def write_png(path, size, px):
    raw = b''.join(b'\x00' + bytes(px[y * size * 4:(y + 1) * size * 4]) for y in range(size))

    def chunk(kind, body):
        return (struct.pack('>I', len(body)) + kind + body
                + struct.pack('>I', zlib.crc32(kind + body) & 0xffffffff))

    open(path, 'wb').write(
        b'\x89PNG\r\n\x1a\n'
        + chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0))
        + chunk(b'IDAT', zlib.compress(raw, 9))
        + chunk(b'IEND', b''))


def area_resample(width, height, px, size):
    """Усреднение по площади до size x size.

    Цвет усредняется премультиплицированным на альфу — иначе прозрачные
    пиксели за скруглением плитки затягивают в кайму свой чёрный RGB.
    """
    dst = bytearray(size * size * 4)
    for y in range(size):
        y0, y1 = y * height / size, (y + 1) * height / size
        for x in range(size):
            x0, x1 = x * width / size, (x + 1) * width / size
            acc_r = acc_g = acc_b = acc_a = total = 0.0
            for sy in range(int(y0), min(height, -int(-y1 // 1))):
                cover_y = min(y1, sy + 1) - max(y0, sy)
                if cover_y <= 0:
                    continue
                for sx in range(int(x0), min(width, -int(-x1 // 1))):
                    cover_x = min(x1, sx + 1) - max(x0, sx)
                    if cover_x <= 0:
                        continue
                    weight = cover_x * cover_y
                    off = (sy * width + sx) * 4
                    alpha = px[off + 3] / 255.0
                    acc_r += px[off] * alpha * weight
                    acc_g += px[off + 1] * alpha * weight
                    acc_b += px[off + 2] * alpha * weight
                    acc_a += px[off + 3] * weight
                    total += weight
            alpha = acc_a / total
            scale = (alpha / 255.0) * total
            off = (y * size + x) * 4
            for i, acc in enumerate((acc_r, acc_g, acc_b)):
                dst[off + i] = 0 if scale == 0 else min(255, round(acc / scale))
            dst[off + 3] = min(255, round(alpha))
    return dst


def dib(size, px):
    """BITMAPINFOHEADER + BGRA снизу вверх + 1bpp AND-маска."""
    xor = bytearray()
    for y in range(size - 1, -1, -1):
        for x in range(size):
            off = (y * size + x) * 4
            xor += bytes((px[off + 2], px[off + 1], px[off], px[off + 3]))
    stride = ((size + 31) // 32) * 4
    mask = bytearray()
    for y in range(size - 1, -1, -1):
        bits = bytearray(stride)
        for x in range(size):
            # Прозрачность несёт альфа-канал, маска нужна только легаси-
            # отрисовке: 1 = пиксель прозрачный.
            if px[(y * size + x) * 4 + 3] == 0:
                bits[x >> 3] |= 0x80 >> (x & 7)
        mask += bits
    # biHeight удвоена — так ICO описывает XOR-битмап вместе с AND-маской.
    header = struct.pack('<IiiHHIIiiII', 40, size, size * 2, 1, 32, 0,
                         len(xor) + len(mask), 0, 0, 0, 0)
    return header + bytes(xor) + bytes(mask)


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    src, dst = sys.argv[1], sys.argv[2]
    with tempfile.TemporaryDirectory() as tmp:
        if src.lower().endswith('.svg'):
            width, height, px = rasterize(src, os.path.join(tmp, 'src.png'), RENDER)
        else:
            width, height, px = read_png(src)
    images = [dib(size, area_resample(width, height, px, size)) for size in SIZES]
    offset = 6 + 16 * len(images)
    out = struct.pack('<HHH', 0, 1, len(images))
    for size, image in zip(SIZES, images):
        out += struct.pack('<BBBBHHII', size, size, 0, 0, 1, 32, len(image), offset)
        offset += len(image)
    open(dst, 'wb').write(out + b''.join(images))
    print(f'{dst}: {", ".join(f"{s}x{s}" for s in SIZES)}')


if __name__ == '__main__':
    main()
