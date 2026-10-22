// ============================================================
// LEXORA — Settings → Appearance (light / dark / system)
// Segmented radio group bound to useTheme(); the choice is kept
// in the shared UI store, so every window follows it.
// ============================================================

import { useRef, type KeyboardEvent } from 'react';
import { useI18n } from '../../hooks/useI18n';
import { useTheme } from '../../hooks/useTheme';
import { THEME_PREFERENCES, type ThemePreference } from '../../lib/theme';

type ThemeSettingProps = {
  /** Id of the visible row label that names the group. */
  labelledBy: string;
};

export function ThemeSetting({ labelledBy }: ThemeSettingProps) {
  const { t: tUi } = useI18n();
  const { theme, setTheme } = useTheme();
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Literal calls keep the messages visible to the i18n audit.
  const labelOf = (value: ThemePreference): string => {
    switch (value) {
      case 'light':
        return tUi("Light");
      case 'dark':
        return tUi("Dark");
      case 'system':
        return tUi("Follow system");
    }
  };

  // Radio-group keyboard model: arrows move and select, Tab leaves the group.
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0;
    if (step === 0) return;
    event.preventDefault();
    const count = THEME_PREFERENCES.length;
    const nextIndex = (index + step + count) % count;
    const next = THEME_PREFERENCES[nextIndex];
    if (!next) return;
    setTheme(next);
    itemRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="seg" role="radiogroup" aria-labelledby={labelledBy}>
      {THEME_PREFERENCES.map((value, index) => {
        const checked = theme === value;
        return (
          <button
            key={value}
            ref={(node) => {
              itemRefs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            className="seg__item"
            onClick={() => setTheme(value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {labelOf(value)}
          </button>
        );
      })}
    </div>
  );
}
