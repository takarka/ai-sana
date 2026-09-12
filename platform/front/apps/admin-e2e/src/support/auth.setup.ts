import { Page, expect, test } from '@playwright/test';

const AUTH_FILE = 'apps/admin-e2e/.auth/admin.json';

const email = process.env['E2E_ADMIN_EMAIL'];
const password = process.env['E2E_ADMIN_PASSWORD'];

// Один логин суперадмина на весь прогон (Playwright storageState, а не форма
// входа в каждом спеке) — переиспользуется content-спеками matrix/pisa
// (план 09 §6). Суперадмин закрывает и /platform/orgs/**, и
// /platform/content/**, поэтому одной роли достаточно для обоих модулей.
//
// Пароль обязателен к смене при самом первом входе (план 09 §3.2, A1.5) —
// ChangePasswordHandler не запрещает совпадение нового пароля с текущим, так
// что один и тот же E2E_ADMIN_PASSWORD работает и до, и после первой смены:
// на чистой БД эта проверка сама проходит через экран смены пароля, на уже
// использованной локальной БД просто логинится с первого раза.
test('authenticate as platform superadmin', async ({ page }) => {
  if (!email || !password) {
    throw new Error(
      'E2E_ADMIN_EMAIL и E2E_ADMIN_PASSWORD обязательны для admin-e2e — ' +
        'это учётные данные первого суперадмина (Identity:SuperAdmin в backend-конфигурации, план 09 §7 О5).',
    );
  }

  await login(page, email, password);

  if (page.url().includes('/auth/change-password')) {
    await page.getByLabel('Текущий пароль').fill(password);
    await page.getByLabel('Новый пароль').fill(password);
    await page.getByRole('button', { name: 'Сменить пароль' }).click();

    await page.waitForURL('**/auth/login**');
    await login(page, email, password);
  }

  await expect(page).toHaveURL(/\/platform$/);
  await page.context().storageState({ path: AUTH_FILE });
});

async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/auth/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Пароль').fill(password);
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL(/\/(platform|auth\/change-password)/);
}
