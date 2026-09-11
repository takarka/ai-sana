import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

// Постраничность списков (F2.1 — школы, дальше переиспользуется классами/
// пользователями). Компонент не хранит состояние страницы — только показывает
// диапазон и просит родителя сменить page через output.
@Component({
  selector: 'craft-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pagination.html',
  styleUrl: './pagination.scss',
  host: {
    class: 'craft-pagination-host',
  },
})
export class CraftPagination {
  readonly page = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly totalCount = input.required<number>();
  readonly pageChange = output<number>();

  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize())));
  protected readonly rangeStart = computed(() =>
    this.totalCount() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1,
  );
  protected readonly rangeEnd = computed(() => Math.min(this.page() * this.pageSize(), this.totalCount()));

  protected goTo(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.page()) return;
    this.pageChange.emit(page);
  }
}
