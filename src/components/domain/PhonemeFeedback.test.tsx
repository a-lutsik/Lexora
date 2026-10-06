import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PhonemeFeedback, ScoreGauge } from './PhonemeFeedback';
import { renderWithQueryClient } from '../../test/render';
import type { PhonemeScoreDto } from '../../lib/types';

const phones: PhonemeScoreDto[] = [
  {
    id: 1,
    attemptId: 9,
    targetPhoneme: 'θ',
    recognizedPhoneme: 's',
    accuracy: 40,
    status: 'miss',
    position: 0,
  },
  {
    id: 2,
    attemptId: 9,
    targetPhoneme: 'ɪ',
    recognizedPhoneme: 'ɪ',
    accuracy: 100,
    status: 'ok',
    position: 1,
  },
];

describe('PhonemeFeedback', () => {
  it('renders a score gauge with accessible meter values', () => {
    renderWithQueryClient(<ScoreGauge score={72} />);
    const meter = screen.getByRole('meter', { name: 'Pronunciation score' });
    expect(meter).toHaveAttribute('aria-valuenow', '72');
    expect(screen.getByText('72%')).toBeInTheDocument();
  });

  it('renders a ring gauge with label and session caption', () => {
    renderWithQueryClient(
      <ScoreGauge
        score={92}
        variant="ring"
        label="Current Score: 92%"
        caption="Passed 1/1 (90% threshold)"
        aria-label="Current pronunciation score"
      />,
    );
    const meter = screen.getByRole('meter', { name: 'Current pronunciation score' });
    expect(meter).toHaveAttribute('aria-valuenow', '92');
    expect(screen.getByText('Current Score: 92%')).toBeInTheDocument();
    expect(screen.getByText('Passed 1/1 (90% threshold)')).toBeInTheDocument();
  });

  it('lists target phonemes and substitutions', () => {
    renderWithQueryClient(<PhonemeFeedback phonemes={phones} />);
    expect(screen.getByLabelText('Phoneme scores')).toBeInTheDocument();
    expect(screen.getByText('/θ/')).toBeInTheDocument();
    expect(screen.getByText('heard /s/')).toBeInTheDocument();
    expect(screen.getByText('/ɪ/')).toBeInTheDocument();
  });
});
