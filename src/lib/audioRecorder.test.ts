import { describe, expect, it } from 'vitest';
import {
  blobToBase64,
  encodePcm16Wav,
  isRecordingSupported,
  microphoneErrorMessage,
  pickRecorderMime,
} from './audioRecorder';

describe('audioRecorder helpers', () => {
  it('encodes a blob as standard base64', async () => {
    const blob = new Blob([Uint8Array.from([82, 73, 70, 70])], { type: 'audio/wav' });
    const encoded = await blobToBase64(blob);
    expect(encoded).toBe(btoa('RIFF'));
  });

  it('does not invent a webm mime when MediaRecorder is missing', () => {
    expect(pickRecorderMime()).toBeNull();
  });

  it('reports capture as unsupported without getUserMedia', () => {
    expect(isRecordingSupported()).toBe(false);
  });

  it('encodes PCM samples as a RIFF WAVE blob', async () => {
    const samples = new Float32Array([0, 0.5, -0.5]);
    const blob = encodePcm16Wav(samples, 16_000);
    expect(blob.type).toBe('audio/wav');
    const encoded = await blobToBase64(blob);
    const binary = atob(encoded);
    expect(binary.slice(0, 4)).toBe('RIFF');
    expect(binary.slice(8, 12)).toBe('WAVE');
  });

  it('maps microphone DOMExceptions to user-facing text', () => {
    expect(microphoneErrorMessage(new DOMException('denied', 'NotAllowedError'))).toMatch(
      /permission denied/i
    );
    expect(microphoneErrorMessage(new DOMException('missing', 'NotFoundError'))).toMatch(
      /no microphone/i
    );
    expect(microphoneErrorMessage(new Error('boom'))).toBe('boom');
  });
});
