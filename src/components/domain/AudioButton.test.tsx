import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AudioButton } from './AudioButton';
import { invokeMock } from '../../test/mocks';

describe('AudioButton', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls playTts without a language so Settings can choose the voice', async () => {
    const user = userEvent.setup();
    render(<AudioButton text="hello" />);
    await user.click(screen.getByRole('button', { name: 'Play pronunciation' }));
    expect(invokeMock).toHaveBeenCalledTimes(1);
    expect(invokeMock).toHaveBeenCalledWith('play_tts', { text: 'hello', language: null });
  });

  it('passes custom language and aria-label through', async () => {
    const user = userEvent.setup();
    render(<AudioButton text="hola" language="es" ariaLabel="Replay pronunciation" />);
    await user.click(screen.getByRole('button', { name: 'Replay pronunciation' }));
    expect(invokeMock).toHaveBeenCalledWith('play_tts', { text: 'hola', language: 'es' });
  });

  it('blocks repeat clicks while playing and unlocks after timeout', () => {
    vi.useFakeTimers();
    render(<AudioButton text="hello" />);
    const btn = screen.getByRole('button', { name: 'Play pronunciation' });

    fireEvent.click(btn);
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(invokeMock).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(1600);
    });
    expect(btn).toBeEnabled();
    fireEvent.click(btn);
    expect(invokeMock).toHaveBeenCalledTimes(2);
  });

  it('uses custom onSpeak handler instead of TTS when provided', async () => {
    const user = userEvent.setup();
    const onSpeak = vi.fn();
    render(<AudioButton text="hello" onSpeak={onSpeak} />);
    await user.click(screen.getByRole('button', { name: 'Play pronunciation' }));
    expect(onSpeak).toHaveBeenCalledWith('hello');
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it('applies sm size modifier class', () => {
    render(<AudioButton text="hello" size="sm" />);
    expect(screen.getByRole('button')).toHaveClass('popup-audio-btn', 'popup-audio-btn--sm');
  });
});
