import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AssociatedImage } from './AssociatedImage';

describe('AssociatedImage', () => {
  it('renders a local photo via the asset protocol', () => {
    render(
      <AssociatedImage path="/tmp/apple.jpg" alt="red apple fruit" size="card" />
    );
    const img = screen.getByRole('img', { name: 'red apple fruit' });
    expect(img).toHaveAttribute('src', 'asset://localhost//tmp/apple.jpg');
  });

  it('renders a hero-sized photo frame', () => {
    const { container } = render(
      <AssociatedImage path="/tmp/apple.jpg" alt="red apple fruit" size="hero" />
    );
    expect(container.firstChild).toHaveClass('associated-image-frame--hero');
  });

  it('shows a finding-photo status instead of abstract art while loading', () => {
    const { container } = render(<AssociatedImage path={null} alt="apple" isLoading />);
    expect(screen.getByText('Finding a photo…')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Finding a photo…');
    expect(container.firstChild).toHaveAttribute('aria-busy', 'true');
    expect(container.querySelector('.associated-image-loader')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders nothing when there is no photo and loading finished', () => {
    const { container } = render(
      <AssociatedImage path={null} alt="the" isLoading={false} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows a regenerate control on the photo', async () => {
    const onRegenerate = vi.fn();
    const user = userEvent.setup();
    render(
      <AssociatedImage
        path="/tmp/apple.jpg"
        alt="red apple fruit"
        onRegenerate={onRegenerate}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Regenerate photo' }));
    expect(onRegenerate).toHaveBeenCalledTimes(1);
  });

  it('cache-busts the asset URL after regenerate', () => {
    render(
      <AssociatedImage
        path="/tmp/apple.jpg"
        alt="red apple fruit"
        cacheNonce={3}
      />
    );
    expect(screen.getByRole('img', { name: 'red apple fruit' })).toHaveAttribute(
      'src',
      'asset://localhost//tmp/apple.jpg?v=3'
    );
  });
});
