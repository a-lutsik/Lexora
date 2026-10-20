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
import { APP_EVENTS, MAX_GRAMMAR_MARKS } from '../lib/constants';
import { applyAllFixes, applyOneFix, buildMarks, issueKind, openIssues, type FixResult } from '../lib/grammarFix';
import { writingLabel } from '../lib/interfaceText';
import { formatProviderError } from '../lib/inlineAssistant';
import { ipc } from '../lib/ipc';
import { formatIpcError } from '../lib/utils';
import type {
  GrammarFieldPayload,
  GrammarMarkAction,
  SetGrammarMarksInput,
  WritingIssueDto,
} from '../lib/types';
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

function isMarkAction(value: unknown): value is GrammarMarkAction {
  if (typeof value !== 'object' || value === null) return false;
  const { issueId, action } = value as { issueId?: unknown; action?: unknown };
  return (
    typeof issueId === 'number' && (action === 'apply' || action === 'dismiss' || action === 'open')
  );
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
  // Latest handlers for the hover-card listener (registered once).
  const cardActions = useRef<(action: GrammarMarkAction) => void>(() => undefined);

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
    void listen<unknown>(APP_EVENTS.GRAMMAR_MARK_ACTION, (event) => {
      if (isMarkAction(event.payload)) cardActions.current(event.payload);
    }).then(keep);
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
          : {
              kind: 'issues',
              count: open.length,
              hasErrors: open.some((issue) => issueKind(issue) === 'error'),
            };

  // Underlines in the user's field: only for a finished check of the text
  // that is still in the field.
  const marksInput: SetGrammarMarksInput | null =
    field.kind === 'check' && status === 'ready' && view
      ? {
          fieldId: field.fieldId,
          text: view.text,
          marks: buildMarks(open, (issue) => writingLabel(issue.category)).slice(0, MAX_GRAMMAR_MARKS),
        }
      : null;
  const marksKey = JSON.stringify(marksInput);
  const latestMarks = useRef(marksInput);
  useEffect(() => {
    latestMarks.current = marksInput;
  });
  useEffect(() => {
    void ipc.grammar.setMarks(latestMarks.current).catch(() => undefined);
  }, [marksKey]);

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

  useEffect(() => {
    cardActions.current = ({ issueId, action }) => {
      if (action === 'apply') handleApply(issueId);
      else if (action === 'dismiss') handleDismiss(issueId);
      else openPanel();
    };
  });

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
