import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge, PosBadge, SrsStatusBadge } from './Badge';
import type { SrsStatus } from '../../lib/types';

describe('Badge', () => {
  it('renders children with variant and size classes', () => {
    render(<Badge variant="accent" size="md">tag</Badge>);
    const badge = screen.getByText('tag');
    expect(badge).toHaveClass('badge', 'badge--accent', 'badge--md');
  });

  it('defaults to neutral/sm', () => {
    render(<Badge>plain</Badge>);
    expect(screen.getByText('plain')).toHaveClass('badge--neutral', 'badge--sm');
  });
});

describe('PosBadge', () => {
  it('renders the part of speech', () => {
    render(<PosBadge pos="noun" />);
    expect(screen.getByText('noun')).toHaveClass('badge--neutral');
  });

  it('renders nothing for null', () => {
    const { container } = render(<PosBadge pos={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('SrsStatusBadge', () => {
  it.each([
    ['new', 'New'],
    ['learning', 'Learning'],
    ['review', 'Review'],
    ['mature', 'Mature'],
    ['suspended', 'Suspended'],
  ] as Array<[SrsStatus, string]>)(
    'renders label %s for status %s',
    (status, label) => {
      render(<SrsStatusBadge status={status} />);
      expect(screen.getByText(label)).toHaveClass(`badge--${status}`);
    }
  );
});
