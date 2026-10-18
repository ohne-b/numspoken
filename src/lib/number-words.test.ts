import { describe, expect, it } from 'vitest';
import { readdir } from 'node:fs/promises';
import fixtures from '../../tests/fixtures/number-words.json';
import { languages, localeLoaders, isLocale, formatNumber } from './languages';
import { loadConverter } from './number-words';
import { validateAnswer } from './validate-answer';
import { MAX_NUMBER } from './random-number';

it('exposes every regional/script variant shipped by the library', async () => {
  const exported = (await readdir('node_modules/n2words/src'))
    .filter((file) => /^[a-z]{2,3}-(?:[A-Z][a-z]{3}-)?[A-Z]{2}\.js$/.test(file))
    .map((file) => file.slice(0, -3))
    .sort();
  expect(Object.keys(localeLoaders).sort()).toEqual(exported);
  expect(languages).toHaveLength(72);
  expect(new Set(languages.map((language) => language.group)).size).toBe(50);
});
describe.each(languages)('$code converter', (language) => {
  it('handles boundaries and irregular values, with coherent grading', async () => {
    const convert = await loadConverter(language.code);
    for (const number of [
      0,
      1,
      2,
      11,
      16,
      21,
      71,
      80,
      99,
      100,
      101,
      111,
      999,
      1000,
      1001,
      10001,
      100000,
      999999,
      1_000_000,
      1_234_567,
      1_000_001,
      999_999_999,
      1_000_000_000,
      1_000_000_001,
      1_001_001_001,
      MAX_NUMBER,
    ]) {
      const answer = convert(number);
      expect(answer.canonical.length).toBeGreaterThan(0);
      expect(answer.canonical).not.toMatch(/undefined|NaN|�/);
      expect(
        validateAnswer(answer.canonical, answer.candidates, language, false)
          .complete,
      ).toBe(true);
      expect(formatNumber(number, language)).toMatch(/^[0-9\s,.]+$/u);
    }
  });
});
it.each(fixtures)(
  'matches the hand-written $locale fixture for $number',
  async ({ locale, number, words }) => {
    if (!isLocale(locale)) throw new Error('Invalid fixture');
    expect((await loadConverter(locale))(number).canonical).toBe(words);
  },
);
it('corrects the Spanish accent in compounds and accepts Chinese financial alternatives', async () => {
  for (const locale of ['es-ES', 'es-MX', 'es-US'] as const) {
    expect((await loadConverter(locale))(116).canonical).toBe(
      'ciento dieciséis',
    );
    expect((await loadConverter(locale))(16000).canonical).toBe(
      'dieciséis mil',
    );
  }
  expect((await loadConverter('zh-Hans-CN'))(42).candidates).toEqual([
    '四十二',
    '肆拾贰',
  ]);
});
