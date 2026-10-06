// ============================================================
// LEXORA — WordCard Domain Component
// Компактная карточка слова: текст + озвучка, фонетика,
// часть речи / SRS-статус, перевод.
// ============================================================

import { PosBadge, SrsStatusBadge } from '../ui/Badge';
import { AudioButton } from './AudioButton';
import type { PartOfSpeech, SrsStatus } from '../../lib/types';
import './domain.css';

type WordCardProps = {
  text: string;
  phonetic?: string | null;
  partOfSpeech?: PartOfSpeech | null;
  translation?: string | null;
  status?: SrsStatus | null;
  /** Language of the spoken text. Omit to use Settings → Learning language. */
  language?: string;
  /** Кастомный обработчик озвучки вместо TTS по умолчанию. */
  onSpeak?: (text: string) => void;
};

export function WordCard({
  text,
  phonetic = null,
  partOfSpeech = null,
  translation = null,
  status = null,
  language,
  onSpeak,
}: WordCardProps) {
  return (
    <div className="word-card">
      <div className="word-card-main">
        <span className="word-card-text">{text}</span>
        <AudioButton
          text={text}
          language={language}
          size="sm"
          {...(onSpeak ? { onSpeak } : {})}
        />
      </div>

      {phonetic && <span className="word-card-phonetic phonetic">{phonetic}</span>}

      {(partOfSpeech !== null || status !== null) && (
        <div className="word-card-badges">
          <PosBadge pos={partOfSpeech} />
          {status !== null && <SrsStatusBadge status={status} />}
        </div>
      )}

      {translation && <div className="word-card-translation">{translation}</div>}
    </div>
  );
}
