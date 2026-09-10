import { test, expect } from '@playwright/test';

// Модалка "Запросить демо" — app/shared/demo-modal, на Angular CDK Dialog.
// Проверяем контракт доступности (focus trap, Escape, backdrop-click,
// возврат фокуса) и реальный сценарий отправки формы (план
// 04-landing-migration.md, §4, шаг 4).
test.describe('Demo modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/ru/');
  });

  test('opens from the header CTA, traps focus, and returns focus on close', async ({ page }) => {
    // .header-cta живёт на хосте <craft-button>, реальная кнопка — внутри неё.
    const cta = page.locator('.header-cta button');
    await cta.focus();
    await cta.press('Enter');

    const modal = page.locator('.demo-modal');
    await expect(modal).toBeVisible();

    // Первый интерактивный элемент модалки должен получить фокус (CDK autoFocus).
    await expect(page.locator('.demo-modal__close')).toBeFocused();

    // Tab по всем полям формы не должен вывести фокус за пределы модалки.
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      const focusedInModal = await page.evaluate(() =>
        document.querySelector('.demo-modal')?.contains(document.activeElement)
      );
      expect(focusedInModal).toBe(true);
    }

    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
    await expect(cta).toBeFocused();
  });

  test('closes on backdrop click', async ({ page }) => {
    await page.locator('.header-cta').click();
    const modal = page.locator('.demo-modal');
    await expect(modal).toBeVisible();

    // Клик по подложке снаружи панели диалога.
    await page.locator('.cdk-overlay-backdrop').click({ position: { x: 5, y: 5 } });
    await expect(modal).toBeHidden();
  });

  test('rejects an incomplete form and accepts a valid submission', async ({ page }) => {
    await page.locator('.header-cta').click();
    const form = page.locator('.demo-modal form');
    await expect(form).toBeVisible();

    await form.getByRole('button', { name: 'Отправить заявку' }).click();
    // Форма невалидна (required-поля пустые) — она остаётся на экране формы,
    // а не переключается на экран успеха.
    await expect(form).toBeVisible();

    await page.locator('input[formcontrolname="name"]').fill('Иванова Айгуль Серикована');
    await page.locator('input[formcontrolname="organization"]').fill('Школа №25, Алматы');
    await page.locator('input[formcontrolname="email"]').fill('school25@example.kz');
    await page.locator('input[formcontrolname="phone"]').fill('+7 700 000 00 00');
    await form.getByRole('button', { name: 'Отправить заявку' }).click();

    await expect(page.getByText('Заявка успешно принята')).toBeVisible();
  });

  test('silently accepts a honeypot-filled submission without showing it as an error', async ({ page }) => {
    await page.locator('.header-cta').click();
    const form = page.locator('.demo-modal form');

    await page.locator('input[formcontrolname="name"]').fill('Bot');
    await page.locator('input[formcontrolname="organization"]').fill('Bot Org');
    await page.locator('input[formcontrolname="email"]').fill('bot@example.com');
    await page.locator('input[formcontrolname="phone"]').fill('000');
    // Honeypot-поле обычный пользователь не видит и не заполняет.
    await page.locator('input[formcontrolname="website"]').fill('https://spam.example');
    await form.getByRole('button', { name: 'Отправить заявку' }).click();

    await expect(page.getByText('Заявка успешно принята')).toBeVisible();
  });
});
