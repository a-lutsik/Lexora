import { t as tUi } from "../i18n";
import { useI18n } from "../hooks/useI18n";
// ============================================================
// LEXORA — Inline AI Assistant Widget
// Compact popup for translate / fix / rewrite of selected sentences.
// ============================================================

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { emit } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { BrandBadge } from '../components/ui/Logo';
import { ipc } from '../lib/ipc';
import { copyToClipboard } from '../lib/utils';
import { findPasteRisks, stripInvisibleChars } from '../lib/pasteSafety';
import type { PasteRisk } from '../lib/pasteSafety';
import { useSettings } from '../hooks/useSettings';
import {
  assistantKickerTitle,
  formatProviderError,
  INLINE_MODE_TABS,
  isRateLimitError,
  modeFromShortcutKey,
  RATE_LIMIT_COOLDOWN_MS,
  rewriteModeForAssistant,
  TEXT_COMPOSE_DEBOUNCE_MS,
  TEXT_REGISTER_DEBOUNCE_MS,
  TEXT_REGISTER_OPTIONS,
  TEXT_TAB_TARGET_LANGUAGE,
  textRegisterInstruction,
} from '../lib/inlineAssistant';
import type {
  InlineAssistantMode,
  InlineAssistantResult,
  TextRegister,
  WritingCheckDto,
  WritingIssueDto,
  WritingIssueStatus,
} from '../lib/types';
import { applyVisibleFixes, overlayIssueStatuses, usableIssues } from '../lib/writingDiff';
import { OPEN_WRITING_EVENT, saveWritingDraft } from '../lib/writingText';
import { InlineFixSuggestions } from './InlineFixSuggestions';
import { TranslationDomainSelect } from '../components/domain/TranslationDomainSelect';
import { useSessionLexicalDomain } from '../hooks/useSessionLexicalDomain';
import './inline-assistant.css';

type InlineAssistantWidgetProps = {
  sourceText: string;
  targetLanguage?: string;
  onSwitchToDictionary: () => void;
};

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ClearFieldIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

function mutationErrorMessage(error: unknown): string {
  return formatProviderError(error);
}

const PASTE_RISK_LABELS: Record<PasteRisk, string> = {
  'new-link': 'a link',
  'new-line': 'line breaks',
};

function pasteRiskMessage(risks: PasteRisk[]): string {
  const added = risks.map((risk) => tUi(PASTE_RISK_LABELS[risk])).join(tUi(" and "));
  return tUi("The result adds {added} that your text did not have. Review it, then press Accept.", { added });
}

function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
}

export function InlineAssistantWidget({
  sourceText,
  targetLanguage: targetLanguageProp,
  onSwitchToDictionary,
}: InlineAssistantWidgetProps) {
  const { t: tUi } = useI18n();
  const { data: settings } = useSettings();
  const targetLanguage = targetLanguageProp ?? settings?.interfaceLanguage ?? 'ru';
  const { lexicalDomain, setLexicalDomain } = useSessionLexicalDomain('auto');
  const [detectedDomain, setDetectedDomain] = useState<string | null>(null);
  const [mode, setMode] = useState<InlineAssistantMode>('translate');
  const [composeText, setComposeText] = useState(sourceText);
  const [textRegister, setTextRegister] = useState<TextRegister>('general');
  const [variants, setVariants] = useState<InlineAssistantResult[]>([]);
  const [fixCheck, setFixCheck] = useState<WritingCheckDto | null>(null);
  const [fixOverlay, setFixOverlay] = useState<Record<number, WritingIssueStatus>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const composeRef = useRef<HTMLTextAreaElement>(null);
  const composeTextRef = useRef(composeText);
  const textRegisterRef = useRef(textRegister);
  const lexicalDomainRef = useRef(lexicalDomain);
  const menuRef = useRef<HTMLDivElement>(null);
  const rateLimitUntilRef = useRef(0);
  const generationRef = useRef(0);
  const copiedTimerRef = useRef<number | null>(null);
  const lastComposeForDebounceRef = useRef(composeText);
  const lastTextRequestKeyRef = useRef<string | null>(null);
  const outputId = useId();
  composeTextRef.current = composeText;
  textRegisterRef.current = textRegister;
  lexicalDomainRef.current = lexicalDomain;

  const result = variants[activeIndex];
  const fixIssues = fixCheck ? overlayIssueStatuses(fixCheck.issues, fixOverlay) : [];
  const fixedText = fixCheck ? applyVisibleFixes(fixCheck.originalText, fixIssues) : '';
  const fixCount = fixCheck ? usableIssues(fixCheck.originalText, fixIssues).length : 0;
  // Fix mode: «Accept» writes the text with every fix that was not dismissed.
  // Invisible characters are stripped so what is shown is exactly what is pasted.
  const outputText = stripInvisibleChars(
    mode === 'fix'
      ? fixCheck && fixedText !== fixCheck.originalText
        ? fixedText
        : ''
      : (result?.outputText ?? ''),
  );
  // Model output may carry instructions injected via the selected text:
  // links or line breaks the source lacked disable the keyboard shortcuts.
  const pasteRisks = outputText
    ? findPasteRisks(mode === 'text' ? composeText : sourceText, outputText)
    : [];
  const hasPasteRisk = pasteRisks.length > 0;

  const runGeneration = useCallback(
    async (nextMode: InlineAssistantMode, append: boolean) => {
      const text = (nextMode === 'text' ? composeTextRef.current : sourceText).trim();
      if (!text) return;

      const now = Date.now();
      if (now < rateLimitUntilRef.current) {
        const waitSec = Math.ceil((rateLimitUntilRef.current - now) / 1000);
        setError(
          tUi("Too many requests. Wait {waitSec}s, then try again.", { waitSec: waitSec })
        );
        return;
      }

      const requestId = generationRef.current + 1;
      generationRef.current = requestId;
      setIsLoading(true);
      setError(null);
      setCopied(false);
      setApplied(false);

      try {
        if (nextMode === 'fix') {
          // Language defaults to the learning language on the backend.
          const check = await ipc.writing.check({ text });
          if (generationRef.current !== requestId) return;
          setFixCheck(check);
          setFixOverlay({});
          return;
        }

        let next: InlineAssistantResult;
        if (nextMode === 'translate') {
          const translation = await ipc.translate.text({
            text,
            sourceLanguage: null,
            targetLanguage,
            contextSentence: null,
            lexicalDomain: lexicalDomainRef.current,
          });
          setDetectedDomain(translation.detectedLexicalDomain ?? null);
          next = {
            outputText: translation.mainTranslation,
            mode: nextMode,
            targetLanguage,
          };
        } else if (nextMode === 'text') {
          const rewritten = await ipc.writing.rewrite({
            text,
            mode: 'custom',
            customPrompt: textRegisterInstruction(textRegisterRef.current),
          });
          next = {
            outputText: rewritten.correctedText ?? text,
            mode: nextMode,
            targetLanguage: TEXT_TAB_TARGET_LANGUAGE,
            ...(rewritten.summary ? { changesSummary: rewritten.summary } : {}),
          };
        } else {
          const rewritten = await ipc.writing.rewrite({
            text,
            language: 'en',
            mode: rewriteModeForAssistant(nextMode),
          });
          next = {
            outputText: rewritten.correctedText ?? text,
            mode: nextMode,
            ...(rewritten.summary ? { changesSummary: rewritten.summary } : {}),
          };
        }

        if (generationRef.current !== requestId) return;
        setVariants((prev) => {
          const list = append ? [...prev, next] : [next];
          setActiveIndex(list.length - 1);
          return list;
        });
      } catch (err) {
        if (generationRef.current !== requestId) return;
        const message = mutationErrorMessage(err);
        if (isRateLimitError(message) || isRateLimitError(String(err))) {
          rateLimitUntilRef.current = Date.now() + RATE_LIMIT_COOLDOWN_MS;
        }
        setError(message);
      } finally {
        if (generationRef.current === requestId) {
          setIsLoading(false);
        }
      }
    },
    [sourceText, targetLanguage, tUi]
  );

  useEffect(() => {
    setComposeText(sourceText);
  }, [sourceText]);

  useEffect(() => {
    if (mode === 'text') {
      composeRef.current?.focus();
    }
  }, [mode]);

  useEffect(() => {
    setError(null);
    setCopied(false);
    setApplied(false);
    setVariants([]);
    setActiveIndex(0);
    setFixCheck(null);
    setFixOverlay({});
    if (mode === 'text' || !sourceText.trim()) return;
    void runGeneration(mode, false);
  }, [mode, sourceText, lexicalDomain, runGeneration]);

  useEffect(() => {
    if (mode !== 'text') {
      lastTextRequestKeyRef.current = null;
      lastComposeForDebounceRef.current = composeText;
      return;
    }
    const text = composeText.trim();
    if (!text) {
      lastTextRequestKeyRef.current = null;
      lastComposeForDebounceRef.current = composeText;
      setVariants([]);
      setActiveIndex(0);
      setError(null);
      return;
    }
    const composeChanged = lastComposeForDebounceRef.current !== composeText;
    lastComposeForDebounceRef.current = composeText;
    const requestKey = `${textRegister}:${text}`;
    if (requestKey === lastTextRequestKeyRef.current) return;
    const delay =
      composeChanged || lastTextRequestKeyRef.current === null
        ? TEXT_COMPOSE_DEBOUNCE_MS
        : TEXT_REGISTER_DEBOUNCE_MS;
    const timer = window.setTimeout(() => {
      lastTextRequestKeyRef.current = requestKey;
      void runGeneration('text', false);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [mode, composeText, textRegister, runGeneration]);

  useEffect(() => {
    const handlePointer = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointer);
    return () => document.removeEventListener('mousedown', handlePointer);
  }, []);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current != null) {
        window.clearTimeout(copiedTimerRef.current);
      }
    };
  }, []);

  const handleClose = () => {
    void ipc.window.closePopup();
  };

  const handleClearCompose = () => {
    generationRef.current += 1;
    lastTextRequestKeyRef.current = null;
    lastComposeForDebounceRef.current = '';
    setComposeText('');
    setVariants([]);
    setActiveIndex(0);
    setError(null);
    setCopied(false);
    setApplied(false);
    setIsLoading(false);
    composeRef.current?.focus();
  };

  const handleCopy = useCallback(async () => {
    if (!outputText) return;
    try {
      const copiedOk = await copyToClipboard(outputText);
      if (!copiedOk) return;
      setCopied(true);
      if (copiedTimerRef.current != null) window.clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = window.setTimeout(() => setCopied(false), 1200);
    } catch (err) {
      setError(mutationErrorMessage(err));
    }
  }, [outputText]);

  const handleAccept = useCallback(async () => {
    if (!outputText || isLoading) return;
    try {
      await ipc.popup.acceptAndReplace(outputText);
      setApplied(true);
      // Keep Writing stats honest: what was applied counts as accepted.
      if (mode === 'fix' && fixCheck && fixCheck.id > 0) {
        void ipc.writing.acceptAll(fixCheck.id).catch(() => undefined);
      }
    } catch (err) {
      setError(mutationErrorMessage(err));
    }
  }, [outputText, isLoading, mode, fixCheck]);

  const handleSetFixStatus = useCallback(
    (issue: WritingIssueDto, status: WritingIssueStatus) => {
      setApplied(false);
      setFixOverlay((prev) => ({ ...prev, [issue.id]: status }));
      // Ephemeral checks (privacy mode) have id 0 and nothing to persist.
      if (fixCheck && fixCheck.id > 0) {
        void ipc.writing.updateIssueStatus(issue.id, status).catch(() => undefined);
      }
    },
    [fixCheck],
  );

  const handleNextVariant = () => {
    if (variants.length === 0) return;
    setActiveIndex((index) => (index + 1) % variants.length);
  };

  const handleSaveNotes = () => {
    const text = outputText || (mode === 'text' ? composeText : sourceText).trim();
    if (!text) return;
    saveWritingDraft(text);
    void emit(OPEN_WRITING_EVENT, text);
    void ipc.window.openMain();
    handleClose();
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const typing = isTypingTarget(event.target);

      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        if (!hasPasteRisk) void handleAccept();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'c') {
        const selection = window.getSelection()?.toString() ?? '';
        if (!selection && outputText) {
          event.preventDefault();
          void handleCopy();
        }
        return;
      }

      if (typing) return;

      if (event.key === 'Enter') {
        event.preventDefault();
        if (!hasPasteRisk) void handleAccept();
        return;
      }

      const shortcutMode = modeFromShortcutKey(event.key);
      if (shortcutMode) {
        event.preventDefault();
        setMode(shortcutMode);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAccept, handleCopy, outputText, hasPasteRisk]);

  const kicker = assistantKickerTitle(mode, targetLanguage, textRegister);
  const acceptLabel =
    mode === 'fix' && fixCount > 0
      ? fixCount === 1
        ? tUi("Accept {count} fix", { count: fixCount })
        : tUi("Accept {count} fixes", { count: fixCount })
      : tUi("Accept");

  const handleResizeDrag = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    void getCurrentWindow().startResizeDragging('SouthEast');
  };

  const canRegenerate =
    !isLoading && (mode === 'text' ? Boolean(composeText.trim()) : Boolean(sourceText.trim()));

  return (
    <div className="inline-assistant">
      <div className="inline-header" data-tauri-drag-region>
        <BrandBadge />
        <button
          type="button"
          className="inline-close-btn"
          onClick={handleClose}
          aria-label={tUi("Close window")}
        >
          <CloseIcon />
        </button>
      </div>

      <div className="inline-mode-bar" role="tablist" aria-label={tUi("AI actions")}>
        <div className="inline-mode-tabs">
          {INLINE_MODE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={mode === tab.id}
              aria-label={`${tUi(tab.label)} (${tab.shortcut})`}
              className={`inline-mode-btn${mode === tab.id ? ' is-active' : ''}`}
              onClick={() => setMode(tab.id)}
            >
              {tUi(tab.label)}
            </button>
          ))}
        </div>
        {mode === 'translate' && (
          <div className="inline-domain-wrap">
            <TranslationDomainSelect
              compact
              value={lexicalDomain}
              onChange={(next) => {
                setLexicalDomain(next);
                setDetectedDomain(null);
              }}
              detectedDomain={detectedDomain}
              id="inline-lexical-domain"
            />
          </div>
        )}
      </div>

      <div
        className={`inline-body${isLoading ? ' is-shimmer' : ''}`}
        aria-busy={isLoading}
        aria-live="polite"
      >
        <div className="inline-accent-bar" aria-hidden="true" />
        <div className="inline-body-copy">
          <h2 className="inline-kicker" id={outputId} data-tauri-drag-region>
            {kicker}
          </h2>

          {mode === 'text' && (
            <>
              <div className="inline-register-row" role="radiogroup" aria-label={tUi("Translation register")}>
                {TEXT_REGISTER_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={textRegister === option.id}
                    className={`inline-register-btn${textRegister === option.id ? ' is-active' : ''}`}
                    onClick={() => setTextRegister(option.id)}
                  >
                    {tUi(option.label)}
                  </button>
                ))}
              </div>
              <div className="inline-compose-wrap">
                <textarea dir="auto"
                  ref={composeRef}
                  className="inline-compose"
                  value={composeText}
                  onChange={(event) => setComposeText(event.target.value)}
                  placeholder={tUi("Type in Russian or any language…")}
                  aria-label={tUi("Text to translate")}
                  rows={3}
                />
                {composeText.length > 0 && (
                  <button
                    type="button"
                    className="inline-field-clear"
                    onClick={handleClearCompose}
                    aria-label={tUi("Clear text")}
                  >
                    <ClearFieldIcon />
                  </button>
                )}
              </div>
            </>
          )}

          {isLoading && (
            <div className="inline-shimmer-lines" aria-hidden="true">
              <div className="inline-shimmer-line" />
              <div className="inline-shimmer-line" />
              <div className="inline-shimmer-line is-short" />
            </div>
          )}
          {error && !isLoading && (
            <p className="inline-error" role="alert">
              {error}
            </p>
          )}
          {mode === 'fix' && !isLoading && !error && fixCheck && (
            <InlineFixSuggestions
              check={fixCheck}
              issues={fixIssues}
              onSetStatus={handleSetFixStatus}
            />
          )}
          {mode !== 'fix' && !isLoading && !error && outputText && (
            <>
              {result?.changesSummary && (
                <p className="inline-summary">{result.changesSummary}</p>
              )}
              <p className="inline-output" aria-labelledby={outputId}>
                {outputText}
              </p>
              {hasPasteRisk && (
                <p className="inline-paste-warning" role="alert">
                  {pasteRiskMessage(pasteRisks)}
                </p>
              )}
            </>
          )}
          {!isLoading && !error && (mode === 'fix' ? !fixCheck : !outputText) && (
            <p className="inline-placeholder">
              {mode === 'text'
                ? tUi("Type a message to get an English translation.")
                : tUi("Waiting for AI…")}
            </p>
          )}
        </div>
      </div>

      <div className="inline-footer">
        <button
          type="button"
          className="inline-accept"
          onClick={() => void handleAccept()}
          disabled={!outputText || isLoading}
          aria-label={applied ? tUi("Applied") : acceptLabel}
        >
          {applied ? tUi("✓ Applied") : acceptLabel}
        </button>

        <div className="inline-info-pill">
          <button
            type="button"
            className="inline-info-btn"
            onClick={() => void handleAccept()}
            disabled={!outputText || isLoading}
            aria-label={tUi("Accept all changes to your text")}
          >{tUi("Accept all changes to your text")}</button>
          <button
            type="button"
            className="inline-info-btn"
            onClick={handleNextVariant}
            disabled={variants.length === 0}
            aria-label={tUi("Next variant")}
          >{tUi("Next")}</button>
        </div>

        <div className="inline-footer-spacer" />

        <button
          type="button"
          className="inline-util-btn"
          onClick={() => void handleCopy()}
          disabled={!outputText}
          aria-label={copied ? tUi("Copied") : tUi("Copy")}
        >
          {copied ? tUi("✓ Copied") : tUi("Copy")}
        </button>

        <div className="inline-menu-wrap" ref={menuRef}>
          <button
            type="button"
            className="inline-util-btn"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={tUi("More actions")}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            •••
          </button>
          {menuOpen && (
            <div className="inline-menu" role="menu">
              <button
                type="button"
                className="inline-menu-item"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onSwitchToDictionary();
                }}
              >{tUi("Dictionary card")}</button>
              <button
                type="button"
                className="inline-menu-item"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  handleSaveNotes();
                }}
              >{tUi("Save to notes")}</button>
            </div>
          )}
        </div>

        <button
          type="button"
          className="inline-util-btn"
          onClick={() => void runGeneration(mode, true)}
          disabled={!canRegenerate}
          aria-label={tUi("Regenerate")}
        >
          <RefreshIcon />
        </button>
      </div>

      <button
        type="button"
        className="inline-resize-grip"
        aria-label={tUi("Resize window")}
        onMouseDown={handleResizeDrag}
      />
    </div>
  );
}
