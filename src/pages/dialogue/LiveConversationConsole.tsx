// ============================================================
// LEXORA — Live conversation console (AI Dialogue)
// Real-time voice with the tutor via Gemini Live: speak freely,
// the tutor answers by voice; with headphones you can interrupt.
// ============================================================

import { useState } from 'react';
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
      return 'Connecting to the tutor…';
    case 'live':
      if (modelSpeaking) {
        return headphones ? 'Tutor is speaking — just talk to interrupt' : 'Tutor is speaking…';
      }
      return 'Listening — speak naturally';
    case 'error':
    case 'idle':
      return 'Talk with the tutor in real time. Your replies are saved and scored.';
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
  const [draft, setDraft] = useState('');
  const live = status === 'live';
  const connecting = status === 'connecting';
  const canStart = !live && !connecting && unavailableReason === null;

  return (
    <div className="dialogue-live">
      <DialogueBarEqualizer
        isRecording={live && !modelSpeaking}
        isProcessing={connecting}
        analyser={analyser}
      />

      <p className="dialogue-live-status text-sm" aria-live="polite">
        {live && <span className="dialogue-live-dot" aria-hidden="true" />}
        {statusLine(status, modelSpeaking, headphones)}
      </p>

      <div className="dialogue-voice-controls">
        {live || connecting ? (
          <button
            type="button"
            className="dialogue-send-btn dialogue-live-stop"
            onClick={onStop}
            aria-label="End live conversation"
          >
            End conversation
          </button>
        ) : (
          <button
            type="button"
            className="dialogue-send-btn"
            onClick={onStart}
            disabled={!canStart}
            aria-label="Start live conversation"
          >
            Start conversation
          </button>
        )}
        <label className="dialogue-live-headphones text-sm">
          <input
            type="checkbox"
            checked={headphones}
            onChange={(e) => onHeadphonesChange(e.target.checked)}
          />
          I&apos;m wearing headphones (interrupt the tutor)
        </label>
      </div>

      {!headphones && (
        <p className="dialogue-live-hint text-xs text-muted">
          On speakers the mic pauses while the tutor talks, so the tutor does not hear itself.
        </p>
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
          <label className="sr-only" htmlFor="dialogue-live-text">
            Typed reply
          </label>
          <input
            id="dialogue-live-text"
            className="dialogue-text-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Or type a reply…"
            autoComplete="off"
          />
          <button type="submit" className="dialogue-text-submit" disabled={!draft.trim()}>
            Send
          </button>
        </form>
      )}

      {unavailableReason && !live && (
        <p className="dialogue-live-hint text-sm text-secondary" role="status">
          {unavailableReason}
        </p>
      )}
      {error && (
        <p className="dialogue-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="dialogue-live-hint text-sm text-secondary" role="status">
          {notice}
        </p>
      )}
    </div>
  );
}
