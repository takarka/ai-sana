import { Dialog } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Header } from './header';

describe('Header', () => {
  let openSpy: jest.Mock;

  beforeEach(async () => {
    openSpy = jest.fn();
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([]), { provide: Dialog, useValue: { open: openSpy } }],
    }).compileComponents();
  });

  it('toggles the mobile nav open state', () => {
    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
    const instance = fixture.componentInstance;
    expect(instance['navOpen']()).toBe(false);
    instance['toggleNav']();
    expect(instance['navOpen']()).toBe(true);
    instance['closeNav']();
    expect(instance['navOpen']()).toBe(false);
  });

  it('opens the demo dialog on CTA click', () => {
    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
    fixture.componentInstance['openDemo']();
    expect(openSpy).toHaveBeenCalled();
  });
});
