import { expect, test } from '@playwright/test';
import { answerField, openPractice } from './helpers';

test('a new round does not repeat the last visible number in a two-number range', async ({
  page,
}) => {
  await openPractice(page, { min: 0, max: 1, mode: 'round', roundLength: 10 });
  for (let i = 0; i < 9; i++)
    await page.getByRole('button', { name: 'Skip number' }).click();
  const last = await page.locator('.number').textContent();
  await page.getByRole('button', { name: 'Skip number' }).click();
  await page.getByRole('button', { name: 'Start another round' }).click();
  await expect(page.locator('.number')).not.toHaveText(last!);
});

test('colors typed characters, underlines an error, then advances after success', async ({
  page,
}) => {
  await openPractice(page);
  const field = answerField(page);
  await field.fill('forty-txo');
  await expect(page.locator('.correct-text')).toHaveText('forty-t');
  await expect(page.locator('.incorrect-text')).toHaveText('x');
  await field.fill('forty-two');
  await expect(page.getByRole('status')).toContainText('Correct.');
  await expect(field).toHaveValue('', { timeout: 4000 });
});

test('editing, settings and loss of focus cancel pending advancement', async ({
  page,
}) => {
  await openPractice(page);
  await page.clock.install();
  const field = answerField(page);
  await field.fill('forty-two');
  await field.fill('forty-tw');
  await page.clock.runFor(1000);
  await expect(field).toHaveValue('forty-tw');
  await field.fill('forty-two');
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.clock.runFor(1000);
  await page.getByRole('button', { name: 'Back to practice' }).click();
  await expect(field).toHaveValue('forty-two');
  await page.getByRole('button', { name: 'Switch to light mode' }).focus();
  await page.clock.runFor(1000);
  await expect(field).toHaveValue('forty-two');
  await field.focus();
  await page.clock.runFor(900);
  await expect(field).toHaveValue('');
});

test('keeps the native editor and its focus between numbers', async ({
  page,
}) => {
  await openPractice(page);
  const field = answerField(page);
  await field.evaluate((element) =>
    element.setAttribute('data-original-editor', 'true'),
  );
  await field.fill('forty-two');
  await expect(field).toHaveValue('');
  await expect(field).toHaveAttribute('data-original-editor', 'true');
  await expect(field).toBeFocused();
});

test('reveal never succeeds or advances by itself; a round counts departures once', async ({
  page,
}) => {
  await openPractice(page, { mode: 'round', roundLength: 10 });
  await page.clock.install();
  await page.getByRole('button', { name: 'Reveal answer' }).click();
  await expect(answerField(page)).toHaveValue('forty-two');
  await expect(answerField(page)).toHaveAttribute('readonly', '');
  await page.clock.runFor(2000);
  await expect(page.getByRole('status')).toHaveText('Answer revealed');
  await expect(page.locator('.correct-text')).toHaveText('');
  await page.getByRole('button', { name: 'Next number' }).click();
  for (let i = 1; i < 10; i++)
    await page.getByRole('button', { name: 'Skip number' }).click();
  await expect(
    page.getByRole('heading', { name: 'Round complete' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Start another round' }).click();
  await expect(answerField(page)).toHaveValue('');
});

test('composition keeps native text visible and suspends grading and Enter', async ({
  page,
}) => {
  await openPractice(page, { locale: 'ja-JP' });
  await page.clock.install();
  const field = answerField(page);
  await field.dispatchEvent('compositionstart');
  await field.evaluate((element: HTMLTextAreaElement) => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      'value',
    )!.set!.call(element, '四十二');
    element.dispatchEvent(
      new InputEvent('input', {
        bubbles: true,
        data: '四十二',
        inputType: 'insertCompositionText',
        isComposing: true,
      }),
    );
  });
  await field.dispatchEvent('keydown', { key: 'Enter', isComposing: true });
  await page.clock.runFor(1200);
  await expect(field).toHaveValue('四十二');
  await expect(page.locator('.answer-mirror')).toHaveCSS(
    'visibility',
    'hidden',
  );
  await field.dispatchEvent('compositionend', { data: '四十二' });
  await expect(page.getByRole('status')).toContainText('Correct.');
  await page.clock.runFor(900);
  await expect(field).toHaveValue('');
});

test('native selection, multiline mirroring and RTL stay aligned', async ({
  page,
}) => {
  await openPractice(page, { locale: 'ar-SA', max: 999999, min: 999999 });
  const field = answerField(page);
  await expect(field).toHaveAttribute('dir', 'rtl');
  await field.fill('اختبار\n'.repeat(30));
  await field.evaluate((element: HTMLTextAreaElement) => {
    element.setSelectionRange(0, 7);
    element.scrollTop = element.scrollHeight;
    element.dispatchEvent(new Event('scroll'));
  });
  const metrics = await page.evaluate(() => {
    const input = document.querySelector('textarea')!;
    const mirror = document.querySelector('.answer-mirror')!;
    return {
      inputWidth: input.getBoundingClientRect().width,
      mirrorWidth: mirror.getBoundingClientRect().width,
      scroll: input.scrollTop,
      mirrorScroll: mirror.scrollTop,
      start: input.selectionStart,
      end: input.selectionEnd,
    };
  });
  expect(metrics.inputWidth).toBe(metrics.mirrorWidth);
  expect(metrics.scroll).toBeGreaterThan(0);
  expect(Math.abs(metrics.scroll - metrics.mirrorScroll)).toBeLessThan(2);
  expect(metrics.start).toBe(0);
  expect(metrics.end).toBe(7);
});

test('failed locale assets show retry and recover without grading stale answers', async ({
  page,
  browserName,
}) => {
  let block = true;
  await page.route('**/assets/de-DE-*.js', (route) =>
    block ? route.abort() : route.continue(),
  );
  await openPractice(page);
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByRole('combobox', { name: /Practice language/ }).click();
  await page.getByRole('combobox', { name: 'Search languages' }).fill('German');
  await page.getByRole('option', { name: /Germany/ }).click();
  await page.getByRole('button', { name: 'Back to practice' }).click();
  await expect(page.getByText('Couldn’t load this language.')).toBeVisible();
  block = false;
  await page.getByRole('button', { name: 'Retry loading language' }).click();
  if (browserName === 'webkit')
    await page.getByRole('button', { name: 'Reload numspoken' }).click();
  await expect(answerField(page)).toBeVisible();
  await expect(answerField(page)).toHaveAttribute('lang', 'de-DE');
});
