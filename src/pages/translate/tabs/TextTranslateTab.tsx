import { toneLabel } from '../../../lib/interfaceText';
import { useI18n } from "../../../hooks/useI18n";
// ============================================================
// LEXORA — Text Translate Tab (DeepL Pro Style)
// Dual-pane text translation with language reverse, clipboard
// copy, tone switcher, and vocabulary SRS card creation.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { useTranslateTextHub } from '../../../hooks/useTranslationHub';
import { useAddToVocabulary } from '../../../hooks/useVocabulary';
import { Button } from '../../../components/ui/Button';
import { IconCheck, IconCopy, IconSpeaker, IconSwap } from '../../../components/ui/LuminousIcons';
import { ipc } from '../../../lib/ipc';
import { copyToClipboard } from '../../../lib/utils';
import type { LexicalDomain } from '../../../lib/translationDomain';

type TextTranslateTabProps = {
  sourceLang: string;
  targetLang: string;
  lexicalDomain: LexicalDomain;
  onDetectedDomain?: (domain: string | null) => void;
  onSwapLanguages?: (detectedSource?: string) => void;
};

type ToneOption = 'default' | 'formal' | 'casual' | 'academic';

function applyTone(text: string, targetTone: ToneOption): string {
  if (targetTone === 'formal') return `[Tone: Formal & Professional]\n${text}`;
  if (targetTone === 'casual') return `[Tone: Casual & Conversational]\n${text}`;
  if (targetTone === 'academic') return `[Tone: Academic & Precise]\n${text}`;
  return text;
}

export function TextTranslateTab({
  sourceLang,
  targetLang,
  lexicalDomain,
  onDetectedDomain,
  onSwapLanguages,
}: TextTranslateTabProps) {
  const { t: tUi } = useI18n();
  const [inputText, setInputText] = useState('');
  const [tone, setTone] = useState<ToneOption>('default');
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [cardSaved, setCardSaved] = useState(false);
  const [playingTts, setPlayingTts] = useState<'source' | 'target' | null>(null);
  const [invertedOutput, setInvertedOutput] = useState<string | null>(null);

  const copyTimerRef = useRef<number | null>(null);

  const translateMutation = useTranslateTextHub();
  const addToVocabMutation = useAddToVocabulary();

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    };
  }, []);

  const result = translateMutation.data?.translation;
  const outputText = result?.mainTranslation ?? invertedOutput;
  const canCopy = Boolean(outputText?.trim());

  const runTranslate = (text: string, targetTone: ToneOption = tone) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setInvertedOutput(null);
    translateMutation.mutate(
      {
        req: {
          text: applyTone(trimmed, targetTone),
          sourceLanguage: sourceLang === 'auto' ? null : sourceLang,
          targetLanguage: targetLang,
          contextSentence: null,
          lexicalDomain,
        },
      },
      {
        onSuccess: (data) => {
          onDetectedDomain?.(data.translation.detectedLexicalDomain ?? null);
        },
      },
    );
  };

  const handleTranslate = (targetTone: ToneOption = tone) => {
    runTranslate(inputText, targetTone);
  };

  const handleToneChange = (newTone: ToneOption) => {
    setTone(newTone);
    if (inputText.trim()) {
      runTranslate(inputText, newTone);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleTranslate();
    }
  };

  const handleCopy = async () => {
    if (!outputText?.trim()) return;
    try {
      const copiedOk = await copyToClipboard(outputText);
      if (!copiedOk) return;
      setCopied(true);
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn('Clipboard copy failed', err);
      }
    }
  };

  const handleReverse = () => {
    const translated = outputText?.trim() ?? '';
    const previousSource = inputText;
    if (result?.sourceLanguage) {
      onSwapLanguages?.(result.sourceLanguage);
    } else {
      onSwapLanguages?.();
    }
    setSelectedWord(null);
    setCopied(false);
    setCardSaved(false);
    if (translated) {
      setInputText(translated);
      setInvertedOutput(previousSource.trim());
      translateMutation.reset();
    }
  };

  const handlePlayTts = async (type: 'source' | 'target') => {
    const text = type === 'source' ? inputText.trim() : outputText?.trim();
    if (!text) return;

    const lang = type === 'source' ? (sourceLang === 'auto' ? 'en' : sourceLang) : targetLang;
    setPlayingTts(type);
    try {
      await ipc.media.playTts(text, lang);
    } catch (err) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn('TTS playback error', err);
      }
    } finally {
      setPlayingTts(null);
    }
  };

  const handleSaveToVocab = (term: string, translation: string) => {
    addToVocabMutation.mutate(
      {
        lexemeId: null,
        text: term,
        sourceLanguage: sourceLang === 'auto' ? result?.sourceLanguage || 'en' : sourceLang,
        notes: translation,
        source: 'text-hub',
      },
      {
        onSuccess: () => {
          setCardSaved(true);
          window.setTimeout(() => setCardSaved(false), 2500);
        },
      },
    );
  };

  const words = outputText ? outputText.split(/(\s+)/) : [];

  return (
    <div className="text-translate-tab animate-fade-in">
      <div className="translate-panels-grid">
        <div className="translate-panel-card translate-panel--source">
          <div className="translate-panel-header">
            <div className="translate-source-meta">
              <span className="lang-indicator-pill">
                {sourceLang === 'auto' ? tUi("Auto-detect language") : sourceLang.toUpperCase()}
              </span>
            </div>
            {inputText && (
              <button
                type="button"
                className="btn-clear"
                onClick={() => setInputText('')}
                aria-label={tUi("Clear input text")}
              >{tUi("✕ Clear")}</button>
            )}
          </div>

          <textarea dir="auto"
            id="text-translate-input"
            className="translate-textarea"
            placeholder={tUi("Type or paste text to translate... (Cmd+Enter to translate)")}
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              setInvertedOutput(null);
            }}
            onKeyDown={handleKeyDown}
            rows={7}
            aria-label={tUi("Source text to translate")}
          />

          <div className="translate-panel-footer">
            <span className="text-xs text-muted font-mono">{inputText.length}{tUi(" characters")}</span>
            <div className="translate-footer-actions">
              {inputText.trim() && (
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => void handlePlayTts('source')}
                  disabled={playingTts === 'source'}
                  aria-label={tUi("Listen to source text")}
                  title={tUi("Listen to source text")}
                >
                  <IconSpeaker />
                </button>
              )}
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => handleTranslate()}
                isLoading={translateMutation.isPending}
                disabled={!inputText.trim()}
                aria-label={tUi("Translate text")}
              >{tUi("Translate")}</Button>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn-swap-panels"
          onClick={handleReverse}
          aria-label={tUi("Reverse translation direction")}
          title={tUi("Reverse translation")}
        >
          <IconSwap />
        </button>

        <div className="translate-panel-card translate-panel--target">
          <div className="translate-panel-header">
            <div className="translate-target-meta">
              <span className="lang-indicator-pill is-target">
                {targetLang.toUpperCase()}
              </span>
              {sourceLang === 'auto' && result?.sourceLanguage && (
                <span className="text-xs text-muted">{tUi("Detected: ")}{result.sourceLanguage.toUpperCase()}
                </span>
              )}
            </div>
            <div className="translate-target-header-actions">
              {outputText && (
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => void handlePlayTts('target')}
                  disabled={playingTts === 'target'}
                  aria-label={tUi("Listen to translation")}
                  title={tUi("Listen to translation")}
                >
                  <IconSpeaker />
                </button>
              )}
              <button
                type="button"
                className={`btn-copy-icon${copied ? ' is-copied' : ''}`}
                onClick={() => void handleCopy()}
                disabled={!canCopy}
                aria-label={copied ? tUi("Translation copied") : tUi("Copy translation to clipboard")}
                title={copied ? tUi("Copied") : tUi("Copy translation")}
              >
                {copied ? <IconCheck /> : <IconCopy />}
              </button>
            </div>
          </div>

          <div className="translate-output-container" aria-live="polite">
            {translateMutation.isPending ? (
              <div className="translate-output-loading text-secondary text-sm">{tUi("Translating…")}</div>
            ) : outputText ? (
              <div className="translate-output-result">
                <div className="translate-interactive-output">
                  {words.map((chunk, i) => {
                    const isWord = /\S+/.test(chunk);
                    if (!isWord) return <span key={i}>{chunk}</span>;
                    const cleanWord = chunk.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '');
                    const isSelected = selectedWord === cleanWord;
                    return (
                      <span
                        key={i}
                        className={`interactive-word${isSelected ? ' is-selected' : ''}`}
                        onClick={() => setSelectedWord(isSelected ? null : cleanWord)}
                        title={tUi("Click to inspect word details")}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedWord(isSelected ? null : cleanWord);
                          }
                        }}
                      >
                        {chunk}
                      </span>
                    );
                  })}
                </div>

                <div className="tone-switcher-container">
                  <span className="text-xs text-secondary">{tUi("Tone:")}</span>
                  <div className="tone-chips" role="group" aria-label={tUi("Tone Switcher")}>
                    {(['default', 'formal', 'casual', 'academic'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={`btn-tone${tone === t ? ' is-active' : ''}`}
                        onClick={() => handleToneChange(t)}
                      >
                        {toneLabel(t)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="translate-vocab-action">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => handleSaveToVocab(inputText.trim() || result?.text || '', outputText)}
                    isLoading={addToVocabMutation.isPending}
                    disabled={cardSaved || !inputText.trim()}
                  >
                    {cardSaved ? tUi("✓ Saved to Vocabulary") : tUi("+ Save to Vocabulary")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="translate-output-placeholder text-muted text-sm">{tUi("Translation will appear here. Use the arrows to reverse direction, or copy when ready.")}</div>
            )}
          </div>

          {result && (result.alternatives.length > 0 || result.sourceSynonyms.length > 0) && (
            <div className="translate-enrichment-box animate-slide-up">
              {result.alternatives.length > 0 && (
                <div className="translate-alternatives">
                  <span className="text-xs text-secondary font-medium">{tUi("Alternative Phrasings:")}</span>
                  <div className="translate-chips">
                    {result.alternatives.map((alt) => (
                      <span key={alt} className="translate-chip">
                        {alt}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
