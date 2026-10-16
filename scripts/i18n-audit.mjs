import fs from 'node:fs/promises';
import ts from 'typescript';
import { inspectSources } from './lib/i18n-source.mjs';

async function loadTypeScript(file) {
  const { outputText } = ts.transpileModule(await fs.readFile(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext },
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}
const { INTERFACE_LANGUAGES } = await loadTypeScript('src/i18n/locales.ts');
const dictionaries = Object.fromEntries(await Promise.all(INTERFACE_LANGUAGES.map(async ({ code }) => [
  code, JSON.parse(await fs.readFile(`src/i18n/${code}.json`, 'utf8')),
])));
const inventory = JSON.parse(await fs.readFile('src/i18n/messages.json', 'utf8'));
const { messages: discovered, violations } = await inspectSources();
const messages = new Set([...inventory, ...discovered]);
if (process.argv.includes('--write')) {
  await fs.writeFile('src/i18n/messages.json', `${JSON.stringify([...messages].sort(), null, 2)}\n`);
}
const placeholders = (text) => [...new Set(text.match(/\{\w+\}/g) ?? [])].sort().join(',');
const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
let invalid = false;
for (const violation of violations) {
  process.stderr.write(`Unlocalized UI at ${violation.file}:${violation.line}: ${JSON.stringify(violation.text)}\n`);
  invalid = true;
}
for (const { code, name } of INTERFACE_LANGUAGES) {
  const dictionary = dictionaries[code];
  const missing = [...messages].filter((source) => !hasOwn(dictionary, source)
    || typeof dictionary[source] !== 'string' || !dictionary[source].trim());
  if (missing.length) {
    process.stderr.write(`${code}: missing ${missing.length} messages, e.g. ${missing.slice(0, 5).map((value) => JSON.stringify(value)).join(', ')}\n`);
    invalid = true;
  }
  for (const [source, translation] of Object.entries(dictionary)) {
    if (typeof translation !== 'string' || !translation.trim() || placeholders(source) !== placeholders(translation)) {
      process.stderr.write(`Invalid translation/placeholders in ${code}: ${source}\n`);
      invalid = true;
    }
  }
  process.stdout.write(`${code.padEnd(3)} ${name.padEnd(14)} ${messages.size - missing.length}/${messages.size} explicit messages\n`);
}
process.stdout.write('All six catalogs must cover every inventoried UI message; English fallback does not count as coverage.\n');
if (invalid) process.exitCode = 1;
