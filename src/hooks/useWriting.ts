// ============================================================
// LEXORA — useWriting hooks (Stage 2: AI Writing Assistant)
// ============================================================

import { useMutation, useQuery } from '@tanstack/react-query';
import { ipc } from '../lib/ipc';
import { QUERY_KEYS, STALE_TIME } from '../lib/constants';
import type {
  CheckWritingInput,
  RewriteTextInput,
  WritingIssueStatus,
} from '../lib/types';

// Check text for issues: AI analysis → WritingCheckDto with issues.
// The backend also persists the session and updates error patterns.
export function useCheckWriting() {
  return useMutation({
    mutationFn: (input: CheckWritingInput) => ipc.writing.check(input),
  });
}

// Rewrite text in a given mode (clearer/shorter/formal/…).
// Returns WritingCheckDto with correctedText set to the rewritten text.
export function useRewriteText() {
  return useMutation({
    mutationFn: (input: RewriteTextInput) => ipc.writing.rewrite(input),
  });
}

// Persist a single issue verdict. Returns the refreshed parent check.
// Not for ephemeral (privacy-mode) checks with id === 0.
export function useUpdateIssueStatus() {
  return useMutation({
    mutationFn: ({ issueId, status }: { issueId: number; status: WritingIssueStatus }) =>
      ipc.writing.updateIssueStatus(issueId, status),
  });
}

// Accept every pending issue of a persisted check. Returns the refreshed check
// with correctedText filled in.
export function useAcceptAllIssues() {
  return useMutation({
    mutationFn: (checkId: number) => ipc.writing.acceptAll(checkId),
  });
}

// Recurring mistake categories aggregated from persisted checks.
export function useWritingErrorPatterns(language: string, enabled = true) {
  return useQuery({
    queryKey: [QUERY_KEYS.WRITING_PATTERNS, language],
    queryFn: () => ipc.writing.getErrorPatterns(language),
    enabled,
    staleTime: STALE_TIME.MEDIUM,
  });
}

// Generate targeted exercises from the user's error patterns.
export function useGenerateExercises() {
  return useMutation({
    mutationFn: (language: string) => ipc.writing.generateExercises(language),
  });
}
