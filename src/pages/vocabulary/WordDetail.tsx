import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — Word Detail Modal / Drawer
// Full inspection: phonetic, translations, examples, SRS status, notes.
// ============================================================

import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listen } from '@tauri-apps/api/event';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useVocabularyEntry, useToggleFavorite, useRemoveFromVocabulary } from '../../hooks/useVocabulary';
import { useSettings } from '../../hooks/useSettings';
import { useLanguages, useLanguageOptions } from '../../hooks/useLanguages';
import { useTranslate } from '../../hooks/useTranslate';
import { LanguageSelect } from '../../components/ui/LanguageSelect';
import { SrsStatusBadge, PosBadge } from '../../components/ui/Badge';
import { Button, IconButton } from '../../components/ui/Button';
import { AudioButton } from '../../components/domain/AudioButton';
import { AssociatedImage } from '../../components/domain/AssociatedImage';
import { FreqBadge } from '../../components/domain/FreqBadge';
import { CollocationList } from '../../components/domain/CollocationList';
import { WordCategory } from './WordCategory';
import { WordDetailEdit } from './WordDetailEdit';
import { WordDetailRemove } from './WordDetailRemove';
import { WordDetailUnavailable } from './WordDetailUnavailable';
import { ipc } from '../../lib/ipc';
import { STALE_TIME, QUERY_KEYS } from '../../lib/constants';
import { formatImageProviderError } from '../../lib/inlineAssistant';
import { canHaveCollocations } from '../../lib/collocations';
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

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function WordDetail({ id, onClose }: WordDetailProps) {
  const { t: tUi } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: entry, isLoading, isError, refetch } = useVocabularyEntry(id);
  const toggleFavMutation = useToggleFavorite();
  const removeMutation = useRemoveFromVocabulary();
  const { data: settings } = useSettings();
  const { data: languages } = useLanguages();
  const translateMutation = useTranslate();
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [imageRefreshing, setImageRefreshing] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageNonce, setImageNonce] = useState(0);
  const [showCollocations, setShowCollocations] = useState(false);
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
    if (!entry) return tUi("No translation");
    if (targetLangId != null) {
      const match = entry.translations.find((t) => t.targetLanguageId === targetLangId);
      if (match) return match.translatedText;
    }
    return entry.translations[0]?.translatedText ?? tUi("No translation");
  }, [entry, targetLangId, tUi]);

  const needsFetch =
    entry != null &&
    targetLangId != null &&
    !entry.translations.some((t) => t.targetLanguageId === targetLangId);

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

  // `onClose` приходит из родителя новой функцией на каждый рендер — держим
  // актуальное значение в ref, чтобы эффекты ниже не перезапускались.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Esc закрывает окно в любом состоянии: загрузка, ошибка, содержимое.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // A11y: при открытии фокус на диалог, при закрытии возвращается к прежнему элементу.
  // Зависим от факта наличия слова, а не от самого объекта: обновление данных
  // (перевод, избранное) не должно красть фокус у поля заметок.
  const hasEntry = entry != null;
  useEffect(() => {
    if (!hasEntry) return;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.focus();
    return () => previouslyFocused?.focus();
  }, [hasEntry]);
  useFocusTrap(dialogRef, hasEntry);

  const handleSaveNotes = async () => {
    if (!entry) return;
    setIsSavingNotes(true);
    setNotesError(null);
    try {
      await ipc.vocabulary.updateNotes(entry.id, notes);
    } catch {
      setNotesError('Couldn’t save your notes. Please try again.');
    } finally {
      setIsSavingNotes(false);
    }
  };

  if (isLoading) {
    return (
      <div className="word-detail-overlay word-detail-overlay--loading" role="status">
        <div className="text-muted text-sm animate-pulse">{tUi("Loading word details…")}</div>
      </div>
    );
  }

  if (!entry) {
    return (
      <WordDetailUnavailable
        failed={isError}
        onRetry={() => void refetch()}
        onClose={onClose}
      />
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
              aria-label={entry.isFavorite ? tUi("Remove from favorites") : tUi("Add to favorites")}
              onClick={() => toggleFavMutation.mutate(entry.id)}
            />
            <IconButton
              icon={<CloseIcon />}
              aria-label={tUi("Close word details")}
              onClick={onClose}
            />
          </div>
        </div>

        {/* Body */}
        <div className="word-detail-body">
          {/* Main Word */}
          <div>
            {isEditing ? (
              <WordDetailEdit
                entryId={entry.id}
                text={lexeme.text}
                translation={entry.translations[0]?.translatedText ?? ''}
                onDone={() => setIsEditing(false)}
              />
            ) : (
              <div className="word-detail-word-row">
                <h2 id="word-detail-title" className="word-detail-word">
                  {lexeme.text}
                </h2>
                <AudioButton text={lexeme.text} ariaLabel={tUi("Pronounce word")} />
                <IconButton
                  icon={<EditIcon />}
                  aria-label={tUi("Edit word and translation")}
                  onClick={() => setIsEditing(true)}
                />
              </div>
            )}
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
                aria-label={tUi("Practice pronunciation of {value1}", { value1: lexeme.text })}
              >{tUi("Practice pronunciation")}</Button>
            </div>
          </div>

          {/* Translation */}
          <div>
            <div className="word-detail-translation-header">
              <div className="text-muted text-xs font-semibold word-detail-section-label">{tUi("TRANSLATION")}</div>
              <LanguageSelect
                className="word-detail-target-select"
                value={viewTarget}
                options={langOptions}
                onChange={setViewTarget}
                ariaLabel={tUi("View translation in language")}
              />
            </div>
            <div className="word-detail-translation" aria-live="polite">
              {translateMutation.isPending && needsFetch
                ? tUi("Translating…")
                : translateMutation.data?.targetLanguage === viewTarget
                  ? translateMutation.data.mainTranslation
                  : mainTranslation}
            </div>
          </div>

          {canHaveCollocations(lexeme.text, lexeme.partOfSpeech) && (
            <div className="word-detail-collocations">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowCollocations((open) => !open)}
              >
                {showCollocations ? tUi("Hide collocations") : tUi("Show collocations")}
              </Button>
              {showCollocations && (
                <CollocationList lexemeId={entry.lexemeId} word={lexeme.text} targetLanguage={viewTarget} />
              )}
            </div>
          )}

          <AssociatedImage
            path={imagePath ?? null}
            alt={tUi("Photo of {word}", { word: lexeme.text })}
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
                <div className="text-muted text-xs">{tUi("Interval")}</div>
                <div className="word-detail-srs-value">{reviewState.interval}{tUi("d")}</div>
              </div>
              <div>
                <div className="text-muted text-xs">{tUi("Ease Factor")}</div>
                <div className="word-detail-srs-value">{reviewState.ease.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-muted text-xs">{tUi("Repetitions")}</div>
                <div className="word-detail-srs-value">{reviewState.repetitions}</div>
              </div>
            </div>
          )}

          <WordCategory key={`${entry.id}:${entry.categoryId ?? ''}`} entryId={entry.id}
            languageId={lexeme.languageId} categoryId={entry.categoryId ?? null} />

          {/* User Notes */}
          <div>
            <label
              htmlFor="word-detail-notes"
              className="text-muted text-xs font-semibold word-detail-section-label"
            >{tUi("PERSONAL NOTES")}</label>
            <textarea dir="auto"
              id="word-detail-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={tUi("Add personal notes, mnemonics, or example phrases…")}
              rows={3}
              className="word-detail-notes"
            />
            <div className="word-detail-notes-footer">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSaveNotes}
                isLoading={isSavingNotes}
              >{tUi("Save Notes")}</Button>
            </div>
            {notesError && (
              <p className="word-detail-notes-error" role="alert">
                {notesError}
              </p>
            )}
          </div>

          <WordDetailRemove
            word={lexeme.text}
            isRemoving={removeMutation.isPending}
            hasError={removeMutation.isError}
            onConfirm={() => removeMutation.mutate(entry.id, { onSuccess: onClose })}
          />
        </div>
      </div>
    </div>
  );
}
