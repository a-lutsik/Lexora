import { t } from '../i18n';

/** Model IDs, provider names and dates remain data inside translated status text. */
export function localizeModelMessage(message: string): string {
  const fallbackSuffix = ' — резервная модель';
  if (message.endsWith(fallbackSuffix)) {
    return t('{message} — fallback model', { message: localizeModelMessage(message.slice(0, -fallbackSuffix.length)) });
  }
  const retired = /^Модель (.+) больше не обслуживается$/.exec(message);
  if (retired) return t('Model {model} is retired', { model: retired[1] });
  const unsupported = /^(.+) пока не поддерживается для этой функции$/.exec(message);
  if (unsupported) return t('{provider} is not supported for this feature yet', { provider: unsupported[1] });
  const incapable = /^Модель (.+) не умеет эту задачу$/.exec(message);
  if (incapable) return t('Model {model} cannot perform this task', { model: incapable[1] });
  const needsKey = /^Нужен ключ (.+)$/.exec(message);
  if (needsKey) return t('{provider} API key is required', { provider: needsKey[1] });
  const deprecated = /^(.+) \(отключение ([^)]+)\)$/.exec(message);
  if (deprecated) return t('{model} (shuts down {date})', { model: deprecated[1], date: deprecated[2] });
  const preview = /^(.+) \(preview\)$/.exec(message);
  if (preview) return t('{model} (preview)', { model: preview[1] });
  return t(message);
}

export function toneLabel(tone: string): string {
  switch (tone) {
    case 'formal': return t('Formal tone');
    case 'casual': return t('Casual tone');
    case 'academic': return t('Academic tone');
    default: return t('Standard');
  }
}

/** Controlled writing metadata is UI; explanations and practice sentences remain data. */
export function writingLabel(code: string): string {
  switch (code) {
    case 'spelling': return t('Spelling');
    case 'grammar': return t('Grammar');
    case 'punctuation': return t('Punctuation');
    case 'word_choice': return t('Word choice');
    case 'clarity': return t('Clarity');
    case 'style': return t('Style');
    case 'tone': return t('Tone');
    case 'unnatural': return t('Unnatural');
    case 'fill_blank': return t('Fill blank');
    case 'correct_the_error': return t('Correct the error');
    case 'translate': return t('Translate');
    case 'multiple_choice': return t('Multiple choice');
    case 'error': return t('error');
    case 'warning': return t('warning');
    case 'suggestion': return t('suggestion');
    case 'pending': return t('pending');
    case 'accepted': return t('accepted');
    case 'rejected': return t('rejected');
    default: {
      const spaced = code.replace(/_/g, ' ');
      return t(spaced.charAt(0).toUpperCase() + spaced.slice(1));
    }
  }
}
