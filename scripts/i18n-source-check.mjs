import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { inspectSources } from './lib/i18n-source.mjs';

async function withSource(source, check) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'lexora-i18n-source-'));
  try {
    await writeFile(path.join(dir, 'Example.tsx'), source);
    await check(await inspectSources(dir));
  } finally {
    await rm(dir, { recursive: true });
  }
}

test('rejects untranslated JSX copy, conditional text and accessibility attributes', async () => {
  await withSource('<button aria-label="Delete item">{busy ? "Working" : "Delete"}</button>', ({ violations }) => {
    assert.deepEqual(violations.map(({ text }) => text).sort(), ['Delete', 'Delete item', 'Working']);
  });
});

test('accepts localized copy and preserves user content, IDs, CSS and product branding', async () => {
  await withSource('<button className="delete-button" id="delete">{t("Delete")}{item.name}<span>Lexora</span></button>', ({ messages, violations }) => {
    assert.deepEqual([...messages], ['Delete']);
    assert.deepEqual(violations, []);
  });
});

test('discovers locale-specific translation calls and owned error fallbacks', async () => {
  await withSource('const a = translate(locale, "Close"); const b = formatIpcError(error, "Save failed");', ({ messages }) => {
    assert.deepEqual([...messages].sort(), ['Close', 'Save failed']);
  });
});

test('rejects untranslated native file dialog filter names', async () => {
  await withSource('const filters = [{ name: "Word lists", extensions: ["txt"] }];', ({ violations }) => {
    assert.equal(violations.length, 1);
    assert.equal(violations[0].text, 'Word lists');
  });
});
