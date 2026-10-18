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

it.each(['zh-Hans-CN', 'zh-Hant-TW'] as const)(
  '%s keeps meaningful zeros and corrects both everyday and financial forms',
  async (locale) => {
    const convert = await loadConverter(locale);
    const wan = locale === 'zh-Hans-CN' ? '万' : '萬';
    expect(convert(100001).canonical).toBe(`十${wan}零一`);
    expect(convert(100100).canonical).toBe(`十${wan}零一百`);
    expect(convert(201000).canonical).toBe(`二十${wan}一千`);
    expect(convert(101001).candidates).toContain(`壹拾${wan}壹仟零壹`);
  },
);

it('keeps standalone Italian tre and Croatian hundreds unchanged', async () => {
  expect((await loadConverter('it-IT'))(3).canonical).toBe('tre');
  expect((await loadConverter('hr-HR'))(600).canonical).toBe('šesto');
});
