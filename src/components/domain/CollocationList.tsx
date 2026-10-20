import { useI18n } from '../../hooks/useI18n';
// ============================================================
// LEXORA — CollocationList
// A word with its frequent collocations: meaning, one example
// each, and adding one or all of them as vocabulary cards.
// Shared by the popup translator and the word detail panel.
// ============================================================

import { useEffect, useRef } from 'react';
import { useAddCollocations, useCollocations } from '../../hooks/useCollocations';
import { formatIpcError, splitByTerm } from '../../lib/utils';
import type { CollocationDto } from '../../lib/types';
import './collocations.css';

type CollocationListProps = {
  lexemeId: number;
  word: string;
  targetLanguage: string;
  /** Shown as "← Back" when the list replaces another view. */
  onBack?: () => void;
};

const SKELETON_ROWS = 3;

function Highlighted({ text, term, className }: { text: string; term: string; className: string }) {
  return (
    <>
      {splitByTerm(text, term).map((segment, i) =>
        segment.match ? (
          <span key={i} className={className}>
            {segment.text}
          </span>
        ) : (
          segment.text
        )
      )}
    </>
  );
}

export function CollocationList({ lexemeId, word, targetLanguage, onBack }: CollocationListProps) {
  const { t: tUi } = useI18n();
  const query = useCollocations(lexemeId, targetLanguage);
  const addMutation = useAddCollocations();
  const collocations = query.data ?? [];
  const notAdded = collocations.filter((c) => c.vocabularyEntryId == null);
  const pendingIds = addMutation.isPending ? addMutation.variables.collocationIds : [];
  const backRef = useRef<HTMLButtonElement>(null);

  // The list replaced the view the user came from: keep keyboard focus inside it.
  useEffect(() => {
    backRef.current?.focus();
  }, []);

  const add = (items: CollocationDto[]) => {
    if (items.length === 0 || addMutation.isPending) return;
    addMutation.mutate({
      lexemeId,
      targetLanguage,
      collocationIds: items.map((c) => c.id),
    });
  };

  return (
    <section className="collocations" aria-labelledby={`collocations-title-${lexemeId}`}>
      <div className="collocations-header">
        {onBack && (
          <button
            ref={backRef}
            type="button"
            className="collocations-back"
            onClick={onBack}
            aria-label={tUi('Back to translation')}
          >
            {tUi('← Back')}
          </button>
        )}
        <div className="collocations-heading">
          <h2 id={`collocations-title-${lexemeId}`} className="collocations-word" dir="auto">
            {word}
          </h2>
          <span className="collocations-subtitle">{tUi('Collocations')}</span>
        </div>
      </div>

      {query.isPending && (
        <div className="collocations-list" aria-busy="true" aria-live="polite">
          <p className="collocations-status">{tUi('Finding collocations…')}</p>
          {Array.from({ length: SKELETON_ROWS }, (_, i) => (
            <div key={i} className="collocation-item collocation-item--skeleton" aria-hidden="true">
              <div className="collocation-skel collocation-skel--title" />
              <div className="collocation-skel collocation-skel--line" />
              <div className="collocation-skel collocation-skel--line-short" />
            </div>
          ))}
        </div>
      )}

      {query.isError && (
        <div className="collocations-error" role="alert">
          <p>{formatIpcError(query.error, 'Couldn’t load collocations')}</p>
          <button type="button" className="collocations-retry" onClick={() => void query.refetch()}>
            {tUi('Try again')}
          </button>
        </div>
      )}

      {query.isSuccess && collocations.length === 0 && (
        <p className="collocations-status" role="status">
          {tUi('No common collocations found for this word.')}
        </p>
      )}

      {query.isSuccess && collocations.length > 0 && (
        <>
          <ul className="collocations-list">
            {collocations.map((item) => {
              const added = item.vocabularyEntryId != null;
              const pending = pendingIds.includes(item.id);
              return (
                <li key={item.id} className="collocation-item">
                  <div className="collocation-row">
                    <div className="collocation-main">
                      <span className="collocation-text" dir="auto">
                        <Highlighted text={item.text} term={word} className="collocation-headword" />
                      </span>
                      {item.pattern && <span className="collocation-pattern">{item.pattern}</span>}
                    </div>
                    <button
                      type="button"
                      className={`collocation-add${added ? ' collocation-add--done' : ''}`}
                      onClick={() => add([item])}
                      disabled={added || addMutation.isPending}
                      aria-label={
                        added
                          ? tUi('“{text}” is in your vocabulary', { text: item.text })
                          : tUi('Add “{text}” to vocabulary', { text: item.text })
                      }
                    >
                      {added ? '✓' : pending ? '…' : '+'}
                    </button>
                  </div>
                  <p className="collocation-translation" dir="auto">
                    {item.translation}
                  </p>
                  {item.example && (
                    <p className="collocation-example" dir="auto">
                      <Highlighted text={item.example} term={item.text} className="collocation-example-mark" />
                    </p>
                  )}
                  {item.nuance && (
                    <p className="collocation-nuance" dir="auto">
                      {item.nuance}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>

          {addMutation.isError && (
            <p className="collocations-error" role="alert">
              {formatIpcError(addMutation.error, 'Couldn’t add collocations. Please try again.')}
            </p>
          )}

          <button
            type="button"
            className="collocations-add-all"
            onClick={() => add(notAdded)}
            disabled={notAdded.length === 0 || addMutation.isPending}
          >
            {notAdded.length === 0
              ? tUi('All collocations are in your vocabulary')
              : tUi('Add all ({count})', { count: notAdded.length })}
          </button>
        </>
      )}
    </section>
  );
}
