import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@front/core';

// F0.6 — стоит вне гварда /platform: несуществующий адрес не должен требовать входа.
@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './not-found.page.html',
  styleUrl: '../status.page.scss',
})
export class NotFoundPage {}
