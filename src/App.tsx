import { useI18n } from './hooks/useI18n';
// ============================================================
// LEXORA — App Router
// ============================================================

import { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { listen } from '@tauri-apps/api/event';
import { AppLayout } from './components/ui/AppLayout';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { SetupWizard } from './components/setup/SetupWizard';
import { OPEN_WRITING_EVENT, peekWritingDraft } from './lib/writingText';
import { shouldSuggestSetupWizard } from './lib/setupProfile';
import { useSettings, useApiKeysStatus } from './hooks/useSettings';
import { useSyncActiveLanguage } from './hooks/useSyncActiveLanguage';

// Lazy load pages — only load what's needed
const VocabularyPage = lazy(() => import('./pages/vocabulary/VocabularyPage'));
const StudyPage = lazy(() => import('./pages/study/StudyPage'));
const WritingPage = lazy(() => import('./pages/writing/WritingPage'));
const PronunciationPage = lazy(() => import('./pages/pronunciation/PronunciationPage'));
const DialoguePage = lazy(() => import('./pages/dialogue/DialoguePage'));
const TranslatePage = lazy(() => import('./pages/translate/TranslatePage'));
const CollectionsPage = lazy(() => import('./pages/collections/CollectionsPage'));
const StatsPage = lazy(() => import('./pages/stats/StatsPage'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));

function PageLoader() {
  const { t } = useI18n();
  return (
    <div className="page-loader" aria-label={t("Loading page")}>
      <span className="animate-pulse text-muted text-sm">{t("Loading…")}</span>
    </div>
  );
}

function WritingDraftListener() {
  const navigate = useNavigate();

  useEffect(() => {
    if (peekWritingDraft()) {
      navigate('/writing');
    }

    const unlistenPromise = listen(OPEN_WRITING_EVENT, () => {
      navigate('/writing');
    });

    return () => {
      void unlistenPromise.then((unlisten) => unlisten());
    };
  }, [navigate]);

  return null;
}

function LanguageSync() {
  useSyncActiveLanguage();
  return null;
}

/**
 * Онбординг первого запуска: показывает SetupWizard, пока пользователь не
 * выбрал сценарий (setupProfile==null), AI-настройки не тронуты и нет ключей.
 * «Пропустить» в мастере сохраняет setupProfile='advanced' и скрывает его.
 */
function SetupWizardGate() {
  const [dismissed, setDismissed] = useState(false);
  const { data: settings } = useSettings();
  const { data: keysStatus } = useApiKeysStatus();

  if (dismissed || !settings || !keysStatus) {
    return null;
  }
  if (!shouldSuggestSetupWizard(settings, keysStatus)) {
    return null;
  }

  return (
    <SetupWizard
      settings={settings}
      keysStatus={keysStatus}
      onClose={() => setDismissed(true)}
    />
  );
}

/**
 * Страницы под собственным ErrorBoundary: сбой одной страницы не роняет сайдбар,
 * а переход на другой маршрут сбрасывает ошибку.
 */
function RoutedPages() {
  const { pathname } = useLocation();

  return (
    <ErrorBoundary resetKey={pathname}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route index element={<Navigate to="/vocabulary" replace />} />
          <Route path="/vocabulary" element={<VocabularyPage />} />
          <Route path="/vocabulary/:id" element={<VocabularyPage />} />
          <Route path="/study" element={<StudyPage />} />
          <Route path="/writing" element={<WritingPage />} />
          <Route path="/pronunciation" element={<PronunciationPage />} />
          <Route path="/dialogue" element={<DialoguePage />} />
          <Route path="/translate" element={<TranslatePage />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/vocabulary" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <>
      <AppLayout>
        <LanguageSync />
        <WritingDraftListener />
        <RoutedPages />
      </AppLayout>
      <SetupWizardGate />
    </>
  );
}
