# LEXORA — PROJECT CONSTITUTION
# Структурные правила и Industry Best Practices
# Этот файл — единственный источник истины для всех агентов и разработчиков.
# НЕЛЬЗЯ нарушать правила без явного согласования в PR-комментарии.

---

## 0. ПРИНЦИПЫ (non-negotiable)

1. **Local-first** — приложение полностью функционально без интернета (кроме AI-перевода).
2. **Privacy by design** — никаких аналитических трекеров, никакой телеметрии без явного opt-in.
3. **No silent data loss** — каждая операция записи в БД должна быть транзакционной.
4. **Deterministic SRS** — алгоритм повторений детерминирован: одни и те же входные данные дают одну и ту же дату следующего повторения.
5. **Progressive disclosure** — сложные функции скрыты за жестами/дополнительными действиями, основной сценарий — одно нажатие.

---

## 1. ТЕХНОЛОГИЧЕСКИЙ СТЕК (зафиксирован)

| Слой | Технология | Версия |
|------|-----------|--------|
| Desktop shell | Tauri | 2.x (не 1.x!) |
| Frontend | React | 18.x |
| Язык фронтенда | TypeScript | 5.x, strict mode |
| Стейт-менеджмент | Zustand | 5.x |
| Серверное состояние | TanStack Query | v5 |
| Роутинг | React Router | v6, HashRouter |
| Стили | Vanilla CSS + CSS Custom Properties | — |
| Backend язык | Rust | stable (edition 2021) |
| База данных | SQLite через rusqlite | — |
| Миграции | refinery или sql-migration | — |
| Тесты (React) | Vitest + Testing Library | — |
| Тесты (Rust) | cargo test (встроенный) | — |
| Сборка | Vite (через Tauri) | — |
| Шрифт | Inter (Google Fonts) | variable |

**ЗАПРЕЩЕНО** добавлять без обсуждения: Redux, MobX, class components, jQuery, Lodash, moment.js, any CSS framework (Tailwind, Bootstrap), any UI component library (MUI, Ant Design, Chakra).

**Согласованные исключения:**
- `src/components/ui/ErrorBoundary.tsx` — единственный допустимый class-компонент: в React 18 error boundary (`getDerivedStateFromError` / `componentDidCatch`) не имеет hook-аналога. Новые class-компоненты по-прежнему запрещены.

---

## 2. СТРУКТУРА РЕПОЗИТОРИЯ

```
Lexora/
├── src-tauri/                  # Rust backend
│   ├── src/
│   │   ├── commands/           # Tauri IPC: по одному файлу на домен
│   │   │   ├── vocabulary.rs
│   │   │   ├── translate.rs
│   │   │   ├── study.rs
│   │   │   ├── media.rs
│   │   │   ├── collections.rs
│   │   │   ├── stats.rs
│   │   │   ├── export_import.rs
│   │   │   └── settings.rs
│   │   ├── db/
│   │   │   ├── mod.rs
│   │   │   ├── backup.rs       # Integrity check, recovery, backups (M6)
│   │   │   ├── schema.sql      # Master schema
│   │   │   ├── migrations/     # V001__init.sql, V002__add_fts.sql ...
│   │   │   └── repos/          # Один файл = один репозиторий
│   │   │       ├── lexeme.rs
│   │   │       ├── vocabulary.rs
│   │   │       ├── review.rs
│   │   │       ├── collection.rs
│   │   │       └── settings.rs
│   │   ├── providers/          # AI / TTS / media провайдеры
│   │   │   ├── mod.rs          # Трейты
│   │   │   ├── ai/
│   │   │   │   ├── openai.rs
│   │   │   │   └── gemini.rs
│   │   │   ├── tts/
│   │   │   │   ├── system.rs   # OS TTS
│   │   │   │   └── openai_tts.rs
│   │   │   └── media/
│   │   │       ├── unsplash.rs
│   │   │       └── giphy.rs
│   │   ├── srs/
│   │   │   ├── algorithm.rs    # SM-2 + adaptive
│   │   │   ├── queue.rs        # Review queue builder
│   │   │   └── evaluator.rs    # Answer grading
│   │   ├── hotkeys.rs
│   │   ├── tray.rs
│   │   ├── popup.rs
│   │   ├── stickers.rs
│   │   ├── api_keys.rs         # Хранение API-ключей (tauri-plugin-store ↔ env)
│   │   ├── error.rs            # AppError enum (единый)
│   │   └── main.rs
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── build.rs
│
├── src/                        # React frontend
│   ├── pages/
│   │   ├── vocabulary/
│   │   │   ├── VocabularyPage.tsx
│   │   │   ├── WordDetail.tsx
│   │   │   └── vocabulary.css
│   │   ├── study/
│   │   │   ├── StudyPage.tsx
│   │   │   ├── modes/          # flashcard.tsx, typing.tsx, cloze.tsx ...
│   │   │   └── study.css
│   │   ├── collections/
│   │   ├── stats/
│   │   └── settings/
│   ├── components/             # Только переиспользуемые компоненты
│   │   ├── ui/                 # Базовые: Button, Input, Modal, Badge...
│   │   └── domain/             # Доменные: WordCard, AudioButton, FreqBadge...
│   ├── popup/                  # Popup-переводчик (отдельная точка входа)
│   │   ├── PopupApp.tsx
│   │   ├── PopupTranslator.tsx
│   │   └── popup.css
│   ├── stickers/               # Desktop stickers (отдельная точка входа)
│   │   ├── StickerApp.tsx
│   │   └── sticker.css
│   ├── stores/
│   │   ├── vocabularyStore.ts
│   │   ├── settingsStore.ts
│   │   └── sessionStore.ts
│   ├── hooks/                  # Все TanStack Query хуки
│   │   ├── useVocabulary.ts
│   │   ├── useTranslate.ts
│   │   ├── useStudyQueue.ts
│   │   └── useSettings.ts
│   ├── lib/
│   │   ├── ipc.ts              # Typed wrappers для invoke()
│   │   ├── utils.ts
│   │   └── constants.ts
│   ├── test/                   # Vitest setup и моки Tauri API
│   │   ├── setup.ts
│   │   ├── mocks.ts
│   │   └── render.tsx
│   ├── styles/
│   │   ├── tokens.css          # CSS Custom Properties (единственный источник цветов/отступов)
│   │   ├── typography.css
│   │   ├── animations.css
│   │   └── global.css
│   ├── App.tsx
│   ├── main.tsx                # Основное окно
│   ├── popup.tsx               # Точка входа popup-окна
│   └── sticker.tsx             # Точка входа sticker-окна
│
├── scripts/
│   └── seed/
│       ├── import_frequency.py
│       ├── import_phrasal.py
│       ├── import_irregular.py
│       └── data/               # CSV-файлы с данными
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── release.yml
│
├── AGENTS.md                   # ← этот файл
├── package.json
├── vite.config.ts
├── tsconfig.json
└── .eslintrc.json
```

---

## 3. RUST — ПРАВИЛА КОДА

### 3.1 Обработка ошибок
```rust
// ✅ ПРАВИЛЬНО: единый AppError enum
#[derive(Debug, thiserror::Error, serde::Serialize)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(String),
    #[error("AI provider error: {0}")]
    Provider(String),
    #[error("Not found: {0}")]
    NotFound(String),
    #[error("Invalid input: {0}")]
    Validation(String),
}

// Все команды возвращают Result<T, AppError>
#[tauri::command]
pub async fn get_word(id: i64, db: State<'_, DbPool>) -> Result<LexemeDto, AppError> { ... }

// ❌ ЗАПРЕЩЕНО: .unwrap(), .expect() в production-коде
// ❌ ЗАПРЕЩЕНО: String как тип ошибки в Result<T, String>
```

### 3.2 Структура команд
```rust
// Каждая команда принимает State<DbPool> и/или State<Arc<ProviderRegistry>>
// Бизнес-логика — в отдельных функциях, команда — тонкий адаптер
#[tauri::command]
pub async fn add_to_vocabulary(
    input: AddVocabularyInput,
    db: State<'_, DbPool>,
    providers: State<'_, Arc<ProviderRegistry>>,
) -> Result<VocabularyEntryDto, AppError> {
    vocabulary::add_entry(&db, &providers, input).await
}
```

### 3.3 База данных
```rust
// ✅ Всегда использовать транзакции для мутаций
// ✅ Параметризованные запросы — никогда не форматировать SQL со строками пользователя
// ✅ Индексы обязательны для всех колонок JOIN и WHERE условий
// ✅ Нормализованный текст (lowercase, trim) в normalized_text для поиска
```

### 3.4 Async
```rust
// ✅ tokio::spawn для фоновых задач
// ✅ Arc<Mutex<T>> только там, где действительно нужна shared mutability
// ✅ Предпочитать Arc<RwLock<T>> для read-heavy данных
```

### 3.5 Именование
- Файлы: `snake_case.rs`
- Типы/трейты: `PascalCase`
- Функции/переменные: `snake_case`
- Константы: `SCREAMING_SNAKE_CASE`
- DTO-структуры суффиксом: `LexemeDto`, `AddVocabularyInput`

---

## 4. TYPESCRIPT / REACT — ПРАВИЛА КОДА

### 4.1 TypeScript конфигурация (строгая)
```json
// tsconfig.json — обязательные флаги
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### 4.2 Компоненты
```tsx
// ✅ Функциональные компоненты + именованный экспорт
// ✅ Props — отдельный тип сверху файла
// ✅ Один компонент = один файл
// ❌ ЗАПРЕЩЕНО: React.FC<Props> (скрывает children-тип)
// ❌ ЗАПРЕЩЕНО: default export для компонентов (кроме pages/)
// ❌ ЗАПРЕЩЕНО: inline-стили (style={{ color: 'red' }}) — только CSS-классы

type WordCardProps = {
  word: LexemeDto;
  onAddToVocabulary: (id: number) => void;
  isLoading?: boolean;
};

export function WordCard({ word, onAddToVocabulary, isLoading = false }: WordCardProps) {
  // ...
}
```

### 4.3 Хуки и состояние
```tsx
// ✅ Серверное состояние — ТОЛЬКО через TanStack Query
// ✅ UI-состояние — useState / useReducer
// ✅ Глобальное клиентское состояние — Zustand
// ❌ ЗАПРЕЩЕНО: хранить данные с сервера в Zustand-сторе

// ✅ Кастомные хуки — в src/hooks/, имя useXxx
// ✅ Каждый хук = отдельный файл
export function useVocabulary(filters: VocabularyFilters) {
  return useQuery({
    queryKey: ['vocabulary', filters],
    queryFn: () => ipc.vocabulary.list(filters),
    staleTime: 30_000,
  });
}
```

### 4.4 IPC-вызовы
```tsx
// ✅ ВСЕ invoke() обёрнуты в src/lib/ipc.ts с типизацией
// ❌ ЗАПРЕЩЕНО: вызывать invoke() напрямую в компонентах

// src/lib/ipc.ts
export const ipc = {
  vocabulary: {
    list: (filters: VocabularyFilters) =>
      invoke<LexemeDto[]>('list_vocabulary', { filters }),
    add: (input: AddVocabularyInput) =>
      invoke<VocabularyEntryDto>('add_to_vocabulary', { input }),
  },
  translate: {
    word: (input: TranslateInput) =>
      invoke<TranslationResult>('translate_text', { input }),
  },
} as const;
```

### 4.5 Именование
- Файлы компонентов: `PascalCase.tsx`
- Файлы хуков/утилит: `camelCase.ts`
- CSS файлы: `kebab-case.css` (рядом с компонентом)
- Типы/интерфейсы: `PascalCase`, без префикса `I`
- Константы: `SCREAMING_SNAKE_CASE` в `constants.ts`

### 4.6 Запреты
```tsx
// ❌ any — никогда (используй unknown + type guard)
// ❌ Non-null assertion (!) — только с комментарием-обоснованием
// ❌ as T — только с type guard или в ipc.ts
// ❌ console.log в production-коде — только import.meta.env.DEV
// ❌ useEffect для fetch данных — используй TanStack Query
// ❌ Мутация через useEffect — используй useMutation
```

---

## 5. CSS — ДИЗАЙН-СИСТЕМА

### 5.1 CSS Custom Properties (единственный источник дизайн-токенов)
```css
/* src/styles/tokens.css */
:root {
  /* Colors */
  --color-bg-primary:      #0f0f13;
  --color-bg-secondary:    #1a1a24;
  --color-bg-elevated:     #22222f;
  --color-bg-glass:        rgba(255, 255, 255, 0.06);

  --color-accent:          #6366f1;   /* Indigo */
  --color-accent-hover:    #818cf8;
  --color-accent-dim:      rgba(99, 102, 241, 0.15);

  --color-warn:            #f59e0b;   /* Amber */
  --color-success:         #10b981;
  --color-danger:          #ef4444;

  --color-text-primary:    #f1f5f9;
  --color-text-secondary:  #94a3b8;
  --color-text-muted:      #475569;

  --color-border:          rgba(255, 255, 255, 0.08);
  --color-border-focus:    var(--color-accent);

  /* Typography */
  --font-sans:   'Inter', system-ui, sans-serif;
  --font-mono:   'JetBrains Mono', 'Fira Code', monospace;

  --text-xs:     0.75rem;    /* 12px */
  --text-sm:     0.875rem;   /* 14px */
  --text-base:   1rem;       /* 16px */
  --text-lg:     1.125rem;   /* 18px */
  --text-xl:     1.25rem;    /* 20px */
  --text-2xl:    1.5rem;     /* 24px */

  /* Spacing (4px base) */
  --space-1:  0.25rem;   /* 4px  */
  --space-2:  0.5rem;    /* 8px  */
  --space-3:  0.75rem;   /* 12px */
  --space-4:  1rem;      /* 16px */
  --space-5:  1.25rem;   /* 20px */
  --space-6:  1.5rem;    /* 24px */
  --space-8:  2rem;      /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */

  /* Radius */
  --radius-sm:   6px;
  --radius-md:   10px;
  --radius-lg:   16px;
  --radius-xl:   24px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm:  0 1px 3px rgba(0,0,0,0.4);
  --shadow-md:  0 4px 16px rgba(0,0,0,0.5);
  --shadow-lg:  0 8px 32px rgba(0,0,0,0.6);
  --shadow-glass: 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1);

  /* Transitions */
  --transition-fast:   150ms ease;
  --transition-base:   200ms ease;
  --transition-slow:   350ms cubic-bezier(0.16, 1, 0.3, 1);

  /* Glass effect */
  --glass-bg:    rgba(255, 255, 255, 0.06);
  --glass-blur:  blur(20px);
  --glass-border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### 5.2 Правила стилей
```css
/* ✅ ПРАВИЛЬНО: CSS-классы через var() */
.card {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-6);
  transition: transform var(--transition-base);
}

/* ✅ Glassmorphism для popup и стикеров */
.glass-panel {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: var(--glass-border);
  box-shadow: var(--shadow-glass);
}

/* ✅ Анимации через @keyframes, никогда через JS setInterval */
@keyframes slide-up {
  from { opacity: 0; transform: translateY(8px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0)   scale(1);    }
}

/* ✅ Hover и focus всегда вместе (accessibility) */
.button:hover,
.button:focus-visible {
  background: var(--color-accent-hover);
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* ❌ ЗАПРЕЩЕНО: магические числа без переменных */
/* ❌ ЗАПРЕЩЕНО: !important */
/* ❌ ЗАПРЕЩЕНО: inline-стили в JSX */
```

---

## 6. БАЗА ДАННЫХ — ПРАВИЛА СХЕМЫ

### 6.1 Соглашения
```sql
-- ✅ Всегда snake_case для таблиц и колонок
-- ✅ Первичный ключ: id INTEGER PRIMARY KEY
-- ✅ Временны́е метки: created_at DATETIME DEFAULT (unixepoch())
-- ✅ Булевы значения: 0/1 (SQLite не имеет BOOLEAN)
-- ✅ Мягкое удаление: deleted_at DATETIME вместо DELETE
-- ✅ Нормализованный текст в normalized_text для поиска (LOWER + TRIM)

CREATE TABLE lexeme (
    id              INTEGER PRIMARY KEY,
    language_id     INTEGER NOT NULL REFERENCES language(id),
    text            TEXT    NOT NULL,
    normalized_text TEXT    NOT NULL,         -- LOWER(TRIM(text))
    part_of_speech  TEXT,                     -- 'noun'|'verb'|'adj'|...
    frequency_rank  INTEGER,
    created_at      DATETIME DEFAULT (unixepoch()),
    updated_at      DATETIME DEFAULT (unixepoch()),
    UNIQUE(language_id, normalized_text)      -- deduplication constraint
);

-- ✅ Индексы обязательны для всех WHERE/JOIN колонок
CREATE INDEX idx_lexeme_language_text ON lexeme(language_id, normalized_text);
```

### 6.2 Миграции
- Файлы: `V001__init_schema.sql`, `V002__add_fts.sql` — строго порядковые
- Миграции только additive (нельзя DROP без migration + backfill)
- Каждая миграция — идемпотентная (`CREATE TABLE IF NOT EXISTS`)

---

## 7. SRS АЛГОРИТМ — ДЕТЕРМИНИЗМ

```rust
// Реализация SM-2 должна быть чистой функцией (без side effects)
pub fn calculate_next_review(state: &ReviewState, grade: Grade) -> ReviewState {
    // grade: 0=blackout, 1=wrong, 2=hard, 3=good, 4=easy
    // Детерминировано: те же inputs → те же outputs
}

// ✅ Юнит-тест для каждого случая grade × state
// ✅ Граничные условия: первое повторение, после blackout, mature слово
```

---

## 8. AI ПРОВАЙДЕРЫ — АБСТРАКЦИЯ

```rust
// Трейт — единственный контракт. Все провайдеры реализуют его.
#[async_trait]
pub trait AIProvider: Send + Sync {
    async fn translate(&self, req: TranslateRequest) -> Result<TranslationResult, AppError>;
    async fn evaluate_answer(&self, req: EvaluateRequest) -> Result<EvaluationResult, AppError>;
    async fn explain_error(&self, req: ExplainRequest) -> Result<ExplanationResult, AppError>;
    fn provider_name(&self) -> &'static str;
}

// ProviderRegistry — хранит активный провайдер и fallback
pub struct ProviderRegistry {
    primary: Arc<dyn AIProvider>,
    fallback: Option<Arc<dyn AIProvider>>,
}
```

**Промпты:** Хранятся в `src-tauri/src/providers/ai/prompts/` как отдельные `.txt`-файлы, версионируемые. Не встраивать в код.

---

## 9. БЕЗОПАСНОСТЬ

- **API-ключи:** Хранить через `tauri-plugin-store` (зашифрованное хранилище ОС), никогда в plain-text файлах
- **SQL injection:** Только параметризованные запросы (rusqlite params![])
- **XSS:** DOMPurify при любом рендере HTML из внешних источников
- **CSP:** Настроен в `tauri.conf.json` — запрещён `unsafe-eval`
- **Сетевые запросы:** Разрешены только явно перечисленные домены в `allowlist`

---

## 10. ACCESSIBILITY (A11y — обязательно)

```tsx
// ✅ Каждый интерактивный элемент имеет aria-label или видимый текст
// ✅ focus-visible стили для всех интерактивных элементов
// ✅ role="button" + onKeyDown для кастомных clickable-элементов
// ✅ aria-live="polite" для динамически обновляемых регионов (счётчик карточек)
// ✅ prefers-reduced-motion: убирать анимации
// ✅ Минимальный контраст текста: 4.5:1 (WCAG AA)
// ✅ Размер touch-target: минимум 44×44px
```

---

## 11. ПРОИЗВОДИТЕЛЬНОСТЬ

- **Виртуализация списков:** `@tanstack/react-virtual` для Vocabulary (>200 строк)
- **Lazy loading:** `React.lazy()` для страниц, не используемых при старте
- **Мемоизация:** `useMemo` / `useCallback` только с профилированием, не «на всякий случай»
- **SQLite:** `PRAGMA journal_mode=WAL` для concurrent reads, `PRAGMA synchronous=NORMAL`
- **Медиа-кэш:** Изображения кэшируются локально навсегда (immutable по хэшу)
- **TTS-кэш:** Аудио по хэшу от `(text, voice, speed)` — никогда не запрашивать дважды

---

## 12. ТЕСТИРОВАНИЕ (coverage targets)

| Область | Минимальный покрытие |
|---------|---------------------|
| SRS algorithm | 100% (чистая функция) |
| DB repositories | 80%+ |
| AI provider abstraction | 70%+ |
| React components (критические) | 60%+ |
| E2E главных сценариев | 3 обязательных: add word, study session, popup translate |

---

## 13. GIT — СОГЛАШЕНИЯ

### Ветки
```
main          — стабильная ветка, только через PR
dev           — интеграционная ветка
feat/a1-foundation
feat/a2-data
feat/a3-os-integration
...
```

### Коммиты (Conventional Commits)
```
feat(popup): add glassmorphism animation on appear
fix(srs): correct interval calculation after blackout
refactor(db): extract lexeme normalization to shared fn
test(srs): add edge cases for mature word scheduling
chore(deps): update tauri to 2.x
```

---

## 14. CODE REVIEW CHECKLIST

Перед каждым PR убедиться:
- [ ] Нет `unwrap()` / `expect()` без обоснования
- [ ] Нет `any` в TypeScript
- [ ] Нет магических чисел (только через CSS vars или Rust константы)
- [ ] Все новые компоненты имеют `aria-label` / семантику
- [ ] Новые SQL-запросы имеют соответствующие индексы
- [ ] `cargo clippy` — без предупреждений
- [ ] `tsc --noEmit` — без ошибок
- [ ] `npm run lint` — без ошибок
- [ ] Новая функциональность покрыта тестами

---

*Версия: 1.0 | Дата: 2026-08-20 | Статус: КОНСТИТУЦИЯ ПРОЕКТА — изменения только через PR с обсуждением*
