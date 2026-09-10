import { TestBed } from '@angular/core/testing';
import { CraftStatusBadge } from './status-badge';

describe('CraftStatusBadge', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CraftStatusBadge],
    }).compileComponents();
  });

  it('always renders the text label, not just a colored dot', () => {
    const fixture = TestBed.createComponent(CraftStatusBadge);
    fixture.componentRef.setInput('level', 'high');
    fixture.componentRef.setInput('label', 'Готов');
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector(
      '.craft-status-badge__label'
    );
    expect(label.textContent.trim()).toBe('Готов');
  });

  it('renders a distinct icon per level, not only color', () => {
    const levels: Array<'high' | 'mid' | 'low'> = ['high', 'mid', 'low'];
    const paths = levels.map((level) => {
      const fixture = TestBed.createComponent(CraftStatusBadge);
      fixture.componentRef.setInput('level', level);
      fixture.componentRef.setInput('label', level);
      fixture.detectChanges();
      return fixture.nativeElement
        .querySelector('path')
        .getAttribute('d');
    });
    expect(new Set(paths).size).toBe(levels.length);
  });
});
