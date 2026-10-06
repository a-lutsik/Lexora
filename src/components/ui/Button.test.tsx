import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button, IconButton } from './Button';

describe('Button', () => {
  it('renders children with default secondary/md classes', () => {
    render(<Button>Save</Button>);
    const btn = screen.getByRole('button', { name: 'Save' });
    expect(btn).toHaveClass('btn', 'btn--secondary', 'btn--md');
  });

  it('applies variant and size classes', () => {
    render(
      <Button variant="danger" size="lg">
        Delete
      </Button>
    );
    expect(screen.getByRole('button')).toHaveClass('btn--danger', 'btn--lg');
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Click
      </Button>
    );
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    await user.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('loading state disables the button, sets aria-busy and shows spinner', () => {
    render(<Button isLoading>Loading</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn).toHaveClass('btn--loading');
    expect(btn.querySelector('.btn-spinner')).toBeInTheDocument();
  });

  it('passes aria-label through', () => {
    render(<Button aria-label="Confirm action">OK</Button>);
    expect(
      screen.getByRole('button', { name: 'Confirm action' })
    ).toBeInTheDocument();
  });
});

describe('IconButton', () => {
  it('renders icon with accessible label', () => {
    render(<IconButton icon={<span data-testid="icon" />} aria-label="Close" />);
    const btn = screen.getByRole('button', { name: 'Close' });
    expect(btn).toHaveClass('btn--icon', 'btn--ghost', 'btn--md');
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('calls onClick and respects disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { rerender } = render(
      <IconButton icon="x" aria-label="Act" onClick={onClick} />
    );
    await user.click(screen.getByRole('button', { name: 'Act' }));
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(<IconButton icon="x" aria-label="Act" onClick={onClick} disabled />);
    expect(screen.getByRole('button', { name: 'Act' })).toBeDisabled();
  });
});
