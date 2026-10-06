import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SafeHtml } from './SafeHtml';

describe('SafeHtml', () => {
  it('renders sanitized markup', () => {
    render(<SafeHtml html="Hello <em>world</em>" />);
    expect(screen.getByText('world').tagName).toBe('EM');
  });

  it('does not execute injected script markup', () => {
    const { container } = render(
      <SafeHtml html={'<script>window.__xss = true</script><span>safe</span>'} />,
    );
    expect(container.querySelector('script')).toBeNull();
    expect(screen.getByText('safe')).toBeInTheDocument();
    expect(
      (window as Window & { __xss?: boolean }).__xss,
    ).toBeUndefined();
  });

  it('renders nothing for empty html', () => {
    const { container } = render(<SafeHtml html="" />);
    expect(container).toBeEmptyDOMElement();
  });
});
