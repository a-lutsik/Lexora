// ============================================================
// LEXORA — Constants
// ============================================================

export const SRS_STATUS_LABELS: Record<string, string> = {
  new:       'New',
  learning:  'Learning',
  review:    'Review',
  mature:    'Mature',
  suspended: 'Suspended',
} as const;

export const STUDY_MODE_LABELS: Record<string, string> = {
  flashcard:       'Flashcard',
  typing:          'Typing',
  image:           'Image',
  listening:       'Listening',
  cloze:           'Fill the Gap',
  irregular_verbs: 'Irregular Verbs',
  definition:      'Definition',
  speaking:        'Speaking',
} as const;

export const DEFAULT_VOCABULARY_FILTERS = {
  search: '',
  languageId: null,
  status: 'all' as const,
  collectionId: null,
  categoryId: null,
  sortBy: 'added_date' as const,
  sortDir: 'desc' as const,
  page: 1,
  perPage: 50,
} as const;

export const TAURI_WINDOW_LABELS = {
  MAIN:   'main',
  POPUP:  'popup',
  STICKER: 'sticker',
} as const;

export const QUERY_KEYS = {
  VOCABULARY:   'vocabulary',
  VOCABULARY_ENTRY: 'vocabulary-entry',
  STUDY_QUEUE:  'study-queue',
  STICKER_CARD: 'sticker-card',
  COLLECTIONS:  'collections',
  CATEGORIES: 'categories',
  COLLOCATIONS: 'collocations',
  LANGUAGES:    'languages',
  SETTINGS:     'settings',
  STATS:        'stats',
  DUE_COUNT:    'due-count',
  WRITING_PATTERNS: 'writing-patterns',
  PRONUNCIATION_HISTORY: 'pronunciation-history',
  PROBLEM_PHONEMES: 'problem-phonemes',
  MINIMAL_PAIRS: 'minimal-pairs',
  WORD_IMAGE: 'word-image',
  DIALOGUE_SCENARIOS: 'dialogue-scenarios',
  DIALOGUE_SESSION: 'dialogue-session',
  MODEL_ROUTES: 'model-routes',
  MODEL_CATALOG: 'model-catalog',
  PROVIDER_MODELS: 'provider-models',
  AI_USAGE: 'ai-usage',
  GRAMMAR_WATCH_SETTINGS: 'grammar-watch-settings',
  GRAMMAR_WATCH_STATUS: 'grammar-watch-status',
  GRAMMAR_CHECK: 'grammar-check',
  GRAMMAR_CHECK_PARAGRAPH: 'grammar-check-paragraph',
} as const;

/** Most underlines drawn in another app's field at once (keep in sync with `MAX_MARKS` in grammar_watch/mod.rs). */
export const MAX_GRAMMAR_MARKS = 32;

/** Backend events emitted with `app.emit`. */
export const APP_EVENTS = {
  CARD_ENRICH: 'lexora:card-enrich',
  TRANSLATION_BACKFILLED: 'lexora:translation-backfilled',
  /** Focused-field state for the writing-check badge (`GrammarFieldPayload`). */
  GRAMMAR_FIELD: 'lexora:grammar-field',
  /** The backend collapsed the writing-check panel (payload: `false`). */
  GRAMMAR_PANEL: 'lexora:grammar-panel',
  /** Underline rectangles for the overlay window (`GrammarMarksPayload`). */
  GRAMMAR_MARKS: 'lexora:grammar-marks',
  /** The suggestion shown in the hover card (`GrammarMark`, or null). */
  GRAMMAR_CARD: 'lexora:grammar-card',
  /** A button was pressed in the hover card (`GrammarMarkAction`). */
  GRAMMAR_MARK_ACTION: 'lexora:grammar-mark-action',
} as const;

export const STALE_TIME = {
  SHORT:  10_000,   // 10s — due count, etc.
  MEDIUM: 30_000,   // 30s — vocabulary list
  LONG:   300_000,  // 5min — collections, languages
  NEVER:  Infinity, // settings
} as const;
