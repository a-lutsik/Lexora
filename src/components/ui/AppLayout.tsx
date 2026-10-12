// ============================================================
// LEXORA — AppLayout Component
// Wraps all main pages with sidebar navigation.
// ============================================================

import { NavLink } from 'react-router-dom';
import { useDueCount } from '../../hooks/useStudyQueue';
import { pluralize } from '../../lib/utils';
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
  const activeLanguageId = useSettingsStore((s) => s.activeLanguageId);
  const { data: dueCount } = useDueCount(activeLanguageId);

  return (
    <div className="app-layout">
      {/* Кнопка, а не <a href="#…">: при HashRouter хэш-ссылка сменила бы маршрут. */}
      <button
        type="button"
        className="skip-link"
        onClick={() => document.getElementById('main-content')?.focus()}
      >
        Skip to main content
      </button>

      <aside className="sidebar" role="navigation" aria-label="Main navigation">
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
            aria-label="Vocabulary"
          >
            <IconNavBook />
            <span className="nav-label">Vocabulary</span>
          </NavLink>

          <NavLink
            to="/study"
            className={({ isActive }) =>
              `sidebar-nav-item${isActive ? ' active' : ''}`
            }
            aria-label={`Study${dueCount ? `, ${dueCount} due` : ''}`}
          >
            <IconNavCards />
            <span className="nav-label">Study</span>
            {dueCount != null && dueCount > 0 && (
              <span className="nav-badge" aria-label={`${pluralize(dueCount, 'card')} due`}>
                {dueCount > 99 ? '99+' : dueCount}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/writing"
            className={({ isActive }) =>
              `sidebar-nav-item${isActive ? ' active' : ''}`
            }
            aria-label="Writing"
          >
            <IconNavPen />
            <span className="nav-label">Writing</span>
          </NavLink>

          <NavLink
            to="/translate"
            className={({ isActive }) =>
              `sidebar-nav-item${isActive ? ' active' : ''}`
            }
            aria-label="Translate"
          >
            <IconNavTranslate />
            <span className="nav-label">Translate</span>
          </NavLink>

          <NavLink
            to="/pronunciation"
            className={({ isActive }) =>
              `sidebar-nav-item${isActive ? ' active' : ''}`
            }
            aria-label="Speak (pronunciation)"
          >
            <IconNavMic />
            <span className="nav-label">Speak</span>
          </NavLink>

          <NavLink
            to="/dialogue"
            className={({ isActive }) =>
              `sidebar-nav-item${isActive ? ' active' : ''}`
            }
            aria-label="AI Dialogue"
          >
            <IconNavDialogue />
            <span className="nav-label">Dialogue</span>
          </NavLink>

          <NavLink
            to="/collections"
            className={({ isActive }) =>
              `sidebar-nav-item${isActive ? ' active' : ''}`
            }
            aria-label="Collections"
          >
            <IconNavCollections />
            <span className="nav-label">Collections</span>
          </NavLink>

          <NavLink
            to="/stats"
            className={({ isActive }) =>
              `sidebar-nav-item${isActive ? ' active' : ''}`
            }
            aria-label="Stats (statistics)"
          >
            <IconNavStats />
            <span className="nav-label">Stats</span>
          </NavLink>
        </nav>

        <div className="sidebar-divider" role="separator" />

        <div className="sidebar-settings">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `sidebar-nav-item${isActive ? ' active' : ''}`
            }
            aria-label="Settings"
          >
            <IconNavSettings />
            <span className="nav-label">Settings</span>
          </NavLink>
        </div>
      </aside>

      <main className="app-content" id="main-content" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
