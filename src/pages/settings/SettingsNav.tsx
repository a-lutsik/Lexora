import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — Settings section navigation
// Second column next to the app sidebar: sections grouped by
// topic, exactly one open at a time (no long scroll), with a
// filter box so a setting is found by name. An amber dot marks
// a section that needs attention (e.g. a role waiting for a key).
// ============================================================

import { useId, useState } from 'react';
import { Icon } from '../../components/ui/Icon';
import { SETTINGS_GROUPS, SETTINGS_SECTIONS, type SettingsSection, type SettingsSectionId } from './settingsSections';

type SettingsNavProps = {
  active: SettingsSectionId;
  onSelect: (id: SettingsSectionId) => void;
  /** Sections that need the user's attention, with a short reason for screen readers. */
  attention?: Partial<Record<SettingsSectionId, string>>;
};

export function SettingsNav({ active, onSelect, attention = {} }: SettingsNavProps) {
  const { t: tUi } = useI18n();
  const [query, setQuery] = useState('');
  const searchId = useId();
  const reasonIdBase = useId();

  const needle = query.trim().toLocaleLowerCase();
  const matches = (section: SettingsSection) =>
    needle === '' || tUi(section.label).toLocaleLowerCase().includes(needle);
  const visibleGroups = SETTINGS_GROUPS.map((group) => ({
    ...group,
    sections: SETTINGS_SECTIONS.filter((section) => section.group === group.id && matches(section)),
  })).filter((group) => group.sections.length > 0);

  return (
    <nav className="settings-nav" aria-label={tUi("Settings sections")}>
      <div className="field field--sm settings-nav-search">
        <Icon name="search" size={18} className="field__icon" />
        <input
          id={searchId}
          type="search"
          className="field__input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={tUi("Search settings")}
          aria-label={tUi("Search settings")}
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      {visibleGroups.map((group) => (
        <div key={group.id} className="settings-nav-group" role="group" aria-label={tUi(group.label)}>
          <p className="settings-nav-group-title" aria-hidden="true">{tUi(group.label)}</p>
          {group.sections.map((section) => {
            const isActive = section.id === active;
            const reason = attention[section.id];
            const reasonId = `${reasonIdBase}-${section.id}`;
            return (
              <button
                key={section.id}
                type="button"
                className={`settings-nav-link${isActive ? ' is-active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                aria-describedby={reason ? reasonId : undefined}
                onClick={() => onSelect(section.id)}
              >
                <span className="settings-nav-link-label">{tUi(section.label)}</span>
                {reason && (
                  <>
                    <span className="settings-nav-dot" aria-hidden="true" />
                    {/* Hidden, so it stays out of the link name; aria-describedby still reads it. */}
                    <span id={reasonId} hidden>{reason}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      ))}

      {visibleGroups.length === 0 && (
        <p className="settings-nav-empty inline-note" role="status">{tUi("No settings match your search")}</p>
      )}
    </nav>
  );
}
