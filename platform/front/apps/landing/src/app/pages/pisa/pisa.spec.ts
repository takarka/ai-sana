import { Dialog } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { Pisa } from './pisa';

describe('Pisa', () => {
  let openSpy: jest.Mock;

  beforeEach(async () => {
    openSpy = jest.fn();
    await TestBed.configureTestingModule({
      imports: [Pisa],
      providers: [{ provide: Dialog, useValue: { open: openSpy } }],
    }).compileComponents();
  });

  it('plots one chart point per data value, ordered left to right', () => {
    const fixture = TestBed.createComponent(Pisa);
    fixture.detectChanges();
    const points = fixture.componentInstance['points'];
    expect(points.map((p: { value: number }) => p.value)).toEqual([48, 59, 68, 79, 88]);
    for (let i = 1; i < points.length; i++) {
      expect(points[i].x).toBeGreaterThan(points[i - 1].x);
    }
    for (let i = 1; i < points.length; i++) {
      expect(points[i].y).toBeLessThan(points[i - 1].y);
    }
  });

  it('builds a path starting at the first point with one cubic segment per remaining point', () => {
    const fixture = TestBed.createComponent(Pisa);
    fixture.detectChanges();
    const instance = fixture.componentInstance;
    const points = instance['points'];
    expect(instance['linePath'].startsWith(`M${points[0].x} ${points[0].y}`)).toBe(true);
    expect(instance['linePath'].match(/C/g)?.length).toBe(points.length - 1);
  });

  it('marks the last readiness item as not ready', () => {
    const fixture = TestBed.createComponent(Pisa);
    fixture.detectChanges();
    const readiness = fixture.componentInstance['readiness'];
    expect(readiness.at(-1).ready).toBe(false);
    expect(readiness.slice(0, -1).every((item: { ready: boolean }) => item.ready)).toBe(true);
  });

  it('opens the demo dialog', () => {
    const fixture = TestBed.createComponent(Pisa);
    fixture.detectChanges();
    fixture.componentInstance['openDemo']();
    expect(openSpy).toHaveBeenCalled();
  });
});
