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
import { IconMic } from '../../components/ui/LuminousIcons';
import { CreateScenarioModal } from './CreateScenarioModal';
import { DialogueBarEqualizer } from './DialogueBarEqualizer';
import { LiveConversationConsole } from './LiveConversationConsole';
import { TurnScoreRing } from './TurnScoreRing';
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

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <polygon points="8,5 20,12 8,19" />
    </svg>
  );
}

function RobotAvatar() {
  return (
    <div className="dialogue-avatar" aria-hidden="true">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="5" y="8" width="14" height="11" rx="3" stroke="currentColor" strokeWidth="1.75" />
        <circle cx="9.5" cy="13" r="1.4" fill="currentColor" />
        <circle cx="14.5" cy="13" r="1.4" fill="currentColor" />
        <path d="M12 4v3M9 19v2M15 19v2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        <path d="M8 16h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      </svg>
    </div>
  );
}

async function playTutorLine(text: string, language: string): Promise<void> {
  await ipc.media.playTts(text, language);
}

export default function DialoguePage() {
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
      ? `Live conversation is unavailable: ${liveRole.message || 'choose the Gemini package in Settings.'}`
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
      setError(formatIpcError(err, 'Could not start dialogue. Check the AI provider in Settings.'));
    });
  }, [ensureSession]);

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
        setError(formatIpcError(err, 'Could not send your reply. Check the AI provider in Settings.'));
      }
    },
    [clearPendingClip, ensureSession, isBusy, sendMutation, session?.scenarioSlug],
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
        setError(formatIpcError(err, 'Could not send the recording. Check the AI provider in Settings.'));
      }
    },
    [ensureSession, isBusy, sendMutation, session?.scenarioSlug],
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
        setError(formatIpcError(err, 'Could not send your reply. Check the AI provider in Settings.'));
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
  }, [isBusy, pendingClip, recorder, submitClip, submitText, textDraft]);

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
        setError(formatIpcError(err, 'Could not start dialogue. Check the AI provider in Settings.'));
      });
  }, [ensureSession, session, startLive]);

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
        setError('There are no scenarios in this language yet. Add or generate one in Practice Scenarios.');
        return;
      }
      if (session && session.status === 'active') {
        await endMutation.mutateAsync(session.id);
      }
      const next = await startSession(input);
      setSession(next);
      setError(null);
    } catch (err) {
      setError(formatIpcError(err, 'Could not restart this scenario. Try again.'));
    }
  }, [clearPendingClip, endMutation, session, startInputFor, startSession, stopLive]);

  const handleEnd = useCallback(async () => {
    setMenuOpen(false);
    if (!session) return;
    await stopLive();
    try {
      const next = await endMutation.mutateAsync(session.id);
      setSession(next);
      setError(null);
    } catch (err) {
      setError(formatIpcError(err, 'Could not end this session. Try again.'));
    }
  }, [endMutation, session, stopLive]);

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
        setError(formatIpcError(err, 'Could not start this scenario. Check the AI provider in Settings.'));
      }
    },
    [clearPendingClip, endMutation, language, session, startSession, stopLive],
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
      setError(formatIpcError(err, 'Could not generate scenarios. Check the AI provider in Settings.'));
    }
  }, [generateMutation, language]);

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
        setError(formatIpcError(err, 'Could not delete this scenario. Try again.'));
      }
    },
    [deleteMutation, pendingDeleteId],
  );

  const handlePlay = useCallback(
    async (turn: DialogueTurnDto) => {
      setPlayingTurnId(turn.id);
      try {
        await playTutorLine(turn.text, language);
      } catch (err) {
        setError(formatIpcError(err, 'Could not play audio. Try again.'));
      } finally {
        window.setTimeout(() => setPlayingTurnId(null), 800);
      }
    },
    [language],
  );

  const userTurn = lastUserTurn(session);
  const suggestions = useMemo(() => latestSuggestions(session), [session]);
  const sessionScore = session?.sessionScore ?? null;
  const turnScore = userTurn?.turnScore ?? null;

  const recording = recorder.status === 'recording';
  const processing = sendMutation.isPending;

  return (
    <div className="dialogue-page animate-fade-in">
      <div className="dialogue-tabs" role="tablist" aria-label="Dialogue modes">
        <button
          type="button"
          role="tab"
          id="dialogue-tab-dialogue"
          aria-selected={tab === 'dialogue'}
          aria-controls="dialogue-panel-dialogue"
          className={`dialogue-tab${tab === 'dialogue' ? ' is-active' : ''}`}
          onClick={() => setTab('dialogue')}
        >
          AI Dialogue
        </button>
        <button
          type="button"
          role="tab"
          id="dialogue-tab-scenarios"
          aria-selected={tab === 'scenarios'}
          aria-controls="dialogue-panel-scenarios"
          className={`dialogue-tab${tab === 'scenarios' ? ' is-active' : ''}`}
          onClick={() => setTab('scenarios')}
        >
          Practice Scenarios
        </button>
      </div>

      {error && (
        <p className="dialogue-error" role="alert">
          {error}
        </p>
      )}

      {tab === 'scenarios' ? (
        <div
          id="dialogue-panel-scenarios"
          role="tabpanel"
          aria-labelledby="dialogue-tab-scenarios"
          className="dialogue-scenarios"
        >
          <div className="dialogue-scenarios-head">
            <div>
              <h1 className="dialogue-scenarios-title">Practice Scenarios</h1>
              <p className="dialogue-scenarios-sub text-secondary text-sm">
                Pick a situation and level to practice speaking with an AI tutor.
              </p>
            </div>
            <div className="dialogue-scenarios-actions">
              {language !== BASE_LANGUAGE && (
                <Button
                  variant="secondary"
                  onClick={() => void handleGenerate()}
                  isLoading={generateMutation.isPending}
                  disabled={isBusy}
                  aria-label={`Generate scenarios in ${languageLabel(language)}`}
                >
                  {generateMutation.isPending ? 'Generating…' : 'Generate scenarios'}
                </Button>
              )}
              <Button
                variant="primary"
                onClick={() => setCreateOpen(true)}
                disabled={isBusy || generateMutation.isPending}
              >
                Add scenario
              </Button>
            </div>
          </div>
          {notice && (
            <p className="dialogue-notice text-sm text-secondary" role="status">
              {notice}
            </p>
          )}
          {scenariosLoading ? (
            <p className="text-muted text-sm">Loading scenarios…</p>
          ) : scenarios.length === 0 ? (
            <p className="dialogue-scenarios-empty text-secondary text-sm">
              {language === BASE_LANGUAGE
                ? 'No scenarios yet. Add your own.'
                : `There are no scenarios in ${languageLabel(language)} yet. Generate them from the built-in English ones, or add your own.`}
            </p>
          ) : (
            <ul className="dialogue-scenario-list">
              {scenarios.map((scenario) => (
                <li key={scenario.id} className="dialogue-scenario-item">
                  <button
                    type="button"
                    className={`dialogue-scenario-card${
                      session?.scenarioId === scenario.id ? ' is-current' : ''
                    }`}
                    onClick={() => void handleSelectScenario(scenario)}
                    disabled={isBusy}
                  >
                    <span className="dialogue-scenario-badges">
                      <span className="dialogue-scenario-level">{scenario.level}</span>
                      {scenario.kind === 'free' && (
                        <span className="dialogue-scenario-kind">Free talk</span>
                      )}
                    </span>
                    <span className="dialogue-scenario-name">{scenario.title}</span>
                    {scenario.description && (
                      <span className="dialogue-scenario-desc">{scenario.description}</span>
                    )}
                  </button>
                  {scenario.origin !== 'builtin' && (
                    <button
                      type="button"
                      className={`dialogue-scenario-delete${
                        pendingDeleteId === scenario.id ? ' is-armed' : ''
                      }`}
                      aria-label={
                        pendingDeleteId === scenario.id
                          ? `Confirm deleting ${scenario.title}`
                          : `Delete ${scenario.title}`
                      }
                      onClick={() => void handleDeleteScenario(scenario)}
                      onBlur={() => setPendingDeleteId(null)}
                      disabled={deleteMutation.isPending}
                    >
                      {pendingDeleteId === scenario.id ? 'Delete?' : '×'}
                    </button>
                  )}
                </li>
              ))}
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
            <section className="dialogue-thread-panel glass" aria-label="Scenario conversation">
              <header className="dialogue-thread-header">
                <h1 className="dialogue-thread-title">
                  {session?.scenarioTitle ?? scenarios[0]?.title ?? 'AI Dialogue'}
                </h1>
                <div className="dialogue-menu" ref={menuRef}>
                  <button
                    type="button"
                    className="dialogue-menu-btn"
                    aria-label="Session menu"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((v) => !v)}
                  >
                    ···
                  </button>
                  {menuOpen && (
                    <div className="dialogue-menu-pop" role="menu">
                      <button type="button" role="menuitem" onClick={() => void handleRestart()}>
                        Restart scenario
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => void handleEnd()}
                        disabled={!session || session.status !== 'active'}
                      >
                        End session
                      </button>
                    </div>
                  )}
                </div>
              </header>

              <div className="dialogue-thread" ref={threadRef} aria-live="polite">
                {(session?.turns ?? []).map((turn) =>
                  turn.role === 'tutor' ? (
                    <div key={turn.id} className="dialogue-msg dialogue-msg--tutor">
                      <RobotAvatar />
                      <div className="dialogue-bubble dialogue-bubble--tutor">
                        <p>{turn.text}</p>
                        <button
                          type="button"
                          className={`dialogue-play-btn${
                            playingTurnId === turn.id ? ' is-playing' : ''
                          }`}
                          aria-label="Play tutor line"
                          onClick={() => void handlePlay(turn)}
                        >
                          <PlayIcon />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div key={turn.id} className="dialogue-msg dialogue-msg--user">
                      <div className="dialogue-bubble dialogue-bubble--user">
                        <p>{turn.text}</p>
                      </div>
                    </div>
                  ),
                )}
                {liveTurns.map((turn) => (
                  <Fragment key={`live-${turn.id}`}>
                    {turn.heard && (
                      <div className="dialogue-msg dialogue-msg--user dialogue-msg--live">
                        <div className="dialogue-bubble dialogue-bubble--user">
                          <p>{turn.heard}</p>
                        </div>
                      </div>
                    )}
                    {turn.spoken && (
                      <div className="dialogue-msg dialogue-msg--tutor dialogue-msg--live">
                        <RobotAvatar />
                        <div className="dialogue-bubble dialogue-bubble--tutor">
                          <p>{turn.spoken}</p>
                        </div>
                      </div>
                    )}
                  </Fragment>
                ))}
                {!session && isStarting && (
                  <p className="text-muted text-sm">Starting scenario…</p>
                )}
                {!session && !isStarting && error && (
                  <Button onClick={handleRetryStart}>Try again</Button>
                )}
                {!session && !isStarting && !error && !scenariosLoading && scenarios.length === 0 && (
                  <div className="dialogue-empty">
                    <p className="text-secondary text-sm">
                      There are no scenarios in {languageLabel(language)} yet.
                    </p>
                    <Button variant="primary" onClick={() => setTab('scenarios')}>
                      Open Practice Scenarios
                    </Button>
                  </div>
                )}
              </div>
            </section>

            <section className="dialogue-voice-console glass" aria-label="Voice reply console">
              <div className="dialogue-mode-switch" role="group" aria-label="Voice mode">
                <button
                  type="button"
                  className={`dialogue-mode-btn${voiceMode === 'record' ? ' is-active' : ''}`}
                  aria-pressed={voiceMode === 'record'}
                  onClick={() => switchVoiceMode('record')}
                >
                  Record &amp; send
                </button>
                <button
                  type="button"
                  className={`dialogue-mode-btn${voiceMode === 'live' ? ' is-active' : ''}`}
                  aria-pressed={voiceMode === 'live'}
                  onClick={() => switchVoiceMode('live')}
                >
                  Live conversation
                </button>
              </div>

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
                  <DialogueBarEqualizer
                    isRecording={recording}
                    isProcessing={processing}
                    analyser={recorder.analyser}
                  />

                  <div className="dialogue-voice-controls">
                    <button
                      type="button"
                      className={`dialogue-mic-btn${recording ? ' is-live' : ''}`}
                      aria-label={recording ? 'Stop recording' : 'Start recording'}
                      aria-pressed={recording}
                      onClick={() => void toggleRecording()}
                      disabled={isBusy && !recording}
                    >
                      <IconMic size={18} />
                    </button>

                    <div className="dialogue-space-badge" aria-hidden="true">
                      <kbd className="dialogue-space-key">Space</kbd>
                      <span>Press or hold Spacebar to reply</span>
                    </div>

                    <button
                      type="button"
                      className="dialogue-send-btn"
                      onClick={() => void handleSaySend()}
                      disabled={isBusy && !recording}
                      aria-label="Say or send reply"
                    >
                      {processing ? 'Sending…' : 'Say / Send'}
                    </button>
                  </div>

                  <div className="dialogue-text-disclosure">
                    <button
                      type="button"
                      className="dialogue-text-toggle"
                      onClick={() => setShowTextInput((v) => !v)}
                      aria-expanded={showTextInput}
                    >
                      {showTextInput ? 'Hide typed reply' : 'Type a reply instead'}
                    </button>
                    {showTextInput && (
                      <form
                        className="dialogue-text-form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          void submitText(textDraft);
                        }}
                      >
                        <label className="sr-only" htmlFor="dialogue-text-input">
                          Typed reply
                        </label>
                        <input
                          id="dialogue-text-input"
                          className="dialogue-text-input"
                          value={textDraft}
                          onChange={(e) => setTextDraft(e.target.value)}
                          placeholder="Type your reply…"
                          autoComplete="off"
                          disabled={isBusy}
                        />
                        <button type="submit" className="dialogue-text-submit" disabled={isBusy}>
                          Send
                        </button>
                      </form>
                    )}
                  </div>

                  {recorder.error && (
                    <p className="dialogue-error" role="alert">
                      {recorder.error}
                    </p>
                  )}
                  {pendingClip && !recording && (
                    <p className="dialogue-pending text-sm text-secondary" aria-live="polite">
                      Recording ready — press Say / Send to submit.
                    </p>
                  )}
                </>
              )}
            </section>
          </div>

          <aside className="dialogue-metrics glass" aria-label="Session metrics">
            <div className="dialogue-metrics-scores">
              <div className="dialogue-metrics-turn">
                <p className="dialogue-metrics-label">Current Turn Score:</p>
                <TurnScoreRing score={turnScore} />
              </div>
              <div className="dialogue-metrics-session">
                <p className="dialogue-metrics-label">Total Session Score:</p>
                <p className="dialogue-session-value" aria-live="polite">
                  {sessionScore == null ? '—' : `${sessionScore}%`}
                </p>
                <p className="dialogue-session-caption">(Fluency &amp; Clarity)</p>
              </div>
            </div>

            <hr className="dialogue-metrics-divider" />

            <div className="dialogue-suggestions">
              <p className="dialogue-metrics-label">Live vocabulary suggestions:</p>
              <ul className="dialogue-chip-list" aria-label="Suggested phrases">
                {suggestions.length === 0 ? (
                  <li className="text-muted text-sm">Suggestions appear after you reply.</li>
                ) : (
                  suggestions.map((phrase) => (
                    <li key={phrase}>
                      <button
                        type="button"
                        className="dialogue-chip"
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
