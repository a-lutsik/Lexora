import { t } from '../../i18n';
import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — Statistics Page
// Streak tracker, retention metrics, accuracy percentage, cards due.
// Extended sections: words added, daily activity chart,
// accuracy by error type, hardest words.
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { ipc } from '../../lib/ipc';
import { useSettingsStore } from '../../stores/settingsStore';
import { useSettings } from '../../hooks/useSettings';
import { useWritingErrorPatterns } from '../../hooks/useWriting';
import { useProblemPhonemes, usePronunciationHistory } from '../../hooks/usePronunciation';
import { averageScore } from '../../lib/pronunciationScore';
import './stats.css';

const ACTIVITY_DAYS = 30;
const HARDEST_WORDS_LIMIT = 10;

// Accuracy color tone shared by error breakdown bars and hardest-word badges.
function accuracyTone(accuracyPercent: number): 'danger' | 'warn' | 'success' {
  if (accuracyPercent < 50) return 'danger';
  if (accuracyPercent < 80) return 'warn';
  return 'success';
}

// 'word_choice' → 'Word choice'
function formatErrorType(errorType: string): string {
  const spaced = errorType.replace(/_/g, ' ');
  return t(spaced.charAt(0).toUpperCase() + spaced.slice(1));
}

export default function StatsPage() {
  const { t: tUi } = useI18n();
  const activeLanguageId = useSettingsStore((s) => s.activeLanguageId);

  const { data: stats } = useQuery({
    queryKey: ['stats', activeLanguageId],
    queryFn: () => ipc.stats.getSummary(activeLanguageId),
  });

  const { data: wordsAdded } = useQuery({
    queryKey: ['stats', 'words-added', activeLanguageId],
    queryFn: () => ipc.stats.getWordsAddedStats(activeLanguageId),
  });

  const { data: activity } = useQuery({
    queryKey: ['stats', 'daily-activity', ACTIVITY_DAYS, activeLanguageId],
    queryFn: () => ipc.stats.getDailyActivity(ACTIVITY_DAYS, activeLanguageId),
  });

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

  return (
    <div className="stats-page animate-fade-in">
      <div className="stats-header">
        <h1 className="stats-title">{tUi("Learning Statistics")}</h1>
        <p className="text-secondary text-sm">{tUi("Track your vocabulary growth, retention rates, and daily consistency")}</p>
      </div>

      {/* Metrics Row */}
      <div className="stats-grid">
        <div className="stats-card">
          <div className="text-muted text-xs font-medium stats-card-label">{tUi("TOTAL VOCABULARY")}</div>
          <div className="stats-card-value text-primary">
            {stats?.totalWords ?? 0}
          </div>
          <div className="text-muted text-xs stats-card-hint">{tUi("Saved words")}</div>
        </div>

        <div className="stats-card">
          <div className="text-muted text-xs font-medium stats-card-label">{tUi("ACCURACY")}</div>
          <div className="stats-card-value text-success">
            {stats && stats.accuracyPercent > 0 ? `${stats.accuracyPercent}%` : '—'}
          </div>
          <div className="text-muted text-xs stats-card-hint">{tUi("Recall rate")}</div>
        </div>

        <div className="stats-card">
          <div className="text-muted text-xs font-medium stats-card-label">{tUi("MATURE WORDS")}</div>
          <div className="stats-card-value text-accent">
            {stats?.matureCount ?? 0}
          </div>
          <div className="text-muted text-xs stats-card-hint">{tUi("Interval > 21 days")}</div>
        </div>

        <div className="stats-card">
          <div className="text-muted text-xs font-medium stats-card-label">{tUi("CURRENT STREAK")}</div>
          <div className="stats-card-value text-warn">
            🔥 {stats?.streak ?? 0}{tUi("d")}</div>
          <div className="text-muted text-xs stats-card-hint">{tUi("Days in a row with a review")}</div>
        </div>
      </div>

      {/* Words Added */}
      <div className="stats-section">
        <h3 className="stats-section-title">{tUi("Words Added")}</h3>
        <div className="stats-added-grid">
          <div className="stats-added-card">
            <div className="stats-added-value text-accent">{wordsAdded?.today ?? 0}</div>
            <div className="text-muted text-xs">{tUi("Today")}</div>
          </div>
          <div className="stats-added-card">
            <div className="stats-added-value text-accent">{wordsAdded?.thisWeek ?? 0}</div>
            <div className="text-muted text-xs">{tUi("This week")}</div>
          </div>
          <div className="stats-added-card">
            <div className="stats-added-value text-accent">{wordsAdded?.thisMonth ?? 0}</div>
            <div className="text-muted text-xs">{tUi("This month")}</div>
          </div>
          <div className="stats-added-card">
            <div className="stats-added-value text-accent">{wordsAdded?.total ?? 0}</div>
            <div className="text-muted text-xs">{tUi("Total")}</div>
          </div>
        </div>
      </div>

      {/* Daily Activity Chart */}
      <div className="stats-section">
        <h3 className="stats-section-title">{tUi("Activity — Last ")}{ACTIVITY_DAYS}{tUi(" Days")}</h3>

        {totalReviewed + totalAdded === 0 ? (
          <p className="stats-empty text-muted">{tUi("No activity yet — complete a study session to see the chart.")}</p>
        ) : (
          <>
            <div
              className="stats-activity-chart"
              role="img"
              aria-label={tUi("Daily activity for the last {ACTIVITY_DAYS} days: {totalReviewed} reviews and {totalAdded} words added in total", { ACTIVITY_DAYS: ACTIVITY_DAYS, totalReviewed: totalReviewed, totalAdded: totalAdded })}
            >
              {activityDays.map((day, index) => (
                <div key={day.date} className="stats-activity-day">
                  <div className="stats-activity-bars">
                    <div
                      className="stats-activity-bar stats-activity-bar--reviewed"
                      style={{ '--bar-h': `${maxActivity > 0 ? (day.reviewed / maxActivity) * 100 : 0}%` } as React.CSSProperties}
                      title={tUi("{value1}: {value2} reviewed", { value1: day.date, value2: day.reviewed })}
                    />
                    <div
                      className="stats-activity-bar stats-activity-bar--added"
                      style={{ '--bar-h': `${maxActivity > 0 ? (day.added / maxActivity) * 100 : 0}%` } as React.CSSProperties}
                      title={tUi("{value1}: {value2} added", { value1: day.date, value2: day.added })}
                    />
                  </div>
                  <div className="stats-activity-date" aria-hidden="true">
                    {index % 2 === 0 ? day.date.slice(5) : ''}
                  </div>
                </div>
              ))}
            </div>
            <div className="stats-activity-legend">
              <span className="stats-activity-legend-item">
                <span className="stats-activity-legend-swatch stats-activity-legend-swatch--reviewed" aria-hidden="true" />{tUi("Reviewed")}</span>
              <span className="stats-activity-legend-item">
                <span className="stats-activity-legend-swatch stats-activity-legend-swatch--added" aria-hidden="true" />{tUi("Added")}</span>
            </div>

            {/* Screen-reader data table duplicating the chart */}
            <table className="sr-only">
              <caption>{tUi("Daily activity for the last ")}{ACTIVITY_DAYS}{tUi(" days")}</caption>
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
      </div>

      {/* Accuracy by Error Type */}
      <div className="stats-section">
        <h3 className="stats-section-title">{tUi("Accuracy by Error Type")}</h3>

        {!errorBreakdown || errorBreakdown.length === 0 ? (
          <p className="stats-empty text-muted">{tUi("Not enough data — errors will appear after study sessions.")}</p>
        ) : (
          <ul className="stats-error-list">
            {errorBreakdown.map((item) => (
              <li key={item.errorType} className="stats-error-row">
                <span className="stats-error-type">{formatErrorType(item.errorType)}</span>
                <div
                  className="stats-error-track"
                  role="img"
                  aria-label={tUi("{value1}: {value2} errors, {value3}% accuracy", { value1: formatErrorType(item.errorType), value2: item.count, value3: item.accuracyPercent })}
                >
                  <div
                    className={`stats-error-bar stats-error-bar--${accuracyTone(item.accuracyPercent)}`}
                    style={{ '--bar-w': `${item.accuracyPercent}%` } as React.CSSProperties}
                  />
                </div>
                <span className="stats-error-meta">
                  {item.count} · {item.accuracyPercent}%
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Hardest Words */}
      <div className="stats-section">
        <h3 className="stats-section-title">{tUi("Hardest Words")}</h3>

        {!hardestWords || hardestWords.length === 0 ? (
          <p className="stats-empty text-muted">{tUi("Not enough data — difficult words will appear after study sessions.")}</p>
        ) : (
          <ul className="stats-hardest-list">
            {hardestWords.map((word) => (
              <li key={word.entryId} className="stats-hardest-row">
                <div className="stats-hardest-word">{word.text}</div>
                <div className="stats-hardest-translation text-muted">
                  {word.translation ?? '—'}
                </div>
                <div className="stats-hardest-lapses text-muted">
                  {word.lapses} {word.lapses === 1 ? tUi("lapse") : tUi("lapses")}
                </div>
                <span className={`stats-accuracy-badge stats-accuracy-badge--${accuracyTone(word.accuracyPercent)}`}>
                  {word.accuracyPercent}%
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* SRS Mastery Distribution */}
      <div className="stats-section">
        <h3 className="stats-section-title">{tUi("SRS Mastery Stages")}</h3>

        <div className="stats-stages">
          <div className="stats-stage">
            <div className="stats-stage-name stats-stage-name--new">{tUi("New")}</div>
            <div className="text-muted text-xs">{tUi("Awaiting first session")}</div>
          </div>
          <div className="stats-stage">
            <div className="stats-stage-name stats-stage-name--learning">{tUi("Learning")}</div>
            <div className="text-muted text-xs">{tUi("Interval 1–4 days")}</div>
          </div>
          <div className="stats-stage">
            <div className="stats-stage-name stats-stage-name--review">{tUi("Review")}</div>
            <div className="text-muted text-xs">{tUi("Interval 4–21 days")}</div>
          </div>
          <div className="stats-stage">
            <div className="stats-stage-name stats-stage-name--mature">{tUi("Mature")}</div>
            <div className="text-muted text-xs">{tUi("Long term retention")}</div>
          </div>
        </div>
      </div>

      {/* Writing Error Patterns */}
      <div className="stats-section">
        <h3 className="stats-section-title">{tUi("Writing Mistake Patterns")}</h3>

        {!writingPatterns || writingPatterns.length === 0 ? (
          <p className="stats-empty text-muted">{tUi("No writing mistakes recorded yet — analyze text in Writing Assistant.")}</p>
        ) : (
          <ul className="stats-error-list">
            {writingPatterns.map((pattern) => (
              <li key={pattern.id} className="stats-error-row">
                <span className="stats-error-type">{formatErrorType(pattern.category)}</span>
                <span className="text-secondary text-xs">
                  {pattern.sampleOriginal && pattern.sampleFix
                    ? `${pattern.sampleOriginal} → ${pattern.sampleFix}`
                    : ''}
                </span>
                <span className="stats-error-meta">
                  ×{pattern.occurrenceCount}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pronunciation */}
      <div className="stats-section">
        <h3 className="stats-section-title">{tUi("Pronunciation")}</h3>
        <p className="text-muted text-sm stats-pronunciation-avg">
          {pronunciationAverage == null
            ? tUi("No speaking attempts yet.")
            : tUi("Average score across recent attempts: {pronunciationAverage}/100", { pronunciationAverage: pronunciationAverage })}
        </p>
        {!problemPhonemes || problemPhonemes.length === 0 ? (
          <p className="stats-empty text-muted">{tUi("Problem sounds will appear after scored recordings.")}</p>
        ) : (
          <ul className="stats-error-list">
            {problemPhonemes.map((pattern) => (
              <li key={pattern.id} className="stats-error-row">
                <span className="stats-error-type">/{pattern.phoneme}/</span>
                <span className="text-secondary text-xs">
                  {pattern.sampleTarget && pattern.sampleRecognized
                    ? `${pattern.sampleTarget} → ${pattern.sampleRecognized}`
                    : tUi("frequent miss")}
                </span>
                <span className="stats-error-meta">×{pattern.occurrenceCount}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
