import { describe, expect, it } from 'vitest';
import { EMPTY_TRANSCRIPT, transcriptReducer, type TranscriptAction } from './realtimeTranscript';

function run(actions: TranscriptAction[]) {
  return actions.reduce(transcriptReducer, EMPTY_TRANSCRIPT);
}

describe('transcriptReducer', () => {
  it('joins transcription deltas of one turn and closes it on turnComplete', () => {
    const state = run([
      { type: 'heard', text: ' I would' },
      { type: 'heard', text: ' like a coffee' },
      { type: 'spoken', text: 'Sure,' },
      { type: 'spoken', text: ' what size?' },
      { type: 'endTurn' },
    ]);
    expect(state.turns).toEqual([
      { id: 1, heard: 'I would like a coffee', spoken: 'Sure, what size?', typed: false, final: true },
    ]);
  });

  it('starts a new turn after the previous one is final', () => {
    const state = run([
      { type: 'spoken', text: 'Hello!' },
      { type: 'endTurn' },
      { type: 'heard', text: ' Hi' },
    ]);
    expect(state.turns.map((t) => [t.id, t.heard, t.spoken, t.final])).toEqual([
      [1, '', 'Hello!', true],
      [2, 'Hi', '', false],
    ]);
  });

  it('late input transcription still lands in the open turn', () => {
    const state = run([
      { type: 'spoken', text: 'Great choice.' },
      { type: 'heard', text: 'A latte please' },
    ]);
    expect(state.turns).toHaveLength(1);
    expect(state.turns[0]?.heard).toBe('A latte please');
  });

  it('typed text closes the open turn and opens a typed one', () => {
    const state = run([
      { type: 'spoken', text: 'Anything else?' },
      { type: 'typed', text: '  No, thanks ' },
      { type: 'spoken', text: 'Have a nice day' },
    ]);
    expect(state.turns.map((t) => [t.heard, t.spoken, t.typed, t.final])).toEqual([
      ['', 'Anything else?', false, true],
      ['No, thanks', 'Have a nice day', true, false],
    ]);
  });

  it('ignores empty deltas and drops empty turns on endTurn', () => {
    const state = run([
      { type: 'heard', text: '' },
      { type: 'heard', text: '   ' },
      { type: 'endTurn' },
      { type: 'typed', text: '  ' },
    ]);
    expect(state.turns).toEqual([]);
  });

  it('resets to an empty transcript', () => {
    const state = run([{ type: 'heard', text: 'hi' }, { type: 'reset' }]);
    expect(state).toEqual(EMPTY_TRANSCRIPT);
  });
});
