import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { usePairsSpaceHold } from './usePairsSpaceHold';

describe('usePairsSpaceHold', () => {
  it('starts on Space keydown and stops on keyup', async () => {
    const onStart = vi.fn(async () => undefined);
    const onStop = vi.fn(async () => undefined);
    renderHook(() => usePairsSpaceHold({ enabled: true, onStart, onStop }));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true }));
    expect(onStart).toHaveBeenCalledTimes(1);

    await Promise.resolve();
    window.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', code: 'Space', bubbles: true }));
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('stops after a slow start if Space was already released', async () => {
    let resolveStart: (() => void) | undefined;
    const onStart = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveStart = resolve;
        }),
    );
    const onStop = vi.fn(async () => undefined);
    renderHook(() => usePairsSpaceHold({ enabled: true, onStart, onStop }));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true }));
    window.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', code: 'Space', bubbles: true }));
    expect(onStop).not.toHaveBeenCalled();

    resolveStart?.();
    await Promise.resolve();
    await Promise.resolve();
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('does not steal Space from an enabled text input', () => {
    const onStart = vi.fn(async () => undefined);
    const onStop = vi.fn(async () => undefined);
    const input = document.createElement('input');
    document.body.appendChild(input);

    renderHook(() => usePairsSpaceHold({ enabled: true, onStart, onStop }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true }));

    expect(onStart).not.toHaveBeenCalled();
    input.remove();
  });
});
