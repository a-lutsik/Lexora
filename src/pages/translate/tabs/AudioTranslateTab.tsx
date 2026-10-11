// ============================================================
// LEXORA — Audio & Speech Translate Tab
// Voice studio: neon waveform, live mic, file upload,
// dual bilingual transcript with SRS bookmark.
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { useLiveSpeechTranslate } from '../../../hooks/useLiveSpeechTranslate';
import { useTranslateAudioHub } from '../../../hooks/useTranslationHub';
import { useAddToVocabulary } from '../../../hooks/useVocabulary';
import {
  beginWavCapture,
  blobToBase64,
  createUnlockedAudioContext,
  getUserMediaFn,
  microphoneErrorMessage,
  type AudioCaptureSession,
} from '../../../lib/audioRecorder';
import { copyToClipboard, formatIpcError } from '../../../lib/utils';
import { ipc } from '../../../lib/ipc';
import { LiveSpeechWave } from '../components/LiveSpeechWave';
import { VoiceTranscriptCard } from '../components/VoiceTranscriptCard';
import { IconMic, IconUpload } from '../../../components/ui/LuminousIcons';
import type { LexicalDomain } from '../../../lib/translationDomain';

type AudioTranslateTabProps = {
  sourceLang: string;
  targetLang: string;
  lexicalDomain: LexicalDomain;
  onDetectedDomain?: (domain: string | null) => void;
};

const LANGUAGE_NAMES: Record<string, string> = {
  auto: 'Auto-Detect',
  ru: 'Russian',
  en: 'English',
  de: 'German',
  fr: 'French',
  es: 'Spanish',
  it: 'Italian',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  pt: 'Portuguese',
  tr: 'Turkish',
};

function languageName(code: string): string {
  return LANGUAGE_NAMES[code] ?? code.toUpperCase();
}

function formatClock(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
}

export function AudioTranslateTab({
  sourceLang,
  targetLang,
  lexicalDomain,
  onDetectedDomain,
}: AudioTranslateTabProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [resultAt, setResultAt] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [savedSide, setSavedSide] = useState<'original' | 'translation' | 'both' | null>(null);
  const [inputSource, setInputSource] = useState<'mic' | 'file'>('mic');
  const [playingTts, setPlayingTts] = useState<'transcribed' | 'translated' | null>(null);
  const [copiedSide, setCopiedSide] = useState<'original' | 'translation' | null>(null);
  const [micAnalyser, setMicAnalyser] = useState<AnalyserNode | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const captureRef = useRef<AudioCaptureSession | null>(null);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const translateMutation = useTranslateAudioHub();
  const addToVocabMutation = useAddToVocabulary();
  const live = useLiveSpeechTranslate({ sourceLang, targetLang });

  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  useEffect(() => {
    return () => {
      captureRef.current?.cancel();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const releaseMic = () => {
    captureRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    setMicAnalyser(null);
  };

  const startRecording = async () => {
    live.stop();
    live.resetCards();
    setMicError(null);
    setSavedSide(null);
    translateMutation.reset();
    const getUserMedia = getUserMediaFn();
    if (!getUserMedia) {
      setMicError('Recording is not supported in this environment. Upload an audio file instead.');
      return;
    }
    try {
      const audioContext = createUnlockedAudioContext();
      const stream = await getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const capture = beginWavCapture(stream, audioContext);
      captureRef.current = capture;
      setMicAnalyser(capture.analyser);
      setInputSource('mic');
      setIsRecording(true);
    } catch (err) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('Microphone access error', err);
      }
      setMicError(microphoneErrorMessage(err));
    }
  };

  const stopRecording = async () => {
    const session = captureRef.current;
    if (!session) {
      setIsRecording(false);
      releaseMic();
      return;
    }
    setIsRecording(false);
    try {
      const blob = await session.stop();
      releaseMic();
      if (blob.size < 64) {
        setMicError('Recording was empty. Speak a little longer, then press Stop.');
        return;
      }
      await processAudioBlob(blob, true);
    } catch (err) {
      releaseMic();
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('Stop recording error', err);
      }
      setMicError('Could not finish the recording. Try again or upload a file.');
    }
  };

  const processAudioBlob = async (blob: Blob, saveHistory: boolean) => {
    try {
      const mimeType = (blob.type || 'audio/webm').split(';')[0] || 'audio/webm';
      const base64 = await blobToBase64(blob);
      translateMutation.mutate(
        {
          req: {
            audioBase64: base64,
            mimeType,
            ...(sourceLang === 'auto' ? {} : { sourceLanguage: sourceLang }),
            targetLanguage: targetLang,
            lexicalDomain,
          },
          saveHistory,
        },
        {
          onSuccess: (data) => {
            onDetectedDomain?.(data.result.detectedLexicalDomain ?? null);
            if (
              !data.result.transcribedText.trim() &&
              !data.result.translatedText.trim()
            ) {
              setMicError('No speech was recognized. Try speaking more clearly, then press Stop.');
              return;
            }
            setResultAt(
              new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
            );
            setSavedSide(null);
            setMicError(null);
          },
          onError: (err) => {
            setMicError(
              formatIpcError(
                err,
                'Speech translation failed. Check the AI provider in Settings.',
              ),
            );
          },
        },
      );
    } catch (err) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('Failed to encode audio', err);
      }
      setMicError('Could not read the audio. Try another file or record again.');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (isRecording) {
        captureRef.current?.cancel();
        setIsRecording(false);
        releaseMic();
      }
      if (live.isLive) {
        live.stop();
      }
      live.resetCards();
      setInputSource('file');
      setMicError(null);
      setSavedSide(null);
      translateMutation.reset();
      await processAudioBlob(file, true);
    }
    e.target.value = '';
  };

  const result = translateMutation.data?.result;
  const isProcessing = translateMutation.isPending;
  const showLiveCards = live.isLive || (!result && Boolean(live.original));
  const displayOriginal = showLiveCards ? live.original || null : result?.transcribedText ?? null;
  const displayTranslation = showLiveCards
    ? live.translation || null
    : result?.translatedText ?? null;
  const displaySourceLang =
    (showLiveCards ? live.sourceLanguage : result?.sourceLanguage) ||
    (sourceLang === 'auto' ? 'en' : sourceLang);
  const statusLabel = live.isLive
    ? 'Live'
    : isRecording
      ? 'Recording'
      : isProcessing
        ? 'Processing'
        : result || live.original
          ? 'Translated'
          : 'Ready';
  const originalLang = languageName(displaySourceLang);
  const translatedLang = languageName(result?.targetLanguage ?? targetLang);
  const studioError = live.error ?? micError;
  const timerSeconds = live.isLive ? live.seconds : recordingSeconds;

  const toggleLiveMicrophone = () => {
    if (isRecording || isProcessing) return;
    if (live.isLive) {
      live.stop();
      return;
    }
    translateMutation.reset();
    setResultAt(null);
    setSavedSide(null);
    setMicError(null);
    setInputSource('mic');
    void live.start();
  };

  const handlePlayTts = async (type: 'transcribed' | 'translated') => {
    const text = type === 'transcribed' ? displayOriginal : displayTranslation;
    if (!text) return;

    const lang =
      type === 'transcribed' ? displaySourceLang : result?.targetLanguage || targetLang;
    setPlayingTts(type);
    try {
      await ipc.media.playTts(text, lang);
    } catch (err) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn('TTS error', err);
      }
    } finally {
      setPlayingTts(null);
    }
  };

  const handleSaveToVocab = (side: 'original' | 'translation') => {
    const isOriginal = side === 'original';
    const text = isOriginal ? displayOriginal : displayTranslation;
    const notes = isOriginal ? displayTranslation : displayOriginal;
    if (!text) return;
    addToVocabMutation.mutate(
      {
        lexemeId: null,
        text,
        sourceLanguage: isOriginal
          ? displaySourceLang
          : result?.targetLanguage || targetLang,
        notes: notes ?? '',
        source: 'audio-hub',
      },
      {
        onSuccess: () => {
          setSavedSide((prev) => {
            if (prev === null) return side;
            if (prev === side) return prev;
            return 'both';
          });
        },
        onError: (err) => {
          setMicError(formatIpcError(err, 'Could not save the SRS card.'));
        },
      },
    );
  };

  const handleCopy = async (side: 'original' | 'translation', text: string) => {
    try {
      const copiedOk = await copyToClipboard(text);
      if (!copiedOk) return;
      setCopiedSide(side);
      window.setTimeout(() => setCopiedSide(null), 2000);
    } catch (err) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn('Clipboard copy failed', err);
      }
    }
  };

  return (
    <div className="voice-studio animate-fade-in">
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mp3,audio/wav,audio/m4a,audio/ogg,audio/webm"
        className="sr-only"
        onChange={handleFileChange}
        tabIndex={-1}
        aria-hidden="true"
      />

      <p
        className={`voice-studio-status${live.isLive ? ' is-live' : ''}${isRecording ? ' is-recording' : ''}${isProcessing ? ' is-processing' : ''}`}
        aria-live="polite"
      >
        {statusLabel}
      </p>

      <LiveSpeechWave
        isRecording={live.isLive || isRecording}
        isProcessing={isProcessing || live.isUpdating}
        analyser={live.analyser ?? micAnalyser}
      />

      <p className="voice-studio-timer" aria-live="polite">
        {formatClock(timerSeconds)}
      </p>

      <div className="voice-studio-controls" role="group" aria-label="Voice translation controls">
        <button
          type="button"
          className={`voice-mode-btn${live.isLive ? ' is-live' : ''}${inputSource === 'mic' && !isRecording ? ' is-active' : ''}`}
          onClick={toggleLiveMicrophone}
          disabled={isRecording || isProcessing}
          aria-pressed={live.isLive}
          aria-label={
            live.isLive
              ? 'Stop live translation'
              : 'Start live microphone translation without saving'
          }
        >
          <IconMic />
          {live.isLive ? 'Listening' : 'Microphone'}
        </button>

        <span className={`voice-record-ring${isRecording ? ' is-recording' : ''}`}>
          <button
            type="button"
            className="voice-record-btn"
            onClick={isRecording ? () => void stopRecording() : () => void startRecording()}
            disabled={isProcessing}
            aria-label={
              isRecording ? 'Stop recording and save the translation' : 'Record and save translation'
            }
          >
            <span className={`voice-record-dot${isRecording ? ' is-recording' : ''}`} aria-hidden="true" />
            {isRecording ? 'Stop' : 'Record'}
          </button>
        </span>

        <button
          type="button"
          className={`voice-mode-btn${inputSource === 'file' ? ' is-active' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing || live.isLive}
          aria-label="Upload an audio file"
        >
          <IconUpload />
          File Upload
        </button>
      </div>

      {studioError && (
        <p className="voice-studio-error" role="alert">
          {studioError}
        </p>
      )}

      <div className="voice-transcript-grid">
        <VoiceTranscriptCard
          variant="original"
          languageName={originalLang}
          text={displayOriginal}
          timestamp={showLiveCards && live.isLive ? 'Live' : resultAt}
          isPlaying={playingTts === 'transcribed'}
          isBookmarked={savedSide === 'original' || savedSide === 'both'}
          copied={copiedSide === 'original'}
          onPlay={() => void handlePlayTts('transcribed')}
          onBookmark={() => handleSaveToVocab('original')}
          onCopy={() => {
            if (displayOriginal) void handleCopy('original', displayOriginal);
          }}
          {...(live.isLive
            ? {
                emptyHint:
                  'Speak — the original appears here as you talk. Not saved to history.',
                showBookmark: false,
              }
            : {})}
        />
        <VoiceTranscriptCard
          variant="translation"
          languageName={translatedLang}
          text={displayTranslation}
          timestamp={showLiveCards && live.isLive ? 'Live' : resultAt}
          isPlaying={playingTts === 'translated'}
          isBookmarked={savedSide === 'translation' || savedSide === 'both'}
          copied={copiedSide === 'translation'}
          onPlay={() => void handlePlayTts('translated')}
          onCopy={() => {
            if (displayTranslation) void handleCopy('translation', displayTranslation);
          }}
          onBookmark={() => handleSaveToVocab('translation')}
          {...(live.isLive
            ? {
                emptyHint: 'Translation appears here while you speak. Not saved to history.',
                showBookmark: false,
              }
            : {})}
        />
      </div>
    </div>
  );
}
