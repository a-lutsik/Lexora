import { act, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { setLocale } from '../../../i18n';
import fr from '../../../i18n/fr.json';
import { VoiceTranscriptCard } from './VoiceTranscriptCard';

afterEach(() => setLocale('en'));

it('updates computed headings, accessibility labels and empty hints when the interface language changes', () => {
  render(<VoiceTranscriptCard variant="translation" languageName="English" text={null} timestamp={null}
    isPlaying={false} isBookmarked={false} copied={false} onPlay={vi.fn()} onBookmark={vi.fn()} onCopy={vi.fn()} />);
  expect(screen.getByRole('heading', { name: 'Translation (English)' })).toBeVisible();
  act(() => setLocale('fr'));
  const heading = fr['Translation ({language})'].replace('{language}', 'English');
  expect(screen.getByRole('heading', { name: heading })).toBeVisible();
  expect(screen.getByText(fr['Translation will appear here after transcription.'])).toBeVisible();
  expect(screen.getByRole('button', { name: fr['{title} actions'].replace('{title}', heading) })).toBeDisabled();
});
