// ============================================================
// LEXORA — Settings sections
// The sections of the Settings page, grouped as the navigation
// shows them; the page renders exactly one at a time.
// ============================================================

export type SettingsSectionId =
  | 'ai-models'
  | 'ai-usage'
  | 'language'
  | 'writing-check'
  | 'stickers'
  | 'appearance'
  | 'privacy'
  | 'shortcuts'
  | 'backup';

type SettingsGroupId = 'ai' | 'learning' | 'desktop' | 'data';

export type SettingsSection = {
  id: SettingsSectionId;
  label: string;
  group: SettingsGroupId;
};

type SettingsGroup = {
  id: SettingsGroupId;
  label: string;
};

export const DEFAULT_SETTINGS_SECTION: SettingsSectionId = 'ai-models';

export const SETTINGS_GROUPS: readonly SettingsGroup[] = [
  { id: 'ai', label: 'AI' },
  // Source string is «Learning tools»: plain «Learning» is the SRS status («Изучается»).
  { id: 'learning', label: 'Learning tools' },
  { id: 'desktop', label: 'Desktop' },
  { id: 'data', label: 'Data' },
];

export const SETTINGS_SECTIONS: readonly SettingsSection[] = [
  { id: 'ai-models', label: 'AI models', group: 'ai' },
  { id: 'ai-usage', label: 'AI usage', group: 'ai' },
  { id: 'language', label: 'Languages', group: 'learning' },
  { id: 'appearance', label: 'Appearance', group: 'desktop' },
  { id: 'writing-check', label: 'Writing check in other apps', group: 'desktop' },
  { id: 'stickers', label: 'Stickers & ambient review', group: 'desktop' },
  { id: 'shortcuts', label: 'Global shortcuts', group: 'desktop' },
  { id: 'privacy', label: 'Privacy', group: 'data' },
  { id: 'backup', label: 'Backup & export', group: 'data' },
];

/** Element id of a section panel on the page (also the deep-link target). */
export function settingsSectionElementId(id: SettingsSectionId): string {
  return `settings-${id}`;
}

export function resolveSettingsSection(value: string | null | undefined): SettingsSectionId {
  const found = SETTINGS_SECTIONS.find((section) => section.id === value);
  return found ? found.id : DEFAULT_SETTINGS_SECTION;
}
