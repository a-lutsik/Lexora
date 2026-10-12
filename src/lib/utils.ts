// ============================================================
// LEXORA — Shared UI utilities
// ============================================================

/** Склеивает className из условных частей, отбрасывая falsy-значения. */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

/** Экранирует пользовательскую строку для безопасной вставки в RegExp. */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** «1 word» / «2 words»: английское склонение по числу. */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export type TextSegment = { text: string; match: boolean };

/**
 * Режет `text` по вхождениям `term` без учёта регистра.
 * Безопасна для любого ввода («C++», «(», «[x» не бросают SyntaxError).
 */
export function splitByTerm(text: string, term: string): TextSegment[] {
  const needle = term.trim();
  if (!needle) return text ? [{ text, match: false }] : [];
  const lowered = needle.toLowerCase();
  return text
    .split(new RegExp(`(${escapeRegExp(needle)})`, 'gi'))
    .filter((part) => part !== '')
    .map((part) => ({ text: part, match: part.toLowerCase() === lowered }));
}

/**
 * Подпись частотности по подсказке бэкенда ('top-1000' | 'top-5000' | 'rank-N').
 * Возвращает null, если подсказки нет или формат неизвестен — лучше ничего,
 * чем выдуманное число.
 */
export function formatFrequencyHint(hint: string | null | undefined): string | null {
  if (!hint) return null;
  const top = /^top-(\d+)$/.exec(hint);
  if (top?.[1]) return `Top ${Number(top[1]).toLocaleString('en-US')}`;
  const rank = /^rank-(\d+)$/.exec(hint);
  if (rank?.[1]) return `★ ${Number(rank[1]).toLocaleString('en-US')}`;
  return null;
}

const MS_PER_DAY = 86_400_000;

/**
 * Относительная дата для unix-timestamp (в секундах):
 * Today / Tomorrow / Yesterday / in N days / N days ago.
 * Детерминирована относительно начала текущих суток.
 */
export function formatRelativeDate(timestamp: number): string {
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  const diffDays = Math.round(
    (startOfDay(new Date(timestamp * 1000)) - startOfDay(new Date())) / MS_PER_DAY
  );

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1) return `in ${diffDays} days`;
  return `${Math.abs(diffDays)} days ago`;
}

const APP_ERROR_PREFIX =
  /^(AI provider error|Invalid input|HTTP error|Database error|Not found|IO error|Serialization error|Permission denied):\s*/i;

const RATE_LIMIT_USER_MESSAGE =
  'Too many requests. Wait a few seconds, then try again. Tip: switch modes less rapidly or set a fallback AI provider in Settings.';

const AI_NOT_CONNECTED_MESSAGE =
  'No AI model is connected. Open Settings, choose a provider, and add an API key.';

/**
 * Join successive speech chunks without duplicating an overlapping tail.
 */
export function appendTranscript(current: string, next: string): string {
  const piece = next.trim();
  if (!piece) return current;
  const existing = current.trim();
  if (!existing) return piece;
  if (existing.endsWith(piece)) return existing;
  if (piece.startsWith(existing)) return piece;
  return `${existing} ${piece}`;
}

/**
 * Copy text to the clipboard without throwing when permission is denied.
 * Returns false if the write is rejected or the string is empty.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  const value = text.trim();
  if (!value) return false;
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Tauri `invoke` rejects with a string, an Error, or a serialized enum object.
 * Map technical dumps onto a short message the user can act on.
 */
export function formatIpcError(err: unknown, fallback: string): string {
  const raw = extractIpcErrorText(err);
  if (!raw) return fallback;
  const cleaned = raw.replace(APP_ERROR_PREFIX, '').trim();
  if (!cleaned) return fallback;
  return toFriendlyErrorMessage(cleaned, fallback);
}

export function toFriendlyErrorMessage(message: string, fallback: string): string {
  const lower = message.toLowerCase();

  if (
    lower.includes('429') ||
    lower.includes('too many requests') ||
    lower.includes('rate limit') ||
    lower.includes('rate_limit') ||
    lower.includes('resource_exhausted') ||
    lower.includes('quota exceeded')
  ) {
    return RATE_LIMIT_USER_MESSAGE;
  }

  if (
    lower.includes('needs an ai model') ||
    lower.includes('no ai provider') ||
    lower.includes('api key is missing') ||
    lower.includes('api token is missing') ||
    lower.includes('account id is missing') ||
    lower.includes('no api key') ||
    lower.includes('not configured')
  ) {
    return lower.includes('settings') ? message : AI_NOT_CONNECTED_MESSAGE;
  }

  if (lower.includes('offline mode') || (lower.includes('offline') && lower.includes('settings'))) {
    return looksUserFacing(message) ? message : AI_NOT_CONNECTED_MESSAGE;
  }

  if (
    lower.includes('401') ||
    lower.includes('unauthorized') ||
    lower.includes('invalid api key') ||
    lower.includes('invalid key') ||
    lower.includes('incorrect api key')
  ) {
    return 'The API key was rejected. Check it in Settings and try again.';
  }

  if (lower.includes('403') || lower.includes('forbidden')) {
    return 'This AI provider denied access. Check your API key and plan in Settings.';
  }

  if (
    lower.includes('model not found') ||
    (lower.includes('404') && lower.includes('model')) ||
    (lower.includes('does not exist') && lower.includes('model'))
  ) {
    return 'The selected model is unavailable. Pick another model in Settings.';
  }

  if (
    lower.includes('timeout') ||
    lower.includes('timed out') ||
    lower.includes('did not respond')
  ) {
    return 'The AI provider did not respond in time. Try again in a moment.';
  }

  if (
    lower.includes('error sending request') ||
    lower.includes('connection refused') ||
    lower.includes('failed to connect') ||
    lower.includes('dns') ||
    lower.includes('network unreachable') ||
    lower.includes('error trying to connect')
  ) {
    return 'Could not reach the AI provider. Check your internet connection and try again.';
  }

  if (
    lower.includes('empty response') ||
    lower.includes('empty transcription') ||
    lower.includes('finishreason') ||
    lower.includes('thought-only')
  ) {
    return 'The AI model returned an empty answer. Try again, or pick another model in Settings.';
  }

  if (lower.includes('blocked the prompt')) {
    return 'The AI provider blocked this text. Try different wording.';
  }

  if (lower.includes('whisper') || (lower.includes('audio') && /\b400\b/.test(lower))) {
    return 'Could not process this audio. Try another file or record again.';
  }

  if (lower.includes('text to translate is empty')) {
    return 'Type a word or phrase to translate.';
  }

  if (lower.includes('could not detect source language')) {
    return 'Could not detect the source language. Choose Source in the language picker.';
  }

  if (lower.includes('sqlite') || lower.includes('database error')) {
    return 'Something went wrong saving data. Try again.';
  }

  if (looksUserFacing(message)) {
    return message;
  }

  return fallback;
}

function looksUserFacing(message: string): boolean {
  const trimmed = message.trim();
  if (trimmed.length < 12 || trimmed.length > 280) return false;
  if (!trimmed.includes(' ')) return false;
  const lower = trimmed.toLowerCase();
  if (lower.includes('os error') || lower.includes('backtrace') || lower.includes('serde')) {
    return false;
  }
  if (trimmed.startsWith('{') || trimmed.includes('::')) return false;
  if (/\b(panic|sql(ite)? exception)\b/i.test(trimmed)) return false;
  return true;
}

function extractIpcErrorText(err: unknown): string | null {
  if (typeof err === 'string' && err.trim()) return err.trim();
  if (err instanceof Error && err.message.trim()) return err.message.trim();
  if (err && typeof err === 'object') {
    const record = err as Record<string, unknown>;
    if (typeof record.message === 'string' && record.message.trim()) {
      return record.message.trim();
    }
    for (const key of [
      'Provider',
      'Validation',
      'Http',
      'Database',
      'NotFound',
      'Io',
      'Serialization',
      'Permission',
    ]) {
      const value = record[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
  }
  return null;
}
