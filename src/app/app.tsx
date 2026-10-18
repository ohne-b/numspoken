import { lazy, Suspense, useLayoutEffect, useState } from 'react';
import {
  mdiBookOpenPageVariantOutline,
  mdiCogOutline,
  mdiWeatherNight,
  mdiWhiteBalanceSunny,
} from '@mdi/js';
import { IconButton } from '../ui/icon-button';
import { BrandFooter } from '../ui/brand-footer';
import { PracticeView } from '../features/practice/practice-view';
import { usePreferences } from './use-preferences';
import { practiceKey } from './preferences';
import { navigate, useView } from './use-view';
import { guideForLanguage } from '../lib/guides/guide-registry';
import { languageFor } from '../lib/languages';

const SettingsView = lazy(() => import('../features/settings/settings-view'));
const GuideView = lazy(() => import('../features/guides/guide-view'));
export function App() {
  const { preferences, update, storageAvailable } = usePreferences();
  const view = useView();
  const [settingsOrigin, setSettingsOrigin] = useState<{
    guide: string;
    locale: string;
  } | null>(null);
  const [practicePreferences, setPracticePreferences] = useState(preferences);
  if (
    view.name === 'practice' &&
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
  useLayoutEffect(() => {
    if (view.name !== 'guide') {
      document.title = 'numspoken';
      window.scrollTo(0, 0);
    }
  }, [view.name]);
  function closeSettings() {
    if (!settingsOrigin) {
      navigate('practice');
      return;
    }
    navigate({
      guide:
        settingsOrigin.locale === preferences.locale
          ? settingsOrigin.guide
          : guideForLanguage(languageFor(preferences.locale)).slug,
    });
  }
  return (
    <div className={`app-shell${view.name === 'guide' ? ' has-guide' : ''}`}>
      <header className="topbar flex items-center justify-end gap-1">
        <IconButton
          tooltip={false}
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
        {view.name === 'practice' && (
          <IconButton
            label="Number guide"
            path={mdiBookOpenPageVariantOutline}
            onClick={() =>
              navigate({
                guide: guideForLanguage(languageFor(preferences.locale)).slug,
              })
            }
          />
        )}
        {view.name !== 'settings' && (
          <IconButton
            label="Open settings"
            tooltip={false}
            path={mdiCogOutline}
            onClick={() => {
              setSettingsOrigin(
                view.name === 'guide'
                  ? { guide: view.slug, locale: preferences.locale }
                  : null,
              );
              navigate('settings');
            }}
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
          active={view.name === 'practice'}
        />
        {view.name === 'guide' && (
          <Suspense
            fallback={
              <p className="load-state" role="status">
                Loading guide…
              </p>
            }
          >
            <GuideView
              key={view.slug}
              slug={view.slug}
              section={view.section}
            />
          </Suspense>
        )}
        {view.name === 'settings' && (
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
              backLabel={settingsOrigin ? 'Back to guide' : 'Back to practice'}
              onBack={closeSettings}
            />
          </Suspense>
        )}
      </main>
      <BrandFooter />
    </div>
  );
}
