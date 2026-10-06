// ============================================================
// LEXORA — Playwright E2E — Tauri IPC Mock Fixture
//
// Использует тот же механизм что @tauri-apps/api/mocks:
// window.__TAURI_INTERNALS__.invoke перехватывает все invoke().
//
// Инжектируется через page.addInitScript() — выполняется ДО
// любого JS приложения, поэтому к моменту первого invoke()
// mock уже активен.
// ============================================================

import { Page } from '@playwright/test';

// ── Mock data ─────────────────────────────────────────────

export const MOCK_TRANSLATION = {
  text: 'apple',
  sourceLanguage: 'en',
  targetLanguage: 'ru',
  mainTranslation: 'яблоко',
  alternatives: ['плод', 'яблоня'],
  sourceSynonyms: ['fruit', 'pome'],
  partOfSpeech: 'noun',
  phonetic: '/ˈæp.əl/',
  usageNote: 'Common everyday fruit.',
  exampleSentence: 'I eat an apple every morning.',
  exampleSentence2: 'She packed an apple for lunch.',
  frequencyHint: 'top-1000',
  fromCache: false,
  lexemeId: 1,
  imagePath: null,
};

export const MOCK_VOCABULARY_ENTRY = {
  id: 1,
  userId: 1,
  lexemeId: 1,
  addedAt: Math.floor(Date.now() / 1000),
  isFavorite: false,
  notes: null,
  source: 'manual',
  lexeme: {
    id: 1,
    languageId: 1,
    text: 'apple',
    normalizedText: 'apple',
    partOfSpeech: 'noun',
    frequencyRank: 500,
    phonetic: '/ˈæp.əl/',
    createdAt: Math.floor(Date.now() / 1000),
  },
  translations: [
    { id: 1, lexemeId: 1, targetLanguageId: 2, translatedText: 'яблоко', sense: null, confidence: 0.98 },
  ],
  examples: [
    { id: 1, lexemeId: 1, sentence: 'I eat an apple every morning.', translation: 'Я ем яблоко каждое утро.', source: 'seed', difficulty: 1 },
  ],
  reviewState: {
    id: 1, userVocabularyId: 1, status: 'new', ease: 2.5,
    interval: 0, dueAt: Math.floor(Date.now() / 1000), lapses: 0, repetitions: 0,
  },
};

// ── AI model routing (roles / packages) ───────────────────

const ROLE_GROUPS: Record<string, string> = {
  text_fast: 'text',
  text_quality: 'text',
  vision: 'images',
  speech_to_text: 'voice',
  realtime_voice: 'voice',
  live_interpreter: 'voice',
  tts: 'voice',
  image_gen: 'illustrations',
};

/** [provider, model, label] per role, first = primary. */
type MockChains = Record<string, Array<[string, string, string]>>;

const STATE_MESSAGES: Record<string, string> = {
  ready: '',
  needs_key: 'Нужен API-ключ провайдера',
  unsupported: 'Живой голос пока работает только с Gemini',
  unavailable: 'Модель снята с поддержки — выберите другую',
  off: 'Не настроено в этом пакете',
};

export function mockModelRoutes(
  pkg: string,
  chains: MockChains,
  state: 'ready' | 'needs_key',
  overrides: Record<string, string> = {},
): Record<string, unknown> {
  return {
    package: pkg,
    illustrations: (chains.image_gen?.length ?? 0) > 0 && pkg !== 'cloudflare',
    roles: Object.entries(ROLE_GROUPS).map(([role, group]) => {
      const chain = chains[role] ?? [];
      const first = chain[0];
      const roleState = chain.length === 0 ? 'off' : (overrides[role] ?? state);
      return {
        role,
        group,
        state: roleState,
        provider: first?.[0] ?? null,
        model: first?.[1] ?? null,
        modelLabel: first?.[2] ?? null,
        message: STATE_MESSAGES[roleState] ?? '',
        usingFallback: false,
        chain: chain.map(([provider, model]) => ({ provider, model })),
      };
    }),
  };
}

const GEMINI_CHAINS: MockChains = {
  text_fast: [['gemini', 'gemini-3.5-flash-lite', 'Gemini 3.5 Flash-Lite'], ['gemini', 'gemini-3.8-flash', 'Gemini 3.8 Flash']],
  text_quality: [['gemini', 'gemini-3.8-flash', 'Gemini 3.8 Flash'], ['gemini', 'gemini-3.5-flash-lite', 'Gemini 3.5 Flash-Lite']],
  vision: [['gemini', 'gemini-3.8-flash', 'Gemini 3.8 Flash']],
  speech_to_text: [['gemini', 'gemini-3.8-flash', 'Gemini 3.8 Flash']],
  realtime_voice: [['gemini', 'gemini-3.8-live', 'Gemini 3.8 Live']],
  live_interpreter: [['gemini', 'gemini-3.5-live-translate-preview', 'Gemini 3.5 Live Translate']],
  tts: [['gemini', 'gemini-3.8-flash-lite-tts', 'Gemini 3.8 Flash-Lite TTS'], ['system', 'say', 'Системный голос macOS']],
  image_gen: [],
};

const OPENAI_CHAINS: MockChains = {
  text_fast: [['openai', 'gpt-6-luna', 'GPT-6 Luna']],
  text_quality: [['openai', 'gpt-6.1-sol', 'GPT-6.1 Sol'], ['openai', 'gpt-6-luna', 'GPT-6 Luna']],
  vision: [['openai', 'gpt-6-luna', 'GPT-6 Luna']],
  speech_to_text: [['openai', 'gpt-transcribe', 'GPT Transcribe']],
  realtime_voice: [['openai', 'gpt-realtime-2.1-mini', 'GPT Realtime 2.1 mini']],
  live_interpreter: [['openai', 'gpt-realtime-translate', 'GPT Realtime Translate']],
  tts: [['openai', 'gpt-4o-mini-tts', 'GPT-4o mini TTS'], ['system', 'say', 'Системный голос macOS']],
  image_gen: [['openai', 'gpt-image-2.5-flare', 'GPT Image 2.5 Flare']],
};

const OFFLINE_CHAINS: MockChains = {
  text_fast: [['offline', 'offline-built-in', 'Встроенный словарь']],
  text_quality: [['offline', 'offline-built-in', 'Встроенный словарь']],
  tts: [['system', 'say', 'Системный голос macOS']],
};

const CLOUDFLARE_CHAINS: MockChains = {
  text_fast: [['cloudflare', '@cf/meta/llama-3.1-8b-instruct', 'Llama 3.1 8B']],
  text_quality: [['cloudflare', '@cf/meta/llama-3.1-8b-instruct', 'Llama 3.1 8B']],
  tts: [['system', 'say', 'Системный голос macOS']],
  image_gen: [['cloudflare', '@cf/black-forest-labs/flux-1-schnell', 'FLUX.1 Schnell']],
};

/** Routes after apply_model_package, as if the key was saved. */
export const MOCK_PACKAGE_ROUTES: Record<string, Record<string, unknown>> = {
  gemini: mockModelRoutes('gemini', GEMINI_CHAINS, 'ready'),
  openai: mockModelRoutes('openai', OPENAI_CHAINS, 'ready', {
    realtime_voice: 'unsupported',
    live_interpreter: 'unsupported',
  }),
  offline: mockModelRoutes('offline', OFFLINE_CHAINS, 'ready'),
  cloudflare: mockModelRoutes('cloudflare', CLOUDFLARE_CHAINS, 'ready'),
  local: mockModelRoutes('local', OFFLINE_CHAINS, 'ready'),
};

function catalogModel(
  provider: string,
  id: string,
  label: string,
  capabilities: string[],
  tier: string,
  kind = 'stable',
) {
  return { provider, id, label, capabilities, tier, status: { kind }, price: null as { unit: string; usd: number } | null };
}

const FLASH_CAPABILITIES = ['text', 'vision', 'audio_input', 'transcription'];

export const MOCK_MODEL_CATALOG = [
  catalogModel('gemini', 'gemini-3.8-flash', 'Gemini 3.8 Flash', FLASH_CAPABILITIES, 'free_tier'),
  catalogModel('gemini', 'gemini-3.5-flash-lite', 'Gemini 3.5 Flash-Lite', FLASH_CAPABILITIES, 'free_tier'),
  { ...catalogModel('gemini', 'gemini-3.8-live', 'Gemini 3.8 Live', ['realtime_voice'], 'free_tier'), price: { unit: 'minute', usd: 0.023 } },
  catalogModel('gemini', 'gemini-3.5-live-translate-preview', 'Gemini 3.5 Live Translate', ['live_translation'], 'free_tier', 'preview'),
  catalogModel('gemini', 'gemini-3.8-flash-lite-tts', 'Gemini 3.8 Flash-Lite TTS', ['speech'], 'free_tier'),
  catalogModel('gemini', 'gemini-3.1-flash-lite-image', 'Nano Banana 2 Lite', ['image_generation'], 'paid'),
  catalogModel('openai', 'gpt-6-luna', 'GPT-6 Luna', ['text', 'vision'], 'paid'),
  catalogModel('openai', 'gpt-6.1-sol', 'GPT-6.1 Sol', ['text', 'vision'], 'paid'),
  catalogModel('openai', 'gpt-transcribe', 'GPT Transcribe', ['transcription'], 'paid'),
  catalogModel('openai', 'gpt-4o-mini-tts', 'GPT-4o mini TTS', ['speech'], 'paid'),
  catalogModel('openai', 'gpt-image-2.5-flare', 'GPT Image 2.5 Flare', ['image_generation'], 'paid'),
  catalogModel('anthropic', 'claude-sonnet-5-5', 'Claude Sonnet 5.5', ['text', 'vision'], 'paid'),
  catalogModel('cloudflare', '@cf/meta/llama-3.1-8b-instruct', 'Llama 3.1 8B', ['text'], 'free_tier'),
  catalogModel('cloudflare', '@cf/black-forest-labs/flux-1-schnell', 'FLUX.1 Schnell', ['image_generation'], 'free_tier'),
  catalogModel('system', 'say', 'Системный голос macOS', ['speech'], 'local'),
];

export const DEFAULT_IPC_RESPONSES: Record<string, unknown> = {
  get_settings: {
    primaryLanguage: 'en', interfaceLanguage: 'en',
    aiProvider: 'cloudflare', aiModel: '@cf/meta/llama-3.1-8b-instruct',
    customBaseUrl: null, cloudflareAccountId: null,
    ttsVoice: 'default', stickerCount: 2, stickerOpacity: 0.9,
    stickerSources: ['all'],
    quietHoursStart: null, quietHoursEnd: null, offlineMode: false,
    writingPrivacyMode: false,
    writingAutoCheck: false,
    fallbackEnabled: true, fallbackAiProvider: 'gemini', fallbackAiModel: 'gemini-3.6-flash',
    // Сценарий уже выбран → SetupWizard первого запуска не показывается
    // в тестах, которые про онбординг не проверяют.
    setupProfile: 'advanced', ttsEngine: 'system',
    hotkeyTranslate: 'CmdOrCtrl+Shift+L', hotkeyStickers: 'CmdOrCtrl+Shift+S',
  },
  update_settings: null, // overridden in inject
  apply_setup_preset: null, // overridden in inject
  set_api_key: null,
  get_api_keys_status: { cloudflare: false, groq: false, openrouter: false, openai: false, gemini: false, custom: false },
  test_ai_connection: {
    ok: true, latencyMs: 142, message: '', sampleTranslation: 'яблоко',
  },
  test_image_connection: {
    ok: true, latencyMs: 890, message: '', provider: 'cloudflare-image', sampleImagePath: null,
  },
  test_provider_connection: MOCK_TRANSLATION,

  // Default: Gemini package, key not saved yet (get_api_keys_status gemini=false).
  get_model_routes: mockModelRoutes('gemini', GEMINI_CHAINS, 'needs_key'),
  get_model_catalog: MOCK_MODEL_CATALOG,
  apply_model_package: null, // computed in inject from __package_routes
  set_role_route: null, // computed in inject
  test_model_role: { ok: true, latencyMs: 210, message: '', sampleTranslation: 'яблоко' },
  get_ai_usage: [
    { role: 'text_fast', provider: 'gemini', model: 'gemini-3.5-flash-lite', requests: 128, failures: 3, seconds: 0, units: 0 },
    { role: 'vision', provider: 'gemini', model: 'gemini-3.8-flash', requests: 14, failures: 0, seconds: 0, units: 0 },
    { role: 'realtime_voice', provider: 'gemini', model: 'gemini-3.8-live', requests: 4, failures: 0, seconds: 1260, units: 0 },
  ],
  __package_routes: MOCK_PACKAGE_ROUTES,
  realtime_start: { sessionId: 1, model: 'gemini-3.8-live', inputSampleRate: 16000, outputSampleRate: 24000 },
  realtime_send_audio: null,
  realtime_send_text: null,
  realtime_stop: null,
  transcribe_audio_hub: { text: 'Where is the station?', language: 'en' },

  list_vocabulary: [MOCK_VOCABULARY_ENTRY],
  get_vocabulary_entry: MOCK_VOCABULARY_ENTRY,
  add_to_vocabulary: MOCK_VOCABULARY_ENTRY,
  remove_from_vocabulary: null,
  toggle_favorite: { ...MOCK_VOCABULARY_ENTRY, isFavorite: true },
  update_vocabulary_notes: MOCK_VOCABULARY_ENTRY,
  count_vocabulary: 1,

  translate_text: MOCK_TRANSLATION,

  list_collections: [
    { id: 1, name: 'Top 5000 Words', description: 'Most frequent English words', collectionType: 'system', languageId: 1, wordCount: 0, isActive: false, packKey: 'top_5000', loadStatus: 'empty' },
    { id: 2, name: 'Phrasal Verbs', description: 'Common English phrasal verbs', collectionType: 'system', languageId: 1, wordCount: 0, isActive: false, packKey: 'phrasal_verbs', loadStatus: 'empty' },
    { id: 3, name: 'Irregular Verbs', description: 'English irregular verbs', collectionType: 'system', languageId: 1, wordCount: 0, isActive: false, packKey: 'irregular_verbs', loadStatus: 'empty' },
    { id: 4, name: 'Business English', description: 'Business vocabulary', collectionType: 'system', languageId: 1, wordCount: 0, isActive: false, packKey: 'business', loadStatus: 'empty' },
    { id: 5, name: 'Academic English', description: 'University and exam vocabulary', collectionType: 'system', languageId: 1, wordCount: 0, isActive: false, packKey: 'academic', loadStatus: 'empty' },
    { id: 6, name: 'Travel English', description: 'Travel and hospitality vocabulary', collectionType: 'system', languageId: 1, wordCount: 0, isActive: false, packKey: 'travel', loadStatus: 'empty' },
  ],
  toggle_collection: null,
  ensure_system_packs_cmd: [],
  load_system_pack: null,
  create_collection: {
    id: 7, name: 'Work emails', description: null, collectionType: 'user',
    languageId: 1, wordCount: 0, isActive: false, packKey: null, loadStatus: null,
  },

  list_languages: [
    { id: 1, code: 'en', name: 'English', nativeName: 'English', hasTts: true, hasAsr: false },
    { id: 2, code: 'ru', name: 'Russian', nativeName: 'Русский', hasTts: true, hasAsr: false },
  ],

  get_study_queue: [MOCK_VOCABULARY_ENTRY],
  get_sticker_card: MOCK_VOCABULARY_ENTRY,
  dismiss_sticker_card: null,
  evaluate_answer: { isCorrect: true, grade: 3, errorType: null, correctAnswer: 'яблоко', explanation: null, shortRule: null },
  get_review_history: [],
  get_due_count: 5,

  get_stats_summary: { totalWords: 42, dueToday: 5, streak: 3, accuracyPercent: 87, wordsAddedThisWeek: 7, matureCount: 12 },
  get_daily_activity: [],
  get_error_breakdown: [
    { errorType: 'grammar', count: 4, accuracyPercent: 60 },
    { errorType: 'spelling', count: 2, accuracyPercent: 80 },
  ],
  get_hardest_words: [],
  get_words_added_stats: { today: 2, thisWeek: 7, thisMonth: 25 },

  // Writing assistant
  check_writing: {
    id: 1,
    originalText: 'She go to school yesterday.',
    correctedText: null,
    language: 'en',
    issueCount: 2,
    acceptedCount: 0,
    rejectedCount: 0,
    overallScore: 70,
    summary: 'Subject-verb agreement and tense errors found.',
    rewriteMode: null,
    createdAt: Math.floor(Date.now() / 1000),
    issues: [
      {
        id: 1,
        writingCheckId: 1,
        category: 'grammar',
        severity: 'error',
        originalFragment: 'go',
        suggestedFix: 'went',
        explanation: 'Past tense requires "went".',
        ruleHint: 'Past simple form of go is went',
        offsetStart: 4,
        offsetEnd: 6,
        status: 'pending',
      },
    ],
  },
  rewrite_text: {
    id: 2,
    originalText: 'Can you please check this as soon as possible?',
    correctedText: 'Please review this at your earliest convenience.',
    language: 'en',
    issueCount: 0,
    acceptedCount: 0,
    rejectedCount: 0,
    overallScore: 100,
    summary: 'Elevated formality.',
    rewriteMode: 'formal',
    createdAt: Math.floor(Date.now() / 1000),
    issues: [],
  },
  update_writing_issue_status: {
    id: 1,
    originalText: 'She go to school yesterday.',
    correctedText: 'She went to school yesterday.',
    language: 'en',
    issueCount: 1,
    acceptedCount: 1,
    rejectedCount: 0,
    overallScore: 85,
    summary: '1 fix applied.',
    rewriteMode: null,
    createdAt: Math.floor(Date.now() / 1000),
    issues: [
      {
        id: 1,
        writingCheckId: 1,
        category: 'grammar',
        severity: 'error',
        originalFragment: 'go',
        suggestedFix: 'went',
        explanation: 'Past tense requires "went".',
        ruleHint: 'Past simple form of go is went',
        offsetStart: 4,
        offsetEnd: 6,
        status: 'accepted',
      },
    ],
  },
  accept_all_issues: {
    id: 1,
    originalText: 'She go to school yesterday.',
    correctedText: 'She went to school yesterday.',
    language: 'en',
    issueCount: 1,
    acceptedCount: 1,
    rejectedCount: 0,
    overallScore: 100,
    summary: 'All issues resolved.',
    rewriteMode: null,
    createdAt: Math.floor(Date.now() / 1000),
    issues: [
      {
        id: 1,
        writingCheckId: 1,
        category: 'grammar',
        severity: 'error',
        originalFragment: 'go',
        suggestedFix: 'went',
        explanation: 'Past tense requires "went".',
        ruleHint: 'Past simple form of go is went',
        offsetStart: 4,
        offsetEnd: 6,
        status: 'accepted',
      },
    ],
  },
  get_writing_error_patterns: [
    {
      id: 1,
      category: 'grammar',
      language: 'en',
      occurrenceCount: 3,
      lastSeenAt: Math.floor(Date.now() / 1000),
      sampleOriginal: 'she go',
      sampleFix: 'she goes',
    },
  ],
  generate_writing_exercises: [
    {
      category: 'grammar',
      exerciseType: 'fill_blank',
      prompt: 'She ___ to the store yesterday.',
      correctAnswer: 'went',
      explanation: 'Use the past simple tense form.',
    },
  ],

  // Pronunciation coach
  evaluate_pronunciation: {
    id: 1,
    lexemeId: 1,
    audioPath: 'local/path/recording.webm',
    overallScore: 92,
    recognizedText: 'apple',
    targetText: 'apple',
    targetIpa: '/ˈæp.əl/',
    recognizedIpa: '/ˈæp.əl/',
    stressFeedback: null,
    summary: 'Clear vowels and crisp consonants.',
    language: 'en',
    createdAt: Math.floor(Date.now() / 1000),
    phonemes: [
      { id: 1, attemptId: 1, targetPhoneme: 'æ', recognizedPhoneme: 'æ', accuracy: 95, status: 'ok', position: 0 },
      { id: 2, attemptId: 1, targetPhoneme: 'p', recognizedPhoneme: 'b', accuracy: 62, status: 'close', position: 1 },
      { id: 3, attemptId: 1, targetPhoneme: 'l', recognizedPhoneme: 'l', accuracy: 91, status: 'ok', position: 2 },
    ],
  },
  get_articulation_tip: {
    phoneme: 'p',
    tip: 'Close both lips, then release a short burst of air.',
    tonguePosition: 'resting behind the lower teeth',
    lipPosition: 'pressed together, then released',
  },
  get_pronunciation_history: [
    {
      id: 1,
      lexemeId: 1,
      audioPath: 'local/path/recording.webm',
      overallScore: 92,
      recognizedText: 'apple',
      targetText: 'apple',
      targetIpa: '/ˈæp.əl/',
      recognizedIpa: '/ˈæp.əl/',
      stressFeedback: null,
      summary: 'Clear vowels and crisp consonants.',
      language: 'en',
      createdAt: Math.floor(Date.now() / 1000),
      phonemes: [],
    },
  ],
  get_problem_phonemes: [
    {
      id: 1,
      phoneme: 'θ',
      language: 'en',
      occurrenceCount: 5,
      lastSeenAt: Math.floor(Date.now() / 1000),
      sampleTarget: 'think',
      sampleRecognized: 'sink',
    },
  ],
  get_minimal_pairs: [
    {
      id: 1,
      language: 'en',
      wordA: 'ship',
      ipaA: '/ʃɪp/',
      wordB: 'sheep',
      ipaB: '/ʃiːp/',
      contrastPhonemeA: 'ɪ',
      contrastPhonemeB: 'iː',
      contrastType: 'vowel',
    },
  ],
  resolve_word_image: null,
  save_audio_recording: { audioPath: 'local/path/recording.webm' },

  // Translation hub — must match TextHubTranslationResponse / ImageHubTranslationResponse
  translate_text_hub: {
    historyId: 1,
    translation: {
      ...MOCK_TRANSLATION,
      text: 'Artificial Intelligence is revolutionizing language learning.',
      mainTranslation: 'Искусственный интеллект революционизирует изучение языков.',
      isOfflineFallback: false,
    },
  },
  translate_image_hub: {
    historyId: 2,
    result: {
      blocks: [
        {
          originalText: 'No Parking',
          translatedText: 'Парковка запрещена',
          boundingBox: { x: 10, y: 15, width: 35, height: 20 },
        },
      ],
      fullTranslatedText: 'Парковка запрещена',
      sourceLanguage: 'en',
      targetLanguage: 'ru',
    },
  },
  translate_document_chunk_hub: {
    sourceLanguage: 'en',
    targetLanguage: 'ru',
    translatedContent: 'Переведенный фрагмент документа.',
  },
  translate_audio_hub: {
    historyId: 4,
    result: {
      transcribedText: 'Good morning everyone.',
      translatedText: 'Доброе утро всем.',
      sourceLanguage: 'en',
      targetLanguage: 'ru',
      segments: [],
    },
  },
  list_translation_history: [
    {
      id: 1,
      mode: 'text',
      sourceLanguage: 'en',
      targetLanguage: 'ru',
      originalText: 'Hello world',
      translatedText: 'Привет мир',
      metadataJson: null,
      isFavorite: true,
      createdAt: Math.floor(Date.now() / 1000) - 3600,
    },
    {
      id: 2,
      mode: 'image',
      sourceLanguage: 'en',
      targetLanguage: 'ru',
      originalText: 'No Parking',
      translatedText: 'Парковка запрещена',
      metadataJson: null,
      isFavorite: false,
      createdAt: Math.floor(Date.now() / 1000) - 1800,
    },
  ],
  toggle_translation_history_favorite: true,
  delete_translation_history_entry: true,
  clear_translation_history: 2,

  get_audio_path: null,
  get_image_path: null,
  regenerate_lexeme_image: '/tmp/regenerated.jpg',
  add_vocabulary_batch: { added: 2, skipped: 0, items: [], translateQueued: true },
  import_word_list: { added: 2, skipped: 0, items: [], translateQueued: true },
  play_tts: null,
  resolve_pronunciation_model: { spokenText: '', ipa: null },
  export_vocabulary: 42,
  import_vocabulary: { imported: 5, skipped: 0 },

  list_dialogue_scenarios: [
    {
      id: 1,
      slug: 'coffee-shop-london-b2',
      title: 'Coffee Shop in London (B2 Level)',
      level: 'B2',
      language: 'en',
      description: 'Order a drink and chat with a barista in a busy London café.',
      tutorRole: 'barista',
      openingLine: 'What kind of roast would you like with your flat white today?',
      suggestedVocab: ['medium roast', 'dark roast', 'Arabica', 'single origin'],
      sortOrder: 1,
    },
    {
      id: 2,
      slug: 'airport-checkin-b1',
      title: 'Airport Check-in (B1 Level)',
      level: 'B1',
      language: 'en',
      description: 'Check in for a flight.',
      tutorRole: 'agent',
      openingLine: 'Good morning! May I see your passport and booking confirmation, please?',
      suggestedVocab: ['boarding pass', 'window seat'],
      sortOrder: 2,
    },
  ],
  start_dialogue_session: {
    id: 10,
    scenarioId: 1,
    scenarioTitle: 'Coffee Shop in London (B2 Level)',
    scenarioLevel: 'B2',
    scenarioSlug: 'coffee-shop-london-b2',
    language: 'en',
    sessionScore: null,
    turnCount: 0,
    status: 'active',
    turns: [
      {
        id: 100,
        sessionId: 10,
        role: 'tutor',
        text: 'What kind of roast would you like with your flat white today?',
        audioPath: null,
        turnScore: null,
        fluencyScore: null,
        clarityScore: null,
        grammarScore: null,
        suggestions: ['medium roast', 'dark roast', 'Arabica', 'single origin'],
        sortOrder: 0,
        createdAt: Math.floor(Date.now() / 1000),
      },
    ],
    createdAt: Math.floor(Date.now() / 1000),
    updatedAt: Math.floor(Date.now() / 1000),
  },
  get_dialogue_session: {
    id: 10,
    scenarioId: 1,
    scenarioTitle: 'Coffee Shop in London (B2 Level)',
    scenarioLevel: 'B2',
    scenarioSlug: 'coffee-shop-london-b2',
    language: 'en',
    sessionScore: null,
    turnCount: 0,
    status: 'active',
    turns: [
      {
        id: 100,
        sessionId: 10,
        role: 'tutor',
        text: 'What kind of roast would you like with your flat white today?',
        audioPath: null,
        turnScore: null,
        fluencyScore: null,
        clarityScore: null,
        grammarScore: null,
        suggestions: ['medium roast', 'dark roast', 'Arabica', 'single origin'],
        sortOrder: 0,
        createdAt: Math.floor(Date.now() / 1000),
      },
    ],
    createdAt: Math.floor(Date.now() / 1000),
    updatedAt: Math.floor(Date.now() / 1000),
  },
  send_dialogue_turn: {
    id: 10,
    scenarioId: 1,
    scenarioTitle: 'Coffee Shop in London (B2 Level)',
    scenarioLevel: 'B2',
    scenarioSlug: 'coffee-shop-london-b2',
    language: 'en',
    sessionScore: 92,
    turnCount: 1,
    status: 'active',
    turns: [
      {
        id: 100,
        sessionId: 10,
        role: 'tutor',
        text: 'What kind of roast would you like with your flat white today?',
        audioPath: null,
        turnScore: null,
        fluencyScore: null,
        clarityScore: null,
        grammarScore: null,
        suggestions: ['medium roast', 'dark roast', 'Arabica', 'single origin'],
        sortOrder: 0,
        createdAt: Math.floor(Date.now() / 1000),
      },
      {
        id: 101,
        sessionId: 10,
        role: 'user',
        text: 'medium roast',
        audioPath: null,
        turnScore: 95,
        fluencyScore: 92,
        clarityScore: 92,
        grammarScore: 96,
        suggestions: [],
        sortOrder: 1,
        createdAt: Math.floor(Date.now() / 1000),
      },
      {
        id: 102,
        sessionId: 10,
        role: 'tutor',
        text: 'Excellent choice — medium roast it is. Hot or iced?',
        audioPath: null,
        turnScore: null,
        fluencyScore: null,
        clarityScore: null,
        grammarScore: null,
        suggestions: ['hot please', 'iced please', 'with oat milk'],
        sortOrder: 2,
        createdAt: Math.floor(Date.now() / 1000),
      },
    ],
    createdAt: Math.floor(Date.now() / 1000),
    updatedAt: Math.floor(Date.now() / 1000),
  },
  end_dialogue_session: {
    id: 10,
    scenarioId: 1,
    scenarioTitle: 'Coffee Shop in London (B2 Level)',
    scenarioLevel: 'B2',
    scenarioSlug: 'coffee-shop-london-b2',
    language: 'en',
    sessionScore: null,
    turnCount: 0,
    status: 'ended',
    turns: [],
    createdAt: Math.floor(Date.now() / 1000),
    updatedAt: Math.floor(Date.now() / 1000),
  },

  open_popup_window: null,
  close_popup_window: null,
  open_main_window: null,
  show_sticker_window: null,
  toggle_stickers: null,
  get_pending_popup_text: null,
  resize_popup_window: null,
  accept_and_replace: null,
};

/**
 * Inject Tauri IPC mock into a Playwright page via addInitScript.
 *
 * MUST be called before page.goto(). Implements the same
 * __TAURI_INTERNALS__ interface that @tauri-apps/api/core relies on.
 *
 * @param overrides — command-specific response overrides (JSON-serializable)
 */
export async function mockTauriIpc(
  page: Page,
  overrides: Record<string, unknown> = {}
): Promise<void> {
  const responses = { ...DEFAULT_IPC_RESPONSES, ...overrides };

  await page.addInitScript((ipcResponses: Record<string, unknown>) => {
    // Replicate mockInternals() from @tauri-apps/api/mocks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    w.__TAURI_INTERNALS__ = w.__TAURI_INTERNALS__ ?? {};
    w.__TAURI_EVENT_PLUGIN_INTERNALS__ = w.__TAURI_EVENT_PLUGIN_INTERNALS__ ?? {};

    const callbacks = new Map<number, (data: unknown) => void>();

    function registerCallback(callback: (data: unknown) => void, once = false): number {
      const id = w.crypto.getRandomValues(new Uint32Array(1))[0] as number;
      callbacks.set(id, (data: unknown) => {
        if (once) callbacks.delete(id);
        callback?.(data);
      });
      return id;
    }

    function unregisterCallback(id: number) {
      callbacks.delete(id);
    }

    function runCallback(id: number, data: unknown) {
      const cb = callbacks.get(id);
      if (cb) cb(data);
    }

    const listeners = new Map<string, number[]>();

    function handleListen(args: { event: string; handler: number }) {
      const list = listeners.get(args.event);
      if (list) {
        list.push(args.handler);
      } else {
        listeners.set(args.event, [args.handler]);
      }
      return args.handler;
    }

    function handleEmit(args: { event: string; payload: unknown }) {
      const handlers = listeners.get(args.event) ?? [];
      for (const id of handlers) runCallback(id, args);
      return null;
    }

    function handleUnlisten(args: { event: string; eventId: number }) {
      const evListeners = listeners.get(args.event);
      if (evListeners) {
        const idx = evListeners.indexOf(args.eventId);
        if (idx !== -1) evListeners.splice(idx, 1);
      }
    }

    // Routes survive refetches (key saved → invalidate → get_model_routes).
    let currentRoutes = ipcResponses['get_model_routes'] as Record<string, unknown>;
    const PROFILE_BY_PACKAGE: Record<string, string> = {
      gemini: 'gemini-free',
      openai: 'paid-openai',
      cloudflare: 'free-cloudflare',
      offline: 'zero',
      local: 'local',
    };

    async function invoke(cmd: string, args?: unknown) {
      // Handle Tauri event plugin internally
      if (cmd === 'plugin:event|listen') return handleListen(args as { event: string; handler: number });
      if (cmd === 'plugin:event|emit') return handleEmit(args as { event: string; payload: unknown });
      if (cmd === 'plugin:event|unlisten') return handleUnlisten(args as { event: string; eventId: number });

      if (Object.prototype.hasOwnProperty.call(ipcResponses, cmd)) {
        const resp = ipcResponses[cmd];
        // Serializable error marker for rate-limit / failure e2e cases
        if (
          resp &&
          typeof resp === 'object' &&
          !Array.isArray(resp) &&
          '__error' in (resp as Record<string, unknown>)
        ) {
          const message = String((resp as { __error: unknown }).__error);
          throw new Error(message);
        }
        // update_settings / apply_setup_preset: merge saved settings so a later
        // get_settings reflects the persisted state (SetupWizard cache write).
        if (cmd === 'update_settings' && args && typeof args === 'object') {
          const a = args as Record<string, unknown>;
          return { ...(ipcResponses['get_settings'] as object), ...(a['settings'] as object) };
        }
        if (cmd === 'apply_setup_preset' && args && typeof args === 'object') {
          const a = args as { input?: { settings?: Record<string, unknown> } };
          return { ...(ipcResponses['get_settings'] as object), ...(a.input?.settings ?? {}) };
        }
        if (cmd === 'get_model_routes') {
          return currentRoutes;
        }
        if (cmd === 'apply_model_package' && args && typeof args === 'object') {
          const input = (args as { input: { package: string; illustrations?: boolean } }).input;
          const packages = ipcResponses['__package_routes'] as Record<string, Record<string, unknown>>;
          currentRoutes = { ...(packages[input.package] ?? currentRoutes), illustrations: Boolean(input.illustrations) };
          const profile =
            input.package === 'gemini' && input.illustrations
              ? 'paid-gemini'
              : PROFILE_BY_PACKAGE[input.package] ?? 'advanced';
          return {
            routes: currentRoutes,
            settings: {
              ...(ipcResponses['get_settings'] as object),
              modelPackage: input.package,
              setupProfile: profile,
            },
          };
        }
        if (cmd === 'set_role_route' && args && typeof args === 'object') {
          const input = (args as { input: { role: string; targets: Array<{ provider: string; model: string }> } }).input;
          const roles = (currentRoutes['roles'] as Array<Record<string, unknown>>).map((r) =>
            r['role'] === input.role
              ? {
                  ...r,
                  chain: input.targets,
                  provider: input.targets[0]?.provider ?? null,
                  model: input.targets[0]?.model ?? null,
                  modelLabel: input.targets[0]?.model ?? null,
                  state: input.targets.length > 0 ? 'ready' : 'off',
                }
              : r,
          );
          currentRoutes = { ...currentRoutes, package: 'custom', roles };
          return {
            routes: currentRoutes,
            settings: { ...(ipcResponses['get_settings'] as object), modelPackage: 'custom' },
          };
        }
        return resp;
      }

      // eslint-disable-next-line no-console -- e2e tooling: surface unhandled IPC in test logs
      console.warn(`[e2e mock] Unhandled IPC: ${cmd}`, args);
      return null;
    }

    w.__TAURI_INTERNALS__.invoke = invoke;
    w.__TAURI_INTERNALS__.transformCallback = registerCallback;
    w.__TAURI_INTERNALS__.unregisterCallback = unregisterCallback;
    w.__TAURI_INTERNALS__.runCallback = runCallback;
    w.__TAURI_INTERNALS__.callbacks = callbacks;
    // Required for getCurrentWindow() etc.
    w.__TAURI_INTERNALS__.metadata = {
      currentWindow: { label: 'main' },
      currentWebview: { windowLabel: 'main', label: 'main' },
    };
    w.__TAURI_EVENT_PLUGIN_INTERNALS__.unregisterListener = handleUnlisten;
  }, responses);
}
