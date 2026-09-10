import { TestBed } from '@angular/core/testing';
import { CraftButton } from './button';

describe('CraftButton', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CraftButton],
    }).compileComponents();
  });

  it('renders a native button with the primary variant by default', () => {
    const fixture = TestBed.createComponent(CraftButton);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button.classList).toContain('craft-btn--primary');
  });

  it('applies the ghost variant', () => {
    const fixture = TestBed.createComponent(CraftButton);
    fixture.componentRef.setInput('variant', 'ghost');
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button.classList).toContain('craft-btn--ghost');
  });

  it('disables the native button', () => {
    const fixture = TestBed.createComponent(CraftButton);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');
    expect(button.disabled).toBe(true);
  });
});
