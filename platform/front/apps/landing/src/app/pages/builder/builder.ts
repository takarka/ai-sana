import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CraftButton } from '@front/ui';
import { useModuleTheme } from '../../shared/module-theme';
import { RevealOnScroll } from '../../shared/reveal/reveal-on-scroll';
import { SplitWords } from '../../shared/reveal/split-words';
import { openDemoModal } from '../../shared/demo-modal/demo-modal';

type ChipKey = 'role' | 'format' | 'cases' | 'noise';

interface ChipConfig {
  key: ChipKey;
  label: string;
  fragment: string;
  points: number;
}

// Перенесено из eighth-version/js/page-builder.js. В отличие от языкового
// JS-переключателя источника, тут не нужна runtime-ветка `lang === 'kz'`:
// каждая локаль — свой собранный бандл, и $localize уже выбирает нужный
// фрагмент на этапе сборки (план 04-landing-migration.md, §2.1).
const BASE_PROMPT = $localize`:@@builder.lz.base:Сделай сайт для школьного научного проекта.`;

const CHIPS: ChipConfig[] = [
  {
    key: 'role',
    label: $localize`:@@builder.lz.chip.role:+ Роль эксперта`,
    fragment: $localize`:@@builder.lz.fragment.role:Действуй как опытный frontend-инженер и ментор школьных IT-проектов.`,
    points: 25,
  },
  {
    key: 'format',
    label: $localize`:@@builder.lz.chip.format:+ Стек и структура`,
    fragment: $localize`:@@builder.lz.fragment.format:Технический стек: Чистый семантический HTML/CSS, строгая модульная структура и адаптивная верстка.`,
    points: 25,
  },
  {
    key: 'cases',
    label: $localize`:@@builder.lz.chip.cases:+ Краевые сценарии`,
    fragment: $localize`:@@builder.lz.fragment.cases:Краевые сценарии: Предусмотри обработку пустого ввода и вывод понятных сообщений об ошибках.`,
    points: 25,
  },
  {
    key: 'noise',
    label: $localize`:@@builder.lz.chip.noise:+ Лишние вводные (шум)`,
    fragment: $localize`:@@builder.lz.fragment.noise:И сделай так, чтобы всем очень понравилось и было максимально красиво.`,
    points: -15,
  },
];

@Component({
  selector: 'app-builder',
  imports: [CraftButton, RevealOnScroll, SplitWords],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './builder.html',
  styleUrl: './builder.scss',
})
export class Builder {
  private readonly dialog = inject(Dialog);
  protected readonly chips = CHIPS;
  private readonly active = signal<Record<ChipKey, boolean>>({
    role: false,
    format: false,
    cases: false,
    noise: false,
  });

  constructor() {
    useModuleTheme('builder');
  }

  protected readonly prompt = computed(() => {
    const active = this.active();
    return [BASE_PROMPT, ...this.chips.filter((c) => active[c.key]).map((c) => c.fragment)].join(' ');
  });

  protected readonly score = computed(() => {
    const active = this.active();
    const raw = 25 + this.chips.reduce((sum, c) => sum + (active[c.key] ? c.points : 0), 0);
    return Math.max(15, Math.min(100, raw));
  });

  protected readonly scoreLevel = computed<'high' | 'mid' | 'low'>(() => {
    const score = this.score();
    if (score >= 80) return 'high';
    if (score >= 50) return 'mid';
    return 'low';
  });

  protected readonly scoreLabel = computed(() => {
    switch (this.scoreLevel()) {
      case 'high':
        return $localize`:@@builder.lz.score.high:Качество промпта: 95% — Инженерный промпт: точный код с первой попытки`;
      case 'mid':
        return $localize`:@@builder.lz.score.mid:Качество промпта: 65% — Хорошая база, но не хватает строгих ограничений`;
      default:
        return $localize`:@@builder.lz.score.low:Качество промпта: 25% — Слишком размыто, результат непредсказуем`;
    }
  });

  protected isActive(key: ChipKey): boolean {
    return this.active()[key];
  }

  protected toggleChip(key: ChipKey): void {
    this.active.update((state) => ({ ...state, [key]: !state[key] }));
  }

  protected openDemo(): void {
    openDemoModal(this.dialog);
  }
}
