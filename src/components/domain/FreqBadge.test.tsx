import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FreqBadge } from './FreqBadge';

describe('FreqBadge', () => {
  it('renders formatted rank with warn variant', () => {
    render(<FreqBadge rank={1500} />);
    expect(screen.getByText(/1,500|1 500/)).toHaveClass('badge', 'badge--warn');
  });

  it('renders small rank without grouping separator', () => {
    render(<FreqBadge rank={42} />);
    expect(screen.getByText('★ 42')).toBeInTheDocument();
  });

  it('renders nothing for null rank', () => {
    const { container } = render(<FreqBadge rank={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
