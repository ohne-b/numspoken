import { useState } from 'react';
import { Combobox } from '@base-ui/react/combobox';
import { Icon } from '@mdi/react';
import { mdiCheck, mdiChevronDown, mdiMagnify } from '@mdi/js';
import {
  languages,
  languageFor,
  type Language,
  type LocaleCode,
} from '../../lib/languages';
import { flags } from '../../lib/flags';

function Flag({ country }: { country: string }) {
  return (
    <img
      className="flag"
      src={flags[country]}
      alt=""
      width="24"
      height="18"
      loading="lazy"
    />
  );
}

export function LanguagePicker({
  value,
  onChange,
  onOpenChange,
}: {
  value: LocaleCode;
  onChange: (value: LocaleCode) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [search, setSearch] = useState('');
  const selected = languageFor(value);
  const query = search
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
  const filtered = languages.filter((language) =>
    `${language.label} ${language.code} ${language.aliases}`
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .includes(query),
  );
  const groups = [...new Set(filtered.map((language) => language.group))].map(
    (group) => ({
      value: group,
      items: filtered.filter((language) => language.group === group),
    }),
  );
  return (
    <div className="language-picker">
      <label id="language-label">Practice language</label>
      <Combobox.Root
        items={languages}
        filteredItems={filtered}
        value={selected}
        itemToStringLabel={(item: Language) => item.label}
        onValueChange={(item) => {
          if (item) onChange(item.code);
        }}
        inputValue={search}
        onInputValueChange={setSearch}
        onOpenChange={(open) => {
          onOpenChange(open);
          if (!open) setSearch('');
        }}
      >
        <Combobox.Trigger
          className="language-trigger"
          aria-labelledby="language-label language-value"
        >
          <Flag country={selected.flag} />
          <span id="language-value">{selected.label.replace(' · ', ', ')}</span>
          <Icon path={mdiChevronDown} size={0.8} aria-hidden="true" />
        </Combobox.Trigger>
        <Combobox.Portal>
          <Combobox.Positioner
            className="language-positioner"
            sideOffset={8}
            align="start"
          >
            <Combobox.Popup
              className="language-popup"
              aria-label="Choose a practice language"
            >
              <div className="language-search">
                <Icon path={mdiMagnify} size={0.8} aria-hidden="true" />
                <Combobox.Input
                  aria-label="Search languages"
                  placeholder="Search languages…"
                />
              </div>
              <Combobox.Empty className="language-empty">
                No languages found.
              </Combobox.Empty>
              <Combobox.List className="language-list">
                {groups.map((group) => (
                  <Combobox.Group key={group.value} items={group.items}>
                    <Combobox.GroupLabel className="language-group">
                      {group.value}
                    </Combobox.GroupLabel>
                    {group.items.map((item) => (
                      <Combobox.Item
                        key={item.code}
                        value={item}
                        className="language-option"
                      >
                        <Flag country={item.flag} />
                        <span>{item.label.split(' · ')[1]}</span>
                        <Combobox.ItemIndicator className="language-check">
                          <Icon path={mdiCheck} size={0.7} aria-hidden="true" />
                        </Combobox.ItemIndicator>
                        <span className="sr-only">{item.group}</span>
                      </Combobox.Item>
                    ))}
                  </Combobox.Group>
                ))}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </div>
  );
}
