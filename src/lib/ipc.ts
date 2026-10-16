import type { CategoryDto } from './types';
// ============================================================
// LEXORA — IPC Layer
// Все вызовы invoke() только здесь. В компонентах — запрещено.
// ============================================================

import { invoke, type Channel } from '@tauri-apps/api/core';
import type {
  ApplyGrammarFixInput,
  GrammarFieldPayload,
  GrammarWatchSettings,
  GrammarWatchStatus,
  AddVocabularyInput,
  AddCollocationsInput,
  CollocationDto,
  AddVocabularyBatchInput,
  AddVocabularyBatchResult,
  AppSettings,
  CheckWritingInput,
  CollectionDto,
  CreateCollectionInput,
  EvaluateAnswerInput,
  EvaluationResult,
  ImportWordListInput,
  LanguageDto,
  ReviewEventDto,
  RewriteTextInput,
  StudyQueueFilters,
  SubmitReviewInput,
  SubmitReviewResult,
  TestConnectionResult,
  TestImageConnectionResult,
  TranslateInput,
  TranslationResult,
  VocabularyEntryDto,
  VocabularyFilters,
  WritingCheckDto,
  WritingErrorPatternDto,
  WritingExerciseDto,
  WritingIssueStatus,
  ArticulationTipInput,
  ArticulationTipResult,
  EvaluatePronunciationInput,
  MinimalPairDto,
  PhonemePatternDto,
  PronunciationAttemptDto,
  PronunciationModelDto,
  SaveAudioRecordingInput,
  SaveAudioRecordingResult,
  CreateDialogueScenarioInput,
  DialogueScenarioDto,
  GenerateDialogueScenariosResult,
  DialogueSessionDto,
  StartDialogueSessionInput,
  SendDialogueTurnInput,
  AudioHubTranslationResponse,
  DocChunkTranslationResult,
  ImageHubTranslationResponse,
  TextHubTranslationResponse,
  TranslateAudioInput,
  TranslateDocChunkInput,
  TranslateImageInput,
  TranslationHistoryDto,
  TranscribeAudioInput,
  TranscriptionResult,
  AiUsageRow,
  ApplyModelPackageInput,
  ModelRole,
  ModelRoutes,
  ModelSetup,
  ModelSpec,
  RealtimeEvent,
  RealtimeStartInput,
  RealtimeStarted,
  RouteTarget,
} from './types';

// ── Vocabulary ────────────────────────────────────────────

export const ipc = {
  categories: {
    list: (languageId: number) => invoke<CategoryDto[]>('list_categories', { languageId }),
    create: (name: string, languageId: number) => invoke<CategoryDto>('create_category', { name, languageId }),
    rename: (id: number, name: string) => invoke<CategoryDto>('rename_category', { id, name }),
    remove: (id: number) => invoke<void>('delete_category', { id }),
    move: (ids: number[], categoryId: number) => invoke<void>('move_vocabulary_to_category', { ids, categoryId }),
  },
  interface: {
    setLocale: (locale: string) => invoke<void>('set_interface_locale', { locale }),
  },
  vocabulary: {
    list: (filters: VocabularyFilters) =>
      invoke<VocabularyEntryDto[]>('list_vocabulary', { filters }),

    get: (id: number) =>
      invoke<VocabularyEntryDto>('get_vocabulary_entry', { id }),

    add: (input: AddVocabularyInput) =>
      invoke<VocabularyEntryDto>('add_to_vocabulary', { input }),

    addBatch: (input: AddVocabularyBatchInput) =>
      invoke<AddVocabularyBatchResult>('add_vocabulary_batch', { input }),

    importWordList: (input: ImportWordListInput) =>
      invoke<AddVocabularyBatchResult>('import_word_list', { input }),

    remove: (id: number) =>
      invoke<void>('remove_from_vocabulary', { id }),

    removeBatch: (ids: number[]) =>
      invoke<void>('remove_vocabulary_batch', { ids }),

    toggleFavorite: (id: number) =>
      invoke<VocabularyEntryDto>('toggle_favorite', { id }),

    updateNotes: (id: number, notes: string) =>
      invoke<VocabularyEntryDto>('update_vocabulary_notes', { id, notes }),

    update: (id: number, text: string, translation: string | null) =>
      invoke<VocabularyEntryDto>('update_vocabulary_entry', { id, text, translation }),

    count: (languageId: number | null) =>
      invoke<number>('count_vocabulary', { languageId }),

    exportData: (path: string) =>
      invoke<number>('export_vocabulary', { path }),

    importData: (path: string) =>
      invoke<ImportResult>('import_vocabulary', { path }),
  },

  // ── Collocations ──────────────────────────────────────

  collocations: {
    /** Cached in SQLite after the first AI call for this word and target language. */
    get: (lexemeId: number, targetLanguage: string) =>
      invoke<CollocationDto[]>('get_collocations', { lexemeId, targetLanguage }),

    /** Adds chosen collocations as vocabulary cards; returns the refreshed list. */
    add: (input: AddCollocationsInput) =>
      invoke<CollocationDto[]>('add_collocations_to_vocabulary', { input }),
  },

  // ── Translation/AI ────────────────────────────────────

  translate: {
    text: (input: TranslateInput) =>
      invoke<TranslationResult>('translate_text', { input }),

    testProvider: (input: { provider: string; model: string; accountId?: string | null; customUrl?: string | null }) =>
      invoke<TranslationResult>('test_provider_connection', { input }),

    testConnection: () =>
      invoke<TestConnectionResult>('test_ai_connection'),
  },

  writing: {
    check: (input: CheckWritingInput) =>
      invoke<WritingCheckDto>('check_writing', { input }),

    rewrite: (input: RewriteTextInput) =>
      invoke<WritingCheckDto>('rewrite_text', { input }),

    updateIssueStatus: (issueId: number, status: WritingIssueStatus) =>
      invoke<WritingCheckDto>('update_writing_issue_status', { issueId, status }),

    acceptAll: (checkId: number) =>
      invoke<WritingCheckDto>('accept_all_issues', { checkId }),

    getErrorPatterns: (language: string) =>
      invoke<WritingErrorPatternDto[]>('get_writing_error_patterns', { language }),

    generateExercises: (language: string) =>
      invoke<WritingExerciseDto[]>('generate_writing_exercises', { language }),
  },

  pronunciation: {
    saveRecording: (input: SaveAudioRecordingInput) =>
      invoke<SaveAudioRecordingResult>('save_audio_recording', { input }),

    evaluate: (input: EvaluatePronunciationInput) =>
      invoke<PronunciationAttemptDto>('evaluate_pronunciation', { input }),

    getArticulationTip: (input: ArticulationTipInput) =>
      invoke<ArticulationTipResult>('get_articulation_tip', { input }),

    getHistory: (lexemeId: number | null, language: string | null, limit: number) =>
      invoke<PronunciationAttemptDto[]>('get_pronunciation_history', {
        lexemeId,
        language,
        limit,
      }),

    getProblemPhonemes: (language: string | null, limit: number) =>
      invoke<PhonemePatternDto[]>('get_problem_phonemes', { language, limit }),

    getMinimalPairs: (language: string | null, contrastType: string | null, limit: number) =>
      invoke<MinimalPairDto[]>('get_minimal_pairs', { language, contrastType, limit }),

    resolveModel: (text: string, language: string) =>
      invoke<PronunciationModelDto>('resolve_pronunciation_model', { text, language }),
  },

  dialogue: {
    listScenarios: (language?: string | null) =>
      invoke<DialogueScenarioDto[]>('list_dialogue_scenarios', { language: language ?? null }),

    generateScenarios: (language: string) =>
      invoke<GenerateDialogueScenariosResult>('generate_dialogue_scenarios', { language }),

    createScenario: (input: CreateDialogueScenarioInput) =>
      invoke<DialogueScenarioDto>('create_dialogue_scenario', { input }),

    deleteScenario: (id: number) => invoke<void>('delete_dialogue_scenario', { id }),

    startSession: (input: StartDialogueSessionInput = {}) =>
      invoke<DialogueSessionDto>('start_dialogue_session', { input }),

    sendTurn: (input: SendDialogueTurnInput) =>
      invoke<DialogueSessionDto>('send_dialogue_turn', { input }),

    getSession: (sessionId: number) =>
      invoke<DialogueSessionDto>('get_dialogue_session', { sessionId }),

    endSession: (sessionId: number) =>
      invoke<DialogueSessionDto>('end_dialogue_session', { sessionId }),
  },

  study: {
    getQueue: (filters: StudyQueueFilters) =>
      invoke<VocabularyEntryDto[]>('get_study_queue', { filters }),

    evaluateAnswer: (input: EvaluateAnswerInput) =>
      invoke<EvaluationResult>('evaluate_answer', { input }),

    submitReview: (input: SubmitReviewInput) =>
      invoke<SubmitReviewResult>('submit_review', { input }),

    getHistory: (reviewStateId: number, limit: number) =>
      invoke<ReviewEventDto[]>('get_review_history', { reviewStateId, limit }),

    getDueCount: (languageId: number) =>
      invoke<number>('get_due_count', { languageId }),
  },

  stickers: {
    // Фильтр (язык, источники) бэкенд берёт из настроек — окна его не передают.
    getCard: () =>
      invoke<VocabularyEntryDto | null>('get_sticker_card'),

    dismissCard: (entryId: number) =>
      invoke<VocabularyEntryDto | null>('dismiss_sticker_card', { entryId }),
  },

  // ── Collections ───────────────────────────────────────

  collections: {
    list: (languageId: number | null) =>
      invoke<CollectionDto[]>('list_collections', { languageId }),

    toggle: (id: number, active: boolean) =>
      invoke<CollectionDto>('toggle_collection', { id, active }),

    create: (input: CreateCollectionInput) =>
      invoke<CollectionDto>('create_collection', { input }),

    ensureSystemPacks: (languageId: number) =>
      invoke<CollectionDto[]>('ensure_system_packs_cmd', { languageId }),

    loadSystemPack: (collectionId: number, withImages = true) =>
      invoke<void>('load_system_pack', { collectionId, withImages }),
  },

  // ── Languages ─────────────────────────────────────────

  languages: {
    list: () =>
      invoke<LanguageDto[]>('list_languages'),
  },

  // ── Settings ──────────────────────────────────────────

  settings: {
    get: () =>
      invoke<AppSettings>('get_settings'),

    update: (settings: Partial<AppSettings>) =>
      invoke<AppSettings>('update_settings', { settings }),

    setApiKey: (provider: string, key: string) =>
      invoke<void>('set_api_key', { provider, key }),

    getApiKeysStatus: () =>
      invoke<Record<string, boolean>>('get_api_keys_status'),

    /**
     * Атомарно применяет сценарий быстрой настройки: при наличии ключа
     * сохраняет его под активного провайдера, затем пишет полный AppSettings
     * (setupProfile выставляется пресетом). Возвращает сохранённые настройки.
     */
    applySetupPreset: (settings: AppSettings, apiKey?: string | null) =>
      invoke<AppSettings>('apply_setup_preset', {
        input: { settings, apiKey: apiKey ?? null },
      }),
  },

  // ── AI model routing (roles / packages) ───────────────

  models: {
    catalog: () =>
      invoke<ModelSpec[]>('get_model_catalog'),

    routes: () =>
      invoke<ModelRoutes>('get_model_routes'),

    applyPackage: (input: ApplyModelPackageInput) =>
      invoke<ModelSetup>('apply_model_package', { input }),

    setRoleRoute: (role: ModelRole, targets: RouteTarget[]) =>
      invoke<ModelSetup>('set_role_route', { input: { role, targets } }),

    testRole: (role: ModelRole) =>
      invoke<TestConnectionResult>('test_model_role', { role }),

    usage: (days: number) =>
      invoke<AiUsageRow[]>('get_ai_usage', { days }),
  },

  // ── Realtime voice (Gemini Live) ──────────────────────

  realtime: {
    start: (input: RealtimeStartInput, onEvent: Channel<RealtimeEvent>) =>
      invoke<RealtimeStarted>('realtime_start', { input, onEvent }),

    sendAudio: (sessionId: number, chunk: string) =>
      invoke<void>('realtime_send_audio', { sessionId, chunk }),

    sendText: (sessionId: number, text: string) =>
      invoke<void>('realtime_send_text', { sessionId, text }),

    stop: (sessionId: number) =>
      invoke<void>('realtime_stop', { sessionId }),
  },

  // ── Media ─────────────────────────────────────────────

  media: {
    getAudio: (lexemeId: number) =>
      invoke<string | null>('get_audio_path', { lexemeId }),

    getImage: (lexemeId: number) =>
      invoke<string | null>('get_image_path', { lexemeId }),

    regenerateImage: (lexemeId: number) =>
      invoke<string>('regenerate_lexeme_image', { lexemeId }),

    resolveWordImage: (word: string, language: string) =>
      invoke<string | null>('resolve_word_image', { word, language }),

    testConnection: (modelId: string) =>
      invoke<TestImageConnectionResult>('test_image_connection', { input: { modelId } }),

    playTts: (text: string, language?: string | null) =>
      invoke<void>('play_tts', { text, language: language ?? null }),
  },

  // ── Stats ─────────────────────────────────────────────

  stats: {
    getSummary: (languageId: number) =>
      invoke<StatsSummary>('get_stats_summary', { languageId }),

    getDailyActivity: (days: number, languageId: number) =>
      invoke<DailyActivity[]>('get_daily_activity', { days, languageId }),

    getErrorBreakdown: (languageId: number) =>
      invoke<ErrorBreakdown[]>('get_error_breakdown', { languageId }),

    getHardestWords: (languageId: number, limit: number) =>
      invoke<HardestWord[]>('get_hardest_words', { languageId, limit }),

    getWordsAddedStats: (languageId: number) =>
      invoke<WordsAddedStats>('get_words_added_stats', { languageId }),
  },

  // ── Translation Hub (Stage 4) ─────────────────────────

  translationHub: {
    translateText: (req: TranslateInput, saveHistory?: boolean) =>
      invoke<TextHubTranslationResponse>('translate_text_hub', { req, saveHistory }),

    translateImage: (req: TranslateImageInput, saveHistory?: boolean) =>
      invoke<ImageHubTranslationResponse>('translate_image_hub', { req, saveHistory }),

    translateDocumentChunk: (req: TranslateDocChunkInput) =>
      invoke<DocChunkTranslationResult>('translate_document_chunk_hub', { req }),

    translateAudio: (req: TranslateAudioInput, saveHistory?: boolean) =>
      invoke<AudioHubTranslationResponse>('translate_audio_hub', { req, saveHistory }),

    transcribeAudio: (req: TranscribeAudioInput) =>
      invoke<TranscriptionResult>('transcribe_audio_hub', { req }),

    listHistory: (mode?: string | null, limit?: number, offset?: number) =>
      invoke<TranslationHistoryDto[]>('list_translation_history', { mode, limit, offset }),

    toggleFavorite: (id: number) =>
      invoke<boolean>('toggle_translation_history_favorite', { id }),

    deleteEntry: (id: number) =>
      invoke<void>('delete_translation_history_entry', { id }),

    clearHistory: (mode?: string | null) =>
      invoke<number>('clear_translation_history', { mode }),
  },

  // ── Window ────────────────────────────────────────────

  window: {
    openPopup: () =>
      invoke<void>('open_popup_window'),

    closePopup: () =>
      invoke<void>('close_popup_window'),

    getPendingPopupText: () =>
      invoke<string | null>('get_pending_popup_text'),

    openMain: () =>
      invoke<void>('open_main_window'),

    showSticker: () =>
      invoke<void>('show_sticker_window'),

    setStickerPinned: (pinned: boolean) =>
      invoke<void>('set_sticker_pinned', { pinned }),
  },

  // ── System-wide writing check («Grammarly mode») ──────

  grammar: {
    getSettings: () =>
      invoke<GrammarWatchSettings>('get_grammar_watch_settings'),

    updateSettings: (settings: GrammarWatchSettings) =>
      invoke<GrammarWatchSettings>('update_grammar_watch_settings', { settings }),

    getStatus: () =>
      invoke<GrammarWatchStatus>('get_grammar_watch_status'),

    requestAccess: () =>
      invoke<void>('request_grammar_watch_access'),

    getField: () =>
      invoke<GrammarFieldPayload>('get_grammar_field'),

    applyFix: (input: ApplyGrammarFixInput) =>
      invoke<void>('apply_grammar_fix', { input }),

    setPanelOpen: (open: boolean) =>
      invoke<void>('set_grammar_panel_open', { open }),

    snooze: (fieldId: number) =>
      invoke<void>('snooze_grammar_field', { fieldId }),

    excludeApp: (bundleId: string) =>
      invoke<GrammarWatchSettings>('exclude_grammar_app', { bundleId }),
  },

  // ── Popup (inline assistant + dictionary card) ────────

  popup: {
    acceptAndReplace: (text: string) =>
      invoke<void>('accept_and_replace', { text }),

    resize: (width: number, height: number, resizable = false) =>
      invoke<void>('resize_popup_window', { width, height, resizable }),
  },
} as const;

// Inline types for stats (simple enough to not need separate file)
export type ImportResult = {
  imported: number;
  skipped: number;
};

export type StatsSummary = {
  totalWords: number;
  dueToday: number;
  streak: number;
  accuracyPercent: number;
  wordsAddedThisWeek: number;
  matureCount: number;
};

export type DailyActivity = {
  date: string; // YYYY-MM-DD
  reviewed: number;
  added: number;
  accuracy: number;
};

export type ErrorBreakdown = {
  errorType: string;
  count: number;
  accuracyPercent: number;
};

export type HardestWord = {
  entryId: number;
  text: string;
  translation: string | null;
  lapses: number;
  totalReviews: number;
  accuracyPercent: number;
};

export type WordsAddedStats = {
  today: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
};
