// ============================================================
// LEXORA — Shared Types
// Все доменные типы приложения. Отражают Rust DTO-структуры.
// ============================================================

// ── SRS ──────────────────────────────────────────────────

export type SrsStatus = 'new' | 'learning' | 'review' | 'mature' | 'suspended';

export type StudyGrade = 0 | 1 | 2 | 3 | 4;
// 0=blackout, 1=wrong, 2=hard, 3=good, 4=easy

export type StudyMode =
  | 'flashcard'
  | 'typing'
  | 'image'
  | 'listening'
  | 'cloze'
  | 'irregular_verbs'
  | 'definition'
  | 'speaking';

export type ErrorType =
  | 'typo'
  | 'grammar'
  | 'ending'
  | 'article'
  | 'tense'
  | 'preposition'
  | 'word_choice'
  | 'meaning';

// ── Language ──────────────────────────────────────────────

export type LanguageDto = {
  id: number;
  code: string;        // 'en', 'ru', 'de' ...
  name: string;        // 'English'
  nativeName: string;  // 'English'
  hasTts: boolean;
  hasAsr: boolean;
};

// ── Lexeme ────────────────────────────────────────────────

export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adj'
  | 'adv'
  | 'prep'
  | 'pron'
  | 'conj'
  | 'interj'
  | 'phrase'
  | 'idiom';

export type LexemeDto = {
  id: number;
  languageId: number;
  text: string;
  normalizedText: string;
  partOfSpeech: PartOfSpeech | null;
  frequencyRank: number | null;
  phonetic: string | null;
  createdAt: number; // unix timestamp
};

// ── Translation ───────────────────────────────────────────

export type TranslationDto = {
  id: number;
  lexemeId: number;
  targetLanguageId: number;
  translatedText: string;
  sense: string | null;     // context/usage hint
  confidence: number | null; // 0.0–1.0
};

// ── Example ───────────────────────────────────────────────

export type ExampleDto = {
  id: number;
  lexemeId: number;
  sentence: string;
  translation: string | null;
  source: string | null;
  difficulty: number | null; // 1–5
};

// ── Media ─────────────────────────────────────────────────

export type MediaType = 'image' | 'gif' | 'audio';

export type MediaDto = {
  id: number;
  lexemeId: number;
  mediaType: MediaType;
  localPath: string;
  sourceUrl: string | null;
  provider: string | null;
};

// ── User Vocabulary ───────────────────────────────────────

export type VocabularyEntryDto = {
  categoryId?: number;
  id: number;
  userId: number;
  lexemeId: number;
  addedAt: number;
  isFavorite: boolean;
  notes: string | null;
  source: string | null;
  // Joined
  lexeme: LexemeDto;
  translations: TranslationDto[];
  examples: ExampleDto[];
  // Optional until all backend paths populate it (always [] when missing).
  synonyms?: string[];
  reviewState: ReviewStateDto | null;
  /** Persisted local image generated or fetched when the word was added. */
  imagePath?: string | null;
};

// ── Review State (SRS) ────────────────────────────────────

export type ReviewStateDto = {
  id: number;
  userVocabularyId: number;
  status: SrsStatus;
  ease: number;       // SM-2 ease factor
  interval: number;   // days
  dueAt: number;      // unix timestamp
  lapses: number;
  repetitions: number;
};

// ── Review Event ──────────────────────────────────────────

export type ReviewEventDto = {
  id: number;
  reviewStateId: number;
  mode: StudyMode;
  grade: StudyGrade;
  userResponse: string | null;
  latencyMs: number;
  errorType: ErrorType | null;
  timestamp: number;
};

// ── Collection ────────────────────────────────────────────

export type CollectionType = 'system' | 'user';

export type CollectionDto = {
  id: number;
  name: string;
  description: string | null;
  collectionType: CollectionType;
  languageId: number;
  wordCount: number;
  isActive: boolean; // included in SRS queue
  packKey?: string | null;
  loadStatus?: 'empty' | 'loading' | 'ready' | 'error' | string | null;
};

export type PackLoadProgress = {
  collectionId: number;
  done: number;
  total: number;
  phase: string;
  text?: string | null;
  error?: string | null;
};

export type CreateCollectionInput = {
  name: string;
  description?: string | null;
  languageId: number;
};

// ── Translation Result (from AI provider) ─────────────────

export type TranslationResult = {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  mainTranslation: string;
  alternatives: string[];
  /** Synonyms in the source language (e.g. English for EN→RU). */
  sourceSynonyms: string[];
  partOfSpeech: PartOfSpeech | null;
  phonetic: string | null;
  usageNote: string | null;
  exampleSentence: string | null;
  exampleSentence2: string | null;
  frequencyHint: string | null;
  /** True when served from SQLite without an LLM call. */
  fromCache: boolean;
  /** True when the result is an offline placeholder (no AI provider call succeeded). */
  isOfflineFallback: boolean;
  lexemeId: number | null;
  imagePath: string | null;
  /**
   * Lexical domain actually used for this gloss (`general` | `it` | …).
   * Present after Auto-detect or when a domain was forced.
   */
  detectedLexicalDomain?: string | null;
  /** Domain the caller requested (`auto` | `general` | …). */
  requestedLexicalDomain?: string | null;
};

/** Result of the `test_ai_connection` diagnostic command. */
export type TestConnectionResult = {
  ok: boolean;
  latencyMs: number;
  /** Human-readable failure reason (verbatim from the provider) when ok is false. */
  message: string;
  sampleTranslation: string | null;
};

/** Result of the `test_image_connection` diagnostic command. */
export type TestImageConnectionResult = {
  ok: boolean;
  latencyMs: number;
  /** Human-readable failure reason (verbatim from the provider) when ok is false. */
  message: string;
  provider: string | null;
  sampleImagePath: string | null;
};

/** Background enrichment payload (`lexora:card-enrich`). */
export type CardEnrichEvent = {
  lexemeId: number;
  usageNote: string | null;
  exampleSentence: string | null;
  exampleSentence2: string | null;
  imagePath: string | null;
  /** False while a photo is still being generated. Omitted events count as complete. */
  complete?: boolean;
};

export function isCardEnrichComplete(payload: CardEnrichEvent): boolean {
  return payload.complete !== false;
}

/** A word that had no gloss finally got one (`lexora:translation-backfilled`). */
export type TranslationBackfilledEvent = {
  lexemeId: number;
};

// ── AI Evaluation Result ──────────────────────────────────

export type EvaluationResult = {
  isCorrect: boolean;
  grade: StudyGrade;
  errorType: ErrorType | null;
  correctAnswer: string;
  explanation: string | null;
  shortRule: string | null;
};

export type AIProviderName =
  | 'cloudflare'
  | 'openrouter'
  | 'groq'
  | 'custom'
  | 'openai'
  | 'gemini'
  | 'anthropic'
  | 'offline';

/**
 * Guided-setup scenario chosen on first run (V022__setup_profile.sql).
 * `null`/undefined = not chosen yet (SetupWizard may appear for a pristine install).
 */
export type SetupProfileName =
  | 'zero' // Бесплатно — без ключей (офлайн-словарь + системный голос + фото-сток)
  | 'free-cloudflare' // Бесплатно — один бесплатный ключ Cloudflare (перевод + AI-картинки)
  | 'paid-openai' // Платно — один ключ OpenAI на всё
  | 'paid-gemini' // Gemini с платными иллюстрациями
  | 'gemini-free' // Gemini — один бесплатный ключ (рекомендуется)
  | 'local' // Локальные модели (Ollama)
  | 'advanced'; // Расширенные настройки (пользователь настроил вручную)

/** TTS backend. `system` = macOS `say` (бесплатно, офлайн); `gemini` / `openai` = нейроголоса. */
export type TtsEngine = 'system' | 'openai' | 'gemini';

export type AppSettings = {
  primaryLanguage: string;
  interfaceLanguage: string;
  aiProvider: AIProviderName;
  aiModel: string;
  customBaseUrl?: string | null;
  cloudflareAccountId?: string | null;
  ttsVoice: string;
  stickerCount: number;
  stickerOpacity: number;
  /** `all` | `mine` | `cat:<categoryId>` | `c:<collectionId>` — multi-select of sticker word sources. */
  stickerSources: string[];
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  offlineMode: boolean;
  /** When true, writing checks/rewrites are not persisted (check id === 0). */
  writingPrivacyMode: boolean;
  /** When true, Writing page auto-runs check_writing after a typing pause. */
  writingAutoCheck: boolean;
  // Global shortcuts (tauri-plugin-global-shortcut format, e.g. 'CmdOrCtrl+Shift+L')
  hotkeyTranslate: string;
  hotkeyStickers: string;
  // Fallback AI provider for automatic failover
  fallbackAiProvider?: AIProviderName | null;
  fallbackAiModel?: string | null;
  fallbackEnabled?: boolean;
  /** Image-gen model id (`cloudflare:…` | `gemini:…` | `openai:…`). */
  imageModel?: string;
  /** Fallback image-gen model id, or `none` for Wikimedia-only fallback. */
  fallbackImageModel?: string | null;
  /** Guided-setup scenario (V022). `null`/undefined = not chosen yet. */
  setupProfile?: SetupProfileName | null;
  /** TTS backend engine (V022). */
  ttsEngine?: TtsEngine;
  /** Active model package (V023); `custom` = per-role overrides. */
  modelPackage?: ModelPackageId | null;
};

// ── AI model routing (V023) ───────────────────────────────

export type ModelRole =
  | 'text_fast'
  | 'text_quality'
  | 'vision'
  | 'speech_to_text'
  | 'realtime_voice'
  | 'live_interpreter'
  | 'tts'
  | 'image_gen';

export type RoleGroup = 'text' | 'images' | 'voice' | 'illustrations';

export type ModelCapability =
  | 'text'
  | 'vision'
  | 'audio_input'
  | 'transcription'
  | 'realtime_voice'
  | 'live_translation'
  | 'speech'
  | 'image_generation';

export type ModelTier = 'local' | 'free' | 'free_tier' | 'paid';

export type ModelStatus =
  | { kind: 'stable' }
  | { kind: 'preview' }
  | { kind: 'deprecated'; shutdown: string }
  | { kind: 'retired' };

/** Published paid-tier price of a unit Lexora counts exactly. */
export type UnitPrice = {
  unit: 'image' | 'minute';
  usd: number;
};

export type ModelSpec = {
  provider: string;
  id: string;
  label: string;
  capabilities: ModelCapability[];
  tier: ModelTier;
  status: ModelStatus;
  price: UnitPrice | null;
};

/** AI calls per role and model over a period (Settings → «Расходы AI»). */
export type AiUsageRow = {
  role: string;
  provider: string;
  model: string;
  requests: number;
  failures: number;
  /** Live voice session time. */
  seconds: number;
  /** Generated images. */
  units: number;
};

export type RouteTarget = {
  provider: string;
  model: string;
};

export type RoleState = 'ready' | 'needs_key' | 'unavailable' | 'unsupported' | 'off';

export type RoleStatus = {
  role: ModelRole;
  group: RoleGroup;
  state: RoleState;
  provider: string | null;
  model: string | null;
  modelLabel: string | null;
  /** Short Russian explanation from the backend. */
  message: string;
  usingFallback: boolean;
  chain: RouteTarget[];
};

export type ModelPackageId = 'gemini' | 'openai' | 'local' | 'offline' | 'cloudflare' | 'custom';

export type ModelRoutes = {
  package: ModelPackageId | null;
  illustrations: boolean;
  roles: RoleStatus[];
};

export type ModelSetup = {
  routes: ModelRoutes;
  settings: AppSettings;
};

export type ApplyModelPackageInput = {
  package: Exclude<ModelPackageId, 'custom'>;
  apiKey?: string | null;
  illustrations?: boolean;
  cloudflareAccountId?: string | null;
  customBaseUrl?: string | null;
};

// ── Realtime voice (Gemini Live) ──────────────────────────

export type RealtimeMode = 'dialogue' | 'interpreter';

export type RealtimeStartInput = {
  mode: RealtimeMode;
  dialogueSessionId?: number | null;
  targetLanguage?: string | null;
  sourceLanguage?: string | null;
  echoTargetLanguage?: boolean;
  voice?: string | null;
};

export type RealtimeStarted = {
  sessionId: number;
  model: string;
  inputSampleRate: number;
  outputSampleRate: number;
};

export type RealtimeEvent =
  | { type: 'ready'; model: string }
  | { type: 'audio'; data: string; sampleRate: number }
  | { type: 'inputTranscript'; text: string; language: string | null }
  | { type: 'outputTranscript'; text: string; language: string | null }
  | { type: 'learnerText'; text: string }
  | { type: 'interrupted' }
  | { type: 'turnComplete' }
  | { type: 'goAway'; timeLeft: string | null }
  | { type: 'turnSaved'; session: DialogueSessionDto }
  | { type: 'error'; message: string }
  | { type: 'closed'; reason: string | null };

// ── Input types (for mutations) ───────────────────────────

export type AddVocabularyInput = {
  categoryId?: number | null;
  lexemeId: number | null;   // null if new word
  text: string;
  sourceLanguage: string;
  notes?: string;
  source?: string;
};

export type AddVocabularyBatchInput = {
  categoryId?: number | null;
  texts: string[];
  sourceLanguage: string;
  source?: string;
};

export type ImportWordListInput = {
  categoryId?: number | null;
  path: string;
  sourceLanguage: string;
  source?: string;
};

export type BatchAddedItem = {
  text: string;
  lexemeId: number;
};

export type AddVocabularyBatchResult = {
  added: number;
  skipped: number;
  items: BatchAddedItem[];
  translateQueued: boolean;
};

export type BulkTranslateProgress = {
  done: number;
  total: number;
  text: string;
  error: string | null;
};

export type TranslateInput = {
  text: string;
  sourceLanguage: string | null; // null = auto-detect
  targetLanguage: string;
  contextSentence: string | null;
  /** Subject lexicon: `auto` | `general` | `it` | `medicine` | `legal` | `finance` | `business`. */
  lexicalDomain?: string | null;
};

export type TestProviderInput = {
  provider: string;
  model: string;
  accountId?: string | null;
  customUrl?: string | null;
};

export type EvaluateAnswerInput = {
  reviewStateId: number;
  mode: StudyMode;
  userAnswer: string;
  targetText: string;
  latencyMs: number;
};

/** Self-assessed review (Flashcards): the learner rates recall, no answer text. */
export type SubmitReviewInput = {
  reviewStateId: number;
  mode: StudyMode;
  grade: StudyGrade;
  latencyMs: number;
};

export type SubmitReviewResult = {
  /** Unix seconds of the next scheduled review. */
  dueAt: number;
};

export type RewriteMode =
  | 'clearer'
  | 'shorter'
  | 'formal'
  | 'friendly'
  | 'professional'
  | 'simpler'
  | 'rephrase'
  | 'custom';

export type WritingIssueStatus = 'pending' | 'accepted' | 'rejected';

export type WritingIssueDto = {
  id: number;
  writingCheckId: number;
  category: string;
  severity: string;
  originalFragment: string;
  suggestedFix: string;
  explanation: string;
  ruleHint: string | null;
  offsetStart: number;
  offsetEnd: number;
  status: WritingIssueStatus;
};

export type WritingCheckDto = {
  id: number;
  originalText: string;
  correctedText: string | null;
  language: string;
  issueCount: number;
  acceptedCount: number;
  rejectedCount: number;
  overallScore: number;
  summary: string | null;
  rewriteMode: RewriteMode | string | null;
  issues: WritingIssueDto[];
  createdAt: number;
};

export type CheckWritingInput = {
  text: string;
  language?: string | null;
  /** Never store the check (text typed in other apps). */
  ephemeral?: boolean;
};

// ── System-wide writing check («Grammarly mode», V025) ──────────

export type GrammarWatchSettings = {
  enabled: boolean;
  /** macOS bundle ids or Windows exe names; an entry ending in «*» matches a prefix. */
  excludedApps: string[];
};

export type GrammarWatchStatus = {
  /** The platform can watch other apps' text fields (macOS only). */
  supported: boolean;
  accessibilityTrusted: boolean;
};

/** Focused-field state pushed to the badge window. */
export type GrammarFieldPayload =
  | { kind: 'hidden' }
  | { kind: 'pending'; fieldId: number }
  | {
      kind: 'check';
      fieldId: number;
      text: string;
      appName: string | null;
      bundleId: string | null;
    };

export type ApplyGrammarFixInput = {
  fieldId: number;
  /** Text the check ran on — must still be in the field. */
  checkedText: string;
  correctedText: string;
};

export type RewriteTextInput = {
  text: string;
  language?: string | null;
  mode: RewriteMode;
  customPrompt?: string;
};

export type TextRegister = 'official' | 'business' | 'colleague' | 'general';

export type InlineAssistantMode =
  | 'translate'
  | 'fix'
  | 'improve'
  | 'rephrase'
  | 'shorten'
  | 'friendly'
  | 'formal'
  | 'text'
  | 'custom';

export type InlineAssistantRequest = {
  text: string;
  mode: InlineAssistantMode;
  customPrompt?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
};

export type InlineAssistantResult = {
  outputText: string;
  mode: InlineAssistantMode;
  targetLanguage?: string;
  changesSummary?: string;
};

/** Aggregated recurring mistake category for a language (from persisted checks). */
export type WritingErrorPatternDto = {
  id: number;
  category: string;
  language: string;
  occurrenceCount: number;
  lastSeenAt: number; // unix timestamp
  sampleOriginal: string | null;
  sampleFix: string | null;
};

/** Targeted exercise generated from the user's error patterns. */
export type WritingExerciseDto = {
  category: string;
  exerciseType: string;
  prompt: string;
  correctAnswer: string;
  explanation: string;
};

export type PhonemeScoreStatus = 'ok' | 'close' | 'miss' | string;

export type PhonemeScoreDto = {
  id: number;
  attemptId: number;
  targetPhoneme: string;
  recognizedPhoneme: string | null;
  accuracy: number;
  status: PhonemeScoreStatus;
  position: number;
};

export type PronunciationAttemptDto = {
  id: number;
  lexemeId: number | null;
  audioPath: string;
  overallScore: number;
  recognizedText: string | null;
  targetText: string;
  targetIpa: string | null;
  recognizedIpa: string | null;
  stressFeedback: string | null;
  summary: string | null;
  language: string;
  createdAt: number;
  phonemes: PhonemeScoreDto[];
};

export type PhonemePatternDto = {
  id: number;
  phoneme: string;
  language: string;
  occurrenceCount: number;
  lastSeenAt: number;
  sampleTarget: string | null;
  sampleRecognized: string | null;
};

export type MinimalPairDto = {
  id: number;
  wordA: string;
  wordB: string;
  ipaA: string;
  ipaB: string;
  contrastPhonemeA: string;
  contrastPhonemeB: string;
  contrastType: 'vowel' | 'consonant' | string;
  language: string;
};

export type SaveAudioRecordingInput = {
  audioBase64: string;
  mimeType?: string | null;
};

export type SaveAudioRecordingResult = {
  audioPath: string;
};

// ── AI Dialogue ───────────────────────────────────────────

export type DialogueScenarioDto = {
  id: number;
  slug: string;
  title: string;
  level: string;
  language: string;
  description: string | null;
  tutorRole: string;
  openingLine: string;
  suggestedVocab: string[];
  sortOrder: number;
  /** `guided` = a concrete situation, `free` = talk about anything. */
  kind: DialogueScenarioKind;
  /** `builtin` = English seed, `generated` = AI localization, `custom` = the learner's own. */
  origin: DialogueScenarioOrigin;
  baseSlug: string | null;
};

export type DialogueScenarioKind = 'guided' | 'free';
export type DialogueScenarioOrigin = 'builtin' | 'generated' | 'custom';

export type CreateDialogueScenarioInput = {
  language?: string;
  title?: string;
  description?: string;
  level: string;
  kind: DialogueScenarioKind;
};

export type GenerateDialogueScenariosResult = {
  /** Localizations created by this call. */
  created: number;
  /** Builtin scenarios still without a localization. */
  remaining: number;
};

export type DialogueTurnDto = {
  id: number;
  sessionId: number;
  role: 'tutor' | 'user' | string;
  text: string;
  audioPath: string | null;
  turnScore: number | null;
  fluencyScore: number | null;
  clarityScore: number | null;
  grammarScore: number | null;
  suggestions: string[];
  sortOrder: number;
  createdAt: number;
};

export type DialogueSessionDto = {
  id: number;
  scenarioId: number;
  scenarioTitle: string;
  scenarioLevel: string;
  scenarioSlug: string;
  language: string;
  sessionScore: number | null;
  turnCount: number;
  status: 'active' | 'ended' | string;
  turns: DialogueTurnDto[];
  createdAt: number;
  updatedAt: number;
};

export type StartDialogueSessionInput = {
  scenarioId?: number;
  scenarioSlug?: string;
  language?: string;
};

export type SendDialogueTurnInput = {
  sessionId: number;
  text?: string;
  audioBase64?: string;
  mimeType?: string;
};

export type EvaluatePronunciationInput = {
  targetText: string;
  targetIpa?: string | null;
  language?: string | null;
  audioPath?: string | null;
  recognizedText?: string | null;
  lexemeId?: number | null;
};

export type ArticulationTipInput = {
  phoneme: string;
  language?: string | null;
};

export type ArticulationTipResult = {
  phoneme: string;
  tip: string;
  tonguePosition: string | null;
  lipPosition: string | null;
};

export type PronunciationModelDto = {
  spokenText: string;
  ipa: string | null;
};

// ── Filter types ──────────────────────────────────────────

export type VocabularyFilters = {
  categoryId?: number | null;
  search: string;
  languageId: number | null;
  status: SrsStatus | 'all';
  collectionId: number | null;
  sortBy: 'added_date' | 'due_date' | 'frequency' | 'alphabetical';
  sortDir: 'asc' | 'desc';
  page: number;
  perPage: number;
};

export type StudySource = {
  collectionId: number;
  enabled: boolean;
  weight: number;
};

export type StudyQueueFilters = {
  languageId: number;
  sources: StudySource[];
  limit: number;
  includeNew: boolean;
  includeMatureRefresh: boolean;
  /** When set, restrict the queue to user-added and/or selected collections. */
  includeMine?: boolean;
  collectionIds?: number[];
  categoryIds?: number[];
};

// ── Stage 4: Multimodal Translation Hub ──────────────────

export type TranslationHubMode = 'text' | 'image' | 'document' | 'audio';

export type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ImageTextBlock = {
  originalText: string;
  translatedText: string;
  boundingBox?: BoundingBox | null;
};

export type ImageTranslationResult = {
  sourceLanguage: string;
  targetLanguage: string;
  fullTranslatedText: string;
  blocks: ImageTextBlock[];
  detectedLexicalDomain?: string | null;
  requestedLexicalDomain?: string | null;
};

export type TranslateImageInput = {
  imageBase64: string;
  mimeType: string;
  sourceLanguage?: string | null;
  targetLanguage: string;
  lexicalDomain?: string | null;
};

export type TranslateDocChunkInput = {
  docName: string;
  sourceLanguage?: string | null;
  targetLanguage: string;
  content: string;
  tone?: string | null;
  glossary?: string | null;
  lexicalDomain?: string | null;
};

export type DocChunkTranslationResult = {
  sourceLanguage: string;
  targetLanguage: string;
  translatedContent: string;
  detectedLexicalDomain?: string | null;
  requestedLexicalDomain?: string | null;
};

export type TranslateAudioInput = {
  audioBase64: string;
  mimeType: string;
  sourceLanguage?: string | null;
  targetLanguage: string;
  lexicalDomain?: string | null;
};

export type AudioTranslationSegment = {
  startSeconds: number;
  endSeconds: number;
  originalText: string;
  translatedText: string;
};

/** Speech recognition only (live captions). */
export type TranscribeAudioInput = {
  audioBase64: string;
  mimeType: string;
  /** ISO 639-1 hint; null = auto-detect. */
  language?: string | null;
};

export type TranscriptionResult = {
  text: string;
  language: string | null;
};

export type AudioTranslationResult = {
  sourceLanguage: string;
  targetLanguage: string;
  transcribedText: string;
  translatedText: string;
  segments: AudioTranslationSegment[];
  detectedLexicalDomain?: string | null;
  requestedLexicalDomain?: string | null;
};

export type TextHubTranslationResponse = {
  translation: TranslationResult;
  historyId?: number | null;
};

export type ImageHubTranslationResponse = {
  result: ImageTranslationResult;
  historyId?: number | null;
};

export type AudioHubTranslationResponse = {
  result: AudioTranslationResult;
  historyId?: number | null;
};

export type TranslationHistoryDto = {
  id: number;
  mode: TranslationHubMode;
  sourceLanguage: string;
  targetLanguage: string;
  originalText: string;
  translatedText: string;
  metadataJson?: string | null;
  isFavorite: boolean;
  createdAt: number;
};

export type CategoryDto = {
  id: number;
  name: string;
  languageId: number;
  isGeneral: boolean;
  wordCount: number;
};
