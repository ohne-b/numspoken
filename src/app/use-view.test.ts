import { expect, it } from 'vitest';
import { guideUrl, parseView } from './use-view';

it('keeps guide sections inside the Pages-compatible hash route', () => {
  expect(parseView(guideUrl('spanish', 'cien-or-ciento'))).toEqual({
    name: 'guide',
    slug: 'spanish',
    section: 'cien-or-ciento',
  });
  expect(parseView('#/guides/unknown')).toEqual({
    name: 'guide',
    slug: 'unknown',
    section: null,
  });
  expect(parseView('#/settings')).toEqual({ name: 'settings' });
  expect(parseView('#/')).toEqual({ name: 'practice' });
  expect(parseView('#unexpected')).toEqual({ name: 'practice' });
});
