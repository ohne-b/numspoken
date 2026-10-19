import { expect, test } from '@playwright/test';
import { answerField, openPractice } from './helpers';

test('uses the whole range before repeating, including across completed rounds', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await openPractice(page, { min: 0, max: 11, mode: 'round', roundLength: 10 });
  const seen: number[] = [];
  for (let i = 0; i < 12; i++) {
    await expect(answerField(page)).toBeEditable();
    seen.push(Number(await page.locator('.number').textContent()));
    if (i === 0) {
      await page.getByRole('button', { name: 'Reveal answer' }).click();
      await expect(page.locator('.number')).toHaveText('0');
      await answerField(page).press('Enter');
    } else {
      await page.getByRole('button', { name: 'Skip number' }).click();
    }
    if (i === 9) {
      await expect(
        page.getByRole('heading', { name: 'Round complete' }),
      ).toBeVisible();
      await page.getByRole('button', { name: 'Start another round' }).click();
    }
  }
  expect([...seen].sort((a, b) => a - b)).toEqual(
    Array.from({ length: 12 }, (_, i) => i),
  );
  await expect(answerField(page)).toBeEditable();
  await expect(page.locator('.number')).not.toHaveText(String(seen.at(-1)));
});

test('keeps exclusions through guides and settings but clears them on reload or a new range', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await openPractice(page, { min: 0, max: 4 });
  await expect(page.locator('.number')).toHaveText('0');
  await answerField(page).fill('zero');
  await expect(page.locator('.number')).toHaveText('4', { timeout: 4000 });
  await page.getByRole('button', { name: 'Number guide' }).click();
  await page.getByRole('button', { name: 'Back to practice' }).click();
  await expect(page.locator('.number')).toHaveText('4');
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByRole('button', { name: 'Back to practice' }).click();
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await expect(page.locator('.number')).toHaveText('4');
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByRole('switch', { name: 'Forgiving spelling' }).click();
  await page.getByRole('button', { name: 'Back to practice' }).click();
  await expect(page.locator('.number')).toHaveText('3');
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByRole('combobox', { name: /Practice language/ }).click();
  await page.getByRole('combobox', { name: 'Search languages' }).fill('German');
  await page
    .getByRole('option', { name: 'German, Germany', exact: true })
    .click();
  await page.getByRole('button', { name: 'Back to practice' }).click();
  await expect(page.locator('.number')).toHaveText('2');
  await expect(answerField(page)).toHaveAttribute('lang', 'de-DE');
  expect(
    await page.evaluate(() => ({
      localKeys: Object.keys(localStorage),
      preferenceKeys: Object.keys(
        JSON.parse(localStorage.getItem('numspoken.preferences')!),
      ).sort(),
      sessionKeys: Object.keys(sessionStorage),
    })),
  ).toEqual({
    localKeys: ['numspoken.preferences'],
    preferenceKeys: [
      'forgiving',
      'locale',
      'max',
      'min',
      'mode',
      'roundLength',
      'theme',
      'version',
    ],
    sessionKeys: [],
  });
  await page.reload();
  await expect(answerField(page)).toHaveAttribute('lang', 'de-DE');
  await expect(page.locator('.number')).toHaveText('0');
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByRole('textbox', { name: 'To', exact: true }).fill('102');
  await page.getByRole('textbox', { name: 'From', exact: true }).fill('100');
  await page.getByRole('button', { name: 'Back to practice' }).click();
  await expect(page.locator('.number')).toHaveText('100');
});

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

test('keeps the focused editor placeholder hidden while the next number loads', async ({
  page,
}) => {
  await openPractice(page);
  const field = answerField(page);
  await field.evaluate((element) =>
    element.setAttribute('data-original-editor', 'true'),
  );
  const resumeFontLoad = await page.evaluateHandle(() => {
    const load = document.fonts.load.bind(document.fonts);
    let resume!: () => void;
    const pending = new Promise<void>((resolve) => {
      resume = resolve;
    });
    document.fonts.load = async (...args) => {
      await pending;
      return load(...args);
    };
    return () => {
      document.fonts.load = load;
      resume();
    };
  });
  try {
    await field.fill('forty-two');
    await expect(field).toHaveAttribute('aria-busy', 'true');
    await expect(field).toHaveValue('');
    await expect(field).toHaveAttribute('readonly', '');
    await expect(field).toBeFocused();
    expect(
      await field.evaluate(
        (element) => getComputedStyle(element, '::placeholder').opacity,
      ),
    ).toBe('0');
    await field.blur();
    expect(
      await field.evaluate(
        (element) => getComputedStyle(element, '::placeholder').opacity,
      ),
    ).toBe('0.8');
    await field.focus();
  } finally {
    await resumeFontLoad.evaluate((resume) => resume());
    await resumeFontLoad.dispose();
  }
  await expect(field).toBeEditable();
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
  await page.setViewportSize({ width: 366, height: 640 });
  await field.fill('x'.repeat(1000));
  const wrapped = await page.evaluate(() => {
    const input = document.querySelector('textarea')!;
    const mirror = document.querySelector('.answer-mirror')!;
    return {
      inputWidth: input.clientWidth,
      mirrorWidth: mirror.clientWidth,
      inputHeight: input.scrollHeight,
      mirrorHeight: mirror.scrollHeight,
    };
  });
  expect(wrapped.inputWidth).toBe(wrapped.mirrorWidth);
  expect(Math.abs(wrapped.inputHeight - wrapped.mirrorHeight)).toBeLessThan(2);
});

test('failed locale assets show retry and recover without grading stale answers', async ({
  page,
}) => {
  let block = true;
  await page.route('**/assets/de-DE-*.js', (route) =>
    block
      ? route.fulfill({ status: 503, body: 'Temporarily unavailable' })
      : route.continue(),
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
  await expect(answerField(page)).toBeEditable();
  await expect(answerField(page)).toHaveAttribute('lang', 'de-DE');
  await answerField(page).fill('zweiundvierzig');
  await expect(page.getByRole('status')).toContainText('Correct.');
});
