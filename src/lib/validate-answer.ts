import type { Language } from './languages';

interface Unit {
  value: string;
  start: number;
  end: number;
}
export interface Feedback {
  correctEnd: number;
  errorStart: number | null;
  errorEnd: number | null;
  complete: boolean;
}
const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

function normalize(
  text: string,
  language: Language,
  forgiving: boolean,
): Unit[] {
  const units: Unit[] = [];
  const start = text.length - text.trimStart().length;
  const end = text.trimEnd().length;
  for (const part of segmenter.segment(text)) {
    if (part.index < start || part.index >= end) continue;
    let value = part.segment
      .normalize('NFC')
      .toLocaleLowerCase(language.formatter);
    if (forgiving) {
      // Separators are optional, letters are not. Keep apostrophes and Indic marks.
      value = value.replace(/[\s\p{Dash_Punctuation},،、]/gu, '');
      if (language.latin)
        value = value.normalize('NFD').replace(/\p{M}/gu, '').normalize('NFC');
      // Fold stress accents in Greek/Cyrillic, retaining distinct letters such as й and ё.
      if (['el-GR', 'ru-RU', 'uk-UA', 'sr-Cyrl-RS'].includes(language.code))
        value = value
          .normalize('NFD')
          .replace(/[\u0300\u0301\u0342]/g, '')
          .normalize('NFC');
      if (language.font === 'arabic')
        value = value.replace(/[\u064b-\u0652\u0670\u200c]/g, '');
      if (language.font === 'hebrew')
        value = value.replace(
          /[\u0591-\u05bd\u05bf-\u05c2\u05c4\u05c5\u05c7]/g,
          '',
        );
    } else if (/^\s+$/u.test(value)) {
      value = ' ';
    }
    units.push({
      value,
      start: part.index,
      end: part.index + part.segment.length,
    });
  }
  return units;
}

export function validateAnswer(
  text: string,
  candidates: readonly string[],
  language: Language,
  forgiving: boolean,
): Feedback {
  const units = normalize(text, language, forgiving);
  const actual = units.map((unit) => unit.value).join('');
  let best: Feedback = {
    correctEnd: 0,
    errorStart: null,
    errorEnd: null,
    complete: false,
  };
  for (const candidate of candidates) {
    const expected = normalize(candidate, language, forgiving)
      .map((unit) => unit.value)
      .join('');
    let offset = 0;
    let correctEnd = 0;
    let error: Unit | undefined;
    for (const unit of units) {
      if (expected.slice(offset, offset + unit.value.length) !== unit.value) {
        error = unit;
        break;
      }
      offset += unit.value.length;
      correctEnd = unit.end;
    }
    const complete = actual.length > 0 && actual === expected;
    if (complete)
      return {
        correctEnd: text.length,
        errorStart: null,
        errorEnd: null,
        complete: true,
      };
    if (
      correctEnd > best.correctEnd ||
      (best.correctEnd === 0 && best.errorStart === null)
    ) {
      best = {
        correctEnd,
        errorStart: error?.start ?? null,
        errorEnd: error?.end ?? null,
        complete: false,
      };
    }
  }
  return best;
}
