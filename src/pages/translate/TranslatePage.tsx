import { useI18n } from "../../hooks/useI18n";
// ============================================================
// LEXORA — Multimodal Translation Hub Page
// Text, Image/OCR, Document, Speech and Live interpreting.
// Lingora anatomy: page header · underlined tabs · language bar.
// ============================================================

import { TextTranslateTab } from './tabs/TextTranslateTab';
import { ImageTranslateTab } from './tabs/ImageTranslateTab';
import { DocumentTranslateTab } from './tabs/DocumentTranslateTab';
import { AudioTranslateTab } from './tabs/AudioTranslateTab';
import { LiveInterpreterTab } from './tabs/LiveInterpreterTab';
import { TranslationHistoryTab } from './tabs/TranslationHistoryTab';
import { Icon } from '../../components/ui/Icon';
import { IconButton } from '../../components/ui/Button';
import { LanguageSelect } from '../../components/ui/LanguageSelect';
import { TranslationDomainSelect } from '../../components/domain/TranslationDomainSelect';
import { useSessionLanguagePair } from '../../hooks/useSessionLanguagePair';
import { useSessionLexicalDomain } from '../../hooks/useSessionLexicalDomain';
import { useLanguageOptions } from '../../hooks/useLanguages';
import { useState } from 'react';
import './translate.css';

type TabMode = 'text' | 'image' | 'document' | 'audio' | 'interpreter' | 'history';

const TABS: ReadonlyArray<{ mode: TabMode; icon: string; label: string }> = [
  { mode: 'text', icon: 'notes', label: 'Text' },
  { mode: 'image', icon: 'image', label: 'Image & Photo' },
  { mode: 'document', icon: 'description', label: 'Document' },
  { mode: 'audio', icon: 'graphic_eq', label: 'Speech & Audio' },
  { mode: 'interpreter', icon: 'interpreter_mode', label: 'Live Interpreter' },
  { mode: 'history', icon: 'history', label: 'History' },
];

export function TranslatePage() {
  const { t: tUi } = useI18n();
  const [activeTab, setActiveTab] = useState<TabMode>('text');
  const { sourceLang, targetLang, setSourceLang, setTargetLang, swap } = useSessionLanguagePair({
    allowAutoSource: true,
  });
  const { lexicalDomain, setLexicalDomain } = useSessionLexicalDomain('auto');
  const [detectedDomain, setDetectedDomain] = useState<string | null>(null);
  const langOptions = useLanguageOptions([sourceLang, targetLang]);

  const handleSwap = (detectedSource?: string) => {
    swap(detectedSource);
  };

  const handleDomainChange = (next: typeof lexicalDomain) => {
    setLexicalDomain(next);
    setDetectedDomain(null);
  };

  const handleTabChange = (tab: TabMode) => {
    setActiveTab(tab);
    setDetectedDomain(null);
  };

  return (
    <div className="page translate-page animate-fade-in">
      <header className="page-header">
        <div className="page-header__text">
          <h1 className="page-title">{tUi("Translate")}</h1>
          <p className="page-subtitle">{tUi("Text, photos, documents, speech and live interpreting")}</p>
        </div>
      </header>

      <div className="translate-tabs" role="tablist" aria-label={tUi("Translation Modes")}>
        {TABS.map((tab) => (
          <button
            key={tab.mode}
            type="button"
            role="tab"
            id={`tab-${tab.mode}`}
            aria-selected={activeTab === tab.mode}
            aria-controls="translate-tabpanel"
            className={`translate-tab${activeTab === tab.mode ? ' is-active' : ''}`}
            onClick={() => handleTabChange(tab.mode)}
          >
            <Icon name={tab.icon} size={17} />
            <span>{tUi(tab.label)}</span>
          </button>
        ))}
      </div>

      <div className="translate-body">
        {activeTab !== 'history' && (
          <div className="translate-lang-bar" role="group" aria-label={tUi("Language selection")}>
            <LanguageSelect
              className="translate-lang-bar__source"
              value={sourceLang}
              options={langOptions}
              leadingOptions={[{ value: 'auto', label: tUi("Auto-detect") }]}
              onChange={setSourceLang}
              ariaLabel={tUi("Source language")}
            />

            <IconButton
              icon={<Icon name="swap_horiz" size={17} />}
              onClick={() => handleSwap()}
              aria-label={tUi("Swap source and target languages")}
            />

            <LanguageSelect
              className="translate-lang-bar__target"
              value={targetLang}
              options={langOptions}
              onChange={setTargetLang}
              ariaLabel={tUi("Target language")}
            />

            <span className="spacer" />
            <span className="translate-lang-bar__label" aria-hidden="true">{tUi("Domain")}</span>
            <TranslationDomainSelect
              value={lexicalDomain}
              onChange={handleDomainChange}
              detectedDomain={detectedDomain}
              id="hub-lexical-domain"
              className="translate-lang-bar__domain"
            />
          </div>
        )}

        <div
          className="translate-panel"
          role="tabpanel"
          id="translate-tabpanel"
          aria-labelledby={`tab-${activeTab}`}
        >
          {activeTab === 'text' && (
            <TextTranslateTab
              sourceLang={sourceLang}
              targetLang={targetLang}
              lexicalDomain={lexicalDomain}
              onDetectedDomain={setDetectedDomain}
              onSwapLanguages={handleSwap}
            />
          )}
          {activeTab === 'image' && (
            <ImageTranslateTab
              sourceLang={sourceLang}
              targetLang={targetLang}
              lexicalDomain={lexicalDomain}
              onDetectedDomain={setDetectedDomain}
            />
          )}
          {activeTab === 'document' && (
            <DocumentTranslateTab
              sourceLang={sourceLang}
              targetLang={targetLang}
              lexicalDomain={lexicalDomain}
              onDetectedDomain={setDetectedDomain}
            />
          )}
          {activeTab === 'audio' && (
            <AudioTranslateTab
              sourceLang={sourceLang}
              targetLang={targetLang}
              lexicalDomain={lexicalDomain}
              onDetectedDomain={setDetectedDomain}
            />
          )}
          {activeTab === 'interpreter' && (
            <LiveInterpreterTab sourceLang={sourceLang} targetLang={targetLang} />
          )}
          {activeTab === 'history' && <TranslationHistoryTab />}
        </div>
      </div>
    </div>
  );
}

export default TranslatePage;
