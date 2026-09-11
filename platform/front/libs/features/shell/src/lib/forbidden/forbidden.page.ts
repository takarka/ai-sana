import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@front/core';

// F0.6 — экран для маршрутов, закрытых политикой роли (roleGuard).
@Component({
  selector: 'app-forbidden-page',
  imports: [RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './forbidden.page.html',
  styleUrl: '../status.page.scss',
})
export class ForbiddenPage {}
