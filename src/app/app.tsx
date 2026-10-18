import { lazy, Suspense, useLayoutEffect, useState } from 'react';
import { mdiCogOutline, mdiWeatherNight, mdiWhiteBalanceSunny } from '@mdi/js';
import { IconButton } from '../ui/icon-button';
import { BrandFooter } from '../ui/brand-footer';
import { PracticeView } from '../features/practice/practice-view';
import { usePreferences } from './use-preferences';
import { practiceKey } from './preferences';
import { navigate, useView } from './use-view';

const SettingsView = lazy(() => import('../features/settings/settings-view'));
export function App() {
  const { preferences, update, storageAvailable } = usePreferences();
  const view = useView();
  const [practicePreferences, setPracticePreferences] = useState(preferences);
  if (
    view === 'practice' &&
    practiceKey(preferences) !== practiceKey(practicePreferences)
  )
    setPracticePreferences(preferences);
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = preferences.theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute(
        'content',
        preferences.theme === 'dark' ? '#17191d' : '#faf9f6',
      );
  }, [preferences.theme]);
  return (
    <div className="app-shell">
      <header className="topbar flex items-center justify-end gap-1">
        <IconButton
          label={
            preferences.theme === 'dark'
              ? 'Switch to light mode'
              : 'Switch to dark mode'
          }
          path={
            preferences.theme === 'dark'
              ? mdiWhiteBalanceSunny
              : mdiWeatherNight
          }
          onClick={() =>
            update({ theme: preferences.theme === 'dark' ? 'light' : 'dark' })
          }
        />
        {view === 'practice' && (
          <IconButton
            label="Open settings"
            path={mdiCogOutline}
            onClick={() => navigate('settings')}
          />
        )}
      </header>
      <main
        onFocusCapture={(event) => {
          // Native focus scrolling does not honor the header offset in every browser.
          event.target.scrollIntoView({ block: 'nearest' });
        }}
      >
        <PracticeView
          key={practiceKey(practicePreferences)}
          preferences={practicePreferences}
          active={view === 'practice'}
        />
        {view === 'settings' && (
          <Suspense
            fallback={
              <p className="load-state" role="status">
                Loading settings…
              </p>
            }
          >
            <SettingsView
              preferences={preferences}
              update={update}
              storageAvailable={storageAvailable}
            />
          </Suspense>
        )}
      </main>
      <BrandFooter />
    </div>
  );
}
