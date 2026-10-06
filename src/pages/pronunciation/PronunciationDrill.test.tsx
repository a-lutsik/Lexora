import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PronunciationDrill } from './PronunciationDrill';

const noop = () => undefined;

function renderDrill(
  overrides: {
    primaryLoading?: boolean;
    primaryLabel?: string;
    primaryAriaLabel?: string;
    waveActive?: boolean;
    primaryDisabled?: boolean;
  } = {},
) {
  render(
    <PronunciationDrill
      sceneTitle="Practice: Pronunciation"
      targetText="Peky"
      onTargetTextChange={noop}
      targetIpa=""
      phraseInputId="pron-target"
      phraseInputLabel="Word or phrase"
      currentScore={null}
      sessionAverage={null}
      sessionPassed={0}
      sessionTotal={0}
      analyser={null}
      waveActive={overrides.waveActive ?? false}
      onPrimary={noop}
      primaryLabel={overrides.primaryLabel ?? 'Say / Record'}
      primaryAriaLabel={overrides.primaryAriaLabel ?? 'Scoring pronunciation'}
      primaryDisabled={overrides.primaryDisabled ?? true}
      primaryLoading={overrides.primaryLoading ?? false}
      onListen={noop}
      listenDisabled={false}
      showPostpone={false}
      onNextPhrase={noop}
    />,
  );
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

  it('places Listen to Model next to Voice and Record', () => {
    renderDrill({ primaryDisabled: false, primaryAriaLabel: 'Record attempt' });

    const group = screen.getByRole('group', { name: 'Listen, voice, and record' });
    expect(group).toContainElement(screen.getByRole('button', { name: 'Listen to Model' }));
    expect(group).toContainElement(screen.getByRole('button', { name: 'Voice' }));
    expect(group).toContainElement(screen.getByRole('button', { name: 'Record attempt' }));
    expect(screen.getByText('Say / Record')).toBeInTheDocument();
  });

  it('renders a read-only phrase without a textbox', () => {
    render(
      <PronunciationDrill
        sceneTitle="Shadowing Drill: Advanced Pronunciation"
        targetText="apple"
        targetIpa="/ˈæp.əl/"
        phraseEditable={false}
        emptyPhraseHint="Add words to Vocabulary to start shadowing."
        phraseInputId="pron-shadow-target"
        phraseInputLabel="Phrase to shadow"
        currentScore={null}
        sessionAverage={null}
        sessionPassed={0}
        sessionTotal={0}
        analyser={null}
        waveActive={false}
        onPrimary={noop}
        primaryLabel="Say / Record"
        primaryAriaLabel="Say phrase"
        primaryDisabled={false}
        onListen={noop}
        listenDisabled={false}
        showPostpone={false}
        onNextPhrase={noop}
      />,
    );

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
});
