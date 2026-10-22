import { useI18n } from "../../../hooks/useI18n";
// ============================================================
// LEXORA — Document glossary panel
// Termbase for consistent document translation (DeepL Glossary).
// ============================================================

import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
import type { GlossaryTerm } from '../../../lib/documentGlossary';
import { createGlossaryTerm } from '../../../lib/documentGlossary';

type DocumentGlossaryPanelProps = {
  terms: GlossaryTerm[];
  onChange: (terms: GlossaryTerm[]) => void;
};

export function DocumentGlossaryPanel({ terms, onChange }: DocumentGlossaryPanelProps) {
  const { t: tUi } = useI18n();
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
    <section className="card doc-glossary" aria-labelledby="doc-glossary-title">
      <div className="doc-glossary__head">
        <h3 id="doc-glossary-title" className="doc-glossary__title">{tUi("Glossary")}</h3>
        <p className="doc-glossary__desc">{tUi("Locked term translations applied to every segment (DeepL / Smartcat termbase).")}</p>
      </div>

      <form
        className="doc-glossary__form"
        onSubmit={(e) => {
          e.preventDefault();
          handleAdd();
        }}
      >
        <label className="sr-only" htmlFor="doc-glossary-source">{tUi("Source term")}</label>
        <div className="field doc-glossary__field">
          <input dir="auto"
            id="doc-glossary-source"
            className="field__input"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder={tUi("Source term")}
          />
        </div>
        <Icon name="arrow_forward" size={17} className="doc-glossary__arrow" />
        <label className="sr-only" htmlFor="doc-glossary-target">{tUi("Target term")}</label>
        <div className="field doc-glossary__field">
          <input dir="auto"
            id="doc-glossary-target"
            className="field__input"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder={tUi("Required translation")}
          />
        </div>
        <Button type="submit" variant="secondary" size="md" disabled={!source.trim() || !target.trim()}>{tUi("Add term")}</Button>
      </form>

      {terms.length === 0 ? (
        <p className="inline-note">{tUi("No terms yet. Product names and jargon go here.")}</p>
      ) : (
        <ul className="doc-glossary__list">
          {terms.map((term) => (
            <li key={term.id} className="doc-glossary__item is-hoverable">
              <span className="doc-glossary__source" dir="auto">{term.source}</span>
              <Icon name="arrow_forward" size={16} className="doc-glossary__arrow" />
              <span className="doc-glossary__target" dir="auto">{term.target}</span>
              <span className="spacer" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={tUi("Remove glossary term {value1}", { value1: term.source })}
                onClick={() => onChange(terms.filter((t) => t.id !== term.id))}
              >{tUi("Remove")}</Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
