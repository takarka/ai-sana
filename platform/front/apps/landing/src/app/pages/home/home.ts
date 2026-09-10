import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CraftButton } from '@front/ui';
import { openDemoModal } from '../../shared/demo-modal/demo-modal';
import { FaqAccordion, FaqEntry } from '../../shared/faq-accordion/faq-accordion';
import { DeskPreview } from './desk-preview/desk-preview';
import { HeroPins } from './hero-pins/hero-pins';

// FAQ — данные, не разметка: то же соображение, что и в desk-preview.ts.
const FAQ_ENTRIES: FaqEntry[] = [
  {
    question: $localize`:@@home.faq.q1:Как экосистема CRAFT AI внедряется в учебный процесс школы?`,
    answer: $localize`:@@home.faq.a1:Платформа интегрируется бесшовно: модуль MATRIX используется учителями на регулярных уроках предмета «Цифровая грамотность и ИИ», модуль BUILDER запускается как внеурочный кружок или спецкурс, а PISA — для плановой диагностики готовности параллелей.`,
  },
  {
    question: $localize`:@@home.faq.q2:Нужно ли учителям информатики проходить долгое обучение?`,
    answer: $localize`:@@home.faq.a2:Нет. Интерфейс учителя интуитивно понятен и сопровождается готовыми поурочными методическими картами. Учителю не требуется быть экспертом в программировании нейросетей — система берёт интерактивное обучение на себя.`,
  },
  {
    question: $localize`:@@home.faq.q3:Где и как хранятся персональные данные школьников?`,
    answer: $localize`:@@home.faq.a3:Все серверные мощности и базы данных размещены в защищенном контуре на территории Республики Казахстан в строгом соответствии с Законом РК «О персональных данных и их защите». Платформа не передаёт данные детей сторонним сервисам.`,
  },
  {
    question: $localize`:@@home.faq.q4:Чем модуль CRAFT PISA отличается от обычных тестов?`,
    answer: $localize`:@@home.faq.a4:CRAFT PISA включает не только оцифрованный банк заданий OECD прошлых лет, но и впервые в Казахстане готовит детей к спецификации PISA-2029: проверке медиаграмотности, выявлению дипфейков и анализу ошибок искусственного интеллекта.`,
  },
  {
    question: $localize`:@@home.faq.q5:Как школа может запросить пилотный доступ и демонстрацию?`,
    answer: $localize`:@@home.faq.a5:Достаточно нажать кнопку «Запросить демо для школы» и оставить контакты руководства. Наша методическая команда свяжется с вами, развернёт тестовый кабинет и покажет живую работу системы на примере одного класса.`,
  },
];

@Component({
  selector: 'app-home',
  imports: [RouterLink, CraftButton, DeskPreview, FaqAccordion, HeroPins],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly dialog = inject(Dialog);
  protected readonly faqEntries = FAQ_ENTRIES;

  protected openDemo(): void {
    openDemoModal(this.dialog);
  }
}
