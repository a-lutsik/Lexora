import { useI18n } from "../../../hooks/useI18n";
// ============================================================
// LEXORA — Voice transcript / translation card
// Speaker avatar, overflow scroll, play, copy menu, SRS bookmark.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import {
  IconBookmark,
  IconCheck,
  IconCopy,
  IconMore,
  IconPlay,
  IconUser,
} from '../../../components/ui/LuminousIcons';

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
    <article className={`voice-card voice-card--${variant}`}>
      <header className="voice-card-header">
        <div className="voice-card-identity">
          <span className="voice-card-avatar" aria-hidden="true">
            <IconUser size={14} />
            <span className="voice-card-avatar-badge">{speaker}</span>
          </span>
          <h3 className="voice-card-title">{title}</h3>
        </div>
        <div className="voice-card-menu" ref={menuRef}>
          <button
            type="button"
            className="voice-card-icon-btn"
            onClick={() => setMenuOpen((open) => !open)}
            disabled={!text}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label={tUi("{title} actions", { title: title })}
          >
            <IconMore />
          </button>
          {menuOpen && text && (
            <div className="voice-card-menu-panel" role="menu">
              <button
                type="button"
                className="voice-card-menu-item"
                role="menuitem"
                onClick={onCopy}
              >
                {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                {copied ? tUi("Copied") : tUi("Copy text")}
              </button>
            </div>
          )}
        </div>
      </header>

      {text ? (
        <p className="voice-card-body">{text}</p>
      ) : (
        <p className="voice-card-empty">{emptyLabel}</p>
      )}

      <footer className="voice-card-footer">
        <button
          type="button"
          className="voice-play-btn"
          onClick={onPlay}
          disabled={!text || isPlaying}
          aria-label={variant === 'original' ? tUi("Play original transcript") : tUi("Play translation")}
        >
          <IconPlay size={14} />
        </button>
        <span className="voice-card-time">{timestamp ?? '—'}</span>
        {showBookmark ? (
          <button
            type="button"
            className={`voice-bookmark-btn${isBookmarked ? ' is-saved' : ''}`}
            onClick={onBookmark}
            disabled={!text}
            aria-pressed={isBookmarked}
            aria-label={tUi("Save to vocabulary as an SRS card")}
          >
            <IconBookmark filled={isBookmarked} />{tUi("Bookmark (SRS)")}</button>
        ) : (
          <span className="voice-card-live-hint">{tUi("Not saved")}</span>
        )}
      </footer>
    </article>
  );
}
