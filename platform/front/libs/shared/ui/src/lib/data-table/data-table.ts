import { CdkTableModule } from '@angular/cdk/table';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

export interface CraftTableColumn<T extends object = Record<string, unknown>> {
  key: keyof T & string;
  label: string;
  sortable?: boolean;
}

export type CraftSortDirection = 'asc' | 'desc';

export interface CraftSortChange<T extends object = Record<string, unknown>> {
  key: keyof T & string;
  direction: CraftSortDirection;
}

// Своя реализация на CdkTable — не Angular Material: раскладка держится на
// токенах и плотности (план 03-design-system.md, §5.1), CDK даёт только
// поведение (динамические колонки, LiveAnnouncer для смены сортировки).
@Component({
  selector: 'craft-data-table',
  imports: [CdkTableModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './data-table.html',
  styleUrl: './data-table.scss',
  host: {
    class: 'craft-data-table-host',
  },
})
export class CraftDataTable<T extends object = Record<string, unknown>> {
  private readonly liveAnnouncer = inject(LiveAnnouncer);

  readonly columns = input.required<CraftTableColumn<T>[]>();
  readonly rows = input.required<T[]>();
  readonly emptyLabel = input('Нет данных');
  readonly sortChange = output<CraftSortChange<T>>();

  private readonly sortState = signal<CraftSortChange<T> | null>(null);

  protected readonly displayedColumns = computed(() =>
    this.columns().map((column) => column.key)
  );

  protected readonly sortedRows = computed(() => {
    const sort = this.sortState();
    const rows = this.rows();
    if (!sort) {
      return rows;
    }
    const direction = sort.direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const left = a[sort.key];
      const right = b[sort.key];
      if (typeof left === 'number' && typeof right === 'number') {
        return (left - right) * direction;
      }
      return String(left).localeCompare(String(right), 'ru') * direction;
    });
  });

  protected ariaSort(column: CraftTableColumn<T>): 'ascending' | 'descending' | 'none' {
    const sort = this.sortState();
    if (!column.sortable || !sort || sort.key !== column.key) {
      return 'none';
    }
    return sort.direction === 'asc' ? 'ascending' : 'descending';
  }

  protected onSort(column: CraftTableColumn<T>): void {
    if (!column.sortable) return;
    const current = this.sortState();
    const direction: CraftSortDirection =
      current?.key === column.key && current.direction === 'asc'
        ? 'desc'
        : 'asc';
    const next: CraftSortChange<T> = { key: column.key, direction };
    this.sortState.set(next);
    this.sortChange.emit(next);
    this.liveAnnouncer.announce(
      `Отсортировано по «${column.label}», ${direction === 'asc' ? 'по возрастанию' : 'по убыванию'}`
    );
  }
}
