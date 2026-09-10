import { Dialog, DialogModule, DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CraftButton } from '@front/ui';

// CDK Dialog даёт focus trap, aria-hidden фона, Escape и возврат фокуса «из
// коробки» (см. DialogConfig в @angular/cdk/dialog) — это тот же контракт
// доступности, что был у самодельной модалки в core.js (план
// 04-landing-migration.md, §3, шаг 3).
@Component({
  selector: 'app-demo-modal',
  imports: [DialogModule, ReactiveFormsModule, CraftButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './demo-modal.html',
  styleUrl: './demo-modal.scss',
})
export class DemoModal {
  private readonly dialogRef = inject(DialogRef<void, DemoModal>);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly submitted = signal(false);

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    organization: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    // honeypot: невидимое человеку поле, боты обычно заполняют все поля формы
    website: [''],
  });

  protected close(): void {
    this.dialogRef.close();
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.form.controls.website.value) {
      // honeypot заполнен — тихо "принимаем" заявку, не отправляя её никуда
      this.submitted.set(true);
      return;
    }
    // На этом этапе интеграции с CRM нет (FR-WEB-02, план 04, «что этот этап
    // не делает») — заявка складывается в очередь-заглушку.
    this.submitted.set(true);
  }
}

export function openDemoModal(dialog: Dialog): DialogRef<void, DemoModal> {
  return dialog.open(DemoModal, {
    ariaLabelledBy: 'demo-modal-title',
    panelClass: 'demo-modal-panel',
  });
}
