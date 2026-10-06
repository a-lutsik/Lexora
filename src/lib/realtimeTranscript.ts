// ============================================================
// LEXORA — Live session transcript (pure reducer)
// A turn pairs what the mic heard (user speech / original) with
// what the model said (tutor reply / translation). Transcription
// events are deltas; turnComplete / interrupted close the turn.
// ============================================================

export type RealtimeTurn = {
  id: number;
  heard: string;
  spoken: string;
  /** Text typed instead of spoken (dialogue mode). */
  typed: boolean;
  final: boolean;
};

export type TranscriptState = {
  turns: RealtimeTurn[];
  nextId: number;
};

export type TranscriptAction =
  | { type: 'heard'; text: string }
  | { type: 'spoken'; text: string }
  | { type: 'typed'; text: string }
  | { type: 'endTurn' }
  | { type: 'reset' };

export const EMPTY_TRANSCRIPT: TranscriptState = { turns: [], nextId: 1 };

function appendDelta(previous: string, delta: string): string {
  return previous === '' ? delta.trimStart() : previous + delta;
}

function openTurn(state: TranscriptState): RealtimeTurn | null {
  const last = state.turns[state.turns.length - 1];
  return last && !last.final ? last : null;
}

function replaceLast(state: TranscriptState, turn: RealtimeTurn): TranscriptState {
  return { ...state, turns: [...state.turns.slice(0, -1), turn] };
}

function pushTurn(state: TranscriptState, fields: Partial<RealtimeTurn>): TranscriptState {
  const turn: RealtimeTurn = {
    id: state.nextId,
    heard: '',
    spoken: '',
    typed: false,
    final: false,
    ...fields,
  };
  return { turns: [...state.turns, turn], nextId: state.nextId + 1 };
}

export function transcriptReducer(state: TranscriptState, action: TranscriptAction): TranscriptState {
  switch (action.type) {
    case 'heard':
    case 'spoken': {
      if (action.text === '') return state;
      const field = action.type;
      const open = openTurn(state);
      if (open) {
        return replaceLast(state, { ...open, [field]: appendDelta(open[field], action.text) });
      }
      const text = action.text.trimStart();
      return text === '' ? state : pushTurn(state, { [field]: text });
    }
    case 'typed': {
      const text = action.text.trim();
      if (text === '') return state;
      const closed = transcriptReducer(state, { type: 'endTurn' });
      return pushTurn(closed, { heard: text, typed: true });
    }
    case 'endTurn': {
      const open = openTurn(state);
      if (!open) return state;
      if (open.heard === '' && open.spoken === '') {
        return { ...state, turns: state.turns.slice(0, -1) };
      }
      return replaceLast(state, { ...open, final: true });
    }
    case 'reset':
      return EMPTY_TRANSCRIPT;
  }
}
