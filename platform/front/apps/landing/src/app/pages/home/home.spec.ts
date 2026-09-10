import { Dialog } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Home } from './home';

describe('Home', () => {
  let openSpy: jest.Mock;

  beforeEach(async () => {
    openSpy = jest.fn();
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([]), { provide: Dialog, useValue: { open: openSpy } }],
    }).compileComponents();
  });

  it('renders all seven sections', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const sections = fixture.nativeElement.querySelectorAll('section');
    expect(sections.length).toBe(7);
  });

  it('opens the demo dialog from the hero CTA', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    fixture.componentInstance['openDemo']();
    expect(openSpy).toHaveBeenCalled();
  });

  it('passes five FAQ entries to the accordion', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    expect(fixture.componentInstance.faqEntries.length).toBe(5);
  });
});
