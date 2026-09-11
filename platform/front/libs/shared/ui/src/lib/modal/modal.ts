import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

// Общий каркас модалок кабинета (план 09 §4.1, F0.5; макет
// docs/plan/10-admin-panel-dizayn.html, экран 4). CDK Dialog отвечает за
// focus-trap/Escape/фон (см. apps/landing DemoModal) — этот компонент только
// про заголовок, описание и крестик закрытия внутри панели диалога.
@Component({
  selector: 'craft-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './modal.html',
  styleUrl: './modal.scss',
  host: {
    class: 'craft-modal-host',
  },
})
export class CraftModal {
  readonly modalTitle = input.required<string>();
  readonly description = input<string | null>(null);
  readonly closed = output<void>();
}
