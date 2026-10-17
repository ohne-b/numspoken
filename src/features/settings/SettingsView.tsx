import { useEffect, useRef, useState } from 'react';
import { Switch } from '@base-ui/react/switch';
import { mdiArrowLeft } from '@mdi/js';
import { validRange, type Preferences } from '../../app/preferences';
import { navigate } from '../../app/useView';
import { IconButton } from '../../ui/IconButton';
import { LanguagePicker } from './LanguagePicker';

export default function SettingsView({
  preferences,
  update,
  storageAvailable,
}: {
  preferences: Preferences;
  update: (changes: Partial<Preferences>) => void;
  storageAvailable: boolean;
}) {
  const [range, setRange] = useState({
    min: String(preferences.min),
    max: String(preferences.max),
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    titleRef.current?.focus();
  }, []);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pickerOpen && !event.defaultPrevented) {
        event.preventDefault();
        navigate('practice');
      }
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [pickerOpen]);
  const rangeValid =
    /^\d+$/.test(range.min) &&
    /^\d+$/.test(range.max) &&
    validRange(Number(range.min), Number(range.max));
  function changeRange(part: 'min' | 'max', value: string) {
    const next = { ...range, [part]: value };
    setRange(next);
    if (
      /^\d+$/.test(next.min) &&
      /^\d+$/.test(next.max) &&
      validRange(Number(next.min), Number(next.max))
    )
      update({ min: Number(next.min), max: Number(next.max) });
  }
  return (
    <section className="settings-view" aria-labelledby="settings-title">
      <div className="settings-heading">
        <IconButton
          label="Back to practice"
          path={mdiArrowLeft}
          onClick={() => navigate('practice')}
        />
        <h1 id="settings-title" tabIndex={-1} ref={titleRef}>
          Settings
        </h1>
      </div>
      <div className="settings-fields">
        <LanguagePicker
          value={preferences.locale}
          onChange={(locale) => update({ locale })}
          onOpenChange={setPickerOpen}
        />
        <fieldset>
          <legend>Number range</legend>
          <div className="range-fields">
            <label>
              From
              <input
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
                value={range.min}
                aria-invalid={!rangeValid}
                aria-describedby="range-help"
                onChange={(event) => changeRange('min', event.target.value)}
              />
            </label>
            <span aria-hidden="true">—</span>
            <label>
              To
              <input
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
                value={range.max}
                aria-invalid={!rangeValid}
                aria-describedby="range-help"
                onChange={(event) => changeRange('max', event.target.value)}
              />
            </label>
          </div>
          <p
            id="range-help"
            className={`field-help ${rangeValid ? '' : 'field-error'}`}
          >
            {rangeValid
              ? 'Whole numbers from 0 to 999,999.'
              : 'Use a valid range from 0 to 999,999. Your last valid range is kept.'}
          </p>
        </fieldset>
        <div className="switch-row">
          <div>
            <label htmlFor="forgiving">Forgiving spelling</label>
            <p className="field-help">
              Allow accents and separator punctuation to differ.
            </p>
          </div>
          <Switch.Root
            id="forgiving"
            className="switch"
            checked={preferences.forgiving}
            onCheckedChange={(forgiving) => update({ forgiving })}
          >
            <Switch.Thumb className="switch-thumb" />
          </Switch.Root>
        </div>
        <fieldset>
          <legend>Practice mode</legend>
          <div className="segmented">
            {(['continuous', 'round'] as const).map((mode) => (
              <label key={mode}>
                <input
                  type="radio"
                  name="mode"
                  checked={preferences.mode === mode}
                  onChange={() => update({ mode })}
                />
                <span>
                  {mode === 'continuous' ? 'Continuous' : 'Fixed round'}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        {preferences.mode === 'round' && (
          <fieldset>
            <legend>Numbers per round</legend>
            <div className="segmented">
              {([10, 20, 50] as const).map((roundLength) => (
                <label key={roundLength}>
                  <input
                    type="radio"
                    name="roundLength"
                    checked={preferences.roundLength === roundLength}
                    onChange={() => update({ roundLength })}
                  />
                  <span>{roundLength}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
      </div>
      {!storageAvailable && (
        <p className="settings-note" role="status">
          Preferences can’t be saved in this browser. They work for this visit.
        </p>
      )}
    </section>
  );
}
