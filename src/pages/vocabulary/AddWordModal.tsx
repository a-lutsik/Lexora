import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — Add Word Modal
// Quick translate and single-click add to vocabulary with AI.
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useTranslate } from '../../hooks/useTranslate';
import { useAddToVocabulary } from '../../hooks/useVocabulary';
import { useSessionLanguagePair } from '../../hooks/useSessionLanguagePair';
import { useCategories } from '../../hooks/useCategories';
import { CategorySelect } from '../../components/domain/CategorySelect';
import { useSettingsStore } from '../../stores/settingsStore';
import { formatIpcError } from '../../lib/utils';
import { useLanguages, resolveLanguageId, useLanguageOptions } from '../../hooks/useLanguages';
import { Button } from '../../components/ui/Button';
import { PosBadge } from '../../components/ui/Badge';
import { AudioButton } from '../../components/domain/AudioButton';
import { AssociatedImage } from '../../components/domain/AssociatedImage';
import { LanguageSelect } from '../../components/ui/LanguageSelect';
import { ipc } from '../../lib/ipc';
import { formatImageProviderError, formatProviderError } from '../../lib/inlineAssistant';
import type { CardEnrichEvent } from '../../lib/types';
import './vocabulary.css';

type AddWordModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialText?: string;
  initialCategoryId?: number | null;
};

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function AddWordModal({ isOpen, onClose, initialText = '', initialCategoryId = null }: AddWordModalProps) {
  const { t: tUi } = useI18n();
  const [text, setText] = useState(initialText);
  const [notes, setNotes] = useState('');
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const activeLanguageId = useSettingsStore((state) => state.activeLanguageId);
  const [added, setAdded] = useState(false);
  const [enrichExample, setEnrichExample] = useState<string | null>(null);
  const [enrichImagePath, setEnrichImagePath] = useState<string | null>(null);
  const [imagePending, setImagePending] = useState(false);
  const [imageRefreshing, setImageRefreshing] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageNonce, setImageNonce] = useState(0);
  const lexemeIdRef = useRef<number | null>(null);

  const { sourceLang, targetLang, setTargetLang } = useSessionLanguagePair();
  const langOptions = useLanguageOptions([sourceLang, targetLang]);
  const { data: languages } = useLanguages();
  const sourceLanguageId = resolveLanguageId(languages, sourceLang) ?? activeLanguageId;
  const categories = useCategories(isOpen ? sourceLanguageId : 0);
  const translateMutation = useTranslate();
  const addMutation = useAddToVocabulary();

  const resetDraft = (nextText = '') => {
    setText(nextText);
    setNotes('');
    setCategoryId(initialCategoryId);
    setAdded(false);
    setEnrichExample(null);
    setEnrichImagePath(null);
    setImagePending(false);
    setImageRefreshing(false);
    setImageError(null);
    setImageNonce(0);
    lexemeIdRef.current = null;
    translateMutation.reset();
    addMutation.reset();
  };

  // Clear word, notes, and translation so a new "Add Word" session
  // never paints the previous draft (modal stays mounted while closed).
  const wasOpenRef = useRef(false);
  useEffect(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = isOpen;
    if (isOpen && !wasOpen) {
      resetDraft(initialText);
      return;
    }
    if (!isOpen && wasOpen) {
      resetDraft();
    }
    // resetDraft reads stable mutation.reset(); run only on open/close.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialText]);

  useEffect(() => {
    if (!isOpen) return;
    lexemeIdRef.current = translateMutation.data?.lexemeId ?? null;
    // Cached cards already have a photo; don't leave pending stuck when enrich is a no-op.
    if (translateMutation.data?.imagePath) {
      setEnrichImagePath(translateMutation.data.imagePath);
      setImagePending(false);
    } else if (translateMutation.data && translateMutation.data.lexemeId == null) {
      setImagePending(false);
    }
  }, [isOpen, translateMutation.data]);

  useEffect(() => {
    if (!isOpen) return;
    const unlistenPromise = listen<CardEnrichEvent>('lexora:card-enrich', (event) => {
      const payload = event.payload;
      if (lexemeIdRef.current == null || payload.lexemeId !== lexemeIdRef.current) {
        return;
      }
      if (payload.exampleSentence) {
        setEnrichExample(payload.exampleSentence);
      }
      if (payload.imagePath) {
        setEnrichImagePath(payload.imagePath);
      }
      if (payload.imagePath || payload.complete !== false) {
        setImagePending(false);
      }
    });
    return () => {
      void unlistenPromise.then((u) => u());
    };
  }, [isOpen]);

  // A11y: Esc закрывает диалог; при закрытии фокус возвращается
  // на элемент, который был активен до открытия.
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTranslate = (overrideTarget?: string) => {
    if (!text.trim()) return;
    setAdded(false);
    setEnrichExample(null);
    setEnrichImagePath(null);
    setImagePending(true);
    setImageRefreshing(false);
    setImageError(null);
    setImageNonce(0);
    translateMutation.mutate({
      text: text.trim(),
      sourceLanguage: sourceLang,
      targetLanguage: overrideTarget ?? targetLang,
      contextSentence: null,
    });
  };

  const handleTargetChange = (next: string) => {
    setTargetLang(next);
    if (text.trim()) {
      handleTranslate(next);
    }
  };

  const handleRegenerateImage = () => {
    const lexemeId = translateMutation.data?.lexemeId;
    if (!lexemeId || imageRefreshing) return;
    setImagePending(false);
    setImageRefreshing(true);
    setImageError(null);
    void ipc
      .media.regenerateImage(lexemeId)
      .then((path) => {
        setEnrichImagePath(path);
        setImageNonce((n) => n + 1);
      })
      .catch((err: unknown) => {
        setImageError(formatImageProviderError(err));
      })
      .finally(() => {
        setImageRefreshing(false);
      });
  };

  const handleAdd = () => {
    if (!text.trim()) return;
    const selectedCategoryId = categoryId ?? categories.data?.find((category) => category.isGeneral)?.id;
    addMutation.mutate(
      {
        lexemeId: translateMutation.data?.lexemeId ?? null,
        text: text.trim(),
        sourceLanguage: translateMutation.data?.sourceLanguage || sourceLang,
        notes: notes.trim() || undefined,
        source: 'manual',
        ...(selectedCategoryId != null ? { categoryId: selectedCategoryId } : {}),
      },
      {
        onSuccess: () => {
          setAdded(true);
          setTimeout(() => {
            onClose();
          }, 1200);
        },
      }
    );
  };

  const data = translateMutation.data
    ? {
        ...translateMutation.data,
        exampleSentence:
          enrichExample ?? translateMutation.data.exampleSentence,
        imagePath: enrichImagePath ?? translateMutation.data.imagePath,
        sourceSynonyms: translateMutation.data.sourceSynonyms ?? [],
      }
    : undefined;

  return (
    // Клик по backdrop закрывает модалку (мышь); клавиатурная альтернатива — Esc
    // (обработчик в useEffect выше), фокус стартует на поле ввода (autoFocus).
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <div
      className="add-word-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-word-title"
    >
      <div className="add-word-dialog animate-slide-up">
        {/* Header */}
        <div className="add-word-header">
          <div>
            <h2 id="add-word-title" className="add-word-title">{tUi("Add Word to Vocabulary")}</h2>
            <p className="text-secondary text-xs">{tUi("Translate from ")}{sourceLang.toUpperCase()} → {targetLang.toUpperCase()}{tUi(" (session target does not change Settings)")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="add-word-close-btn"
            aria-label={tUi("Close dialog")}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="add-word-lang-row">
          <LanguageSelect
            value={targetLang}
            options={langOptions}
            onChange={handleTargetChange}
            ariaLabel={tUi("Target language")}
          />
        </div>

        {/* Input & Translate Button */}
        <div className="add-word-input-row">
          <input dir="auto"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTranslate()}
            placeholder={tUi("Type word or phrase in {value1}…", { value1: sourceLang.toUpperCase() })}
            autoFocus
            className="add-word-input"
            aria-label={tUi("Word or phrase to translate")}
          />
          <Button
            variant="secondary"
            size="md"
            onClick={() => handleTranslate()}
            isLoading={translateMutation.isPending}
          >{tUi("Translate")}</Button>
        </div>

        {translateMutation.isError && !translateMutation.isPending && (
          <div className="add-word-error-box" role="alert">
            <div className="add-word-error-title">{tUi("Couldn’t translate")}</div>
            <div>
              {formatProviderError(translateMutation.error)}
            </div>
          </div>
        )}

        {/* AI Translation Result Card */}
        {data && (
          <div className="add-word-result animate-fade-in">
            <div className="add-word-result-header">
              <div className="add-word-result-word-row">
                <span className="add-word-result-word">{data.text}</span>
                {data.phonetic && (
                  <span className="text-secondary text-xs font-mono">
                    {data.phonetic}
                  </span>
                )}
                <AudioButton
                  text={data.text}
                  language={data.sourceLanguage || undefined}
                  ariaLabel={tUi("Pronounce")}
                />
              </div>
              <PosBadge pos={data.partOfSpeech} />
            </div>

            <div className="add-word-result-translation">
              {data.mainTranslation}
            </div>

            <AssociatedImage
              path={data.imagePath}
              alt={tUi("Photo of {word}", { word: data.text })}
              isLoading={imagePending && !data.imagePath}
              isRefreshing={imageRefreshing}
              size="card"
              cacheNonce={imageNonce}
              onRegenerate={
                data.lexemeId ? handleRegenerateImage : undefined
              }
            />
            {imageError && (
              <p className="add-word-image-error" role="alert">
                {imageError}
              </p>
            )}

            {data.sourceSynonyms.length > 0 && (
              <div className="add-word-source-synonyms" aria-label={tUi("Source language synonyms")}>
                {data.sourceSynonyms.map((syn) => (
                  <span key={syn} className="add-word-syn-chip">
                    {syn}
                  </span>
                ))}
              </div>
            )}

            {data.alternatives?.length > 0 && (
              <div className="add-word-alternatives">
                {data.alternatives.map((alt) => (
                  <span key={alt} className="add-word-alt-chip">
                    {alt}
                  </span>
                ))}
              </div>
            )}

            {data.exampleSentence && (
              <div className="add-word-example">
                "{data.exampleSentence}"
              </div>
            )}
          </div>
        )}

        <label className="bulk-add-field">{tUi('Category')}
          <CategorySelect categories={categories.data ?? []} value={categoryId} onChange={setCategoryId}
            disabled={addMutation.isPending || added} />
        </label>
        {categories.isError && <p className="text-secondary text-xs">{tUi('Could not load categories.')} <Button size="sm" onClick={() => void categories.refetch()}>{tUi('Try again')}</Button></p>}
        {addMutation.isError && <p role="alert" className="add-word-image-error">{formatIpcError(addMutation.error, tUi('Could not add word.'))}</p>}

        {/* Optional Notes */}
        <div>
          <label
            htmlFor="add-word-notes"
            className="text-secondary text-xs font-medium add-word-notes-label"
          >{tUi("PERSONAL NOTES / CONTEXT (OPTIONAL)")}</label>
          <input dir="auto"
            id="add-word-notes"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={tUi("e.g. Learned from reading an article about space...")}
            className="add-word-notes-input"
          />
        </div>

        {/* Actions */}
        <div className="add-word-actions">
          <Button variant="ghost" size="md" onClick={onClose}>{tUi("Cancel")}</Button>
          <Button
            variant={added ? 'secondary' : 'primary'}
            size="md"
            onClick={handleAdd}
            isLoading={addMutation.isPending}
            disabled={!text.trim() || added}
          >
            {added ? tUi("✓ Added to Vocabulary!") : tUi("+ Add to Vocabulary")}
          </Button>
        </div>
      </div>
    </div>
  );
}
