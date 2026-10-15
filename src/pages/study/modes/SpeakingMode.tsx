import { useI18n } from "../../../hooks/useI18n";
// ============================================================
// LEXORA — Speaking Study Mode
// Say the word, get phoneme feedback, map score → SM-2 grade.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { PosBadge } from '../../../components/ui/Badge';
import { AudioButton } from '../../../components/domain/AudioButton';
import { PhonemeFeedback, ScoreGauge } from '../../../components/domain/PhonemeFeedback';
import { RecordControl } from '../../../components/domain/RecordControl';
import { useEvaluatePronunciation, useSaveAudioRecording } from '../../../hooks/usePronunciation';
import { useEvaluateAnswer } from '../../../hooks/useStudyQueue';
import { useStudyContinueHotkey } from '../../../hooks/useStudyContinueHotkey';
import { blobToBase64 } from '../../../lib/audioRecorder';
import { formatIpcError } from '../../../lib/utils';
import { gradeLabel, scoreToStudyGrade } from '../../../lib/pronunciationScore';
import type { PronunciationAttemptDto, StudyGrade, VocabularyEntryDto } from '../../../lib/types';
import type { RecordedClip } from '../../../hooks/useMicrophoneRecorder';

type SpeakingModeProps = {
  entry: VocabularyEntryDto;
  onComplete: (grade: StudyGrade, latencyMs: number) => void;
};

export function SpeakingMode({ entry, onComplete }: SpeakingModeProps) {
  const { t: tUi } = useI18n();
  const [attempt, setAttempt] = useState<PronunciationAttemptDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const startTime = useRef<number>(Date.now());

  const saveMutation = useSaveAudioRecording();
  const evaluateMutation = useEvaluatePronunciation();
  const srsMutation = useEvaluateAnswer();

  const { lexeme, translations, reviewState } = entry;
  const mainTranslation = translations[0]?.translatedText ?? 'No translation';
  const busy = saveMutation.isPending || evaluateMutation.isPending || srsMutation.isPending;

  useEffect(() => {
    setAttempt(null);
    setError(null);
    startTime.current = Date.now();
  }, [entry.id]);

  const handleRecorded = async (clip: RecordedClip) => {
    setError(null);
    try {
      const audioBase64 = await blobToBase64(clip.blob);
      const saved = await saveMutation.mutateAsync({
        audioBase64,
        mimeType: clip.mimeType,
      });
      const result = await evaluateMutation.mutateAsync({
        targetText: lexeme.text,
        targetIpa: lexeme.phonetic,
        language: 'en',
        audioPath: saved.audioPath,
        lexemeId: lexeme.id,
      });
      setAttempt(result);

      const latencyMs = Date.now() - startTime.current;
      await srsMutation.mutateAsync({
        reviewStateId: reviewState?.id ?? 0,
        mode: 'speaking',
        userAnswer: result.recognizedText ?? lexeme.text,
        targetText: lexeme.text,
        latencyMs,
      });
    } catch (err) {
      setError(
        formatIpcError(
          err,
          tUi("Could not evaluate this recording. Check the AI provider in Settings."),
        ),
      );
    }
  };

  const handleNext = () => {
    if (!attempt) return;
    const latencyMs = Date.now() - startTime.current;
    onComplete(scoreToStudyGrade(attempt.overallScore), latencyMs);
  };

  useStudyContinueHotkey(attempt !== null, handleNext);

  return (
    <div className="typing-card">
      <PosBadge pos={lexeme.partOfSpeech} />

      <div className="typing-prompt">
        <div className="typing-prompt-label">{tUi("Say this word aloud:")}</div>
        <div className="flashcard-word">{lexeme.text}</div>
        {lexeme.phonetic && <div className="flashcard-phonetic">{lexeme.phonetic}</div>}
        <div className="text-secondary">{mainTranslation}</div>
        <AudioButton text={lexeme.text} ariaLabel={tUi("Play model pronunciation")} />
      </div>

      {!attempt && (
        <RecordControl
          disabled={busy}
          onRecorded={(clip) => {
            void handleRecorded(clip);
          }}
          idleLabel={busy ? 'Scoring…' : 'Record pronunciation'}
        />
      )}

      {error && (
        <p className="record-control-error" role="alert">
          {error}
        </p>
      )}

      {attempt && (
        <div className="typing-feedback typing-feedback--correct" role="status">
          <div className="speaking-result-head">
            <ScoreGauge score={attempt.overallScore} />
            <div className="typing-feedback-title">
              {tUi(gradeLabel(scoreToStudyGrade(attempt.overallScore)))}
            </div>
          </div>
          {attempt.summary && <p className="text-secondary text-sm">{attempt.summary}</p>}
          <PhonemeFeedback phonemes={attempt.phonemes} />
          <div className="typing-feedback-actions">
            <Button variant="secondary" size="md" onClick={handleNext}>{tUi("Continue (Space)")}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
