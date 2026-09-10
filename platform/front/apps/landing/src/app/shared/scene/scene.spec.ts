import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Scene } from './scene';
import { SceneHost } from './scene-host';

describe('Scene', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Scene],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders a canvas hidden from assistive tech', () => {
    const fixture = TestBed.createComponent(Scene);
    fixture.detectChanges();
    const canvas: HTMLCanvasElement = fixture.nativeElement.querySelector('canvas#scene');
    expect(canvas).toBeTruthy();
    expect(canvas.getAttribute('aria-hidden')).toBe('true');
  });

  // В jsdom нет WebGL — это ровно та ветка, что защищает и SSR, и браузеры без
  // поддержки: компонент обязан отрисоваться и не поднять сцену.
  it('does not boot a scene where WebGL is unavailable', () => {
    const fixture = TestBed.createComponent(Scene);
    fixture.detectChanges();
    expect(TestBed.inject(SceneHost).scene()).toBeNull();
  });
});
