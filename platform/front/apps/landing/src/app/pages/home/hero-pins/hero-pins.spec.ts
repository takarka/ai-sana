import { TestBed } from '@angular/core/testing';
import { HeroPins } from './hero-pins';

describe('HeroPins', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HeroPins] }).compileComponents();
  });

  it('renders a pin per module with its label', () => {
    const fixture = TestBed.createComponent(HeroPins);
    fixture.detectChanges();
    const pins: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.pin'));
    expect(pins.length).toBe(3);
    expect(pins.map((pin) => pin.textContent?.trim())).toEqual([
      '01 MATRIX · 1–11 классы ГОСО',
      '02 BUILDER · Вайб-кодинг & ИИ',
      '03 PISA · Тренажёры 2029',
    ]);
  });

  // Пины держатся на проекции точек сцены: без неё (reduced-motion, нет WebGL)
  // они должны просто остаться невидимыми, а не висеть посреди героя.
  it('keeps pins hidden while no scene is running', () => {
    const fixture = TestBed.createComponent(HeroPins);
    fixture.detectChanges();
    const pins: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.pin'));
    expect(pins.every((pin) => !pin.classList.contains('is-on'))).toBe(true);
  });
});
