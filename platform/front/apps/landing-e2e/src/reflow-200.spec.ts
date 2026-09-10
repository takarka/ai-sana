import { test, expect } from '@playwright/test';

// Масштаб 200% на типичном desktop-разрешении (1280 CSS px) эквивалентен
// доступной ширине ~640px (WCAG 1.4.10 Reflow) — контент не должен требовать
// горизонтальной прокрутки, а ключевые элементы (навигация, CTA, переключатель
// языка) должны оставаться видимыми и рабочими (план 04-landing-migration.md,
// §4, шаг 4).
const pages = ['/ru/', '/ru/matrix', '/ru/builder', '/ru/pisa'];

test.describe('200% zoom reflow', () => {
  for (const path of pages) {
    test(`no horizontal scrollbar on ${path}`, async ({ page }) => {
      await page.setViewportSize({ width: 640, height: 800 });
      await page.goto(path);
      await page.locator('h1').first().waitFor();

      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    });
  }

  test('header CTA and burger menu stay reachable at 640px width', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 800 });
    await page.goto('/ru/');

    // Ниже 1180px основная CTA скрыта, доступна только через бургер-меню
    // (см. .nav__cta в header.html) — это осознанное решение из шага 3.
    await expect(page.locator('.header-cta')).toBeHidden();
    const burger = page.locator('.burger');
    await expect(burger).toBeVisible();

    await burger.click();
    await expect(page.locator('.nav__cta')).toBeVisible();
    await expect(page.locator('#app-nav')).toHaveClass(/nav--open/);
  });

  test('demo form fields remain usable at 640px width', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 800 });
    await page.goto('/ru/');
    await page.locator('.burger').click();
    await page.locator('.nav__cta').click();

    const modal = page.locator('.demo-modal');
    await expect(modal).toBeVisible();
    const nameInput = page.locator('input[formcontrolname="name"]');
    await expect(nameInput).toBeVisible();
    await nameInput.fill('Тест');
    await expect(nameInput).toHaveValue('Тест');
  });
});
