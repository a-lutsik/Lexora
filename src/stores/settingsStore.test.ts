import { beforeEach, describe, expect, it } from 'vitest';
import { useSettingsStore } from './settingsStore';

const initialState = useSettingsStore.getState();

beforeEach(() => {
  useSettingsStore.setState(initialState, true);
  useSettingsStore.persist.clearStorage();
});

describe('settingsStore', () => {
  it('has sensible defaults', () => {
    const state = useSettingsStore.getState();
    expect(state.sidebarCollapsed).toBe(false);
    expect(state.activeLanguageId).toBe(1);
  });

  it('setSidebarCollapsed toggles the flag', () => {
    useSettingsStore.getState().setSidebarCollapsed(true);
    expect(useSettingsStore.getState().sidebarCollapsed).toBe(true);

    useSettingsStore.getState().setSidebarCollapsed(false);
    expect(useSettingsStore.getState().sidebarCollapsed).toBe(false);
  });

  it('setActiveLanguageId changes the active language', () => {
    useSettingsStore.getState().setActiveLanguageId(3);
    expect(useSettingsStore.getState().activeLanguageId).toBe(3);
  });

  it('persists UI settings to localStorage', () => {
    useSettingsStore.getState().setSidebarCollapsed(true);
    useSettingsStore.getState().setActiveLanguageId(2);

    const raw = localStorage.getItem('lexora-settings-ui');
    expect(raw).not.toBeNull();
    const persisted = JSON.parse(raw ?? '{}') as {
      state: { sidebarCollapsed: boolean; activeLanguageId: number };
    };
    expect(persisted.state.sidebarCollapsed).toBe(true);
    expect(persisted.state.activeLanguageId).toBe(2);
  });
});
