import { Route } from '@angular/router';
import { Builder } from './pages/builder/builder';
import { Home } from './pages/home/home';
import { Matrix } from './pages/matrix/matrix';
import { Pisa } from './pages/pisa/pisa';

export const appRoutes: Route[] = [
  { path: '', component: Home },
  { path: 'matrix', component: Matrix },
  { path: 'builder', component: Builder },
  { path: 'pisa', component: Pisa },
];
