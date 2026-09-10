import { Route } from '@angular/router';
import { ComingSoon } from './pages/coming-soon/coming-soon';
import { Home } from './pages/home/home';

export const appRoutes: Route[] = [
  { path: '', component: Home },
  {
    path: 'matrix',
    component: ComingSoon,
    data: { title: $localize`:@@nav.matrix:CRAFT MATRIX` },
  },
  {
    path: 'builder',
    component: ComingSoon,
    data: { title: $localize`:@@nav.builder:CRAFT BUILDER` },
  },
  {
    path: 'pisa',
    component: ComingSoon,
    data: { title: $localize`:@@nav.pisa:CRAFT PISA` },
  },
];
