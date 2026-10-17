import { describe, expect, it } from 'vitest';
import { languageFor } from './languages';
import { validateAnswer } from './validateAnswer';

describe('answer feedback', () => {
  const en = languageFor('en-US');
  it('colors the prefix and underlines only the first wrong grapheme', () => {
    expect(validateAnswer('forty-txo', ['forty-two'], en, true)).toEqual({
      correctEnd: 7,
      errorStart: 7,
      errorEnd: 8,
      complete: false,
    });
    expect(
      validateAnswer('forty-t', ['forty-two'], en, true).errorStart,
    ).toBeNull();
  });
  it('accepts forgiving accents and separators, with strict spelling available', () => {
    const es = languageFor('es-ES');
    expect(
      validateAnswer('  DIECISEIS ', ['dieciséis'], es, true).complete,
    ).toBe(true);
    expect(validateAnswer('dieciseis', ['dieciséis'], es, false).complete).toBe(
      false,
    );
    expect(validateAnswer('forty two', ['forty-two'], en, true).complete).toBe(
      true,
    );
    expect(validateAnswer('forty two', ['forty-two'], en, false).complete).toBe(
      false,
    );
    expect(validateAnswer('---  ', ['forty-two'], en, true).complete).toBe(
      false,
    );
  });
  it('maps decomposed accents back to full input graphemes', () => {
    const es = languageFor('es-ES');
    expect(
      validateAnswer('diecise\u0301is', ['dieciséis'], es, false).complete,
    ).toBe(true);
    expect(
      validateAnswer('e\u0301x', ['één'], languageFor('nl-NL'), false),
    ).toMatchObject({ correctEnd: 2, errorStart: 2, errorEnd: 3 });
  });
  it('preserves Indic vowel marks and Cyrillic letters', () => {
    const hi = languageFor('hi-IN');
    expect(validateAnswer('तन', ['तीन'], hi, true).complete).toBe(false);
    expect(validateAnswer('तीन', ['तीन'], hi, true).complete).toBe(true);
    expect(
      validateAnswer('три', ['трий'], languageFor('ru-RU'), true).complete,
    ).toBe(false);
  });
  it('permits optional Arabic/Hebrew marks without removing letters', () => {
    expect(
      validateAnswer('ثلاثة', ['ثَلَاثَة'], languageFor('ar-SA'), true)
        .complete,
    ).toBe(true);
    expect(
      validateAnswer('שלוש', ['שָׁלוֹשׁ'], languageFor('he-IL'), true).complete,
    ).toBe(true);
  });
  it('never combines pieces of different valid alternatives', () => {
    expect(
      validateAnswer('one and two', ['one two', 'one and three'], en, true)
        .complete,
    ).toBe(false);
    expect(
      validateAnswer(
        'one hundred and one',
        ['one hundred one', 'one hundred and one'],
        en,
        true,
      ).complete,
    ).toBe(true);
  });
  it('does not color half a grapheme or accept extra characters', () => {
    expect(validateAnswer('👩‍💻x', ['👩‍💻'], en, false)).toMatchObject({
      correctEnd: 5,
      errorStart: 5,
      complete: false,
    });
    expect(validateAnswer('forty-twoo', ['forty-two'], en, true).complete).toBe(
      false,
    );
  });
});
