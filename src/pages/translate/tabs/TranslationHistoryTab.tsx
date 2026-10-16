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
import { Button } from '../../../components/ui/Button';
import { copyToClipboard } from '../../../lib/utils';
import { IconCheck, IconCopy, IconStar } from '../../../components/ui/LuminousIcons';
import {
  IconTabAudio,
  IconTabDocument,
  IconTabHistory,
  IconTabImage,
  IconTabText,
} from '../components/TranslateIcons';

export function TranslationHistoryTab() {
  const { t: tUi } = useI18n();
  const [filterMode, setFilterMode] = useState<TranslationHubMode | 'all'>('all');
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

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'text':
        return <IconTabText size={16} />;
      case 'image':
        return <IconTabImage size={16} />;
      case 'document':
        return <IconTabDocument size={16} />;
      case 'audio':
        return <IconTabAudio size={16} />;
      default:
        return <IconTabHistory size={16} />;
    }
  };

  return (
    <div className="translation-history-tab animate-fade-in">
      <div className="history-toolbar">
        <div className="history-filters" role="group" aria-label={tUi("Filter history by mode")}>
          <button
            type="button"
            className={`btn-toggle ${filterMode === 'all' ? 'is-active' : ''}`}
            onClick={() => setFilterMode('all')}
          >{tUi("All")}</button>
          <button
            type="button"
            className={`btn-toggle ${filterMode === 'text' ? 'is-active' : ''}`}
            onClick={() => setFilterMode('text')}
          >
            <IconTabText size={14} />{tUi(" Text")}</button>
          <button
            type="button"
            className={`btn-toggle ${filterMode === 'image' ? 'is-active' : ''}`}
            onClick={() => setFilterMode('image')}
          >
            <IconTabImage size={14} />{tUi(" Image")}</button>
          <button
            type="button"
            className={`btn-toggle ${filterMode === 'document' ? 'is-active' : ''}`}
            onClick={() => setFilterMode('document')}
          >
            <IconTabDocument size={14} />{tUi(" Document")}</button>
          <button
            type="button"
            className={`btn-toggle ${filterMode === 'audio' ? 'is-active' : ''}`}
            onClick={() => setFilterMode('audio')}
          >
            <IconTabAudio size={14} />{tUi(" Audio")}</button>
        </div>

        {historyQuery.data && historyQuery.data.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => clearMutation.mutate(filterMode === 'all' ? undefined : filterMode)}
            isLoading={clearMutation.isPending}
          >{tUi("Clear History")}</Button>
        )}
      </div>

      {historyQuery.isLoading && (
        <div className="text-secondary text-sm p-6">{tUi("Loading translation history...")}</div>
      )}

      {historyQuery.data && historyQuery.data.length === 0 && (
        <div className="empty-history text-center text-muted p-12">
          <IconTabHistory size={32} />
          <p>{tUi("No translation history yet.")}</p>
        </div>
      )}

      {historyQuery.data && historyQuery.data.length > 0 && (
        <div className="history-list">
          {historyQuery.data.map((item: TranslationHistoryDto) => (
            <div key={item.id} className="history-item-card">
              <div className="history-item-header">
                <div className="history-item-meta">
                  <span className="history-item-icon">{getModeIcon(item.mode)}</span>
                  <span className="text-xs uppercase text-secondary font-semibold">
                    {item.sourceLanguage} → {item.targetLanguage}
                  </span>
                  <span className="text-xs text-muted">
                    {new Date(item.createdAt * 1000).toLocaleString(getLocale())}
                  </span>
                </div>

                <div className="history-item-actions">
                  <button
                    type="button"
                    className={`btn-star ${item.isFavorite ? 'is-fav' : ''}`}
                    onClick={() => toggleFavMutation.mutate(item.id)}
                    aria-label={item.isFavorite ? tUi("Remove from favorites") : tUi("Add to favorites")}
                  >
                    <IconStar filled={item.isFavorite} />
                  </button>
                  <button
                    type="button"
                    className="btn-copy text-xs"
                    onClick={() => handleCopy(item.id, item.translatedText)}
                    aria-label={tUi("Copy translation")}
                  >
                    {copiedId === item.id ? <IconCheck size={14} /> : <IconCopy size={14} />}
                    {copiedId === item.id ? tUi("Copied") : tUi("Copy")}
                  </button>
                  <button
                    type="button"
                    className="btn-delete text-xs text-muted hover:text-danger"
                    onClick={() => deleteMutation.mutate(item.id)}
                    aria-label={tUi("Delete history entry")}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="history-item-body">
                <p className="history-orig text-secondary text-sm">{item.originalText}</p>
                <p className="history-trans text-primary text-sm font-medium">
                  {item.translatedText}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
