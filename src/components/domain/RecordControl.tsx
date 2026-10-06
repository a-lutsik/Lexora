// ============================================================
// LEXORA — RecordControl
// Hold-free start/stop microphone capture (max 8s).
// ============================================================

import { forwardRef, useImperativeHandle } from 'react';
import { Button } from '../ui/Button';
import { useMicrophoneRecorder } from '../../hooks/useMicrophoneRecorder';
import type { RecordedClip } from '../../hooks/useMicrophoneRecorder';
import './domain.css';

export type RecordControlHandle = {
  start: () => Promise<boolean>;
};

type RecordControlProps = {
  disabled?: boolean;
  onRecorded: (clip: RecordedClip) => void;
  idleLabel?: string;
  vadAutoStop?: boolean;
};

export const RecordControl = forwardRef<RecordControlHandle, RecordControlProps>(
  function RecordControl(
    { disabled = false, onRecorded, idleLabel = 'Record', vadAutoStop = false },
    ref,
  ) {
    const { status, error, start, stop } = useMicrophoneRecorder({
      vadAutoStop,
      onAutoStop: onRecorded,
    });
    const isRecording = status === 'recording';
    const isBusy = status === 'stopping';

    useImperativeHandle(ref, () => ({ start }), [start]);

    const handleToggle = async () => {
      if (disabled || isBusy) return;
      if (isRecording) {
        try {
          const clip = await stop({ forceHeard: true });
          onRecorded(clip);
        } catch {
          // error surface via hook state
        }
        return;
      }
      await start();
    };

    return (
      <div className="record-control">
        <Button
          type="button"
          variant={isRecording ? 'danger' : 'primary'}
          size="md"
          disabled={disabled || isBusy}
          isLoading={isBusy}
          onClick={() => {
            void handleToggle();
          }}
          aria-label={isRecording ? 'Stop recording' : idleLabel}
        >
          {isRecording ? 'Stop' : idleLabel}
        </Button>
        {isRecording && (
          <span className="record-control-live" aria-live="polite">
            Recording…
          </span>
        )}
        {error && (
          <p className="record-control-error" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);
