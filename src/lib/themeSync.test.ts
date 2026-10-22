import { beforeEach, describe, expect, it } from 'vitest';
import { emitMock, listenMock } from '../test/mocks';
import { useSettingsStore } from '../stores/settingsStore';
import { THEME_EVENT, startThemeSync } from './themeSync';

type ThemeHandler = (event: { payload: unknown }) => void;

describe('theme sync across windows', () => {
  beforeEach(() => {
    emitMock.mockClear();
    listenMock.mockClear();
    document.documentElement.removeAttribute('data-theme');
    useSettingsStore.setState({ theme: 'light' });
  });

  it('broadcasts the new theme to the other windows when it changes', () => {
    useSettingsStore.getState().setTheme('dark');

    expect(emitMock).toHaveBeenCalledWith(THEME_EVENT, 'dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('applies a theme announced by another window without echoing it back', async () => {
    let handler: ThemeHandler | undefined;
    listenMock.mockImplementationOnce(((event: string, cb: ThemeHandler) => {
      if (event === THEME_EVENT) handler = cb;
      return Promise.resolve(() => undefined);
    }) as unknown as typeof listenMock);

    const stop = startThemeSync();
    expect(listenMock).toHaveBeenCalledWith(THEME_EVENT, expect.any(Function));

    handler?.({ payload: 'dark' });

    expect(useSettingsStore.getState().theme).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(emitMock).not.toHaveBeenCalled();
    stop();
  });

  it('ignores payloads that are not a theme preference', () => {
    let handler: ThemeHandler | undefined;
    listenMock.mockImplementationOnce(((_event: string, cb: ThemeHandler) => {
      handler = cb;
      return Promise.resolve(() => undefined);
    }) as unknown as typeof listenMock);

    const stop = startThemeSync();
    handler?.({ payload: 'neon' });

    expect(useSettingsStore.getState().theme).toBe('light');
    stop();
  });
});
