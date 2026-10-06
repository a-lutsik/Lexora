// ============================================================
// LEXORA — Save a clip and run pronunciation scoring
// ============================================================

import { blobToBase64 } from './audioRecorder';
import type { RecordedClip } from '../hooks/useMicrophoneRecorder';
import type {
  EvaluatePronunciationInput,
  PronunciationAttemptDto,
  SaveAudioRecordingInput,
  SaveAudioRecordingResult,
} from './types';

export async function evaluatePronunciationClip(
  clip: RecordedClip,
  targetText: string,
  language: string,
  options: {
    targetIpa: string | null;
    lexemeId: number | null;
    saveRecording: (input: SaveAudioRecordingInput) => Promise<SaveAudioRecordingResult>;
    evaluate: (input: EvaluatePronunciationInput) => Promise<PronunciationAttemptDto>;
  },
): Promise<PronunciationAttemptDto> {
  const audioBase64 = await blobToBase64(clip.blob);
  const saved = await options.saveRecording({
    audioBase64,
    mimeType: clip.mimeType,
  });
  return options.evaluate({
    targetText,
    targetIpa: options.targetIpa,
    language,
    audioPath: saved.audioPath,
    lexemeId: options.lexemeId,
  });
}
