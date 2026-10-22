import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HotkeyInput } from './HotkeyInput';

function setup(value = 'CmdOrCtrl+Shift+Space') {
  const onChange = vi.fn();
  render(<HotkeyInput value={value} onChange={onChange} label="Voice Translate shortcut" />);
  const button = screen.getByRole('button');
  fireEvent.click(button);
  return { button, onChange };
}

describe('HotkeyInput', () => {
  it('records Cmd+Shift+V', () => {
    const { button, onChange } = setup();
    fireEvent.keyDown(button, { key: 'V', code: 'KeyV', metaKey: true, shiftKey: true });
    expect(onChange).toHaveBeenCalledWith('CmdOrCtrl+Shift+V');
  });

  it('binds the physical key on a non-Latin layout or with Alt', () => {
    const { button, onChange } = setup();
    fireEvent.keyDown(button, { key: 'м', code: 'KeyV', metaKey: true, shiftKey: true });
    fireEvent.keyDown(button, { key: '√', code: 'KeyV', metaKey: true, altKey: true });
    expect(onChange).toHaveBeenNthCalledWith(1, 'CmdOrCtrl+Shift+V');
  });

  it('keeps recording while only modifiers are held', () => {
    const { button, onChange } = setup();
    fireEvent.keyDown(button, { key: 'Meta', code: 'MetaLeft', metaKey: true });
    fireEvent.keyDown(button, { key: 'Shift', code: 'ShiftLeft', metaKey: true, shiftKey: true });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('records Space as a main key', () => {
    const { button, onChange } = setup('CmdOrCtrl+Shift+V');
    fireEvent.keyDown(button, { key: ' ', code: 'Space', metaKey: true, shiftKey: true });
    expect(onChange).toHaveBeenCalledWith('CmdOrCtrl+Shift+Space');
  });

  it('Escape cancels without changing the shortcut', () => {
    const { button, onChange } = setup();
    fireEvent.keyDown(button, { key: 'Escape', code: 'Escape' });
    expect(onChange).not.toHaveBeenCalled();
  });
});
