import { Dialog } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { Builder } from './builder';

describe('Builder', () => {
  let openSpy: jest.Mock;

  beforeEach(async () => {
    openSpy = jest.fn();
    await TestBed.configureTestingModule({
      imports: [Builder],
      providers: [{ provide: Dialog, useValue: { open: openSpy } }],
    }).compileComponents();
  });

  it('starts with a low score and no chips active', () => {
    const fixture = TestBed.createComponent(Builder);
    fixture.detectChanges();
    const instance = fixture.componentInstance;
    expect(instance['score']()).toBe(25);
    expect(instance['scoreLevel']()).toBe('low');
  });

  it('raises the score as quality chips are toggled on', () => {
    const fixture = TestBed.createComponent(Builder);
    fixture.detectChanges();
    const instance = fixture.componentInstance;
    instance['toggleChip']('role');
    instance['toggleChip']('format');
    instance['toggleChip']('cases');
    expect(instance['score']()).toBe(100);
    expect(instance['scoreLevel']()).toBe('high');
  });

  it('lowers the score when the noise chip is on', () => {
    const fixture = TestBed.createComponent(Builder);
    fixture.detectChanges();
    const instance = fixture.componentInstance;
    instance['toggleChip']('role');
    instance['toggleChip']('format');
    instance['toggleChip']('cases');
    instance['toggleChip']('noise');
    expect(instance['score']()).toBe(85);
  });

  it('appends the fragment for each active chip to the prompt, in order', () => {
    const fixture = TestBed.createComponent(Builder);
    fixture.detectChanges();
    const instance = fixture.componentInstance;
    instance['toggleChip']('cases');
    const prompt = instance['prompt']();
    expect(prompt.startsWith('Сделай сайт для школьного научного проекта.')).toBe(true);
    expect(prompt).toContain('Краевые сценарии');
  });

  it('toggling a chip twice returns to inactive', () => {
    const fixture = TestBed.createComponent(Builder);
    fixture.detectChanges();
    const instance = fixture.componentInstance;
    instance['toggleChip']('role');
    instance['toggleChip']('role');
    expect(instance['isActive']('role')).toBe(false);
  });

  it('opens the demo dialog', () => {
    const fixture = TestBed.createComponent(Builder);
    fixture.detectChanges();
    fixture.componentInstance['openDemo']();
    expect(openSpy).toHaveBeenCalled();
  });
});
