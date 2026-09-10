import type { Meta, StoryObj } from '@storybook/angular';
import { CraftDataTable, CraftTableColumn } from './data-table';

interface StudentRow {
  name: string;
  klass: string;
  score: number;
}

const ruColumns: CraftTableColumn<StudentRow>[] = [
  { key: 'name', label: 'Ученик', sortable: true },
  { key: 'klass', label: 'Класс' },
  { key: 'score', label: 'Балл', sortable: true },
];

const kzColumns: CraftTableColumn<StudentRow>[] = [
  { key: 'name', label: 'Оқушы', sortable: true },
  { key: 'klass', label: 'Сынып' },
  { key: 'score', label: 'Ұпай', sortable: true },
];

const rows: StudentRow[] = [
  { name: 'Аружан Séitkali', klass: '7Ә', score: 92 },
  { name: 'Данияр Ерланұлы', klass: '7Ә', score: 68 },
  { name: 'Мадина Қасымова', klass: '7Ә', score: 41 },
];

const meta: Meta<CraftDataTable<StudentRow>> = {
  title: 'Foundations/DataTable',
  component: CraftDataTable,
  args: {
    columns: ruColumns,
    rows,
  },
  parameters: {
    a11y: { test: 'error' },
  },
};

export default meta;
type Story = StoryObj<CraftDataTable<StudentRow>>;

export const Default: Story = {
  args: { columns: ruColumns, rows },
};

export const Kazakh: Story = {
  args: { columns: kzColumns, rows },
};

export const Empty: Story = {
  args: { columns: ruColumns, rows: [], emptyLabel: 'Нет данных по классу' },
};
