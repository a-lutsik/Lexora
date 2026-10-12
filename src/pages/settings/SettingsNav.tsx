// ============================================================
// LEXORA — Settings section navigation
// The page is one long scroll (~10 sections); this sticky bar
// jumps to a section so no setting needs a hunt through the page.
// ============================================================

import { useRef } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

/** Space between the sticky bar and the section it jumps to (px). */
const SECTION_GAP = 8;

type SettingsNavItem = {
  /** Section element id on the Settings page. */
  id: string;
  label: string;
};

const SETTINGS_NAV_ITEMS: readonly SettingsNavItem[] = [
  { id: 'settings-ai-models', label: 'AI models' },
  { id: 'settings-ai-usage', label: 'AI usage' },
  { id: 'settings-language', label: 'Language' },
  { id: 'settings-privacy', label: 'Privacy' },
  { id: 'settings-writing-check', label: 'Writing check' },
  { id: 'settings-stickers', label: 'Stickers' },
  { id: 'settings-shortcuts', label: 'Shortcuts' },
  { id: 'settings-backup', label: 'Backup' },
];

export function SettingsNav() {
  const reducedMotion = usePrefersReducedMotion();
  const navRef = useRef<HTMLElement>(null);

  // Scroll so the section starts right under the sticky bar, whatever its
  // height is (the buttons wrap onto a second row in a narrow window).
  const jumpTo = (id: string) => {
    const section = document.getElementById(id);
    const nav = navRef.current;
    const scroller = nav?.closest<HTMLElement>('.settings-page');
    if (!section || !nav || !scroller) return;
    const offset =
      section.getBoundingClientRect().top - scroller.getBoundingClientRect().top - nav.offsetHeight;
    scroller.scrollTo({
      top: scroller.scrollTop + offset - SECTION_GAP,
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <nav ref={navRef} className="settings-nav" aria-label="Settings sections">
      {SETTINGS_NAV_ITEMS.map((item) => (
        <button key={item.id} type="button" className="settings-nav-link" onClick={() => jumpTo(item.id)}>
          {item.label}
        </button>
      ))}
    </nav>
  );
}
