import { TestBed } from '@angular/core/testing';
import { CraftDataTable, CraftTableColumn } from './data-table';

interface Row {
  name: string;
  score: number;
}

describe('CraftDataTable', () => {
  const columns: CraftTableColumn<Row>[] = [
    { key: 'name', label: 'Имя' },
    { key: 'score', label: 'Балл', sortable: true },
  ];
  const rows: Row[] = [
    { name: 'Аружан', score: 72 },
    { name: 'Данияр', score: 91 },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CraftDataTable],
    }).compileComponents();
  });

  it('renders one row per data item', () => {
    const fixture = TestBed.createComponent(CraftDataTable<Row>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('rows', rows);
    fixture.detectChanges();
    const dataRows = fixture.nativeElement.querySelectorAll(
      'tbody tr, tr[cdk-row]'
    );
    expect(dataRows.length).toBe(rows.length);
  });

  it('shows the empty label when there are no rows', () => {
    const fixture = TestBed.createComponent(CraftDataTable<Row>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('rows', []);
    fixture.componentRef.setInput('emptyLabel', 'Пусто');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Пусто');
  });

  it('emits sortChange and toggles aria-sort on the sortable column', () => {
    const fixture = TestBed.createComponent(CraftDataTable<Row>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('rows', rows);
    fixture.detectChanges();

    const emitted: unknown[] = [];
    fixture.componentInstance.sortChange.subscribe((event) =>
      emitted.push(event)
    );

    const sortButton: HTMLButtonElement = Array.from(
      fixture.nativeElement.querySelectorAll('button.craft-table__sort')
    ).find((button) =>
      (button as HTMLButtonElement).textContent?.includes('Балл')
    ) as HTMLButtonElement;
    sortButton.click();
    fixture.detectChanges();

    expect(emitted).toEqual([{ key: 'score', direction: 'asc' }]);
    const header = sortButton.closest('th');
    expect(header?.getAttribute('aria-sort')).toBe('ascending');
  });
});
