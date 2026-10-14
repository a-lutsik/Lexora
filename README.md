<div align="center">

<img src="docs/user-guide/img/logo.png" width="96" alt="Lexora logo">

# LEXORA

**Desktop language-learning app with an AI assistant — local-first, private by design.**

**English** · [Русский](./README.ru.md) · [User guide (PDF)](./docs/user-guide/Lexora-User-Guide.en.pdf)

</div>

Lexora helps you build a personal vocabulary, review it with spaced repetition (SM-2), write and translate with AI, practice pronunciation and talk to an AI tutor. Vocabulary, reviews and statistics work **fully offline**; the internet is needed only for AI features.

![Vocabulary](docs/user-guide/img/vocabulary.jpg)

## Features

| Area | What it does |
|------|--------------|
| **Vocabulary** | Personal word list with search and status filters; add words one by one, from a pasted list or a file; word details, notes, pronunciation. |
| **Study** | SM-2 spaced repetition with 8 modes: Flashcards, Typing, Listening, Fill the Gap, Image Association, Irregular Verbs, Definition, Speaking. |
| **Writing** | Grammar / spelling / style check with explanations, rewrite (clearer, shorter, formal, friendlier…), exercises built from your own error patterns. |
| **Translate** | Text, image & photo (in-place overlay), documents & PDF, speech & audio, live interpreter, translation history. |
| **Speak** | Phoneme-level pronunciation scoring, shadowing, minimal pairs, history. |
| **Dialogue** | Voice or text role-play scenarios with an AI tutor and per-turn scoring. |
| **Collections** | Ready-made packs (Top 5000, Phrasal Verbs, Irregular Verbs, Business / Academic / Travel) and your own collections. |
| **Stats** | Vocabulary growth, accuracy, streak, 30-day activity, hardest words. |
| **Popup translator** | Translate selected text in any app with a global hotkey. |
| **Desktop stickers** | Small always-on-top cards for ambient review. |
| **Writing check in other apps** | "Grammarly-style" badge with fixes in any text field (macOS and Windows). |

<table>
<tr>
<td><img src="docs/user-guide/img/study-flashcard.jpg" alt="Study"></td>
<td><img src="docs/user-guide/img/translate-text.jpg" alt="Translate"></td>
</tr>
<tr>
<td><img src="docs/user-guide/img/pron-practice.jpg" alt="Speak"></td>
<td><img src="docs/user-guide/img/stats.jpg" alt="Stats"></td>
</tr>
</table>

## Principles

1. **Local-first** — fully functional without internet (except AI translation).
2. **Privacy by design** — no analytics or telemetry. Data stays on your machine.
3. **No silent data loss** — transactional writes, integrity check on start, automatic backups, JSON export.
4. **Deterministic SRS** — same answers always give the same next review date.
5. **Progressive disclosure** — complex features are behind secondary actions; the main flow is one click.

## Install

| OS | Artifact |
|----|----------|
| macOS | `Lexora_<version>_universal.dmg` (Intel + Apple Silicon; separate aarch64 / x64 builds also exist). If Gatekeeper blocks the app, run `Разрешить Lexora.command` from the DMG. |
| Windows | `Lexora_<version>_x64-setup.exe` (NSIS, per-user, no admin rights). |
| Linux | AppImage / deb (experimental). |

Releases and signing: see [docs/release.md](./docs/release.md).

On first launch a setup wizard picks an AI model package for you (a free Google Gemini key is recommended, or run with no keys at all).

## Development

Requirements: Node.js 18+, Rust stable, Xcode Command Line Tools (macOS).

```bash
npm install

npm run tauri dev             # run the app (frontend + Rust backend)
bash scripts/install-mac.sh   # build and install Lexora.app into /Applications (macOS, no DMG)
npm run typecheck             # tsc --noEmit
npm run lint                  # eslint, --max-warnings 0
npm run test                  # vitest
npm run test:e2e              # Playwright (mocked Tauri IPC)
cd src-tauri && cargo test    # Rust tests (SRS, repositories)
```

### Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | Tauri 2.x |
| Frontend | React 18 + TypeScript 5 (strict) |
| State | Zustand 5 (UI) + TanStack Query v5 (server state) |
| Routing | React Router v6 (HashRouter) |
| Styles | Vanilla CSS + CSS Custom Properties (`src/styles/tokens.css`) |
| Backend | Rust (edition 2021) |
| Database | SQLite via rusqlite |
| Build | Vite |

### Repository layout

```
src/            # React frontend
  pages/        # vocabulary, study, writing, translate, pronunciation, dialogue, collections, stats, settings
  components/   # ui/ (Button, Badge, ...) and domain components
  hooks/        # TanStack Query hooks
  stores/       # Zustand stores — UI state only
  lib/          # ipc.ts (all invoke() calls), types.ts, constants.ts, utils.ts
  popup/        # popup translator (separate entry point, popup.html)
  stickers/     # desktop stickers (separate entry point, sticker.html)
  grammar/      # badge & panel for "writing check in other apps"
src-tauri/      # Rust backend: commands/, db/, providers/, srs/, hotkeys, tray
docs/           # release notes, audits, user guide
```

Development rules, stack and architecture decisions are fixed in [AGENTS.md](./AGENTS.md) — the project constitution. Read it before making changes.

## Global hotkeys and permissions

- **`CmdOrCtrl+Shift+L`** — translate selected text in any app (opens the popup translator).
- **`CmdOrCtrl+Shift+S`** — show / hide desktop stickers.
- On macOS, capturing the selection needs the **Accessibility** permission: System Settings → Privacy & Security → Accessibility → enable Lexora (with `npm run tauri dev` use the binary `src-tauri/target/debug/lexora`, not the app in `/Applications`). Without it the hotkey still opens the popup, but the selected text may not be filled in.
- The microphone permission is needed for Speak, Dialogue and speech translation.

Hotkeys can be changed in Settings → Global Shortcuts.

## Writing check in other apps ("like Grammarly")

Settings → **Writing check in other apps** (off by default; macOS and Windows):

- Lexora watches the text field you are typing in. After a ~0.7 s pause the text is sent to your AI provider for a check in your learning language; a badge with the number of suggestions appears at the corner of the field.
- Click the badge to see fix cards. **Apply** changes the text right in the field (first only the changed fragment via Accessibility, preserving formatting and the app's undo; if the app refuses writes, via the clipboard). If you changed the text after the check, the fix is not applied.
- Not read: password fields, search fields, apps on the exclusion list (password managers, terminals, IDEs — editable in settings), text not in your learning language. Checks are not stored in the database.
- Requires the same **Accessibility** permission as the hotkey.
- Code: `src-tauri/src/grammar_watch/` (watcher; pure logic in `logic.rs`), badge window — `src/grammar/`.

## AI providers

Pick a package in Settings → AI models, or configure each role manually. API keys can be entered in the UI (stored via `tauri-plugin-store`) or set as environment variables:

| Provider | Environment variables | Audio support |
|----------|-----------------------|---------------|
| OpenAI | `OPENAI_API_KEY` | ✅ (Whisper API) |
| Google Gemini | `GEMINI_API_KEY` | ✅ (native) |
| Anthropic Claude | `ANTHROPIC_API_KEY` | ❌ (text only) |
| Cloudflare Workers AI | `CLOUDFLARE_API_KEY`, `CLOUDFLARE_ACCOUNT_ID` | ❌ |
| OpenRouter | `OPENROUTER_API_KEY` | model-dependent |
| Groq | `GROQ_API_KEY` | model-dependent |
| Custom / Ollama | `CUSTOM_API_KEY` (optional, not needed for local models) | model-dependent |

For local models (Ollama, LM Studio) choose the `custom` provider and set an OpenAI-compatible base URL, e.g. `http://localhost:11434/v1`.

## Documentation

- [User guide (PDF, English)](./docs/user-guide/Lexora-User-Guide.en.pdf) · [Russian](./docs/user-guide/Lexora-User-Guide.pdf) — every screen with screenshots, and how to configure the app.
- [Release & signing](./docs/release.md)
- [AGENTS.md](./AGENTS.md) — project constitution.
