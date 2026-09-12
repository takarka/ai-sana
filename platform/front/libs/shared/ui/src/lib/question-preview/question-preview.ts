import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { QuestionDraft, TranslatePipe } from '@front/core';

// Как вопрос закрытого типа увидит ученик — план 09 §4.4/§4.5 (F3.5, F4.4):
// без указания правильного ответа, чтобы предпросмотр не выдавал эталон.
// Принимает тот же QuestionDraft, что и CraftQuestionEditor (questionDraftFromDto
// уже умеет собрать его из сохранённого вопроса) — общий движок вопросов,
// теперь и для чтения, не только для авторинга (план 09 §3.5).
@Component({
  selector: 'craft-question-preview',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './question-preview.html',
  styleUrl: './question-preview.scss',
})
export class CraftQuestionPreview {
  readonly draft = input.required<QuestionDraft>();
  readonly index = input(0);

  // Ordering/Matching/DragAndDrop хранят эталон прямо в порядке/структуре
  // черновика (см. question-draft.ts) — в предпросмотре элементы показываем не
  // в эталонном порядке, иначе ученик увидел бы готовый ответ на скриншоте.
  protected readonly shuffledOrderItems = computed(() => [...this.draft().orderItems].reverse());
}
