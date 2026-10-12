# LEXORA

**Lexora** — desktop-приложение для изучения иностранных языков с AI-ассистентом.
Локальное-first: словарь, SRS-повторения и статистика работают полностью офлайн;
интернет нужен только для AI-перевода.

Текущий этап — **Этап 1: Vocabulary**: словарь с поиском и фильтрами, добавление
слов, popup-переводчик по глобальному хоткею, desktop-стикеры для фонового
повторения, настройки AI-провайдеров.

> Правила разработки, стек и архитектурные решения зафиксированы в
> [AGENTS.md](./AGENTS.md) — конституции проекта. Перед любыми изменениями
> читайте её.

## Стек

| Слой | Технология |
|------|-----------|
| Desktop shell | Tauri 2.x |
| Frontend | React 18 + TypeScript 5 (strict) |
| Стейт | Zustand 5 (UI) + TanStack Query v5 (серверное состояние) |
| Роутинг | React Router v6 (HashRouter) |
| Стили | Vanilla CSS + CSS Custom Properties (`src/styles/tokens.css`) |
| Backend | Rust (edition 2021) |
| База данных | SQLite через rusqlite |
| Сборка | Vite |

## Структура репозитория

```
src/            # React frontend
  pages/        # vocabulary, study, collections, stats, settings
  components/   # ui/ (Button, Badge, ...) и domain-компоненты
  hooks/        # TanStack Query хуки (useVocabulary, useSettings, ...)
  stores/       # Zustand-сторы — только UI-состояние
  lib/          # ipc.ts (все invoke()), types.ts, constants.ts, utils.ts
  popup/        # Popup-переводчик (отдельная точка входа, popup.html)
  stickers/     # Desktop-стикеры (отдельная точка входа, sticker.html)
src-tauri/      # Rust backend: commands/, db/, providers/, srs/, hotkeys, tray
```

## Разработка

Требования: Node.js 18+, Rust stable, Xcode Command Line Tools (macOS).

```bash
npm install

npm run tauri dev     # запуск приложения (frontend + Rust backend)
bash scripts/install-mac.sh   # собрать и установить Lexora.app в /Applications (macOS, без DMG)
npm run typecheck     # tsc --noEmit
npm run lint          # eslint, --max-warnings 0
npm run test          # vitest
cd src-tauri && cargo test   # тесты Rust (SRS, репозитории)
```

## Глобальный хоткей и permissions

- **`CmdOrCtrl+Shift+L`** — перевести выделенный текст в любом приложении
  (открывает popup-переводчик).
- Для захвата выделения на macOS приложению нужно разрешение
  **Accessibility**: System Settings → Privacy & Security → Accessibility →
  включить Lexora (при `npm run tauri dev` — бинарь
  `src-tauri/target/debug/lexora`, не приложение из `/Applications`).
  Без разрешения хоткей откроет popup, но выделенный текст может не попасть
  в поле перевода. При первом использовании macOS покажет системный диалог.

## Проверка текста в других приложениях («как Grammarly»)

Settings → **Writing check in other apps** (по умолчанию выключено, только macOS):

- Lexora следит за текстовым полем, в котором вы печатаете в любом приложении.
  Через ~1,2 с после паузы текст уходит AI-провайдеру на проверку на изучаемом
  языке; в углу поля появляется бейдж с числом замечаний.
- Клик по бейджу → карточки с исправлениями; **Apply** меняет текст прямо в
  поле (сначала только изменённый фрагмент через Accessibility — сохраняются
  форматирование и undo приложения; если приложение не принимает запись —
  вставка через буфер обмена). Если вы успели изменить текст после проверки,
  исправление не применяется.
- Не читаются: поля паролей, поисковые поля, приложения из списка исключений
  (менеджеры паролей, терминалы, IDE — редактируется в настройках), тексты не
  на языке изучения (по алфавиту). Проверки не сохраняются в БД.
- Нужно то же разрешение **Accessibility**, что и для хоткея.
- Код: `src-tauri/src/grammar_watch/` (наблюдатель, чистая логика в
  `logic.rs`), окно бейджа — `src/grammar/`.

## AI-провайдеры

Провайдер выбирается в Settings → AI Engine & Models. API-ключи можно задать
в UI (хранятся через `tauri-plugin-store`) или через переменные окружения:

| Провайдер | Переменные окружения | Поддержка аудио |
|-----------|---------------------|----------------|
| OpenAI | `OPENAI_API_KEY` | ✅ (Whisper API) |
| Google Gemini | `GEMINI_API_KEY` | ✅ (нативная) |
| Anthropic Claude | `ANTHROPIC_API_KEY` | ❌ (только текст) |
| Cloudflare Workers AI | `CLOUDFLARE_API_KEY`, `CLOUDFLARE_ACCOUNT_ID` | ❌ |
| OpenRouter | `OPENROUTER_API_KEY` | зависит от модели |
| Groq | `GROQ_API_KEY` | зависит от модели |
| Custom / Ollama | `CUSTOM_API_KEY` (опционально, для локальных моделей не нужен) | зависит от модели |

Для локальных моделей (Ollama, LM Studio) выберите провайдер `custom` и укажите
OpenAI-compatible base URL (например, `http://localhost:11434/v1`).
