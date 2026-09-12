import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ItemSummary, PisaApi, SearchItemsResponse, TranslatePipe } from '@front/core';
import { CraftButton, CraftEmptyState, CraftInput, CraftPagination } from '@front/ui';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { openPisaItemFormDialog } from '../dialogs/item-form/pisa-item-form.dialog';

const PAGE_SIZE = 20;
const LEVELS = [1, 2, 3, 4, 5, 6];
const GRADES = Array.from({ length: 11 }, (_, index) => index + 1);
const DIRECTIONS = ['Math', 'Science', 'Reading'] as const;

// «Банк заданий PISA» — план 09 §4.5, F4.1: поиск и фильтры по направлению,
// уровню и параллели (FR-PSA-01, 06). Рецензии нет (план 07 О2) — задание
// видно ученику сразу после сохранения, поэтому список не различает
// черновик/публикацию.
@Component({
  selector: 'app-pisa-item-bank-page',
  imports: [DialogModule, DatePipe, FormsModule, CraftInput, CraftButton, CraftPagination, CraftEmptyState, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pisa-item-bank.page.html',
  styleUrl: './pisa-item-bank.page.scss',
})
export class PisaItemBankPage implements OnDestroy {
  private readonly pisaApi = inject(PisaApi);
  private readonly dialog = inject(Dialog);

  protected readonly pageSize = PAGE_SIZE;
  protected readonly levels = LEVELS;
  protected readonly grades = GRADES;
  protected readonly directions = DIRECTIONS;

  protected readonly loading = signal(true);
  protected readonly search = signal('');
  protected readonly directionFilter = signal('');
  protected readonly levelFilter = signal(0);
  protected readonly gradeFilter = signal(0);
  protected readonly page = signal(1);
  protected readonly response = signal<SearchItemsResponse>({ items: [], totalCount: 0 });

  private readonly searchInput$ = new Subject<string>();

  constructor() {
    this.searchInput$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((search) => {
          this.search.set(search);
          this.page.set(1);
          this.loading.set(true);
          return this.pisaApi.searchItems(this.buildQuery());
        }),
      )
      .subscribe((response) => {
        this.response.set(response);
        this.loading.set(false);
      });

    this.fetch();
  }

  ngOnDestroy(): void {
    this.searchInput$.complete();
  }

  protected onSearchInput(value: string): void {
    this.searchInput$.next(value);
  }

  protected setDirectionFilter(direction: string): void {
    this.directionFilter.set(direction);
    this.page.set(1);
    this.fetch();
  }

  protected setLevelFilter(level: string): void {
    this.levelFilter.set(Number(level));
    this.page.set(1);
    this.fetch();
  }

  protected setGradeFilter(grade: string): void {
    this.gradeFilter.set(Number(grade));
    this.page.set(1);
    this.fetch();
  }

  protected onPageChange(page: number): void {
    this.page.set(page);
    this.fetch();
  }

  protected createItem(): void {
    openPisaItemFormDialog(this.dialog).closed.subscribe((created) => {
      if (created) this.fetch();
    });
  }

  protected editItem(item: ItemSummary): void {
    openPisaItemFormDialog(this.dialog, { itemId: item.id }).closed.subscribe((updated) => {
      if (updated) this.fetch();
    });
  }

  private buildQuery() {
    return {
      search: this.search(),
      direction: this.directionFilter() || undefined,
      level: this.levelFilter() || undefined,
      grade: this.gradeFilter() || undefined,
      page: this.page(),
      pageSize: PAGE_SIZE,
    };
  }

  private fetch(): void {
    this.loading.set(true);
    this.pisaApi.searchItems(this.buildQuery()).subscribe((response) => {
      this.response.set(response);
      this.loading.set(false);
    });
  }
}
