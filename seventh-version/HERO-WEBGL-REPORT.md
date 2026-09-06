# Отчёт: как перенести приёмы `.hero__visual.hero__visual--webgl` (mazehq.com) в hero секцию seventh-version

Дата: 2026-09-06. Источник: https://mazehq.com/?ref=threejsresources (разобран в браузере: DOM, computed styles, глобалы).

---

## 1. Что там на самом деле сделано

### 1.1 DOM-анатомия

```
section.hero.hero--paired-testimonials       ← 1512×628, flex, overflow:hidden, bg #000D16
└─ div.hero__grid                            ← display:grid; grid-template-columns: 730px 730px;
   │                                            align-items: stretch  (ровно 50/50, БЕЗ gap)
   ├─ div.hero__visual.hero__visual--webgl    ← 730×628, position:relative, overflow:hidden
   │  └─ div.hero__webgl.particle-globe       ← 730×628
   │     ├─ canvas.hero__webgl-canvas         ← CSS 730×628, атрибуты 1460×1256 (DPR=2)
   │     ├─ div.particle-pin.particle-pin--left   ×8
   │     └─ div.particle-pin.particle-pin--right  ×8
   └─ div.hero__content
      └─ div.hero__content-inner.u-wysiwyg
```

Ключевое наблюдение: **визуал — не «картинка справа», а полноценная половина grid'а**, растянутая на всю высоту секции (`align-items: stretch`), и глобус намеренно **обрезается правым краем** (`overflow:hidden` на секции). Это даёт ощущение «объект больше экрана», а не «иллюстрация в рамке».

### 1.2 Стек

| Слой | Технология | Версия |
|---|---|---|
| 3D | three.js (`window.THREE`, `window.okdThree`) | r184 |
| Анимация/скролл | GSAP + ScrollTrigger + Observer + SplitText + CustomEase | 3.14.2 |
| Шейдеры | отдельный бандл `global-shaders-*.js`, ещё есть `.okd-shader-canvas` для медиа-героев | — |

### 1.3 Сам визуал (particle globe)

- Сфера из **десятков тысяч точек** (`THREE.Points`), круглые мягкие точки — значит в фрагментном шейдере отсекается круг по `gl_PointCoord` c плавным краем (`smoothstep`), а не квадратный `PointsMaterial` по умолчанию.
- **Размер точки зависит от глубины**: ближние крупные и яркие, дальние — мелкие и приглушённые. Это `gl_PointSize = size * (scale / -mvPosition.z)` + затухание альфы по `z`.
- **Двухцветная палитра, а не радуга**: базовый бирюзовый (`≈#4FC3D9`) + магента (`≈#B23BE0`) вдоль одной «гряды». Цвет — атрибут вершины, смешивается по маске/шуму, не по случайности.
- Точки лежат не строго на сфере: видна **волновая деформация (displacement)** — гряды и «континенты». Это шум (curl/simplex) по позиции + времени в вершинном шейдере.
- Медленное автовращение + мягкий отклик на курсор. Без явного «wow»-жеста, движение почти незаметное — фон, а не аттракцион.

### 1.4 HTML-пины поверх canvas — самый ценный приём

Аннотации `CVE-2024-21626` — **не часть WebGL**. Это обычные DOM-элементы:

```
div.particle-pin            position:absolute; left:0; top:0;
                            transform: translate(486.8px, 126.4px);   ← проекция 3D-точки в 2D
                            opacity: 0 → 1; transition: opacity .6s ease-in-out;
                            pointer-events: none;
├─ span.particle-pin__label position:absolute; left:-145px; top:-54px;
                            background:#fff; color:#001018; padding:6px 10px;
                            font: 12px/12px ui-monospace, SFMono-Regular, Menlo, monospace;
                            border-radius: 0        ← принципиально острые углы
├─ span.particle-pin__line  position:absolute; width:40px; height:1px; background:#fff;
                            transform: rotate(52deg); transform-origin: left center;
└─ span.particle-pin__dot   маленький квадрат-«прицел» (рамка + точка внутри)
```

Логика: каждый кадр берём якорную 3D-точку → `vector.project(camera)` → пиксели → пишем в `transform`. Когда точка уходит на обратную сторону сферы (`z > 0` в NDC / dot(normal, viewDir) < 0) — `opacity: 0`, и переход в 0.6s делает это мягко. Пины чередуются `--left` / `--right`, чтобы выноски не наезжали друг на друга.

**Почему это важно для вас:** текст остаётся текстом — доступен скринридеру, выделяется, переводится (у вас RU/KZ через `data-i18n`), не требует рендера шрифта в WebGL. Это ровно тот приём, который вам нужен, чтобы hero не был «просто красивым фоном», а нёс смысл.

### 1.5 Reveal-анимация входа

На `.hero__visual--webgl` в момент замера висело `opacity: 0.0018` и `transform: translateY(31.6px)` — то есть GSAP гонит появление блока `opacity 0→1` + `y 32→0`. Тот же паттерн, что ваш `.js-rise`, только с более длинной дистанцией и на крупном блоке.

### 1.6 Что ещё в системе (для контекста)

Ниже по странице те же `.hero__visual`, но с модификаторами `--media --has-shader`: под изображением лежит `canvas.okd-shader-canvas` (шейдерная подложка). То есть у них **единый компонент hero с вариантами визуала** — `--webgl`, `--media`, `--has-shader`. Это архитектурный урок: не «hero с глобусом», а «hero + слот визуала».

---

## 2. Что из этого применимо к seventh-version — и что нет

Ваш hero сейчас:

```
section.band.band--ink.hero#hero
└─ .wrap.hero__grid          grid-template-columns: 1.15fr .85fr; gap: 6rem; align-items:center
   ├─ div (eyebrows, h1.js-split, .lead, .hero__cta, .micro)
   └─ .mock.js-rise          мокап каталога курсов (карточка на --ink-800)
```

| Приём Maze | Брать? | Почему |
|---|---|---|
| Полноширинный визуальный слот, обрезаемый краем экрана | **Да** | Самый дешёвый способ добавить масштаба. Чистый CSS. |
| HTML-пины, спроецированные из 3D | **Да, приоритет №1** | Даёт смысл + i18n + a11y. Работает даже без WebGL (см. §3.4). |
| Круглые точки с depth-attenuation, 2 цвета | **Да** | Ложится на ваши `--signal-lift #7E8BFF` / `--on-ink #D6E3FC`. |
| Reveal `opacity + translateY` на блоке визуала | **Да** | У вас уже есть `.js-rise` + IntersectionObserver в `app.js:337`. |
| three.js r184 + GSAP/ScrollTrigger/SplitText | **Нет** | У вас чистый ES5-стиль ванильный `app.js` (701 строка) без зависимостей и с ручным `js-split`. Тянуть 5 библиотек ради hero — регресс. В `third-version/webgl-scene.js` у вас **уже есть** `WebGLHeroScene` на three.js через CDN — переиспользуйте его, а не копируйте стек Maze. |
| Убрать `.mock` ради глобуса | **Нет** | Мокап каталога — конкретика продукта (п.4 вашего ТЗ). Терять его ради абстрактной сферы — минус в конверсии. |

**Главный вывод по композиции:** у Maze визуал *заменяет* контент справа. У вас справа стоит осмысленный мокап. Поэтому не копируйте их grid 50/50, а **добавьте WebGL как подложку всей hero-секции**, поверх которой остаётся и текст, и мокап. Пины при этом вешаются на подложку.

---

## 3. Конкретный план внедрения

### 3.1 Разметка (`index.html`, внутри `section.hero`, первым ребёнком до `.wrap`)

```html
<div class="hero__visual hero__visual--webgl" id="heroVisual" aria-hidden="true">
  <canvas class="hero__webgl-canvas" id="heroCanvas"></canvas>
  <!-- пины генерируются из app.js, чтобы подхватывать i18n -->
</div>
```

Шаблон пина (создаётся в JS):

```html
<div class="pin pin--right">
  <span class="pin__label">Промпт-инжиниринг</span>
  <span class="pin__line"></span>
  <span class="pin__dot"></span>
</div>
```

Подписи берите из своей предметной области, а не «CVE»: `Как устроен ИИ`, `Промпт-инжиниринг`, `Генерация изображений`, `PISA-задачи`, `Аналитика прогресса` — и прогоняйте через `data-i18n`, чтобы KZ работал.

### 3.2 CSS (в `styles.css`, рядом с блоком `.hero` на строке 346)

```css
/* ---------- hero: визуальный слой ---------- */
.hero { position: relative; isolation: isolate; }

.hero__visual {
  position: absolute;
  inset: 0 0 0 auto;              /* прижат вправо, обрезается краем секции */
  width: min(62vw, 92rem);
  z-index: 0;
  overflow: hidden;
  pointer-events: none;

  /* мягкий уход в фон слева и снизу — вместо жёсткой границы колонки */
  -webkit-mask-image:
    linear-gradient(90deg, transparent 0%, #000 38%),
    linear-gradient(180deg, #000 70%, transparent 100%);
  -webkit-mask-composite: source-in;
          mask-image:
    linear-gradient(90deg, transparent 0%, #000 38%),
    linear-gradient(180deg, #000 70%, transparent 100%);
          mask-composite: intersect;

  /* reveal */
  opacity: 0;
  transform: translateY(3.2rem);
  transition: opacity .9s var(--ease-out), transform .9s var(--ease-out);
}
.hero__visual.is-in { opacity: 1; transform: none; }

.hero__webgl-canvas { display: block; width: 100%; height: 100%; }

/* контент и мокап — над визуалом */
.hero .wrap { position: relative; z-index: 1; }

/* мокап получает подложку, чтобы не терять читаемость поверх частиц */
.mock { backdrop-filter: blur(12px); background: rgba(10, 14, 28, .72); }
```

```css
/* ---------- пины-выноски ---------- */
.pin {
  position: absolute; left: 0; top: 0;
  opacity: 0;
  transition: opacity .6s ease-in-out;
  pointer-events: none;
  will-change: transform, opacity;
}
.pin.is-on { opacity: 1; }

.pin__label {
  position: absolute; top: -5.4rem;
  padding: .6rem 1rem;
  background: var(--on-ink);      /* #D6E3FC — ваш «белый на тёмном» */
  color: var(--ink-900);
  font-family: "JetBrains Mono", monospace;
  font-size: 1.2rem; line-height: 1.2rem; letter-spacing: .02em;
  border-radius: 0;               /* острые углы — часть приёма */
  white-space: nowrap;
}
.pin--left  .pin__label { right: 4.6rem; }
.pin--right .pin__label { left: 4.6rem; }

.pin__line {
  position: absolute; left: 0; top: 0;
  width: 4rem; height: 1px;
  background: var(--on-ink);
  transform-origin: left center;
  transform: rotate(-52deg);
}
.pin--left .pin__line { transform: rotate(-128deg); }

.pin__dot {
  position: absolute; left: -.5rem; top: -.5rem;
  width: 1rem; height: 1rem;
  border: 1px solid var(--on-ink);
  box-shadow: inset 0 0 0 3px var(--ink-900), inset 0 0 0 5px var(--on-ink);
}
```

Мобильная правка (в существующий `@media` на строке ~739):

```css
@media (max-width: 900px) {
  .hero__visual { width: 100%; opacity: .35; }   /* уходит в фон, пины скрыть */
  .pin { display: none; }
}
```

### 3.3 Палитра частиц под ваши токены

Не берите бирюзу+магенту Maze — у вас **один акцент** по ТЗ (п. «единственный акцент»). Возьмите двухточечный градиент внутри своей системы:

| Роль | Цвет | Токен |
|---|---|---|
| База точек | `#93A2C4` @ alpha .55 | `--on-ink-dim` |
| Акцентная гряда | `#7E8BFF` | `--signal-lift` |
| Фон | `#04060F` | `--ink-900` |

Смешивайте атрибутом `aColor` в вершинном шейдере по маске «гряды», ровно как у них, но в пределах одного акцента.

### 3.4 JS: два уровня, оба обязательны

**Уровень A — фолбэк без WebGL (сделать первым).** Пины и mask-градиент не требуют three.js. Если `WebGLRenderingContext` недоступен или `prefers-reduced-motion: reduce` (у вас уже есть `reduced` в `app.js:9`) — рисуйте статическую сетку точек в 2D-canvas или SVG, пины расставляйте по фиксированным процентным координатам, `is-on` включайте через ваш существующий `IntersectionObserver` (`app.js:337`). Hero остаётся живым, вес — ноль.

**Уровень B — WebGL.** У вас уже написан `third-version/webgl-scene.js`: класс `WebGLHeroScene`, импорт `three@0.160.0` с jsDelivr, есть `initHeroScene`, `updateThemeVisuals`, `showNodeTooltip`/`hideNodeTooltip` — это буквально прото-версия пинов Maze. План: скопировать в `seventh-version/webgl-scene.js`, заменить геометрию на сферу с шумовым displacement, а тултипы переписать на `.pin` из §3.2.

Цикл проекции пина (ядро приёма):

```js
var v = new THREE.Vector3();
function updatePins() {
  for (var i = 0; i < pins.length; i++) {
    var p = pins[i];
    v.copy(p.anchor).applyMatrix4(globe.matrixWorld);
    var facing = v.clone().sub(camera.position).normalize()
                  .dot(v.clone().normalize()) < 0;      // точка на лицевой стороне
    v.project(camera);
    p.el.style.transform = 'translate(' +
      ((v.x * 0.5 + 0.5) * rect.width).toFixed(1) + 'px,' +
      ((-v.y * 0.5 + 0.5) * rect.height).toFixed(1) + 'px)';
    p.el.classList.toggle('is-on', facing && v.z < 1);
  }
}
```

Загрузка — ленивая, чтобы не бить по LCP:

```js
if (!reduced && 'IntersectionObserver' in window && hasWebGL()) {
  import('./webgl-scene.js').then(function (m) { m.initHeroScene('heroVisual', 'heroCanvas'); });
}
```

### 3.5 Бюджет и производительность

- DPR ограничивайте `Math.min(devicePixelRatio, 2)` — Maze держит ровно 2 (canvas 1460×1256 при CSS 730×628).
- Точек: 25–40k хватает. Один `THREE.Points`, один `BufferGeometry`, один `ShaderMaterial`, `depthWrite: false`, `blending: AdditiveBlending` только если фон точно чёрный.
- `renderer.setAnimationLoop` останавливать, когда hero вне вьюпорта (`IntersectionObserver`) и на `visibilitychange` — иначе ноутбук греется на всей странице.
- Пины двигайте **только** через `transform` (как Maze), никогда через `left/top`.

### 3.6 Доступность

- `aria-hidden="true"` на `.hero__visual` — сам глобус декоративен.
- Тексты пинов дублируют то, что уже есть в `.mock` (названия курсов) → скринридеру ничего не теряется, поэтому прятать их корректно. Если решите сделать пины единственным носителем смысла — снимите `aria-hidden` и добавьте `role="img"` с `aria-label` на контейнер.
- `prefers-reduced-motion` — не просто «замедлить», а полностью отключить `setAnimationLoop`: рендерить один кадр и остановиться.

---

## 4. Порядок работ

1. CSS-слой `.hero__visual` + mask + reveal + подложка `.mock`. **Без JS уже даёт глубину.** (~1 ч)
2. Пины на статических координатах + `is-on` через существующий `IntersectionObserver`, тексты в `i18n.js`. (~2 ч)
3. Порт `webgl-scene.js` из third-version, сфера + шум + палитра `--signal-lift`. (~3–4 ч)
4. Подключение проекции пинов к сцене, замена статических координат на 3D-якоря. (~1 ч)
5. Гейты: `hasWebGL()`, `reduced`, пауза вне вьюпорта, мобильный фолбэк. (~1 ч)

Шаги 1–2 самодостаточны: если WebGL так и не появится, hero всё равно станет заметно динамичнее.

---

## 5. Чего копировать НЕ надо

- **GSAP-стек.** 5 плагинов ради одного reveal — у вас уже есть свои `js-split`/`js-rise` на IntersectionObserver.
- **Grid 50/50 с заменой контента.** Убьёт мокап каталога.
- **Бирюза + магента.** Ломает правило «единственный акцент» вашего дизайн-языка.
- **Полностью абстрактный визуал.** Сила блока Maze не в сфере, а в том, что на ней подписаны реальные CVE. Без осмысленных пинов вы получите обои.
