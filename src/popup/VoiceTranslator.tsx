// ============================================================
// LEXORA — VoiceTranslator Component
// Voice hotkey mode: listens right away, stops on silence,
// translates the clip and Accept inserts the translation into
// the field that had the cursor.
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { useI18n } from '../hooks/useI18n';
import { useLanguageOptions } from '../hooks/useLanguages';
import { useMicrophoneRecorder, type RecordedClip } from '../hooks/useMicrophoneRecorder';
import { useSessionLanguagePair } from '../hooks/useSessionLanguagePair';
import { useTranslateAudioHub } from '../hooks/useTranslationHub';
import { LanguageSelect } from '../components/ui/LanguageSelect';
import { BrandBadge } from '../components/ui/Logo';
import { IconMic } from '../components/ui/LuminousIcons';
import { blobToBase64, revokeObjectUrl } from '../lib/audioRecorder';
import { ipc } from '../lib/ipc';
import { formatIpcError } from '../lib/utils';
import type { AudioTranslationResult } from '../lib/types';

type CapturedClip = {
  audioBase64: string;
  mimeType: string;
};

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function VoiceTranslator() {
  const { t } = useI18n();
  const { targetLang, setTargetLang, settingsReady } = useSessionLanguagePair({ allowAutoSource: true });
  const langOptions = useLanguageOptions([targetLang]);
  const translateMutation = useTranslateAudioHub();
  const [result, setResult] = useState<AudioTranslationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const clipRef = useRef<CapturedClip | null>(null);
  const targetRef = useRef(targetLang);
  targetRef.current = targetLang;
  const langMenuOpenRef = useRef(false);
  const startedRef = useRef(false);

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

  const recorder = useMicrophoneRecorder({
    vadAutoStop: true,
    onAutoStop: (clip) => void handleClip(clip),
  });
  const { start: startRecorder, stop: stopRecorder } = recorder;
  const isRecording = recorder.status === 'recording';
  const isBusy = recorder.status === 'stopping' || translateMutation.isPending;

  const listen = useCallback(() => {
    setError(null);
    setResult(null);
    clipRef.current = null;
    translateMutation.reset();
    void startRecorder();
  }, [startRecorder, translateMutation]);

  // Start listening as soon as the hotkey opened the popup and the target
  // language from Settings is known (a clip sent before would use the fallback).
  useEffect(() => {
    if (!settingsReady || startedRef.current) return;
    startedRef.current = true;
    listen();
  }, [listen, settingsReady]);

  const handleStop = () => {
    void stopRecorder({ forceHeard: true })
      .then((clip) => handleClip(clip))
      .catch(() => undefined);
  };

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
      if (event.key === 'Enter' && translatedText) {
        event.preventDefault();
        void handleAccept();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAccept, handleClose, translatedText]);

  const micError = recorder.error;
  const status = isRecording
    ? t('Listening… speak now')
    : recorder.status === 'stopping'
      ? t('Finishing the recording…')
      : translateMutation.isPending
        ? t('Translating…')
        : null;

  return (
    <div className="popup-card voice-translator">
      <div className="popup-header" data-tauri-drag-region>
        <div className="popup-header-brand" data-tauri-drag-region>
          <BrandBadge />
          <span className="popup-detected-pair">{t('Voice translate')}</span>
        </div>
        <button type="button" className="popup-close-btn" onClick={handleClose} aria-label={t('Close window')}>
          <CloseIcon />
        </button>
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
          disabled={isBusy}
          aria-label={isRecording ? t('Stop recording') : t('Start recording')}
          aria-pressed={isRecording}
        >
          <IconMic size={28} />
        </button>

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
        <span className="popup-hotkey-hint">{t('↵ to accept · Esc to close')}</span>
        <button
          type="button"
          className="popup-add-btn"
          onClick={() => void handleAccept()}
          disabled={!translatedText || isBusy}
        >
          {t('Accept')}
        </button>
      </div>
    </div>
  );
}
