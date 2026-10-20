import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — Create Dialogue Scenario Modal
// The learner describes a situation (or picks "free conversation");
// the AI writes the tutor role, opening line and vocabulary.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Select, type SelectOption } from '../../components/ui/Select';
import { useCreateDialogueScenario } from '../../hooks/useDialogue';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { languageLabel } from '../../lib/languages';
import type { DialogueScenarioKind } from '../../lib/types';
import { formatIpcError } from '../../lib/utils';

type CreateScenarioModalProps = {
  isOpen: boolean;
  language: string;
  onClose: () => void;
};

const LEVEL_OPTIONS: SelectOption[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((level) => ({
  value: level,
  label: level,
}));

const DEFAULT_LEVEL = 'B1';
const MAX_TITLE_CHARS = 80;
const MAX_DESCRIPTION_CHARS = 500;

export function CreateScenarioModal({ isOpen, language, onClose }: CreateScenarioModalProps) {
  const { t: tUi, locale } = useI18n();
  const [kind, setKind] = useState<DialogueScenarioKind>('guided');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState(DEFAULT_LEVEL);
  const dialogRef = useRef<HTMLFormElement>(null);
  const createMutation = useCreateDialogueScenario();
  const { mutate, isPending, isError, error, reset } = createMutation;

  useFocusTrap(dialogRef, isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isOpen, isPending, onClose]);

  if (!isOpen) return null;

  const isFree = kind === 'free';
  const canSubmit =
    !isPending && (isFree || (title.trim().length > 0 && description.trim().length > 0));

  const handleSubmit = () => {
    if (!canSubmit) return;
    mutate(
      {
        language,
        level,
        kind,
        title: title.trim(),
        description: description.trim(),
      },
      {
        onSuccess: () => {
          setKind('guided');
          setTitle('');
          setDescription('');
          setLevel(DEFAULT_LEVEL);
          reset();
          onClose();
        },
      },
    );
  };

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <div
      className="dialogue-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialogue-modal-title"
    >
      <form
        ref={dialogRef}
        className="dialogue-modal-dialog animate-slide-up"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <div className="dialogue-modal-header">
          <h2 id="dialogue-modal-title" className="dialogue-modal-title">{tUi("Add scenario")}</h2>
          <button
            type="button"
            className="dialogue-modal-close"
            onClick={onClose}
            disabled={isPending}
            aria-label={tUi("Close dialog")}
          >
            ×
          </button>
        </div>

        <p className="dialogue-modal-hint">{tUi("The tutor will speak ")}{languageLabel(language, false, locale)}{tUi(". The AI writes the role, the first line and useful phrases for you.")}</p>

        <fieldset className="dialogue-modal-kinds">
          <legend className="dialogue-modal-label">{tUi("Type")}</legend>
          <label className={`dialogue-modal-kind${!isFree ? ' is-selected' : ''}`}>
            <input dir="auto"
              type="radio"
              name="dialogue-scenario-kind"
              value="guided"
              checked={!isFree}
              onChange={() => setKind('guided')}
              disabled={isPending}
            />
            <span className="dialogue-modal-kind-name">{tUi("Situation")}</span>
            <span className="dialogue-modal-kind-desc">{tUi("Practice a specific situation")}</span>
          </label>
          <label className={`dialogue-modal-kind${isFree ? ' is-selected' : ''}`}>
            <input dir="auto"
              type="radio"
              name="dialogue-scenario-kind"
              value="free"
              checked={isFree}
              onChange={() => setKind('free')}
              disabled={isPending}
            />
            <span className="dialogue-modal-kind-name">{tUi("Free conversation")}</span>
            <span className="dialogue-modal-kind-desc">{tUi("Talk about anything you like")}</span>
          </label>
        </fieldset>

        <label className="dialogue-modal-label" htmlFor="dialogue-scenario-title">{tUi("Title ")}{isFree && <span className="text-muted">{tUi("(optional)")}</span>}
        </label>
        <input dir="auto"
          id="dialogue-scenario-title"
          className="dialogue-modal-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={isFree ? tUi("Free conversation") : tUi("At the pharmacy, Booking a table…")}
          maxLength={MAX_TITLE_CHARS}
          autoComplete="off"
          disabled={isPending}
        />

        <label className="dialogue-modal-label" htmlFor="dialogue-scenario-description">
          {isFree ? tUi("Topics or notes") : tUi("Describe the situation")}{' '}
          {isFree && <span className="text-muted">{tUi("(optional)")}</span>}
        </label>
        <textarea dir="auto"
          id="dialogue-scenario-description"
          className="dialogue-modal-textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={
            isFree
              ? tUi("Anything you want the tutor to know about you or what you like to discuss.")
              : tUi("Who is the tutor, where are you and what do you want to achieve?")
          }
          rows={4}
          maxLength={MAX_DESCRIPTION_CHARS}
          disabled={isPending}
        />

        <label className="dialogue-modal-label" htmlFor="dialogue-scenario-level">{tUi("Level")}</label>
        <Select
          id="dialogue-scenario-level"
          ariaLabel={tUi("Level")}
          options={LEVEL_OPTIONS}
          value={level}
          onChange={setLevel}
          disabled={isPending}
        />

        {isError && (
          <p className="dialogue-modal-error" role="alert">
            {formatIpcError(error, tUi("Could not create the scenario. Check the AI provider in Settings."))}
          </p>
        )}

        <div className="dialogue-modal-actions">
          <Button type="button" variant="ghost" size="md" onClick={onClose} disabled={isPending}>{tUi("Cancel")}</Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!canSubmit}
            isLoading={isPending}
            aria-label={tUi("Create scenario")}
          >
            {isPending ? tUi("Creating…") : tUi("Create scenario")}
          </Button>
        </div>
      </form>
    </div>
  );
}
