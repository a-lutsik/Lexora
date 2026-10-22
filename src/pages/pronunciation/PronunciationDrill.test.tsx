import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PronunciationDrill, type PronunciationDrillProps } from './PronunciationDrill';

const noop = () => undefined;

function baseProps(overrides: Partial<PronunciationDrillProps> = {}): PronunciationDrillProps {
  return {
    sceneTitle: 'Practice: Pronunciation',
    targetText: 'Peky',
    onTargetTextChange: noop,
    targetIpa: '',
    phraseInputId: 'pron-target',
    phraseInputLabel: 'Word or phrase',
    currentScore: null,
    sessionAverage: null,
    analyser: null,
    waveActive: false,
    onPrimary: noop,
    primaryLabel: 'Hold to record',
    primaryAriaLabel: 'Scoring pronunciation',
    primaryDisabled: true,
    primaryLoading: false,
    onListen: noop,
    listenDisabled: false,
    showPostpone: false,
    onNextPhrase: noop,
    ...overrides,
  };
}

function renderDrill(overrides: Partial<PronunciationDrillProps> = {}) {
  return render(<PronunciationDrill {...baseProps(overrides)} />);
}

describe('PronunciationDrill', () => {
  it('shows a visible scoring label and spinner while processing', () => {
    renderDrill({ primaryLoading: true, primaryLabel: 'Scoring…' });

    const cta = screen.getByRole('button', { name: 'Scoring pronunciation' });
    expect(cta).toHaveClass('is-loading');
    expect(cta).toHaveAttribute('aria-busy', 'true');
    expect(cta).toHaveTextContent('Scoring…');
    expect(cta.querySelector('.drill-cta-spinner')).toBeInTheDocument();
    expect(cta).not.toHaveTextContent(/^…$/);
  });

  it('places Listen next to Voice and Hold to record', () => {
    renderDrill({ primaryDisabled: false, primaryAriaLabel: 'Hold to record' });

    const group = screen.getByRole('group', { name: 'Listen, voice, and record' });
    expect(group).toContainElement(screen.getByRole('button', { name: 'Listen' }));
    expect(group).toContainElement(screen.getByRole('button', { name: 'Voice' }));
    const record = screen.getByRole('button', { name: 'Hold to record' });
    expect(group).toContainElement(record);
    expect(record).toHaveTextContent('Hold to record');
  });

  it('renders a read-only phrase without a textbox', () => {
    renderDrill({
      sceneTitle: 'Shadowing Drill: Advanced Pronunciation',
      targetText: 'apple',
      onTargetTextChange: undefined,
      targetIpa: '/ˈæp.əl/',
      phraseEditable: false,
      emptyPhraseHint: 'Add words to Vocabulary to start shadowing.',
      phraseInputId: 'pron-shadow-target',
      phraseInputLabel: 'Phrase to shadow',
      primaryAriaLabel: 'Say phrase',
      primaryDisabled: false,
    });

    expect(screen.getByLabelText('Phrase to shadow')).toHaveTextContent('apple');
    expect(screen.queryByRole('textbox', { name: 'Phrase to shadow' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Target IPA')).toHaveTextContent('/ˈæp.əl/');
  });

  it('shows Stop on Voice and Record while recording', () => {
    renderDrill({
      waveActive: true,
      primaryLabel: 'Stop',
      primaryAriaLabel: 'Stop recording',
      primaryDisabled: false,
    });

    const voice = screen.getByRole('button', { name: 'Stop' });
    expect(voice).toHaveClass('is-active');
    expect(voice).toHaveAttribute('aria-pressed', 'true');
    expect(voice).toHaveTextContent('Stop');

    const record = screen.getByRole('button', { name: 'Stop recording' });
    expect(record).toHaveClass('is-recording');
    expect(record).toHaveTextContent('Stop');
  });

  it('sizes the hero word by length: 60px normal, smaller for long text, 40px placeholder', () => {
    const { rerender } = render(<PronunciationDrill {...baseProps({ targetText: 'thorough' })} />);
    const input = screen.getByLabelText('Word or phrase');
    expect(input).toHaveAttribute('data-size', 'hero');

    rerender(<PronunciationDrill {...baseProps({ targetText: 'congratulations' })} />);
    expect(input).toHaveAttribute('data-size', 'long');

    rerender(<PronunciationDrill {...baseProps({ targetText: 'a much longer practice sentence' })} />);
    expect(input).toHaveAttribute('data-size', 'phrase');

    rerender(<PronunciationDrill {...baseProps({ targetText: '' })} />);
    expect(input).toHaveAttribute('data-size', 'placeholder');
  });

  it('shows labelled You waveform and the Model row only after Listen was played', async () => {
    const onListen = vi.fn();
    const user = userEvent.setup();
    const { container } = renderDrill({ targetText: 'thorough', onListen });

    const waves = container.querySelector<HTMLElement>('.drill-waves');
    if (!waves) throw new Error('waveform rows not rendered');
    expect(within(waves).getByText('You')).toBeInTheDocument();
    expect(within(waves).queryByText('Model')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Listen' }));
    expect(onListen).toHaveBeenCalledTimes(1);
    expect(within(waves).getByText('Model')).toBeInTheDocument();
  });

  it('renders the Model envelope deterministically for the same phrase', async () => {
    const user = userEvent.setup();
    const first = renderDrill({ targetText: 'thorough' });
    await user.click(screen.getByRole('button', { name: 'Listen' }));
    const heightsA = Array.from(
      first.container.querySelectorAll('.drill-waveform[data-tone="model"] rect'),
    ).map((rect) => rect.getAttribute('height'));
    first.unmount();

    const second = renderDrill({ targetText: 'thorough' });
    await user.click(screen.getByRole('button', { name: 'Listen' }));
    const heightsB = Array.from(
      second.container.querySelectorAll('.drill-waveform[data-tone="model"] rect'),
    ).map((rect) => rect.getAttribute('height'));

    expect(heightsA.length).toBeGreaterThan(0);
    expect(heightsB).toEqual(heightsA);
  });

  it('shows the hold / next-phrase hint', () => {
    renderDrill({ spaceHint: true, spaceHintLead: 'Hold', spaceHintText: 'to record' });
    const hint = screen.getByText((_, el) => el?.classList.contains('drill-space-hint') ?? false);
    expect(hint).toHaveTextContent('Hold Space to record · → next phrase');
  });

  it('advances to the next phrase on ArrowRight unless focus is in a text field', () => {
    const onNextPhrase = vi.fn();
    renderDrill({ targetText: 'thorough', onNextPhrase });

    fireEvent.keyDown(document.body, { key: 'ArrowRight' });
    expect(onNextPhrase).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(screen.getByLabelText('Word or phrase'), { key: 'ArrowRight' });
    expect(onNextPhrase).toHaveBeenCalledTimes(1);
  });

  it('does not advance on ArrowRight while recording', () => {
    const onNextPhrase = vi.fn();
    renderDrill({ waveActive: true, primaryDisabled: false, onNextPhrase });
    fireEvent.keyDown(document.body, { key: 'ArrowRight' });
    expect(onNextPhrase).not.toHaveBeenCalled();
  });

  it('shows one score ring with verdict, pass mark, attempt and session line', () => {
    const { rerender } = render(
      <PronunciationDrill
        {...baseProps({ currentScore: 92, sessionAverage: 88, attempt: 2 })}
      />,
    );
    const meters = screen.getAllByRole('meter');
    expect(meters).toHaveLength(1);
    expect(meters[0]).toHaveAccessibleName('Current pronunciation score');
    expect(meters[0]).toHaveAttribute('aria-valuenow', '92');
    expect(meters[0]).toHaveTextContent(/^92$/);
    expect(screen.getByText('Good attempt')).toBeInTheDocument();
    expect(screen.getByText('Pass at 90 · attempt 2')).toBeInTheDocument();
    expect(screen.getByText('Session 88')).toBeInTheDocument();

    rerender(<PronunciationDrill {...baseProps({ currentScore: 84, sessionAverage: 84, attempt: 1 })} />);
    expect(screen.getByText('Keep practising')).toBeInTheDocument();
    expect(screen.queryByText('Good attempt')).not.toBeInTheDocument();
  });

  it('labels the written feedback and offers Next phrase in the side column', async () => {
    const onNextPhrase = vi.fn();
    const user = userEvent.setup();
    renderDrill({ feedback: <p>Tongue between the teeth.</p>, onNextPhrase });

    expect(screen.getByText('Feedback')).toBeInTheDocument();
    expect(screen.getByText('Tongue between the teeth.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next phrase' }));
    expect(onNextPhrase).toHaveBeenCalledTimes(1);
  });
});
