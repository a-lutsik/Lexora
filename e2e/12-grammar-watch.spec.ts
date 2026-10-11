// ============================================================
// LEXORA — E2E Test 12: Writing check in other apps («Grammarly mode»)
// The native macOS watcher cannot run in a browser: its events
// (field text settled, user typing) are emitted through the mocked
// Tauri event bus. Everything after that — the badge window, the
// suggestion panel, applying fixes, Settings — is the real UI.
// ============================================================

import { test, expect, type Page } from '@playwright/test';
import { mockTauriIpc } from './helpers/tauri-mock';

const TEXT = 'She dont like apples and she go home yesterday.';

function issue(id: number, fragment: string, fix: string, start: number, category: string, why: string) {
  return {
    id,
    writingCheckId: 0,
    category,
    severity: 'error',
    originalFragment: fragment,
    suggestedFix: fix,
    explanation: why,
    ruleHint: null,
    offsetStart: start,
    offsetEnd: start + fragment.length,
    status: 'pending',
  };
}

const CHECK = {
  id: 0,
  originalText: TEXT,
  correctedText: null,
  language: 'en',
  issueCount: 2,
  acceptedCount: 0,
  rejectedCount: 0,
  overallScore: 70,
  summary: null,
  rewriteMode: null,
  createdAt: 0,
  issues: [
    issue(1, 'dont', "doesn't", 4, 'grammar', 'Third person singular takes “doesn’t”.'),
    issue(2, 'go', 'went', 29, 'tense', '“Yesterday” needs the past tense.'),
  ],
};

const FIELD = {
  kind: 'check',
  fieldId: 1,
  text: TEXT,
  appName: 'Mail',
  bundleId: 'com.apple.mail',
};

type Call = { cmd: string; args: unknown };

type GrammarMockOptions = {
  field?: unknown;
  applyError?: string;
  settings?: { enabled: boolean; excludedApps: string[] };
  status?: { supported: boolean; accessibilityTrusted: boolean };
};

/**
 * On top of the shared IPC mock: records every invoke() in window.__calls
 * and answers the grammar commands statefully (settings survive updates).
 */
async function mockGrammar(page: Page, options: GrammarMockOptions = {}) {
  await mockTauriIpc(page);
  await page.addInitScript((opts: GrammarMockOptions & { check: unknown; defaultField: unknown }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const base = w.__TAURI_INTERNALS__.invoke as (cmd: string, args?: unknown) => Promise<unknown>;
    let settings = opts.settings ?? { enabled: false, excludedApps: ['com.apple.Terminal'] };
    const status = opts.status ?? { supported: true, accessibilityTrusted: true };
    w.__calls = [] as Call[];
    w.__TAURI_INTERNALS__.invoke = async (cmd: string, args?: Record<string, unknown>) => {
      if (!cmd.startsWith('plugin:')) w.__calls.push({ cmd, args });
      switch (cmd) {
        case 'get_grammar_field':
          return opts.field ?? opts.defaultField;
        case 'check_writing':
          return opts.check;
        case 'apply_grammar_fix':
          if (opts.applyError) throw new Error(opts.applyError);
          return null;
        case 'set_grammar_panel_open':
        case 'snooze_grammar_field':
        case 'request_grammar_watch_access':
          return null;
        case 'exclude_grammar_app':
          settings = { ...settings, excludedApps: [...settings.excludedApps, String(args?.bundleId)] };
          return settings;
        case 'get_grammar_watch_settings':
          return settings;
        case 'update_grammar_watch_settings':
          settings = args?.settings as typeof settings;
          return settings;
        case 'get_grammar_watch_status':
          return status;
        default:
          return base(cmd, args);
      }
    };
  }, { ...options, check: CHECK, defaultField: FIELD });
}

async function calls(page: Page, cmd: string): Promise<unknown[]> {
  return page.evaluate(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (name) => ((window as any).__calls as Call[]).filter((c) => c.cmd === name).map((c) => c.args),
    cmd,
  );
}

/** Screenshots after the badge/panel entry animations finished. */
async function shot(page: Page): Promise<Buffer> {
  await page.waitForFunction(() =>
    document.getAnimations().every((animation) => animation.playState !== 'running' || animation.effect?.getTiming().iterations === Infinity),
  );
  return page.screenshot();
}

/** What the native watcher does: push the focused-field state to the badge window. */
async function emitField(page: Page, payload: unknown) {
  await page.evaluate(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (p) => (window as any).__TAURI_INTERNALS__.invoke('plugin:event|emit', { event: 'lexora:grammar-field', payload: p }),
    payload,
  );
}

test.describe('Writing check badge & panel', () => {
  test.beforeEach(async ({ page }) => {
    // Badge window size from src-tauri/src/grammar_watch/mod.rs.
    await page.setViewportSize({ width: 44, height: 44 });
  });

  test('badge checks the field text without storing it and shows the count', async ({ page }, info) => {
    await mockGrammar(page);
    await page.goto('/grammar.html');
    const badge = page.getByRole('button', { name: '2 writing suggestions — open' });
    await expect(badge).toBeVisible();
    expect(await calls(page, 'check_writing')).toEqual([{ input: { text: TEXT, ephemeral: true } }]);
    await info.attach('badge', { body: await shot(page), contentType: 'image/png' });
  });

  test('follows the watcher: hidden → typing → checked', async ({ page }) => {
    await mockGrammar(page, { field: { kind: 'hidden' } });
    await page.goto('/grammar.html');
    await expect(page.locator('#root')).toBeEmpty();

    await emitField(page, { kind: 'pending', fieldId: 1 });
    await expect(page.getByRole('button', { name: 'Lexora is checking your text' })).toBeVisible();

    await emitField(page, FIELD);
    await expect(page.getByRole('button', { name: '2 writing suggestions — open' })).toBeVisible();

    await emitField(page, { kind: 'hidden' });
    await expect(page.locator('#root')).toBeEmpty();
  });

  test('panel: apply fixes one by one, straight into the field', async ({ page }, info) => {
    await mockGrammar(page);
    await page.goto('/grammar.html');
    await page.getByRole('button', { name: '2 writing suggestions — open' }).click();
    await page.setViewportSize({ width: 400, height: 460 }); // the backend resizes the window

    const panel = page.getByRole('region', { name: /2 suggestions · Mail/ });
    await expect(panel).toBeVisible();
    expect(await calls(page, 'set_grammar_panel_open')).toEqual([{ open: true }]);
    await expect(panel.getByText('Third person singular takes “doesn’t”.')).toBeVisible();
    await info.attach('panel', { body: await shot(page), contentType: 'image/png' });

    await page.getByRole('button', { name: "Apply fix: dont → doesn't" }).click();
    await expect(page.getByRole('region', { name: /1 suggestion · Mail/ })).toBeVisible();
    await info.attach('after-first-fix', { body: await shot(page), contentType: 'image/png' });

    await page.getByRole('button', { name: 'Apply fix: go → went' }).click();
    await expect(page.getByText('✓ No mistakes found — the text reads well.')).toBeVisible();

    expect(await calls(page, 'apply_grammar_fix')).toEqual([
      {
        input: {
          fieldId: 1,
          checkedText: TEXT,
          correctedText: "She doesn't like apples and she go home yesterday.",
        },
      },
      {
        input: {
          fieldId: 1,
          checkedText: "She doesn't like apples and she go home yesterday.",
          correctedText: "She doesn't like apples and she went home yesterday.",
        },
      },
    ]);
    // All fixed → the panel closes itself and focus goes back to the app.
    await expect.poll(() => calls(page, 'set_grammar_panel_open')).toEqual([{ open: true }, { open: false }]);
  });

  test('panel: apply all, dismiss, Escape', async ({ page }) => {
    await mockGrammar(page);
    await page.goto('/grammar.html');
    await page.getByRole('button', { name: '2 writing suggestions — open' }).click();
    await page.setViewportSize({ width: 400, height: 460 });

    await page.getByRole('button', { name: "Dismiss fix: dont → doesn't" }).click();
    await expect(page.getByRole('region', { name: /1 suggestion/ })).toBeVisible();
    expect(await calls(page, 'apply_grammar_fix')).toEqual([]);

    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: '1 writing suggestion — open' })).toBeVisible();
    expect(await calls(page, 'set_grammar_panel_open')).toEqual([{ open: true }, { open: false }]);
  });

  test('panel: apply all at once', async ({ page }) => {
    await mockGrammar(page);
    await page.goto('/grammar.html');
    await page.getByRole('button', { name: '2 writing suggestions — open' }).click();
    await page.setViewportSize({ width: 400, height: 460 });
    await page.getByRole('button', { name: 'Apply all (2)' }).click();
    await expect(page.getByText('✓ No mistakes found — the text reads well.')).toBeVisible();
    expect(await calls(page, 'apply_grammar_fix')).toEqual([
      {
        input: {
          fieldId: 1,
          checkedText: TEXT,
          correctedText: "She doesn't like apples and she went home yesterday.",
        },
      },
    ]);
  });

  test('panel: the user kept typing — the fix is refused and nothing changes', async ({ page }, info) => {
    await mockGrammar(page, { applyError: 'Validation error: The text changed after the check — wait for the new result' });
    await page.goto('/grammar.html');
    await page.getByRole('button', { name: '2 writing suggestions — open' }).click();
    await page.setViewportSize({ width: 400, height: 460 });
    await page.getByRole('button', { name: "Apply fix: dont → doesn't" }).click();
    await expect(page.getByRole('alert')).toContainText(/text changed after the check/i);
    await expect(page.getByRole('region', { name: /2 suggestions/ })).toBeVisible();
    await info.attach('apply-refused', { body: await shot(page), contentType: 'image/png' });
  });

  test("panel: don't check in this app", async ({ page }) => {
    await mockGrammar(page);
    await page.goto('/grammar.html');
    await page.getByRole('button', { name: '2 writing suggestions — open' }).click();
    await page.setViewportSize({ width: 400, height: 460 });
    await page.getByRole('button', { name: "Don't check in Mail" }).click();
    expect(await calls(page, 'exclude_grammar_app')).toEqual([{ bundleId: 'com.apple.mail' }]);
  });
});

test.describe('Settings → Writing check in other apps', () => {
  async function openSection(page: Page) {
    await page.goto('/#/settings');
    const section = page.locator('[aria-labelledby="grammar-watch-title"]');
    await section.scrollIntoViewIfNeeded();
    await expect(section.getByRole('heading', { name: 'Writing check in other apps' })).toBeVisible();
    return section;
  }

  test('off by default; turning on saves immediately', async ({ page }) => {
    await mockGrammar(page);
    const section = await openSection(page);
    const toggle = section.getByRole('checkbox', { name: 'Suggest fixes while I type in any app' });
    await expect(toggle).toBeEnabled();
    await expect(toggle).not.toBeChecked();
    await toggle.check();
    await expect(toggle).toBeChecked();
    expect(await calls(page, 'update_grammar_watch_settings')).toEqual([
      { settings: { enabled: true, excludedApps: ['com.apple.Terminal'] } },
    ]);
  });

  test('asks for Accessibility access when it is missing', async ({ page }, info) => {
    await mockGrammar(page, {
      settings: { enabled: true, excludedApps: ['com.apple.Terminal', 'com.jetbrains.*'] },
      status: { supported: true, accessibilityTrusted: false },
    });
    const section = await openSection(page);
    await expect(section.getByText(/needs Accessibility access/)).toBeVisible();
    await section.getByRole('button', { name: 'Grant access' }).click();
    await expect.poll(() => calls(page, 'request_grammar_watch_access')).toHaveLength(1);
    await info.attach('settings', { body: await section.screenshot(), contentType: 'image/png' });
  });

  test('exclusion list: add and remove apps', async ({ page }) => {
    await mockGrammar(page);
    const section = await openSection(page);
    await section.getByLabel(/never check in these apps/i).fill('com.tinyspeck.slackmacgap');
    await section.getByRole('button', { name: 'Add' }).click();
    await expect(section.getByText('com.tinyspeck.slackmacgap')).toBeVisible();

    await section.getByRole('button', { name: 'Check again in com.apple.Terminal' }).click();
    await expect(section.getByText('com.apple.Terminal')).toHaveCount(0);
    // Enter in the field adds too.
    await section.getByLabel(/never check in these apps/i).fill('com.apple.mail');
    await section.getByLabel(/never check in these apps/i).press('Enter');
    await expect(section.getByText('com.apple.mail')).toBeVisible();

    expect(await calls(page, 'update_grammar_watch_settings')).toEqual([
      { settings: { enabled: false, excludedApps: ['com.apple.Terminal', 'com.tinyspeck.slackmacgap'] } },
      { settings: { enabled: false, excludedApps: ['com.tinyspeck.slackmacgap'] } },
      { settings: { enabled: false, excludedApps: ['com.tinyspeck.slackmacgap', 'com.apple.mail'] } },
    ]);
    // The section sits inside the Settings form: it must not trigger the page-wide save.
    expect(await calls(page, 'update_settings')).toEqual([]);
  });

  test('disabled with a note where the platform is not supported', async ({ page }) => {
    await mockGrammar(page, { status: { supported: false, accessibilityTrusted: false } });
    const section = await openSection(page);
    await expect(section.getByText('Available on macOS.')).toBeVisible();
    await expect(section.getByRole('checkbox', { name: 'Suggest fixes while I type in any app' })).toBeDisabled();
  });
});
