import { expect, test } from '@playwright/test';

// Полный путь методиста по банку заданий PISA (план 09 §4.5, F4.1-F4.3,
// расширено предпросмотром, F4.4): создать составное задание → посмотреть
// предпросмотр глазами ученика → сохранить → найти в списке → отредактировать
// → убедиться, что изменение сохранилось.
test('методист создаёт составное задание PISA, видит предпросмотр и редактирует его', async ({ page }) => {
  const stamp = Date.now();
  const stimulus = `E2E стимул ${stamp}`;
  const cognitiveProcess = 'Интерпретация данных';
  const context = `E2E контекст ${stamp}`;
  const updatedContext = `E2E контекст ${stamp} (обновлён)`;

  await test.step('создать составное задание', async () => {
    await page.goto('/platform/content/pisa');
    await page.getByRole('button', { name: 'Создать задание' }).click();
    await page.waitForURL('**/platform/content/pisa/new');

    await page.getByPlaceholder('Текст, который увидит ученик перед вопросами').fill(stimulus);
    await page.getByLabel('Когнитивный процесс').fill(cognitiveProcess);
    await page.getByLabel('Контекст').fill(context);

    const questions = page.locator('.app-item-form__questions');
    await questions.getByPlaceholder('Вариант 1').fill('2');
    await questions.getByPlaceholder('Вариант 2').fill('4');
  });

  await test.step('предпросмотр не раскрывает эталонный ответ', async () => {
    await page.getByRole('button', { name: 'Предпросмотр' }).click();

    const preview = page.locator('.app-item-form__preview');
    await expect(preview).toContainText(stimulus);

    const question = preview.locator('craft-question-preview');
    await expect(question.locator('input[type="radio"]')).toHaveCount(2);
    await expect(question).toContainText('2');
    await expect(question).toContainText('4');
    for (const radio of await question.locator('input[type="radio"]').all()) {
      await expect(radio).not.toBeChecked();
    }

    await page.getByRole('button', { name: 'Вернуться к редактированию' }).click();
    // Черновик формы не сбрасывается переключением предпросмотра.
    await expect(page.getByPlaceholder('Текст, который увидит ученик перед вопросами')).toHaveValue(stimulus);
  });

  await test.step('сохранить и найти в списке', async () => {
    await page.getByRole('button', { name: 'Создать', exact: true }).click();
    await page.waitForURL('**/platform/content/pisa');

    await page.getByPlaceholder('Поиск по тексту стимула').fill(stimulus);
    await expect(page.locator('tr', { hasText: stimulus })).toBeVisible();
  });

  await test.step('отредактировать и убедиться, что изменение сохранилось', async () => {
    await page.locator('tr', { hasText: stimulus }).click();
    await page.waitForURL(/\/platform\/content\/pisa\/[^/]+$/);

    await expect(page.getByPlaceholder('Текст, который увидит ученик перед вопросами')).toHaveValue(stimulus);
    await expect(page.getByLabel('Контекст')).toHaveValue(context);

    await page.getByLabel('Контекст').fill(updatedContext);
    await page.getByRole('button', { name: 'Сохранить', exact: true }).click();
    await page.waitForURL('**/platform/content/pisa');

    await page.locator('tr', { hasText: stimulus }).click();
    await page.waitForURL(/\/platform\/content\/pisa\/[^/]+$/);
    await expect(page.getByLabel('Контекст')).toHaveValue(updatedContext);
  });
});
