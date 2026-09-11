import { ChangeDetectionStrategy, Component, input } from '@angular/core';

// Пустые списки (F0.5) — школ ещё нет, классов ещё нет, поиск не дал
// результатов. Один компонент вместо разметки-заглушки на каждом экране.
@Component({
  selector: 'craft-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss',
  host: {
    class: 'craft-empty-state-host',
  },
})
export class CraftEmptyState {
  readonly message = input.required<string>();
}
