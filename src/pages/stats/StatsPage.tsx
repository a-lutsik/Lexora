import { t } from '../../i18n';
import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — Statistics Page
// Streak tracker, retention metrics, accuracy percentage, cards due.
// Extended sections: words added, daily activity chart,
// accuracy by error type, hardest words.
// Layout (Lingora 1j): one stat strip, activity chart card,
// then two-column cards; hairlines instead of nested cards.
// ============================================================

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ipc } from '../../lib/ipc';
import { pluralize } from '../../lib/utils';
import { useSettingsStore } from '../../stores/settingsStore';
import { useSettings } from '../../hooks/useSettings';
import { useStatusCounts } from '../../hooks/useVocabulary';
import { useWritingErrorPatterns } from '../../hooks/useWriting';
import { useProblemPhonemes, usePronunciationHistory } from '../../hooks/usePronunciation';
import { averageScore } from '../../lib/pronunciationScore';
import './stats.css';

// Activity period options; «All time» is capped at a year of daily buckets.
const ACTIVITY_PERIODS = [30, 90, 365] as const;
type ActivityPeriod = (typeof ACTIVITY_PERIODS)[number];
const ALL_TIME_DAYS: ActivityPeriod = 365;
const DEFAULT_ACTIVITY_PERIOD: ActivityPeriod = 30;
const HARDEST_WORDS_LIMIT = 10;

// Activity chart geometry in SVG viewBox units (scaled to the card width).
const CHART_HEIGHT = 100;
const DAY_WIDTH = 10;
const BAR_WIDTH = 3.8;
const BAR_GAP = 0.6;
const AXIS_LABEL_COUNT = 5;
// Horizontal meter (accuracy by error type) in viewBox units = percent.
const METER_SCALE = 100;
const METER_HEIGHT = 6;
// «Words by status» bar: px gap between segments (no viewBox → user units are px).
const STATUS_GAP = 2;
const STATUS_ORDER = ['new', 'learning', 'review', 'mature'] as const;
type StatusKey = (typeof STATUS_ORDER)[number];

// 'word_choice' → 'Word choice'
function formatErrorType(errorType: string): string {
  const spaced = errorType.replace(/_/g, ' ');
  return t(spaced.charAt(0).toUpperCase() + spaced.slice(1));
}

// Indexes of evenly spread axis labels: first, …, last.
function axisLabelIndexes(length: number): number[] {
  if (length === 0) return [];
  if (length <= AXIS_LABEL_COUNT) return Array.from({ length }, (_, i) => i);
  const step = (length - 1) / (AXIS_LABEL_COUNT - 1);
  return Array.from({ length: AXIS_LABEL_COUNT }, (_, i) => Math.round(i * step));
}

// '2026-09-29' → '29 Sep' in the interface locale (date-only, no TZ shift).
function formatAxisDate(isoDate: string, locale: string): string {
  const parsed = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(parsed);
}

export default function StatsPage() {
  const { t: tUi, locale } = useI18n();
  const activeLanguageId = useSettingsStore((s) => s.activeLanguageId);
  const [activityDaysCount, setActivityDaysCount] = useState<ActivityPeriod>(DEFAULT_ACTIVITY_PERIOD);
  const numberFormat = new Intl.NumberFormat(locale);
  const percentFormat = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 });

  const { data: stats } = useQuery({
    queryKey: ['stats', activeLanguageId],
    queryFn: () => ipc.stats.getSummary(activeLanguageId),
  });

  const { data: wordsAdded } = useQuery({
    queryKey: ['stats', 'words-added', activeLanguageId],
    queryFn: () => ipc.stats.getWordsAddedStats(activeLanguageId),
  });

  const { data: activity } = useQuery({
    queryKey: ['stats', 'daily-activity', activityDaysCount, activeLanguageId],
    queryFn: () => ipc.stats.getDailyActivity(activityDaysCount, activeLanguageId),
  });

  const { data: statusCounts } = useStatusCounts(activeLanguageId);

  const { data: errorBreakdown } = useQuery({
    queryKey: ['stats', 'error-breakdown', activeLanguageId],
    queryFn: () => ipc.stats.getErrorBreakdown(activeLanguageId),
  });

  const { data: hardestWords } = useQuery({
    queryKey: ['stats', 'hardest-words', activeLanguageId],
    queryFn: () => ipc.stats.getHardestWords(activeLanguageId, HARDEST_WORDS_LIMIT),
  });

  const { data: settings } = useSettings();
  const currentLanguage = settings?.primaryLanguage ?? 'en';
  const { data: writingPatterns } = useWritingErrorPatterns(currentLanguage);
  const { data: problemPhonemes } = useProblemPhonemes(currentLanguage, 10);
  const { data: pronunciationHistory } = usePronunciationHistory(null, currentLanguage, 30);
  const pronunciationAverage = averageScore(
    (pronunciationHistory ?? []).map((attempt) => attempt.overallScore),
  );

  const activityDays = activity ?? [];
  const maxActivity = activityDays.reduce(
    (max, day) => Math.max(max, day.reviewed, day.added),
    0
  );
  const totalReviewed = activityDays.reduce((sum, day) => sum + day.reviewed, 0);
  const totalAdded = activityDays.reduce((sum, day) => sum + day.added, 0);
  const barHeight = (value: number) => (maxActivity > 0 ? (value / maxActivity) * CHART_HEIGHT : 0);
  const axisIndexes = axisLabelIndexes(activityDays.length);

  const statusLabels: Record<StatusKey, string> = {
    new: tUi("New"),
    learning: tUi("Learning"),
    review: tUi("Review"),
    mature: tUi("Mature"),
  };
  const statusItems = STATUS_ORDER.map((key) => ({ key, count: statusCounts?.[key] ?? 0 }));
  const statusTotal = statusItems.reduce((sum, item) => sum + item.count, 0);
  // Contiguous segments in percent of the track; separators are drawn on top.
  const statusSegments = statusItems
    .filter((item) => item.count > 0)
    .reduce<Array<{ key: StatusKey; start: number; width: number }>>((acc, item) => {
      const last = acc[acc.length - 1];
      const start = last ? last.start + last.width : 0;
      return [...acc, { key: item.key, start, width: (item.count / statusTotal) * METER_SCALE }];
    }, []);

  return (
    <div className="page stats-page animate-fade-in">
      <header className="page-header" data-tauri-drag-region>
        <div className="page-header__text" data-tauri-drag-region>
          <h1 className="page-title">{tUi("Statistics")}</h1>
          <p className="page-subtitle">{tUi("Vocabulary growth, retention and daily consistency")}</p>
        </div>
        <div className="page-actions">
          <div className="seg" role="group" aria-label={tUi("Период")}>
            {ACTIVITY_PERIODS.map((period) => (
              <button
                key={period}
                type="button"
                className={`seg__item${activityDaysCount === period ? ' is-active' : ''}`}
                aria-pressed={activityDaysCount === period}
                onClick={() => setActivityDaysCount(period)}
              >
                {period === ALL_TIME_DAYS ? tUi("All time") : pluralize(period, 'day')}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="page-body stats-body">
        {/* Metrics strip: four numbers, hairlines instead of cards */}
        <div className="stat-grid stats-metrics">
          <div className="stat stats-metric">
            <div className="stat__label">{tUi("Total vocabulary")}</div>
            <div className="stat__value stats-metric__value">{numberFormat.format(stats?.totalWords ?? 0)}</div>
            <div className="stats-metric__hint">
              {tUi("+{count} this week", { count: numberFormat.format(stats?.wordsAddedThisWeek ?? 0) })}
            </div>
          </div>

          <div className="stat stats-metric">
            <div className="stat__label">{tUi("Accuracy")}</div>
            <div className="stat__value stats-metric__value">
              {stats && stats.accuracyPercent > 0 ? percentFormat.format(stats.accuracyPercent / METER_SCALE) : '—'}
            </div>
            <div className="stats-metric__hint">{tUi("recall rate")}</div>
          </div>

          <div className="stat stats-metric">
            <div className="stat__label">{tUi("Mature words")}</div>
            <div className="stat__value stats-metric__value">{numberFormat.format(stats?.matureCount ?? 0)}</div>
            <div className="stats-metric__hint">{tUi("interval over 21 days")}</div>
          </div>

          <div className="stat stats-metric">
            <div className="stat__label">{tUi("Streak")}</div>
            <div className="stat__value stats-metric__value">{pluralize(stats?.streak ?? 0, 'day')}</div>
            {/* StatsSummary has no best streak, so the frame's «best: N days» is not shown. */}
            <div className="stats-metric__hint">{tUi("days in a row")}</div>
          </div>
        </div>

        {/* Daily Activity Chart */}
        <section className="card stats-card">
          <div className="stats-card__head">
            <h3 className="stats-section-title">{tUi("Activity")}</h3>
            {totalReviewed + totalAdded > 0 && (
              <div className="stats-legend">
                <span className="stats-legend__item">
                  <span className="stats-legend__swatch stats-legend__swatch--reviewed" aria-hidden="true" />{tUi("Reviewed")}</span>
                <span className="stats-legend__item">
                  <span className="stats-legend__swatch stats-legend__swatch--added" aria-hidden="true" />{tUi("Added")}</span>
              </div>
            )}
          </div>

          {totalReviewed + totalAdded === 0 ? (
            <p className="stats-empty">{tUi("No activity yet — complete a study session to see the chart.")}</p>
          ) : (
            <>
              <div
                className="stats-chart"
                role="img"
                aria-label={tUi("Daily activity for the last {ACTIVITY_DAYS} days: {totalReviewed} reviews and {totalAdded} words added in total", { ACTIVITY_DAYS: activityDaysCount, totalReviewed: totalReviewed, totalAdded: totalAdded })}
              >
                <svg
                  className="stats-chart__svg"
                  viewBox={`0 0 ${activityDays.length * DAY_WIDTH} ${CHART_HEIGHT}`}
                  preserveAspectRatio="none"
                  aria-hidden="true"
                  focusable="false"
                >
                  {activityDays.map((day, index) => {
                    const groupX = index * DAY_WIDTH + (DAY_WIDTH - (BAR_WIDTH * 2 + BAR_GAP)) / 2;
                    const reviewedH = barHeight(day.reviewed);
                    const addedH = barHeight(day.added);
                    return (
                      <g key={day.date}>
                        <rect
                          className="stats-chart__bar stats-chart__bar--reviewed"
                          x={groupX}
                          y={CHART_HEIGHT - reviewedH}
                          width={BAR_WIDTH}
                          height={reviewedH}
                        >
                          <title>{tUi("{value1}: {value2} reviewed", { value1: day.date, value2: day.reviewed })}</title>
                        </rect>
                        <rect
                          className="stats-chart__bar stats-chart__bar--added"
                          x={groupX + BAR_WIDTH + BAR_GAP}
                          y={CHART_HEIGHT - addedH}
                          width={BAR_WIDTH}
                          height={addedH}
                        >
                          <title>{tUi("{value1}: {value2} added", { value1: day.date, value2: day.added })}</title>
                        </rect>
                      </g>
                    );
                  })}
                </svg>
              </div>
              <div className="stats-chart__axis" aria-hidden="true">
                {axisIndexes.map((index) => {
                  const day = activityDays[index];
                  return day ? <span key={day.date}>{formatAxisDate(day.date, locale)}</span> : null;
                })}
              </div>

              {/* Screen-reader data table duplicating the chart */}
              <table className="sr-only">
                <caption>{tUi("Daily activity for the last ")}{activityDaysCount}{tUi(" days")}</caption>
                <thead>
                  <tr>
                    <th scope="col">{tUi("Date")}</th>
                    <th scope="col">{tUi("Reviewed")}</th>
                    <th scope="col">{tUi("Added")}</th>
                  </tr>
                </thead>
                <tbody>
                  {activityDays.map((day) => (
                    <tr key={day.date}>
                      <td>{day.date}</td>
                      <td>{day.reviewed}</td>
                      <td>{day.added}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </section>

        <div className="stats-columns">
          {/* Accuracy by Error Type */}
          <section className="card stats-card">
            <h3 className="stats-section-title">{tUi("Accuracy by error type")}</h3>

            {!errorBreakdown || errorBreakdown.length === 0 ? (
              <p className="stats-empty">{tUi("Not enough data — errors will appear after study sessions.")}</p>
            ) : (
              <ul className="stats-list">
                {errorBreakdown.map((item) => (
                  <li key={item.errorType} className="stats-meter-row">
                    <span className="stats-meter-row__label">{formatErrorType(item.errorType)}</span>
                    <span
                      className="stats-meter"
                      role="img"
                      aria-label={tUi("{value1}: {value2} errors, {value3}% accuracy", { value1: formatErrorType(item.errorType), value2: item.count, value3: item.accuracyPercent })}
                    >
                      <svg
                        className="stats-meter__svg"
                        viewBox={`0 0 ${METER_SCALE} ${METER_HEIGHT}`}
                        preserveAspectRatio="none"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <rect
                          className="stats-meter__fill"
                          width={Math.max(0, Math.min(METER_SCALE, item.accuracyPercent))}
                          height={METER_HEIGHT}
                        />
                      </svg>
                    </span>
                    <span className="stats-meter-row__value">
                      {item.count} · {item.accuracyPercent}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Words by status: one stacked bar + 4-column legend */}
          <section className="card stats-card stats-status">
            <h3 className="stats-section-title">{tUi("Words by status")}</h3>

            <span className="stats-status__bar" aria-hidden="true">
              <svg className="stats-status__svg" focusable="false">
                {statusSegments.map((segment) => (
                  <rect
                    key={segment.key}
                    className={`stats-status__segment stats-status__segment--${segment.key}`}
                    x={`${segment.start}%`}
                    width={`${segment.width}%`}
                    height="100%"
                  />
                ))}
                {statusSegments.slice(1).map((segment) => (
                  <rect
                    key={`gap-${segment.key}`}
                    className="stats-status__gap"
                    x={`${segment.start}%`}
                    transform={`translate(${-STATUS_GAP / 2} 0)`}
                    width={STATUS_GAP}
                    height="100%"
                  />
                ))}
              </svg>
            </span>

            <ul className="stats-list stats-status__legend">
              {statusItems.map((item) => (
                <li key={item.key} className="stats-status__item">
                  <span className="status">
                    <span className="status-dot" data-status={item.key} aria-hidden="true" />
                    {statusLabels[item.key]}
                  </span>
                  <span className="stats-status__count">{numberFormat.format(item.count)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Words Added */}
        <section className="stats-block">
          <h3 className="stats-section-title">{tUi("Words added")}</h3>
          <div className="stat-grid">
            <div className="stat">
              <div className="stat__label">{tUi("Today")}</div>
              <div className="stat__value">{wordsAdded?.today ?? 0}</div>
            </div>
            <div className="stat">
              <div className="stat__label">{tUi("This week")}</div>
              <div className="stat__value">{wordsAdded?.thisWeek ?? 0}</div>
            </div>
            <div className="stat">
              <div className="stat__label">{tUi("This month")}</div>
              <div className="stat__value">{wordsAdded?.thisMonth ?? 0}</div>
            </div>
            <div className="stat">
              <div className="stat__label">{tUi("Total")}</div>
              <div className="stat__value">{wordsAdded?.total ?? 0}</div>
            </div>
          </div>
        </section>

        {/* Hardest Words */}
        <section className="card stats-card">
          <h3 className="stats-section-title">{tUi("Hardest words")}</h3>

          {!hardestWords || hardestWords.length === 0 ? (
            <p className="stats-empty">{tUi("Not enough data — difficult words will appear after study sessions.")}</p>
          ) : (
            <ul className="stats-list stats-rows">
              {hardestWords.map((word) => (
                <li key={word.entryId} className="stats-hardest-row">
                  <span className="word stats-hardest-row__word" dir="auto">{word.text}</span>
                  <span className="translation stats-hardest-row__translation" dir="auto">
                    {word.translation ?? '—'}
                  </span>
                  <span className="stats-hardest-row__meta">
                    {word.lapses} {word.lapses === 1 ? tUi("lapse") : tUi("lapses")}
                  </span>
                  <span className="num stats-hardest-row__accuracy">
                    {word.accuracyPercent}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="stats-columns">
          {/* Writing Error Patterns */}
          <section className="card stats-card">
            <h3 className="stats-section-title">{tUi("Writing mistake patterns")}</h3>

            {!writingPatterns || writingPatterns.length === 0 ? (
              <p className="stats-empty">{tUi("No writing mistakes recorded yet — analyze text in Writing Assistant.")}</p>
            ) : (
              <ul className="stats-list stats-rows">
                {writingPatterns.map((pattern) => (
                  <li key={pattern.id} className="stats-pattern-row">
                    <span className="stats-pattern-row__label">{formatErrorType(pattern.category)}</span>
                    <span className="stats-pattern-row__sample" dir="auto">
                      {pattern.sampleOriginal && pattern.sampleFix
                        ? `${pattern.sampleOriginal} → ${pattern.sampleFix}`
                        : ''}
                    </span>
                    <span className="num">×{pattern.occurrenceCount}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Pronunciation */}
          <section className="card stats-card">
            <h3 className="stats-section-title">{tUi("Pronunciation")}</h3>
            <p className="stats-pronunciation-avg">
              {pronunciationAverage == null
                ? tUi("No speaking attempts yet.")
                : tUi("Average score across recent attempts: {pronunciationAverage}/100", { pronunciationAverage: pronunciationAverage })}
            </p>
            {!problemPhonemes || problemPhonemes.length === 0 ? (
              <p className="stats-empty">{tUi("Problem sounds will appear after scored recordings.")}</p>
            ) : (
              <ul className="stats-list stats-rows">
                {problemPhonemes.map((pattern) => (
                  <li key={pattern.id} className="stats-pattern-row">
                    <span className="ipa stats-pattern-row__label">/{pattern.phoneme}/</span>
                    <span className="stats-pattern-row__sample" dir="auto">
                      {pattern.sampleTarget && pattern.sampleRecognized
                        ? `${pattern.sampleTarget} → ${pattern.sampleRecognized}`
                        : tUi("frequent miss")}
                    </span>
                    <span className="num">×{pattern.occurrenceCount}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
