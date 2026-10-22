import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — Create Dialogue Scenario Modal
// The learner describes a situation (or picks "free conversation");
// the AI writes the tutor role, opening line and vocabulary.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { Button, IconButton } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
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

/** CEFR levels with their names, shown as "B2 · Upper intermediate". */
const CEFR_LEVELS: ReadonlyArray<{ code: string; name: string }> = [
  { code: 'A1', name: 'Beginner' },
  { code: 'A2', name: 'Elementary' },
  { code: 'B1', name: 'Intermediate' },
  { code: 'B2', name: 'Upper intermediate' },
  { code: 'C1', name: 'Advanced' },
  { code: 'C2', name: 'Proficient' },
];

/** Key name shown in the footer hint (not translated, like on the keyboard). */
const ESC_KEY_LABEL = 'Esc';

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

  const levelOptions: SelectOption[] = CEFR_LEVELS.map(({ code, name }) => ({
    value: code,
    label: `${code} · ${tUi(name)}`,
  }));

  const isFree = kind === 'free';
  const kindOptions: ReadonlyArray<{
    kind: DialogueScenarioKind;
    icon: string;
    name: string;
    desc: string;
  }> = [
    { kind: 'guided', icon: 'storefront', name: tUi("Situation"), desc: tUi("Practice a specific situation") },
    { kind: 'free', icon: 'forum', name: tUi("Free conversation"), desc: tUi("Talk about anything you like") },
  ];
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
      className="modal-scrim"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialogue-modal-title"
      aria-describedby="dialogue-modal-desc"
    >
      <form
        ref={dialogRef}
        className="modal modal--md"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <div className="modal__head">
          <div className="modal__head-text">
            <h2 id="dialogue-modal-title" className="modal__title">{tUi("Add scenario")}</h2>
            <p id="dialogue-modal-desc" className="modal__desc">{tUi("The tutor will speak ")}{languageLabel(language, false, locale)}{tUi(". The AI writes the role, the first line and useful phrases for you.")}</p>
          </div>
          <IconButton
            className="modal__close"
            icon={<Icon name="close" size={20} />}
            onClick={onClose}
            disabled={isPending}
            aria-label={tUi("Close dialog")}
          />
        </div>

        <div className="modal__body">
          <fieldset className="dialogue-modal-kinds">
            <legend className="label">{tUi("Type")}</legend>
            <div className="dialogue-modal-kind-grid">
              {kindOptions.map((option) => {
                const selected = kind === option.kind;
                return (
                  <label
                    key={option.kind}
                    className={`card card--selectable dialogue-modal-kind${selected ? ' is-selected' : ''}`}
                  >
                    <input dir="auto"
                      type="radio"
                      className="sr-only"
                      name="dialogue-scenario-kind"
                      value={option.kind}
                      checked={selected}
                      onChange={() => setKind(option.kind)}
                      disabled={isPending}
                    />
                    <Icon name={option.icon} size={20} className="dialogue-modal-kind-icon" />
                    <span className="dialogue-modal-kind-text">
                      <span className="dialogue-modal-kind-name">{option.name}</span>
                      <span className="dialogue-modal-kind-desc">{option.desc}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div>
            <label className="label" htmlFor="dialogue-scenario-title">{tUi("Title ")}{isFree && <span className="label__optional">{tUi("(optional)")}</span>}
            </label>
            <div className="field">
              <input dir="auto"
                id="dialogue-scenario-title"
                className="field__input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isFree ? tUi("Free conversation") : tUi("At the pharmacy, Booking a table…")}
                maxLength={MAX_TITLE_CHARS}
                autoComplete="off"
                disabled={isPending}
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="dialogue-scenario-description">
              {isFree ? tUi("Topics or notes") : tUi("Describe the situation")}{' '}
              {isFree && <span className="label__optional">{tUi("(optional)")}</span>}
            </label>
            <div className="field field--textarea">
              <textarea dir="auto"
                id="dialogue-scenario-description"
                className="field__input dialogue-modal-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  isFree
                    ? tUi("Anything you want the tutor to know about you or what you like to discuss.")
                    : tUi("Who is the tutor, where are you and what do you want to achieve?")
                }
                rows={3}
                maxLength={MAX_DESCRIPTION_CHARS}
                disabled={isPending}
              />
            </div>
          </div>

          <div className="dialogue-modal-level">
            <label className="label" htmlFor="dialogue-scenario-level">{tUi("Level")}</label>
            <Select
              id="dialogue-scenario-level"
              ariaLabel={tUi("Level")}
              options={levelOptions}
              value={level}
              onChange={setLevel}
              disabled={isPending}
            />
          </div>

          {isError && (
            <p className="inline-error" role="alert">
              {formatIpcError(error, tUi("Could not create the scenario. Check the AI provider in Settings."))}
            </p>
          )}
        </div>

        <div className="modal__foot">
          <span className="hint">
            <kbd className="kbd">{ESC_KEY_LABEL}</kbd>
            {tUi("close")}
          </span>
          <span className="spacer" />
          <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>{tUi("Cancel")}</Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!canSubmit}
            isLoading={isPending}
            aria-label={tUi("Create scenario")}
          >
            <Icon name="auto_awesome" size={17} />
            {isPending ? tUi("Creating…") : tUi("Create scenario")}
          </Button>
        </div>
      </form>
    </div>
  );
}
