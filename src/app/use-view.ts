import { useSyncExternalStore } from 'react';

function subscribe(callback: () => void) {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}
export function useView() {
  return useSyncExternalStore(subscribe, () =>
    location.hash === '#/settings' ? 'settings' : 'practice',
  );
}
export function navigate(view: 'settings' | 'practice') {
  location.hash = view === 'settings' ? '/settings' : '/';
}
