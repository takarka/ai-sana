import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type CraftButtonVariant = 'primary' | 'ghost' | 'solid';

@Component({
  selector: 'craft-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './button.html',
  styleUrl: './button.scss',
  host: {
    class: 'craft-button-host',
  },
})
export class CraftButton {
  readonly variant = input<CraftButtonVariant>('primary');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input(false);
  // Перенос .btn__arrow из eighth-version/styles.css — стрелка стояла
  // только на primary-кнопках главных CTA (hero/final), не на каждой
  // (находка 14, docs/plan/04-landing-migration-audit.md).
  readonly arrow = input(false);
  // Кнопка submit формы на всю ширину карточки (форма логина, модалки кабинета).
  readonly fullWidth = input(false);
}
