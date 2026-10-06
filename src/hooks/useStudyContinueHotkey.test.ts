import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useStudyContinueHotkey } from './useStudyContinueHotkey';

describe('useStudyContinueHotkey', () => {
  it('calls onContinue when Space is pressed and the hook is enabled', () => {
    const onContinue = vi.fn();
    renderHook(() => useStudyContinueHotkey(true, onContinue));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space' }));

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('does nothing when the hook is disabled', () => {
    const onContinue = vi.fn();
    renderHook(() => useStudyContinueHotkey(false, onContinue));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space' }));

    expect(onContinue).not.toHaveBeenCalled();
  });

  it('does not steal Space from an enabled text input', () => {
    const onContinue = vi.fn();
    const input = document.createElement('input');
    document.body.appendChild(input);

    renderHook(() => useStudyContinueHotkey(true, onContinue));

    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true })
    );

    expect(onContinue).not.toHaveBeenCalled();
    input.remove();
  });

  it('continues when Space is pressed on a disabled input', () => {
    const onContinue = vi.fn();
    const input = document.createElement('input');
    input.disabled = true;
    document.body.appendChild(input);

    renderHook(() => useStudyContinueHotkey(true, onContinue));

    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true })
    );

    expect(onContinue).toHaveBeenCalledTimes(1);
    input.remove();
  });
});
