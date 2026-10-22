import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — AppLayout Component (Lingora)
// Сайдбар 220px: логотип, языковая пара, группы Words / Practice / Tools,
// Settings внизу. Иконки — одноцветные Material Symbols.
// ============================================================

import { NavLink } from 'react-router-dom';
import { useDueCount } from '../../hooks/useStudyQueue';
import { useSettings } from '../../hooks/useSettings';
import { useSettingsStore } from '../../stores/settingsStore';
import { normalizeLangCode } from '../../lib/languages';
import { cx } from '../../lib/utils';
import { Logo } from './Logo';
import { useSessionStore } from '../../stores/sessionStore';
import { useTheme } from '../../hooks/useTheme';
import type { ThemePreference } from '../../lib/theme';
import { Icon } from './Icon';
import './AppLayout.css';

type AppLayoutProps = {
  children: React.ReactNode;
};

type NavItem = {
  to: string;
  icon: string;
  label: string;
  ariaLabel?: string;
};

const THEME_ICON: Record<ThemePreference, string> = { light: 'light_mode', dark: 'dark_mode', system: 'contrast' };
const THEME_NEXT: Record<ThemePreference, ThemePreference> = { light: 'dark', dark: 'system', system: 'light' };

function navClass({ isActive }: { isActive: boolean }): string {
  return cx('sidebar-nav-item', isActive && 'active');
}

export function AppLayout({ children }: AppLayoutProps) {
  const { t: tUi } = useI18n();
  const activeLanguageId = useSettingsStore((s) => s.activeLanguageId);
  const { data: dueCount } = useDueCount(activeLanguageId);
  const { data: settings } = useSettings();
  // Фокус-режим: во время учебной сессии сайдбар скрыт (макет 1d).
  const focusMode = useSessionStore((s) => s.isActive);
  const { theme, setTheme } = useTheme();
  const themeLabel: Record<ThemePreference, string> = {
    light: tUi('Light'),
    dark: tUi('Dark'),
    system: tUi('Follow system'),
  };

  const sourceCode = (normalizeLangCode(settings?.primaryLanguage) ?? 'en').toUpperCase();
  const targetCode = (normalizeLangCode(settings?.interfaceLanguage) ?? 'ru').toUpperCase();

  const groups: { label: string; items: NavItem[] }[] = [
    {
      label: tUi('Words'),
      items: [
        { to: '/vocabulary', icon: 'menu_book', label: tUi('Vocabulary') },
        { to: '/collections', icon: 'collections_bookmark', label: tUi('Collections') },
      ],
    },
    {
      label: tUi('Practice'),
      items: [
        {
          to: '/study',
          icon: 'style',
          label: tUi('Study'),
          ariaLabel: dueCount ? tUi('Study, {count} due', { count: dueCount }) : tUi('Study'),
        },
        { to: '/writing', icon: 'edit_note', label: tUi('Writing') },
        { to: '/pronunciation', icon: 'mic', label: tUi('Speak'), ariaLabel: tUi('Speak (pronunciation)') },
        { to: '/dialogue', icon: 'forum', label: tUi('Dialogue'), ariaLabel: tUi('AI Dialogue') },
      ],
    },
    {
      label: tUi('Tools'),
      items: [
        { to: '/translate', icon: 'translate', label: tUi('Translate') },
        { to: '/stats', icon: 'bar_chart', label: tUi('Stats'), ariaLabel: tUi('Stats (statistics)') },
      ],
    },
  ];

  return (
    <div className={cx('app-layout', focusMode && 'app-layout--focus')}>
      {/* Кнопка, а не <a href="#…">: при HashRouter хэш-ссылка сменила бы маршрут. */}
      <button
        type="button"
        className="skip-link"
        onClick={() => document.getElementById('main-content')?.focus()}
      >{tUi("Skip to main content")}</button>

      <aside className="sidebar" role="navigation" aria-label={tUi("Main navigation")}>
        <div className="sidebar-chrome" data-tauri-drag-region />

        <div className="sidebar-logo" data-tauri-drag-region>
          <Logo size={26} />
        </div>

        <NavLink
          to="/settings"
          className="sidebar-langpair"
          aria-label={tUi('Language pair: {source} to {target}', { source: sourceCode, target: targetCode })}
        >
          <span className="sidebar-langpair-codes">
            <span>{sourceCode}</span>
            <Icon name="arrow_forward" size={14} className="icon--muted" />
            <span>{targetCode}</span>
          </span>
          <span className="spacer" />
          <Icon name="swap_horiz" size={17} className="icon--muted" />
        </NavLink>

        <nav className="sidebar-nav">
          {groups.map((group) => (
            <div className="sidebar-group" key={group.label}>
              <div className="sidebar-group-label">{group.label}</div>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={navClass}
                  aria-label={item.ariaLabel ?? item.label}
                >
                  <Icon name={item.icon} size={19} className="nav-icon" />
                  <span className="nav-label">{item.label}</span>
                  {item.to === '/study' && dueCount != null && dueCount > 0 && (
                    <span
                      className="count-pill nav-badge"
                      aria-label={dueCount === 1
                        ? tUi("{count} card due", { count: dueCount })
                        : tUi("{count} cards due", { count: dueCount })}
                    >
                      {dueCount > 99 ? '99+' : dueCount}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-settings">
          <NavLink to="/settings" className={navClass} aria-label={tUi("Settings")}>
            <Icon name="settings" size={19} className="nav-icon" />
            <span className="nav-label">{tUi("Settings")}</span>
          </NavLink>
          <button
            type="button"
            className="sidebar-theme-toggle"
            onClick={() => setTheme(THEME_NEXT[theme])}
            aria-label={tUi('Theme: {theme}. Switch theme', { theme: themeLabel[theme] })}
            title={themeLabel[theme]}
          >
            <Icon name={THEME_ICON[theme]} size={18} />
          </button>
        </div>
      </aside>

      <main className="app-content" id="main-content" tabIndex={-1}>
        {/* macOS overlay title bar: the top strip of the page drags the window. */}
        <div className="window-drag-strip" data-tauri-drag-region aria-hidden="true" />
        {children}
      </main>
    </div>
  );
}
