import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VoiceTranslator } from './VoiceTranslator';
import { PopupApp } from './PopupApp';
import { invokeMock } from '../test/mocks';
import { renderWithQueryClient } from '../test/render';
import { POPUP_VOICE_SIZE, VOICE_POPUP_PREFIX } from '../lib/inlineAssistant';
import type { RecordedClip, UseMicrophoneRecorderOptions } from '../hooks/useMicrophoneRecorder';

const recorder = vi.hoisted(() => ({
  start: vi.fn(() => Promise.resolve(true)),
  stop: vi.fn(),
  status: 'idle' as 'idle' | 'recording' | 'stopping',
  error: null as string | null,
  onAutoStop: undefined as ((clip: RecordedClip) => void) | undefined,
}));

vi.mock('../hooks/useMicrophoneRecorder', () => ({
  useMicrophoneRecorder: (options: UseMicrophoneRecorderOptions = {}) => {
    recorder.onAutoStop = options.onAutoStop;
    return {
      status: recorder.status,
      error: recorder.error,
      analyser: null,
      start: recorder.start,
      stop: recorder.stop,
    };
  },
}));

function clip(heardSpeech: boolean): RecordedClip {
  return {
    blob: new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'audio/wav' }),
    mimeType: 'audio/wav',
    objectUrl: 'blob:voice-test',
    heardSpeech,
  };
}

function mockBackend() {
  invokeMock.mockImplementation((cmd: string) => {
    if (cmd === 'get_settings') {
      return Promise.resolve({ primaryLanguage: 'en', interfaceLanguage: 'ru' });
    }
    if (cmd === 'translate_audio_hub') {
      return Promise.resolve({
        result: {
          sourceLanguage: 'ru',
          targetLanguage: 'en',
          transcribedText: 'привет, как дела',
          translatedText: 'hi, how are you',
          segments: [],
        },
        historyId: 1,
      });
    }
    return Promise.resolve(null);
  });
}

describe('VoiceTranslator', () => {
  beforeEach(() => {
    recorder.start.mockClear();
    recorder.stop.mockReset();
    recorder.status = 'idle';
    recorder.error = null;
    recorder.onAutoStop = undefined;
    // jsdom has no object URLs.
    Object.assign(URL, { revokeObjectURL: vi.fn() });
    mockBackend();
  });

  it('listens on open, translates the clip and Accept inserts the translation', async () => {
    renderWithQueryClient(<VoiceTranslator />);

    await waitFor(() => expect(recorder.start).toHaveBeenCalledTimes(1));
    await act(async () => {
      recorder.onAutoStop?.(clip(true));
    });

    expect(await screen.findByText('hi, how are you')).toBeInTheDocument();
    expect(screen.getByText('привет, как дела')).toBeInTheDocument();
    expect(invokeMock).toHaveBeenCalledWith(
      'translate_audio_hub',
      expect.objectContaining({
        req: expect.objectContaining({ mimeType: 'audio/wav', targetLanguage: 'ru' }),
        saveHistory: true,
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('accept_and_replace', { text: 'hi, how are you' });
    });
  });

  it('does not call the AI when the recording had no speech', async () => {
    renderWithQueryClient(<VoiceTranslator />);

    await waitFor(() => expect(recorder.start).toHaveBeenCalled());
    await act(async () => {
      recorder.onAutoStop?.(clip(false));
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(/No speech was heard/);
    expect(invokeMock).not.toHaveBeenCalledWith('translate_audio_hub', expect.anything());
    expect(screen.getByRole('button', { name: 'Accept' })).toBeDisabled();
  });

  it('shows a microphone error from the recorder', async () => {
    recorder.error = 'Microphone access was denied.';
    renderWithQueryClient(<VoiceTranslator />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Microphone access was denied.');
  });

  it('PopupApp routes a voice marker to the voice translator and resizes', async () => {
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === 'get_pending_popup_text') return Promise.resolve(`${VOICE_POPUP_PREFIX}1`);
      if (cmd === 'get_settings') return Promise.resolve({ primaryLanguage: 'en', interfaceLanguage: 'ru' });
      return Promise.resolve(null);
    });

    renderWithQueryClient(<PopupApp />);

    expect(await screen.findByText('Voice translate')).toBeInTheDocument();
    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('resize_popup_window', {
        width: POPUP_VOICE_SIZE.width,
        height: POPUP_VOICE_SIZE.height,
        resizable: false,
      });
    });
    expect(invokeMock).not.toHaveBeenCalledWith('translate_text', expect.anything());
  });
});
