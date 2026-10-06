// ============================================================
// LEXORA — Word Detail Modal / Drawer
// Full inspection: phonetic, translations, examples, SRS status, notes.
// ============================================================

import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listen } from '@tauri-apps/api/event';
import { useVocabularyEntry, useToggleFavorite } from '../../hooks/useVocabulary';
import { useSettings } from '../../hooks/useSettings';
import { useLanguages, useLanguageOptions } from '../../hooks/useLanguages';
import { useTranslate } from '../../hooks/useTranslate';
import { LanguageSelect } from '../../components/ui/LanguageSelect';
import { SrsStatusBadge, PosBadge } from '../../components/ui/Badge';
import { Button, IconButton } from '../../components/ui/Button';
import { AudioButton } from '../../components/domain/AudioButton';
import { AssociatedImage } from '../../components/domain/AssociatedImage';
import { FreqBadge } from '../../components/domain/FreqBadge';
import { ipc } from '../../lib/ipc';
import { STALE_TIME, QUERY_KEYS } from '../../lib/constants';
import { formatImageProviderError } from '../../lib/inlineAssistant';
import type { CardEnrichEvent } from '../../lib/types';
import './vocabulary.css';

type WordDetailProps = {
  id: number;
  onClose: () => void;
};

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'var(--color-warn)' : 'none'} stroke={filled ? 'var(--color-warn)' : 'currentColor'} strokeWidth={2}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function WordDetail({ id, onClose }: WordDetailProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: entry, isLoading } = useVocabularyEntry(id);
  const toggleFavMutation = useToggleFavorite();
  const { data: settings } = useSettings();
  const { data: languages } = useLanguages();
  const translateMutation = useTranslate();
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [imageRefreshing, setImageRefreshing] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageNonce, setImageNonce] = useState(0);
  const [viewTarget, setViewTarget] = useState(settings?.interfaceLanguage ?? 'ru');
  const dialogRef = useRef<HTMLDivElement>(null);
  const langOptions = useLanguageOptions([viewTarget, settings?.interfaceLanguage ?? 'ru']);

  useEffect(() => {
    if (settings?.interfaceLanguage) {
      setViewTarget(settings.interfaceLanguage);
    }
  }, [settings?.interfaceLanguage]);

  const targetLangId = useMemo(() => {
    return languages?.find((l) => l.code === viewTarget)?.id ?? null;
  }, [languages, viewTarget]);

  const sourceLangCode = useMemo(() => {
    if (!entry || !languages) return settings?.primaryLanguage ?? 'en';
    return languages.find((l) => l.id === entry.lexeme.languageId)?.code
      ?? settings?.primaryLanguage
      ?? 'en';
  }, [entry, languages, settings?.primaryLanguage]);

  const mainTranslation = useMemo(() => {
    if (!entry) return 'No translation';
    if (targetLangId != null) {
      const match = entry.translations.find((t) => t.targetLanguageId === targetLangId);
      if (match) return match.translatedText;
    }
    return entry.translations[0]?.translatedText ?? 'No translation';
  }, [entry, targetLangId]);

  const needsFetch =
    Boolean(entry) &&
    targetLangId != null &&
    !entry!.translations.some((t) => t.targetLanguageId === targetLangId);

  useEffect(() => {
    if (!needsFetch || !entry) return;
    translateMutation.mutate(
      {
        text: entry.lexeme.text,
        sourceLanguage: sourceLangCode,
        targetLanguage: viewTarget,
        contextSentence: null,
      },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VOCABULARY_ENTRY, id] });
          void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VOCABULARY] });
        },
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsFetch, viewTarget, entry?.id]);

  const lexemeId = entry?.lexemeId;
  const { data: fetchedImagePath, isLoading: isImageLoading } = useQuery({
    queryKey: ['media', 'image', lexemeId],
    queryFn: () => ipc.media.getImage(lexemeId ?? 0),
    staleTime: STALE_TIME.LONG,
    enabled: lexemeId != null && lexemeId > 0,
  });
  const imagePath = fetchedImagePath ?? entry?.imagePath ?? null;

  useEffect(() => {
    if (lexemeId == null) return;
    const unlistenPromise = listen<CardEnrichEvent>('lexora:card-enrich', (event) => {
      if (event.payload.lexemeId !== lexemeId) return;
      if (event.payload.imagePath) {
        queryClient.setQueryData(['media', 'image', lexemeId], event.payload.imagePath);
      }
    });
    return () => {
      void unlistenPromise.then((u) => u());
    };
  }, [lexemeId, queryClient]);

  useEffect(() => {
    if (entry?.notes) {
      setNotes(entry.notes);
    }
  }, [entry?.notes]);

  // A11y: при открытии фокус на диалог, Esc закрывает,
  // при закрытии фокус возвращается к прежнему элементу.
  useEffect(() => {
    if (!entry) return;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose, entry]);

  const handleSaveNotes = async () => {
    if (!entry) return;
    setIsSavingNotes(true);
    try {
      await ipc.vocabulary.updateNotes(entry.id, notes);
    } finally {
      setIsSavingNotes(false);
    }
  };

  if (isLoading || !entry) {
    return (
      <div className="word-detail-overlay word-detail-overlay--loading">
        <div className="text-muted text-sm animate-pulse">Loading word details…</div>
      </div>
    );
  }

  const { lexeme, reviewState } = entry;

  return (
    // Клик по backdrop закрывает модалку (мышь); клавиатурная альтернатива — Esc
    // (обработчик в useEffect выше), при открытии фокус переводится на диалог.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <div
      className="word-detail-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="word-detail-title"
    >
      <div
        ref={dialogRef}
        className="word-detail-dialog"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="word-detail-header">
          <div className="word-detail-badges">
            <PosBadge pos={lexeme.partOfSpeech} />
            <FreqBadge rank={lexeme.frequencyRank} />
            {reviewState && <SrsStatusBadge status={reviewState.status} />}
          </div>

          <div className="word-detail-actions">
            <IconButton
              icon={<StarIcon filled={entry.isFavorite} />}
              aria-label={entry.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              onClick={() => toggleFavMutation.mutate(entry.id)}
            />
            <IconButton
              icon={<CloseIcon />}
              aria-label="Close word details"
              onClick={onClose}
            />
          </div>
        </div>

        {/* Body */}
        <div className="word-detail-body">
          {/* Main Word */}
          <div>
            <div className="word-detail-word-row">
              <h2 id="word-detail-title" className="word-detail-word">
                {lexeme.text}
              </h2>
              <AudioButton text={lexeme.text} ariaLabel="Pronounce word" />
            </div>
            {lexeme.phonetic && (
              <div className="phonetic word-detail-phonetic">
                {lexeme.phonetic}
              </div>
            )}
            <div className="word-detail-practice">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const params = new URLSearchParams({
                    word: lexeme.text,
                    lexemeId: String(lexeme.id),
                  });
                  if (lexeme.phonetic) params.set('ipa', lexeme.phonetic);
                  onClose();
                  navigate(`/pronunciation?${params.toString()}`);
                }}
                aria-label={`Practice pronunciation of ${lexeme.text}`}
              >
                Practice pronunciation
              </Button>
            </div>
          </div>

          {/* Translation */}
          <div>
            <div className="word-detail-translation-header">
              <div className="text-muted text-xs font-semibold word-detail-section-label">TRANSLATION</div>
              <LanguageSelect
                className="word-detail-target-select"
                value={viewTarget}
                options={langOptions}
                onChange={setViewTarget}
                ariaLabel="View translation in language"
              />
            </div>
            <div className="word-detail-translation" aria-live="polite">
              {translateMutation.isPending && needsFetch
                ? 'Translating…'
                : translateMutation.data?.targetLanguage === viewTarget
                  ? translateMutation.data.mainTranslation
                  : mainTranslation}
            </div>
          </div>

          <AssociatedImage
            path={imagePath ?? null}
            alt={`Photo of ${lexeme.text}`}
            isLoading={isImageLoading && !imagePath}
            isRefreshing={imageRefreshing}
            size="card"
            cacheNonce={imageNonce}
            onRegenerate={
              lexemeId
                ? () => {
                    setImageRefreshing(true);
                    setImageError(null);
                    void ipc.media
                      .regenerateImage(lexemeId)
                      .then((path) => {
                        queryClient.setQueryData(['media', 'image', lexemeId], path);
                        setImageNonce((n) => n + 1);
                      })
                      .catch((err: unknown) => {
                        setImageError(formatImageProviderError(err));
                      })
                      .finally(() => {
                        setImageRefreshing(false);
                      });
                  }
                : undefined
            }
          />
          {imageError && (
            <p className="add-word-image-error" role="alert">
              {imageError}
            </p>
          )}

          {/* SRS State stats */}
          {reviewState && (
            <div className="word-detail-srs-grid">
              <div>
                <div className="text-muted text-xs">Interval</div>
                <div className="word-detail-srs-value">{reviewState.interval}d</div>
              </div>
              <div>
                <div className="text-muted text-xs">Ease Factor</div>
                <div className="word-detail-srs-value">{reviewState.ease.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-muted text-xs">Repetitions</div>
                <div className="word-detail-srs-value">{reviewState.repetitions}</div>
              </div>
            </div>
          )}

          {/* User Notes */}
          <div>
            <label
              htmlFor="word-detail-notes"
              className="text-muted text-xs font-semibold word-detail-section-label"
            >
              PERSONAL NOTES
            </label>
            <textarea
              id="word-detail-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add personal notes, mnemonics, or example phrases…"
              rows={3}
              className="word-detail-notes"
            />
            <div className="word-detail-notes-footer">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSaveNotes}
                isLoading={isSavingNotes}
              >
                Save Notes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
