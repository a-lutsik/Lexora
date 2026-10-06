// ============================================================
// LEXORA — Document glossary panel
// Termbase for consistent document translation (DeepL Glossary).
// ============================================================

import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import type { GlossaryTerm } from '../../../lib/documentGlossary';
import { createGlossaryTerm } from '../../../lib/documentGlossary';

type DocumentGlossaryPanelProps = {
  terms: GlossaryTerm[];
  onChange: (terms: GlossaryTerm[]) => void;
};

export function DocumentGlossaryPanel({ terms, onChange }: DocumentGlossaryPanelProps) {
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');

  const handleAdd = () => {
    const term = createGlossaryTerm(source, target);
    if (!term) return;
    const exists = terms.some(
      (t) => t.source.toLocaleLowerCase() === term.source.toLocaleLowerCase()
    );
    if (exists) {
      onChange(
        terms.map((t) =>
          t.source.toLocaleLowerCase() === term.source.toLocaleLowerCase() ? term : t
        )
      );
    } else {
      onChange([...terms, term]);
    }
    setSource('');
    setTarget('');
  };

  return (
    <section className="doc-glossary" aria-labelledby="doc-glossary-title">
      <div className="doc-glossary-head">
        <h3 id="doc-glossary-title" className="doc-glossary-title">
          Glossary
        </h3>
        <p className="text-muted text-xs">
          Locked term translations applied to every segment (DeepL / Smartcat termbase).
        </p>
      </div>

      <form
        className="doc-glossary-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleAdd();
        }}
      >
        <label className="sr-only" htmlFor="doc-glossary-source">
          Source term
        </label>
        <input
          id="doc-glossary-source"
          className="doc-glossary-input"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Source term"
        />
        <span className="doc-glossary-arrow" aria-hidden="true">
          →
        </span>
        <label className="sr-only" htmlFor="doc-glossary-target">
          Target term
        </label>
        <input
          id="doc-glossary-target"
          className="doc-glossary-input"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="Required translation"
        />
        <Button type="submit" variant="secondary" size="sm" disabled={!source.trim() || !target.trim()}>
          Add term
        </Button>
      </form>

      {terms.length === 0 ? (
        <p className="text-muted text-xs">No terms yet. Product names and jargon go here.</p>
      ) : (
        <ul className="doc-glossary-list">
          {terms.map((term) => (
            <li key={term.id} className="doc-glossary-item">
              <span className="doc-glossary-pair">
                <strong>{term.source}</strong>
                <span aria-hidden="true"> → </span>
                {term.target}
              </span>
              <button
                type="button"
                className="doc-glossary-remove"
                aria-label={`Remove glossary term ${term.source}`}
                onClick={() => onChange(terms.filter((t) => t.id !== term.id))}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
