import type { Preview, Decorator } from '@storybook/angular';
// Глобальные стили (Tailwind + токены) подключены через builder-опцию
// `styles` в project.json (build-storybook/storybook targets), а не здесь —
// тот же механизм, что и в apps/craft-web/project.json.

// Три сценария из плана (03-design-system.md, §5.3): плотность, поверхность
// (paper/ink), модульная тема — переключаются тулбаром, а не пересборкой.
// Оборачиваем шаблон истории в контейнер с [data-*], от которого токены
// каскадируются вниз (тот же контракт, что и в приложении).
const withDesignSystemContext: Decorator = (story, context) => {
  const rendered = story();
  const module = context.globals['module'];
  return {
    ...rendered,
    template: `<div [attr.data-density]="__density" [attr.data-surface]="__surface" [attr.data-module]="__module" style="display:block;padding:2.4rem;background:var(--bg);color:var(--fg)">${rendered.template ?? ''}</div>`,
    props: {
      ...rendered.props,
      __density: context.globals['density'],
      __surface: context.globals['surface'],
      __module: module === 'none' ? null : module,
    },
  };
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'error',
    },
  },
  globalTypes: {
    density: {
      description: 'Плотность интерфейса',
      defaultValue: 'comfortable',
      toolbar: {
        title: 'Density',
        icon: 'ruler',
        items: [
          { value: 'comfortable', title: 'Comfortable' },
          { value: 'compact', title: 'Compact' },
          { value: 'junior', title: 'Junior (1–4 класс)' },
        ],
      },
    },
    surface: {
      description: 'Поверхность',
      defaultValue: 'paper',
      toolbar: {
        title: 'Surface',
        icon: 'contrast',
        items: [
          { value: 'paper', title: 'Paper (светлая)' },
          { value: 'ink', title: 'Ink (тёмная, дашборд)' },
        ],
      },
    },
    module: {
      description: 'Модульная тема',
      defaultValue: 'none',
      toolbar: {
        title: 'Module',
        icon: 'component',
        items: [
          { value: 'none', title: 'CRAFT AI (ядро)' },
          { value: 'matrix', title: 'MATRIX' },
          { value: 'builder', title: 'BUILDER' },
          { value: 'pisa', title: 'PISA' },
        ],
      },
    },
    locale: {
      description: 'Язык контента',
      defaultValue: 'ru',
      toolbar: {
        title: 'Locale',
        icon: 'globe',
        items: [
          { value: 'ru', title: 'Русский' },
          { value: 'kz', title: 'Қазақша' },
        ],
      },
    },
  },
  decorators: [withDesignSystemContext],
};

export default preview;
