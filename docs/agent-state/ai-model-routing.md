# Task state: ai-model-routing

- Project root: `/Users/antonlutsenko/IdeaProjects/Lexora` (not a git repo — baseline = scratch snapshot + sha256 list, see below)
- Status: **active**
- Updated: 2026-11-27 (slice table re-checked against the code)
- Authorized scope (user, 2026-10-04): implement `plans/ai-model-routing.md` with **Gemini as the default package**;
  provider mixing per role — agent's UX recommendation; **speech→speech live interpretation as an extra feature**.
  Out of scope unless needed by the plan: other audit findings (S1-2 flashcards etc.). No commits/publishing (not a git repo anyway).

## Goal / success criteria
1. Fresh install and users on the dead V020 defaults get a working Gemini package (one key) — text, OCR, audio, TTS, live dialogue.
2. AI calls are routed per role (text_fast, text_quality, vision, speech_to_text, realtime_voice, live_interpreter, tts, image_gen) with capability-aware fallback.
3. Settings: package picker + 3 user roles (Текст/Картинки/Голос) + optional Иллюстрации; per-role overrides incl. mixing providers only in «Расширенные».
4. Live dialogue via Gemini Live (Rust WS proxy, PCM streaming, barge-in); live interpretation tab via `gemini-3.5-live-translate-preview`.
5. Phase-0 audit prerequisites: S1-1 (extract_json char slicing), S1-3 (working default + conditional migration), S1-4 (no enrich storm on pack load, explicit images choice).

## Decisions
- Mixing providers per role: **advanced mode only** (user agreed 2026-10-05) (progressive disclosure, AGENTS §0.5; single billing; avoids capability mismatches; industry: packages/"recommended" defaults first, per-feature model pickers behind Advanced).
- Keep legacy `ai_provider/ai_model/fallback_*/image_model/tts_engine` columns as mirrors of routes (expand → migrate; contract later).
- Keep `AIProvider` trait for text/vision for now (big-bang trait split rejected as too risky); new narrow traits for realtime; registry generalized to a chain.
- Live dialogue: Rust WebSocket proxy (key stays in Rust), frontend streams PCM16 via invoke, backend streams events via `tauri::ipc::Channel`.
- Live API JSON per official raw examples (2026-10-04): dialogue setup `{model, generationConfig{responseModalities, speechConfig}, systemInstruction, inputAudioTranscription, outputAudioTranscription, contextWindowCompression}`;
  translate setup `{model, generationConfig{responseModalities, inputAudioTranscription, outputAudioTranscription, translationConfig{targetLanguageCode, echoTargetLanguage}}}`.

## Slices
Statuses re-checked against the code on `main` (6b4c208) on 2026-11-27.

| # | Slice | Status | Where in the code |
|---|---|---|---|
| 0 | S1-1 extract_json; V023 migration (model_route, model_package, conditional dead-default → Gemini); S1-4 packs w/o enrich + images choice | done | `providers/ai/mod.rs` (`extract_json`, multibyte test), `db/migrations/V023__model_routes.sql`, `db/packs.rs` (`with_images`), `commands/translate.rs` (`ENRICH_CONCURRENCY` = 2), `pages/collections/CollectionsPage.tsx` («with images» checkbox, off by default) |
| 1 | Roles, catalog, packages, route repo, router chain + timeouts, IPC; wire call sites | done | `providers/models/{roles,catalog,packages,router}.rs`, `db/repos/model_route.rs`, `commands/models.rs` |
| 2 | Settings AiModelsPanel + wizard presets + e2e mock + vitest | done | `pages/settings/{AiModelsPanel,RoleRouteEditor,ProviderKeysEditor}.tsx` + tests, `lib/setupPresets.ts` (`apply_model_package`), e2e 06 («choosing a package fills every role», «a retired model is shown as unavailable»), e2e 11 (Gemini free path), `e2e/helpers/tauri-mock.ts` |
| 3 | TTS role (Gemini/OpenAI TTS + system fallback); image downscale/HEIC; OpenRouter input_audio; incremental live translation | done | `providers/tts/{gemini_tts,openai_tts,system}.rs`, `lib/imagePrepare.ts` (Image tab), `hooks/useLiveSpeechTranslate.ts` + `lib/liveSegments.ts`, `transcribe_audio_hub` in `commands/translation_hub.rs`; TTS role editable in Settings via `lib/modelRouting.ts` |
| 4 | Realtime core (Gemini Live WS) + Dialogue live mode | done | `providers/realtime/gemini_live.rs`, `commands/realtime.rs`, `hooks/useRealtimeSession.ts`, `lib/realtimeAudio.ts`, `pages/dialogue/LiveConversationConsole.tsx` |
| 5 | Live interpreter tab (S2S) | done | `pages/translate/tabs/LiveInterpreterTab.tsx` + test, `live_interpreter` role |
| 6 | Usage counters panel | done | `db/migrations/V024__ai_usage.sql`, `providers/models/usage.rs`, `get_ai_usage`, `pages/settings/AiUsagePanel.tsx` + test |
| 7 | Final checks, UI verification, docs | automated checks done; manual checks open | vitest/tsc/eslint/i18n green on `main` 6b4c208 (2026-11-18). Open: manual check on a real Mac, live smoke test with a Gemini key, Gemini Live latency target (< 1.5 s p50) — see «Next step» |

## Baseline
- Snapshot: scratchpad `baseline/` + `baseline.sha256` (324 files) taken 2026-10-04 before any edit.

## Checks log
- 2026-10-04: `cargo test --lib` 493 passed (baseline 433); `cargo clippy --all-targets` back to baseline (5 lib / 6 test warnings, none new).
- RED→GREEN observed: extract_json multibyte (panic at mod.rs:66 → fixed); image "none" auto-enabled paid generation (→ fixed).
- Realtime: mock WebSocket server test covers setup→audio→transcripts→close and rejected-setup reason.

## Backend changes (done)
- New: `providers/models/{mod,roles,catalog,packages,router}.rs`, `providers/realtime/{mod,gemini_live}.rs`, `providers/tts/gemini_tts.rs`,
  `db/repos/model_route.rs`, `commands/{models,realtime}.rs`, migration `V023__model_routes.sql`, prompt `transcribe_audio.txt`.
- Changed: ProviderRegistry → chain with per-attempt timeout; `AIProvider::transcribe_audio` (Gemini/OpenAI/Groq/OpenRouter input_audio);
  all AI call sites routed by role; TTS role chain with system fallback; image `none` = off; settings `model_package` (merged on update);
  packs: no enrich + untranslated counter; enrich concurrency limit 2; dialogue voice turn = ASR only (no orphan recordings).

## Frontend + backend additions (2026-10-04, session 2)
- Done: types/ipc/hooks (`useModelRoutes`), `lib/modelRouting.ts`, Settings `AiModelsPanel` + `RoleRouteEditor` + `ProviderKeysEditor`
  (old AI Status/advanced block removed), wizard → `apply_model_package` (`gemini-free` first, recommended),
  `lib/realtimeAudio.ts`, `lib/realtimeTranscript.ts`, `useRealtimeSession`, Dialogue «Live conversation», Translation Hub «Live Interpreter»,
  `lib/imagePrepare.ts` (≤2048 px, HEIC→JPEG) in Image tab.
- Backend: routes are the source of truth for legacy AI columns (`align_with_routes` in every settings save; `apply_setup_preset` writes routes);
  `ClientCommand::LearnerText`/`RealtimeEvent::LearnerText` (typed live replies are saved); chain failure classification (auth stops, 429 → next).

## Checks (session 2)
- `cargo test --lib` 500 passed; `tsc --noEmit` clean; eslint clean on changed files (pre-existing no-console errors in untouched translate tabs).
- vitest: 377 passed, **4 failed** in `src/popup/PopupTranslator.test.tsx` (3) and `InlineAssistantWidget.test.tsx` (1) — not yet investigated
  (files untouched; check against baseline first).

## Session 3 (2026-10-05)
- Tests: AiModelsPanel (7), SetupWizard (3), AiUsagePanel (2), useLiveSpeechTranslate (2), usage helpers; e2e 06 (+2: package fills roles,
  retired model unavailable), 11 (+1: Gemini free path); e2e mock: model routing, realtime, usage, transcription commands.
- Live mic translation (Speech & Audio tab): new `transcribe_audio_hub` (speech-to-text role) + `lib/liveSegments.ts`;
  only finished sentences are translated, once each (linear cost); tail translated on stop.
- Usage panel (phase 5): migration V024 `ai_usage`, `AiUsageRepo`, `UsageSink`/`ChainUsage` (every chain attempt, image generations,
  live session minutes), `get_ai_usage`, catalog `price` (Nano Banana 2 Lite $0.034/image, Gemini Live ≤ $0.023/min), Settings «Расходы AI».
- Chain failure classification (phase 1): auth errors stop the chain, 429 → next model.
- Popup (user request): flips left/up near screen edges; `accept_first_mouse`; focus returns to the source app (pid at hotkey) before
  replacing and on close; inline assistant **Fix** mode (Grammarly-style: highlighted mistakes, fix + reason, dismiss/restore,
  «Accept N fixes» → accept_and_replace; statuses saved to Writing history unless privacy mode).
- Checks: cargo test 506 passed, clippy at baseline (5/6, no new); tsc clean; vitest 411/411; e2e 03/06/08/10/11 28/28.
- Pre-existing, not touched: e2e 07 combobox + popup unit tests (separate background task), eslint no-console / a11y errors in
  unchanged files, eslint scanning `playwright-report/`.

## Next step
- Manual check on a real Mac: popup on 2 monitors / other Space / over a fullscreen app; Fix → Accept replaces text in Notes/Safari.
- Optional: anchor the popup at the text selection (AX bounds) instead of the mouse pointer; live smoke test with the Gemini key
  (only with the user's permission).
