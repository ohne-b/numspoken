import { useEffect, useRef, useState } from 'react';
import { Switch, Radios, Radio } from 'material/react';
import { mdiArrowLeft } from '@mdi/js';
import { validRange, type Preferences } from '../../app/preferences';
import { IconButton } from '../../ui/icon-button';
import { LanguagePicker } from './language-picker';
import { MAX_NUMBER } from '../../lib/random-number';
import { RangeField } from './range-field';

const rangeLimit = MAX_NUMBER.toLocaleString('en-US');

function numberError(value: string) {
  if (!value) return 'Enter a number.';
  if (Number(value) < 0) return 'Min 0';
  if (!/^\d+$/.test(value)) return 'Use whole numbers.';
  if (Number(value) > MAX_NUMBER) return `Max ${rangeLimit}`;
  return '';
}

export default function SettingsView({
  preferences,
  update,
  storageAvailable,
  backLabel,
  onBack,
}: {
  preferences: Preferences;
  update: (changes: Partial<Preferences>) => void;
  storageAvailable: boolean;
  backLabel: string;
  onBack: () => void;
}) {
  const [range, setRange] = useState({
    min: String(preferences.min),
    max: String(preferences.max),
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editedBound, setEditedBound] = useState<'min' | 'max'>('min');
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    titleRef.current?.focus();
  }, []);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pickerOpen && !event.defaultPrevented) {
        event.preventDefault();
        onBack();
      }
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [pickerOpen, onBack]);
  const errors = { min: numberError(range.min), max: numberError(range.max) };
  if (!errors.min && !errors.max && Number(range.min) > Number(range.max))
    errors[editedBound] =
      editedBound === 'min'
        ? 'Must be no higher than To.'
        : 'Must be no lower than From.';
  function changeRange(part: 'min' | 'max', value: string) {
    const next = { ...range, [part]: value };
    setRange(next);
    setEditedBound(part);
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
          label={backLabel}
          tooltip={false}
          path={mdiArrowLeft}
          onClick={onBack}
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
            <RangeField
              label="From"
              value={range.min}
              error={errors.min}
              supportingText="Min 0"
              onChange={(value) => changeRange('min', value)}
            />
            <span aria-hidden="true">—</span>
            <RangeField
              label="To"
              value={range.max}
              error={errors.max}
              supportingText={`Max ${rangeLimit}`}
              onChange={(value) => changeRange('max', value)}
            />
          </div>
        </fieldset>
        <div className="switch-row">
          <div>
            <label htmlFor="forgiving">Forgiving spelling</label>
            <p className="field-help">
              Allow accents and separator punctuation to differ.
            </p>
          </div>
          <Switch
            id="forgiving"
            className="switch"
            label="Forgiving spelling"
            checked={preferences.forgiving}
            onChange={(event) => update({ forgiving: event.detail.checked })}
          />
        </div>
        <fieldset>
          <legend>Practice mode</legend>
          <Radios
            className="radio-options"
            name="mode"
            direction="horizontal"
            aria-label="Practice mode"
            value={preferences.mode}
            onChange={(event) => {
              const mode = event.detail.value;
              if (mode === 'continuous' || mode === 'round') update({ mode });
            }}
          >
            {(['continuous', 'round'] as const).map((mode) => (
              <Radio
                key={mode}
                value={mode}
                label={mode === 'continuous' ? 'Continuous' : 'Fixed round'}
              />
            ))}
          </Radios>
        </fieldset>
        {preferences.mode === 'round' && (
          <fieldset>
            <legend>Numbers per round</legend>
            <Radios
              className="radio-options"
              name="round-length"
              direction="horizontal"
              aria-label="Numbers per round"
              value={String(preferences.roundLength)}
              onChange={(event) => {
                const roundLength = Number(event.detail.value);
                if (
                  roundLength === 10 ||
                  roundLength === 20 ||
                  roundLength === 50
                )
                  update({ roundLength });
              }}
            >
              {([10, 20, 50] as const).map((roundLength) => (
                <Radio
                  key={roundLength}
                  value={String(roundLength)}
                  label={String(roundLength)}
                />
              ))}
            </Radios>
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
