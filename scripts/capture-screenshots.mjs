import { chromium } from '@playwright/test';
import path from 'path';

const outDir = '/Users/antonlutsenko/.gemini/antigravity-ide/brain/ca8e83f5-cecc-4526-a8a7-917443a96f83';

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });

  const getInitScript = (entriesList) => `
    const entries = ${JSON.stringify(entriesList)};
    const MOCK_SETTINGS = {
      primaryLanguage: 'en', interfaceLanguage: 'en',
      aiProvider: 'cloudflare', aiModel: '@cf/meta/llama-3.1-8b-instruct',
      customBaseUrl: null, cloudflareAccountId: null,
      ttsVoice: 'default', stickerCount: 3, stickerOpacity: 0.95,
      quietHoursStart: null, quietHoursEnd: null, offlineMode: false,
      hotkeyTranslate: 'CmdOrCtrl+Shift+L', hotkeyStickers: 'CmdOrCtrl+Shift+S',
    };

    const w = window;
    w.__TAURI_INTERNALS__ = w.__TAURI_INTERNALS__ ?? {};
    w.__TAURI_EVENT_PLUGIN_INTERNALS__ = w.__TAURI_EVENT_PLUGIN_INTERNALS__ ?? {};

    const callbacks = new Map();
    w.__TAURI_INTERNALS__.invoke = async (cmd, args) => {
      if (cmd === 'list_vocabulary') return entries;
      if (cmd === 'get_settings') return MOCK_SETTINGS;
      if (cmd === 'get_due_count') return 23;
      if (cmd === 'get_study_queue') return entries;
      if (cmd === 'get_sticker_card') return entries[0] ?? null;
      if (cmd === 'dismiss_sticker_card') return null;
      if (cmd === 'translate_text') return {
        text: 'serendipity',
        sourceLanguage: 'en',
        targetLanguage: 'ru',
        mainTranslation: 'счастливая случайность',
        alternatives: ['удача', 'везение', 'приятный сюрприз'],
        partOfSpeech: 'noun',
        phonetic: '/ˌser.ənˈdɪp.ə.ti/',
        usageNote: 'Often used in literature and philosophical contexts.',
        exampleSentence: 'Finding this bookstore was pure serendipity.',
        frequencyHint: 'top-4200',
      };
      return null;
    };
    w.__TAURI_INTERNALS__.transformCallback = (cb) => {
      const id = Math.floor(Math.random() * 100000);
      callbacks.set(id, cb);
      return id;
    };
    w.__TAURI_INTERNALS__.metadata = {
      currentWindow: { label: 'main' },
      currentWebview: { windowLabel: 'main', label: 'main' },
    };
  `;

  const MOCK_ENTRIES = [
    {
      id: 1,
      userId: 1,
      lexemeId: 1,
      addedAt: Math.floor(Date.now() / 1000),
      isFavorite: true,
      notes: 'From Latin "tenax" meaning holding fast.',
      source: 'manual',
      lexeme: {
        id: 1,
        languageId: 1,
        text: 'tenacious',
        normalizedText: 'tenacious',
        partOfSpeech: 'adj',
        frequencyRank: 1847,
        phonetic: '/tɪˈneɪ.ʃəs/',
        createdAt: Math.floor(Date.now() / 1000),
      },
      translations: [
        { id: 1, lexemeId: 1, targetLanguageId: 2, translatedText: 'упорный, настойчивый', sense: null, confidence: 0.99 },
      ],
      examples: [
        { id: 1, lexemeId: 1, sentence: 'TEN-acious = holding TEN things at once!', translation: 'Упорный человек удерживает сразу 10 дел!', source: 'seed', difficulty: 2 },
      ],
      reviewState: {
        id: 1, userVocabularyId: 1, status: 'review', ease: 2.5,
        interval: 4, dueAt: Math.floor(Date.now() / 1000), lapses: 0, repetitions: 3,
      },
    },
    {
      id: 2,
      userId: 1,
      lexemeId: 2,
      addedAt: Math.floor(Date.now() / 1000),
      isFavorite: false,
      notes: null,
      source: 'manual',
      lexeme: {
        id: 2,
        languageId: 1,
        text: 'ephemeral',
        normalizedText: 'ephemeral',
        partOfSpeech: 'adj',
        frequencyRank: 3241,
        phonetic: '/ɪˈfem.ər.əl/',
        createdAt: Math.floor(Date.now() / 1000),
      },
      translations: [
        { id: 2, lexemeId: 2, targetLanguageId: 2, translatedText: 'мимолётный', sense: null, confidence: 0.95 },
      ],
      examples: [],
      reviewState: {
        id: 2, userVocabularyId: 2, status: 'learning', ease: 2.2,
        interval: 1, dueAt: Math.floor(Date.now() / 1000) + 86400, lapses: 0, repetitions: 1,
      },
    },
    {
      id: 3,
      userId: 1,
      lexemeId: 3,
      addedAt: Math.floor(Date.now() / 1000),
      isFavorite: true,
      notes: null,
      source: 'manual',
      lexeme: {
        id: 3,
        languageId: 1,
        text: 'tenacious',
        normalizedText: 'tenacious',
        partOfSpeech: 'adj',
        frequencyRank: 1847,
        phonetic: '/tɪˈneɪ.ʃəs/',
        createdAt: Math.floor(Date.now() / 1000),
      },
      translations: [
        { id: 3, lexemeId: 3, targetLanguageId: 2, translatedText: 'упорный, стойкий', sense: null, confidence: 0.99 },
      ],
      examples: [],
      reviewState: {
        id: 3, userVocabularyId: 3, status: 'mature', ease: 2.8,
        interval: 32, dueAt: Math.floor(Date.now() / 1000) + 86400 * 20, lapses: 0, repetitions: 6,
      },
    },
    {
      id: 4,
      userId: 1,
      lexemeId: 4,
      addedAt: Math.floor(Date.now() / 1000),
      isFavorite: false,
      notes: null,
      source: 'manual',
      lexeme: {
        id: 4,
        languageId: 1,
        text: 'serendipity',
        normalizedText: 'serendipity',
        partOfSpeech: 'noun',
        frequencyRank: 4200,
        phonetic: '/ˌser.ənˈdɪp.ə.ti/',
        createdAt: Math.floor(Date.now() / 1000),
      },
      translations: [
        { id: 4, lexemeId: 4, targetLanguageId: 2, translatedText: 'счастливая случайность', sense: null, confidence: 0.98 },
      ],
      examples: [],
      reviewState: {
        id: 4, userVocabularyId: 4, status: 'review', ease: 2.5,
        interval: 3, dueAt: Math.floor(Date.now() / 1000) - 3600, lapses: 0, repetitions: 2,
      },
    },
  ];

  await context.addInitScript(getInitScript(MOCK_ENTRIES));

  const page = await context.newPage();

  // 1. Study Screen
  console.log('Capturing Study Screen...');
  await page.goto('http://localhost:1420/#/study');
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: 'Start study session' }).click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, 'real_app_study_card_front.png') });

  // Click correct option to trigger glowing highlight
  const correctOption = page.locator('.study-option-card:has-text("упорный")');
  await correctOption.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, 'real_app_study_card_revealed.png') });

  // 2. Popup Translator
  console.log('Capturing Popup Translator...');
  const popupPage = await context.newPage();
  await popupPage.setViewportSize({ width: 440, height: 540 });
  await popupPage.goto('http://localhost:1420/popup.html');
  await popupPage.waitForTimeout(500);
  await popupPage.getByRole('textbox', { name: 'Translate query' }).fill('serendipity');
  await popupPage.getByRole('button', { name: 'Translate' }).click();
  await popupPage.waitForTimeout(600);
  await popupPage.screenshot({ path: path.join(outDir, 'real_app_popup_translator.png') });

  // 3. Stickers in 3 Different States (Mockup Screen 4):
  console.log('Capturing Sticker State 1 (Default Glass)...');
  const stickerPage1 = await context.newPage();
  await stickerPage1.setViewportSize({ width: 280, height: 110 });
  // Sticker with ephemeral (learning state)
  await stickerPage1.addInitScript(getInitScript([MOCK_ENTRIES[1]]));
  await stickerPage1.goto('http://localhost:1420/sticker.html');
  await stickerPage1.waitForTimeout(600);
  await stickerPage1.screenshot({ path: path.join(outDir, 'real_app_sticker_default.png') });

  console.log('Capturing Sticker State 2 (Due now)...');
  const stickerPage2 = await context.newPage();
  await stickerPage2.setViewportSize({ width: 280, height: 110 });
  // Sticker with serendipity (due now state)
  await stickerPage2.addInitScript(getInitScript([MOCK_ENTRIES[3]]));
  await stickerPage2.goto('http://localhost:1420/sticker.html');
  await stickerPage2.waitForTimeout(600);
  await stickerPage2.screenshot({ path: path.join(outDir, 'real_app_sticker_due.png') });

  console.log('Capturing Sticker State 3 (Mature Emerald Aurora)...');
  const stickerPage3 = await context.newPage();
  await stickerPage3.setViewportSize({ width: 280, height: 110 });
  // Sticker with tenacious (mature state)
  await stickerPage3.addInitScript(getInitScript([MOCK_ENTRIES[2]]));
  await stickerPage3.goto('http://localhost:1420/sticker.html');
  await stickerPage3.waitForTimeout(600);
  await stickerPage3.screenshot({ path: path.join(outDir, 'real_app_sticker_mature.png') });

  await browser.close();
  console.log('All upgraded screenshots captured successfully!');
}

capture().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
