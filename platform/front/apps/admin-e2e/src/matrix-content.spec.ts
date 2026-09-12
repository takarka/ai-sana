import { expect, test } from '@playwright/test';

// Полный путь методиста по банку уроков MATRIX (план 09 §4.4, F3.1-F3.5,
// расширено покрытием редактирования/удаления/порядка шагов и предпросмотра):
// создать раздел → урок → материалы → задание → отредактировать шаг →
// переставить порядок → удалить шаг → посмотреть предпросмотр глазами ученика.
// Один длинный сценарий вместо изолированных тестов на каждый шаг — стадии
// зависят друг от друга (шаг 2 требует созданный на шаге 1 урок), а
// test.step() группирует их в отчёте Playwright.
test('методист ведёт урок MATRIX от создания раздела до предпросмотра', async ({ page }) => {
  const stamp = Date.now();
  const sectionName = `E2E раздел ${stamp}`;
  const lessonTitle = `E2E урок ${stamp}`;
  const initialMaterial = `Материал ${stamp}`;
  const updatedMaterial = `Материал ${stamp} (обновлён)`;

  await test.step('создать раздел', async () => {
    await page.goto('/platform/content/matrix');
    await page.getByRole('button', { name: 'Создать раздел' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Название раздела').fill(sectionName);
    await dialog.getByRole('button', { name: 'Создать раздел' }).click();
    await expect(dialog).toBeHidden();

    await expect(page.getByText(sectionName)).toBeVisible();
  });

  await test.step('добавить урок в раздел', async () => {
    const section = page.locator('.app-matrix__section', { hasText: sectionName });
    await section.getByRole('button', { name: 'Добавить урок' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Название урока').fill(lessonTitle);
    await dialog.getByRole('button', { name: 'Добавить урок' }).click();
    await expect(dialog).toBeHidden();

    await page.locator('.app-matrix__row', { hasText: lessonTitle }).click();
    await page.waitForURL(/\/platform\/content\/matrix\/lessons\/[^/]+$/);
  });

  await test.step('добавить материал и задание', async () => {
    const materialsSection = page.locator('.app-lesson-editor__section', { hasText: 'Добавить материалы' });
    await materialsSection.getByPlaceholder('Текст материала').fill(initialMaterial);
    await materialsSection.getByRole('button', { name: 'Сохранить материалы' }).click();

    const taskSection = page.locator('.app-lesson-editor__section', { hasText: 'Добавить задание' });
    await taskSection.getByPlaceholder('Вариант 1').fill('2');
    await taskSection.getByPlaceholder('Вариант 2').fill('4');
    await taskSection.getByRole('button', { name: 'Сохранить задание' }).click();

    const steps = page.locator('.app-lesson-editor__step');
    await expect(steps).toHaveCount(2);
    await expect(steps.nth(0)).toContainText(initialMaterial);
    await expect(steps.nth(1)).toContainText('2 · 4');
  });

  await test.step('отредактировать материал уже сохранённого шага', async () => {
    const theoryStep = page.locator('.app-lesson-editor__step').nth(0);
    await theoryStep.getByRole('button', { name: 'Изменить' }).click();
    await theoryStep.getByPlaceholder('Текст материала').fill(updatedMaterial);
    await theoryStep.getByRole('button', { name: 'Сохранить' }).click();

    await expect(theoryStep.getByRole('button', { name: 'Изменить' })).toBeVisible();
    await expect(theoryStep).toContainText(updatedMaterial);
    await expect(theoryStep).not.toContainText(initialMaterial);
  });

  await test.step('переставить порядок шагов', async () => {
    const badges = page.locator('.app-lesson-editor__step-badge');
    await expect(badges.nth(0)).toHaveText('Материалы');
    await expect(badges.nth(1)).toHaveText('Задание');

    await page.locator('.app-lesson-editor__step').nth(1).getByRole('button', { name: 'Переместить выше' }).click();

    await expect(badges.nth(0)).toHaveText('Задание');
    await expect(badges.nth(1)).toHaveText('Материалы');
  });

  await test.step('удалить шаг', async () => {
    page.once('dialog', (dialog) => dialog.accept());
    // После перестановки материалы — второй шаг (index 1).
    await page.locator('.app-lesson-editor__step').nth(1).getByRole('button', { name: 'Удалить' }).click();

    const steps = page.locator('.app-lesson-editor__step');
    await expect(steps).toHaveCount(1);
    await expect(page.locator('.app-lesson-editor__step-badge')).toHaveText('Задание');
  });

  await test.step('предпросмотр глазами ученика не выдаёт эталон', async () => {
    await page.getByRole('button', { name: 'Предпросмотр' }).click();
    await page.waitForURL(/\/platform\/content\/matrix\/lessons\/[^/]+\/preview$/);

    await expect(page.getByText(lessonTitle)).toBeVisible();

    const preview = page.locator('craft-question-preview');
    await expect(preview.locator('input[type="radio"]')).toHaveCount(2);
    await expect(preview).toContainText('2');
    await expect(preview).toContainText('4');
    // Радиокнопки предпросмотра не отмечены — эталонный ответ не раскрывается.
    for (const radio of await preview.locator('input[type="radio"]').all()) {
      await expect(radio).not.toBeChecked();
    }

    await page.getByRole('button', { name: 'Назад к редактированию' }).click();
    await page.waitForURL(/\/platform\/content\/matrix\/lessons\/[^/]+$/);
  });

  await test.step('урок остаётся в списке разделов', async () => {
    await page.getByRole('link', { name: 'Разделы и уроки' }).click();
    await page.waitForURL('**/platform/content/matrix');
    await expect(page.locator('.app-matrix__row', { hasText: lessonTitle })).toBeVisible();
  });
});
