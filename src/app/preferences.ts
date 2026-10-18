import { isLocale, type LocaleCode } from '../lib/languages';
import { MAX_NUMBER } from '../lib/random-number';

export interface Preferences {
  version: 1;
  locale: LocaleCode;
  min: number;
  max: number;
  forgiving: boolean;
  mode: 'continuous' | 'round';
  roundLength: 10 | 20 | 50;
  theme: 'dark' | 'light';
}
export const STORAGE_KEY = 'numspoken.preferences';
export const defaults: Preferences = {
  version: 1,
  locale: 'en-US',
  min: 0,
  max: 100,
  forgiving: true,
  mode: 'continuous',
  roundLength: 20,
  theme: 'dark',
};

export function validRange(min: number, max: number): boolean {
  return (
    Number.isSafeInteger(min) &&
    Number.isSafeInteger(max) &&
    min >= 0 &&
    max <= MAX_NUMBER &&
    min <= max
  );
}

export function parsePreferences(value: unknown): Preferences {
  if (
    !value ||
    typeof value !== 'object' ||
    !('version' in value) ||
    value.version !== 1
  )
    return { ...defaults };
  const raw = value as Record<string, unknown>;
  const range =
    typeof raw.min === 'number' &&
    typeof raw.max === 'number' &&
    validRange(raw.min, raw.max)
      ? { min: raw.min, max: raw.max }
      : { min: defaults.min, max: defaults.max };
  return {
    version: 1,
    locale: isLocale(raw.locale) ? raw.locale : defaults.locale,
    ...range,
    forgiving:
      typeof raw.forgiving === 'boolean' ? raw.forgiving : defaults.forgiving,
    mode: raw.mode === 'round' ? 'round' : 'continuous',
    roundLength:
      raw.roundLength === 10 || raw.roundLength === 50 ? raw.roundLength : 20,
    theme: raw.theme === 'light' ? 'light' : 'dark',
  };
}

export function readPreferences(): {
  preferences: Preferences;
  storageAvailable: boolean;
} {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return {
      preferences: raw ? parsePreferences(JSON.parse(raw)) : { ...defaults },
      storageAvailable: true,
    };
  } catch {
    return { preferences: { ...defaults }, storageAvailable: false };
  }
}

export function practiceKey(preferences: Preferences): string {
  const { locale, min, max, forgiving, mode, roundLength } = preferences;
  return JSON.stringify({ locale, min, max, forgiving, mode, roundLength });
}
