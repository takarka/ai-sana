import { TestBed } from '@angular/core/testing';
import { DeskPreview } from './desk-preview';

describe('DeskPreview', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeskPreview],
    }).compileComponents();
  });

  it('shows all students by default', () => {
    const fixture = TestBed.createComponent(DeskPreview);
    fixture.detectChanges();
    expect(fixture.componentInstance['rows']().length).toBe(8);
  });

  it('filters by status', () => {
    const fixture = TestBed.createComponent(DeskPreview);
    fixture.detectChanges();
    fixture.componentInstance['setFilter']('low');
    const rows = fixture.componentInstance['rows']();
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.status === 'low')).toBe(true);
  });

  it('filters by search query, case-insensitively', () => {
    const fixture = TestBed.createComponent(DeskPreview);
    fixture.detectChanges();
    fixture.componentInstance['onSearch']('данияр');
    expect(fixture.componentInstance['rows']().length).toBe(1);
  });

  it('shows the empty state when nothing matches', () => {
    const fixture = TestBed.createComponent(DeskPreview);
    fixture.detectChanges();
    fixture.componentInstance['onSearch']('нет такого ученика');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('не найдены');
  });
});
