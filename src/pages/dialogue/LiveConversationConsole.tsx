import { t as tUi } from "../../i18n";
import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — Live conversation console (AI Dialogue)
// Real-time voice with the tutor via Gemini Live: speak freely,
// the tutor answers by voice; with headphones you can interrupt.
// Status sits in a sunken well with mono text above the bars.
// ============================================================

import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import type { RealtimeStatus } from '../../hooks/useRealtimeSession';
import { DialogueBarEqualizer } from './DialogueBarEqualizer';

type LiveConversationConsoleProps = {
  status: RealtimeStatus;
  modelSpeaking: boolean;
  analyser: AnalyserNode | null;
  headphones: boolean;
  onHeadphonesChange: (value: boolean) => void;
  onStart: () => void;
  onStop: () => void;
  onSendText: (text: string) => void;
  /** Why live mode cannot start (no key, provider without live voice…). */
  unavailableReason: string | null;
  error: string | null;
  notice: string | null;
};

function statusLine(status: RealtimeStatus, modelSpeaking: boolean, headphones: boolean): string {
  switch (status) {
    case 'connecting':
      return tUi("Connecting to the tutor…");
    case 'live':
      if (modelSpeaking) {
        return headphones ? tUi("Tutor is speaking — just talk to interrupt") : tUi("Tutor is speaking…");
      }
      return tUi("Listening — speak naturally");
    case 'error':
    case 'idle':
      return tUi("Talk with the tutor in real time. Your replies are saved and scored.");
  }
}

export function LiveConversationConsole({
  status,
  modelSpeaking,
  analyser,
  headphones,
  onHeadphonesChange,
  onStart,
  onStop,
  onSendText,
  unavailableReason,
  error,
  notice,
}: LiveConversationConsoleProps) {
  const { t: tUi } = useI18n();
  const [draft, setDraft] = useState('');
  const live = status === 'live';
  const connecting = status === 'connecting';
  const canStart = !live && !connecting && unavailableReason === null;

  return (
    <div className="dialogue-live">
      <div className="well dialogue-live-well">
        <p className={`dialogue-live-status${live ? ' is-live' : ''}`} aria-live="polite">
          {live && <span className="dialogue-live-dot" aria-hidden="true" />}
          {statusLine(status, modelSpeaking, headphones)}
        </p>
        <DialogueBarEqualizer
          isRecording={live && !modelSpeaking}
          isProcessing={connecting}
          analyser={analyser}
        />
      </div>

      <div className="dialogue-live-controls">
        {live || connecting ? (
          <Button variant="secondary" onClick={onStop} aria-label={tUi("End live conversation")}>
            <Icon name="stop_circle" size={17} />
            {tUi("End conversation")}
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={onStart}
            disabled={!canStart}
            aria-label={tUi("Start live conversation")}
          >
            <Icon name="graphic_eq" size={17} />
            {tUi("Start conversation")}
          </Button>
        )}
        <label className="dialogue-live-headphones">
          <input
            type="checkbox"
            className="dialogue-checkbox"
            checked={headphones}
            onChange={(e) => onHeadphonesChange(e.target.checked)}
          />
          {tUi("I'm wearing headphones (interrupt the tutor)")}
        </label>
      </div>

      {!headphones && (
        <p className="inline-note">{tUi("On speakers the mic pauses while the tutor talks, so the tutor does not hear itself.")}</p>
      )}

      {live && (
        <form
          className="dialogue-text-form"
          onSubmit={(e) => {
            e.preventDefault();
            const text = draft.trim();
            if (!text) return;
            onSendText(text);
            setDraft('');
          }}
        >
          <label className="sr-only" htmlFor="dialogue-live-text">{tUi("Typed reply")}</label>
          <div className="field dialogue-text-field">
            <input dir="auto"
              id="dialogue-live-text"
              className="field__input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={tUi("Or type a reply…")}
              autoComplete="off"
            />
          </div>
          <Button type="submit" variant="secondary" disabled={!draft.trim()}>{tUi("Send")}</Button>
        </form>
      )}

      {unavailableReason && !live && (
        <p className="inline-note" role="status">
          {unavailableReason}
        </p>
      )}
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="inline-note" role="status">
          {notice}
        </p>
      )}
    </div>
  );
}
