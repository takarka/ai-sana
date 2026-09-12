import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QuestionType, TranslatePipe } from '@front/core';
import { CraftButton, CraftInput } from '@front/ui';
import { QuestionDraft, createQuestionDraft } from '../../../model/question-draft';

const QUESTION_TYPES: readonly QuestionType[] = [
  'SingleChoice',
  'MultipleChoice',
  'Matching',
  'Ordering',
  'FillInBlank',
  'NumericTolerance',
  'ShortText',
  'DragAndDrop',
];

// Форма одного вопроса составного задания — восемь типов закрытых заданий
// (план 06 §2, FR-CMS-02). Ровно те поля, что проверяет бэкенд
// (CraftAi.Modules.Assessment.Validation.QuestionValidationService): смена
// типа пересобирает черновик, не пытаясь мигрировать данные между формами.
@Component({
  selector: 'app-pisa-question-editor',
  imports: [FormsModule, CraftInput, CraftButton, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pisa-question-editor.html',
  styleUrls: ['../../dialog-form.scss', './pisa-question-editor.scss'],
})
export class PisaQuestionEditor {
  readonly draft = input.required<QuestionDraft>();
  readonly index = input.required<number>();
  readonly error = input<string | null>(null);
  readonly canMoveUp = input(false);
  readonly canMoveDown = input(false);

  readonly changed = output<QuestionDraft>();
  readonly removed = output<void>();
  readonly moveUp = output<void>();
  readonly moveDown = output<void>();

  protected readonly questionTypes = QUESTION_TYPES;

  protected setType(type: QuestionType): void {
    this.changed.emit({ ...createQuestionDraft(type), key: this.draft().key });
  }

  private patch(patch: Partial<QuestionDraft>): void {
    this.changed.emit({ ...this.draft(), ...patch });
  }

  private setList(field: keyof QuestionDraft, index: number, value: string): void {
    const list = [...(this.draft()[field] as string[])];
    list[index] = value;
    this.patch({ [field]: list } as Partial<QuestionDraft>);
  }

  private addListItem(field: keyof QuestionDraft): void {
    this.patch({ [field]: [...(this.draft()[field] as string[]), ''] } as Partial<QuestionDraft>);
  }

  // --- SingleChoice / MultipleChoice ---

  protected setOption(index: number, value: string): void {
    this.setList('options', index, value);
  }

  protected addOption(): void {
    this.addListItem('options');
  }

  protected removeOption(index: number): void {
    const draft = this.draft();
    const options = draft.options.filter((_, i) => i !== index);
    if (draft.type === 'SingleChoice') {
      const correctIndex = draft.correctIndex === index ? 0 : draft.correctIndex > index ? draft.correctIndex - 1 : draft.correctIndex;
      this.patch({ options, correctIndex });
    } else {
      const correctIndices = draft.correctIndices
        .filter((i) => i !== index)
        .map((i) => (i > index ? i - 1 : i));
      this.patch({ options, correctIndices });
    }
  }

  protected setCorrectIndex(index: number): void {
    this.patch({ correctIndex: index });
  }

  protected toggleCorrectIndices(index: number, checked: boolean): void {
    const draft = this.draft();
    const correctIndices = checked
      ? [...draft.correctIndices, index]
      : draft.correctIndices.filter((i) => i !== index);
    this.patch({ correctIndices });
  }

  // --- Matching ---

  protected setLeft(index: number, value: string): void {
    this.setList('left', index, value);
  }

  protected addLeft(): void {
    this.patch({ left: [...this.draft().left, ''], rightByLeft: [...this.draft().rightByLeft, null] });
  }

  protected removeLeft(index: number): void {
    const draft = this.draft();
    this.patch({
      left: draft.left.filter((_, i) => i !== index),
      rightByLeft: draft.rightByLeft.filter((_, i) => i !== index),
    });
  }

  protected setRight(index: number, value: string): void {
    this.setList('right', index, value);
  }

  protected addRight(): void {
    this.addListItem('right');
  }

  protected removeRight(index: number): void {
    const draft = this.draft();
    this.patch({
      right: draft.right.filter((_, i) => i !== index),
      rightByLeft: draft.rightByLeft.map((value) => (value === index ? null : value !== null && value > index ? value - 1 : value)),
    });
  }

  protected setRightForLeft(leftIndex: number, rightIndexRaw: string): void {
    const rightByLeft = [...this.draft().rightByLeft];
    rightByLeft[leftIndex] = rightIndexRaw === '' ? null : Number(rightIndexRaw);
    this.patch({ rightByLeft });
  }

  // --- Ordering ---

  protected setOrderItem(index: number, value: string): void {
    this.setList('orderItems', index, value);
  }

  protected addOrderItem(): void {
    this.addListItem('orderItems');
  }

  protected removeOrderItem(index: number): void {
    this.patch({ orderItems: this.draft().orderItems.filter((_, i) => i !== index) });
  }

  // --- FillInBlank ---

  protected setBlankText(value: string): void {
    this.patch({ blankText: value });
  }

  protected setBlank(index: number, value: string): void {
    this.setList('blanks', index, value);
  }

  protected addBlank(): void {
    this.addListItem('blanks');
  }

  protected removeBlank(index: number): void {
    this.patch({ blanks: this.draft().blanks.filter((_, i) => i !== index) });
  }

  // --- NumericTolerance ---

  protected setNumericQuestion(value: string): void {
    this.patch({ numericQuestion: value });
  }

  protected setExpected(value: string): void {
    this.patch({ expected: Number(value) });
  }

  protected setTolerance(value: string): void {
    this.patch({ tolerance: Number(value) });
  }

  // --- ShortText ---

  protected setShortTextQuestion(value: string): void {
    this.patch({ shortTextQuestion: value });
  }

  protected setAcceptedAnswer(index: number, value: string): void {
    this.setList('acceptedAnswers', index, value);
  }

  protected addAcceptedAnswer(): void {
    this.addListItem('acceptedAnswers');
  }

  protected removeAcceptedAnswer(index: number): void {
    this.patch({ acceptedAnswers: this.draft().acceptedAnswers.filter((_, i) => i !== index) });
  }

  // --- DragAndDrop ---

  protected setDragItem(index: number, value: string): void {
    this.setList('dragItems', index, value);
  }

  protected addDragItem(): void {
    this.patch({ dragItems: [...this.draft().dragItems, ''], categoryByItem: [...this.draft().categoryByItem, null] });
  }

  protected removeDragItem(index: number): void {
    const draft = this.draft();
    this.patch({
      dragItems: draft.dragItems.filter((_, i) => i !== index),
      categoryByItem: draft.categoryByItem.filter((_, i) => i !== index),
    });
  }

  protected setCategory(index: number, value: string): void {
    this.setList('categories', index, value);
  }

  protected addCategory(): void {
    this.addListItem('categories');
  }

  protected removeCategory(index: number): void {
    const draft = this.draft();
    this.patch({
      categories: draft.categories.filter((_, i) => i !== index),
      categoryByItem: draft.categoryByItem.map((value) =>
        value === index ? null : value !== null && value > index ? value - 1 : value,
      ),
    });
  }

  protected setCategoryForItem(itemIndex: number, categoryIndexRaw: string): void {
    const categoryByItem = [...this.draft().categoryByItem];
    categoryByItem[itemIndex] = categoryIndexRaw === '' ? null : Number(categoryIndexRaw);
    this.patch({ categoryByItem });
  }
}
