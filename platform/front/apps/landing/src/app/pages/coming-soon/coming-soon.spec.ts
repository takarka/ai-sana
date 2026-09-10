import { TestBed } from '@angular/core/testing';
import { ComingSoon } from './coming-soon';

describe('ComingSoon', () => {
  it('renders the given title', () => {
    TestBed.configureTestingModule({ imports: [ComingSoon] });
    const fixture = TestBed.createComponent(ComingSoon);
    fixture.componentRef.setInput('title', 'CRAFT MATRIX');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('CRAFT MATRIX');
  });
});
