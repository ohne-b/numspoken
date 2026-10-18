import { useMemo, useSyncExternalStore } from 'react';

export type View =
  | { name: 'practice' | 'settings' }
  | { name: 'guide'; slug: string; section: string | null };

export function parseView(hash: string): View {
  if (hash === '#/settings') return { name: 'settings' };
  if (hash.startsWith('#/guides/')) {
    const [slug, query = ''] = hash.slice('#/guides/'.length).split('?');
    return {
      name: 'guide',
      slug,
      section: new URLSearchParams(query).get('section'),
    };
  }
  return { name: 'practice' };
}

function subscribe(callback: () => void) {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}
export function useView() {
  const hash = useSyncExternalStore(subscribe, () => location.hash);
  return useMemo(() => parseView(hash), [hash]);
}
export function guideUrl(slug: string, section?: string) {
  return `#/guides/${slug}${section ? `?section=${encodeURIComponent(section)}` : ''}`;
}
export function navigate(
  view: 'settings' | 'practice' | { guide: string; section?: string },
) {
  location.hash =
    typeof view === 'object'
      ? guideUrl(view.guide, view.section)
      : view === 'settings'
        ? '/settings'
        : '/';
}
