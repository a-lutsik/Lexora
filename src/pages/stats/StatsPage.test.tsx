import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

function mockStats(stats: StatsSummary, activity: DailyActivity[], statusCounts: unknown = null) {
  invokeMock.mockImplementation((cmd: string) => {
    if (cmd === 'get_stats_summary') return Promise.resolve(stats);
    if (cmd === 'count_vocabulary_by_status') return Promise.resolve(statusCounts);
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

    expect(await screen.findByText('4 days')).toBeInTheDocument();
    expect(screen.getByText('87.5%')).toBeInTheDocument();
  });

  it('does not invent a streak or perfect accuracy for a brand-new user', async () => {
    mockStats({ ...summary, streak: 0, accuracyPercent: 0, totalWords: 0 }, zeroDays(30));
    renderWithQueryClient(<StatsPage />);

    expect(await screen.findByText('0 days')).toBeInTheDocument();
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

  it('titles the page Statistics and makes the header a window drag region', async () => {
    mockStats(summary, zeroDays(30));
    renderWithQueryClient(<StatsPage />);

    const heading = await screen.findByRole('heading', { level: 1, name: 'Statistics' });
    expect(screen.getByText('Vocabulary growth, retention and daily consistency')).toBeInTheDocument();
    expect(heading.closest('header')).toHaveAttribute('data-tauri-drag-region');
  });

  it('switches the activity period between 30 days, 90 days and all time', async () => {
    const user = userEvent.setup();
    mockStats(summary, zeroDays(30));
    renderWithQueryClient(<StatsPage />);

    const thirty = await screen.findByRole('button', { name: '30 days' });
    expect(thirty).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: '90 days' }));
    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('get_daily_activity', { days: 90, languageId: 1 });
    });
    expect(screen.getByRole('button', { name: '90 days' })).toHaveAttribute('aria-pressed', 'true');
    expect(thirty).toHaveAttribute('aria-pressed', 'false');

    await user.click(screen.getByRole('button', { name: 'All time' }));
    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('get_daily_activity', { days: 365, languageId: 1 });
    });
    expect(screen.getByRole('heading', { name: 'Activity' })).toBeInTheDocument();
  });

  it('formats the KPI strip with grouped numbers and frame sub-lines', async () => {
    mockStats({ ...summary, totalWords: 5282, accuracyPercent: 86, matureCount: 64, streak: 12, wordsAddedThisWeek: 21 }, zeroDays(30));
    renderWithQueryClient(<StatsPage />);

    expect(await screen.findByText('5,282')).toBeInTheDocument();
    expect(screen.getByText('+21 this week')).toBeInTheDocument();
    expect(screen.getByText('86%')).toBeInTheDocument();
    expect(screen.getByText('recall rate')).toBeInTheDocument();
    expect(screen.getByText('64')).toBeInTheDocument();
    expect(screen.getByText('interval over 21 days')).toBeInTheDocument();
    expect(screen.getByText('12 days')).toBeInTheDocument();
    // The summary DTO has no best streak, so the frame's «best: N days» falls back.
    expect(screen.getByText('days in a row')).toBeInTheDocument();
  });

  it('shows words by status with a count per SRS status', async () => {
    mockStats(summary, zeroDays(30), { new: 112, learning: 48, review: 24, mature: 64, suspended: 3 });
    renderWithQueryClient(<StatsPage />);

    const section = (await screen.findByRole('heading', { name: 'Words by status' })).closest('section');
    expect(section).not.toBeNull();
    const legend = within(section as HTMLElement);
    for (const [label, count] of [['New', '112'], ['Learning', '48'], ['Review', '24'], ['Mature', '64']] as const) {
      const item = legend.getByText(label).closest('li');
      expect(item).not.toBeNull();
      await waitFor(() => expect(within(item as HTMLElement).getByText(count)).toBeInTheDocument());
    }
    expect(screen.queryByRole('heading', { name: /SRS Mastery/i })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Accuracy by error type' })).toBeInTheDocument();
  });
});
