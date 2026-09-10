import { ChangeDetectionStrategy, Component, input } from '@angular/core';

// Временная заглушка для /matrix, /builder, /pisa (план 04-landing-migration.md,
// шаг 3): маршруты существуют и работают в обеих локалях, чтобы навигация в
// шапке/футере не вела на 404, но контент этих трёх страниц ещё не перенесён
// из eighth-version — это отдельная задача после главной страницы.
@Component({
  selector: 'app-coming-soon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './coming-soon.html',
  styleUrl: './coming-soon.scss',
})
export class ComingSoon {
  readonly title = input.required<string>();
}
