import { getLocale } from '../../../i18n';
import { useI18n } from "../../../hooks/useI18n";
// ============================================================
// LEXORA — Translation History Tab
// Lists previous text, image, document, and audio translations
// with favorites filter and quick actions.
// ============================================================

import { useState } from 'react';
import {
  useTranslationHistory,
  useToggleHistoryFavorite,
  useDeleteHistoryEntry,
  useClearTranslationHistory,
} from '../../../hooks/useTranslationHub';
import type { TranslationHubMode, TranslationHistoryDto } from '../../../lib/types';
import { Button, IconButton } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
import { copyToClipboard } from '../../../lib/utils';

type HistoryFilter = TranslationHubMode | 'all';

const MODE_ICONS: Record<string, string> = {
  text: 'notes',
  image: 'image',
  document: 'description',
  audio: 'graphic_eq',
};

function modeIcon(mode: string): string {
  return MODE_ICONS[mode] ?? 'history';
}

export function TranslationHistoryTab() {
  const { t: tUi } = useI18n();
  const [filterMode, setFilterMode] = useState<HistoryFilter>('all');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const historyQuery = useTranslationHistory(filterMode === 'all' ? null : filterMode);
  const toggleFavMutation = useToggleHistoryFavorite();
  const deleteMutation = useDeleteHistoryEntry();
  const clearMutation = useClearTranslationHistory();

  const handleCopy = async (id: number, text: string) => {
    try {
      const copiedOk = await copyToClipboard(text);
      if (!copiedOk) return;
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn('Clipboard copy failed', err);
      }
    }
  };

  const filters: ReadonlyArray<{ value: HistoryFilter; label: string; icon: string | null }> = [
    { value: 'all', label: tUi("All"), icon: null },
    { value: 'text', label: tUi(" Text"), icon: 'notes' },
    { value: 'image', label: tUi(" Image"), icon: 'image' },
    { value: 'document', label: tUi(" Document"), icon: 'description' },
    { value: 'audio', label: tUi(" Audio"), icon: 'graphic_eq' },
  ];

  return (
    <div className="translation-history animate-fade-in">
      <div className="history-toolbar">
        <div className="seg" role="group" aria-label={tUi("Filter history by mode")}>
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`seg__item${filterMode === f.value ? ' is-active' : ''}`}
              aria-pressed={filterMode === f.value}
              onClick={() => setFilterMode(f.value)}
            >
              {f.icon && <Icon name={f.icon} size={16} />}
              <span>{f.label.trim()}</span>
            </button>
          ))}
        </div>

        <span className="spacer" />
        {historyQuery.data && historyQuery.data.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => clearMutation.mutate(filterMode === 'all' ? undefined : filterMode)}
            isLoading={clearMutation.isPending}
          >
            <Icon name="delete_sweep" size={17} />
            <span>{tUi("Clear History")}</span>
          </Button>
        )}
      </div>

      {historyQuery.isLoading && (
        <p className="inline-note history-loading">{tUi("Loading translation history...")}</p>
      )}

      {historyQuery.data && historyQuery.data.length === 0 && (
        <div className="empty">
          <Icon name="history" size={28} />
          <p>{tUi("No translation history yet.")}</p>
        </div>
      )}

      {historyQuery.data && historyQuery.data.length > 0 && (
        <ul className="history-list">
          {historyQuery.data.map((item: TranslationHistoryDto) => (
            <li key={item.id} className="history-row is-hoverable">
              <Icon name={modeIcon(item.mode)} size={18} className="history-row__icon" />
              <p className="history-row__orig" dir="auto" title={item.originalText}>{item.originalText}</p>
              <p className="history-row__trans" dir="auto" title={item.translatedText}>
                {item.translatedText}
              </p>
              <span className="history-row__langs">
                {item.sourceLanguage.toUpperCase()} → {item.targetLanguage.toUpperCase()}
              </span>
              <time className="history-row__time" dateTime={new Date(item.createdAt * 1000).toISOString()}>
                {new Date(item.createdAt * 1000).toLocaleString(getLocale())}
              </time>
              <div className="history-row__actions">
                <button
                  type="button"
                  className={`btn btn--icon btn--ghost btn--sm btn-star${item.isFavorite ? ' is-fav' : ''}`}
                  onClick={() => toggleFavMutation.mutate(item.id)}
                  aria-pressed={item.isFavorite}
                  aria-label={item.isFavorite ? tUi("Remove from favorites") : tUi("Add to favorites")}
                >
                  <Icon name="star" size={17} />
                </button>
                <div className="row-actions-hover">
                  <IconButton
                    icon={<Icon name={copiedId === item.id ? 'check' : 'content_copy'} size={17} />}
                    size="sm"
                    onClick={() => void handleCopy(item.id, item.translatedText)}
                    aria-label={tUi("Copy translation")}
                  />
                  <IconButton
                    icon={<Icon name="delete" size={17} />}
                    size="sm"
                    variant="danger-ghost"
                    onClick={() => deleteMutation.mutate(item.id)}
                    aria-label={tUi("Delete history entry")}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
