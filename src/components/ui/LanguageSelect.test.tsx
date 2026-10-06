import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LanguageSelect } from './LanguageSelect';

const options = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Russian (Русский)' },
  { value: 'hy', label: 'Armenian (Հայերեն)' },
];

/** Option referenced by aria-activedescendant of the focused element. */
function activeOption(): HTMLElement | null {
  const id = document.activeElement?.getAttribute('aria-activedescendant');
  return id ? document.getElementById(id) : null;
}

describe('LanguageSelect', () => {
  it('shows a compact Auto trigger instead of Auto-detect', () => {
    render(
      <LanguageSelect
        compact
        value="auto"
        options={options}
        leadingOptions={[{ value: 'auto', label: 'Auto-detect' }]}
        onChange={() => undefined}
        ariaLabel="Source language"
      />
    );

    expect(screen.getByRole('combobox', { name: 'Source language' })).toHaveTextContent('Auto');
    expect(screen.getByRole('combobox', { name: 'Source language' })).not.toHaveTextContent(
      'Auto-detect'
    );
  });

  it('exposes the trigger as a select-only combobox that controls the listbox', async () => {
    const user = userEvent.setup();
    render(
      <LanguageSelect
        value="en"
        options={options}
        onChange={() => undefined}
        ariaLabel="Source language"
      />
    );

    const combobox = screen.getByRole('combobox', { name: 'Source language' });
    expect(combobox).toHaveTextContent('English');
    expect(combobox).toHaveAttribute('aria-expanded', 'false');

    await user.click(combobox);

    const listbox = screen.getByRole('listbox', { name: 'Source language' });
    expect(combobox).toHaveAttribute('aria-expanded', 'true');
    expect(combobox).toHaveAttribute('aria-controls', listbox.id);
  });

  it('points aria-activedescendant at the highlighted option', async () => {
    const user = userEvent.setup();
    render(
      <LanguageSelect
        value="en"
        options={options}
        onChange={() => undefined}
        ariaLabel="Source language"
      />
    );

    await user.click(screen.getByRole('combobox', { name: 'Source language' }));
    const search = screen.getByRole('searchbox', { name: 'Search languages' });
    await waitFor(() => expect(search).toHaveFocus());

    expect(activeOption()).toBe(screen.getByRole('option', { name: /English/ }));
    await user.keyboard('{ArrowDown}');
    expect(activeOption()).toBe(screen.getByRole('option', { name: /Russian/ }));
    await user.type(search, 'arm');
    expect(activeOption()).toBe(screen.getByRole('option', { name: /Armenian/ }));
  });

  it('returns focus to the combobox after Enter picks an option or Escape closes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <LanguageSelect
        value="en"
        options={options}
        onChange={onChange}
        ariaLabel="Source language"
      />
    );
    const combobox = screen.getByRole('combobox', { name: 'Source language' });

    await user.click(combobox);
    await waitFor(() =>
      expect(screen.getByRole('searchbox', { name: 'Search languages' })).toHaveFocus()
    );
    await user.keyboard('{ArrowDown}{Enter}');

    expect(onChange).toHaveBeenCalledWith('ru');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(combobox).toHaveFocus();

    await user.keyboard('{Enter}');
    await waitFor(() =>
      expect(screen.getByRole('searchbox', { name: 'Search languages' })).toHaveFocus()
    );
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(combobox).toHaveFocus();
  });

  it('keeps Escape inside an open menu from bubbling', async () => {
    const user = userEvent.setup();
    const onWindowEscape = vi.fn();
    window.addEventListener('keydown', onWindowEscape);

    render(
      <LanguageSelect
        value="en"
        options={options}
        onChange={() => undefined}
        ariaLabel="Source language"
      />
    );

    await user.click(screen.getByRole('combobox', { name: 'Source language' }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole('searchbox', { name: 'Search languages' }), {
      key: 'Escape',
    });

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onWindowEscape).not.toHaveBeenCalled();

    window.removeEventListener('keydown', onWindowEscape);
  });

  it('selects an option on mousedown', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <LanguageSelect
        value="en"
        options={options}
        onChange={onChange}
        ariaLabel="Source language"
      />
    );

    await user.click(screen.getByRole('combobox', { name: 'Source language' }));
    fireEvent.mouseDown(screen.getByRole('option', { name: /Armenian/ }));
    expect(onChange).toHaveBeenCalledWith('hy');
  });
});
