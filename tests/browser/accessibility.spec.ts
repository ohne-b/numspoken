import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { answerField, openPractice } from './helpers';

test('practice and settings pass axe in both themes, including the language popup', async ({
  page,
}) => {
  await openPractice(page);
  for (const theme of ['dark', 'light']) {
    if (theme === 'light')
      await page.getByRole('button', { name: 'Switch to light mode' }).click();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.getByRole('button', { name: 'Open settings' }).click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.getByRole('combobox', { name: /Practice language/ }).click();
    await expect(page.getByRole('option')).toHaveCount(72);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Back to practice' }).click();
  }
});

test('small screens and 200% text keep controls reachable without horizontal scrolling', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await openPractice(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollHeight <= innerHeight + 1,
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.addStyleTag({ content: 'html { zoom: 2; }' });
  await page.getByLabel('Fixed round', { exact: true }).check();
  await page
    .getByRole('button', { name: 'Back to practice' })
    .scrollIntoViewIfNeeded();
  await expect(
    page.getByRole('button', { name: 'Back to practice' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
});

test('forced colors retains native text and keyboard focus', async ({
  page,
  browserName,
}) => {
  test.skip(browserName === 'webkit', 'WebKit does not emulate forced-colors.');
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await openPractice(page);
  await answerField(page).fill('forty-t');
  await expect(page.locator('.answer-mirror')).toHaveCSS('display', 'none');
  expect(
    await answerField(page).evaluate(
      (element) => getComputedStyle(element).color,
    ),
  ).not.toBe('rgba(0, 0, 0, 0)');
  await answerField(page).press('Tab');
  await expect(
    page.getByRole('button', { name: 'Reveal answer' }),
  ).toBeFocused();
});
