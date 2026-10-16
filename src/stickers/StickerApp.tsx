import { useCategories } from '../hooks/useCategories';
import { useI18n } from "../hooks/useI18n";
// ============================================================
// LEXORA — Desktop Sticker App Component
// Floating ambient card with multiple visual states matching mockup:
// - Default glassmorphism state
// - Due now indicator state (● Due now)
// - Mature word state with emerald aurora glow
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useQueryClient } from '@tanstack/react-query';
import { useSubmitReview } from '../hooks/useSubmitReview';
import { useDismissStickerCard, useStickerCard } from '../hooks/useStickerCard';
import { useSettings, useUpdateSettings } from '../hooks/useSettings';
import { useCollections } from '../hooks/useCollections';
import { resolveLanguageId, useLanguages } from '../hooks/useLanguages';
import { useSettingsStore } from '../stores/settingsStore';
import { AudioButton } from '../components/domain/AudioButton';
import { StickerSourcePicker } from '../components/domain/StickerSourcePicker';
import { ipc } from '../lib/ipc';
import { APP_EVENTS, QUERY_KEYS } from '../lib/constants';
import { DEFAULT_STICKER_SOURCES } from '../lib/stickerSources';
import type { TranslationBackfilledEvent } from '../lib/types';
import { splitByTerm } from '../lib/utils';
import {
  STICKER_FILTER_CHANGED_EVENT,
  STICKER_SYNC_VISIBILITY_EVENT,
  isEarlyStickerReview,
} from './stickerSlots';
import { stickerSlotFromLabel } from './stickerSlots';
import './sticker.css';

const MS_PER_SECOND = 1000;

function PinIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="12" y1="17" x2="12" y2="22" />
      <path d="M5 17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6h1a1 1 0 001-1V3a1 1 0 00-1-1H8a1 1 0 00-1 1v2a1 1 0 001 1h1v4.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function QuoteIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z" />
      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function ExampleSentence({ sentence, word }: { sentence: string; word: string }) {
  return (
    <span className="sticker-example">
      {splitByTerm(sentence, word).map((segment, index) =>
        segment.match ? (
          <span key={index} className="sticker-example-word">
            {segment.text}
          </span>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </span>
  );
}

export function StickerApp() {
  const { t: tUi } = useI18n();
  const queryClient = useQueryClient();
  const activeLanguageId = useSettingsStore((s) => s.activeLanguageId);
  const { data: settings } = useSettings();
  const { data: languages } = useLanguages();
  const updateSettings = useUpdateSettings();
  // Язык — из настроек (как у бэкенда): Zustand-стор окна стикера не видит
  // смену языка в главном окне до перезагрузки.
  const languageId = resolveLanguageId(languages, settings?.primaryLanguage) ?? activeLanguageId;
  const { data: collections = [] } = useCollections(languageId);
  const { data: categories = [] } = useCategories(languageId);

  const stickerSources = settings?.stickerSources ?? DEFAULT_STICKER_SOURCES;
  const { data: entry, isLoading } = useStickerCard();
  const submitMutation = useSubmitReview();
  const dismissMutation = useDismissStickerCard();
  const actionPending = submitMutation.isPending || dismissMutation.isPending;

  // Перевод скрыт до явного reveal: иначе «Помню» оценивает узнавание
  // подсказки, а не вспоминание, и SRS завышает интервалы.
  const [revealed, setRevealed] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [userHidden, setUserHidden] = useState(false);
  const [syncToken, setSyncToken] = useState(0);
  const cardShownAtRef = useRef(Date.now());
  const lastEntryIdRef = useRef<number | null>(null);

  const translation = entry?.translations[0]?.translatedText ?? null;
  const phonetic = entry?.lexeme.phonetic ?? null;
  const example = entry?.examples[0] ?? null;
  const contextSentence = example?.sentence ?? entry?.translations[0]?.sense ?? null;
  const queueReady = !isLoading;
  const showEmptyTopic = queueReady && !entry && stickerSlotFromLabel(getCurrentWindow().label) === 0
    && (stickerSources.length === 0 || stickerSources.some((source) => source.startsWith('cat:')));

  useEffect(() => {
    void ipc.window.setStickerPinned(false);
  }, []);

  useEffect(() => {
    const unlistenPromise = listen(STICKER_SYNC_VISIBILITY_EVENT, () => {
      setUserHidden(false);
      setSyncToken((token) => token + 1);
    });
    return () => {
      void unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  useEffect(() => {
    const unlistenPromise = listen(STICKER_FILTER_CHANGED_EVENT, () => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SETTINGS] });
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STICKER_CARD] });
    });
    return () => {
      void unlistenPromise.then((unlisten) => unlisten());
    };
  }, [queryClient]);

  useEffect(() => {
    const unlistenPromise = listen<TranslationBackfilledEvent>(
      APP_EVENTS.TRANSLATION_BACKFILLED,
      () => {
        void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STICKER_CARD] });
      },
    );
    return () => {
      void unlistenPromise.then((unlisten) => unlisten());
    };
  }, [queryClient]);

  useEffect(() => {
    const unlisten = listen('lexora:categories-changed', () => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CATEGORIES] });
    });
    return () => { void unlisten.then((stop) => stop()); };
  }, [queryClient]);

  useEffect(() => {
    const nextId = entry?.id ?? null;
    if (nextId !== lastEntryIdRef.current) {
      lastEntryIdRef.current = nextId;
      setRevealed(false);
      setShowContext(false);
      cardShownAtRef.current = Date.now();
    }
  }, [entry?.id]);

  useEffect(() => {
    if (!queueReady) return;
    const win = getCurrentWindow();
    if (!entry && !showEmptyTopic) {
      void win.hide();
      return;
    }
    if (userHidden) return;
    // show() на macOS активирует всё приложение — карточка должна
    // всплывать поверх других окон, не поднимая дашборд Lexora.
    void ipc.window.showSticker();
  }, [entry, queueReady, userHidden, syncToken, showEmptyTopic]);

  const isDueNow = entry?.reviewState
    ? entry.reviewState.dueAt * MS_PER_SECOND <= Date.now()
    : true;

  const isMature = entry?.reviewState?.status === 'mature';

  const handleTogglePin = () => {
    const next = !pinned;
    setPinned(next);
    void ipc.window.setStickerPinned(next);
  };

  const handleClose = () => {
    setUserHidden(true);
    void getCurrentWindow().hide();
    if (entry) {
      dismissMutation.mutate(entry.id);
    }
  };

  const handleToggleReveal = () => {
    setRevealed((prev) => !prev);
  };

  const handleToggleContext = () => {
    if (!contextSentence) return;
    setShowContext((prev) => !prev);
  };

  const dismissCurrent = () => {
    if (!entry || dismissMutation.isPending) return;
    dismissMutation.mutate(entry.id);
  };

  const handleLater = () => {
    dismissCurrent();
  };

  // Самооценка без AI: remembered=true → grade 3 (good), false → grade 0 (blackout).
  // Карточка уходит только после сохранения оценки — иначе ошибка теряется молча.
  // Зрелое слово, подмешанное «для свежести», ещё не к повторению: «Помню»
  // не продлевает интервал досрочно (только убирает карточку), а «Не помню» —
  // настоящий провал и записывается как lapse.
  const handleGrade = (remembered: boolean) => {
    if (!entry?.reviewState || actionPending) return;
    if (remembered && isEarlyStickerReview(entry.reviewState, Date.now())) {
      dismissCurrent();
      return;
    }
    submitMutation.mutate(
      {
        reviewStateId: entry.reviewState.id,
        mode: 'flashcard',
        grade: remembered ? 3 : 0,
        latencyMs: Date.now() - cardShownAtRef.current,
      },
      { onSuccess: dismissCurrent },
    );
  };

  const gradeFailed =
    submitMutation.isError &&
    submitMutation.variables?.reviewStateId === entry?.reviewState?.id;

  const handleSourcesChange = (next: string[]) => {
    if (!settings) return;
    updateSettings.mutate({ ...settings, stickerSources: next });
  };

  let cardStateClass = 'sticker-card';
  if (isMature) {
    cardStateClass += ' sticker-card--mature';
  } else if (isDueNow) {
    cardStateClass += ' sticker-card--due';
  }

  if (!entry) {
    if (!showEmptyTopic) return null;
    return (
      <div className="sticker-container">
        <div className="sticker-card sticker-empty-topic">
          <p role="status" data-tauri-drag-region>{tUi('No words in selected sources. Choose other categories or add words in Vocabulary.')}</p>
          <div className="sticker-empty-actions">
            <button type="button" className="sticker-source-empty-button" onClick={() => setShowFilter(!showFilter)}>{tUi('Sources')}</button>
            <button type="button" className="sticker-source-empty-button" onClick={handleClose} aria-label={tUi('Close sticker')}><CloseIcon /></button>
          </div>
          {showFilter && <div className="sticker-filter-panel">
            <button type="button" className="sticker-source-empty-button" onClick={() => setShowFilter(false)}>{tUi('Close source filter')}</button>
            <StickerSourcePicker sources={stickerSources} categories={categories} collections={collections} onChange={handleSourcesChange} compact />
          </div>}
        </div>
      </div>
    );
  }

  return (
    <div className="sticker-container">
      <div className={cardStateClass}>
        {showFilter && (
          <div className="sticker-filter-panel">
            <div className="sticker-filter-panel-header">
              <span>{tUi("Sources")}</span>
              <button
                type="button"
                className="sticker-icon-btn"
                onClick={() => setShowFilter(false)}
                aria-label={tUi("Close source filter")}
              >
                <CloseIcon />
              </button>
            </div>
            <StickerSourcePicker
              sources={stickerSources}
              collections={collections}
              categories={categories}
              onChange={handleSourcesChange}
              compact
            />
          </div>
        )}

        <div className="sticker-top-row" data-tauri-drag-region>
          <div className="sticker-word-block" data-tauri-drag-region>
            <div className="sticker-word-wrap" aria-live="polite">
              <span className="sticker-word">{entry.lexeme.text}</span>
            </div>
            {phonetic && (
              <span className="phonetic sticker-phonetic">{phonetic}</span>
            )}
          </div>

          <div className="sticker-controls">
            <AudioButton text={entry.lexeme.text} size="sm" />
            <button
              type="button"
              className="sticker-icon-btn"
              onClick={handleToggleReveal}
              aria-label={tUi("Toggle translation visibility")}
              aria-pressed={revealed}
            >
              <EyeIcon />
            </button>
            <button
              type="button"
              className={`sticker-icon-btn${showContext ? ' sticker-icon-btn--active' : ''}`}
              onClick={handleToggleContext}
              disabled={!contextSentence}
              aria-label={
                contextSentence
                  ? showContext
                    ? tUi("Hide example in context")
                    : tUi("Show example in context")
                  : tUi("No examples available")
              }
              aria-pressed={showContext}
            >
              <QuoteIcon />
            </button>
            <button
              type="button"
              className={`sticker-icon-btn${showFilter ? ' sticker-icon-btn--active' : ''}`}
              onClick={() => setShowFilter((prev) => !prev)}
              aria-label={tUi("Filter sticker sources")}
              aria-pressed={showFilter}
            >
              <FilterIcon />
            </button>
            <button
              type="button"
              className={`sticker-icon-btn${pinned ? ' pinned' : ''}`}
              onClick={handleTogglePin}
              aria-label={tUi("Pin on top")}
              aria-pressed={pinned}
            >
              <PinIcon />
            </button>
            <button
              type="button"
              className="sticker-icon-btn sticker-icon-btn--close"
              onClick={handleClose}
              aria-label={tUi("Close sticker")}
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className={`sticker-sub-row${showContext ? ' sticker-sub-row--context' : ''}`}>
          {gradeFailed ? (
            <span className="sticker-error" role="alert">{tUi("Оценка не сохранена — попробуйте ещё раз")}</span>
          ) : showContext && contextSentence ? (
            <ExampleSentence sentence={contextSentence} word={entry.lexeme.text} />
          ) : revealed && translation ? (
            <span className="sticker-translation">{translation}</span>
          ) : (
            <span className="sticker-translation sticker-translation--hidden">••••••</span>
          )}
          {isDueNow && (
            <div className="sticker-due-pill">
              <div className="sticker-due-dot" />
              <span>{tUi("Due now")}</span>
            </div>
          )}
        </div>

        <div className="sticker-actions">
          <button
            type="button"
            className="sticker-btn sticker-btn--good"
            onClick={() => handleGrade(true)}
            disabled={actionPending}
          >{tUi("Помню ✓")}</button>
          <button
            type="button"
            className="sticker-btn sticker-btn--again"
            onClick={() => handleGrade(false)}
            disabled={actionPending}
          >{tUi("Не помню ✕")}</button>
          <button
            type="button"
            className="sticker-btn sticker-btn--later"
            onClick={handleLater}
            disabled={actionPending}
          >{tUi("Позже")}</button>
        </div>
      </div>
    </div>
  );
}
