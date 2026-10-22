import { toneLabel } from '../../../lib/interfaceText';
import { useI18n } from "../../../hooks/useI18n";
// ============================================================
// LEXORA — Text Translate Tab
// Two-pane editor: source on --surface, result in Literata,
// tone segment, copy / listen / save-to-vocabulary actions.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { useTranslateTextHub } from '../../../hooks/useTranslationHub';
import { useAddToVocabulary } from '../../../hooks/useVocabulary';
import { Button, IconButton } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
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

const TONES: readonly ToneOption[] = ['default', 'formal', 'casual', 'academic'];

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
  const alternatives = result?.alternatives ?? [];
  const synonyms = result?.sourceSynonyms ?? [];
  const example = result?.exampleSentence ?? null;
  const hasExtras = alternatives.length > 0 || synonyms.length > 0 || Boolean(example);

  return (
    <div className="text-translate animate-fade-in">
      <div className="tt-editor">
        <div className="tt-pane tt-pane--source">
          <textarea dir="auto"
            id="text-translate-input"
            className="tt-source"
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

          <div className="tt-pane__foot tt-pane__foot--source">
            <span className="tt-count">{inputText.length}{tUi(" characters")}</span>
            {inputText.trim() && (
              <IconButton
                icon={<Icon name="volume_up" size={17} />}
                size="sm"
                onClick={() => void handlePlayTts('source')}
                disabled={playingTts === 'source'}
                aria-label={tUi("Listen to source text")}
              />
            )}
            {inputText && (
              <IconButton
                icon={<Icon name="close" size={17} />}
                size="sm"
                onClick={() => setInputText('')}
                aria-label={tUi("Clear input text")}
              />
            )}
            <span className="hint tt-hint" aria-hidden="true">
              <kbd className="kbd">⌘</kbd>
              <kbd className="kbd">↵</kbd>
            </span>
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

        <div className="tt-pane tt-pane--result">
          <div className="tt-result" aria-live="polite">
            {translateMutation.isPending ? (
              <p className="tt-result__placeholder">{tUi("Translating…")}</p>
            ) : outputText ? (
              <>
                <p className="tt-result__text" dir="auto">
                  {words.map((chunk, i) => {
                    const isWord = /\S+/.test(chunk);
                    if (!isWord) return <span key={i}>{chunk}</span>;
                    const cleanWord = chunk.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '');
                    const isSelected = selectedWord === cleanWord;
                    return (
                      <span
                        key={i}
                        className={`tt-word${isSelected ? ' is-selected' : ''}`}
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
                </p>
                {sourceLang === 'auto' && result?.sourceLanguage && (
                  <p className="inline-note tt-result__detected">
                    {tUi("Detected: ")}<span className="tt-lang-code">{result.sourceLanguage.toUpperCase()}</span>
                  </p>
                )}
              </>
            ) : (
              <p className="tt-result__placeholder">{tUi("Translation will appear here. Use the arrows to reverse direction, or copy when ready.")}</p>
            )}
          </div>

          <div className="tt-pane__foot tt-pane__foot--result">
            <div className="seg" role="group" aria-label={tUi("Tone Switcher")}>
              {TONES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`seg__item${tone === t ? ' is-active' : ''}`}
                  aria-pressed={tone === t}
                  onClick={() => handleToneChange(t)}
                >
                  {toneLabel(t)}
                </button>
              ))}
            </div>
            <span className="spacer" />
            <IconButton
              icon={<Icon name="sync_alt" size={17} />}
              size="sm"
              onClick={handleReverse}
              aria-label={tUi("Reverse translation direction")}
            />
            <IconButton
              icon={<Icon name="volume_up" size={17} />}
              size="sm"
              onClick={() => void handlePlayTts('target')}
              disabled={!outputText || playingTts === 'target'}
              aria-label={tUi("Listen to translation")}
            />
            <IconButton
              icon={<Icon name={copied ? 'check' : 'content_copy'} size={17} />}
              size="sm"
              className={copied ? 'is-copied' : undefined}
              onClick={() => void handleCopy()}
              disabled={!canCopy}
              aria-label={copied ? tUi("Translation copied") : tUi("Copy translation to clipboard")}
            />
            {outputText && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleSaveToVocab(inputText.trim() || result?.text || '', outputText)}
                isLoading={addToVocabMutation.isPending}
                disabled={cardSaved || !inputText.trim()}
              >
                <Icon name={cardSaved ? 'bookmark_added' : 'bookmark_add'} size={17} />
                <span>{cardSaved ? tUi("Saved to Vocabulary") : tUi("Save to Vocabulary")}</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {result && hasExtras && (
        <div className="tt-extras animate-fade-in">
          {alternatives.length > 0 && (
            <section className="tt-extras__group">
              <h2 className="section-label">{tUi("Alternative phrasings")}</h2>
              <ul className="tt-alternatives">
                {alternatives.map((alt) => (
                  <li key={alt} dir="auto">{alt}</li>
                ))}
              </ul>
            </section>
          )}
          {(synonyms.length > 0 || example) && (
            <section className="tt-extras__group">
              {synonyms.length > 0 && (
                <>
                  <h2 className="section-label">{tUi("Synonyms")}</h2>
                  <div className="tt-tags">
                    {synonyms.map((syn) => (
                      <span key={syn} className="tag">{syn}</span>
                    ))}
                  </div>
                </>
              )}
              {example && (
                <>
                  <h2 className="section-label">{tUi("Example")}</h2>
                  <p className="example" dir="auto">{example}</p>
                </>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
