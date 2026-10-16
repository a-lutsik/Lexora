# Interface localization

The interface locale is independent of learning and translation languages. It is
saved immediately in `lexora-interface-locale` in localStorage. All app entry
points load the same runtime; storage events synchronize windows. Default locale:
English. No network calls or API keys are used for localization.

Use `const { t, locale } = useI18n()` in components. Use whole messages and named
values, e.g. `t('Study, {count} due', { count })`. Keep IPC identifiers, CSS classes,
model IDs, study examples and user content unchanged. Use `dir="auto"` for learning
content; the document direction follows the interface locale.

`INTERFACE_LANGUAGES` in `locales.ts` defines six interface languages: English,
Russian, Ukrainian, Spanish, French and Italian. The learning/translation catalog
remains separate and retains all its languages. Removed or unknown saved interface
locales fall back to English.

Each non-English locale has a JSON dictionary named after its code. `ru.json`
and the Ukrainian, Spanish, French and Italian dictionaries explicitly cover
every inventoried UI message. `en.json` supplies English fallback
for original Russian source messages. Runtime fallback remains available for unknown diagnostic/data values, but does
not count toward UI coverage.
Translations still require editorial review by native speakers.

Run `npm run i18n:audit` to enforce complete six-language coverage, matching
interpolation placeholders, and absence of raw JSX copy. CI runs this guard.
Native tray/application menus, notifications and window titles reuse these same
catalogs. The native locale is persisted separately and synchronized through typed
IPC on startup and language changes. macOS bundle permission and Services strings
have six OS localizations; the OS chooses those labels using its language settings.
Run `node scripts/i18n-audit.mjs --write` after introducing messages to refresh the
source inventory. Add full messages to catalogs; do not interpolate English plural
suffixes or translate user-provided text. Optional `word_one`/`word_few`/`word_many`
keys let `pluralize` use `Intl.PluralRules` for translated count labels.
