import { afterEach, expect, it, vi } from 'vitest';
import {
  defaults,
  parsePreferences,
  practiceKey,
  readPreferences,
  validRange,
} from './preferences';

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});
it('validates untrusted preferences field by field and drops unknown data', () => {
  expect(
    parsePreferences({
      version: 1,
      locale: '__proto__',
      min: -1,
      max: 2,
      answer: 'old',
      theme: 'light',
    }),
  ).toEqual({ ...defaults, theme: 'light' });
  expect(parsePreferences({ ...defaults, version: 2 })).toEqual(defaults);
  expect(
    parsePreferences({
      ...defaults,
      locale: 'zh-Hant-TW',
      min: 999999,
      max: 999999,
    }),
  ).toMatchObject({ locale: 'zh-Hant-TW', min: 999999 });
  expect(validRange(NaN, 100)).toBe(false);
});
it('falls back to a usable session when storage throws', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('Blocked');
  });
  expect(readPreferences()).toEqual({
    preferences: defaults,
    storageAvailable: false,
  });
});
it('theme changes alone do not restart practice', () => {
  expect(practiceKey(defaults)).toBe(
    practiceKey({ ...defaults, theme: 'light' }),
  );
  expect(practiceKey(defaults)).not.toBe(
    practiceKey({ ...defaults, locale: 'de-DE' }),
  );
});
