import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createTextField } from 'material/components/text-field';
import 'material/styles/menu';
import 'material/styles/text-field';
import { Icon } from '@mdi/react';
import { mdiChevronDown, mdiMagnify } from '@mdi/js';
import { languages, languageFor, type LocaleCode } from '../../lib/languages';
import { flags } from '../../lib/flags';

const searchKey = (text: string) =>
  text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();

export function LanguagePicker({
  value,
  onChange,
  onOpenChange,
}: {
  value: LocaleCode;
  onChange: (value: LocaleCode) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const id = useId();
  const mount = useRef<HTMLDivElement>(null);
  const field = useRef<ReturnType<typeof createTextField>>(null);
  const popup = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<LocaleCode | null>(null);
  const selected = languageFor(value);
  const matches = languages.filter((language) =>
    searchKey(
      `${language.label} ${language.code} ${language.aliases}`,
    ).includes(searchKey(query)),
  );
  const groups = new Map<string, typeof matches>();
  for (const language of matches) {
    if (!groups.has(language.group)) groups.set(language.group, []);
    groups.get(language.group)!.push(language);
  }

  function close() {
    // Remove the search from the tab order before the browser handles Tab.
    popup.current?.hidePopover();
    setOpen(false);
    field.current?.input.focus({ preventScroll: true });
  }

  useEffect(() => {
    const trigger = createTextField({
      label: 'Practice language',
      variant: 'outlined',
      readonly: true,
    });
    field.current = trigger;
    trigger.element.classList.add('language-trigger');
    trigger.input.setAttribute('role', 'combobox');
    trigger.input.setAttribute('aria-haspopup', 'listbox');
    trigger.input.setAttribute('aria-expanded', 'false');
    const resetSearch = () => {
      setQuery('');
      setActive(null);
      if (list.current) list.current.scrollTop = 0;
    };
    trigger.input.addEventListener('click', () => {
      resetSearch();
      setOpen((shown) => !shown);
    });
    trigger.input.addEventListener('keydown', (event) => {
      if (!(event instanceof KeyboardEvent)) return;
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        resetSearch();
        setOpen(true);
      }
    });
    mount.current!.append(trigger.element);
    return () => {
      trigger.destroy();
      field.current = null;
    };
  }, []);

  useEffect(() => {
    field.current!.setValue(selected.label.replace(' · ', ', '));
  }, [selected]);

  useLayoutEffect(() => {
    const trigger = field.current;
    const surface = popup.current;
    if (!trigger || !surface) return;
    trigger.input.setAttribute('aria-expanded', String(open));
    if (!open) {
      trigger.input.removeAttribute('aria-controls');
      surface.hidePopover();
      return;
    }
    trigger.input.setAttribute('aria-controls', `${id}-list`);
    surface.showPopover();
    const position = () => {
      const anchor = trigger.element.getBoundingClientRect();
      // Fixed coordinates must also work when the document is zoomed.
      let scale = 1;
      for (
        let node: HTMLElement | null = surface;
        node;
        node = node.parentElement
      )
        scale *= Number(getComputedStyle(node).zoom) || 1;
      const viewport = window.visualViewport;
      const left = viewport?.offsetLeft ?? 0;
      const top = viewport?.offsetTop ?? 0;
      const width = viewport?.width ?? innerWidth;
      const height = viewport?.height ?? innerHeight;
      const below = top + height - anchor.bottom - 8;
      const above = anchor.top - top - 8;
      const upwards = below < 380 * scale && above > below;
      const available = Math.max(80, (upwards ? above : below) - 12);
      const popupWidth = Math.min(anchor.width, width - 24);
      surface.style.width = `${popupWidth / scale}px`;
      surface.style.maxHeight = `${available / scale}px`;
      const popupHeight = surface.getBoundingClientRect().height;
      surface.style.left = `${Math.max(left + 12, Math.min(anchor.left, left + width - popupWidth - 12)) / scale}px`;
      surface.style.top = `${Math.max(top + 12, upwards ? anchor.top - popupHeight - 8 : Math.min(anchor.bottom + 8, top + height - popupHeight - 12)) / scale}px`;
    };
    const scroll = (event: Event) => {
      if (!surface.contains(event.target as Node)) position();
    };
    const dismiss = (event: PointerEvent) => {
      if (
        !event.composedPath().includes(surface) &&
        !event.composedPath().includes(trigger.element)
      )
        setOpen(false);
    };
    position();
    search.current!.focus({ preventScroll: true });
    window.addEventListener('resize', position);
    document.addEventListener('pointerdown', dismiss);
    window.addEventListener('scroll', scroll, true);
    window.visualViewport?.addEventListener('resize', position);
    window.visualViewport?.addEventListener('scroll', position);
    const observer = new ResizeObserver(position);
    observer.observe(trigger.element);
    observer.observe(surface);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', position);
      document.removeEventListener('pointerdown', dismiss);
      window.removeEventListener('scroll', scroll, true);
      window.visualViewport?.removeEventListener('resize', position);
      window.visualViewport?.removeEventListener('scroll', position);
    };
  }, [open, id]);

  useLayoutEffect(() => onOpenChange(open), [open, onOpenChange]);

  useLayoutEffect(() => {
    const option = active && document.getElementById(`${id}-${active}`);
    const container = list.current;
    if (!option || !container) return;
    const item = option.getBoundingClientRect();
    const bounds = container.getBoundingClientRect();
    const scale = bounds.height / container.offsetHeight;
    if (item.top < bounds.top)
      container.scrollTop += (item.top - bounds.top) / scale;
    else if (item.bottom > bounds.bottom)
      container.scrollTop += (item.bottom - bounds.bottom) / scale;
  }, [active, id]);

  return (
    <div className="language-picker">
      <div ref={mount} />
      <img
        className="flag language-flag"
        src={flags[selected.flag]}
        alt=""
        width="24"
        height="18"
      />
      <Icon
        className="language-chevron"
        path={mdiChevronDown}
        size={0.8}
        aria-hidden="true"
      />
      {
        <div
          ref={popup}
          popover="manual"
          className="language-popup mtrl-menu mtrl-menu--visible"
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing || event.keyCode === 229) return;
            if (event.key === 'Escape') {
              event.preventDefault();
              event.stopPropagation();
              close();
            } else if (event.key === 'Tab') {
              close();
            } else if (event.key === 'Enter') {
              event.preventDefault();
              if (active) {
                onChange(active);
                close();
              }
            } else if (
              ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp'].includes(event.key)
            ) {
              event.preventDefault();
              const index = matches.findIndex(
                (language) => language.code === active,
              );
              const step = event.key.startsWith('Page') ? 10 : 1;
              const next = event.key.endsWith('Down')
                ? index + step
                : (index < 0 ? matches.length : index) - step;
              setActive(
                matches[Math.max(0, Math.min(next, matches.length - 1))]
                  ?.code ?? null,
              );
            }
          }}
        >
          <div className="language-search">
            <Icon path={mdiMagnify} size={0.8} aria-hidden="true" />
            <input
              ref={search}
              aria-label="Search languages"
              role="combobox"
              aria-expanded={open}
              aria-controls={`${id}-list`}
              aria-autocomplete="list"
              aria-activedescendant={active ? `${id}-${active}` : undefined}
              placeholder="Search languages…"
              autoComplete="off"
              spellCheck={false}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(null);
                if (list.current) list.current.scrollTop = 0;
              }}
            />
          </div>
          <div
            ref={list}
            id={`${id}-list`}
            role="listbox"
            aria-label="Practice languages"
            className="language-list"
          >
            {[...groups].map(([group, variants]) => (
              <div key={group} role="group" aria-label={group}>
                <div className="language-group" aria-hidden="true">
                  {group}
                </div>
                {variants.map((language) => (
                  <div
                    key={language.code}
                    id={`${id}-${language.code}`}
                    role="option"
                    aria-label={language.label.replace(' · ', ', ')}
                    aria-selected={language.code === value}
                    className={`mtrl-menu__item${language.code === active ? ' mtrl-menu__item--active' : ''}${language.code === value ? ' mtrl-menu__item--selected' : ''}`}
                    onPointerDown={(event) => event.preventDefault()}
                    onClick={() => {
                      onChange(language.code);
                      close();
                    }}
                  >
                    <img
                      className="flag"
                      src={flags[language.flag]}
                      alt=""
                      width="24"
                      height="18"
                    />
                    <span className="mtrl-menu__item-text">
                      {language.label.split(' · ')[1]}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          {!matches.length && (
            <p className="language-empty" role="status">
              No languages found.
            </p>
          )}
        </div>
      }
    </div>
  );
}
