import { useI18n } from "../../../hooks/useI18n";
// ============================================================
// LEXORA — Voice transcript / translation card
// Speaker badge, play, copy menu, SRS bookmark. Translation in Literata.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { IconButton } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';

type VoiceTranscriptCardProps = {
  variant: 'original' | 'translation';
  languageName: string;
  text: string | null;
  timestamp: string | null;
  isPlaying: boolean;
  isBookmarked: boolean;
  copied: boolean;
  onPlay: () => void;
  onBookmark: () => void;
  onCopy: () => void;
  emptyHint?: string;
  showBookmark?: boolean;
};

export function VoiceTranscriptCard({
  variant,
  languageName,
  text,
  timestamp,
  isPlaying,
  isBookmarked,
  copied,
  onPlay,
  onBookmark,
  onCopy,
  emptyHint,
  showBookmark = true,
}: VoiceTranscriptCardProps) {
  const { t: tUi } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const speaker = variant === 'original' ? 'A' : 'B';
  const title = variant === 'original' ? tUi('Original ({language})', { language: languageName }) : tUi('Translation ({language})', { language: languageName });
  const emptyLabel =
    emptyHint ? tUi(emptyHint) :
    (variant === 'original'
      ? tUi('Transcript will appear here after you speak or upload audio.')
      : tUi('Translation will appear here after transcription.'));

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  useEffect(() => {
    if (copied) setMenuOpen(false);
  }, [copied]);

  return (
    <article className={`card voice-card voice-card--${variant}`}>
      <header className="voice-card__head">
        <span className="voice-card__speaker" aria-hidden="true">{speaker}</span>
        <h3 className="voice-card__title">{title}</h3>
        <div className="voice-card__menu" ref={menuRef}>
          <button
            type="button"
            className="btn btn--icon btn--ghost btn--sm"
            onClick={() => setMenuOpen((open) => !open)}
            disabled={!text}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label={tUi("{title} actions", { title: title })}
          >
            <Icon name="more_horiz" size={17} />
          </button>
          {menuOpen && text && (
            <div className="popover voice-card__menu-panel" role="menu">
              <button
                type="button"
                className="menu-item"
                role="menuitem"
                onClick={onCopy}
              >
                <Icon name={copied ? 'check' : 'content_copy'} size={17} className="menu-item__icon" />
                <span className="menu-item__label">{copied ? tUi("Copied") : tUi("Copy text")}</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {text ? (
        <p className="voice-card__body" dir="auto">{text}</p>
      ) : (
        <p className="voice-card__empty">{emptyLabel}</p>
      )}

      <footer className="voice-card__foot">
        <IconButton
          icon={<Icon name="play_arrow" size={18} />}
          size="sm"
          onClick={onPlay}
          disabled={!text || isPlaying}
          aria-label={variant === 'original' ? tUi("Play original transcript") : tUi("Play translation")}
        />
        <span className="voice-card__time">{timestamp ?? '—'}</span>
        <span className="spacer" />
        {showBookmark ? (
          <button
            type="button"
            className={`btn btn--ghost btn--sm voice-bookmark-btn${isBookmarked ? ' is-saved' : ''}`}
            onClick={onBookmark}
            disabled={!text}
            aria-pressed={isBookmarked}
            aria-label={tUi("Save to vocabulary as an SRS card")}
          >
            <Icon name={isBookmarked ? 'bookmark_added' : 'bookmark_add'} size={17} />
            <span>{tUi("Bookmark (SRS)")}</span>
          </button>
        ) : (
          <span className="voice-card__hint">{tUi("Not saved")}</span>
        )}
      </footer>
    </article>
  );
}
