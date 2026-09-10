import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  viewChildren,
} from '@angular/core';
import type { ProjectedAnchor } from '../../../shared/scene/scene-globe';
import { SceneHost } from '../../../shared/scene/scene-host';

// Три подписи-выноски, «приколотые» к точкам на сфере из WebGL-сцены
// (перенесено из eighth-version/js/page-home.js, PINS + updatePins).
// Позиция считается каждый кадр из projectAnchor() — поэтому пины живут
// только пока сцена запущена; без неё (reduced-motion, нет WebGL, saveData)
// их просто нет, как и в оригинале.
interface Pin {
  anchor: readonly [number, number, number];
  side: 'left' | 'right';
  label: string;
}

const PINS: Pin[] = [
  {
    anchor: [0.82, 0.4, 0.5],
    side: 'right',
    label: $localize`:@@home.pin.m1:01 MATRIX · 1–11 классы ГОСО`,
  },
  {
    anchor: [-0.55, 0.65, 0.6],
    side: 'left',
    label: $localize`:@@home.pin.m2:02 BUILDER · Вайб-кодинг & ИИ`,
  },
  {
    anchor: [0.7, -0.55, 0.55],
    side: 'right',
    label: $localize`:@@home.pin.m3:03 PISA · Тренажёры 2029`,
  },
];

@Component({
  selector: 'app-hero-pins',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hero-pins.html',
  styleUrl: './hero-pins.scss',
  host: { class: 'hero__pins', 'aria-hidden': 'true' },
})
export class HeroPins {
  private readonly hostRef = inject(ElementRef<HTMLElement>);
  private readonly sceneHost = inject(SceneHost);
  private readonly destroyRef = inject(DestroyRef);
  private readonly pinRefs = viewChildren<ElementRef<HTMLElement>>('pin');

  protected readonly pins = PINS;

  private readonly projected: ProjectedAnchor = { x: 0, y: 0, visible: false };
  private hostRect: DOMRect | null = null;
  private labelWidths: number[] = [];
  private unsubscribeFrames: (() => void) | null = null;
  private heroInView = false;

  constructor() {
    afterNextRender(() => {
      this.measure();
      const onScroll = () => this.measure();
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });

      // Пин позиционируется относительно героя, а проекция считается в
      // координатах окна: когда герой уезжает вверх, смещение растёт и пин
      // вылезает из секции на светлые полосы под ней. В eighth-version от
      // этого спасала проверка heroInView в updatePins() — здесь то же самое,
      // только пины ещё и гасятся явно, а не замирают в последнем состоянии.
      const heroObserver = new IntersectionObserver(
        ([entry]) => {
          this.heroInView = entry.isIntersecting;
          if (this.heroInView) this.measure();
          else this.hide();
        },
        { threshold: 0 }
      );
      heroObserver.observe(this.hostRef.nativeElement);

      this.destroyRef.onDestroy(() => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
        heroObserver.disconnect();
      });
    });

    effect(() => {
      const scene = this.sceneHost.scene();
      this.unsubscribeFrames?.();
      this.unsubscribeFrames = scene ? scene.onFrame(() => this.update()) : null;
    });

    this.destroyRef.onDestroy(() => this.unsubscribeFrames?.());
  }

  private measure(): void {
    this.hostRect = this.hostRef.nativeElement.getBoundingClientRect();
  }

  private hide(): void {
    this.pinRefs().forEach((ref) => ref.nativeElement.classList.remove('is-on'));
  }

  private update(): void {
    const scene = this.sceneHost.scene();
    const rect = this.hostRect;
    if (!scene || !rect || !this.heroInView) return;

    this.pinRefs().forEach((ref, index) => {
      const element = ref.nativeElement;
      const out = scene.projectAnchor(PINS[index].anchor, this.projected);
      element.style.transform = `translate(${(out.x - rect.left).toFixed(1)}px, ${(out.y - rect.top).toFixed(1)}px)`;

      // Выноска не должна налезать на текст героя слева и торчать за правым
      // краем окна — ширину подписи меряем один раз и кешируем.
      let labelWidth = this.labelWidths[index];
      if (!labelWidth) {
        const label = element.firstElementChild as HTMLElement | null;
        labelWidth = label?.offsetWidth ? label.offsetWidth + 50 : 220;
        this.labelWidths[index] = labelWidth;
      }
      const isLeft = PINS[index].side === 'left';
      const minX = window.innerWidth * 0.44 + (isLeft ? labelWidth : 0);
      const maxX = window.innerWidth - (isLeft ? 20 : labelWidth);
      const inBounds = out.x > minX && out.x < maxX && out.y > 80 && out.y < rect.height - 30;

      element.classList.toggle('is-on', out.visible && inBounds);
    });
  }
}
