import { test, expect } from '@playwright/test';

// Переключатель языка (app/shared/lang-switcher) не роутит на клиенте — RU и
// KK это два отдельных собранных @angular/localize бандла под своим baseHref
// (план 04-landing-migration.md, §2.1), переход всегда обычная навигация
// браузера. Проверяем, что она действительно переносит на тот же маршрут
// под другим префиксом и меняет видимый язык контента.
test.describe('Language switch', () => {
  test('switches from ru to kk on the home page and keeps the path', async ({ page }) => {
    await page.goto('/ru/');
    await expect(page.locator('h1')).toContainText('ИИ-ЭКОСИСТЕМА');

    // Переключатель дублирован в шапке и футере (header.html/footer.html) —
    // берём тот, что в шапке.
    await page.locator('header .lang-switcher__link', { hasText: 'KZ' }).click();
    await expect(page).toHaveURL(/\/kk\/$/);
    await expect(page.locator('h1')).toContainText('ЖИ-ЭКОЖҮЙЕ');
  });

  test('switches from kk back to ru while staying on the same page', async ({ page }) => {
    await page.goto('/kk/matrix');
    await expect(page.locator('header .lang-switcher__link[aria-current="page"]')).toHaveText('KZ');

    await page.locator('header .lang-switcher__link', { hasText: 'RU' }).click();
    await expect(page).toHaveURL(/\/ru\/matrix$/);
    await expect(page.locator('header .lang-switcher__link[aria-current="page"]')).toHaveText('RU');
  });

  test('kk builder page renders kazakh translations, not the ru source text', async ({ page }) => {
    await page.goto('/kk/builder');
    await expect(page.locator('h1')).toContainText('практикалық');
    await expect(page.locator('h1')).not.toContainText('Практический курс');
  });
});
