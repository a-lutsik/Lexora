// Съёмка скриншотов для руководства пользователя (docs/user-guide).
// Запуск: npx playwright test -c docs/user-guide/playwright.config.ts
import { test, type Page } from '@playwright/test';
import { mockTauriIpc, MOCK_VOCABULARY_ENTRY, DEFAULT_IPC_RESPONSES } from '../../e2e/helpers/tauri-mock';

const OUT = 'docs/user-guide/shots';
const NOW = Math.floor(Date.now() / 1000);

const WORDS: Array<[string, string, string, string, number, string, number]> = [
  ['apple', 'яблоко', 'noun', '/ˈæp.əl/', 500, 'mature', 40],
  ['negotiate', 'вести переговоры', 'verb', '/nɪˈɡoʊ.ʃi.eɪt/', 1800, 'review', 3],
  ['reliable', 'надёжный', 'adj', '/rɪˈlaɪ.ə.bəl/', 1500, 'learning', 1],
  ['give up', 'сдаваться', 'phrasal verb', '/ɡɪv ʌp/', 900, 'learning', 1],
  ['schedule', 'расписание', 'noun', '/ˈʃedʒ.uːl/', 700, 'review', 6],
  ['throughout', 'на протяжении', 'prep', '/θruːˈaʊt/', 1200, 'new', 0],
  ['deadline', 'крайний срок', 'noun', '/ˈded.laɪn/', 1100, 'new', 0],
  ['reluctant', 'неохотный', 'adj', '/rɪˈlʌk.tənt/', 3200, 'learning', 2],
  ['look forward to', 'с нетерпением ждать', 'phrasal verb', '/lʊk ˈfɔːr.wɚd tuː/', 800, 'review', 8],
  ['thorough', 'тщательный', 'adj', '/ˈθɝː.oʊ/', 2600, 'mature', 30],
  ['approach', 'подход', 'noun', '/əˈproʊtʃ/', 600, 'mature', 25],
  ['owe', 'быть должным', 'verb', '/oʊ/', 2100, 'new', 0],
];

function entry(i: number) {
  const w = WORDS[i]!;
  const base = MOCK_VOCABULARY_ENTRY;
  return {
    ...base,
    id: i + 1,
    lexemeId: i + 1,
    isFavorite: i === 1,
    notes: i === 0 ? 'Запоминалка: an apple a day…' : null,
    lexeme: { ...base.lexeme, id: i + 1, text: w[0], normalizedText: w[0], partOfSpeech: w[2], phonetic: w[3], frequencyRank: w[4] },
    translations: [{ ...base.translations[0], id: i + 1, lexemeId: i + 1, translatedText: w[1] }],
    examples: [{ ...base.examples[0], id: i + 1, lexemeId: i + 1, sentence: `We need to ${w[0]} this week.`, translation: null }],
    reviewState: { ...base.reviewState, id: i + 1, userVocabularyId: i + 1, status: w[5], interval: w[6], repetitions: w[6] > 0 ? 3 : 0, dueAt: NOW + (w[6] > 0 ? 86400 * (i % 4) - 3600 : 0) },
  };
}
const ENTRIES = WORDS.map((_, i) => entry(i));

const today = new Date();
const ACTIVITY = Array.from({ length: 30 }, (_, k) => {
  const d = new Date(today.getTime() - (29 - k) * 86400000);
  const reviewed = k % 7 === 6 ? 0 : 8 + ((k * 7) % 25);
  return { date: d.toISOString().slice(0, 10), reviewed, added: k % 5 === 0 ? 4 : k % 3 === 0 ? 2 : 0, accuracy: 70 + ((k * 3) % 25) };
});

const RICH: Record<string, unknown> = {
  list_vocabulary: ENTRIES,
  count_vocabulary: ENTRIES.length,
  get_study_queue: ENTRIES.slice(1, 6),
  get_due_count: 5,
  get_stats_summary: { totalWords: 248, dueToday: 5, streak: 12, accuracyPercent: 86, wordsAddedThisWeek: 21, matureCount: 64 },
  get_daily_activity: ACTIVITY,
  get_words_added_stats: { today: 4, thisWeek: 21, thisMonth: 67, total: 248 },
  get_hardest_words: [
    { entryId: 8, text: 'reluctant', translation: 'неохотный', lapses: 5, totalReviews: 14, accuracyPercent: 43 },
    { entryId: 2, text: 'negotiate', translation: 'вести переговоры', lapses: 4, totalReviews: 12, accuracyPercent: 52 },
    { entryId: 10, text: 'thorough', translation: 'тщательный', lapses: 3, totalReviews: 10, accuracyPercent: 60 },
  ],
  list_collections: (DEFAULT_IPC_RESPONSES.list_collections as Array<Record<string, unknown>>).map((c, i) =>
    i === 0 ? { ...c, wordCount: 5000, loadStatus: 'ready', isActive: true }
    : i === 1 ? { ...c, wordCount: 142, loadStatus: 'ready', isActive: true }
    : i === 2 ? { ...c, wordCount: 114, loadStatus: 'ready', isActive: false }
    : c),
};

async function open(page: Page, hash: string, extra: Record<string, unknown> = {}) {
  await mockTauriIpc(page, { ...RICH, ...extra });
  await page.goto(hash);
  await page.waitForTimeout(1300);
}
const shot = async (page: Page, name: string) => {
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${OUT}/${name}.png` });
};


test('onboarding', async ({ page }) => {
  await open(page, '/#/vocabulary', {
    get_settings: {
      primaryLanguage: 'en', interfaceLanguage: 'en', customBaseUrl: null, cloudflareAccountId: null,
      ttsVoice: 'default', stickerCount: 2, stickerOpacity: 0.9, stickerSources: ['all'],
      quietHoursStart: null, quietHoursEnd: null, offlineMode: false, writingPrivacyMode: false,
      writingAutoCheck: false, fallbackEnabled: true, hotkeyTranslate: 'CmdOrCtrl+Shift+L', hotkeyStickers: 'CmdOrCtrl+Shift+S',
    },
  });
  await shot(page, 'onboarding-1');
  await page.getByRole('button', { name: 'Выбрать сценарий: Бесплатно' }).click();
  await shot(page, 'onboarding-2');
});

test('vocabulary', async ({ page }) => {
  await open(page, '/#/vocabulary');
  await shot(page, 'vocabulary');
  await page.getByRole('button', { name: 'More add options' }).click();
  await shot(page, 'vocabulary-add-menu');
  await page.getByRole('menuitem', { name: 'Add one' }).click();
  await shot(page, 'vocabulary-add-word');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: 'More add options' }).click();
  await page.getByRole('menuitem', { name: 'Paste list' }).click();
  await page.getByLabel('Word list, one per line').fill('negotiate\nreliable\ngive up\nschedule');
  await shot(page, 'vocabulary-bulk');
  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.getByRole('button', { name: 'Show Learning words' }).click();
  await shot(page, 'vocabulary-filter');
  await page.getByRole('button', { name: 'Show All words' }).click();
  await page.getByRole('button', { name: 'Open details for apple' }).click();
  await page.waitForTimeout(800);
  await shot(page, 'vocabulary-detail');
});

test('study', async ({ page }) => {
  await open(page, '/#/study');
  await shot(page, 'study-overview');
  await page.getByRole('radio', { name: /Flashcards/ }).click();
  await page.getByRole('button', { name: /^Start Session/ }).click();
  await page.waitForTimeout(800);
  await shot(page, 'study-flashcard');
  await page.getByRole('button', { name: 'Show translation' }).click().catch(() => undefined);
  await page.waitForTimeout(500);
  await shot(page, 'study-flashcard-back');
  await page.getByRole('button', { name: 'Back to Study Overview' }).click().catch(() => undefined);

  for (const [mode, name] of [['Typing Mode', 'typing'], ['Fill the Gap', 'cloze'], ['Listening', 'listening'], ['Irregular Verbs', 'irregular'], ['Definition', 'definition'], ['Speaking', 'speaking'], ['Image Association', 'image']] as const) {
    await page.goto('/#/study');
    await page.reload();
    await page.waitForTimeout(900);
    await page.getByRole('radio', { name: new RegExp(mode) }).click();
    await page.getByRole('button', { name: /^Start Session/ }).click();
    await page.waitForTimeout(1100);
    await shot(page, `study-${name}`);
  }
});

test('writing', async ({ page }) => {
  await open(page, '/#/writing');
  await shot(page, 'writing-empty');
  await page.locator('textarea#writing-input').fill('She go to school yesterday.');
  await page.getByRole('button', { name: 'Check writing' }).click();
  await page.waitForTimeout(900);
  await shot(page, 'writing-result');
  await page.locator('textarea#writing-input').fill('Can you please check this as soon as possible?');
  await page.getByRole('button', { name: 'Rewrite text' }).click();
  await page.waitForTimeout(900);
  await shot(page, 'writing-rewrite');
});

test('translate', async ({ page }) => {
  await open(page, '/#/translate');
  await page.getByRole('textbox', { name: 'Source text to translate' }).fill('Artificial Intelligence is revolutionizing language learning.');
  await page.getByRole('button', { name: 'Translate text' }).click();
  await page.waitForTimeout(1000);
  await shot(page, 'translate-text');
  await page.getByRole('tab', { name: /Image & Photo/i }).click();
  await shot(page, 'translate-image');
  await page.locator('input[type="file"][accept*="image"]').setInputFiles('docs/user-guide/sign.png');
  await page.waitForTimeout(1200);
  await shot(page, 'translate-image-result');
  await page.getByRole('tab', { name: /Document/i }).click();
  await shot(page, 'translate-document');
  await page.getByRole('tab', { name: /Speech & Audio/i }).click();
  await shot(page, 'translate-audio');
  await page.getByRole('tab', { name: /Live Interpreter/i }).click();
  await shot(page, 'translate-live');
  await page.getByRole('tab', { name: /History/i }).click();
  await shot(page, 'translate-history');
});

test('pronunciation', async ({ page }) => {
  await open(page, '/#/pronunciation');
  await page.locator('input#pron-target').fill('thorough');
  await shot(page, 'pron-practice');
  await page.getByRole('tab', { name: 'Shadowing' }).click();
  await shot(page, 'pron-shadowing');
  await page.getByRole('tab', { name: 'Minimal pairs' }).click();
  await shot(page, 'pron-pairs');
  await page.getByRole('tab', { name: 'History' }).click();
  await shot(page, 'pron-history');
});

test('dialogue', async ({ page }) => {
  await open(page, '/#/dialogue');
  await shot(page, 'dialogue');
});

test('collections', async ({ page }) => {
  await open(page, '/#/collections');
  await shot(page, 'collections');
  await page.getByRole('button', { name: 'Create new collection' }).click();
  await page.getByLabel('Collection name').fill('Work emails');
  await shot(page, 'collections-new');
});

test('stats', async ({ page }) => {
  await open(page, '/#/stats');
  await shot(page, 'stats');
});

test('settings', async ({ page }) => {
  await open(page, '/#/settings');
  await shot(page, 'settings-top');
  for (const id of ['settings-ai-models', 'settings-ai-usage', 'settings-language', 'settings-privacy', 'settings-writing-check', 'settings-stickers', 'settings-shortcuts', 'settings-backup']) {
    const el = page.locator(`#${id}`);
    if ((await el.count()) === 0) { console.log('missing', id); continue; }
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    await el.screenshot({ path: `${OUT}/${id}.png` });
  }
  await page.getByRole('button', { name: /Сменить сценарий/ }).first().click().catch(() => undefined);
  await page.waitForTimeout(500);
  await shot(page, 'settings-wizard');
});

test('popup and stickers', async ({ page }) => {
  await page.setViewportSize({ width: 520, height: 640 });
  await open(page, '/popup.html');
  await page.getByRole('textbox', { name: 'Translate query' }).fill('apple');
  await page.getByRole('button', { name: 'Translate' }).click();
  await page.waitForTimeout(1000);
  await shot(page, 'popup');
  const p2 = await page.context().newPage();
  await p2.setViewportSize({ width: 380, height: 300 });
  await mockTauriIpc(p2, RICH);
  await p2.goto('/sticker.html');
  await p2.waitForTimeout(1200);
  await p2.screenshot({ path: `${OUT}/sticker.png` });
  await p2.getByRole('button', { name: 'Toggle translation visibility' }).click().catch(() => undefined);
  await p2.waitForTimeout(400);
  await p2.screenshot({ path: `${OUT}/sticker-open.png` });
});

test('grammar watch badge and panel', async ({ page }) => {
  const TEXT = 'She dont like apples and she go home yesterday.';
  const issue = (id: number, f: string, fix: string, start: number, category: string, why: string) => ({
    id, writingCheckId: 0, category, severity: 'error', originalFragment: f, suggestedFix: fix,
    explanation: why, ruleHint: null, offsetStart: start, offsetEnd: start + f.length, status: 'pending',
  });
  const CHECK = {
    id: 0, originalText: TEXT, correctedText: null, language: 'en', issueCount: 2, acceptedCount: 0, rejectedCount: 0,
    overallScore: 70, summary: null, rewriteMode: null, createdAt: 0,
    issues: [
      issue(1, 'dont', "doesn't", 4, 'grammar', 'Third person singular takes “doesn’t”.'),
      issue(2, 'go', 'went', 29, 'tense', '“Yesterday” needs the past tense.'),
    ],
  };
  const FIELD = { kind: 'check', fieldId: 1, text: TEXT, appName: 'Mail', bundleId: 'com.apple.mail' };
  await mockTauriIpc(page, RICH);
  await page.addInitScript((d: { check: unknown; field: unknown }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const base = w.__TAURI_INTERNALS__.invoke;
    w.__TAURI_INTERNALS__.invoke = async (cmd: string, args?: unknown) => {
      if (cmd === 'get_grammar_field') return d.field;
      if (cmd === 'check_writing') return d.check;
      if (['set_grammar_panel_open', 'snooze_grammar_field', 'apply_grammar_fix'].includes(cmd)) return null;
      return base(cmd, args);
    };
  }, { check: CHECK, field: FIELD });
  await page.setViewportSize({ width: 44, height: 44 });
  await page.goto('/grammar.html');
  await page.getByRole('button', { name: '2 writing suggestions — open' }).waitFor();
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/grammar-badge.png` });
  await page.getByRole('button', { name: '2 writing suggestions — open' }).click();
  await page.setViewportSize({ width: 400, height: 460 });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/grammar-panel.png` });
});
