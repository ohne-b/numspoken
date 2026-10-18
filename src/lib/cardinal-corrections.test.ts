import { expect, it } from 'vitest';
import fixtures from '../../tests/fixtures/cardinal-corrections.json';
import { isLocale } from './languages';
import { loadConverter } from './number-words';

it.each(fixtures)(
  'corrects $locale $number against the cited reference',
  async ({ locale, number, words, source }) => {
    if (!isLocale(locale)) throw new Error(locale);
    expect(source).toMatch(/^https:/);
    const answer = (await loadConverter(locale))(number);
    expect(answer.canonical).toBe(words);
    expect(answer.candidates).toContain(words);
  },
);

it('keeps zero gaps and complete groups when rebuilding Finnish numbers', async () => {
  const convert = await loadConverter('fi-FI');
  expect(convert(1001).canonical).toBe('tuhatyksi');
  expect(convert(200000).canonical).toBe('kaksisataatuhatta');
  expect(convert(999999).canonical).toBe(
    'yhdeksänsataayhdeksänkymmentäyhdeksäntuhattayhdeksänsataayhdeksänkymmentäyhdeksän',
  );
});
