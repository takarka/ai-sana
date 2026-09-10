import { test, expect } from '@playwright/test';

// Ниже 1180px .nav — fixed-дропдаун, скрытый в закрытом виде через
// visibility:hidden (правильно выпадает из tab-order сам по себе). Но в DOM
// он стоит РАНЬШЕ бургера — открыв меню мышью или Enter/Space на бургере,
// дальнейший Tab уходил бы вперёд мимо уже видимой навигации сразу в
// контент страницы, а не в её пункты (план 04-landing-migration.md, §4,
// шаг 4 — найдено этим прогоном, не по чек-листу DoD). header.ts переносит
// фокус на первый пункт меню при открытии — это и проверяем здесь.
test.describe('Mobile burger menu keyboard flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 900 });
    await page.goto('/ru/');
  });

  test('opening via keyboard moves focus into the revealed nav, not past it', async ({ page }) => {
    await page.locator('.burger').focus();
    await page.keyboard.press('Enter');

    await expect(page.locator('#app-nav')).toHaveClass(/nav--open/);
    // Первый пункт меню должен получить фокус — иначе следующий Tab уходил бы
    // мимо навигации в контент страницы.
    await expect(page.locator('#app-nav a').first()).toBeFocused();
  });

  test('Escape closes the menu and returns focus to the burger button', async ({ page }) => {
    const burger = page.locator('.burger');
    await burger.click();
    await expect(page.locator('#app-nav')).toHaveClass(/nav--open/);

    await page.keyboard.press('Escape');
    await expect(page.locator('#app-nav')).not.toHaveClass(/nav--open/);
    await expect(burger).toBeFocused();
  });
});
