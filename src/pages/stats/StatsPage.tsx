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
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export default function StatsPage() {
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
    queryKey: ['stats', 'daily-activity', ACTIVITY_DAYS],
    queryFn: () => ipc.stats.getDailyActivity(ACTIVITY_DAYS),
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
        <h1 className="stats-title">Learning Statistics</h1>
        <p className="text-secondary text-sm">Track your vocabulary growth, retention rates, and daily consistency</p>
      </div>

      {/* Metrics Row */}
      <div className="stats-grid">
        <div className="stats-card">
          <div className="text-muted text-xs font-medium stats-card-label">TOTAL VOCABULARY</div>
          <div className="stats-card-value text-primary">
            {stats?.totalWords ?? 0}
          </div>
          <div className="text-muted text-xs stats-card-hint">Saved words</div>
        </div>

        <div className="stats-card">
          <div className="text-muted text-xs font-medium stats-card-label">ACCURACY</div>
          <div className="stats-card-value text-success">
            {stats?.accuracyPercent ? `${stats.accuracyPercent}%` : '100%'}
          </div>
          <div className="text-muted text-xs stats-card-hint">Recall rate</div>
        </div>

        <div className="stats-card">
          <div className="text-muted text-xs font-medium stats-card-label">MATURE WORDS</div>
          <div className="stats-card-value text-accent">
            {stats?.matureCount ?? 0}
          </div>
          <div className="text-muted text-xs stats-card-hint">Interval &gt; 21 days</div>
        </div>

        <div className="stats-card">
          <div className="text-muted text-xs font-medium stats-card-label">CURRENT STREAK</div>
          <div className="stats-card-value text-warn">
            🔥 {stats?.streak ?? 1}d
          </div>
          <div className="text-muted text-xs stats-card-hint">Daily study goal met</div>
        </div>
      </div>

      {/* Words Added */}
      <div className="stats-section">
        <h3 className="stats-section-title">Words Added</h3>
        <div className="stats-added-grid">
          <div className="stats-added-card">
            <div className="stats-added-value text-accent">{wordsAdded?.today ?? 0}</div>
            <div className="text-muted text-xs">Today</div>
          </div>
          <div className="stats-added-card">
            <div className="stats-added-value text-accent">{wordsAdded?.thisWeek ?? 0}</div>
            <div className="text-muted text-xs">This week</div>
          </div>
          <div className="stats-added-card">
            <div className="stats-added-value text-accent">{wordsAdded?.thisMonth ?? 0}</div>
            <div className="text-muted text-xs">This month</div>
          </div>
          <div className="stats-added-card">
            <div className="stats-added-value text-accent">{wordsAdded?.total ?? 0}</div>
            <div className="text-muted text-xs">Total</div>
          </div>
        </div>
      </div>

      {/* Daily Activity Chart */}
      <div className="stats-section">
        <h3 className="stats-section-title">Activity — Last {ACTIVITY_DAYS} Days</h3>

        {activityDays.length === 0 ? (
          <p className="stats-empty text-muted">No activity yet — complete a study session to see the chart.</p>
        ) : (
          <>
            <div
              className="stats-activity-chart"
              role="img"
              aria-label={`Daily activity for the last ${ACTIVITY_DAYS} days: ${totalReviewed} reviews and ${totalAdded} words added in total`}
            >
              {activityDays.map((day, index) => (
                <div key={day.date} className="stats-activity-day">
                  <div className="stats-activity-bars">
                    <div
                      className="stats-activity-bar stats-activity-bar--reviewed"
                      style={{ '--bar-h': `${maxActivity > 0 ? (day.reviewed / maxActivity) * 100 : 0}%` } as React.CSSProperties}
                      title={`${day.date}: ${day.reviewed} reviewed`}
                    />
                    <div
                      className="stats-activity-bar stats-activity-bar--added"
                      style={{ '--bar-h': `${maxActivity > 0 ? (day.added / maxActivity) * 100 : 0}%` } as React.CSSProperties}
                      title={`${day.date}: ${day.added} added`}
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
                <span className="stats-activity-legend-swatch stats-activity-legend-swatch--reviewed" aria-hidden="true" />
                Reviewed
              </span>
              <span className="stats-activity-legend-item">
                <span className="stats-activity-legend-swatch stats-activity-legend-swatch--added" aria-hidden="true" />
                Added
              </span>
            </div>

            {/* Screen-reader data table duplicating the chart */}
            <table className="sr-only">
              <caption>Daily activity for the last {ACTIVITY_DAYS} days</caption>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Reviewed</th>
                  <th scope="col">Added</th>
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
        <h3 className="stats-section-title">Accuracy by Error Type</h3>

        {!errorBreakdown || errorBreakdown.length === 0 ? (
          <p className="stats-empty text-muted">Not enough data — errors will appear after study sessions.</p>
        ) : (
          <ul className="stats-error-list">
            {errorBreakdown.map((item) => (
              <li key={item.errorType} className="stats-error-row">
                <span className="stats-error-type">{formatErrorType(item.errorType)}</span>
                <div
                  className="stats-error-track"
                  role="img"
                  aria-label={`${formatErrorType(item.errorType)}: ${item.count} errors, ${item.accuracyPercent}% accuracy`}
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
        <h3 className="stats-section-title">Hardest Words</h3>

        {!hardestWords || hardestWords.length === 0 ? (
          <p className="stats-empty text-muted">Not enough data — difficult words will appear after study sessions.</p>
        ) : (
          <ul className="stats-hardest-list">
            {hardestWords.map((word) => (
              <li key={word.entryId} className="stats-hardest-row">
                <div className="stats-hardest-word">{word.text}</div>
                <div className="stats-hardest-translation text-muted">
                  {word.translation ?? '—'}
                </div>
                <div className="stats-hardest-lapses text-muted">
                  {word.lapses} {word.lapses === 1 ? 'lapse' : 'lapses'}
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
        <h3 className="stats-section-title">
          SRS Mastery Stages
        </h3>

        <div className="stats-stages">
          <div className="stats-stage">
            <div className="stats-stage-name stats-stage-name--new">New</div>
            <div className="text-muted text-xs">Awaiting first session</div>
          </div>
          <div className="stats-stage">
            <div className="stats-stage-name stats-stage-name--learning">Learning</div>
            <div className="text-muted text-xs">Interval 1–4 days</div>
          </div>
          <div className="stats-stage">
            <div className="stats-stage-name stats-stage-name--review">Review</div>
            <div className="text-muted text-xs">Interval 4–21 days</div>
          </div>
          <div className="stats-stage">
            <div className="stats-stage-name stats-stage-name--mature">Mature</div>
            <div className="text-muted text-xs">Long term retention</div>
          </div>
        </div>
      </div>

      {/* Writing Error Patterns */}
      <div className="stats-section">
        <h3 className="stats-section-title">Writing Mistake Patterns</h3>

        {!writingPatterns || writingPatterns.length === 0 ? (
          <p className="stats-empty text-muted">No writing mistakes recorded yet — analyze text in Writing Assistant.</p>
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
        <h3 className="stats-section-title">Pronunciation</h3>
        <p className="text-muted text-sm stats-pronunciation-avg">
          {pronunciationAverage == null
            ? 'No speaking attempts yet.'
            : `Average score across recent attempts: ${pronunciationAverage}/100`}
        </p>
        {!problemPhonemes || problemPhonemes.length === 0 ? (
          <p className="stats-empty text-muted">Problem sounds will appear after scored recordings.</p>
        ) : (
          <ul className="stats-error-list">
            {problemPhonemes.map((pattern) => (
              <li key={pattern.id} className="stats-error-row">
                <span className="stats-error-type">/{pattern.phoneme}/</span>
                <span className="text-secondary text-xs">
                  {pattern.sampleTarget && pattern.sampleRecognized
                    ? `${pattern.sampleTarget} → ${pattern.sampleRecognized}`
                    : 'frequent miss'}
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
