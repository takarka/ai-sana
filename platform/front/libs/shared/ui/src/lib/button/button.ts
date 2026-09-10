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
}
