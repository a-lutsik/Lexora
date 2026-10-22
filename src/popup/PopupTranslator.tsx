import { useI18n } from "../hooks/useI18n";
// ============================================================
// LEXORA — PopupTranslator Component
// Lingora floating panel: brand + language pair (mono codes),
// word in Literata with IPA, translation, alternatives as tags,
// examples, and a footer with key hints and the primary action.
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { listen, emit } from '@tauri-apps/api/event';
import { AssociatedImage } from '../components/domain/AssociatedImage';
import { CollocationList } from '../components/domain/CollocationList';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useTranslate } from '../hooks/useTranslate';
import { useAddToVocabulary } from '../hooks/useVocabulary';
import { useSessionLanguagePair } from '../hooks/useSessionLanguagePair';
import { useLanguageOptions } from '../hooks/useLanguages';
import { PosBadge } from '../components/ui/Badge';
import { Button, IconButton } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { LanguageSelect } from '../components/ui/LanguageSelect';
import { TranslationDomainSelect } from '../components/domain/TranslationDomainSelect';
import { BrandBadge } from '../components/ui/Logo';
import { ipc } from '../lib/ipc';
import { languageLabel, getLanguageEntry, normalizeLangCode } from '../lib/languages';
import { isCardEnrichComplete, type CardEnrichEvent } from '../lib/types';
import { isLongWritingText, OPEN_WRITING_EVENT, saveWritingDraft } from '../lib/writingText';
import { classifyPopupText, formatImageProviderError, formatProviderError } from '../lib/inlineAssistant';
import { useSessionLexicalDomain } from '../hooks/useSessionLexicalDomain';
import { formatFrequencyHint, splitByTerm } from '../lib/utils';
import { canHaveCollocations } from '../lib/collocations';
import type { LexicalDomain } from '../lib/translationDomain';

const AUTO_TEXT_DEBOUNCE_MS = 800;
/** Key name on the keycap, not interface copy. */
const ESC_KEY_LABEL = 'Esc';

type EnrichPatch = {
  usageNote: string | null;
  exampleSentence: string | null;
  exampleSentence2: string | null;
  imagePath: string | null;
};

type PopupTranslatorProps = {
  onOpenAssistant?: (text: string) => void;
};

function uniqueExampleSentences(
  first: string | null | undefined,
  second: string | null | undefined
): string[] {
  const out: string[] = [];
  for (const raw of [first, second]) {
    const value = raw?.trim();
    if (!value) continue;
    if (out.some((existing) => existing.toLocaleLowerCase() === value.toLocaleLowerCase())) {
      continue;
    }
    out.push(value);
  }
  return out;
}

/** Drops a leading «+ » / «✓ » from a label that is shown next to an icon. */
function withoutLeadingGlyph(label: string): string {
  return label.replace(/^[+✓]\s*/u, '');
}

/** EN → EN is never a translation; `auto` has no code yet and never matches. */
function isSameLanguagePair(source: string | null | undefined, target: string | null | undefined): boolean {
  const from = normalizeLangCode(source);
  return from != null && from === normalizeLangCode(target);
}

function languageCode(code: string | null | undefined): string | null {
  return normalizeLangCode(code)?.toUpperCase() ?? null;
}

export function PopupTranslator({ onOpenAssistant }: PopupTranslatorProps) {
  const { t: tUi, locale } = useI18n();
  const [query, setQuery] = useState('');
  const [added, setAdded] = useState(false);
  const [enrichPatch, setEnrichPatch] = useState<EnrichPatch | null>(null);
  const [imagePending, setImagePending] = useState(false);
  const [examplesPending, setExamplesPending] = useState(false);
  const [imageRefreshing, setImageRefreshing] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageNonce, setImageNonce] = useState(0);
  const [collocationsOpen, setCollocationsOpen] = useState(false);
  const collocationsOpenRef = useRef(false);
  collocationsOpenRef.current = collocationsOpen;
  const showCollocationsRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef(false);
  const langMenuOpenRef = useRef(false);
  const lexemeIdRef = useRef<number | null>(null);
  const queryRef = useRef(query);
  const translatedTextRef = useRef<string | null>(null);
  const lastAutoTextRef = useRef('');
  const lastAutoAtRef = useRef(0);
  const onOpenAssistantRef = useRef(onOpenAssistant);
  const retranslateAfterSwapRef = useRef(false);
  queryRef.current = query;
  onOpenAssistantRef.current = onOpenAssistant;

  const { sourceLang, targetLang, setSourceLang, setTargetLang, swap } = useSessionLanguagePair({
    allowAutoSource: true,
  });
  const { lexicalDomain, setLexicalDomain } = useSessionLexicalDomain('auto');
  const langOptions = useLanguageOptions([sourceLang, targetLang]);
  const langsRef = useRef({ sourceLang, targetLang, lexicalDomain });
  langsRef.current = { sourceLang, targetLang, lexicalDomain };

  const translateMutation = useTranslate();
  const addMutation = useAddToVocabulary();
  translatedTextRef.current = translateMutation.data?.text ?? null;

  useEffect(() => {
    const result = translateMutation.data;
    lexemeIdRef.current = result?.lexemeId ?? null;
    translatedTextRef.current = result?.text ?? null;
    if (!result) return;
    const exampleCount = uniqueExampleSentences(
      result.exampleSentence,
      result.exampleSentence2
    ).length;
    if (exampleCount >= 2 || result.isOfflineFallback || result.lexemeId == null) {
      setExamplesPending(false);
    }
    if (result.imagePath) {
      setEnrichPatch((prev) => ({
        usageNote: prev?.usageNote ?? null,
        exampleSentence: prev?.exampleSentence ?? null,
        exampleSentence2: prev?.exampleSentence2 ?? null,
        imagePath: result.imagePath ?? null,
      }));
      setImagePending(false);
    } else if (result.lexemeId == null) {
      // Offline / failed persist: no enrich event will arrive.
      setImagePending(false);
    }
  }, [translateMutation.data]);

  // Back from the collocations view: focus returns to the button that opened it.
  useEffect(() => {
    if (collocationsOpen || !returnFocusRef.current) return;
    returnFocusRef.current = false;
    showCollocationsRef.current?.focus();
  }, [collocationsOpen]);

  const closeCollocations = () => {
    returnFocusRef.current = true;
    setCollocationsOpen(false);
  };

  const handleClose = () => {
    void ipc.window.closePopup();
  };

  const handleClearQuery = () => {
    setQuery('');
    translateMutation.reset();
    setEnrichPatch(null);
    setImagePending(false);
    setExamplesPending(false);
    setAdded(false);
    setCollocationsOpen(false);
    addMutation.reset();
  };

  const handleTranslate = (text: string, overrideTarget?: string, overrideDomain?: LexicalDomain) => {
    if (!text.trim()) return;
    if (isSameLanguagePair(langsRef.current.sourceLang, overrideTarget ?? langsRef.current.targetLang)) {
      return;
    }
    setAdded(false);
    setCollocationsOpen(false);
    addMutation.reset();
    setEnrichPatch(null);
    setImagePending(true);
    setExamplesPending(true);
    setImageRefreshing(false);
    setImageError(null);
    setImageNonce(0);
    const langs = langsRef.current;
    translateMutation.mutate({
      text: text.trim(),
      sourceLanguage: langs.sourceLang === 'auto' ? null : langs.sourceLang,
      targetLanguage: overrideTarget ?? langs.targetLang,
      contextSentence: null,
      lexicalDomain: overrideDomain ?? langs.lexicalDomain,
    });
  };

  const handleTargetChange = (nextTarget: string) => {
    setTargetLang(nextTarget);
    if (query.trim()) {
      handleTranslate(query, nextTarget);
    }
  };

  const handleSwap = () => {
    retranslateAfterSwapRef.current = true;
    swap(translateMutation.data?.sourceLanguage);
  };

  // The swapped pair is in langsRef only after the re-render.
  useEffect(() => {
    if (!retranslateAfterSwapRef.current) return;
    retranslateAfterSwapRef.current = false;
    if (queryRef.current.trim()) handleTranslate(queryRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceLang, targetLang]);

  const handleDomainChange = (nextDomain: LexicalDomain) => {
    setLexicalDomain(nextDomain);
    if (query.trim()) {
      handleTranslate(query, undefined, nextDomain);
    }
  };

  const handleRegenerateImage = () => {
    const lexemeId = translateMutation.data?.lexemeId;
    if (!lexemeId || imageRefreshing) return;
    setImagePending(false);
    setImageRefreshing(true);
    setImageError(null);
    void ipc.media
      .regenerateImage(lexemeId)
      .then((path) => {
        setEnrichPatch((prev) => ({
          usageNote: prev?.usageNote ?? null,
          exampleSentence: prev?.exampleSentence ?? null,
          exampleSentence2: prev?.exampleSentence2 ?? null,
          imagePath: path,
        }));
        setImageNonce((n) => n + 1);
      })
      .catch((err: unknown) => {
        setImageError(formatImageProviderError(err));
      })
      .finally(() => {
        setImageRefreshing(false);
      });
  };

  useEffect(() => {
    const shouldApplyAutoText = (text: string): boolean => {
      const now = Date.now();
      if (text === lastAutoTextRef.current && now - lastAutoAtRef.current < AUTO_TEXT_DEBOUNCE_MS) {
        return false;
      }
      lastAutoTextRef.current = text;
      lastAutoAtRef.current = now;
      return true;
    };

    const applyCaptured = (raw: unknown, allowEmpty: boolean) => {
      if (typeof raw !== 'string') return;
      const text = raw.trim();
      if (!text) {
        if (allowEmpty) {
          lastAutoTextRef.current = '';
          lastAutoAtRef.current = 0;
          setQuery('');
          translateMutation.reset();
          setEnrichPatch(null);
          setImagePending(false);
          setExamplesPending(false);
          setAdded(false);
          setCollocationsOpen(false);
        }
        return;
      }
      // Parent PopupApp routes sentences to the assistant and voice sessions to
      // the recorder; do not start a dictionary lookup that would flash the card.
      const kind = classifyPopupText(text);
      if (kind === 'voice') return;
      if (onOpenAssistantRef.current && kind === 'assistant') {
        return;
      }
      const alreadyShowing =
        text === queryRef.current.trim() &&
        (translatedTextRef.current?.trim().toLocaleLowerCase() ?? '') ===
          text.toLocaleLowerCase();
      if (alreadyShowing || !shouldApplyAutoText(text)) return;
      setQuery(text);
      handleTranslate(text);
    };

    void Promise.resolve(ipc.window.getPendingPopupText())
      .then((raw) => applyCaptured(raw, false))
      .catch(() => undefined);

    const unlistenEventPromise = listen<string>('lexora:popup-text', (event) => {
      applyCaptured(event.payload, true);
    });

    const unlistenFocusPromise = getCurrentWindow().onFocusChanged(({ payload: focused }) => {
      if (focused) {
        void Promise.resolve(ipc.window.getPendingPopupText())
          .then((raw) => applyCaptured(raw, false))
          .catch(() => undefined);
      }
    });

    const unlistenEnrichPromise = listen<CardEnrichEvent>('lexora:card-enrich', (event) => {
      const payload = event.payload;
      if (lexemeIdRef.current != null && payload.lexemeId === lexemeIdRef.current) {
        setEnrichPatch((prev) => ({
          usageNote: payload.usageNote ?? prev?.usageNote ?? null,
          exampleSentence: payload.exampleSentence ?? prev?.exampleSentence ?? null,
          exampleSentence2: payload.exampleSentence2 ?? prev?.exampleSentence2 ?? null,
          imagePath: payload.imagePath ?? prev?.imagePath ?? null,
        }));
        if (payload.imagePath || isCardEnrichComplete(payload)) {
          setImagePending(false);
        }
        const exampleCount = uniqueExampleSentences(
          payload.exampleSentence,
          payload.exampleSentence2
        ).length;
        if (exampleCount >= 2 || isCardEnrichComplete(payload)) {
          setExamplesPending(false);
        }
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (langMenuOpenRef.current) return;
      const target = e.target;
      if (target instanceof Element && target.closest('.language-select')) return;
      // Esc on the collocations view goes back to the word, not out of the popup.
      if (collocationsOpenRef.current) {
        returnFocusRef.current = true;
        setCollocationsOpen(false);
        return;
      }
      handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      void unlistenEventPromise.then((unlisten) => unlisten());
      void unlistenFocusPromise.then((unlisten) => unlisten());
      void unlistenEnrichPromise.then((unlisten) => unlisten());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const base = translateMutation.data;
  const data = base
    ? {
        ...base,
        usageNote: enrichPatch?.usageNote ?? base.usageNote,
        exampleSentence: enrichPatch?.exampleSentence ?? base.exampleSentence,
        exampleSentence2: enrichPatch?.exampleSentence2 ?? base.exampleSentence2,
        imagePath: enrichPatch?.imagePath ?? base.imagePath,
        sourceSynonyms: base.sourceSynonyms ?? [],
      }
    : undefined;

  const handleAdd = () => {
    if (!data) return;
    addMutation.mutate(
      {
        lexemeId: data.lexemeId,
        text: data.text,
        sourceLanguage:
          data.sourceLanguage && data.sourceLanguage !== 'auto'
            ? data.sourceLanguage
            : sourceLang === 'auto'
              ? 'en'
              : sourceLang,
        source: 'popup',
      },
      {
        onSuccess: () => {
          setAdded(true);
          setExamplesPending(false);
          setTimeout(() => {
            handleClose();
            setAdded(false);
          }, 1000);
        },
      }
    );
  };

  const handleSpeak = () => {
    if (!data) return;
    void ipc.media.playTts(data.text, data.sourceLanguage || null);
  };

  const handleCheckWriting = () => {
    const text = query.trim();
    if (!isLongWritingText(text)) return;
    saveWritingDraft(text);
    void emit(OPEN_WRITING_EVENT, text);
    void ipc.window.openMain();
    handleClose();
  };

  const isWritingQuery = isLongWritingText(query);
  const canOpenAssistant = Boolean(onOpenAssistant) && classifyPopupText(query) === 'assistant';
  const frequencyLabel = formatFrequencyHint(data?.frequencyHint);
  const collocationLexemeId =
    data && data.lexemeId != null && !data.isOfflineFallback && canHaveCollocations(data.text, data.partOfSpeech)
      ? data.lexemeId
      : null;
  const exampleSentences = data
    ? uniqueExampleSentences(data.exampleSentence, data.exampleSentence2)
    : [];
  const waitingForExamples =
    data != null &&
    examplesPending &&
    exampleSentences.length < 2 &&
    !data.isOfflineFallback &&
    !added;

  // Pair shown in every popup; with Auto it shows the detected source once known.
  const shownSource = sourceLang === 'auto' ? data?.sourceLanguage : sourceLang;
  const sourceCode = languageCode(shownSource) ?? tUi("Auto");
  const targetCode = languageCode(targetLang) ?? targetLang.toUpperCase();
  const sourceName =
    getLanguageEntry(shownSource)?.name
    ?? (sourceLang === 'auto' ? tUi("Auto") : languageLabel(sourceLang, false, locale));
  const targetName = languageLabel(targetLang, false, locale);
  const pairConflict = isSameLanguagePair(shownSource, targetLang);
  const translateBlocked = sourceLang !== 'auto' && pairConflict;
  const addLabel = added ? tUi("✓ Added to Vocabulary") : tUi("+ Add Word");

  // Highlights the query word inside the example sentence
  const renderHighlightedExample = (sentence: string, targetWord: string) =>
    splitByTerm(sentence, targetWord).map((segment, i) =>
      segment.match ? (
        <span key={i} className="popup-example-highlight">{segment.text}</span>
      ) : (
        segment.text
      )
    );

  return (
    <div className="popup-card">
      <div className="popup-header" data-tauri-drag-region>
        <div className="popup-header-brand" data-tauri-drag-region>
          <BrandBadge />
          <span
            className="popup-pair"
            data-testid="popup-language-pair"
            data-tauri-drag-region
            aria-hidden="true"
          >
            <span className="popup-pair-code">{sourceCode}</span>
            <Icon name="arrow_forward" size={14} />
            <span className="popup-pair-code">{targetCode}</span>
          </span>
          <span className="sr-only">
            {sourceName}
            {' → '}
            {targetName}
          </span>
          <IconButton
            icon={<Icon name="swap_horiz" size={17} />}
            aria-label={tUi("Swap languages")}
            onClick={handleSwap}
            size="sm"
            className="popup-swap-btn"
          />
        </div>
        <IconButton
          icon={<Icon name="close" size={18} />}
          aria-label={tUi("Close window")}
          onClick={handleClose}
          size="sm"
          className="popup-close-btn"
        />
      </div>

      <div className="popup-toolbar">
        {/* Layout-only wrapper: keeps the press inside the dropdown from
            reaching window-level handlers; the selects themselves are focusable. */}
        <div className="popup-lang-pair" role="presentation" onMouseDown={(e) => e.stopPropagation()}>
          <LanguageSelect
            className="popup-lang-select"
            compact
            value={sourceLang}
            options={langOptions}
            leadingOptions={[{ value: 'auto', label: tUi("Auto-detect") }]}
            onChange={setSourceLang}
            onOpenChange={(open) => {
              langMenuOpenRef.current = open;
            }}
            ariaLabel={tUi("Source language")}
          />
          <Icon name="arrow_forward" size={16} className="popup-lang-arrow" />
          <LanguageSelect
            className={`popup-lang-select${pairConflict ? ' popup-lang-select--conflict' : ''}`}
            compact
            value={targetLang}
            options={langOptions}
            onChange={handleTargetChange}
            onOpenChange={(open) => {
              langMenuOpenRef.current = open;
            }}
            ariaLabel={tUi("Target language")}
          />
        </div>
        {/* Layout-only wrapper: keeps the press inside the dropdown from
            reaching window-level handlers; the selects themselves are focusable. */}
        <div className="popup-domain-wrap" role="presentation" onMouseDown={(e) => e.stopPropagation()}>
          <TranslationDomainSelect
            compact
            value={lexicalDomain}
            onChange={handleDomainChange}
            detectedDomain={translateMutation.data?.detectedLexicalDomain}
            id="popup-lexical-domain"
          />
        </div>
      </div>

      {pairConflict && (
        <p className="inline-note popup-pair-note" aria-live="polite">
          {tUi("Source and target languages are the same. Choose another target language.")}
        </p>
      )}

      <div className="popup-input-row">
        <div className="field popup-input-field">
          <Icon name="search" size={17} className="field__icon" />
          <input dir="auto"
            type="text"
            className="field__input popup-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTranslate(query)}
            placeholder={tUi("Type or paste a word…")}
            autoFocus
            aria-label={tUi("Translate query")}
          />
          {query.length > 0 && (
            <IconButton
              icon={<Icon name="close" size={16} />}
              aria-label={tUi("Clear text")}
              onClick={handleClearQuery}
              size="sm"
              className="popup-field-clear"
            />
          )}
        </div>
        <Button
          variant="secondary"
          onClick={() => handleTranslate(query)}
          disabled={translateMutation.isPending || translateBlocked}
          aria-label={translateMutation.isPending ? tUi("Translating with AI...") : tUi("Translate")}
          className="popup-search-btn"
        >
          {translateMutation.isPending ? (
            <>
              <span className="popup-spinner-icon" aria-hidden="true" />
              <span>{tUi("Translating…")}</span>
            </>
          ) : (
            tUi("Translate")
          )}
        </Button>
      </div>

      {/* Body */}
      {translateMutation.isPending && (
        <div className="popup-body animate-fade-in" aria-busy="true" aria-live="polite">
          <p className="popup-status-ai">
            <span className="popup-ai-pulse-dot" aria-hidden="true" />
            <span>{tUi("Analyzing context & fetching nuances…")}</span>
          </p>

          {/* Word Header Skeleton */}
          <div className="popup-hero">
            <div className="popup-hero-copy">
              <div className="popup-word-header">
                <div className="popup-shimmer-block popup-skel-word" />
                <div className="popup-shimmer-block popup-skel-ipa" />
              </div>
            </div>
            <div className="associated-image-frame associated-image-frame--hero associated-image-frame--loading" aria-hidden="true">
              <div className="popup-shimmer-block popup-skel-hero-image" />
            </div>
          </div>

          {/* Translation Skeleton */}
          <div className="popup-shimmer-block popup-skel-trans" />

          {/* Alternative tags skeleton */}
          <div className="popup-alternatives">
            <div className="popup-shimmer-block popup-skel-chip" />
            <div className="popup-shimmer-block popup-skel-chip-wide" />
            <div className="popup-shimmer-block popup-skel-chip" />
          </div>

          <div className="popup-examples" aria-hidden="true">
            <div className="popup-skel-example-lines">
              <div className="popup-shimmer-block popup-skel-line" />
              <div className="popup-shimmer-block popup-skel-line-short" />
            </div>
          </div>
        </div>
      )}

      {translateMutation.isError && !translateMutation.isPending && (
        <div className="popup-body animate-fade-in">
          <div className="popup-error-box" role="alert">
            <div className="popup-error-box-title">{tUi("Couldn’t translate")}</div>
            <div>
              {formatProviderError(translateMutation.error)}
            </div>
          </div>
        </div>
      )}

      {!data && !translateMutation.isPending && !translateMutation.isError && (
        <div className="popup-body popup-body--centered">
          <p className="empty__title popup-empty-title">{tUi("Translate a word")}</p>
          <p className="popup-empty-hint">{tUi("Type or paste a word, then press ")}<kbd className="kbd">{tUi("Enter")}</kbd>
          </p>
          <p className="popup-empty-hint">{tUi("Open from the menu bar anytime, or select text and use your translate shortcut.")}</p>
        </div>
      )}

      {data && !translateMutation.isPending && collocationsOpen && collocationLexemeId != null && (
        <div className="popup-body animate-fade-in">
          <CollocationList
            lexemeId={collocationLexemeId}
            word={data.text}
            targetLanguage={data.targetLanguage || targetLang}
            onBack={closeCollocations}
          />
        </div>
      )}

      {data && !translateMutation.isPending && !(collocationsOpen && collocationLexemeId != null) && (
        <div className="popup-body animate-fade-in">
          {/* Offline fallback notice */}
          {data.isOfflineFallback && (
            <div className="tag tag--warn popup-offline-chip" role="status">{tUi("⚠ Offline result — configure AI provider in Settings")}</div>
          )}

          {/* Hero: word + IPA on the left, square photo on the right */}
          <div className="popup-hero">
            <div className="popup-hero-copy">
              <div className="popup-word-header">
                <h1 className="popup-source-text">{data.text}</h1>
                <div className="popup-meta-row">
                  {data.phonetic && <span className="ipa popup-phonetic">{data.phonetic}</span>}
                  <PosBadge pos={data.partOfSpeech} />
                  {frequencyLabel && <span className="num popup-frequency">{frequencyLabel}</span>}
                  <IconButton
                    icon={<Icon name="volume_up" size={17} />}
                    aria-label={tUi("Pronounce word")}
                    onClick={handleSpeak}
                    variant="secondary"
                    size="sm"
                    className="popup-speaker-inline"
                  />
                </div>
                {data.sourceSynonyms.length > 0 && (
                  <div className="popup-source-synonyms" aria-label={tUi("Source language synonyms")}>
                    {data.sourceSynonyms.map((syn) => (
                      <span key={syn} className="tag">
                        {syn}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="popup-hero-visual">
              <AssociatedImage
                path={data.imagePath}
                alt={tUi("Photo of {word}", { word: data.text })}
                isLoading={imagePending && !data.imagePath}
                isRefreshing={imageRefreshing}
                size="hero"
                cacheNonce={imageNonce}
                onRegenerate={data.lexemeId ? handleRegenerateImage : undefined}
              />
              {imageError && (
                <p className="inline-error popup-image-error" role="alert">
                  {imageError}
                </p>
              )}
            </div>
          </div>

          {/* Main Translation & Alternatives */}
          <div className="popup-translation-section">
            <div className="popup-main-trans" dir="auto">{data.mainTranslation}</div>
            {data.alternatives?.length > 0 && (
              <div className="popup-alternatives">
                {data.alternatives.map((alt) => (
                  <span key={alt} className="tag">
                    {alt}
                  </span>
                ))}
              </div>
            )}
            {collocationLexemeId != null && (
              <button
                ref={showCollocationsRef}
                type="button"
                className="btn btn--ghost btn--sm popup-collocations-btn"
                onClick={() => setCollocationsOpen(true)}
              >
                <Icon name="link" size={17} />
                {tUi("Show collocations")}
              </button>
            )}
          </div>

          {(exampleSentences.length > 0 || waitingForExamples) && (
            <div className="popup-examples" aria-label={tUi("Example sentences in context")}>
              {exampleSentences.map((sentence) => (
                <p key={sentence} className="example popup-example-text" dir="auto">
                  “{renderHighlightedExample(sentence, data.text)}”
                </p>
              ))}
              {waitingForExamples &&
                Array.from({ length: 2 - exampleSentences.length }, (_, i) => (
                  <div key={`example-skel-${i}`} className="popup-skel-example-lines" aria-hidden="true">
                    <div className="popup-shimmer-block popup-skel-line" />
                    <div className="popup-shimmer-block popup-skel-line-short" />
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {addMutation.isError && !added && (
        <p className="inline-error popup-add-error" role="alert">{tUi("Couldn’t add this word. Please try again.")}</p>
      )}

      {/* Footer action */}
      <div className="popup-footer">
        <IconButton
          icon={<Icon name="volume_up" size={18} />}
          aria-label={tUi("Listen audio")}
          onClick={handleSpeak}
          disabled={!data}
          size="sm"
        />
        <IconButton
          icon={<Icon name="bookmark" size={18} />}
          aria-label={tUi("Save bookmark")}
          onClick={handleAdd}
          disabled={!data || added || addMutation.isPending}
          size="sm"
        />
        <span className="popup-hints">
          <span className="hint">
            <kbd className="kbd">↵</kbd>
            {tUi("Translate")}
          </span>
          <span className="hint">
            <kbd className="kbd">{ESC_KEY_LABEL}</kbd>
            {tUi("Close")}
          </span>
        </span>
        <span className="spacer" />

        {canOpenAssistant ? (
          <Button
            variant="primary"
            onClick={() => onOpenAssistant?.(query.trim())}
            aria-label={tUi("Open AI Assistant")}
          >
            <Icon name="auto_awesome" size={17} />
            {tUi("AI Assistant")}
          </Button>
        ) : isWritingQuery ? (
          <Button
            variant="primary"
            onClick={handleCheckWriting}
            aria-label={tUi("Check Writing")}
          >
            <Icon name="spellcheck" size={17} />
            {tUi("Check Writing")}
          </Button>
        ) : (
          <Button
            variant="primary"
            className={`popup-add-btn${added ? ' is-added' : ''}`}
            onClick={handleAdd}
            disabled={!data || added || addMutation.isPending}
            aria-label={addLabel}
          >
            <Icon name={added ? 'check' : 'bookmark_add'} size={17} />
            {withoutLeadingGlyph(addLabel)}
          </Button>
        )}
      </div>
    </div>
  );
}
