// ============================================================
// LEXORA — Inline AI assistant helpers (popup routing + modes)
// ============================================================

import type { InlineAssistantMode, RewriteMode, TextRegister } from './types';
import { formatIpcError } from './utils';

export const DEFAULT_ASSISTANT_TARGET_LANGUAGE = 'ru';
export const TEXT_TAB_TARGET_LANGUAGE = 'en';
/** Wait until typing pauses so we do not hit provider rate limits. */
export const TEXT_COMPOSE_DEBOUNCE_MS = 2000;
/** Register chips are a single click — a short delay is enough. */
export const TEXT_REGISTER_DEBOUNCE_MS = 400;
/** After a 429, block further AI calls for this long (client fuse). */
export const RATE_LIMIT_COOLDOWN_MS = 5000;

/** Detect provider rate-limit / 429 errors from IPC error strings. */
export function isRateLimitError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('429') ||
    lower.includes('too many requests') ||
    lower.includes('rate limit') ||
    lower.includes('rate_limit') ||
    lower.includes('resource_exhausted') ||
    lower.includes('quota exceeded')
  );
}

/** Normalize IPC / provider errors for the popup UI. */
export function formatProviderError(error: unknown): string {
  return formatIpcError(
    error,
    'Could not complete this request. Check the AI provider in Settings.',
  );
}

const IMAGE_RATE_LIMIT_MESSAGE =
  'Image provider is busy. Wait a minute, then tap refresh once. Or add an OpenAI API key in Settings to generate without waiting.';

/** Image refresh errors: keep the wait-seconds hint, never the assistant “switch modes” tip. */
export function formatImageProviderError(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : String(error);
  if (!isRateLimitError(raw)) {
    return formatIpcError(
      error,
      'Could not load a picture. Try again, or check image settings.',
    );
  }
  const wait = raw.match(/wait about (\d+) seconds/i);
  if (wait?.[1]) {
    return `Image provider is busy. Wait about ${wait[1]} seconds, then tap refresh once. Or add an OpenAI API key in Settings to generate without waiting.`;
  }
  return IMAGE_RATE_LIMIT_MESSAGE;
}

export const POPUP_DICTIONARY_SIZE = { width: 460, height: 600 } as const;
export const POPUP_ASSISTANT_SIZE = { width: 720, height: 420 } as const;

export type PopupViewMode = 'dictionary' | 'assistant';

export const INLINE_MODE_TABS = [
  { id: 'translate', label: 'Translate', shortcut: '1' },
  // Grammarly-style check — second in the bar, new key so old shortcuts stay.
  { id: 'fix', label: 'Fix', shortcut: '8' },
  { id: 'text', label: 'Text', shortcut: '2' },
  { id: 'improve', label: 'Improve', shortcut: '3' },
  { id: 'rephrase', label: 'Rephrase', shortcut: '4' },
  { id: 'shorten', label: 'Shorten', shortcut: '5' },
  { id: 'friendly', label: 'Friendly', shortcut: '6' },
  { id: 'formal', label: 'Formal', shortcut: '7' },
] as const satisfies ReadonlyArray<{
  id: Exclude<InlineAssistantMode, 'custom'>;
  label: string;
  shortcut: string;
}>;

export const TEXT_REGISTER_OPTIONS = [
  { id: 'official', label: 'Official' },
  { id: 'business', label: 'Business' },
  { id: 'colleague', label: 'Colleague' },
  { id: 'general', label: 'General' },
] as const satisfies ReadonlyArray<{ id: TextRegister; label: string }>;

const LANGUAGE_NAMES: Record<string, string> = {
  ru: 'Russian',
  en: 'English',
  de: 'German',
  es: 'Spanish',
  fr: 'French',
  it: 'Italian',
  pt: 'Portuguese',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
};

/** 1–2 words → dictionary card; a sentence or paragraph → inline assistant. */
export function classifyPopupText(text: string): PopupViewMode {
  const trimmed = text.trim();
  if (!trimmed) return 'dictionary';
  const words = trimmed.split(/\s+/).filter((word) => word.length > 0);
  return words.length > 2 ? 'assistant' : 'dictionary';
}

export function rewriteModeForAssistant(
  mode: Exclude<InlineAssistantMode, 'translate' | 'text' | 'fix'>
): RewriteMode {
  switch (mode) {
    case 'improve':
      return 'clearer';
    case 'rephrase':
      return 'rephrase';
    case 'shorten':
      return 'shorter';
    case 'friendly':
      return 'friendly';
    case 'formal':
      return 'formal';
    case 'custom':
      return 'custom';
  }
}

export function textRegisterLabel(register: TextRegister): string {
  const match = TEXT_REGISTER_OPTIONS.find((option) => option.id === register);
  return match?.label ?? 'General';
}

export function textRegisterInstruction(register: TextRegister): string {
  switch (register) {
    case 'official':
      return 'Translate the text into English in official register: formal, impersonal, complete forms, no slang or contractions. Suitable for documents and authorities. Do not keep the source language. Output only the English translation.';
    case 'business':
      return 'Translate the text into English in business register: professional, polite, clear, and concise. Suitable for clients and work email. Do not keep the source language. Output only the English translation.';
    case 'colleague':
      return 'Translate the text into English as a message to a colleague: friendly-professional, natural, collaborative, not stiff and not slangy. Do not keep the source language. Output only the English translation.';
    case 'general':
      return 'Translate the text into natural everyday English. Neutral tone, fluent and accurate. Do not keep the source language. Output only the English translation.';
  }
}

export function languageDisplayName(code: string): string {
  const normalized = code.trim().toLowerCase();
  return LANGUAGE_NAMES[normalized] ?? code.toUpperCase();
}

export function assistantKickerTitle(
  mode: InlineAssistantMode,
  targetLanguage: string,
  register: TextRegister = 'general'
): string {
  switch (mode) {
    case 'translate':
      return `Translate to ${languageDisplayName(targetLanguage)} (${targetLanguage.toUpperCase()})`;
    case 'fix':
      return 'Grammar & Spelling';
    case 'improve':
      return 'Improvement Suggestions';
    case 'rephrase':
      return 'Rephrase';
    case 'shorten':
      return 'Shorter Version';
    case 'friendly':
      return 'Friendly Tone Rewrite';
    case 'formal':
      return 'Formal Tone Rewrite';
    case 'text':
      return `Translate to English (EN) · ${textRegisterLabel(register)}`;
    case 'custom':
      return 'Custom Rewrite';
  }
}

export function modeFromShortcutKey(key: string): Exclude<InlineAssistantMode, 'custom'> | null {
  const match = INLINE_MODE_TABS.find((tab) => tab.shortcut === key);
  return match?.id ?? null;
}
