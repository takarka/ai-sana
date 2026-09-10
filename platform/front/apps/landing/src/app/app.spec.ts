import { Dialog } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), { provide: Dialog, useValue: { open: jest.fn() } }],
    }).compileComponents();
  });

  it('renders the header, main landmark and footer', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('header')).toBeTruthy();
    expect(compiled.querySelector('main#main')).toBeTruthy();
    expect(compiled.querySelector('footer')).toBeTruthy();
  });

  it('has a skip link pointing at the main landmark', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const skip: HTMLAnchorElement | null =
      fixture.nativeElement.querySelector('a.skip');
    expect(skip?.getAttribute('href')).toBe('#main');
  });
});
