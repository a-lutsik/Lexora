// ============================================================
// LEXORA — Multimodal Translation Hub Page
// Stage 4: Text, Image/OCR, Document, and Speech Translation.
// ============================================================

import { TextTranslateTab } from './tabs/TextTranslateTab';
import { ImageTranslateTab } from './tabs/ImageTranslateTab';
import { DocumentTranslateTab } from './tabs/DocumentTranslateTab';
import { AudioTranslateTab } from './tabs/AudioTranslateTab';
import { LiveInterpreterTab } from './tabs/LiveInterpreterTab';
import { TranslationHistoryTab } from './tabs/TranslationHistoryTab';
import {
  IconTabText,
  IconTabImage,
  IconTabDocument,
  IconTabAudio,
  IconTabInterpreter,
  IconTabHistory,
} from './components/TranslateIcons';
import { IconSwap } from '../../components/ui/LuminousIcons';
import { LanguageSelect } from '../../components/ui/LanguageSelect';
import { TranslationDomainSelect } from '../../components/domain/TranslationDomainSelect';
import { useSessionLanguagePair } from '../../hooks/useSessionLanguagePair';
import { useSessionLexicalDomain } from '../../hooks/useSessionLexicalDomain';
import { useLanguageOptions } from '../../hooks/useLanguages';
import { useState } from 'react';
import './translate.css';

type TabMode = 'text' | 'image' | 'document' | 'audio' | 'interpreter' | 'history';

export function TranslatePage() {
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
    <div className="translate-page animate-fade-in">
      <header className="translate-header">
        <div>
          <h1 className="translate-title">Translation Hub</h1>
          <p className="text-secondary text-sm">
            Translate text, extract image OCR, process documents, translate speech, or interpret live.
          </p>
        </div>

        {activeTab !== 'history' && (
          <div className="translate-lang-bar" role="group" aria-label="Language selection">
            <LanguageSelect
              className="lang-select-wrap"
              value={sourceLang}
              options={langOptions}
              leadingOptions={[{ value: 'auto', label: '✨ Auto-Detect' }]}
              onChange={setSourceLang}
              ariaLabel="Source language"
            />

            <button
              type="button"
              className="btn-swap-lang"
              onClick={() => handleSwap()}
              aria-label="Swap source and target languages"
              title="Swap languages"
            >
              <IconSwap size={16} />
            </button>

            <LanguageSelect
              className="lang-select-wrap"
              value={targetLang}
              options={langOptions}
              onChange={setTargetLang}
              ariaLabel="Target language"
            />

            <TranslationDomainSelect
              value={lexicalDomain}
              onChange={handleDomainChange}
              detectedDomain={detectedDomain}
              id="hub-lexical-domain"
              className="translate-domain-select"
            />
          </div>
        )}
      </header>

      <div className="translate-mode-tabs" role="tablist" aria-label="Translation Modes">
        <button
          type="button"
          role="tab"
          id="tab-text"
          aria-selected={activeTab === 'text'}
          className={`translate-mode-tab ${activeTab === 'text' ? 'is-active' : ''}`}
          onClick={() => handleTabChange('text')}
        >
          <IconTabText />
          <span>Text</span>
        </button>
        <button
          type="button"
          role="tab"
          id="tab-image"
          aria-selected={activeTab === 'image'}
          className={`translate-mode-tab ${activeTab === 'image' ? 'is-active' : ''}`}
          onClick={() => handleTabChange('image')}
        >
          <IconTabImage />
          <span>Image & Photo</span>
        </button>
        <button
          type="button"
          role="tab"
          id="tab-document"
          aria-selected={activeTab === 'document'}
          className={`translate-mode-tab ${activeTab === 'document' ? 'is-active' : ''}`}
          onClick={() => handleTabChange('document')}
        >
          <IconTabDocument />
          <span>Document</span>
        </button>
        <button
          type="button"
          role="tab"
          id="tab-audio"
          aria-selected={activeTab === 'audio'}
          className={`translate-mode-tab ${activeTab === 'audio' ? 'is-active' : ''}`}
          onClick={() => handleTabChange('audio')}
        >
          <IconTabAudio />
          <span>Speech & Audio</span>
        </button>
        <button
          type="button"
          role="tab"
          id="tab-interpreter"
          aria-selected={activeTab === 'interpreter'}
          className={`translate-mode-tab ${activeTab === 'interpreter' ? 'is-active' : ''}`}
          onClick={() => handleTabChange('interpreter')}
        >
          <IconTabInterpreter />
          <span>Live Interpreter</span>
        </button>
        <button
          type="button"
          role="tab"
          id="tab-history"
          aria-selected={activeTab === 'history'}
          className={`translate-mode-tab ${activeTab === 'history' ? 'is-active' : ''}`}
          onClick={() => handleTabChange('history')}
        >
          <IconTabHistory />
          <span>History</span>
        </button>
      </div>

      <main className="translate-main-content">
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
      </main>
    </div>
  );
}

export default TranslatePage;
