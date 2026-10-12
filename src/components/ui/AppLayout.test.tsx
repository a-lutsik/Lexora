import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppLayout } from './AppLayout';
import { invokeMock } from '../../test/mocks';
import { renderWithQueryClient } from '../../test/render';

function renderLayout() {
  return renderWithQueryClient(
    <MemoryRouter>
      <AppLayout>
        <button type="button">first control in the page</button>
      </AppLayout>
    </MemoryRouter>,
  );
}

describe('AppLayout', () => {
  beforeEach(() => {
    invokeMock.mockReset();
    invokeMock.mockResolvedValue(0);
  });

  it('makes the skip link the first Tab stop', async () => {
    const user = userEvent.setup();
    renderLayout();

    await user.tab();

    expect(screen.getByRole('button', { name: 'Skip to main content' })).toHaveFocus();
  });

  it('moves focus to the main content so the next Tab lands in the page, not the sidebar', async () => {
    const user = userEvent.setup();
    renderLayout();

    await user.tab();
    await user.keyboard('{Enter}');

    expect(screen.getByRole('main')).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'first control in the page' })).toHaveFocus();
  });

  it('does not change the route (HashRouter) when skipping', async () => {
    const user = userEvent.setup();
    const before = window.location.hash;
    renderLayout();

    await user.tab();
    await user.keyboard(' ');

    expect(window.location.hash).toBe(before);
  });

  it('keeps visible nav text inside the accessible name (WCAG 2.5.3 Label in Name)', () => {
    renderLayout();

    for (const visible of ['Speak', 'Stats', 'Vocabulary', 'Study', 'Writing', 'Translate', 'Dialogue', 'Collections', 'Settings']) {
      expect(screen.getByRole('link', { name: new RegExp(visible, 'i') })).toBeInTheDocument();
    }
    expect(screen.getByRole('link', { name: /speak/i })).toHaveAccessibleName(/pronunciation/i);
    expect(screen.getByRole('link', { name: /stats/i })).toHaveAccessibleName(/statistics/i);
  });
});
