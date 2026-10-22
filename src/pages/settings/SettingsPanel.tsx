// ============================================================
// LEXORA — Settings panel frame
// The one open section: title, optional summary and actions in
// the header, then the section's own cards.
// ============================================================

import type { ReactNode } from 'react';

type SettingsPanelProps = {
  /** Element id of the panel (also what the nav deep-links to). */
  id: string;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
};

export function SettingsPanel({ id, title, subtitle, actions, children }: SettingsPanelProps) {
  const titleId = `${id}-title`;
  return (
    <section id={id} className="settings-panel animate-fade-in" aria-labelledby={titleId}>
      <header className="settings-panel-head">
        <div className="settings-panel-titles">
          <h2 id={titleId} className="settings-panel-title">{title}</h2>
          {subtitle != null && subtitle !== false && (
            <p className="settings-panel-subtitle">{subtitle}</p>
          )}
        </div>
        {actions != null && actions !== false && <div className="settings-panel-actions">{actions}</div>}
      </header>
      {children}
    </section>
  );
}
