import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type CraftStatusLevel = 'high' | 'mid' | 'low';

const LEVEL_ICON_PATH: Record<CraftStatusLevel, string> = {
  // галочка — всё в порядке
  high: 'M4 8.5l2.5 2.5L12 5',
  // тире — требует внимания
  mid: 'M4 8h8',
  // восклицательный знак — риск
  low: 'M8 4v5M8 11.2v.1',
};

@Component({
  selector: 'craft-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.scss',
  host: {
    class: 'craft-status-badge-host',
  },
})
export class CraftStatusBadge {
  // Статус кодируется цветом + иконкой + текстом одновременно (FR-MTX-17,
  // NFR-A11Y-03) — ни один канал не несёт информацию в одиночку. `label`
  // обязателен, а не просто aria-label: подпись видна всем, не только
  // пользователям вспомогательных технологий.
  readonly level = input.required<CraftStatusLevel>();
  readonly label = input.required<string>();

  protected get iconPath(): string {
    return LEVEL_ICON_PATH[this.level()];
  }
}
