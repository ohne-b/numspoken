import { expect, test } from '@playwright/test';
import { answerField, openPractice } from './helpers';
import { MAX_NUMBER } from '../../src/lib/random-number';

test('Material controls keep native keyboard editing and save changes immediately', async ({
  page,
}) => {
  await page.goto('./#/settings');
  const from = page.getByRole('textbox', { name: 'From', exact: true });
  const languageOutline = page.locator(
    '.language-trigger .mtrl-text-field__outline-leading',
  );
  await expect(languageOutline).toHaveCSS('border-left-width', '1px');
  await page
    .getByRole('combobox', { name: 'Practice language', exact: true })
    .focus();
  await expect(languageOutline).toHaveCSS('border-left-width', '2px');
  await from.focus();
  await expect(
    page.locator('m-text-field').first().locator('[part="outline-leading"]'),
  ).toHaveCSS('border-left-width', '2px');
  await expect(from).toHaveAttribute('inputmode', 'numeric');
  await from.fill('0');
  await from.press('End');
  await from.press('1');
  await expect(from).toHaveValue('01');
  await expect(from).toHaveAccessibleDescription('Min 0');
  const forgiving = page.getByRole('switch', { name: 'Forgiving spelling' });
  await forgiving.focus();
  await forgiving.press('Space');
  await expect(forgiving).not.toBeChecked();
  await page.getByRole('radio', { name: 'Continuous', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: 'Fixed round' })).toBeChecked();
  await page
    .getByRole('radiogroup', { name: 'Numbers per round' })
    .getByText('50', { exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        JSON.parse(localStorage.getItem('numspoken.preferences')!),
      ),
    )
    .toMatchObject({
      min: 1,
      forgiving: false,
      mode: 'round',
      roundLength: 50,
    });
  await page.reload();
  await expect(forgiving).not.toBeChecked();
  await expect(
    page.getByRole('radio', { name: '50', exact: true }),
  ).toBeChecked();
});

test('language search preserves typing, empty results, dismissal and small-screen scrolling', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto('./#/settings');
  const picker = page.getByRole('combobox', {
    name: 'Practice language',
    exact: true,
  });
  const search = page.getByRole('combobox', {
    name: 'Search languages',
    exact: true,
  });
  await picker.focus();
  await picker.press('Enter');
  await expect(search).toBeFocused();
  await search.pressSequentially('zzzzz');
  await expect(search).toBeFocused();
  await expect(page.getByRole('option')).toHaveCount(0);
  await expect(page.getByRole('status')).toHaveText('No languages found.');
  await search.fill('');
  await search.pressSequentially('Deutsch');
  await expect(search).toHaveValue('Deutsch');
  await expect(page.getByRole('option')).toHaveCount(1);
  await search.press('ArrowDown');
  await search.press('Enter');
  await expect(picker).toBeFocused();
  await expect(picker).toHaveValue('German, Germany');
  await picker.click();
  await expect(search).toBeFocused();
  await search.press('Tab');
  await expect(
    page.getByRole('textbox', { name: 'From', exact: true }),
  ).toBeFocused();
  await expect(picker).toHaveAttribute('aria-expanded', 'false');
  await picker.click();
  await expect(search).toBeFocused();
  await search.press('ArrowUp');
  const last = page.getByRole('option', { name: /Yoruba/ }).last();
  const popup = page.locator('.language-popup');
  await expect
    .poll(async () => {
      const item = (await last.boundingBox())!;
      const bounds = (await popup.boundingBox())!;
      return (
        item.y >= bounds.y && item.y + item.height <= bounds.y + bounds.height
      );
    })
    .toBe(true);
  await page.getByRole('heading', { name: 'Settings', exact: true }).click();
  await expect(picker).toHaveAttribute('aria-expanded', 'false');
});

test('language outline stays active while its search has focus', async ({
  page,
}) => {
  await page.goto('./#/settings');
  const picker = page.getByRole('combobox', {
    name: 'Practice language',
    exact: true,
  });
  const search = page.getByRole('combobox', { name: 'Search languages' });
  const outline = page.locator(
    '.language-trigger .mtrl-text-field__outline-leading',
  );
  const label = page.locator('.language-trigger .mtrl-text-field__label');
  for (const theme of ['dark', 'light']) {
    if (theme === 'light')
      await page.getByRole('button', { name: 'Switch to light mode' }).click();
    const accent = theme === 'dark' ? 'rgb(229, 111, 81)' : 'rgb(173, 69, 44)';
    await expect(outline).toHaveCSS('border-left-width', '1px');
    await picker.click();
    await expect(search).toBeFocused();
    await expect(outline).toHaveCSS('border-left-color', accent);
    await expect(outline).toHaveCSS('border-left-width', '2px');
    await expect(label).toHaveCSS('color', accent);
    await search.fill('Deutsch');
    await expect(outline).toHaveCSS('border-left-color', accent);
    await picker.click();
    await expect(search).toBeHidden();
    await expect(picker).toBeFocused();
    await expect(outline).toHaveCSS('border-left-color', accent);
    await page.getByRole('textbox', { name: 'From', exact: true }).click();
    await expect(outline).toHaveCSS('border-left-width', '1px');
    await expect(outline).not.toHaveCSS('border-left-color', accent);
  }
});

test('saves twelve-digit ranges and rejects oversized input without truncating it', async ({
  page,
}) => {
  await page.goto('./#/settings');
  await page.getByLabel('From', { exact: true }).fill(String(MAX_NUMBER));
  await page.getByLabel('To', { exact: true }).fill(String(MAX_NUMBER));
  await expect(page.getByLabel('To', { exact: true })).toHaveAttribute(
    'aria-invalid',
    'false',
  );
  await page.getByLabel('To', { exact: true }).fill(String(MAX_NUMBER + 1));
  await expect(page.getByLabel('To', { exact: true })).toHaveValue(
    String(MAX_NUMBER + 1),
  );
  await expect(page.getByLabel('To', { exact: true })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await page.getByRole('button', { name: 'Back to practice' }).click();
  await expect(page.locator('.number')).toHaveText('999,999,999,999');
  await page.reload();
  await expect(page.locator('.number')).toHaveText('999,999,999,999');
  await page.getByRole('button', { name: 'Reveal answer' }).click();
  await expect(answerField(page)).toHaveValue(
    'nine hundred ninety-nine billion nine hundred ninety-nine million nine hundred ninety-nine thousand nine hundred ninety-nine',
  );
});

test('range errors stay with the invalid field and clear independently', async ({
  page,
}) => {
  await page.goto('./#/settings');
  const from = page.getByRole('textbox', { name: 'From', exact: true });
  const to = page.getByRole('textbox', { name: 'To', exact: true });
  await from.fill('0/');
  await expect(from).toHaveAttribute('aria-invalid', 'true');
  await expect(from).toHaveAccessibleDescription('Use whole numbers.');
  await expect(to).toHaveAttribute('aria-invalid', 'false');
  await expect(to).toHaveAccessibleDescription('Max 999,999,999,999');
  await to.fill(String(MAX_NUMBER + 1));
  await expect(to).toHaveAttribute('aria-invalid', 'true');
  await from.fill('0');
  await expect(from).toHaveAttribute('aria-invalid', 'false');
  await expect(from).toHaveAccessibleDescription('Min 0');
  await to.fill('100');
  await from.fill('101');
  await expect(from).toHaveAccessibleDescription('Must be no higher than To.');
  await expect(to).toHaveAttribute('aria-invalid', 'false');
  await to.fill('102');
  await expect(from).toHaveAttribute('aria-invalid', 'false');
  await to.fill('100');
  await expect(to).toHaveAccessibleDescription('Must be no lower than From.');
  await expect(from).toHaveAttribute('aria-invalid', 'false');
  await expect(page.getByText(/last valid range/i)).toHaveCount(0);
});

test('dropdown keeps the search node and caret stable through edits and repeated opening', async ({
  page,
}) => {
  await page.goto('./#/settings');
  const picker = page.getByRole('combobox', {
    name: 'Practice language',
    exact: true,
  });
  const search = page.getByRole('combobox', { name: 'Search languages' });
  for (let i = 0; i < 3; i++) {
    await picker.click();
    await expect(search).toBeFocused();
    await picker.click();
    await expect(search).toBeHidden();
  }
  await picker.click();
  const original = await search.elementHandle();
  await search.pressSequentially('Deutch');
  await search.press('ArrowLeft');
  await search.press('ArrowLeft');
  await search.press('s');
  await expect(search).toHaveValue('Deutsch');
  expect(
    await search.evaluate((node, previous) => node === previous, original),
  ).toBe(true);
  expect(
    await search.evaluate((node: HTMLInputElement) => node.selectionStart),
  ).toBe(5);
  await expect(search).toHaveCSS('outline-style', 'none');
  await expect(search).toHaveCSS('border-top-width', '0px');
  await search.dispatchEvent('compositionstart');
  await search.dispatchEvent('keydown', { key: 'Escape', isComposing: true });
  await expect(search).toBeVisible();
  await search.dispatchEvent('compositionend');
  await page.getByRole('option', { name: 'German, Germany' }).click();
  await expect(picker).toHaveValue('German, Germany');
  await expect(picker).toBeFocused();
  await picker.click();
  await expect(search).toHaveValue('');
  await search.press('Shift+Tab');
  await expect(
    page.getByRole('button', { name: 'Back to practice' }),
  ).toBeFocused();
});

test('dropdown stays within the viewport when resized and zoomed', async ({
  page,
}) => {
  await page.goto('./#/settings');
  const picker = page.getByRole('combobox', {
    name: 'Practice language',
    exact: true,
  });
  await picker.click();
  for (const viewport of [
    { width: 360, height: 640 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await expect
      .poll(() =>
        page.locator('.language-popup').evaluate((surface) => {
          const box = surface.getBoundingClientRect();
          return (
            box.left >= 0 &&
            box.right <= innerWidth + 1 &&
            box.top >= 0 &&
            box.bottom <= innerHeight + 1
          );
        }),
      )
      .toBe(true);
  }
  await page
    .getByRole('combobox', { name: 'Search languages' })
    .press('Escape');
  await page.addStyleTag({ content: 'html { zoom: 2; }' });
  await picker.click();
  await expect
    .poll(() =>
      page.locator('.language-popup').evaluate((surface) => {
        const box = surface.getBoundingClientRect();
        return (
          box.left >= 0 &&
          box.right <= innerWidth + 1 &&
          box.top >= 0 &&
          box.bottom <= innerHeight + 1
        );
      }),
    )
    .toBe(true);
  await page.getByRole('combobox', { name: 'Search languages' }).fill('French');
  await page
    .getByRole('option', { name: 'French, France', exact: true })
    .click();
  await expect(picker).toHaveValue('French, France');
});

test('large grouped numbers and long answers fit small screens in both themes', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await openPractice(page, {
    locale: 'en-IN',
    min: MAX_NUMBER,
    max: MAX_NUMBER,
  });
  await expect(page.locator('.number')).toHaveText('9,99,99,99,99,999');
  for (const theme of ['dark', 'light']) {
    if (theme === 'light')
      await page.getByRole('button', { name: 'Switch to light mode' }).click();
    await page.getByRole('button', { name: 'Reveal answer' }).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await expect(answerField(page)).toBeVisible();
    await page.getByRole('button', { name: 'Next number' }).click();
  }
});

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
  const pageHeight = await page.evaluate(
    () => document.documentElement.scrollHeight,
  );
  await page.getByRole('combobox', { name: /Practice language/ }).click();
  await expect(page.getByRole('option')).toHaveCount(72);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollHeight))
    .toBe(pageHeight);
  const search = page.getByRole('combobox', { name: 'Search languages' });
  await search.fill('Deutsch');
  await expect(page.getByRole('option')).toHaveCount(1);
  await search.press('ArrowDown');
  await search.press('Enter');
  await expect(
    page.getByRole('combobox', { name: /Practice language/ }),
  ).toHaveValue('German, Germany');
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
