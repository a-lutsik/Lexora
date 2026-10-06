import { describe, expect, it } from 'vitest';
import { sanitizeHtml } from './sanitizeHtml';

describe('sanitizeHtml', () => {
  it('returns empty string for empty input', () => {
    expect(sanitizeHtml('')).toBe('');
  });

  it('keeps simple formatting tags', () => {
    expect(sanitizeHtml('Use <em>serendipity</em> here')).toBe(
      'Use <em>serendipity</em> here',
    );
    expect(sanitizeHtml('<strong>Correct</strong>')).toBe('<strong>Correct</strong>');
  });

  it('strips script tags and event handlers', () => {
    const dirty = '<img src=x onerror="alert(1)"><script>alert(1)</script>Hi';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toMatch(/script/i);
    expect(clean).not.toMatch(/onerror/i);
    expect(clean).not.toMatch(/<img/i);
    expect(clean).toContain('Hi');
  });

  it('strips javascript: URLs even if wrapped in an anchor', () => {
    const clean = sanitizeHtml('<a href="javascript:alert(1)">click</a>');
    expect(clean).not.toMatch(/javascript:/i);
    expect(clean).not.toMatch(/<a/i);
    expect(clean).toContain('click');
  });

  it('strips style and iframe', () => {
    const clean = sanitizeHtml(
      '<style>body{display:none}</style><iframe src="https://evil.test"></iframe>ok',
    );
    expect(clean).not.toMatch(/style/i);
    expect(clean).not.toMatch(/iframe/i);
    expect(clean).toContain('ok');
  });
});
