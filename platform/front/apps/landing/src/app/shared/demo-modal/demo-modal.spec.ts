import { DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { DemoModal } from './demo-modal';

describe('DemoModal', () => {
  let closeSpy: jest.Mock;

  beforeEach(async () => {
    closeSpy = jest.fn();
    await TestBed.configureTestingModule({
      imports: [DemoModal],
      providers: [{ provide: DialogRef, useValue: { close: closeSpy } }],
    }).compileComponents();
  });

  it('does not submit an invalid form', () => {
    const fixture = TestBed.createComponent(DemoModal);
    fixture.detectChanges();
    fixture.componentInstance['onSubmit']();
    expect(fixture.componentInstance['submitted']()).toBe(false);
  });

  it('accepts a valid form and shows the confirmation', () => {
    const fixture = TestBed.createComponent(DemoModal);
    const instance = fixture.componentInstance;
    instance['form'].setValue({
      name: 'Айгуль Сериковна',
      organization: 'Школа №25',
      email: 'school25@example.kz',
      phone: '+7 700 000 00 00',
      website: '',
    });
    instance['onSubmit']();
    expect(instance['submitted']()).toBe(true);
  });

  it('silently accepts (without a real submission signal) when the honeypot is filled', () => {
    const fixture = TestBed.createComponent(DemoModal);
    const instance = fixture.componentInstance;
    instance['form'].setValue({
      name: 'Bot',
      organization: 'Bot',
      email: 'bot@example.com',
      phone: '000',
      website: 'https://spam.example',
    });
    instance['onSubmit']();
    expect(instance['submitted']()).toBe(true);
  });

  it('closes via the dialog ref', () => {
    const fixture = TestBed.createComponent(DemoModal);
    fixture.componentInstance['close']();
    expect(closeSpy).toHaveBeenCalled();
  });
});
