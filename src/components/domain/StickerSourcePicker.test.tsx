import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithQueryClient } from '../../test/render';
import { StickerSourcePicker } from './StickerSourcePicker';

const categories = [
  { id: 1, name: 'General', languageId: 1, isGeneral: true, wordCount: 2 },
  { id: 2, name: 'Travel', languageId: 1, isGeneral: false, wordCount: 3 },
];

describe('sticker category picker', () => {
  it('displays topic choices and selects only the requested topic', () => {
    const onChange = vi.fn();
    renderWithQueryClient(<StickerSourcePicker sources={[]} categories={categories} collections={[]} onChange={onChange} />);
    fireEvent.click(screen.getByText('Categories'));
    fireEvent.click(screen.getByLabelText('Travel'));
    expect(onChange).toHaveBeenCalledWith(['cat:2']);
  });

  it('shows partial state for my words and keeps collections separate', () => {
    renderWithQueryClient(<StickerSourcePicker sources={['cat:2']} categories={categories} collections={[]} onChange={vi.fn()} />);
    expect(screen.getByLabelText('My words')).toBePartiallyChecked();
    expect(screen.getByLabelText('Travel')).toBeChecked();
    expect(screen.getByLabelText('General')).not.toBeChecked();
    expect(screen.getByLabelText('All vocabulary')).not.toBeChecked();
  });
});
