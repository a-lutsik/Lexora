import { setLocale } from '../../i18n';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AiUsagePanel } from './AiUsagePanel';
import { invokeMock } from '../../test/mocks';
import { renderWithQueryClient } from '../../test/render';
import type { AiUsageRow, ModelSpec } from '../../lib/types';

const CATALOG: ModelSpec[] = [
  {
    provider: 'gemini',
    id: 'gemini-3.8-live',
    label: 'Gemini 3.8 Live',
    capabilities: ['realtime_voice'],
    tier: 'free_tier',
    status: { kind: 'stable' },
    price: { unit: 'minute', usd: 0.023 },
  },
  {
    provider: 'gemini',
    id: 'gemini-3.5-flash-lite',
    label: 'Gemini 3.5 Flash-Lite',
    capabilities: ['text'],
    tier: 'free_tier',
    status: { kind: 'stable' },
    price: null,
  },
];

const ROWS: AiUsageRow[] = [
  {
    role: 'text_fast',
    provider: 'gemini',
    model: 'gemini-3.5-flash-lite',
    requests: 41,
    failures: 2,
    seconds: 0,
    units: 0,
  },
  {
    role: 'realtime_voice',
    provider: 'gemini',
    model: 'gemini-3.8-live',
    requests: 3,
    failures: 0,
    seconds: 1_200,
    units: 0,
  },
];

let rowsByDays: Record<number, AiUsageRow[]>;

beforeEach(() => {
  setLocale('ru');
  rowsByDays = { 30: ROWS, 7: [] };
  invokeMock.mockImplementation(async (cmd: string, args?: Record<string, unknown>) => {
    if (cmd === 'get_ai_usage') return rowsByDays[args?.days as number] ?? [];
    if (cmd === 'get_model_catalog') return CATALOG;
    return null;
  });
});

describe('AiUsagePanel', () => {
  it('lists usage per role with an estimate for priced units', async () => {
    renderWithQueryClient(<AiUsagePanel />);
    const table = await screen.findByRole('table', { name: 'Запросы к AI за 30 дней' });

    const fast = within(table).getByRole('row', { name: /Быстрый перевод/ });
    expect(fast).toHaveTextContent('Gemini · Gemini 3.5 Flash-Lite');
    expect(fast).toHaveTextContent('41 запрос');
    expect(fast).toHaveTextContent('2');

    const live = within(table).getByRole('row', { name: /Живой диалог/ });
    expect(live).toHaveTextContent('20 мин');
    expect(live).toHaveTextContent('0,46');

    expect(screen.getByText(/Оценка за 30 дней/)).toHaveTextContent(/0,46\s*\$ \+ текстовые запросы/);
  });

  it('switches the period and shows an empty state', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AiUsagePanel />);
    await screen.findByRole('table');

    await user.click(screen.getByRole('button', { name: '7 дней' }));
    expect(await screen.findByText('За этот период запросов к AI не было.')).toBeInTheDocument();
    await waitFor(() => expect(invokeMock).toHaveBeenCalledWith('get_ai_usage', { days: 7 }));
    expect(screen.getByRole('button', { name: '7 дней' })).toHaveAttribute('aria-pressed', 'true');
  });
});

// These existing interaction scenarios exercise the Russian UI explicitly.
afterEach(() => setLocale('en'));
