import { QuestionInput, QuestionLike, QuestionType } from './question.model';

// Черновик одного вопроса закрытого типа в форме авторинга — плоское
// объединение полей всех восьми типов (план 06 §2, FR-CMS-02) вместо восьми
// разных FormGroup: тип у вопроса можно сменить в процессе заполнения, а
// бэкенд ждёт только payload/answerKey нужной формы
// (CraftAi.Modules.Assessment.Validation.QuestionValidationService — общий
// движок для Content/MATRIX и Pisa, план 09 §3.5).
export interface QuestionDraft {
  readonly key: string;
  type: QuestionType;
  options: string[];
  correctIndex: number;
  correctIndices: number[];
  left: string[];
  right: string[];
  rightByLeft: (number | null)[];
  orderItems: string[];
  blankText: string;
  blanks: string[];
  numericQuestion: string;
  expected: number;
  tolerance: number;
  shortTextQuestion: string;
  acceptedAnswers: string[];
  dragItems: string[];
  categories: string[];
  categoryByItem: (number | null)[];
}

let nextKey = 0;

export function createQuestionDraft(type: QuestionType = 'SingleChoice'): QuestionDraft {
  return {
    key: `q${nextKey++}`,
    type,
    options: ['', ''],
    correctIndex: 0,
    correctIndices: [],
    left: ['', ''],
    right: ['', ''],
    rightByLeft: [null, null],
    orderItems: ['', ''],
    blankText: '',
    blanks: [''],
    numericQuestion: '',
    expected: 0,
    tolerance: 0,
    shortTextQuestion: '',
    acceptedAnswers: [''],
    dragItems: [''],
    categories: ['', ''],
    categoryByItem: [null],
  };
}

export function questionDraftToInput(draft: QuestionDraft): QuestionInput {
  switch (draft.type) {
    case 'SingleChoice':
      return {
        questionType: 'SingleChoice',
        payload: { options: draft.options },
        answerKey: { correctIndex: draft.correctIndex },
      };
    case 'MultipleChoice':
      return {
        questionType: 'MultipleChoice',
        payload: { options: draft.options },
        answerKey: { correctIndices: draft.correctIndices },
      };
    case 'Matching':
      return {
        questionType: 'Matching',
        payload: { left: draft.left, right: draft.right },
        answerKey: { pairs: draft.left.map((_, index) => [index, draft.rightByLeft[index]]) },
      };
    case 'Ordering':
      return {
        questionType: 'Ordering',
        payload: { items: draft.orderItems },
        answerKey: { order: draft.orderItems.map((_, index) => index) },
      };
    case 'FillInBlank':
      return {
        questionType: 'FillInBlank',
        payload: { text: draft.blankText },
        answerKey: { blanks: draft.blanks },
      };
    case 'NumericTolerance':
      return {
        questionType: 'NumericTolerance',
        payload: { question: draft.numericQuestion },
        answerKey: { expected: draft.expected, tolerance: draft.tolerance },
      };
    case 'ShortText':
      return {
        questionType: 'ShortText',
        payload: { question: draft.shortTextQuestion },
        answerKey: { acceptedAnswers: draft.acceptedAnswers },
      };
    case 'DragAndDrop':
      return {
        questionType: 'DragAndDrop',
        payload: { items: draft.dragItems, categories: draft.categories },
        answerKey: { assignments: draft.dragItems.map((_, index) => [index, draft.categoryByItem[index]]) },
      };
  }
}

// Разбор при редактировании существующего задания — payload/answerKey уже
// прошли валидацию на бэкенде при сохранении, поэтому здесь только
// приведение типов, без повторной проверки структуры.
export function questionDraftFromDto(dto: QuestionLike): QuestionDraft {
  const draft = createQuestionDraft(dto.type);
  const payload = dto.payload as Record<string, unknown>;
  const answerKey = dto.answerKey as Record<string, unknown>;

  switch (dto.type) {
    case 'SingleChoice':
      draft.options = [...(payload['options'] as string[])];
      draft.correctIndex = answerKey['correctIndex'] as number;
      break;
    case 'MultipleChoice':
      draft.options = [...(payload['options'] as string[])];
      draft.correctIndices = [...(answerKey['correctIndices'] as number[])];
      break;
    case 'Matching': {
      draft.left = [...(payload['left'] as string[])];
      draft.right = [...(payload['right'] as string[])];
      const pairs = answerKey['pairs'] as [number, number][];
      draft.rightByLeft = draft.left.map((_, index) => pairs.find(([left]) => left === index)?.[1] ?? null);
      break;
    }
    case 'Ordering': {
      const items = payload['items'] as string[];
      const order = answerKey['order'] as number[];
      // Автор всегда видит и правит элементы в правильном порядке (см.
      // questionDraftToInput) — восстанавливаем именно эту последовательность.
      draft.orderItems = order.map((itemIndex) => items[itemIndex]);
      break;
    }
    case 'FillInBlank':
      draft.blankText = payload['text'] as string;
      draft.blanks = [...(answerKey['blanks'] as string[])];
      break;
    case 'NumericTolerance':
      draft.numericQuestion = payload['question'] as string;
      draft.expected = answerKey['expected'] as number;
      draft.tolerance = answerKey['tolerance'] as number;
      break;
    case 'ShortText':
      draft.shortTextQuestion = payload['question'] as string;
      draft.acceptedAnswers = [...(answerKey['acceptedAnswers'] as string[])];
      break;
    case 'DragAndDrop': {
      draft.dragItems = [...(payload['items'] as string[])];
      draft.categories = [...(payload['categories'] as string[])];
      const assignments = answerKey['assignments'] as [number, number][];
      draft.categoryByItem = draft.dragItems.map(
        (_, index) => assignments.find(([item]) => item === index)?.[1] ?? null,
      );
      break;
    }
  }

  return draft;
}

// Клиентская проверка «на глаз» перед отправкой — та же форма, что бэкенд
// требует жёстко (QuestionValidationService), но с сообщением сразу под
// вопросом вместо круга запрос-ошибка-правка.
export function validateQuestionDraft(draft: QuestionDraft, index: number): string | null {
  const prefix = `Вопрос ${index + 1}`;
  const nonEmpty = (values: readonly string[]) => values.every((v) => v.trim().length > 0);

  switch (draft.type) {
    case 'SingleChoice':
      if (draft.options.length < 2 || !nonEmpty(draft.options)) {
        return `${prefix}: нужно минимум два непустых варианта.`;
      }
      return null;
    case 'MultipleChoice':
      if (draft.options.length < 2 || !nonEmpty(draft.options)) {
        return `${prefix}: нужно минимум два непустых варианта.`;
      }
      if (draft.correctIndices.length === 0) {
        return `${prefix}: отметьте хотя бы один правильный вариант.`;
      }
      return null;
    case 'Matching':
      if (draft.left.length < 2 || !nonEmpty(draft.left) || draft.right.length < 2 || !nonEmpty(draft.right)) {
        return `${prefix}: нужно минимум по два непустых элемента в каждой колонке.`;
      }
      if (draft.rightByLeft.some((value) => value === null)) {
        return `${prefix}: свяжите каждый элемент левой колонки с элементом правой.`;
      }
      if (new Set(draft.rightByLeft).size !== draft.rightByLeft.length) {
        return `${prefix}: один элемент правой колонки нельзя использовать дважды.`;
      }
      return null;
    case 'Ordering':
      if (draft.orderItems.length < 2 || !nonEmpty(draft.orderItems)) {
        return `${prefix}: нужно минимум два непустых элемента в правильном порядке.`;
      }
      return null;
    case 'FillInBlank':
      if (draft.blankText.trim().length === 0) {
        return `${prefix}: текст с пропуском обязателен.`;
      }
      if (draft.blanks.length === 0 || !nonEmpty(draft.blanks)) {
        return `${prefix}: укажите эталонный ответ для каждого пропуска.`;
      }
      return null;
    case 'NumericTolerance':
      if (draft.numericQuestion.trim().length === 0) {
        return `${prefix}: текст вопроса обязателен.`;
      }
      if (draft.tolerance < 0) {
        return `${prefix}: допуск не может быть отрицательным.`;
      }
      return null;
    case 'ShortText':
      if (draft.shortTextQuestion.trim().length === 0) {
        return `${prefix}: текст вопроса обязателен.`;
      }
      if (draft.acceptedAnswers.length === 0 || !nonEmpty(draft.acceptedAnswers)) {
        return `${prefix}: укажите хотя бы один эталонный ответ.`;
      }
      return null;
    case 'DragAndDrop':
      if (draft.dragItems.length === 0 || !nonEmpty(draft.dragItems)) {
        return `${prefix}: нужен хотя бы один непустой элемент.`;
      }
      if (draft.categories.length < 2 || !nonEmpty(draft.categories)) {
        return `${prefix}: нужно минимум две непустые категории.`;
      }
      if (draft.categoryByItem.some((value) => value === null)) {
        return `${prefix}: отнесите каждый элемент к категории.`;
      }
      return null;
  }
}
