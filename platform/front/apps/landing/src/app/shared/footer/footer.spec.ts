import { Dialog } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Footer } from './footer';

describe('Footer', () => {
  it('opens the demo dialog from the contacts CTA', () => {
    const openSpy = jest.fn();
    TestBed.configureTestingModule({
      imports: [Footer],
      providers: [provideRouter([]), { provide: Dialog, useValue: { open: openSpy } }],
    });
    const fixture = TestBed.createComponent(Footer);
    fixture.detectChanges();
    fixture.componentInstance['openDemo']();
    expect(openSpy).toHaveBeenCalled();
  });
});
