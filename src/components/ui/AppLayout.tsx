import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — AppLayout Component
// Wraps all main pages with sidebar navigation.
// ============================================================

import { NavLink } from 'react-router-dom';
import { useDueCount } from '../../hooks/useStudyQueue';
import { useSettingsStore } from '../../stores/settingsStore';
import { LogoMark } from './Logo';
import {
  IconNavBook,
  IconNavCards,
  IconNavCollections,
  IconNavDialogue,
  IconNavMic,
  IconNavPen,
  IconNavSettings,
  IconNavStats,
  IconNavTranslate,
} from './LuminousIcons';
import './AppLayout.css';

type AppLayoutProps = {
  children: React.ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  const { t: tUi } = useI18n();
  const activeLanguageId = useSettingsStore((s) => s.activeLanguageId);
  const { data: dueCount } = useDueCount(activeLanguageId);

  return (
    <div className="app-layout">
      {/* Кнопка, а не <a href="#…">: при HashRouter хэш-ссылка сменила бы маршрут. */}
      <button
        type="button"
        className="skip-link"
        onClick={() => document.getElementById('main-content')?.focus()}
      >{tUi("Skip to main content")}</button>

      <aside className="sidebar" role="navigation" aria-label={tUi("Main navigation")}>
        <div className="sidebar-logo" data-tauri-drag-region>
          <div className="sidebar-logo-mark" aria-hidden="true">
            <LogoMark size={32} />
          </div>
          <span className="sidebar-logo-text">LEXORA</span>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/vocabulary"
            className={({ isActive }) =>
              `sidebar-nav-item${isActive ? ' active' : ''}`
            }
            aria-label={tUi("Vocabulary")}
          >
            <IconNavBook />
            <span className="nav-label">{tUi("Vocabulary")}</span>
          </NavLink>

          <NavLink
            to="/study"
            className={({ isActive }) =>
              `sidebar-nav-item${isActive ? ' active' : ''}`
            }
            aria-label={dueCount ? tUi("Study, {count} due", { count: dueCount }) : tUi("Study")}
          >
            <IconNavCards />
            <span className="nav-label">{tUi("Study")}</span>
            {dueCount != null && dueCount > 0 && (
              <span className="nav-badge" aria-label={dueCount === 1
                ? tUi("{count} card due", { count: dueCount })
                : tUi("{count} cards due", { count: dueCount })}>
                {dueCount > 99 ? '99+' : dueCount}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/writing"
            className={({ isActive }) =>
              `sidebar-nav-item${isActive ? ' active' : ''}`
            }
            aria-label={tUi("Writing")}
          >
            <IconNavPen />
            <span className="nav-label">{tUi("Writing")}</span>
          </NavLink>

          <NavLink
            to="/translate"
            className={({ isActive }) =>
              `sidebar-nav-item${isActive ? ' active' : ''}`
            }
            aria-label={tUi("Translate")}
          >
            <IconNavTranslate />
            <span className="nav-label">{tUi("Translate")}</span>
          </NavLink>

          <NavLink
            to="/pronunciation"
            className={({ isActive }) =>
              `sidebar-nav-item${isActive ? ' active' : ''}`
            }
            aria-label={tUi("Speak (pronunciation)")}
          >
            <IconNavMic />
            <span className="nav-label">{tUi("Speak")}</span>
          </NavLink>

          <NavLink
            to="/dialogue"
            className={({ isActive }) =>
              `sidebar-nav-item${isActive ? ' active' : ''}`
            }
            aria-label={tUi("AI Dialogue")}
          >
            <IconNavDialogue />
            <span className="nav-label">{tUi("Dialogue")}</span>
          </NavLink>

          <NavLink
            to="/collections"
            className={({ isActive }) =>
              `sidebar-nav-item${isActive ? ' active' : ''}`
            }
            aria-label={tUi("Collections")}
          >
            <IconNavCollections />
            <span className="nav-label">{tUi("Collections")}</span>
          </NavLink>

          <NavLink
            to="/stats"
            className={({ isActive }) =>
              `sidebar-nav-item${isActive ? ' active' : ''}`
            }
            aria-label={tUi("Stats (statistics)")}
          >
            <IconNavStats />
            <span className="nav-label">{tUi("Stats")}</span>
          </NavLink>
        </nav>

        <div className="sidebar-divider" role="separator" />

        <div className="sidebar-settings">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `sidebar-nav-item${isActive ? ' active' : ''}`
            }
            aria-label={tUi("Settings")}
          >
            <IconNavSettings />
            <span className="nav-label">{tUi("Settings")}</span>
          </NavLink>
        </div>
      </aside>

      <main className="app-content" id="main-content" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
