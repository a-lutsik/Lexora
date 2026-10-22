import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FreqBadge } from './FreqBadge';

describe('FreqBadge', () => {
  it('renders the rank as a mono number, not stars', () => {
    render(<FreqBadge rank={1500} />);
    const value = screen.getByText(/^(1,500|1 500)$/);
    expect(value).toHaveClass('num');
    expect(value).not.toHaveClass('badge--warn');
    expect(document.body).not.toHaveTextContent('★');
  });

  it('renders small rank without grouping separator', () => {
    render(<FreqBadge rank={42} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('can phrase the rank as "top N" for word details', () => {
    render(<FreqBadge rank={500} top />);
    expect(screen.getByText('top 500')).toHaveClass('num');
  });

  it('renders nothing for null rank', () => {
    const { container } = render(<FreqBadge rank={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
