import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { CraftStatusBadge, CraftStatusLevel } from '@front/ui';

interface StudentRow {
  name: string;
  grade: string;
  topic: string;
  progress: number;
  status: CraftStatusLevel;
  note: string;
}

type FilterValue = 'all' | CraftStatusLevel;

const STATUS_LABEL: Record<CraftStatusLevel, string> = {
  high: $localize`:@@desk.status.high:В темпе`,
  mid: $localize`:@@desk.status.mid:Замедление`,
  low: $localize`:@@desk.status.low:Нужна помощь`,
};

// Демо-данные дашборда учителя — маркетинговая витрина возможностей MATRIX,
// не настоящий кабинет (план 04-landing-migration.md, §3, шаг 3 — перенесено
// из eighth-version/js/page-home.js). Каждая переводимая строка помечена
// $localize прямо в TS: значения — данные, а не разметка шаблона, поэтому
// атрибут `i18n` тут не подходит (план предполагает компиляцию на этапе
// сборки — см. 04-landing-migration.md, §2.1).
const STUDENTS: StudentRow[] = [
  {
    name: $localize`:@@desk.student1.name:Айсулу Қасымова`,
    grade: '7 «А»',
    topic: $localize`:@@desk.student1.topic:Архитектура LLM · Симулятор`,
    progress: 96,
    status: 'high',
    note: $localize`:@@desk.student1.note:Опережает темп на 2 шага`,
  },
  {
    name: $localize`:@@desk.student2.name:Данияр Төлеген`,
    grade: '7 «А»',
    topic: $localize`:@@desk.student2.topic:Промпт-инжиниринг · Шаг 4`,
    progress: 88,
    status: 'high',
    note: $localize`:@@desk.student2.note:Самостоятельное решение`,
  },
  {
    name: $localize`:@@desk.student3.name:Мадина Сапар`,
    grade: '7 «А»',
    topic: $localize`:@@desk.student3.topic:Вайб-кодинг веб-страницы`,
    progress: 74,
    status: 'high',
    note: $localize`:@@desk.student3.note:В пределах нормы`,
  },
  {
    name: $localize`:@@desk.student4.name:Ерлан Бақыт`,
    grade: '7 «А»',
    topic: $localize`:@@desk.student4.topic:Распознавание фейков PISA`,
    progress: 58,
    status: 'mid',
    note: $localize`:@@desk.student4.note:Задержка на шаге 3 (валидация)`,
  },
  {
    name: $localize`:@@desk.student5.name:Алина Жұмабек`,
    grade: '7 «А»',
    topic: $localize`:@@desk.student5.topic:Декомпозиция задач ИИ`,
    progress: 49,
    status: 'mid',
    note: $localize`:@@desk.student5.note:Требуется уточнение критерия`,
  },
  {
    name: $localize`:@@desk.student6.name:Тимур Ахметов`,
    grade: '7 «А»',
    topic: $localize`:@@desk.student6.topic:Синтаксис системного промпта`,
    progress: 32,
    status: 'low',
    note: $localize`:@@desk.student6.note:3 ошибки подряд в симуляторе`,
  },
  {
    name: $localize`:@@desk.student7.name:Асель Мұрат`,
    grade: '7 «А»',
    topic: $localize`:@@desk.student7.topic:Автономные ИИ-агенты`,
    progress: 92,
    status: 'high',
    note: $localize`:@@desk.student7.note:Высокая точность ответов`,
  },
  {
    name: $localize`:@@desk.student8.name:Санжар Омар`,
    grade: '7 «А»',
    topic: $localize`:@@desk.student8.topic:Анализ галлюцинаций модели`,
    progress: 24,
    status: 'low',
    note: $localize`:@@desk.student8.note:Застрял на фактчекинге датасета`,
  },
];

@Component({
  selector: 'app-desk-preview',
  imports: [CraftStatusBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './desk-preview.html',
  styleUrl: './desk-preview.scss',
})
export class DeskPreview {
  protected readonly filter = signal<FilterValue>('all');
  protected readonly query = signal('');
  protected readonly statusLabel = STATUS_LABEL;

  protected readonly rows = computed(() => {
    const filter = this.filter();
    const query = this.query().trim().toLowerCase();
    return STUDENTS.filter((student) => {
      if (filter !== 'all' && student.status !== filter) return false;
      if (query && !student.name.toLowerCase().includes(query)) return false;
      return true;
    });
  });

  protected setFilter(value: FilterValue): void {
    this.filter.set(value);
  }

  protected onSearch(value: string): void {
    this.query.set(value);
  }

  protected meterColorVar(status: CraftStatusLevel): string {
    return `var(--lvl-${status}-ink)`;
  }
}
