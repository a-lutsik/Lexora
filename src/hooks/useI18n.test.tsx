import { useMemo } from 'react';
import { act, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { useI18n } from './useI18n';
import { setLocale } from '../i18n';

function Example() {
  const { t } = useI18n();
  const label = useMemo(() => t('Settings'), [t]);
  return <button>{label}</button>;
}

afterEach(() => act(() => setLocale('en')));

it('updates mounted UI and separate roots without reloading', () => {
  setLocale('en');
  render(<Example />);
  render(<Example />);
  expect(screen.getAllByRole('button', { name: 'Settings' })).toHaveLength(2);
  act(() => setLocale('ru'));
  expect(screen.getAllByRole('button', { name: 'Настройки' })).toHaveLength(2);
});
