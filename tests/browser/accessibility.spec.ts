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

test('phone safe areas and solid chrome follow both themes and keep short views usable', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openPractice(page);
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
    'content',
    /viewport-fit=cover/,
  );
  // Synthetic insets exercise the layout; OS status bars still need a real device check.
  await page.addStyleTag({
    content:
      ':root { --safe-top: 59px; --safe-bottom: 34px; --safe-left: 0px; --safe-right: 0px; }',
  });
  for (const theme of ['dark', 'light']) {
    if (theme === 'light')
      await page.getByRole('button', { name: 'Switch to light mode' }).click();
    const color = theme === 'dark' ? 'rgb(23, 25, 29)' : 'rgb(250, 249, 246)';
    for (const selector of ['html', 'body', '.topbar', '.brand-footer'])
      await expect(page.locator(selector)).toHaveCSS('background-color', color);
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
      'content',
      theme === 'dark' ? '#17191d' : '#faf9f6',
    );
    const headerButton = await page
      .locator('.topbar button')
      .first()
      .boundingBox();
    expect(headerButton!.y).toBeGreaterThanOrEqual(59);
    const footerLink = await page
      .getByRole('link', { name: 'Source on GitHub' })
      .boundingBox();
    expect(footerLink!.y + footerLink!.height).toBeLessThanOrEqual(844 - 34);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollHeight <= innerHeight + 1,
      ),
    ).toBe(true);
  }
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.setViewportSize({ width: 844, height: 390 });
  await page.addStyleTag({
    content:
      ':root { --safe-top: 0px; --safe-bottom: 21px; --safe-left: 59px; --safe-right: 59px; }',
  });
  const range = page.getByLabel('To', { exact: true });
  await range.fill('100');
  const bounds = await range.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(59);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(844 - 59);
  await page.getByLabel('Fixed round', { exact: true }).check();
  await page.getByLabel('50', { exact: true }).check();
  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight),
  );
  await expect
    .poll(async () => (await page.locator('.topbar').boundingBox())!.y)
    .toBe(0);
  await page.getByRole('button', { name: 'Back to practice' }).click();
  await answerField(page).fill('hello');
  await expect(answerField(page)).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
});
