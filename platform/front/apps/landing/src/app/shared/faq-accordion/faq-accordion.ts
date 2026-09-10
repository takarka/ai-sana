import { CdkAccordionModule } from '@angular/cdk/accordion';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface FaqEntry {
  question: string;
  answer: string;
}

// ARIA-паттерн disclosure (aria-expanded на кнопке, панель скрыта атрибутом,
// не только классом) — перенесено из core.js/page-home.js. CdkAccordion даёт
// состояние "один открыт за раз" из коробки, разметку и ARIA держим сами,
// как на лендинге.
@Component({
  selector: 'app-faq-accordion',
  imports: [CdkAccordionModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './faq-accordion.html',
  styleUrl: './faq-accordion.scss',
})
export class FaqAccordion {
  readonly items = input.required<FaqEntry[]>();
}
