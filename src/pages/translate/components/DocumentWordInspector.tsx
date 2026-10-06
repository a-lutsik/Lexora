// ============================================================
// LEXORA — Document word inspector
// Click a token in the bilingual editor → synonyms, example,
// and one-click SRS card (Smartcat / DeepL term panel).
// ============================================================

import { useEffect } from 'react';
import { useTranslate } from '../../../hooks/useTranslate';
import { useAddToVocabulary } from '../../../hooks/useVocabulary';
import { Button } from '../../../components/ui/Button';
import { AudioButton } from '../../../components/domain/AudioButton';
import { formatIpcError } from '../../../lib/utils';
import { IconBookmark, IconCheck } from '../../../components/ui/LuminousIcons';

type DocumentWordInspectorProps = {
  word: string;
  sourceLanguage: string;
  targetLanguage: string;
  onClose: () => void;
};

export function DocumentWordInspector({
  word,
  sourceLanguage,
  targetLanguage,
  onClose,
}: DocumentWordInspectorProps) {
  const translateMutation = useTranslate();
  const addMutation = useAddToVocabulary();

  useEffect(() => {
    addMutation.reset();
    translateMutation.mutate({
      text: word,
      sourceLanguage: sourceLanguage === 'auto' ? null : sourceLanguage,
      targetLanguage,
      contextSentence: null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word, sourceLanguage, targetLanguage]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const data = translateMutation.data;
  const translation = data?.mainTranslation ?? '';
  const synonyms = data?.sourceSynonyms ?? [];
  const alternatives = data?.alternatives ?? [];

  const handleAdd = () => {
    addMutation.mutate({
      lexemeId: data?.lexemeId ?? null,
      text: word,
      sourceLanguage: data?.sourceLanguage || (sourceLanguage === 'auto' ? 'en' : sourceLanguage),
      source: 'document',
    });
  };

  return (
    <aside
      className="doc-inspector animate-slide-up"
      aria-labelledby="doc-inspector-title"
    >
      <div className="doc-inspector-header">
        <div className="doc-inspector-header-left">
          <div className="doc-inspector-kicker-row">
            <span className="doc-inspector-kicker-badge">WORD CARD</span>
            {data?.partOfSpeech && (
              <span className="doc-inspector-pos-badge">{data.partOfSpeech}</span>
            )}
          </div>
          <h3 id="doc-inspector-title" className="doc-inspector-word">
            {word}
          </h3>
        </div>
        <div className="doc-inspector-header-actions">
          <AudioButton
            text={word}
            language={data?.sourceLanguage || (sourceLanguage === 'auto' ? undefined : sourceLanguage)}
            ariaLabel={`Pronounce ${word}`}
          />
          <button
            type="button"
            className="doc-inspector-close-btn"
            onClick={onClose}
            aria-label="Close word inspector"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {translateMutation.isPending && (
        <div className="doc-inspector-loading">
          <span className="doc-inspector-spinner" aria-hidden="true" />
          <p className="text-muted text-sm">Looking up <strong>{word}</strong>…</p>
        </div>
      )}

      {translateMutation.isError && (
        <p className="text-danger text-sm" role="alert">
          {formatIpcError(
            translateMutation.error,
            'Could not look up this word. Check the AI provider in Settings.',
          )}
        </p>
      )}

      {data && (
        <div className="doc-inspector-body">
          <div className="doc-inspector-translation-box">
            <p className="doc-inspector-translation-label text-xs text-muted">TRANSLATION</p>
            <p className="doc-inspector-translation">{translation}</p>
          </div>

          {synonyms.length > 0 && (
            <div className="doc-inspector-section">
              <p className="doc-inspector-section-title text-xs text-muted">SYNONYMS</p>
              <div className="doc-inspector-chips">
                {synonyms.map((syn) => (
                  <span key={syn} className="doc-inspector-chip">
                    {syn}
                  </span>
                ))}
              </div>
            </div>
          )}

          {alternatives.length > 0 && (
            <div className="doc-inspector-section">
              <p className="doc-inspector-section-title text-xs text-muted">ALSO TRANSLATED AS</p>
              <div className="doc-inspector-chips">
                {alternatives.map((alt) => (
                  <span key={alt} className="doc-inspector-chip doc-inspector-chip--alt">
                    {alt}
                  </span>
                ))}
              </div>
            </div>
          )}

          {data.exampleSentence && (
            <div className="doc-inspector-section">
              <p className="doc-inspector-section-title text-xs text-muted">EXAMPLE</p>
              <blockquote className="doc-inspector-example">
                {data.exampleSentence}
              </blockquote>
            </div>
          )}

          {data.usageNote && (
            <p className="doc-inspector-note text-xs text-secondary">{data.usageNote}</p>
          )}

          <div className="doc-inspector-footer">
            <Button
              variant={addMutation.isSuccess ? 'secondary' : 'primary'}
              size="md"
              onClick={handleAdd}
              isLoading={addMutation.isPending}
              disabled={addMutation.isSuccess}
            >
              {addMutation.isSuccess ? (
                <>
                  <IconCheck size={16} />
                  <span>Added to Vocabulary</span>
                </>
              ) : (
                <>
                  <IconBookmark size={16} />
                  <span>Add to Vocabulary</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </aside>
  );
}

