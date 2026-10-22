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
import { Button, IconButton } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { useFocusTrap } from '../../hooks/useFocusTrap';
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
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, isOpen);

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

  const exampleParts = (() => {
    const sentence = data?.exampleSentence;
    if (!data || !sentence) return null;
    const needle = data.text.trim().toLocaleLowerCase();
    const at = needle ? sentence.toLocaleLowerCase().indexOf(needle) : -1;
    if (at < 0) return null;
    return [sentence.slice(0, at), sentence.slice(at, at + needle.length), sentence.slice(at + needle.length)] as const;
  })();
  const metaItems = data
    ? [
        data.phonetic ? <span key="ipa" className="ipa add-word-card__ipa">{data.phonetic}</span> : null,
        data.partOfSpeech ? <PosBadge key="pos" pos={data.partOfSpeech} /> : null,
      ].filter((item): item is JSX.Element => item != null)
    : [];

  return (
    // Клик по backdrop закрывает модалку (мышь); клавиатурная альтернатива — Esc
    // (обработчик в useEffect выше), фокус стартует на поле ввода (autoFocus).
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      className="modal-scrim"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="modal add-word-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-word-title"
      >
        <div className="modal__head">
          <div className="modal__head-text">
            <h2 id="add-word-title" className="modal__title">{tUi("Add word to vocabulary")}</h2>
            <p className="modal__desc">
              {tUi("{source} → {target} for this session. Settings stay the same.", {
                source: sourceLang.toUpperCase(),
                target: targetLang.toUpperCase(),
              })}
            </p>
          </div>
          <IconButton
            className="modal__close"
            icon={<Icon name="close" size={20} />}
            aria-label={tUi("Close dialog")}
            onClick={onClose}
          />
        </div>

        <div className="modal__body">
          {/* Input & Translate Button */}
          <div className="add-word-input-row">
            <input dir="auto"
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTranslate()}
              placeholder={tUi("Type word or phrase in {value1}…", { value1: sourceLang.toUpperCase() })}
              autoFocus
              className="field add-word-input"
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

          {/* AI translation result: one surface, word is the hero */}
          {data && (
            <div className="add-word-card animate-fade-in">
              <div className="add-word-card__text">
                <div className="add-word-card__word-row">
                  <span className="add-word-card__word" dir="auto">{data.text}</span>
                  <AudioButton
                    text={data.text}
                    language={data.sourceLanguage || undefined}
                    ariaLabel={tUi("Pronounce")}
                  />
                </div>
                {metaItems.length > 0 && (
                  <div className="add-word-card__meta">
                    {metaItems.map((item, index) => (
                      <span key={item.key ?? index} className="add-word-card__meta-item">
                        {index > 0 && <span className="add-word-card__meta-sep" aria-hidden="true">·</span>}
                        {item}
                      </span>
                    ))}
                  </div>
                )}

                <div className="add-word-card__translation" dir="auto">
                  {data.mainTranslation}
                </div>

                {data.alternatives?.length > 0 && (
                  <div className="add-word-card__tags">
                    {data.alternatives.map((alt) => (
                      <span key={alt} className="tag" dir="auto">
                        {alt}
                      </span>
                    ))}
                  </div>
                )}

                {data.sourceSynonyms.length > 0 && (
                  <div className="add-word-card__tags" aria-label={tUi("Source language synonyms")}>
                    {data.sourceSynonyms.map((syn) => (
                      <span key={syn} className="tag" dir="auto">
                        {syn}
                      </span>
                    ))}
                  </div>
                )}

                {data.exampleSentence && (
                  <div className="add-word-card__example" dir="auto">
                    “{exampleParts
                      ? <>{exampleParts[0]}<u>{exampleParts[1]}</u>{exampleParts[2]}</>
                      : data.exampleSentence}”
                  </div>
                )}
              </div>

              <div className="add-word-card__image">
                <AssociatedImage
                  path={data.imagePath}
                  alt={tUi("Photo of {word}", { word: data.text })}
                  isLoading={imagePending && !data.imagePath}
                  isRefreshing={imageRefreshing}
                  size="thumb"
                  cacheNonce={imageNonce}
                  onRegenerate={
                    data.lexemeId ? handleRegenerateImage : undefined
                  }
                />
              </div>
            </div>
          )}
          {imageError && (
            <p className="inline-error" role="alert">
              {imageError}
            </p>
          )}

          <div className="vocabulary-form-grid">
            <div className="vocabulary-form-field">
              <label htmlFor="add-word-target" className="label">{tUi("Translate into")}</label>
              <LanguageSelect
                id="add-word-target"
                value={targetLang}
                options={langOptions}
                onChange={handleTargetChange}
                ariaLabel={tUi("Translate into")}
              />
            </div>
            <div className="vocabulary-form-field">
              <label htmlFor="add-word-category" className="label">{tUi('Category')}</label>
              <CategorySelect id="add-word-category" categories={categories.data ?? []} value={categoryId} onChange={setCategoryId}
                disabled={addMutation.isPending || added} />
            </div>
          </div>
          {categories.isError && <p className="inline-note">{tUi('Could not load categories.')} <Button size="sm" onClick={() => void categories.refetch()}>{tUi('Try again')}</Button></p>}
          {addMutation.isError && <p role="alert" className="inline-error">{formatIpcError(addMutation.error, tUi('Could not add word.'))}</p>}

          {/* Optional notes */}
          <div className="vocabulary-form-field">
            <label htmlFor="add-word-notes" className="label">
              {tUi("Notes")}
              <span className="label__optional">{tUi("optional")}</span>
            </label>
            <input dir="auto"
              id="add-word-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={tUi("e.g. Learned from reading an article about space...")}
              className="field add-word-notes-input"
            />
          </div>
        </div>

        <div className="modal__foot">
          <span className="hint">
            <kbd className="kbd">{tUi("Esc")}</kbd>
            {tUi("close")}
          </span>
          <span className="spacer" />
          <Button variant="ghost" size="md" onClick={onClose}>{tUi("Cancel")}</Button>
          <Button
            variant={added ? 'secondary' : 'primary'}
            size="md"
            onClick={handleAdd}
            isLoading={addMutation.isPending}
            disabled={!text.trim() || added}
          >
            {added ? tUi("✓ Added to Vocabulary!") : <><Icon name="add" size={17} />{tUi("Add to vocabulary")}</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
