import { localizeModelMessage } from '../../lib/interfaceText';
import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — AI Dialogue page
// Scenario chat, voice console (record & send, or a live
// real-time conversation), live scoring & vocab tips.
// ============================================================

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useDeleteDialogueScenario,
  useDialogueScenarios,
  useEndDialogueSession,
  useGenerateDialogueScenarios,
  useSendDialogueTurn,
  useStartDialogueSession,
} from '../../hooks/useDialogue';
import { useMicrophoneRecorder, type RecordedClip } from '../../hooks/useMicrophoneRecorder';
import { useModelRoutes } from '../../hooks/useModelRoutes';
import { useRealtimeSession } from '../../hooks/useRealtimeSession';
import { useSettings } from '../../hooks/useSettings';
import { blobToBase64, revokeObjectUrl } from '../../lib/audioRecorder';
import { QUERY_KEYS } from '../../lib/constants';
import { ipc } from '../../lib/ipc';
import { languageLabel } from '../../lib/languages';
import type { RealtimeTurn } from '../../lib/realtimeTranscript';
import { formatIpcError } from '../../lib/utils';
import type {
  DialogueScenarioDto,
  DialogueSessionDto,
  DialogueTurnDto,
  StartDialogueSessionInput,
} from '../../lib/types';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { CreateScenarioModal } from './CreateScenarioModal';
import { DialogueBarEqualizer } from './DialogueBarEqualizer';
import { LiveConversationConsole } from './LiveConversationConsole';
import { RecordingTimer } from './RecordingTimer';
import './dialogue.css';

type DialogueTab = 'dialogue' | 'scenarios';
type VoiceMode = 'record' | 'live';

const SPACE_HOLD_MS = 250;
/** Built-in scenarios are written in English; other languages are generated from them. */
const BASE_LANGUAGE = 'en';
/** Stable reference while the scenario list is loading (keeps hook deps steady). */
const NO_SCENARIOS: DialogueScenarioDto[] = [];

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return target.isContentEditable;
}

function lastUserTurn(session: DialogueSessionDto | null): DialogueTurnDto | null {
  if (!session) return null;
  for (let i = session.turns.length - 1; i >= 0; i -= 1) {
    const turn = session.turns[i];
    if (turn?.role === 'user') return turn;
  }
  return null;
}

function latestSuggestions(session: DialogueSessionDto | null): string[] {
  if (!session) return [];
  for (let i = session.turns.length - 1; i >= 0; i -= 1) {
    const turn = session.turns[i];
    if (turn && turn.suggestions.length > 0) return turn.suggestions;
  }
  return [];
}

/**
 * Live turns not yet in the saved session: finished exchanges past the
 * saved count, plus the turn in progress once the learner has spoken.
 */
function pendingLiveTurns(turns: RealtimeTurn[], savedExchanges: number): RealtimeTurn[] {
  const complete = turns.filter((t) => t.final && t.heard !== '' && t.spoken !== '');
  const open = turns.find((t) => !t.final && t.heard !== '');
  return open ? [...complete.slice(savedExchanges), open] : complete.slice(savedExchanges);
}

/** A learner turn at or above this score is marked as good (`--ok`). */
const GOOD_TURN_SCORE = 80;

function clampScore(score: number | null | undefined): number | null {
  return score == null ? null : Math.max(0, Math.min(100, Math.round(score)));
}

function TutorAvatar() {
  return (
    <span className="dialogue-avatar" aria-hidden="true">
      <Icon name="school" size={14} />
    </span>
  );
}

async function playTutorLine(text: string, language: string): Promise<void> {
  await ipc.media.playTts(text, language);
}

export default function DialoguePage() {
  const { t: tUi, locale } = useI18n();
  const { data: settings } = useSettings();
  const language = settings?.primaryLanguage ?? 'en';

  const [tab, setTab] = useState<DialogueTab>('dialogue');
  const [session, setSession] = useState<DialogueSessionDto | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [textDraft, setTextDraft] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [pendingClip, setPendingClip] = useState<RecordedClip | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playingTurnId, setPlayingTurnId] = useState<number | null>(null);
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('record');
  const [headphones, setHeadphones] = useState(false);
  const [savedExchanges, setSavedExchanges] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const spaceDownAt = useRef<number | null>(null);
  const spaceHoldTimer = useRef<number | null>(null);
  const spaceIsHold = useRef(false);
  const autoStartAttempted = useRef(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: scenarioData, isLoading: scenariosLoading } = useDialogueScenarios(language);
  const scenarios = scenarioData ?? NO_SCENARIOS;
  const generateMutation = useGenerateDialogueScenarios();
  const deleteMutation = useDeleteDialogueScenario();
  const startMutation = useStartDialogueSession();
  const sendMutation = useSendDialogueTurn();
  const endMutation = useEndDialogueSession();

  // Tracked locally instead of via `startMutation.isPending`: under React
  // StrictMode's simulated unmount/remount the mutation observer is detached
  // from the in-flight mutation, so `isPending` never flips back to false.
  const [isStarting, setIsStarting] = useState(false);
  const { mutateAsync: mutateStartSession } = startMutation;
  const startSession = useCallback(
    async (input: StartDialogueSessionInput): Promise<DialogueSessionDto> => {
      setIsStarting(true);
      try {
        return await mutateStartSession(input);
      } finally {
        setIsStarting(false);
      }
    },
    [mutateStartSession],
  );

  const isBusy = isStarting || sendMutation.isPending || endMutation.isPending;

  const recorder = useMicrophoneRecorder();
  const queryClient = useQueryClient();
  const { data: modelRoutes } = useModelRoutes();
  const sessionTurnCount = useRef(0);
  sessionTurnCount.current = session?.turns.length ?? 0;

  // Each saved live exchange adds a user + tutor turn; scoring re-sends
  // the same session without new turns.
  const handleLiveTurnSaved = useCallback(
    (saved: DialogueSessionDto) => {
      const added = Math.max(0, Math.floor((saved.turns.length - sessionTurnCount.current) / 2));
      sessionTurnCount.current = saved.turns.length;
      if (added > 0) setSavedExchanges((n) => n + added);
      setSession(saved);
      queryClient.setQueryData([QUERY_KEYS.DIALOGUE_SESSION, saved.id], saved);
    },
    [queryClient],
  );
  const live = useRealtimeSession({ halfDuplex: !headphones, onTurnSaved: handleLiveTurnSaved });
  const { start: startLive, stop: stopLive, sendText: sendLiveText } = live;
  const liveBusy = live.status === 'live' || live.status === 'connecting';
  const liveRole = modelRoutes?.roles.find((r) => r.role === 'realtime_voice');
  const liveUnavailable =
    liveRole && liveRole.state !== 'ready'
      ? tUi('Live conversation is unavailable: {reason}', { reason: localizeModelMessage(liveRole.message || 'Choose the Gemini package in Settings.') })
      : null;
  const liveTurns = useMemo(
    () => (voiceMode === 'live' ? pendingLiveTurns(live.turns, savedExchanges) : []),
    [live.turns, savedExchanges, voiceMode],
  );
  const liveTextLength = liveTurns.reduce((n, t) => n + t.heard.length + t.spoken.length, 0);

  // A named scenario, else the first one of the learner's language.
  const startInputFor = useCallback(
    (slug?: string): StartDialogueSessionInput | null => {
      if (slug) return { scenarioSlug: slug, language };
      const first = scenarios[0];
      return first ? { scenarioId: first.id, language } : null;
    },
    [language, scenarios],
  );

  const ensureSession = useCallback(
    async (slug?: string): Promise<DialogueSessionDto> => {
      if (session && session.status === 'active' && (!slug || session.scenarioSlug === slug)) {
        return session;
      }
      const input = startInputFor(slug);
      if (!input) {
        throw new Error(
          'There are no scenarios in this language yet. Add or generate one in Practice Scenarios.',
        );
      }
      const next = await startSession(input);
      setSession(next);
      setError(null);
      return next;
    },
    [session, startInputFor, startSession],
  );

  const startDefaultScenario = useCallback(() => {
    void ensureSession().catch((err: unknown) => {
      setError(formatIpcError(err, tUi("Could not start dialogue. Check the AI provider in Settings.")));
    });
  }, [ensureSession, tUi]);

  // Auto-start the first scenario when opening the dialogue tab — one attempt
  // per visit. Without the flag a failed start flipped the mutation state,
  // which re-created `ensureSession` and re-fired this effect in a tight loop
  // (thousands of IPC calls per second). Retrying is an explicit user action.
  useEffect(() => {
    if (tab !== 'dialogue') {
      autoStartAttempted.current = false;
      return;
    }
    if (session || autoStartAttempted.current) return;
    if (scenariosLoading || scenarios.length === 0) return;
    autoStartAttempted.current = true;
    startDefaultScenario();
  }, [scenarios.length, scenariosLoading, session, startDefaultScenario, tab]);

  const handleRetryStart = useCallback(() => {
    setError(null);
    startDefaultScenario();
  }, [startDefaultScenario]);

  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [session?.turns.length, liveTextLength]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  const clearPendingClip = useCallback(() => {
    if (pendingClip) {
      revokeObjectUrl(pendingClip.objectUrl);
      setPendingClip(null);
    }
  }, [pendingClip]);

  const submitText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isBusy) return;
      try {
        const active = await ensureSession(session?.scenarioSlug);
        const next = await sendMutation.mutateAsync({
          sessionId: active.id,
          text: trimmed,
        });
        setSession(next);
        setTextDraft('');
        setError(null);
        clearPendingClip();
      } catch (err) {
        setError(formatIpcError(err, tUi("Could not send your reply. Check the AI provider in Settings.")));
      }
    },
    [clearPendingClip, ensureSession, isBusy, sendMutation, session?.scenarioSlug, tUi],
  );

  const submitClip = useCallback(
    async (clip: RecordedClip) => {
      if (isBusy) return;
      try {
        const active = await ensureSession(session?.scenarioSlug);
        const audioBase64 = await blobToBase64(clip.blob);
        const next = await sendMutation.mutateAsync({
          sessionId: active.id,
          audioBase64,
          mimeType: clip.mimeType,
        });
        setSession(next);
        setError(null);
        revokeObjectUrl(clip.objectUrl);
        setPendingClip(null);
      } catch (err) {
        setError(formatIpcError(err, tUi("Could not send the recording. Check the AI provider in Settings.")));
      }
    },
    [ensureSession, isBusy, sendMutation, session?.scenarioSlug, tUi],
  );

  const toggleRecording = useCallback(async () => {
    setError(null);
    if (recorder.status === 'recording') {
      try {
        const clip = await recorder.stop();
        setPendingClip(clip);
      } catch {
        /* already idle */
      }
      return;
    }
    clearPendingClip();
    const ok = await recorder.start();
    if (!ok && recorder.error) {
      setError(recorder.error);
    }
  }, [clearPendingClip, recorder]);

  const handleSaySend = useCallback(async () => {
    if (isBusy) return;
    if (recorder.status === 'recording') {
      try {
        const clip = await recorder.stop();
        await submitClip(clip);
      } catch (err) {
        setError(formatIpcError(err, tUi("Could not send your reply. Check the AI provider in Settings.")));
      }
      return;
    }
    if (pendingClip) {
      await submitClip(pendingClip);
      return;
    }
    if (textDraft.trim()) {
      await submitText(textDraft);
    }
  }, [isBusy, pendingClip, recorder, submitClip, submitText, textDraft, tUi]);

  // Spacebar: hold = PTT, tap = toggle (dialogue tab, record mode only).
  useEffect(() => {
    if (tab !== 'dialogue' || voiceMode !== 'record') return;

    const clearHoldTimer = () => {
      if (spaceHoldTimer.current !== null) {
        window.clearTimeout(spaceHoldTimer.current);
        spaceHoldTimer.current = null;
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.key !== ' ') return;
      if (isEditableTarget(e.target)) return;
      if (e.repeat) return;
      e.preventDefault();

      spaceDownAt.current = performance.now();
      spaceIsHold.current = false;
      clearHoldTimer();
      spaceHoldTimer.current = window.setTimeout(() => {
        spaceIsHold.current = true;
        if (recorder.status !== 'recording' && !isBusy) {
          clearPendingClip();
          void recorder.start();
        }
      }, SPACE_HOLD_MS);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.key !== ' ') return;
      if (isEditableTarget(e.target)) return;
      e.preventDefault();
      clearHoldTimer();

      const wasHold = spaceIsHold.current;
      spaceIsHold.current = false;
      spaceDownAt.current = null;

      if (wasHold) {
        if (recorder.status === 'recording') {
          void recorder
            .stop()
            .then((clip) => {
              setPendingClip(clip);
            })
            .catch(() => undefined);
        }
        return;
      }

      // Tap → toggle
      void toggleRecording();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      clearHoldTimer();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [clearPendingClip, isBusy, recorder, tab, toggleRecording, voiceMode]);

  const handleStartLive = useCallback(() => {
    setError(null);
    setSavedExchanges(0);
    // Session already running: start inside the click so WebKit unlocks audio.
    if (session && session.status === 'active') {
      void startLive({ mode: 'dialogue', dialogueSessionId: session.id });
      return;
    }
    void ensureSession(session?.scenarioSlug)
      .then((active) => startLive({ mode: 'dialogue', dialogueSessionId: active.id }))
      .catch((err: unknown) => {
        setError(formatIpcError(err, tUi("Could not start dialogue. Check the AI provider in Settings.")));
      });
  }, [ensureSession, session, startLive, tUi]);

  const switchVoiceMode = useCallback(
    (mode: VoiceMode) => {
      if (mode === voiceMode) return;
      if (mode === 'record') {
        void stopLive();
      } else if (recorder.status === 'recording') {
        void recorder.stop().catch(() => undefined);
      }
      clearPendingClip();
      setVoiceMode(mode);
    },
    [clearPendingClip, recorder, stopLive, voiceMode],
  );

  const handleRestart = useCallback(async () => {
    setMenuOpen(false);
    clearPendingClip();
    await stopLive();
    try {
      const input = startInputFor(session?.scenarioSlug);
      if (!input) {
        setError(tUi("There are no scenarios in this language yet. Add or generate one in Practice Scenarios."));
        return;
      }
      if (session && session.status === 'active') {
        await endMutation.mutateAsync(session.id);
      }
      const next = await startSession(input);
      setSession(next);
      setError(null);
    } catch (err) {
      setError(formatIpcError(err, tUi("Could not restart this scenario. Try again.")));
    }
  }, [clearPendingClip, endMutation, session, startInputFor, startSession, stopLive, tUi]);

  const handleEnd = useCallback(async () => {
    setMenuOpen(false);
    if (!session) return;
    await stopLive();
    try {
      const next = await endMutation.mutateAsync(session.id);
      setSession(next);
      setError(null);
    } catch (err) {
      setError(formatIpcError(err, tUi("Could not end this session. Try again.")));
    }
  }, [endMutation, session, stopLive, tUi]);

  const handleSelectScenario = useCallback(
    async (scenario: DialogueScenarioDto) => {
      clearPendingClip();
      await stopLive();
      try {
        if (session && session.status === 'active') {
          await endMutation.mutateAsync(session.id);
        }
        const next = await startSession({
          scenarioId: scenario.id,
          language,
        });
        setSession(next);
        setTab('dialogue');
        setError(null);
      } catch (err) {
        setError(formatIpcError(err, tUi("Could not start this scenario. Check the AI provider in Settings.")));
      }
    },
    [clearPendingClip, endMutation, language, session, startSession, stopLive, tUi],
  );

  const handleGenerate = useCallback(async () => {
    setNotice(null);
    setError(null);
    try {
      const result = await generateMutation.mutateAsync(language);
      if (result.created === 0) {
        setNotice('All built-in scenarios are already available in this language.');
      } else if (result.remaining > 0) {
        setNotice(
          `Generated ${result.created} scenarios, ${result.remaining} left. Press the button again to continue.`,
        );
      } else {
        setNotice(`Generated ${result.created} scenarios.`);
      }
    } catch (err) {
      setError(formatIpcError(err, tUi("Could not generate scenarios. Check the AI provider in Settings.")));
    }
  }, [generateMutation, language, tUi]);

  const handleDeleteScenario = useCallback(
    async (scenario: DialogueScenarioDto) => {
      // First press arms the button, second press deletes.
      if (pendingDeleteId !== scenario.id) {
        setPendingDeleteId(scenario.id);
        return;
      }
      setPendingDeleteId(null);
      try {
        await deleteMutation.mutateAsync(scenario.id);
        setNotice(null);
      } catch (err) {
        setError(formatIpcError(err, tUi("Could not delete this scenario. Try again.")));
      }
    },
    [deleteMutation, pendingDeleteId, tUi],
  );

  const handlePlay = useCallback(
    async (turn: DialogueTurnDto) => {
      setPlayingTurnId(turn.id);
      try {
        await playTutorLine(turn.text, language);
      } catch (err) {
        setError(formatIpcError(err, tUi("Could not play audio. Try again.")));
      } finally {
        window.setTimeout(() => setPlayingTurnId(null), 800);
      }
    },
    [language, tUi],
  );

  const userTurn = lastUserTurn(session);
  const suggestions = useMemo(() => latestSuggestions(session), [session]);
  const sessionScore = clampScore(session?.sessionScore);
  const turnScore = clampScore(userTurn?.turnScore);

  const recording = recorder.status === 'recording';
  const processing = sendMutation.isPending;

  const threadTitle = session?.scenarioTitle ?? scenarios[0]?.title ?? tUi("AI Dialogue");
  const currentScenario = session
    ? scenarios.find((sc) => sc.id === session.scenarioId)
    : scenarios[0];
  const threadLevel = session?.scenarioLevel ?? currentScenario?.level ?? null;
  const threadKind = currentScenario?.kind ?? null;

  return (
    <div className="page dialogue-page animate-fade-in">
      <header className="page-header" data-tauri-drag-region>
        <div className="page-header__text">
          <h1 className="page-title">{tUi("Dialogue")}</h1>
          <p className="page-subtitle">{tUi("Speak with an AI tutor in real situations")}</p>
        </div>
        <div className="page-actions">
          <div className="seg" role="tablist" aria-label={tUi("Dialogue modes")}>
            <button
              type="button"
              role="tab"
              id="dialogue-tab-dialogue"
              aria-selected={tab === 'dialogue'}
              aria-controls="dialogue-panel-dialogue"
              className={`seg__item${tab === 'dialogue' ? ' is-active' : ''}`}
              onClick={() => setTab('dialogue')}
            >{tUi("Conversation")}</button>
            <button
              type="button"
              role="tab"
              id="dialogue-tab-scenarios"
              aria-selected={tab === 'scenarios'}
              aria-controls="dialogue-panel-scenarios"
              className={`seg__item${tab === 'scenarios' ? ' is-active' : ''}`}
              onClick={() => setTab('scenarios')}
            >{tUi("Scenarios")}</button>
          </div>
          <Button
            variant="secondary"
            onClick={() => setCreateOpen(true)}
            disabled={isBusy || generateMutation.isPending}
          >
            <Icon name="add" size={17} />
            {tUi("New scenario")}
          </Button>
        </div>
      </header>

      {error && (
        <p className="inline-error dialogue-error" role="alert">
          {error}
        </p>
      )}

      {tab === 'scenarios' ? (
        <div
          id="dialogue-panel-scenarios"
          role="tabpanel"
          aria-labelledby="dialogue-tab-scenarios"
          className="page-body dialogue-scenarios"
        >
          <div className="dialogue-scenarios-head">
            <div className="dialogue-scenarios-head-text">
              <h2 className="dialogue-scenarios-title">{tUi("Practice Scenarios")}</h2>
              <p className="dialogue-scenarios-sub">{tUi("Pick a situation and level to practice speaking with an AI tutor.")}</p>
            </div>
            {language !== BASE_LANGUAGE && (
              <Button
                variant="secondary"
                onClick={() => void handleGenerate()}
                isLoading={generateMutation.isPending}
                disabled={isBusy}
                aria-label={tUi("Generate scenarios in {value1}", { value1: languageLabel(language, false, locale) })}
              >
                <Icon name="auto_awesome" size={17} />
                {generateMutation.isPending ? tUi("Generating…") : tUi("Generate scenarios")}
              </Button>
            )}
          </div>
          {notice && (
            <p className="inline-note dialogue-notice" role="status">
              {notice}
            </p>
          )}
          {scenariosLoading ? (
            <p className="inline-note">{tUi("Loading scenarios…")}</p>
          ) : scenarios.length === 0 ? (
            <p className="empty dialogue-scenarios-empty">
              {language === BASE_LANGUAGE
                ? tUi("No scenarios yet. Add your own.")
                : tUi("There are no scenarios in {value1} yet. Generate them from the built-in English ones, or add your own.", { value1: languageLabel(language, false, locale) })}
            </p>
          ) : (
            <ul className="dialogue-scenario-list">
              {scenarios.map((scenario) => {
                const isCurrent = session?.scenarioId === scenario.id;
                const isArmed = pendingDeleteId === scenario.id;
                return (
                  <li
                    key={scenario.id}
                    className={`dialogue-scenario-item is-hoverable${isCurrent ? ' is-current' : ''}`}
                  >
                    <button
                      type="button"
                      className="dialogue-scenario-card"
                      onClick={() => void handleSelectScenario(scenario)}
                      disabled={isBusy}
                      aria-current={isCurrent ? 'true' : undefined}
                    >
                      <Icon
                        name={scenario.kind === 'free' ? 'forum' : 'storefront'}
                        size={19}
                        className="dialogue-scenario-icon"
                      />
                      <span className="dialogue-scenario-text">
                        <span className="dialogue-scenario-name">{scenario.title}</span>
                        {scenario.description && (
                          <span className="dialogue-scenario-desc">{scenario.description}</span>
                        )}
                      </span>
                      <span className="dialogue-scenario-badges">
                        {scenario.kind === 'free' && (
                          <span className="tag">{tUi("Free talk")}</span>
                        )}
                        <span className="tag dialogue-scenario-level">{scenario.level}</span>
                      </span>
                    </button>
                    {scenario.origin !== 'builtin' && (
                      <span className={`row-actions-hover dialogue-scenario-actions${isArmed ? ' is-armed' : ''}`}>
                        <button
                          type="button"
                          className={`btn btn--sm dialogue-scenario-delete${
                            isArmed ? ' btn--danger-ghost is-armed' : ' btn--ghost btn--icon'
                          }`}
                          aria-label={
                            isArmed
                              ? tUi("Confirm deleting {value1}", { value1: scenario.title })
                              : tUi("Delete {value1}", { value1: scenario.title })
                          }
                          onClick={() => void handleDeleteScenario(scenario)}
                          onBlur={() => setPendingDeleteId(null)}
                          disabled={deleteMutation.isPending}
                        >
                          {isArmed ? tUi("Delete?") : <Icon name="delete" size={17} />}
                        </button>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : (
        <div
          id="dialogue-panel-dialogue"
          role="tabpanel"
          aria-labelledby="dialogue-tab-dialogue"
          className="dialogue-layout"
        >
          <div className="dialogue-main">
            <section className="dialogue-thread-panel" aria-label={tUi("Scenario conversation")}>
              <header className="dialogue-thread-header">
                <h2 className="dialogue-thread-title">{threadTitle}</h2>
                {threadLevel && <span className="tag">{threadLevel}</span>}
                {threadKind && (
                  <span className="tag">
                    {threadKind === 'free' ? tUi("Free talk") : tUi("Situation")}
                  </span>
                )}
                <span className="spacer" />
                <button
                  type="button"
                  className="btn btn--icon btn--ghost btn--sm"
                  aria-label={tUi("Restart scenario")}
                  onClick={() => void handleRestart()}
                  disabled={isBusy || !session}
                >
                  <Icon name="restart_alt" size={17} />
                </button>
                <div className="dialogue-menu" ref={menuRef}>
                  <button
                    type="button"
                    className="btn btn--icon btn--ghost btn--sm"
                    aria-label={tUi("Session menu")}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((v) => !v)}
                  >
                    <Icon name="more_horiz" size={17} />
                  </button>
                  {menuOpen && (
                    <div className="popover dialogue-menu-pop" role="menu">
                      <button
                        type="button"
                        role="menuitem"
                        className="menu-item"
                        onClick={() => void handleRestart()}
                      >
                        <Icon name="restart_alt" size={17} className="menu-item__icon" />
                        <span className="menu-item__label">{tUi("Restart scenario")}</span>
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="menu-item"
                        onClick={() => void handleEnd()}
                        disabled={!session || session.status !== 'active'}
                      >
                        <Icon name="logout" size={17} className="menu-item__icon" />
                        <span className="menu-item__label">{tUi("End session")}</span>
                      </button>
                    </div>
                  )}
                </div>
              </header>

              <div className="dialogue-thread" ref={threadRef} aria-live="polite">
                {(session?.turns ?? []).map((turn) =>
                  turn.role === 'tutor' ? (
                    <div key={turn.id} className="dialogue-msg dialogue-msg--tutor">
                      <div className="dialogue-msg-meta">
                        <TutorAvatar />
                        {tUi("Tutor")}
                        <button
                          type="button"
                          className={`btn btn--icon btn--ghost btn--sm dialogue-play-btn${
                            playingTurnId === turn.id ? ' is-playing' : ''
                          }`}
                          aria-label={tUi("Play tutor line")}
                          onClick={() => void handlePlay(turn)}
                        >
                          <Icon name="volume_up" size={17} />
                        </button>
                      </div>
                      <p className="dialogue-msg-text" dir="auto">{turn.text}</p>
                    </div>
                  ) : (
                    <div key={turn.id} className="dialogue-msg dialogue-msg--user">
                      <div className="dialogue-msg-meta">
                        {tUi("You")}
                        {turn.turnScore != null && (
                          <span
                            className={`dialogue-msg-score${
                              turn.turnScore >= GOOD_TURN_SCORE ? ' is-good' : ''
                            }`}
                          >
                            {Math.round(turn.turnScore)}
                          </span>
                        )}
                      </div>
                      <p className="dialogue-msg-text dialogue-bubble" dir="auto">{turn.text}</p>
                    </div>
                  ),
                )}
                {liveTurns.map((turn) => (
                  <Fragment key={`live-${turn.id}`}>
                    {turn.heard && (
                      <div className="dialogue-msg dialogue-msg--user dialogue-msg--live">
                        <div className="dialogue-msg-meta">{tUi("You")}</div>
                        <p className="dialogue-msg-text dialogue-bubble" dir="auto">{turn.heard}</p>
                      </div>
                    )}
                    {turn.spoken && (
                      <div className="dialogue-msg dialogue-msg--tutor dialogue-msg--live">
                        <div className="dialogue-msg-meta">
                          <TutorAvatar />
                          {tUi("Tutor")}
                        </div>
                        <p className="dialogue-msg-text" dir="auto">{turn.spoken}</p>
                      </div>
                    )}
                  </Fragment>
                ))}
                {!session && isStarting && (
                  <p className="inline-note">{tUi("Starting scenario…")}</p>
                )}
                {!session && !isStarting && error && (
                  <div className="dialogue-retry">
                    <Button onClick={handleRetryStart}>{tUi("Try again")}</Button>
                  </div>
                )}
                {!session && !isStarting && !error && !scenariosLoading && scenarios.length === 0 && (
                  <div className="empty dialogue-empty">
                    <p>{tUi("There are no scenarios in ")}{languageLabel(language, false, locale)}{tUi(" yet.")}</p>
                    <Button variant="primary" onClick={() => setTab('scenarios')}>{tUi("Open Practice Scenarios")}</Button>
                  </div>
                )}
              </div>
            </section>

            <section className="dialogue-console" aria-label={tUi("Voice reply console")}>
              {voiceMode === 'live' ? (
                <LiveConversationConsole
                  status={live.status}
                  modelSpeaking={live.modelSpeaking}
                  analyser={live.analyser}
                  headphones={headphones}
                  onHeadphonesChange={setHeadphones}
                  onStart={handleStartLive}
                  onStop={() => void stopLive()}
                  onSendText={(text) => void sendLiveText(text)}
                  unavailableReason={liveUnavailable}
                  error={live.error}
                  notice={live.notice}
                />
              ) : (
                <>
                  <div className="dialogue-record-row">
                    <button
                      type="button"
                      className={`dialogue-mic-btn${recording ? ' is-live' : ''}`}
                      aria-label={recording ? tUi("Stop recording") : tUi("Start recording")}
                      aria-pressed={recording}
                      onClick={() => void toggleRecording()}
                      disabled={isBusy && !recording}
                    >
                      <Icon name="mic" size={22} />
                    </button>

                    <div className="dialogue-record-wave">
                      {recording && (
                        <span className="dialogue-rec-status">
                          <span className="dialogue-rec-dot" aria-hidden="true" />
                          {tUi("Recording")}
                        </span>
                      )}
                      <DialogueBarEqualizer
                        isRecording={recording}
                        isProcessing={processing}
                        analyser={recorder.analyser}
                      />
                    </div>

                    {recording && <RecordingTimer />}

                    <Button
                      variant="primary"
                      onClick={() => void handleSaySend()}
                      disabled={isBusy && !recording}
                      aria-label={tUi("Say or send reply")}
                    >
                      <Icon name="send" size={17} />
                      {processing ? tUi("Sending…") : tUi("Say / Send")}
                    </Button>
                  </div>

                  {showTextInput && (
                    <form
                      className="dialogue-text-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void submitText(textDraft);
                      }}
                    >
                      <label className="sr-only" htmlFor="dialogue-text-input">{tUi("Typed reply")}</label>
                      <div className="field dialogue-text-field">
                        <input dir="auto"
                          id="dialogue-text-input"
                          className="field__input"
                          value={textDraft}
                          onChange={(e) => setTextDraft(e.target.value)}
                          placeholder={tUi("Type your reply…")}
                          autoComplete="off"
                          disabled={isBusy}
                        />
                      </div>
                      <Button type="submit" variant="secondary" disabled={isBusy}>{tUi("Send")}</Button>
                    </form>
                  )}

                  {recorder.error && (
                    <p className="inline-error" role="alert">
                      {recorder.error}
                    </p>
                  )}
                  {pendingClip && !recording && (
                    <p className="inline-note" aria-live="polite">{tUi("Recording ready — press Say / Send to submit.")}</p>
                  )}
                </>
              )}

              <div className="dialogue-console-foot">
                {voiceMode === 'record' && (
                  <>
                    {recording ? (
                      <span className="hint" aria-hidden="true">
                        <span>{tUi("Release")}</span>{' '}
                        <kbd className="kbd">{tUi("Space")}</kbd>{' '}
                        <span>{tUi("to send")}</span>
                      </span>
                    ) : (
                      <span className="hint" aria-hidden="true">
                        <kbd className="kbd">{tUi("Space")}</kbd>{' '}
                        <span>{tUi("Press or hold Spacebar to reply")}</span>
                      </span>
                    )}
                    <button
                      type="button"
                      className="dialogue-link"
                      onClick={() => setShowTextInput((v) => !v)}
                      aria-expanded={showTextInput}
                    >
                      {showTextInput ? tUi("Hide typed reply") : tUi("Type a reply instead")}
                    </button>
                  </>
                )}
                <span className="spacer" />
                <div className="seg dialogue-mode-switch" role="group" aria-label={tUi("Voice mode")}>
                  <button
                    type="button"
                    className={`seg__item${voiceMode === 'record' ? ' is-active' : ''}`}
                    aria-pressed={voiceMode === 'record'}
                    onClick={() => switchVoiceMode('record')}
                  >{tUi("Record & send")}</button>
                  <button
                    type="button"
                    className={`seg__item${voiceMode === 'live' ? ' is-active' : ''}`}
                    aria-pressed={voiceMode === 'live'}
                    onClick={() => switchVoiceMode('live')}
                  >{tUi("Live")}</button>
                </div>
              </div>
            </section>
          </div>

          <aside className="dialogue-metrics" aria-label={tUi("Session metrics")}>
            <div className="stat-grid dialogue-scores">
              <div className="stat">
                <p className="stat__label" id="dialogue-last-turn-label">{tUi("Last turn")}</p>
                <p
                  className="stat__value dialogue-score-value"
                  role="meter"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={turnScore ?? undefined}
                  aria-valuetext={turnScore == null ? tUi("No score yet") : undefined}
                  aria-label={tUi("Current turn score")}
                >
                  {turnScore ?? '—'}
                </p>
              </div>
              <div className="stat">
                <p className="stat__label" id="dialogue-session-label">{tUi("Session")}</p>
                <p
                  className="stat__value dialogue-score-value"
                  role="meter"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={sessionScore ?? undefined}
                  aria-valuetext={sessionScore == null ? tUi("No score yet") : undefined}
                  aria-labelledby="dialogue-session-label"
                  aria-live="polite"
                >
                  {sessionScore ?? '—'}
                </p>
              </div>
            </div>
            <p className="inline-note">{tUi("(Fluency & Clarity)")}</p>

            <hr className="divider" />

            <div className="dialogue-suggestions">
              <p className="section-label">{tUi("Useful phrases")}</p>
              <ul className="dialogue-chip-list" aria-label={tUi("Suggested phrases")}>
                {suggestions.length === 0 ? (
                  <li className="inline-note">{tUi("Suggestions appear after you reply.")}</li>
                ) : (
                  suggestions.map((phrase) => (
                    <li key={phrase}>
                      <button
                        type="button"
                        className="tag dialogue-chip"
                        dir="auto"
                        onClick={() =>
                          void (liveBusy ? sendLiveText(phrase) : submitText(phrase))
                        }
                        disabled={isBusy || session?.status !== 'active'}
                      >
                        {phrase}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </aside>
        </div>
      )}
      <CreateScenarioModal
        isOpen={createOpen}
        language={language}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
}
