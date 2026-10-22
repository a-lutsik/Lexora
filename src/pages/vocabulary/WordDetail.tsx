import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — Word Detail panel (Lingora frame 1b)
// Панель справа от списка, а не модалка: список остаётся виден,
// стрелками ↑/↓ (и кнопками в шапке) можно листать слова страницы.
// Произношение, перевод, примеры, состояние SRS, заметки, удаление.
// ============================================================

import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listen } from '@tauri-apps/api/event';
import { useVocabularyEntry, useToggleFavorite, useRemoveFromVocabulary } from '../../hooks/useVocabulary';
import { useSettings } from '../../hooks/useSettings';
import { useLanguages, useLanguageOptions } from '../../hooks/useLanguages';
import { useTranslate } from '../../hooks/useTranslate';
import { LanguageSelect } from '../../components/ui/LanguageSelect';
import { SrsStatusBadge, PosBadge } from '../../components/ui/Badge';
import { Button, IconButton } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
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
import { cx, formatRelativeDate } from '../../lib/utils';
import type { CardEnrichEvent } from '../../lib/types';
import './vocabulary.css';

/** 1-based position of the open word in the list and the list size (null when unknown). */
export type WordDetailPosition = { index: number; total: number | null };

type WordDetailProps = {
  id: number;
  onClose: () => void;
  position?: WordDetailPosition | null;
  onPrevious?: () => void;
  onNext?: () => void;
};

const TITLE_ID = 'word-detail-title';
const LOADING_ID = 'word-detail-loading';
const UNAVAILABLE_ID = 'word-detail-unavailable-title';

/** Arrow keys belong to text fields and list boxes; only elsewhere they step through words. */
function ownsArrowKeys(target: EventTarget): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return target.closest('input, textarea, select, [role="combobox"], [role="listbox"], [role="option"]') != null;
}

/** Splits an example around the first case-insensitive occurrence of the word (to underline it). */
function splitAroundWord(sentence: string, word: string): [string, string, string] | null {
  const needle = word.trim().toLocaleLowerCase();
  if (!needle) return null;
  const at = sentence.toLocaleLowerCase().indexOf(needle);
  if (at < 0) return null;
  return [sentence.slice(0, at), sentence.slice(at, at + needle.length), sentence.slice(at + needle.length)];
}

export function WordDetail({ id, onClose, position = null, onPrevious, onNext }: WordDetailProps) {
  const { t: tUi, locale } = useI18n();
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
  const panelRef = useRef<HTMLElement>(null);
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

  // Esc закрывает панель в любом состоянии: загрузка, ошибка, содержимое.
  // Модалка поверх панели (подтверждение, Add word) закрывается первой.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (document.querySelector('[aria-modal="true"]')) return;
      onCloseRef.current();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // A11y: при открытии фокус на панель, при закрытии возвращается к прежнему
  // элементу (строке списка). Панель не модальная — Tab свободно уходит в список.
  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panelRef.current?.focus();
    return () => {
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, []);

  // ↑/↓ листают слова страницы, пока фокус в панели, но не в поле ввода или списке.
  const stepRef = useRef({ onPrevious, onNext });
  useEffect(() => {
    stepRef.current = { onPrevious, onNext };
  });
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const handleArrows = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.target && ownsArrowKeys(event.target)) return;
      const step = event.key === 'ArrowUp' ? stepRef.current.onPrevious : stepRef.current.onNext;
      if (!step) return;
      event.preventDefault();
      step();
    };
    panel.addEventListener('keydown', handleArrows);
    return () => panel.removeEventListener('keydown', handleArrows);
  }, []);

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

  const labelledBy = isLoading ? LOADING_ID : !entry ? UNAVAILABLE_ID : isEditing ? undefined : TITLE_ID;
  const positionLabel = position && position.total != null
    ? tUi('Word {index} of {total}', {
        index: position.index.toLocaleString(locale),
        total: position.total.toLocaleString(locale),
      })
    : null;

  const shownTranslation = translateMutation.isPending && needsFetch
    ? tUi("Translating…")
    : translateMutation.data?.targetLanguage === viewTarget
      ? translateMutation.data.mainTranslation
      : mainTranslation;

  const alternatives = (() => {
    if (!entry) return [];
    const fromEntry = entry.translations
      .filter((t) => t.targetLanguageId === targetLangId)
      .map((t) => t.translatedText);
    const fromFetch = translateMutation.data?.targetLanguage === viewTarget ? translateMutation.data.alternatives : [];
    return Array.from(new Set([...fromEntry, ...fromFetch])).filter((text) => text !== shownTranslation);
  })();

  const renderBody = () => {
    if (isLoading) {
      return (
        <div id={LOADING_ID} className="word-panel__state animate-pulse" role="status">
          {tUi("Loading word details…")}
        </div>
      );
    }

    if (!entry) {
      return (
        <WordDetailUnavailable
          failed={isError}
          onRetry={() => void refetch()}
          onClose={onClose}
          titleId={UNAVAILABLE_ID}
        />
      );
    }

    const { lexeme, reviewState } = entry;
    const synonyms = entry.synonyms ?? [];
    const metaItems = [
      lexeme.partOfSpeech ? <PosBadge key="pos" pos={lexeme.partOfSpeech} /> : null,
      lexeme.frequencyRank != null ? <FreqBadge key="freq" rank={lexeme.frequencyRank} top /> : null,
      reviewState ? <SrsStatusBadge key="status" status={reviewState.status} /> : null,
    ].filter((item) => item != null);

    return (
      <>
        <div className="word-panel__body">
          <div className="word-panel__hero">
            <div className="word-panel__hero-text">
              {isEditing ? (
                <WordDetailEdit
                  entryId={entry.id}
                  text={lexeme.text}
                  translation={entry.translations[0]?.translatedText ?? ''}
                  onDone={() => setIsEditing(false)}
                />
              ) : (
                <h2 id={TITLE_ID} className="word-panel__word" dir="auto">
                  {lexeme.text}
                </h2>
              )}
              <div className="word-panel__pron">
                {lexeme.phonetic && <span className="ipa word-panel__ipa">{lexeme.phonetic}</span>}
                <AudioButton text={lexeme.text} ariaLabel={tUi("Pronounce word")} />
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
                >
                  <Icon name="mic" size={17} />
                  {tUi("Practice")}
                </Button>
              </div>
              {metaItems.length > 0 && (
                <div className="word-panel__meta">
                  {metaItems.map((item, index) => (
                    <span key={item.key} className="word-panel__meta-item">
                      {index > 0 && <span className="word-panel__meta-sep" aria-hidden="true">·</span>}
                      {item}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="word-panel__image">
              <AssociatedImage
                path={imagePath ?? null}
                alt={tUi("Photo of {word}", { word: lexeme.text })}
                isLoading={isImageLoading && !imagePath}
                isRefreshing={imageRefreshing}
                size="thumb"
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
            </div>
          </div>
          {imageError && (
            <p className="inline-error" role="alert">
              {imageError}
            </p>
          )}

          {/* Translation */}
          <section className="word-panel__section">
            <div className="word-panel__section-head">
              <span className="section-label word-panel__section-label">{tUi("Translation")}</span>
              <LanguageSelect
                className="word-panel__lang custom-select--sm"
                value={viewTarget}
                options={langOptions}
                onChange={setViewTarget}
                ariaLabel={tUi("View translation in language")}
                compact
              />
            </div>
            <div className="word-panel__translation" dir="auto" aria-live="polite">
              {shownTranslation}
            </div>
            {(alternatives.length > 0 || synonyms.length > 0) && (
              <div className="word-panel__tags">
                {alternatives.map((text) => (
                  <span key={`alt-${text}`} className="tag" dir="auto">{text}</span>
                ))}
                {synonyms.length > 0 && (
                  <span className="word-panel__tag-group" role="group" aria-label={tUi("Synonyms")}>
                    {synonyms.map((text) => (
                      <span key={`syn-${text}`} className="tag" dir="auto">{text}</span>
                    ))}
                  </span>
                )}
              </div>
            )}
          </section>

          {entry.examples.length > 0 && (
            <section className="word-panel__section">
              <div className="section-label">{tUi("Examples")}</div>
              <div className="word-panel__examples">
                {entry.examples.map((example) => {
                  const parts = splitAroundWord(example.sentence, lexeme.text);
                  return (
                    <div key={example.id} className="example" dir="auto">
                      {parts ? <>{parts[0]}<u>{parts[1]}</u>{parts[2]}</> : example.sentence}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

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

          {/* SRS state */}
          {reviewState && (
            <section className="word-panel__section">
              <div className="section-label">{tUi("Review")}</div>
              <div className="stat-grid stat-grid--plain word-panel__stats">
                <div className="stat">
                  <div className="stat__label">{tUi("Interval")}</div>
                  <div className="stat__value stat__value--mono">{reviewState.interval} {tUi("d")}</div>
                </div>
                <div className="stat">
                  <div className="stat__label">{tUi("Ease")}</div>
                  <div className="stat__value stat__value--mono">{reviewState.ease.toFixed(2)}</div>
                </div>
                <div className="stat">
                  <div className="stat__label">{tUi("Repetitions")}</div>
                  <div className="stat__value stat__value--mono">{reviewState.repetitions}</div>
                </div>
              </div>
              <p className="inline-note word-panel__note">
                {tUi('Next review {when} · added {date}', {
                  when: formatRelativeDate(reviewState.dueAt).toLocaleLowerCase(locale),
                  date: new Date(entry.addedAt * 1000).toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
                })}
              </p>
            </section>
          )}

          <WordCategory key={`${entry.id}:${entry.categoryId ?? ''}`} entryId={entry.id}
            languageId={lexeme.languageId} categoryId={entry.categoryId ?? null} />

          {/* User notes */}
          <section className="word-panel__section">
            <label htmlFor="word-detail-notes" className="section-label word-panel__section-label">
              {tUi("Personal notes")}
            </label>
            <textarea dir="auto"
              id="word-detail-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={tUi("Add personal notes, mnemonics, or example phrases…")}
              rows={3}
              className="field field--textarea word-panel__notes"
            />
            {notesError && (
              <p className="inline-error word-panel__notes-error" role="alert">
                {notesError}
              </p>
            )}
          </section>
        </div>

        <div className="word-panel__foot">
          <WordDetailRemove
            word={lexeme.text}
            isRemoving={removeMutation.isPending}
            hasError={removeMutation.isError}
            onConfirm={() => removeMutation.mutate(entry.id, { onSuccess: onClose })}
          />
          <span className="spacer" />
          <Button
            variant="secondary"
            onClick={handleSaveNotes}
            isLoading={isSavingNotes}
          >{tUi("Save notes")}</Button>
        </div>
      </>
    );
  };

  return (
    <aside
      ref={panelRef}
      className="word-panel"
      // Не модальная панель рядом со списком (aria-modal не ставим).
      role="dialog"
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : entry?.lexeme.text}
      aria-busy={isLoading || undefined}
      tabIndex={-1}
    >
      <div className="word-panel__head" data-tauri-drag-region>
        {positionLabel && <span className="word-panel__position">{positionLabel}</span>}
        <span className="spacer" />
        <IconButton
          size="sm"
          icon={<Icon name="keyboard_arrow_up" size={17} />}
          aria-label={tUi("Previous word")}
          onClick={() => onPrevious?.()}
          disabled={!onPrevious}
        />
        <IconButton
          size="sm"
          icon={<Icon name="keyboard_arrow_down" size={17} />}
          aria-label={tUi("Next word")}
          onClick={() => onNext?.()}
          disabled={!onNext}
        />
        {entry && !isEditing && (
          <IconButton
            size="sm"
            icon={<Icon name="edit" size={17} />}
            aria-label={tUi("Edit word and translation")}
            onClick={() => setIsEditing(true)}
          />
        )}
        {entry && (
          <IconButton
            size="sm"
            className={cx('word-panel__favorite', entry.isFavorite && 'is-on')}
            icon={<Icon name="star" size={17} />}
            aria-label={entry.isFavorite ? tUi("Remove from favorites") : tUi("Add to favorites")}
            onClick={() => toggleFavMutation.mutate(entry.id)}
          />
        )}
        <IconButton
          size="sm"
          icon={<Icon name="close" size={17} />}
          aria-label={tUi("Close word details")}
          onClick={onClose}
        />
      </div>
      {renderBody()}
    </aside>
  );
}
