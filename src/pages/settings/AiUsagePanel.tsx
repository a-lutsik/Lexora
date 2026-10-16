import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — AiUsagePanel (Settings → «Расходы AI»)
// Local counters of AI calls per role and model, with a cost
// estimate where the unit is counted exactly (images, live minutes).
// ============================================================

import { useState } from 'react';
import { useAiUsage, useModelCatalog } from '../../hooks/useModelRoutes';
import {
  MODEL_ROLES,
  ROLE_LABELS,
  estimateUsageCost,
  formatUsd,
  targetLabel,
  usageAmount,
} from '../../lib/modelRouting';
import { formatIpcError } from '../../lib/utils';
import './ai-models.css';

const PERIODS = [7, 30] as const;

function roleLabel(role: string): string {
  const known = MODEL_ROLES.find((r) => r === role);
  return known ? ROLE_LABELS[known] : role;
}

export function AiUsagePanel() {
  const { t: tUi, locale } = useI18n();
  const [days, setDays] = useState<number>(30);
  const { data: rows = [], isLoading, error } = useAiUsage(days);
  const { data: catalog = [] } = useModelCatalog();
  const estimate = estimateUsageCost(rows, catalog);

  return (
    <section id="settings-ai-usage" className="settings-section ai-usage" aria-labelledby="ai-usage-title">
      <div className="ai-models-head">
        <h2 id="ai-usage-title" className="ai-models-title">{tUi("Расходы AI")}</h2>
        <div className="ai-usage-periods" role="group" aria-label={tUi("Период")}>
          {PERIODS.map((period) => (
            <button
              key={period}
              type="button"
              className={`ai-usage-period${days === period ? ' is-active' : ''}`}
              aria-pressed={days === period}
              onClick={() => setDays(period)}
            >
              {period}{tUi(" дней")}</button>
          ))}
        </div>
      </div>

      {isLoading && <p className="text-muted text-sm">{tUi("Загружаем счётчики…")}</p>}
      {error && (
        <p className="ai-notice ai-notice--error" role="alert">
          {formatIpcError(error, tUi("Не удалось загрузить счётчики"))}
        </p>
      )}
      {!isLoading && !error && rows.length === 0 && (
        <p className="text-muted text-sm">{tUi("За этот период запросов к AI не было.")}</p>
      )}

      {rows.length > 0 && (
        <div className="ai-usage-scroll">
          <table className="ai-usage-table">
            <caption className="sr-only">{tUi("Запросы к AI за ")}{days}{tUi(" дней")}</caption>
            <thead>
              <tr>
                <th scope="col">{tUi("Роль")}</th>
                <th scope="col">{tUi("Модель")}</th>
                <th scope="col">{tUi("Объём")}</th>
                <th scope="col">{tUi("Ошибки")}</th>
                <th scope="col">{tUi("Оценка")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const cost = estimate.perRow[index];
                return (
                  <tr key={`${row.role}:${row.provider}:${row.model}`}>
                    <td>{tUi(roleLabel(row.role))}</td>
                    <td>{targetLabel(catalog, row)}</td>
                    <td>{usageAmount(row, locale)}</td>
                    <td>{row.failures > 0 ? row.failures : '—'}</td>
                    <td>{cost == null ? '—' : formatUsd(cost)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {rows.length > 0 && (
        <p className="ai-usage-total" aria-live="polite">{tUi("Оценка за ")}{days}{tUi(" дней: ")}<strong>{formatUsd(estimate.total)}</strong>
          {estimate.partial && tUi(" + текстовые запросы по тарифу провайдера")}
        </p>
      )}

      <p className="settings-field-hint text-muted text-xs">{tUi("Счётчики хранятся только на этом Mac. Оценка — по опубликованным ценам платного тарифа для AI-картинок и минут живого голоса. Текст, фото и голос в пределах бесплатного тарифа Gemini не оплачиваются. Озвучка кешируется и здесь не учитывается.")}</p>
    </section>
  );
}
