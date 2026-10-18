import { readFile } from 'node:fs/promises';
import { expect, it } from 'vitest';
import { languages } from './languages';
import { loadConverter } from './number-words';

it('declares font coverage for representative generated text in every script', async () => {
  for (const language of languages) {
    const suffix = language.font === 'default' ? '' : `-${language.font}`;
    const unicode: Record<string, string> = JSON.parse(
      await readFile(
        `node_modules/@fontsource/noto-sans${suffix}/unicode.json`,
        'utf8',
      ),
    );
    const ranges = Object.values(unicode).flatMap((value) =>
      value.split(',').map((range) => {
        const [start, end = start] = range.replace('U+', '').split('-');
        return [parseInt(start, 16), parseInt(end, 16)];
      }),
    );
    const convert = await loadConverter(language.code);
    const values = [
      ...Array.from({ length: 101 }, (_, i) => i),
      101,
      200,
      999,
      1000,
      1001,
      10000,
      100000,
      999999,
    ];
    const characters = new Set(
      values.flatMap((n) => convert(n).candidates).join(''),
    );
    for (const character of characters) {
      const point = character.codePointAt(0)!;
      expect(
        ranges.some(([start, end]) => point >= start && point <= end),
        `${language.code}: ${character} U+${point.toString(16)}`,
      ).toBe(true);
    }
  }
});
