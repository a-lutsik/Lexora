import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — Native vs User waveform comparison (visual only)
// ============================================================

import { useMemo } from 'react';
import { seededWaveHeights } from '../../lib/seededWaveHeights';

type SessionWaveCompareProps = {
  nativeLabel: string;
  phoneme: string;
  userHeights?: number[] | null;
  hasAttempt: boolean;
};

function WaveRow({
  label,
  badge,
  heights,
  tone,
}: {
  label: string;
  badge?: string;
  heights: number[];
  tone: 'native' | 'user';
}) {
  const { t: tUi } = useI18n();
  return (
    <div className={`pairs-wave-compare-row pairs-wave-compare-row--${tone}`}>
      <div className="pairs-wave-compare-meta">
        <span className="pairs-wave-compare-label">{tUi(label)}</span>
        {badge ? <span className="pairs-wave-compare-badge">{badge}</span> : null}
      </div>
      <div className="pairs-wave-compare-bars" aria-hidden="true">
        {heights.map((h, i) => (
          <span
            key={`${tone}-${i}`}
            className="pairs-wave-compare-bar"
            style={{ ['--bar-scale' as string]: String(h) }}
          />
        ))}
        <span className="pairs-wave-compare-scrubber" />
      </div>
    </div>
  );
}

export function SessionWaveCompare({
  nativeLabel,
  phoneme,
  userHeights = null,
  hasAttempt,
}: SessionWaveCompareProps) {
  const { t: tUi } = useI18n();
  const nativeHeights = useMemo(
    () => seededWaveHeights(`${nativeLabel}|${phoneme}`),
    [nativeLabel, phoneme],
  );
  const fallbackUser = useMemo(
    () => seededWaveHeights(`user|${nativeLabel}|${phoneme}`).map((h) => h * 0.72),
    [nativeLabel, phoneme],
  );
  const user = hasAttempt
    ? (userHeights ?? fallbackUser)
    : seededWaveHeights('idle-user').map((h) => h * 0.35);

  return (
    <div className="pairs-wave-compare" aria-label={tUi("Native and user waveform comparison")}>
      <WaveRow label={tUi("Native")} badge={`/${phoneme}/`} heights={nativeHeights} tone="native" />
      <WaveRow label={tUi("User")} heights={user} tone="user" />
    </div>
  );
}
