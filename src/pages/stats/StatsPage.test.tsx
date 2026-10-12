import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import StatsPage from './StatsPage';
import { invokeMock } from '../../test/mocks';
import { renderWithQueryClient } from '../../test/render';
import type { DailyActivity, StatsSummary } from '../../lib/ipc';

const summary: StatsSummary = {
  totalWords: 42,
  dueToday: 5,
  streak: 4,
  accuracyPercent: 87.5,
  wordsAddedThisWeek: 7,
  matureCount: 12,
};

function zeroDays(count: number): DailyActivity[] {
  return Array.from({ length: count }, (_, i) => ({
    date: `2026-09-${String(i + 1).padStart(2, '0')}`,
    reviewed: 0,
    added: 0,
    accuracy: 0,
  }));
}

function mockStats(stats: StatsSummary, activity: DailyActivity[]) {
  invokeMock.mockImplementation((cmd: string) => {
    if (cmd === 'get_stats_summary') return Promise.resolve(stats);
    if (cmd === 'get_daily_activity') return Promise.resolve(activity);
    if (cmd === 'get_words_added_stats') {
      return Promise.resolve({ today: 0, thisWeek: 0, thisMonth: 0, total: 0 });
    }
    if (['get_error_breakdown', 'get_hardest_words'].includes(cmd)) return Promise.resolve([]);
    return Promise.resolve(null);
  });
}

describe('StatsPage', () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  it('shows the real streak and accuracy from the backend', async () => {
    mockStats(summary, zeroDays(30));
    renderWithQueryClient(<StatsPage />);

    expect(await screen.findByText('🔥 4d')).toBeInTheDocument();
    expect(screen.getByText('87.5%')).toBeInTheDocument();
  });

  it('does not invent a streak or perfect accuracy for a brand-new user', async () => {
    mockStats({ ...summary, streak: 0, accuracyPercent: 0, totalWords: 0 }, zeroDays(30));
    renderWithQueryClient(<StatsPage />);

    expect(await screen.findByText('🔥 0d')).toBeInTheDocument();
    expect(screen.queryByText('100%')).not.toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('shows the empty state when every day of the window is zero', async () => {
    mockStats(summary, zeroDays(30));
    renderWithQueryClient(<StatsPage />);

    expect(await screen.findByText(/No activity yet/i)).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /Daily activity/i })).not.toBeInTheDocument();
  });

  it('renders the activity chart with totals when there is activity', async () => {
    const days = zeroDays(30);
    days[28] = { date: '2026-09-29', reviewed: 6, added: 2, accuracy: 83.3 };
    days[29] = { date: '2026-09-30', reviewed: 4, added: 0, accuracy: 100 };
    mockStats(summary, days);
    renderWithQueryClient(<StatsPage />);

    const chart = await screen.findByRole('img', { name: /Daily activity/i });
    expect(chart).toHaveAccessibleName(/10 reviews and 2 words added/);
  });

  it('asks the backend for the active language’s activity', async () => {
    mockStats(summary, zeroDays(30));
    renderWithQueryClient(<StatsPage />);

    await waitFor(() => {
      const call = invokeMock.mock.calls.find(([cmd]) => cmd === 'get_daily_activity');
      expect(call?.[1]).toEqual({ days: 30, languageId: 1 });
    });
  });
});
