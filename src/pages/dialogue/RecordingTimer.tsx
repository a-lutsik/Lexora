// ============================================================
// LEXORA — Recording timer (AI Dialogue voice console)
// Mono m:ss elapsed since the component mounted; mount it only
// while the microphone is recording.
// ============================================================

import { useEffect, useState } from 'react';

const TICK_MS = 1_000;
const SECONDS_PER_MINUTE = 60;

function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function RecordingTimer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const id = window.setInterval(() => {
      setSeconds(Math.floor((Date.now() - startedAt) / TICK_MS));
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className="dialogue-timer" aria-hidden="true">
      {formatElapsed(seconds)}
    </span>
  );
}
