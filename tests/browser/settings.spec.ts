import { expect, test } from '@playwright/test';
import { answerField, openPractice } from './helpers';

test('Escape closes settings when the header or footer has focus', async ({
  page,
}) => {
  await openPractice(page);
  for (const control of [
    page.getByRole('button', { name: 'Switch to light mode' }),
    page.getByRole('link', { name: 'Source on GitHub' }),
  ]) {
    await page.getByRole('button', { name: 'Open settings' }).click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await control.focus();
    await page.keyboard.press('Escape');
    await expect(answerField(page)).toBeVisible();
  }
});

test('starts in English dark mode with GitHub branding and no practice counters', async ({
  page,
}) => {
  await page.goto('./');
  await expect(answerField(page)).toHaveAttribute('lang', 'en-US');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(
    page.getByRole('link', { name: 'Source on GitHub' }),
  ).toHaveAttribute('href', 'https://github.com/ohne-b/numspoken');
  await expect(page.locator('footer img')).toHaveAttribute(
    'src',
    '/numspoken/brand/numspoken.svg',
  );
  await expect(page.getByRole('combobox')).toHaveCount(0);
});

test('grouped picker exposes all variants, searches native names and supports Escape', async ({
  page,
}) => {
  await openPractice(page);
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByRole('combobox', { name: /Practice language/ }).click();
  await expect(page.getByRole('option')).toHaveCount(72);
  const search = page.getByRole('combobox', { name: 'Search languages' });
  await search.fill('Deutsch');
  await expect(page.getByRole('option')).toHaveCount(1);
  await search.press('ArrowDown');
  await search.press('Enter');
  await expect(
    page.getByRole('combobox', { name: /Practice language/ }),
  ).toContainText('German');
  await page.getByRole('combobox', { name: /Practice language/ }).click();
  await search.press('Escape');
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(answerField(page)).toHaveAttribute('lang', 'de-DE');
  await page.getByRole('button', { name: 'Reveal answer' }).click();
  await expect(answerField(page)).toHaveValue('zweiundvierzig');
});

test('valid preferences persist; invalid drafts do not replace the last good range', async ({
  page,
}) => {
  await page.goto('./#/settings');
  await page.getByLabel('From', { exact: true }).fill('42');
  await page.getByLabel('To', { exact: true }).fill('42');
  await page.getByLabel('From', { exact: true }).fill('999999');
  await expect(page.getByLabel('From', { exact: true })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await page.getByRole('button', { name: 'Back to practice' }).click();
  await expect(page.locator('.number')).toHaveText('42');
  await answerField(page).fill('fort');
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await expect(answerField(page)).toHaveValue('fort');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(answerField(page)).toHaveValue('');
  await expect(page.locator('.number')).toHaveText('42');
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('numspoken.preferences')!),
  );
  expect(stored.min).toBe(42);
  expect(stored).not.toHaveProperty('answer');
});

test('storage denial still allows practice and reports unsaved preferences', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('Storage disabled');
      },
    });
  });
  await page.goto('./#/settings');
  await expect(page.getByRole('status')).toContainText('can’t be saved');
  await page.getByLabel('From', { exact: true }).fill('42');
  await page.getByLabel('To', { exact: true }).fill('42');
  await page.getByRole('button', { name: 'Back to practice' }).click();
  await expect(page.locator('.number')).toHaveText('42');
});

test('production navigation, fonts and assets stay on the project base path', async ({
  page,
}) => {
  const broken: string[] = [];
  const external: string[] = [];
  page.on('response', (response) => {
    if (response.status() >= 400) broken.push(response.url());
  });
  page.on('request', (request) => {
    if (!request.url().startsWith('http://127.0.0.1:4173/numspoken/'))
      external.push(request.url());
  });
  await openPractice(page, { locale: 'hi-IN' });
  await page.goto('./#/settings');
  await page.reload();
  await page.getByRole('combobox', { name: /Practice language/ }).click();
  await expect(page.getByRole('option')).toHaveCount(72);
  expect(broken).toEqual([]);
  expect(external).toEqual([]);
});
