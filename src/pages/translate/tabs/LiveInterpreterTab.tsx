import { localizeModelMessage } from '../../../lib/interfaceText';
import { useI18n } from "../../../hooks/useI18n";
// ============================================================
// LEXORA — Live Interpreter Tab (speech → speech)
// Gemini Live Translate: speak in any language, hear and read
// the translation into the target language in real time.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { useModelRoutes } from '../../../hooks/useModelRoutes';
import { useRealtimeSession } from '../../../hooks/useRealtimeSession';
import { languageLabel } from '../../../lib/languages';
import { LiveSpeechWave } from '../components/LiveSpeechWave';
import { Icon } from '../../../components/ui/Icon';

type LiveInterpreterTabProps = {
  sourceLang: string;
  targetLang: string;
};

function formatClock(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function LiveInterpreterTab({ sourceLang, targetLang }: LiveInterpreterTabProps) {
  const { t: tUi, locale } = useI18n();
  const [speak, setSpeak] = useState(true);
  const [echo, setEcho] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [languageNotice, setLanguageNotice] = useState<string | null>(null);
  const startedTarget = useRef<string | null>(null);
  const transcriptRef = useRef<HTMLOListElement>(null);

  const { data: modelRoutes } = useModelRoutes();
  const live = useRealtimeSession({ playAudio: speak });
  const { status, start, stop } = live;
  const running = status === 'live' || status === 'connecting';
  const targetName = languageLabel(targetLang, false, locale);

  const role = modelRoutes?.roles.find((r) => r.role === 'live_interpreter');
  const unavailable =
    role && role.state !== 'ready'
      ? tUi('Live interpretation is unavailable: {reason}', { reason: localizeModelMessage(role.message || 'Choose the Gemini package in Settings.') })
      : null;

  // The session's target language is fixed at setup — restart on change.
  useEffect(() => {
    if (running && startedTarget.current !== null && startedTarget.current !== targetLang) {
      startedTarget.current = null;
      void stop();
      setLanguageNotice(tUi("Target language changed — press Start to interpret into {language}.", { language: targetName }));
    }
  }, [running, stop, targetLang, targetName, tUi]);

  useEffect(() => {
    if (status !== 'live') return undefined;
    const started = Date.now();
    setSeconds(0);
    const timer = window.setInterval(() => {
      setSeconds(Math.floor((Date.now() - started) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [status]);

  const transcriptLength = live.turns.reduce((n, t) => n + t.heard.length + t.spoken.length, 0);
  useEffect(() => {
    const el = transcriptRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [transcriptLength]);

  const handleStart = () => {
    setLanguageNotice(null);
    startedTarget.current = targetLang;
    void start({
      mode: 'interpreter',
      targetLanguage: targetLang,
      sourceLanguage: sourceLang === 'auto' ? null : sourceLang,
      echoTargetLanguage: echo,
    });
  };

  const handleStop = () => {
    startedTarget.current = null;
    void stop();
  };

  let statusLabel = tUi("Ready to interpret into {value1}", { value1: targetName });
  if (status === 'connecting') statusLabel = 'Connecting…';
  if (status === 'live') statusLabel = live.modelSpeaking ? 'Interpreting' : 'Listening';

  return (
    <div className="voice-studio interpreter animate-fade-in">
      <p
        className={`voice-studio-status${status === 'live' ? ' is-live' : ''}${status === 'connecting' ? ' is-processing' : ''}`}
        aria-live="polite"
      >
        <span className="voice-studio-status__dot" aria-hidden="true" />
        {tUi(statusLabel)}
      </p>

      <LiveSpeechWave
        isRecording={status === 'live'}
        isProcessing={status === 'connecting'}
        analyser={live.analyser}
      />

      <p className={`voice-studio-timer${status === 'live' ? ' is-recording' : ''}`} aria-live="off">
        {formatClock(status === 'live' ? seconds : 0)}
      </p>

      <div className="voice-studio-controls" role="group" aria-label={tUi("Live interpreter controls")}>
        <button
          type="button"
          className={`voice-record-btn${running ? ' is-recording' : ''}`}
          onClick={running ? handleStop : handleStart}
          disabled={!running && unavailable !== null}
          aria-label={running ? tUi("Stop live interpretation") : tUi("Start live interpretation into {targetName}", { targetName: targetName })}
        >
          <Icon name={running ? 'stop' : 'interpreter_mode'} size={20} />
          {running ? tUi("Stop") : tUi("Start interpreting")}
        </button>
      </div>

      <div className="interpreter-options">
        <label className="interpreter-option">
          <input dir="auto" type="checkbox" checked={speak} onChange={(e) => setSpeak(e.target.checked)} />{tUi("Speak the translation aloud")}</label>
        <label className="interpreter-option">
          <input dir="auto"
            type="checkbox"
            checked={echo}
            onChange={(e) => setEcho(e.target.checked)}
            disabled={running}
          />{tUi("Repeat speech that is already in ")}{targetName}
        </label>
      </div>

      <p className="hint interpreter-hint">
        <Icon name="headphones" size={16} />
        <span>{tUi("Use headphones — on speakers the microphone hears the translation. A session lasts up to 15 minutes; the transcript is saved to History when you stop.")}</span>
      </p>

      {unavailable && !running && (
        <p className="inline-note interpreter-notice" role="status">
          {unavailable}
        </p>
      )}
      {live.error && (
        <p className="inline-error voice-studio-error" role="alert">
          {live.error}
        </p>
      )}
      {(languageNotice ?? live.notice) && (
        <p className="inline-note interpreter-notice" role="status">
          {languageNotice ?? live.notice}
        </p>
      )}

      <ol className="card interpreter-transcript" ref={transcriptRef} aria-label={tUi("Live transcript")}>
        {live.turns.length === 0 ? (
          <li className="interpreter-empty">{tUi("Speak in any language — the original and the ")}{targetName}{tUi(" translation appear here.")}</li>
        ) : (
          live.turns.map((turn) => (
            <li key={turn.id} className={`interpreter-turn${turn.final ? '' : ' is-open'}`}>
              {turn.heard && <p className="interpreter-original" dir="auto">{turn.heard}</p>}
              {turn.spoken && (
                <p className="interpreter-translation" lang={targetLang} dir="auto">
                  {turn.spoken}
                </p>
              )}
            </li>
          ))
        )}
      </ol>
    </div>
  );
}
