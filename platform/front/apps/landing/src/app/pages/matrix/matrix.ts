import { Dialog } from '@angular/cdk/dialog';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { CraftButton } from '@front/ui';
import { prefersReducedMotion } from '../../shared/reveal/reduced-motion';
import { RevealOnScroll } from '../../shared/reveal/reveal-on-scroll';
import { SplitWords } from '../../shared/reveal/split-words';
import { whenIdle } from '../../shared/when-idle';
import { openDemoModal } from '../../shared/demo-modal/demo-modal';

interface HowStep {
  nav: string;
  title: string;
  desc: string;
}

// Пошаговый сценарий урока (eighth-version/js/page-matrix.js): клик по шагу
// переключает панель. Скролл-скраб через GSAP/ScrollTrigger, который на
// десктопе синхронизировал шаг с прокруткой секции, на этом проходе не
// перенесён — тот же выбор объёма, что и в шаге 3 плана 04 для WebGL-сцены:
// клик уже даёт полноценный доступ к контенту без анимации.
const HOW_STEPS: HowStep[] = [
  {
    nav: $localize`:@@matrix.step1.nav:Самостоятельное прохождение`,
    title: $localize`:@@matrix.step1.title:Самостоятельное прохождение (Индивидуальный темп)`,
    desc: $localize`:@@matrix.step1.desc:Ученик заходит на платформу, изучает короткий теоретический блок и переходит к практическому симулятору. Каждый сильный ученик идет вперед, не дожидаясь остальных, а симуляторы удерживают фокус внимания.`,
  },
  {
    nav: $localize`:@@matrix.step2.nav:Безопасная практика с ИИ`,
    title: $localize`:@@matrix.step2.title:Безопасная практика с ИИ прямо в уроках`,
    desc: $localize`:@@matrix.step2.desc:Школьники сами формулируют промпты, тестируют ответы нейросетей, наглядно видят ошибки (галлюцинации моделей) и учатся их исправлять. Вся работа идет в защищенном учебном контуре без риска утечки данных.`,
  },
  {
    nav: $localize`:@@matrix.step3.nav:Адресная помощь учителя`,
    title: $localize`:@@matrix.step3.title:Адресная помощь учителя`,
    desc: $localize`:@@matrix.step3.desc:Учитель не тратит время на фронтальное объяснение у доски. На своем экране он видит «тепловую карту» класса: система автоматически подсвечивает учеников, у которых возникли сложности с текущим заданием. Учитель подходит и помогает строго тем, кому это действительно нужно.`,
  },
];

@Component({
  selector: 'app-matrix',
  imports: [CraftButton, RevealOnScroll, SplitWords],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './matrix.html',
  styleUrl: './matrix.scss',
})
export class Matrix {
  private readonly dialog = inject(Dialog);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly steps = HOW_STEPS;
  protected readonly activeStep = signal(0);

  constructor() {
    // Скролл-скраб — надстройка над кликом, а не замена: клик работает всегда
    // и на любой ширине, скролл добавляется только на десктопе и только если
    // пользователь не просил меньше движения (как в eighth-version).
    afterNextRender(() => {
      if (prefersReducedMotion()) return;
      whenIdle(async () => {
        const { createStepScrub } = await import('./matrix-scrub');
        const dispose = createStepScrub({
          trigger: '#how',
          steps: HOW_STEPS.length,
          onStep: (index) => this.activeStep.set(index),
        });
        this.destroyRef.onDestroy(dispose);
      });
    });
  }

  protected setStep(index: number): void {
    this.activeStep.set(index);
  }

  protected openDemo(): void {
    openDemoModal(this.dialog);
  }
}
