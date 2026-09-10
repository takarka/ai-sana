import { afterNextRender, DestroyRef, Directive, ElementRef, inject } from '@angular/core';
import { prefersReducedMotion } from './reduced-motion';

// Перенос splitWords() из eighth-version/js/core.js: заголовок разбивается на
// слова, каждое едет вверх из-под маски со своей задержкой.
//
// Разбиение — правка DOM уже отрисованного заголовка, и это осознанно:
// внутри i18n-блока текст один цельный узел, обернуть слова в шаблоне нельзя,
// не разломав перевод на 20 отдельных строк. Делается один раз после
// гидратации (Angular к этим узлам больше не возвращается — в заголовках нет
// ни привязок, ни управляющих блоков).
//
// Заголовок до разбивки скрыт (`.js-split:not(.js-reveal)` в
// landing-layout.scss). Иначе видно мигание: SSR рисует обычный текст на
// ~200мс, потом гидратация разбивает его на слова, они прыгают под маску и
// только затем выезжают — замерено, разрыв около 150мс. В eighth-version
// этот момент прикрывал прелоадер, которого здесь нет. Текст при этом
// остаётся в разметке (SSR, поиск, копирование), скрыт только визуально;
// без JS его показывает <noscript> в index.html, при reduced-motion —
// media-блок в landing-layout.scss.
@Directive({
  selector: '[appSplitWords]',
  host: { class: 'js-split' },
})
export class SplitWords {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      const element = this.host.nativeElement;
      // При reduced-motion в оригинале splitWords() просто ничего не делал —
      // заголовок остаётся обычным текстом, анимировать нечего.
      if (prefersReducedMotion()) return;

      this.split(element);

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add('is-in');
            observer.unobserve(entry.target);
          }
        },
        { threshold: 0.12 }
      );
      observer.observe(element);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  private split(element: HTMLElement): void {
    const document = element.ownerDocument;
    const fragment = document.createDocumentFragment();
    let index = 0;

    const wrap = (word: HTMLElement) => {
      const mask = document.createElement('span');
      mask.className = 'word-mask';
      word.classList.add('word');
      word.style.setProperty('--d', `${(index++ * 0.045).toFixed(3)}s`);
      mask.appendChild(word);
      fragment.appendChild(mask);
    };

    for (const node of Array.from(element.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) {
        for (const text of (node.textContent || '').split(/\s+/)) {
          if (!text) continue;
          const word = document.createElement('span');
          word.textContent = text;
          wrap(word);
        }
      } else if (node instanceof HTMLBRElement) {
        // Перенос строки в заголовке — часть вёрстки, а не слово.
        fragment.appendChild(document.createElement('br'));
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Вложенный элемент (например <span class="hl">) едет как одно слово.
        wrap(node as HTMLElement);
      }
    }

    element.textContent = '';
    element.appendChild(fragment);
    element.classList.add('js-reveal');
  }
}
