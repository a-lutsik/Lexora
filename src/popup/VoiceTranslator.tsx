// ============================================================
// LEXORA — VoiceTranslator Component
// Voice hotkey mode: the user starts and stops the microphone,
// the clip is translated on stop and Accept inserts the
// translation into the field that had the cursor.
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { useI18n } from '../hooks/useI18n';
import { useLanguageOptions } from '../hooks/useLanguages';
import { useMicrophoneRecorder, type RecordedClip } from '../hooks/useMicrophoneRecorder';
import { useSessionLanguagePair } from '../hooks/useSessionLanguagePair';
import { useTranslateAudioHub } from '../hooks/useTranslationHub';
import { LanguageSelect } from '../components/ui/LanguageSelect';
import { BrandBadge } from '../components/ui/Logo';
import { Button, IconButton } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { blobToBase64, revokeObjectUrl } from '../lib/audioRecorder';
import { ipc } from '../lib/ipc';
import { languageLabel } from '../lib/languages';
import { formatIpcError } from '../lib/utils';
import type { AudioTranslationResult } from '../lib/types';

type CapturedClip = {
  audioBase64: string;
  mimeType: string;
};

const MS_PER_SECOND = 1000;
/** Manual stop: room for a long dictation; ~11 MB of 48 kHz WAV, under the STT upload limit. */
const VOICE_MAX_RECORDING_MS = 2 * 60 * MS_PER_SECOND;
/** Key name on the keycap, not interface copy. */
const ESC_KEY_LABEL = 'Esc';
const SECONDS_PER_MINUTE = 60;
const TIMER_TICK_MS = 250;
const WAVE_BAR_COUNT = 24;
const WAVE_BARS = Array.from({ length: WAVE_BAR_COUNT }, (_, index) => index);

function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function VoiceTranslator() {
  const { t, locale } = useI18n();
  const { targetLang, setTargetLang, settingsReady } = useSessionLanguagePair({ allowAutoSource: true });
  const langOptions = useLanguageOptions([targetLang]);
  const translateMutation = useTranslateAudioHub();
  const [result, setResult] = useState<AudioTranslationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const clipRef = useRef<CapturedClip | null>(null);
  const targetRef = useRef(targetLang);
  targetRef.current = targetLang;
  const langMenuOpenRef = useRef(false);

  const translateClip = useCallback(
    (clip: CapturedClip, target: string) => {
      setError(null);
      setResult(null);
      translateMutation.mutate(
        { req: { audioBase64: clip.audioBase64, mimeType: clip.mimeType, targetLanguage: target }, saveHistory: true },
        {
          onSuccess: (data) => {
            if (!data.result.translatedText.trim()) {
              setError(t('No speech was recognized. Try speaking more clearly.'));
              return;
            }
            setResult(data.result);
          },
          onError: (err) => {
            setError(formatIpcError(err, t('Speech translation failed. Check the AI provider in Settings.')));
          },
        },
      );
    },
    [t, translateMutation],
  );

  const handleClip = useCallback(
    async (clip: RecordedClip) => {
      revokeObjectUrl(clip.objectUrl);
      if (!clip.heardSpeech) {
        setError(t('No speech was heard. Press the microphone and try again.'));
        return;
      }
      try {
        const audioBase64 = await blobToBase64(clip.blob);
        const mimeType = (clip.mimeType || 'audio/wav').split(';')[0] || 'audio/wav';
        const captured = { audioBase64, mimeType };
        clipRef.current = captured;
        translateClip(captured, targetRef.current);
      } catch {
        setError(t('Could not finish the recording. Try again.'));
      }
    },
    [t, translateClip],
  );

  // No VAD auto-stop: pauses while dictating must not end the take.
  const recorder = useMicrophoneRecorder({
    maxDurationMs: VOICE_MAX_RECORDING_MS,
    onAutoStop: (clip) => void handleClip(clip),
  });
  const { start: startRecorder, stop: stopRecorder } = recorder;
  const isRecording = recorder.status === 'recording';
  const isBusy = recorder.status === 'stopping' || translateMutation.isPending;
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Recording time (data, not an animation): restarts with every take.
  useEffect(() => {
    if (!isRecording) return;
    const startedAt = Date.now();
    setElapsedSeconds(0);
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / MS_PER_SECOND));
    }, TIMER_TICK_MS);
    return () => window.clearInterval(timer);
  }, [isRecording]);

  const listen = useCallback(() => {
    setError(null);
    setResult(null);
    clipRef.current = null;
    translateMutation.reset();
    void startRecorder();
  }, [startRecorder, translateMutation]);

  const handleStop = useCallback(() => {
    void stopRecorder({ forceHeard: true })
      .then((clip) => handleClip(clip))
      .catch(() => undefined);
  }, [handleClip, stopRecorder]);

  const handleTargetChange = (next: string) => {
    setTargetLang(next);
    if (clipRef.current && !isRecording) {
      translateClip(clipRef.current, next);
    }
  };

  const handleClose = useCallback(() => {
    void ipc.window.closePopup();
  }, []);

  const translatedText = result?.translatedText.trim() ?? '';

  const handleAccept = useCallback(async () => {
    if (!translatedText) return;
    try {
      await ipc.popup.acceptAndReplace(translatedText);
    } catch (err) {
      setError(formatIpcError(err, t('Could not insert the translation.')));
    }
  }, [t, translatedText]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (langMenuOpenRef.current) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
        return;
      }
      if (event.key !== 'Enter') return;
      if (isRecording) {
        event.preventDefault();
        handleStop();
        return;
      }
      if (translatedText && !isBusy) {
        event.preventDefault();
        void handleAccept();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAccept, handleClose, handleStop, isBusy, isRecording, translatedText]);

  const micError = recorder.error;
  const status = isRecording
    ? t('Listening… speak now')
    : recorder.status === 'stopping'
      ? t('Finishing the recording…')
      : translateMutation.isPending
        ? t('Translating…')
        : result || error || micError
          ? null
          : t('Press the microphone, speak, then press stop.');

  return (
    <div className="popup-card voice-translator">
      <div className="popup-header" data-tauri-drag-region>
        <div className="popup-header-brand" data-tauri-drag-region>
          <BrandBadge />
          <span className="voice-translator-label" data-tauri-drag-region>{t('Voice translate')}</span>
          <span className="popup-pair" data-tauri-drag-region aria-hidden="true">
            <span className="popup-pair-code">{t('Auto')}</span>
            <Icon name="arrow_forward" size={14} />
            <span className="popup-pair-code">{targetLang.toUpperCase()}</span>
          </span>
          <span className="sr-only">
            {t('Auto')}
            {' → '}
            {languageLabel(targetLang, false, locale)}
          </span>
        </div>
        <IconButton
          icon={<Icon name="close" size={18} />}
          aria-label={t('Close window')}
          onClick={handleClose}
          size="sm"
          className="popup-close-btn"
        />
      </div>

      <div className="popup-toolbar">
        <div className="popup-lang-pair" role="presentation" onMouseDown={(e) => e.stopPropagation()}>
          <span className="voice-translator-label">{t('Translate into')}</span>
          <LanguageSelect
            className="popup-lang-select"
            compact
            value={targetLang}
            options={langOptions}
            onChange={handleTargetChange}
            onOpenChange={(open) => {
              langMenuOpenRef.current = open;
            }}
            ariaLabel={t('Target language')}
          />
        </div>
      </div>

      <div className="voice-translator-body">
        <button
          type="button"
          className={`voice-translator-mic${isRecording ? ' recording' : ''}`}
          onClick={isRecording ? handleStop : listen}
          // Wait for the target language from Settings; a clip sent before would use the fallback.
          disabled={isBusy || (!isRecording && !settingsReady)}
          aria-label={isRecording ? t('Stop recording') : t('Start recording')}
          aria-pressed={isRecording}
        >
          <Icon name={isRecording ? 'stop' : 'mic'} size={28} />
        </button>

        <div className="voice-translator-meter" aria-hidden="true">
          <span className={`voice-wave${isRecording ? ' is-live' : ''}`}>
            {WAVE_BARS.map((bar) => (
              <span key={bar} className="voice-wave-bar" />
            ))}
          </span>
          <span className="num voice-translator-timer">{formatElapsed(isRecording ? elapsedSeconds : 0)}</span>
        </div>

        <p className="voice-translator-status" aria-live="polite">
          {status}
        </p>

        {(error || micError) && (
          <div className="popup-error-box" role="alert">
            {error ?? micError}
          </div>
        )}

        {result && (
          <div className="voice-translator-result">
            {result.transcribedText.trim() && (
              <p className="voice-translator-source" dir="auto">
                {result.transcribedText.trim()}
              </p>
            )}
            <p className="voice-translator-translation" dir="auto">
              {translatedText}
            </p>
          </div>
        )}
      </div>

      <div className="voice-translator-actions">
        <span className="popup-hints">
          <span className="hint">
            <kbd className="kbd">↵</kbd>
            {t('Accept')}
          </span>
          <span className="hint">
            <kbd className="kbd">{ESC_KEY_LABEL}</kbd>
            {t('Close')}
          </span>
        </span>
        <span className="spacer" />
        <Button
          variant="primary"
          onClick={() => void handleAccept()}
          disabled={!translatedText || isBusy}
        >
          <Icon name="check" size={17} />
          {t('Accept')}
        </Button>
      </div>
    </div>
  );
}
