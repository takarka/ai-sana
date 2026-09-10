import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Скролл-сценарий шагов урока — порт initHowScrub() из
// eighth-version/js/page-matrix.js. Модуль не зависит от Angular и грузится
// только динамическим import() из matrix.ts, поэтому gsap уезжает в
// отдельный ленивый чанк и не попадает в initial-бандл.
//
// Границы (`top 30%` / `bottom 70%`) и формула шага перенесены дословно:
// от них зависит, на каком месте экрана переключается шаг.

export interface StepScrubOptions {
  /** Селектор секции, прокрутка которой двигает шаги. */
  trigger: string;
  steps: number;
  onStep: (index: number) => void;
}

export function createStepScrub(options: StepScrubOptions): () => void {
  gsap.registerPlugin(ScrollTrigger);

  // matchMedia сам включает и выключает эффект при ресайзе: на узких экранах
  // шаги листаются только кликом.
  const media = gsap.matchMedia();
  media.add('(min-width: 1024px)', () => {
    const trigger = ScrollTrigger.create({
      trigger: options.trigger,
      start: 'top 30%',
      end: 'bottom 70%',
      onUpdate: (self) => {
        options.onStep(Math.min(options.steps - 1, Math.floor(self.progress * options.steps)));
      },
    });

    return () => {
      trigger.kill();
      options.onStep(0);
    };
  });

  return () => media.revert();
}
