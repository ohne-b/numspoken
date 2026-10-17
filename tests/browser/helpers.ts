import { expect, type Page } from '@playwright/test';
import {
  defaults,
  STORAGE_KEY,
  type Preferences,
} from '../../src/app/preferences';

export async function openPractice(
  page: Page,
  preferences: Partial<Preferences> = {},
) {
  await page.addInitScript(
    ({ key, preferences }) => {
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify(preferences));
    },
    {
      key: STORAGE_KEY,
      preferences: { ...defaults, min: 42, max: 42, ...preferences },
    },
  );
  await page.goto('./');
  await expect(
    page.getByRole('textbox', { name: 'Write the number in words' }),
  ).toBeEditable();
}
export const answerField = (page: Page) =>
  page.getByRole('textbox', { name: 'Write the number in words' });
