import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@front/core';

// Заглушка для /platform/content/matrix и /platform/content/pisa — экраны
// авторинга (план 09 §4.4-4.5, F3/F4) вне объёма этой итерации фронтенда.
// Название раздела приходит из route data (titleKey), чтобы не плодить два
// одинаковых компонента.
@Component({
  selector: 'app-coming-soon-page',
  imports: [RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './coming-soon.page.html',
  styleUrl: '../status.page.scss',
})
export class ComingSoonPage {
  protected readonly titleKey = inject(ActivatedRoute).snapshot.data['titleKey'] as string;
}
