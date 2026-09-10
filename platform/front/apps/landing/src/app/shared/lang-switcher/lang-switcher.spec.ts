import { computeLangLinks } from './lang-switcher';

describe('computeLangLinks', () => {
  it('marks ru active and links to the kk equivalent path', () => {
    expect(computeLangLinks('/ru/')).toEqual({
      isRu: true,
      ruHref: '/ru/',
      kkHref: '/kk/',
    });
  });

  it('marks kk active and links to the ru equivalent path', () => {
    expect(computeLangLinks('/kk/')).toEqual({
      isRu: false,
      ruHref: '/ru/',
      kkHref: '/kk/',
    });
  });

  it('preserves the rest of the path when swapping locale', () => {
    expect(computeLangLinks('/ru/matrix')).toEqual({
      isRu: true,
      ruHref: '/ru/matrix',
      kkHref: '/kk/matrix',
    });
  });
});
