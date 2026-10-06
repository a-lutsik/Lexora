// ============================================================
// LEXORA — PopupApp Component
// Routes 1–2 word selections to the dictionary card and
// sentences to the inline AI assistant widget.
// ============================================================

import { useCallback, useEffect, useState, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { ipc } from '../lib/ipc';
import {
  classifyPopupText,
  POPUP_ASSISTANT_SIZE,
  POPUP_DICTIONARY_SIZE,
  type PopupViewMode,
} from '../lib/inlineAssistant';
import { InlineAssistantWidget } from './InlineAssistantWidget';
import { PopupTranslator } from './PopupTranslator';
import './popup.css';

type AppliedPopupText = {
  text: string;
  view: PopupViewMode;
};

function resizeForView(view: PopupViewMode): void {
  if (view === 'assistant') {
    void ipc.popup.resize(POPUP_ASSISTANT_SIZE.width, POPUP_ASSISTANT_SIZE.height, true);
    return;
  }
  void ipc.popup.resize(POPUP_DICTIONARY_SIZE.width, POPUP_DICTIONARY_SIZE.height, false);
}

export function PopupApp() {
  const [view, setView] = useState<PopupViewMode>('dictionary');
  const [assistantText, setAssistantText] = useState('');
  const viewRef = useRef(view);
  viewRef.current = view;
  const sizedRef = useRef(false);
  // Per-mount: module-level debounce survived Strict Mode remount and
  // swallowed retry emits, so a sentence stayed on the dictionary card.
  const lastAppliedRef = useRef<AppliedPopupText | null>(null);

  const applyCaptured = useCallback((raw: unknown, allowEmpty = false) => {
    if (typeof raw !== 'string') return;
    const text = raw.trim();
    if (!text) {
      if (allowEmpty) {
        lastAppliedRef.current = { text: '', view: 'dictionary' };
        setAssistantText('');
        setView('dictionary');
        if (viewRef.current !== 'dictionary' || !sizedRef.current) {
          resizeForView('dictionary');
          sizedRef.current = true;
        }
      }
      return;
    }
    const nextView = classifyPopupText(text);
    const last = lastAppliedRef.current;
    if (
      last?.text === text &&
      last.view === nextView &&
      viewRef.current === nextView &&
      sizedRef.current
    ) {
      return;
    }
    lastAppliedRef.current = { text, view: nextView };
    setAssistantText(text);
    setView(nextView);
    if (nextView !== viewRef.current || !sizedRef.current) {
      resizeForView(nextView);
      sizedRef.current = true;
    }
  }, []);

  useEffect(() => {
    void Promise.resolve(ipc.window.getPendingPopupText())
      .then(applyCaptured)
      .catch(() => undefined);

    const unlistenEventPromise = listen<string>('lexora:popup-text', (event) => {
      applyCaptured(event.payload, true);
    });

    const unlistenFocusPromise = getCurrentWindow().onFocusChanged(({ payload: focused }) => {
      if (focused) {
        void Promise.resolve(ipc.window.getPendingPopupText())
          .then(applyCaptured)
          .catch(() => undefined);
      }
    });

    return () => {
      void unlistenEventPromise.then((unlisten) => unlisten());
      void unlistenFocusPromise.then((unlisten) => unlisten());
    };
  }, [applyCaptured]);

  const openAssistant = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setAssistantText(trimmed);
    setView('assistant');
    resizeForView('assistant');
  };

  const openDictionary = () => {
    setView('dictionary');
    resizeForView('dictionary');
  };

  return (
    <div className="popup-container">
      {view === 'assistant' ? (
        <InlineAssistantWidget
          sourceText={assistantText}
          onSwitchToDictionary={openDictionary}
        />
      ) : (
        <PopupTranslator onOpenAssistant={openAssistant} />
      )}
    </div>
  );
}
