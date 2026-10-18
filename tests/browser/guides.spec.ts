import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { guides } from '../../src/lib/guides/guide-registry';
import { languageFor } from '../../src/lib/languages';
import { answerField, openPractice } from './helpers';

test('opens the selected language guide and preserves the answer and selection', async ({
  page,
}) => {
  await openPractice(page, { locale: 'es-MX' });
  const field = answerField(page);
  await field.fill('cuarenta');
  await field.evaluate((element: HTMLTextAreaElement) =>
    element.setSelectionRange(2, 5),
  );
  await page.getByRole('button', { name: 'Number guide' }).click();
  await expect(
    page.getByRole('heading', { name: 'Spanish numbers' }),
  ).toBeFocused();
  await expect(page.getByRole('table', { name: '20–29' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(field).toBeFocused();
  await expect(field).toHaveValue('cuarenta');
  expect(
    await field.evaluate((element: HTMLTextAreaElement) => [
      element.selectionStart,
      element.selectionEnd,
    ]),
  ).toEqual([2, 5]);
  await expect(page).toHaveTitle('numspoken');
});

test('opens settings from a guide and uses the newly selected language', async ({
  page,
}) => {
  await openPractice(page);
  await answerField(page).fill('fort');
  await page.getByRole('button', { name: 'Number guide' }).click();
  await expect(
    page.getByRole('heading', { name: 'English numbers' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByRole('combobox', { name: /Practice language/ }).click();
  const search = page.getByRole('combobox', { name: 'Search languages' });
  await search.fill('German');
  await search.press('ArrowDown');
  await search.press('Enter');
  await page.getByRole('button', { name: 'Back to practice' }).click();
  await expect(answerField(page)).toHaveAttribute('lang', 'de-DE');
  await expect(answerField(page)).toHaveValue('');
  await page.getByRole('button', { name: 'Number guide' }).click();
  await expect(
    page.getByRole('heading', { name: 'German numbers' }),
  ).toBeVisible();
});

test('pauses a completed answer while reading and resumes it on return', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-01-01T10:00:00Z') });
  await openPractice(page);
  await page.clock.pauseAt(new Date('2026-01-01T10:05:00Z'));
  await answerField(page).fill('forty-two');
  await page.getByRole('button', { name: 'Number guide' }).click();
  await expect(page.locator('.practice-view')).toBeHidden();
  await page.clock.runFor(2000);
  await expect(
    page.getByRole('heading', { name: 'English numbers' }),
  ).toBeVisible();
  await expect(page.locator('textarea')).toHaveValue('forty-two');
  await page.getByRole('button', { name: 'Back to practice' }).click();
  await expect(answerField(page)).toHaveValue('forty-two');
  await page.clock.runFor(900);
  await expect(answerField(page)).toHaveValue('');
});

test('loads every guide and its local fonts on a small screen', async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 360, height: 640 });
  for (const guide of guides) {
    await page.goto(`./#/guides/${guide.slug}`);
    await expect(
      page.getByRole('heading', {
        name: `${languageFor(guide.locale).group} numbers`,
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Sources', exact: true }),
    ).toBeVisible();
    await expect(page.locator('.guide-reference table').first()).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      guide.slug,
    ).toBe(true);
    expect(
      await page
        .locator('.guide-reference td[lang]')
        .first()
        .getAttribute('lang'),
    ).toBe(guide.locale);
  }
});

test('guides pass axe in both themes and keep script direction inside the cells', async ({
  page,
}) => {
  test.setTimeout(60000);
  for (const theme of ['dark', 'light']) {
    for (const slug of ['spanish', 'arabic', 'chinese']) {
      await page.goto(`./#/guides/${slug}`);
      await expect(
        page.getByRole('heading', { name: 'Sources', exact: true }),
      ).toBeVisible();
      if ((await page.locator('html').getAttribute('data-theme')) !== theme)
        await page
          .getByRole('button', {
            name:
              theme === 'light'
                ? 'Switch to light mode'
                : 'Switch to dark mode',
          })
          .click();
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await expect(page.locator('article')).toHaveAttribute('lang', 'en');
      await expect(
        page.locator('.guide-reference td[lang]').first(),
      ).toHaveAttribute('dir', slug === 'arabic' ? 'rtl' : 'ltr');
    }
  }
});

test('restores reading position and opens section URLs after reload', async ({
  page,
}) => {
  await openPractice(page, { locale: 'es-ES' });
  await page.goto('./#/guides/spanish?section=cien-or-ciento');
  await expect(page.locator('#guide-cien-or-ciento')).toBeFocused();
  const before = await page.evaluate(() => scrollY);
  expect(before).toBeGreaterThan(0);
  await page.reload();
  await expect(page.locator('#guide-cien-or-ciento')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(answerField(page)).toBeEditable();
  await page.getByRole('button', { name: 'Number guide' }).click();
  await expect(
    page.getByRole('heading', { name: 'Sources', exact: true }),
  ).toBeVisible();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
});

test('recovers from a failed font download by reloading after one retry', async ({
  page,
}) => {
  const fontPattern = /noto-sans.*\.woff2?$/;
  await page.route(fontPattern, (route) => route.abort());
  await page.goto('./#/guides/spanish');
  await page.getByRole('button', { name: 'Retry loading guide' }).click();
  await expect(
    page.getByRole('button', { name: 'Reload guide' }),
  ).toBeVisible();
  await page.unroute(fontPattern);
  await page.getByRole('button', { name: 'Reload guide' }).click();
  await expect(
    page.getByRole('heading', { name: 'Sources', exact: true }),
  ).toBeVisible();
});

test('keeps reading and returning usable at 200% zoom and without storage', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error('Storage blocked');
    };
    Storage.prototype.setItem = () => {
      throw new Error('Storage blocked');
    };
  });
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto('./#/guides/german');
  await expect(
    page.getByRole('heading', { name: 'Sources', exact: true }),
  ).toBeVisible();
  await page.addStyleTag({ content: 'html { zoom: 2; }' });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'Back to practice' }).click();
  await expect(answerField(page)).toBeEditable();
});

test('an unknown guide has a working way back', async ({ page }) => {
  await page.goto('./#/guides/not-a-language');
  await expect(
    page.getByRole('heading', { name: 'Guide not found' }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Back to practice' }).press('Enter');
  await expect(answerField(page)).toBeEditable();
});
