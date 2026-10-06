import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Select } from './Select';

const options = [
  { value: 'clearer', label: 'Clearer' },
  { value: 'shorter', label: 'Shorter' },
  { value: 'formal', label: 'More formal' },
];

/** Option referenced by aria-activedescendant of the focused element. */
function activeOption(): HTMLElement | null {
  const id = document.activeElement?.getAttribute('aria-activedescendant');
  return id ? document.getElementById(id) : null;
}

beforeEach(() => {
  // jsdom has no layout: Select scrolls the highlighted option into view.
  Element.prototype.scrollIntoView = vi.fn();
});

describe('Select', () => {
  it('exposes the trigger as a select-only combobox that controls the listbox', async () => {
    const user = userEvent.setup();
    render(
      <Select value="shorter" options={options} onChange={() => undefined} ariaLabel="Rewrite mode" />
    );

    const combobox = screen.getByRole('combobox', { name: 'Rewrite mode' });
    expect(combobox).toHaveTextContent('Shorter');
    expect(combobox).toHaveAttribute('aria-expanded', 'false');
    expect(combobox).not.toHaveAttribute('aria-controls');

    await user.click(combobox);

    const listbox = screen.getByRole('listbox', { name: 'Rewrite mode' });
    // jsdom names it either way; Chromium would name a list labelled by the combobox after its value.
    expect(listbox).not.toHaveAttribute('aria-labelledby');
    expect(combobox).toHaveAttribute('aria-expanded', 'true');
    expect(combobox).toHaveAttribute('aria-controls', listbox.id);
  });

  it('points aria-activedescendant of the focused combobox at the highlighted option', async () => {
    const user = userEvent.setup();
    render(
      <Select value="shorter" options={options} onChange={() => undefined} ariaLabel="Rewrite mode" />
    );
    const combobox = screen.getByRole('combobox', { name: 'Rewrite mode' });

    await user.click(combobox);
    expect(combobox).toHaveFocus();
    expect(activeOption()).toBe(screen.getByRole('option', { name: 'Shorter' }));

    await user.keyboard('{ArrowDown}');
    expect(activeOption()).toBe(screen.getByRole('option', { name: 'More formal' }));
    await user.keyboard('{ArrowDown}');
    expect(activeOption()).toBe(screen.getByRole('option', { name: 'Clearer' }));
    await user.keyboard('{ArrowUp}');
    expect(activeOption()).toBe(screen.getByRole('option', { name: 'More formal' }));

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(combobox).toHaveFocus();
    expect(combobox).not.toHaveAttribute('aria-activedescendant');
    expect(combobox).not.toHaveAttribute('aria-controls');
  });

  it('keeps focus on the combobox when an option is picked with Enter or the mouse', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Select value="clearer" options={options} onChange={onChange} ariaLabel="Rewrite mode" />);
    const combobox = screen.getByRole('combobox', { name: 'Rewrite mode' });

    await user.tab();
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('shorter');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(combobox).toHaveFocus();

    await user.click(combobox);
    await user.click(screen.getByRole('option', { name: 'More formal' }));
    expect(onChange).toHaveBeenLastCalledWith('formal');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(combobox).toHaveFocus();
  });
});
