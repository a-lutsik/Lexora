// ============================================================
// LEXORA — AudioButton Domain Component
// Круглая кнопка озвучки (TTS) через ipc.media.playTts.
// Блокирует повторный клик на время воспроизведения (~1.5с).
// Базовый класс .popup-audio-btn определён в styles/global.css,
// size-модификатор — в ./domain.css.
// ============================================================

import { useI18n } from "../../hooks/useI18n";
import { useEffect, useRef, useState } from 'react';
import { ipc } from '../../lib/ipc';
import { cx } from '../../lib/utils';
import { Icon } from '../ui/Icon';
import './domain.css';

type AudioButtonProps = {
  text: string;
  /** When omitted, TTS uses Settings → Learning language. */
  language?: string;
  size?: 'sm' | 'md';
  ariaLabel?: string;
  /** Кастомный обработчик вместо TTS по умолчанию. */
  onSpeak?: (text: string) => void;
  /** Called after playback starts (e.g. return focus to an input). */
  onPlayed?: () => void;
};

const PLAYING_LOCK_MS = 1500;

export function AudioButton({
  text,
  language,
  size = 'md',
  ariaLabel,
  onSpeak,
  onPlayed,
}: AudioButtonProps) {
  const { t: tUi } = useI18n();
  const [isPlaying, setIsPlaying] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleClick = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    if (onSpeak) {
      onSpeak(text);
    } else {
      void ipc.media.playTts(text, language);
    }
    onPlayed?.();
    timeoutRef.current = setTimeout(() => setIsPlaying(false), PLAYING_LOCK_MS);
  };

  return (
    <button
      type="button"
      className={cx('popup-audio-btn', size === 'sm' && 'popup-audio-btn--sm')}
      onClick={handleClick}
      disabled={isPlaying}
      aria-label={ariaLabel ?? tUi("Play pronunciation")}
    >
      <Icon name="volume_up" size={size === 'sm' ? 16 : 17} />
    </button>
  );
}
