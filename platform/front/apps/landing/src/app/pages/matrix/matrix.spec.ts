import { Dialog } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { Matrix } from './matrix';

describe('Matrix', () => {
  let openSpy: jest.Mock;

  beforeEach(async () => {
    openSpy = jest.fn();
    await TestBed.configureTestingModule({
      imports: [Matrix],
      providers: [{ provide: Dialog, useValue: { open: openSpy } }],
    }).compileComponents();
  });

  it('starts on the first step', () => {
    const fixture = TestBed.createComponent(Matrix);
    fixture.detectChanges();
    expect(fixture.componentInstance['activeStep']()).toBe(0);
  });

  it('switches step on click', () => {
    const fixture = TestBed.createComponent(Matrix);
    fixture.detectChanges();
    fixture.componentInstance['setStep'](2);
    fixture.detectChanges();
    expect(fixture.componentInstance['activeStep']()).toBe(2);
    const panes = fixture.nativeElement.querySelectorAll('.how__pane');
    expect(panes[2].classList).toContain('is-on');
    expect(panes[0].classList).not.toContain('is-on');
  });

  it('opens the demo dialog', () => {
    const fixture = TestBed.createComponent(Matrix);
    fixture.detectChanges();
    fixture.componentInstance['openDemo']();
    expect(openSpy).toHaveBeenCalled();
  });
});
