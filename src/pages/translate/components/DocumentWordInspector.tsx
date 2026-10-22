import { useI18n } from "../../../hooks/useI18n";
// ============================================================
// LEXORA — Document word inspector
// Click a token in the bilingual editor → synonyms, example,
// and one-click SRS card (Smartcat / DeepL term panel).
// ============================================================

import { useEffect } from 'react';
import { useTranslate } from '../../../hooks/useTranslate';
import { useAddToVocabulary } from '../../../hooks/useVocabulary';
import { Button, IconButton } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
import { AudioButton } from '../../../components/domain/AudioButton';
import { formatIpcError } from '../../../lib/utils';

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
  const { t: tUi } = useI18n();
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
      className="card doc-inspector animate-slide-up"
      aria-labelledby="doc-inspector-title"
    >
      <div className="doc-inspector__head">
        <div className="doc-inspector__head-text">
          <h3 id="doc-inspector-title" className="doc-inspector__word" dir="auto">
            {word}
          </h3>
          {data?.partOfSpeech && (
            <span className="pos">{data.partOfSpeech}</span>
          )}
        </div>
        <AudioButton
          text={word}
          language={data?.sourceLanguage || (sourceLanguage === 'auto' ? undefined : sourceLanguage)}
          ariaLabel={tUi("Pronounce {word}", { word: word })}
        />
        <IconButton
          icon={<Icon name="close" size={17} />}
          size="sm"
          onClick={onClose}
          aria-label={tUi("Close word inspector")}
        />
      </div>

      {translateMutation.isPending && (
        <div className="doc-inspector__loading">
          <span className="translate-spinner" aria-hidden="true" />
          <p>{tUi("Looking up ")}<strong>{word}</strong>…</p>
        </div>
      )}

      {translateMutation.isError && (
        <p className="inline-error" role="alert">
          {formatIpcError(
            translateMutation.error,
            tUi("Could not look up this word. Check the AI provider in Settings."),
          )}
        </p>
      )}

      {data && (
        <div className="doc-inspector__body">
          <div className="doc-inspector__section">
            <p className="section-label">{tUi("Translation")}</p>
            <p className="doc-inspector__translation" dir="auto">{translation}</p>
          </div>

          {synonyms.length > 0 && (
            <div className="doc-inspector__section">
              <p className="section-label">{tUi("Synonyms")}</p>
              <div className="doc-inspector__tags">
                {synonyms.map((syn) => (
                  <span key={syn} className="tag">
                    {syn}
                  </span>
                ))}
              </div>
            </div>
          )}

          {alternatives.length > 0 && (
            <div className="doc-inspector__section">
              <p className="section-label">{tUi("Also translated as")}</p>
              <div className="doc-inspector__tags">
                {alternatives.map((alt) => (
                  <span key={alt} className="tag">
                    {alt}
                  </span>
                ))}
              </div>
            </div>
          )}

          {data.exampleSentence && (
            <div className="doc-inspector__section">
              <p className="section-label">{tUi("Example")}</p>
              <blockquote className="example doc-inspector__example" dir="auto">
                {data.exampleSentence}
              </blockquote>
            </div>
          )}

          {data.usageNote && (
            <p className="inline-note">{data.usageNote}</p>
          )}

          <div className="doc-inspector__foot">
            <Button
              variant={addMutation.isSuccess ? 'secondary' : 'primary'}
              size="md"
              onClick={handleAdd}
              isLoading={addMutation.isPending}
              disabled={addMutation.isSuccess}
            >
              <Icon name={addMutation.isSuccess ? 'bookmark_added' : 'bookmark_add'} size={17} />
              <span>{addMutation.isSuccess ? tUi("Added to Vocabulary") : tUi("Add to Vocabulary")}</span>
            </Button>
          </div>
        </div>
      )}
    </aside>
  );
}
