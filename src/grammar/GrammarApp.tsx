import { useI18n } from "../hooks/useI18n";
// ============================================================
// LEXORA — Writing-check window («Grammarly mode»)
// The backend watches the focused field in other apps and sends
// its text here after a typing pause. This window checks it,
// shows the badge, and on click the suggestion panel.
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useApplyGrammarFix, useGrammarCheck } from '../hooks/useGrammarCheck';
import { APP_EVENTS } from '../lib/constants';
import { applyAllFixes, applyOneFix, openIssues, type FixResult } from '../lib/grammarFix';
import { formatProviderError } from '../lib/inlineAssistant';
import { ipc } from '../lib/ipc';
import { formatIpcError } from '../lib/utils';
import type { GrammarFieldPayload, WritingIssueDto } from '../lib/types';
import { GrammarBadge, type BadgeState } from './GrammarBadge';
import { GrammarPanel, type PanelStatus } from './GrammarPanel';
import './grammar.css';

/** After the last fix the panel stays a moment so the ✓ is seen. */
const ALL_FIXED_CLOSE_MS = 900;

/** Local copy of the check after fixes/dismissals in this field. */
type WorkingCheck = {
  key: string;
  text: string;
  issues: WritingIssueDto[];
};

function isFieldPayload(value: unknown): value is GrammarFieldPayload {
  if (typeof value !== 'object' || value === null || !('kind' in value)) return false;
  const kind = (value as { kind: unknown }).kind;
  return kind === 'hidden' || kind === 'pending' || kind === 'check';
}

function checkKey(field: GrammarFieldPayload): string | null {
  return field.kind === 'check' ? `${field.fieldId}:${field.text}` : null;
}

export function GrammarApp() {
  const { t: tUi } = useI18n();
  const [field, setField] = useState<GrammarFieldPayload>({ kind: 'hidden' });
  const [panelOpen, setPanelOpen] = useState(false);
  const [working, setWorking] = useState<WorkingCheck | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const closeTimer = useRef<number | undefined>(undefined);

  const receiveField = useCallback((payload: unknown) => {
    if (!isFieldPayload(payload)) return;
    setField(payload);
    // A new field state means the user is back in their app.
    setPanelOpen(false);
    setApplyError(null);
  }, []);

  useEffect(() => {
    let disposed = false;
    const unlisteners: Array<() => void> = [];
    const keep = (unlisten: () => void) => {
      if (disposed) unlisten();
      else unlisteners.push(unlisten);
    };
    // The window may mount after the first field event — read the last one.
    void ipc.grammar
      .getField()
      .then((payload) => {
        if (!disposed) receiveField(payload);
      })
      .catch(() => undefined);
    void listen<unknown>(APP_EVENTS.GRAMMAR_FIELD, (event) => receiveField(event.payload)).then(keep);
    void listen<unknown>(APP_EVENTS.GRAMMAR_PANEL, () => setPanelOpen(false)).then(keep);
    return () => {
      disposed = true;
      window.clearTimeout(closeTimer.current);
      unlisteners.forEach((unlisten) => unlisten());
    };
  }, [receiveField]);

  const key = checkKey(field);
  const check = useGrammarCheck(
    field.kind === 'check' ? field.fieldId : null,
    field.kind === 'check' ? field.text : null,
  );
  const applyFix = useApplyGrammarFix();

  const view: WorkingCheck | null =
    working && working.key === key
      ? working
      : key && check.data
        ? { key, text: check.data.originalText, issues: check.data.issues }
        : null;
  const open = view ? openIssues(view.text, view.issues) : [];

  const status: PanelStatus =
    field.kind === 'pending' || check.isFetching
      ? 'checking'
      : check.isError
        ? 'error'
        : view
          ? 'ready'
          : 'checking';

  const badge: BadgeState =
    status === 'checking'
      ? { kind: 'checking' }
      : status === 'error'
        ? { kind: 'error' }
        : open.length === 0
          ? { kind: 'clean' }
          : { kind: 'issues', count: open.length };

  const closePanel = useCallback(() => {
    setPanelOpen(false);
    void ipc.grammar.setPanelOpen(false).catch(() => undefined);
  }, []);

  const openPanel = () => {
    setPanelOpen(true);
    void ipc.grammar.setPanelOpen(true).catch(() => setPanelOpen(false));
  };

  const commit = (result: FixResult) => {
    if (field.kind !== 'check' || !view) return;
    setApplyError(null);
    applyFix.mutate(
      { fieldId: field.fieldId, checkedText: view.text, correctedText: result.correctedText },
      {
        onSuccess: () => {
          setWorking({ key: view.key, text: result.correctedText, issues: result.remaining });
          if (openIssues(result.correctedText, result.remaining).length === 0) {
            window.clearTimeout(closeTimer.current);
            closeTimer.current = window.setTimeout(closePanel, ALL_FIXED_CLOSE_MS);
          }
        },
        onError: (error) => setApplyError(formatIpcError(error, tUi("Could not apply the fix."))),
      },
    );
  };

  const handleApply = (issueId: number) => {
    if (!view) return;
    const result = applyOneFix(view.text, view.issues, issueId);
    if (result) commit(result);
  };

  const handleApplyAll = () => {
    if (!view) return;
    commit(applyAllFixes(view.text, view.issues));
  };

  const handleDismiss = (issueId: number) => {
    if (!view) return;
    setWorking({
      ...view,
      issues: view.issues.map((issue) =>
        issue.id === issueId ? { ...issue, status: 'rejected' } : issue,
      ),
    });
  };

  const handleIgnore = () => {
    if (field.kind !== 'check') return;
    setPanelOpen(false);
    void ipc.grammar.snooze(field.fieldId).catch(() => undefined);
  };

  const handleExcludeApp = () => {
    if (field.kind !== 'check' || !field.bundleId) return;
    setPanelOpen(false);
    void ipc.grammar.excludeApp(field.bundleId).catch(() => undefined);
  };

  if (field.kind === 'hidden') return null;

  if (!panelOpen) {
    return <GrammarBadge state={badge} onOpen={openPanel} />;
  }

  return (
    <GrammarPanel
      status={status}
      appName={field.kind === 'check' ? field.appName : null}
      canExcludeApp={field.kind === 'check' && Boolean(field.bundleId)}
      checkError={check.isError ? formatProviderError(check.error) : null}
      applyError={applyError}
      isApplying={applyFix.isPending}
      text={view?.text ?? ''}
      issues={open}
      onApply={handleApply}
      onDismiss={handleDismiss}
      onApplyAll={handleApplyAll}
      onIgnore={handleIgnore}
      onExcludeApp={handleExcludeApp}
      onClose={closePanel}
    />
  );
}
