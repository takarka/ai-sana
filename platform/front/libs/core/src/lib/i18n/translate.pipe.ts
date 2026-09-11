import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from './i18n.service';

// Линт запрещает $localize/i18n-атрибуты в apps/admin (ADR-0004) — перевод
// в шаблонах только через этот пайп. impure: язык меняется сигналом
// I18nService, а не Input'ом этого пайпа, поэтому pure-мемоизация Angular
// его не подхватит.
@Pipe({
  name: 'translate',
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(key: string, params?: Readonly<Record<string, string | number>>): string {
    return this.i18n.translate(key, params);
  }
}
