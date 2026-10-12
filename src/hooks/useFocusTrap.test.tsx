import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef } from 'react';
import { describe, expect, it } from 'vitest';
import { useFocusTrap } from './useFocusTrap';

function Harness({ active = true, withButtons = true }: { active?: boolean; withButtons?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, active);
  return (
    <div>
      <button type="button">outside before</button>
      <div ref={ref} role="dialog" aria-label="Trapped" tabIndex={-1}>
        {withButtons && (
          <>
            <button type="button">first</button>
            <button type="button" disabled>
              disabled
            </button>
            <input aria-label="middle" />
            <button type="button">last</button>
          </>
        )}
      </div>
      <button type="button">outside after</button>
    </div>
  );
}

describe('useFocusTrap', () => {
  it('wraps Tab from the last control to the first', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    screen.getByRole('button', { name: 'last' }).focus();
    await user.tab();

    expect(screen.getByRole('button', { name: 'first' })).toHaveFocus();
  });

  it('wraps Shift+Tab from the first control to the last', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    screen.getByRole('button', { name: 'first' }).focus();
    await user.tab({ shift: true });

    expect(screen.getByRole('button', { name: 'last' })).toHaveFocus();
  });

  it('wraps Shift+Tab from the dialog container itself to the last control', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    screen.getByRole('dialog').focus();
    await user.tab({ shift: true });

    expect(screen.getByRole('button', { name: 'last' })).toHaveFocus();
  });

  it('pulls focus back inside when it is outside the dialog', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    screen.getByRole('button', { name: 'outside before' }).focus();
    await user.tab();

    expect(screen.getByRole('button', { name: 'first' })).toHaveFocus();
  });

  it('never lets focus leave the dialog over many Tab presses', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const dialog = screen.getByRole('dialog');
    dialog.focus();

    for (let i = 0; i < 20; i += 1) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
  });

  it('keeps focus on the dialog when it has nothing focusable', async () => {
    const user = userEvent.setup();
    render(<Harness withButtons={false} />);
    const dialog = screen.getByRole('dialog');
    dialog.focus();

    await user.tab();

    expect(dialog).toHaveFocus();
  });

  it('does nothing when inactive', async () => {
    const user = userEvent.setup();
    render(<Harness active={false} />);

    screen.getByRole('button', { name: 'last' }).focus();
    await user.tab();

    expect(screen.getByRole('button', { name: 'outside after' })).toHaveFocus();
  });
});
