import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CraftButton } from '../button/button';
import { CraftStatusBadge } from '../status-badge/status-badge';
import { CraftDataTable, CraftTableColumn } from '../data-table/data-table';

interface Swatch {
  name: string;
  token: string;
}

interface StudentRow {
  name: string;
  klass: string;
  score: number;
}

// Демо-страница «все токены и компоненты» для приёмки (план
// 03-design-system.md, §6). Не публикуется в index.ts — только для Storybook:
// это не переиспользуемый UI-компонент, а витрина дизайн-системы.
@Component({
  selector: 'craft-overview',
  imports: [CraftButton, CraftStatusBadge, CraftDataTable],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './overview.html',
  styleUrl: './overview.scss',
})
export class CraftOverview {
  protected readonly brandSwatches: Swatch[] = [
    { name: 'brand', token: '--brand' },
    { name: 'signal', token: '--signal' },
  ];

  protected readonly moduleSwatches: Swatch[] = [
    { name: 'MATRIX', token: '--m-matrix' },
    { name: 'BUILDER', token: '--m-builder' },
    { name: 'PISA', token: '--m-pisa' },
  ];

  protected readonly statusSwatches: Swatch[] = [
    { name: 'high', token: '--lvl-high' },
    { name: 'mid', token: '--lvl-mid' },
    { name: 'low', token: '--lvl-low' },
  ];

  protected readonly columns: CraftTableColumn<StudentRow>[] = [
    { key: 'name', label: 'Ученик', sortable: true },
    { key: 'klass', label: 'Класс' },
    { key: 'score', label: 'Балл', sortable: true },
  ];

  protected readonly rows: StudentRow[] = [
    { name: 'Аружан Сейтқали', klass: '7Ә', score: 92 },
    { name: 'Данияр Ерланұлы', klass: '7Ә', score: 68 },
    { name: 'Мадина Қасымова', klass: '7Ә', score: 41 },
  ];
}
