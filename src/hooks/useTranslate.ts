// ============================================================
// LEXORA — useTranslate hook
// ============================================================

import { useMutation } from '@tanstack/react-query';
import { ipc } from '../lib/ipc';
import type { TranslateInput } from '../lib/types';

export function useTranslate() {
  return useMutation({
    mutationFn: (input: TranslateInput) => ipc.translate.text(input),
  });
}
