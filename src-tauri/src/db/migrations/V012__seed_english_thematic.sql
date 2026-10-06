-- ============================================================
-- LEXORA — V012: Seed English thematic collections
-- GENERATED FILE. Do not edit by hand.
-- Regenerate with:
--   python3 scripts/seed/import_thematic.py
-- Source data: scripts/seed/data/english_thematic.csv
-- Generated at: 2026-08-22T15:17:15.210577+00:00
--
-- Additive on top of V002. Existing installs already have an empty
-- 'Business English' row; this migration fills it and adds
-- 'Academic English' + 'Travel English'.
--
-- Idempotent: INSERT OR IGNORE / NOT EXISTS throughout.
-- Counts: Business English=118, Academic English=90, Travel English=72
-- ============================================================

-- ── New English system collections (Business already exists in V001) ──
INSERT OR IGNORE INTO collection
    (name, description, collection_type, language_id, sort_order)
VALUES
    ('Academic English', 'University and exam vocabulary', 'system', 1, 5),
    ('Travel English', 'Travel and hospitality vocabulary', 'system', 1, 6);

-- ── Lexemes (279 unique; overlap with Top 5000 is INSERT OR IGNORE) ──
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, is_system)
VALUES
    (1, 'agenda', 'agenda', 'noun', 1),
    (1, 'allocate', 'allocate', 'verb', 1),
    (1, 'asset', 'asset', 'noun', 1),
    (1, 'audit', 'audit', 'noun', 1),
    (1, 'benchmark', 'benchmark', 'noun', 1),
    (1, 'bid', 'bid', 'noun', 1),
    (1, 'bonus', 'bonus', 'noun', 1),
    (1, 'brand', 'brand', 'noun', 1),
    (1, 'budget', 'budget', 'noun', 1),
    (1, 'campaign', 'campaign', 'noun', 1),
    (1, 'cash flow', 'cash flow', 'noun', 1),
    (1, 'client', 'client', 'noun', 1),
    (1, 'collaborate', 'collaborate', 'verb', 1),
    (1, 'commission', 'commission', 'noun', 1),
    (1, 'competitor', 'competitor', 'noun', 1),
    (1, 'compliance', 'compliance', 'noun', 1),
    (1, 'consultant', 'consultant', 'noun', 1),
    (1, 'contract', 'contract', 'noun', 1),
    (1, 'corporate', 'corporate', 'adj', 1),
    (1, 'cost-effective', 'cost-effective', 'adj', 1),
    (1, 'credit', 'credit', 'noun', 1),
    (1, 'deadline', 'deadline', 'noun', 1),
    (1, 'deliverable', 'deliverable', 'noun', 1),
    (1, 'department', 'department', 'noun', 1),
    (1, 'discount', 'discount', 'noun', 1),
    (1, 'dividend', 'dividend', 'noun', 1),
    (1, 'due diligence', 'due diligence', 'noun', 1),
    (1, 'earnings', 'earnings', 'noun', 1),
    (1, 'efficiency', 'efficiency', 'noun', 1),
    (1, 'employee', 'employee', 'noun', 1),
    (1, 'entrepreneur', 'entrepreneur', 'noun', 1),
    (1, 'equity', 'equity', 'noun', 1),
    (1, 'estimate', 'estimate', 'noun', 1),
    (1, 'expense', 'expense', 'noun', 1),
    (1, 'feedback', 'feedback', 'noun', 1),
    (1, 'forecast', 'forecast', 'noun', 1),
    (1, 'franchise', 'franchise', 'noun', 1),
    (1, 'funding', 'funding', 'noun', 1),
    (1, 'headquarters', 'headquarters', 'noun', 1),
    (1, 'hire', 'hire', 'verb', 1),
    (1, 'implementation', 'implementation', 'noun', 1),
    (1, 'incentive', 'incentive', 'noun', 1),
    (1, 'income', 'income', 'noun', 1),
    (1, 'industry', 'industry', 'noun', 1),
    (1, 'inflation', 'inflation', 'noun', 1),
    (1, 'initiative', 'initiative', 'noun', 1),
    (1, 'innovation', 'innovation', 'noun', 1),
    (1, 'inventory', 'inventory', 'noun', 1),
    (1, 'invest', 'invest', 'verb', 1),
    (1, 'invoice', 'invoice', 'noun', 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, is_system)
VALUES
    (1, 'joint venture', 'joint venture', 'noun', 1),
    (1, 'kickoff', 'kickoff', 'noun', 1),
    (1, 'layoff', 'layoff', 'noun', 1),
    (1, 'leverage', 'leverage', 'verb', 1),
    (1, 'liability', 'liability', 'noun', 1),
    (1, 'logistics', 'logistics', 'noun', 1),
    (1, 'margin', 'margin', 'noun', 1),
    (1, 'market', 'market', 'noun', 1),
    (1, 'merger', 'merger', 'noun', 1),
    (1, 'milestone', 'milestone', 'noun', 1),
    (1, 'negotiate', 'negotiate', 'verb', 1),
    (1, 'networking', 'networking', 'noun', 1),
    (1, 'objective', 'objective', 'noun', 1),
    (1, 'operations', 'operations', 'noun', 1),
    (1, 'opportunity', 'opportunity', 'noun', 1),
    (1, 'outsource', 'outsource', 'verb', 1),
    (1, 'overhead', 'overhead', 'noun', 1),
    (1, 'partnership', 'partnership', 'noun', 1),
    (1, 'payroll', 'payroll', 'noun', 1),
    (1, 'performance', 'performance', 'noun', 1),
    (1, 'pitch', 'pitch', 'noun', 1),
    (1, 'policy', 'policy', 'noun', 1),
    (1, 'portfolio', 'portfolio', 'noun', 1),
    (1, 'profit', 'profit', 'noun', 1),
    (1, 'promotion', 'promotion', 'noun', 1),
    (1, 'proposal', 'proposal', 'noun', 1),
    (1, 'purchase', 'purchase', 'verb', 1),
    (1, 'quarterly', 'quarterly', 'adj', 1),
    (1, 'quote', 'quote', 'noun', 1),
    (1, 'recruiter', 'recruiter', 'noun', 1),
    (1, 'regulation', 'regulation', 'noun', 1),
    (1, 'remote', 'remote', 'adj', 1),
    (1, 'report', 'report', 'noun', 1),
    (1, 'resign', 'resign', 'verb', 1),
    (1, 'resource', 'resource', 'noun', 1),
    (1, 'retail', 'retail', 'noun', 1),
    (1, 'revenue', 'revenue', 'noun', 1),
    (1, 'risk', 'risk', 'noun', 1),
    (1, 'roadmap', 'roadmap', 'noun', 1),
    (1, 'salary', 'salary', 'noun', 1),
    (1, 'sales', 'sales', 'noun', 1),
    (1, 'scale', 'scale', 'verb', 1),
    (1, 'schedule', 'schedule', 'noun', 1),
    (1, 'shareholder', 'shareholder', 'noun', 1),
    (1, 'shipping', 'shipping', 'noun', 1),
    (1, 'shortage', 'shortage', 'noun', 1),
    (1, 'skill set', 'skill set', 'noun', 1),
    (1, 'stakeholder', 'stakeholder', 'noun', 1),
    (1, 'startup', 'startup', 'noun', 1),
    (1, 'strategy', 'strategy', 'noun', 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, is_system)
VALUES
    (1, 'supply chain', 'supply chain', 'noun', 1),
    (1, 'survey', 'survey', 'noun', 1),
    (1, 'target', 'target', 'noun', 1),
    (1, 'tax', 'tax', 'noun', 1),
    (1, 'tender', 'tender', 'noun', 1),
    (1, 'timeline', 'timeline', 'noun', 1),
    (1, 'trade', 'trade', 'noun', 1),
    (1, 'training', 'training', 'noun', 1),
    (1, 'transaction', 'transaction', 'noun', 1),
    (1, 'turnover', 'turnover', 'noun', 1),
    (1, 'upgrade', 'upgrade', 'verb', 1),
    (1, 'vendor', 'vendor', 'noun', 1),
    (1, 'venture', 'venture', 'noun', 1),
    (1, 'warehouse', 'warehouse', 'noun', 1),
    (1, 'warranty', 'warranty', 'noun', 1),
    (1, 'wholesale', 'wholesale', 'noun', 1),
    (1, 'workflow', 'workflow', 'noun', 1),
    (1, 'yield', 'yield', 'noun', 1),
    (1, 'abstract', 'abstract', 'noun', 1),
    (1, 'analysis', 'analysis', 'noun', 1),
    (1, 'argument', 'argument', 'noun', 1),
    (1, 'assess', 'assess', 'verb', 1),
    (1, 'assignment', 'assignment', 'noun', 1),
    (1, 'assumption', 'assumption', 'noun', 1),
    (1, 'bibliography', 'bibliography', 'noun', 1),
    (1, 'case study', 'case study', 'noun', 1),
    (1, 'citation', 'citation', 'noun', 1),
    (1, 'claim', 'claim', 'noun', 1),
    (1, 'compare', 'compare', 'verb', 1),
    (1, 'conclusion', 'conclusion', 'noun', 1),
    (1, 'context', 'context', 'noun', 1),
    (1, 'criterion', 'criterion', 'noun', 1),
    (1, 'critique', 'critique', 'noun', 1),
    (1, 'data', 'data', 'noun', 1),
    (1, 'debate', 'debate', 'noun', 1),
    (1, 'define', 'define', 'verb', 1),
    (1, 'dissertation', 'dissertation', 'noun', 1),
    (1, 'draft', 'draft', 'noun', 1),
    (1, 'essay', 'essay', 'noun', 1),
    (1, 'evidence', 'evidence', 'noun', 1),
    (1, 'examine', 'examine', 'verb', 1),
    (1, 'experiment', 'experiment', 'noun', 1),
    (1, 'findings', 'findings', 'noun', 1),
    (1, 'framework', 'framework', 'noun', 1),
    (1, 'hypothesis', 'hypothesis', 'noun', 1),
    (1, 'implication', 'implication', 'noun', 1),
    (1, 'interpret', 'interpret', 'verb', 1),
    (1, 'journal', 'journal', 'noun', 1),
    (1, 'lecture', 'lecture', 'noun', 1),
    (1, 'literature', 'literature', 'noun', 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, is_system)
VALUES
    (1, 'methodology', 'methodology', 'noun', 1),
    (1, 'outline', 'outline', 'noun', 1),
    (1, 'paragraph', 'paragraph', 'noun', 1),
    (1, 'paraphrase', 'paraphrase', 'verb', 1),
    (1, 'peer review', 'peer review', 'noun', 1),
    (1, 'plagiarism', 'plagiarism', 'noun', 1),
    (1, 'premise', 'premise', 'noun', 1),
    (1, 'qualitative', 'qualitative', 'adj', 1),
    (1, 'quantitative', 'quantitative', 'adj', 1),
    (1, 'questionnaire', 'questionnaire', 'noun', 1),
    (1, 'reference', 'reference', 'noun', 1),
    (1, 'sample', 'sample', 'noun', 1),
    (1, 'scholar', 'scholar', 'noun', 1),
    (1, 'seminar', 'seminar', 'noun', 1),
    (1, 'source', 'source', 'noun', 1),
    (1, 'statistics', 'statistics', 'noun', 1),
    (1, 'summary', 'summary', 'noun', 1),
    (1, 'theory', 'theory', 'noun', 1),
    (1, 'thesis', 'thesis', 'noun', 1),
    (1, 'variable', 'variable', 'noun', 1),
    (1, 'workshop', 'workshop', 'noun', 1),
    (1, 'approach', 'approach', 'noun', 1),
    (1, 'chapter', 'chapter', 'noun', 1),
    (1, 'concept', 'concept', 'noun', 1),
    (1, 'contrast', 'contrast', 'verb', 1),
    (1, 'contribute', 'contribute', 'verb', 1),
    (1, 'derive', 'derive', 'verb', 1),
    (1, 'evaluate', 'evaluate', 'verb', 1),
    (1, 'factor', 'factor', 'noun', 1),
    (1, 'feature', 'feature', 'noun', 1),
    (1, 'identify', 'identify', 'verb', 1),
    (1, 'illustrate', 'illustrate', 'verb', 1),
    (1, 'indicate', 'indicate', 'verb', 1),
    (1, 'issue', 'issue', 'noun', 1),
    (1, 'method', 'method', 'noun', 1),
    (1, 'occur', 'occur', 'verb', 1),
    (1, 'percent', 'percent', 'noun', 1),
    (1, 'period', 'period', 'noun', 1),
    (1, 'principle', 'principle', 'noun', 1),
    (1, 'procedure', 'procedure', 'noun', 1),
    (1, 'process', 'process', 'noun', 1),
    (1, 'require', 'require', 'verb', 1),
    (1, 'research', 'research', 'noun', 1),
    (1, 'role', 'role', 'noun', 1),
    (1, 'section', 'section', 'noun', 1),
    (1, 'significant', 'significant', 'adj', 1),
    (1, 'similar', 'similar', 'adj', 1),
    (1, 'specific', 'specific', 'adj', 1),
    (1, 'structure', 'structure', 'noun', 1),
    (1, 'subsequent', 'subsequent', 'adj', 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, is_system)
VALUES
    (1, 'sufficient', 'sufficient', 'adj', 1),
    (1, 'theoretical', 'theoretical', 'adj', 1),
    (1, 'valid', 'valid', 'adj', 1),
    (1, 'whereas', 'whereas', 'conj', 1),
    (1, 'footnote', 'footnote', 'noun', 1),
    (1, 'appendix', 'appendix', 'noun', 1),
    (1, 'coherence', 'coherence', 'noun', 1),
    (1, 'supervisor', 'supervisor', 'noun', 1),
    (1, 'airport', 'airport', 'noun', 1),
    (1, 'aisle', 'aisle', 'noun', 1),
    (1, 'arrival', 'arrival', 'noun', 1),
    (1, 'baggage', 'baggage', 'noun', 1),
    (1, 'boarding pass', 'boarding pass', 'noun', 1),
    (1, 'booking', 'booking', 'noun', 1),
    (1, 'cabin', 'cabin', 'noun', 1),
    (1, 'check-in', 'check-in', 'noun', 1),
    (1, 'connection', 'connection', 'noun', 1),
    (1, 'customs', 'customs', 'noun', 1),
    (1, 'delay', 'delay', 'noun', 1),
    (1, 'departure', 'departure', 'noun', 1),
    (1, 'destination', 'destination', 'noun', 1),
    (1, 'duty-free', 'duty-free', 'adj', 1),
    (1, 'embassy', 'embassy', 'noun', 1),
    (1, 'fare', 'fare', 'noun', 1),
    (1, 'flight', 'flight', 'noun', 1),
    (1, 'gate', 'gate', 'noun', 1),
    (1, 'hotel', 'hotel', 'noun', 1),
    (1, 'itinerary', 'itinerary', 'noun', 1),
    (1, 'journey', 'journey', 'noun', 1),
    (1, 'layover', 'layover', 'noun', 1),
    (1, 'luggage', 'luggage', 'noun', 1),
    (1, 'passport', 'passport', 'noun', 1),
    (1, 'reservation', 'reservation', 'noun', 1),
    (1, 'sightseeing', 'sightseeing', 'noun', 1),
    (1, 'souvenir', 'souvenir', 'noun', 1),
    (1, 'suitcase', 'suitcase', 'noun', 1),
    (1, 'terminal', 'terminal', 'noun', 1),
    (1, 'ticket', 'ticket', 'noun', 1),
    (1, 'visa', 'visa', 'noun', 1),
    (1, 'platform', 'platform', 'noun', 1),
    (1, 'reception', 'reception', 'noun', 1),
    (1, 'room service', 'room service', 'noun', 1),
    (1, 'shuttle', 'shuttle', 'noun', 1),
    (1, 'taxi', 'taxi', 'noun', 1),
    (1, 'tourist', 'tourist', 'noun', 1),
    (1, 'transfer', 'transfer', 'noun', 1),
    (1, 'window seat', 'window seat', 'noun', 1),
    (1, 'check out', 'check out', 'verb', 1),
    (1, 'land', 'land', 'verb', 1),
    (1, 'take off', 'take off', 'verb', 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, is_system)
VALUES
    (1, 'pack', 'pack', 'verb', 1),
    (1, 'book', 'book', 'verb', 1),
    (1, 'cancel', 'cancel', 'verb', 1),
    (1, 'confirm', 'confirm', 'verb', 1),
    (1, 'exchange', 'exchange', 'verb', 1),
    (1, 'lost', 'lost', 'adj', 1),
    (1, 'one-way', 'one-way', 'adj', 1),
    (1, 'round-trip', 'round-trip', 'adj', 1),
    (1, 'available', 'available', 'adj', 1),
    (1, 'crowded', 'crowded', 'adj', 1),
    (1, 'domestic', 'domestic', 'adj', 1),
    (1, 'international', 'international', 'adj', 1),
    (1, 'nonstop', 'nonstop', 'adj', 1),
    (1, 'overbooked', 'overbooked', 'adj', 1),
    (1, 'refundable', 'refundable', 'adj', 1),
    (1, 'single', 'single', 'adj', 1),
    (1, 'double', 'double', 'adj', 1),
    (1, 'hostel', 'hostel', 'noun', 1),
    (1, 'map', 'map', 'noun', 1),
    (1, 'museum', 'museum', 'noun', 1),
    (1, 'passport control', 'passport control', 'noun', 1),
    (1, 'security', 'security', 'noun', 1),
    (1, 'stamp', 'stamp', 'noun', 1),
    (1, 'timetable', 'timetable', 'noun', 1),
    (1, 'tour', 'tour', 'noun', 1),
    (1, 'guide', 'guide', 'noun', 1),
    (1, 'currency', 'currency', 'noun', 1),
    (1, 'adapter', 'adapter', 'noun', 1),
    (1, 'insurance', 'insurance', 'noun', 1);

-- RU translations (guarded by NOT EXISTS)
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'повестка дня', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'agenda'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'выделять; распределять', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'allocate'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'актив', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'asset'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'аудит; проверка', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'audit'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'ориентир; эталон', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'benchmark'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'заявка; предложение цены', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'bid'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'премия', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'bonus'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'бренд', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'brand'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'бюджет', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'budget'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'кампания', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'campaign'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'денежный поток', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'cash flow'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'клиент', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'client'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'сотрудничать', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'collaborate'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'комиссия', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'commission'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'конкурент', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'competitor'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'соответствие требованиям', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'compliance'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'консультант', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'consultant'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'контракт; договор', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'contract'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'корпоративный', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'corporate'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'экономически выгодный', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'cost-effective'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'кредит; кредит доверия', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'credit'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'срок сдачи', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'deadline'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'результат работы', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'deliverable'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'отдел', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'department'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'скидка', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'discount'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'дивиденд', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'dividend'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'проверка благонадёжности', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'due diligence'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'прибыль; доход', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'earnings'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'эффективность', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'efficiency'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'сотрудник', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'employee'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'предприниматель', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'entrepreneur'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'акционерный капитал', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'equity'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'оценка; смета', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'estimate'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'расход', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'expense'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'обратная связь', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'feedback'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'прогноз', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'forecast'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'франшиза', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'franchise'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'финансирование', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'funding'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'штаб-квартира', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'headquarters'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'нанимать', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'hire'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'внедрение', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'implementation'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'стимул; мотивация', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'incentive'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'доход', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'income'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'отрасль', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'industry'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'инфляция', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'inflation'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'инициатива', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'initiative'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'инновация', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'innovation'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'товарные запасы', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'inventory'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'инвестировать', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'invest'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'счёт на оплату', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'invoice'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'совместное предприятие', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'joint venture'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'стартовая встреча', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'kickoff'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'сокращение штата', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'layoff'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'использовать как преимущество', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'leverage'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'обязательство; ответственность', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'liability'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'логистика', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'logistics'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'маржа', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'margin'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'рынок', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'market'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'слияние', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'merger'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'этап; веха', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'milestone'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'вести переговоры', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'negotiate'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'нетворкинг', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'networking'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'цель', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'objective'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'операционная деятельность', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'operations'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'возможность', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'opportunity'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'отдавать на аутсорс', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'outsource'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'накладные расходы', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'overhead'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'партнёрство', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'partnership'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'фонд оплаты труда', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'payroll'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'результаты; эффективность', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'performance'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'презентация идеи', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'pitch'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'политика; правило', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'policy'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'портфель', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'portfolio'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'прибыль', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'profit'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'повышение; акция', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'promotion'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'предложение; заявка', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'proposal'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'приобретать', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'purchase'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'квартальный', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'quarterly'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'коммерческое предложение', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'quote'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'рекрутер', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'recruiter'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'регулирование; норма', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'regulation'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'удалённый', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'remote'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'отчёт', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'report'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'увольняться', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'resign'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'ресурс', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'resource'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'розничная торговля', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'retail'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'выручка', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'revenue'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'риск', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'risk'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'дорожная карта', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'roadmap'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'зарплата', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'salary'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'продажи', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'sales'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'масштабировать', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'scale'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'график', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'schedule'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'акционер', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'shareholder'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'доставка; отгрузка', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'shipping'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'нехватка', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'shortage'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'набор навыков', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'skill set'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'заинтересованная сторона', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'stakeholder'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'стартап', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'startup'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'стратегия', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'strategy'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'цепочка поставок', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'supply chain'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'опрос', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'survey'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'цель; показатель', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'target'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'налог', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'tax'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'тендер', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'tender'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'сроки', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'timeline'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'торговля', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'trade'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'обучение', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'training'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'транзакция', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'transaction'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'текучесть кадров; оборот', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'turnover'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'обновлять; повышать', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'upgrade'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'поставщик', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'vendor'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'венчур; предприятие', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'venture'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'склад', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'warehouse'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'гарантия', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'warranty'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'оптовая торговля', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'wholesale'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'рабочий процесс', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'workflow'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'доходность', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'yield'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'аннотация', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'abstract'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'анализ', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'analysis'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'аргумент', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'argument'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'оценивать', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'assess'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'задание', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'assignment'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'допущение', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'assumption'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'библиография', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'bibliography'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'кейс; исследование случая', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'case study'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'цитирование', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'citation'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'утверждение', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'claim'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'сравнивать', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'compare'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'вывод; заключение', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'conclusion'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'контекст', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'context'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'критерий', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'criterion'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'критический разбор', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'critique'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'данные', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'data'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'дискуссия', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'debate'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'определять', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'define'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'диссертация', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'dissertation'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'черновик', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'draft'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'эссе', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'essay'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'доказательства', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'evidence'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'исследовать; рассматривать', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'examine'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'эксперимент', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'experiment'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'результаты исследования', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'findings'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'рамка; модель', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'framework'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'гипотеза', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'hypothesis'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'следствие; вывод', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'implication'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'интерпретировать', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'interpret'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'научный журнал', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'journal'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'лекция', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'lecture'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'литература (по теме)', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'literature'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'методология', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'methodology'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'план; структура', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'outline'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'абзац', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'paragraph'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'перефразировать', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'paraphrase'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'рецензирование', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'peer review'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'плагиат', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'plagiarism'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'посылка', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'premise'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'качественный', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'qualitative'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'количественный', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'quantitative'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'опросник', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'questionnaire'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'ссылка; источник', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'reference'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'выборка', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'sample'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'учёный', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'scholar'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'семинар', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'seminar'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'источник', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'source'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'статистика', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'statistics'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'краткое изложение', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'summary'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'теория', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'theory'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'тезис; диссертация', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'thesis'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'переменная', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'variable'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'мастер-класс; воркшоп', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'workshop'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'подход', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'approach'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'глава', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'chapter'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'понятие', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'concept'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'противопоставлять', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'contrast'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'вносить вклад', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'contribute'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'выводить; получать', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'derive'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'оценивать', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'evaluate'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'фактор', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'factor'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'черта; особенность', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'feature'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'выявлять; определять', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'identify'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'иллюстрировать', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'illustrate'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'указывать', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'indicate'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'проблема; вопрос', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'issue'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'метод', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'method'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'происходить', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'occur'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'процент', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'percent'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'период', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'period'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'принцип', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'principle'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'процедура', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'procedure'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'процесс', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'process'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'требовать', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'require'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'исследование', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'research'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'роль', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'role'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'раздел', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'section'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'значимый', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'significant'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'похожий', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'similar'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'конкретный', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'specific'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'структура', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'structure'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'последующий', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'subsequent'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'достаточный', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'sufficient'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'теоретический', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'theoretical'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'обоснованный', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'valid'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'тогда как', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'whereas'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'сноска', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'footnote'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'приложение', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'appendix'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'связность', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'coherence'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'научный руководитель', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'supervisor'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'аэропорт', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'airport'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'проход', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'aisle'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'прибытие', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'arrival'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'багаж', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'baggage'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'посадочный талон', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'boarding pass'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'бронирование', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'booking'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'салон самолёта', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'cabin'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'регистрация', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'check-in'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'пересадка', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'connection'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'таможня', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'customs'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'задержка', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'delay'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'вылет; отправление', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'departure'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'пункт назначения', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'destination'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'беспошлинный', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'duty-free'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'посольство', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'embassy'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'стоимость проезда', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'fare'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'рейс', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'flight'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'выход на посадку', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'gate'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'отель', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'hotel'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'маршрут', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'itinerary'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'поездка; путь', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'journey'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'стыковка; ожидание', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'layover'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'багаж', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'luggage'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'паспорт', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'passport'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'бронь', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'reservation'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'осмотр достопримечательностей', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'sightseeing'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'сувенир', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'souvenir'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'чемодан', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'suitcase'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'терминал', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'terminal'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'билет', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'ticket'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'виза', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'visa'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'платформа', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'platform'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'ресепшен', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'reception'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'обслуживание в номер', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'room service'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'трансфер; шаттл', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'shuttle'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'такси', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'taxi'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'турист', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'tourist'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'пересадка; трансфер', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'transfer'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'место у окна', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'window seat'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'выезжать из отеля', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'check out'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'приземляться', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'land'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'взлетать', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'take off'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'собирать вещи', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'pack'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'бронировать', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'book'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'отменять', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'cancel'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'подтверждать', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'confirm'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'обменивать (валюту)', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'exchange'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'потерянный', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'lost'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'в одну сторону', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'one-way'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'туда и обратно', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'round-trip'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'свободный; доступный', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'available'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'переполненный', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'crowded'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'внутренний (рейс)', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'domestic'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'международный', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'international'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'прямой (без посадок)', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'nonstop'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'с овербукингом', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'overbooked'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'с возвратом денег', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'refundable'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'одноместный', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'single'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'двухместный', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'double'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'хостел', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'hostel'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'карта', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'map'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'музей', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'museum'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'паспортный контроль', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'passport control'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'досмотр; служба безопасности', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'security'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'штамп', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'stamp'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'расписание', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'timetable'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'экскурсия', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'tour'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'гид', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'guide'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'валюта', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'currency'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'переходник', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'adapter'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'страховка', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'insurance'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );

-- Usage examples (skip if a seed example already exists)
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The agenda for Monday is already on Slack.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'agenda'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'We allocated extra budget to marketing.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'allocate'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'People are our most valuable asset.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'asset'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The annual audit starts next week.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'audit'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Use last quarter as a benchmark.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'benchmark'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'They submitted a bid for the contract.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'bid'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Everyone received a year-end bonus.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'bonus'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The brand is stronger in Europe.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'brand'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'We went over budget this month.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'budget'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The ad campaign launches on Friday.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'campaign'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Positive cash flow kept the startup alive.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'cash flow'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The client asked for a shorter timeline.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'client'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Design and product collaborate daily.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'collaborate'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Sales staff earn a 5% commission.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'commission'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'A new competitor entered the market.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'competitor'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The team handles legal compliance.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'compliance'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'We hired a consultant for the rollout.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'consultant'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Please review the contract before signing.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'contract'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'She moved into a corporate role.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'corporate'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Remote work is more cost-effective.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'cost-effective'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The company has a strong credit rating.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'credit'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The deadline is Thursday at noon.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'deadline'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The first deliverable is a prototype.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'deliverable'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Which department owns this metric?', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'department'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'We offered a 10% discount.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'discount'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Shareholders received a higher dividend.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'dividend'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Due diligence took six weeks.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'due diligence'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Earnings beat analyst expectations.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'earnings'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Automation improved efficiency.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'efficiency'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Every employee gets a laptop.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'employee'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'She became an entrepreneur at 24.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'entrepreneur'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'They raised equity from two funds.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'equity'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Send me a rough estimate by Friday.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'estimate'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Travel is the largest expense.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'expense'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'I need feedback on the draft.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'feedback'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The forecast looks cautious.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'forecast'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'They opened a new franchise downtown.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'franchise'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The round closed with $4m in funding.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'funding'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Headquarters moved to Austin.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'headquarters'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'We need to hire two engineers.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'hire'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Implementation starts in May.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'implementation'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The bonus is a strong incentive.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'incentive'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Rental income covers the loan.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'income'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The industry is consolidating.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'industry'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Inflation is slowing hiring.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'inflation'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'This initiative came from support.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'initiative'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Innovation is part of the culture.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'innovation'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Inventory is too high this quarter.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'inventory'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'They invest 15% of revenue in R&D.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'invest'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Please pay the invoice within 14 days.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'invoice'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The joint venture launched in Seoul.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'joint venture'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Kickoff is at 10:00 tomorrow.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'kickoff'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The layoff affected fifty people.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'layoff'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'We can leverage existing data.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'leverage'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Insurance reduced our liability.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'liability'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Logistics delayed the shipment.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'logistics'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Gross margin improved by 2%.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'margin'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The market is more competitive now.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'market'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The merger was approved yesterday.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'merger'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Shipping v1 is the next milestone.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'milestone'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'We negotiated a better rate.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'negotiate'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Networking helped her find a lead.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'networking'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The objective is to cut churn.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'objective'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Operations runs 24/7.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'operations'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'This is a rare opportunity.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'opportunity'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'They outsource payroll.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'outsource'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Rent is our biggest overhead.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'overhead'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The partnership opens Asia.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'partnership'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Payroll runs on the last Friday.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'payroll'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Performance reviews are in June.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'performance'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Her pitch lasted eight minutes.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'pitch'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The refund policy is on the site.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'policy'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The portfolio is overweight in tech.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'portfolio'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Profit rose after the price change.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'profit'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'He got a promotion in March.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'promotion'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'I sent the proposal last night.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'proposal'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'We purchase licenses annually.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'purchase'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Quarterly results come out Friday.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'quarterly'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Can you send a quote today?', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'quote'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'A recruiter reached out on LinkedIn.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'recruiter'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'New regulation starts in January.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'regulation'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The role is fully remote.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'remote'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The weekly report is due Monday.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'report'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'She resigned to start a company.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'resign'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'We lack a design resource.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'resource'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Retail sales dropped in July.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'retail'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Revenue grew 18% year over year.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'revenue'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Currency risk is still high.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'risk'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The roadmap covers the next year.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'roadmap'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The salary is above market.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'salary'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Sales beat the target again.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'sales'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Can this process scale to 10 teams?', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'scale'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The schedule slipped by a week.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'schedule'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Shareholders voted for the deal.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'shareholder'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Shipping takes three business days.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'shipping'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'There is a shortage of chips.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'shortage'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Her skill set fits the role.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'skill set'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Update every stakeholder today.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'stakeholder'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The startup raised a seed round.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'startup'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The strategy is to go upmarket.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'strategy'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The supply chain is still fragile.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'supply chain'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'We ran a customer survey.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'survey'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'We missed the Q2 target.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'target'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Tax season starts in April.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'tax'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'They won the public tender.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'tender'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The timeline is aggressive.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'timeline'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Trade with the EU is growing.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'trade'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'New-hire training lasts two weeks.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'training'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Each transaction is logged.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'transaction'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Staff turnover is too high.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'turnover'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'We will upgrade the plan in May.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'upgrade'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The vendor missed the SLA.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'vendor'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'This is a high-risk venture.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'venture'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The warehouse is in New Jersey.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'warehouse'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The warranty lasts two years.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'warranty'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Wholesale prices fell slightly.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'wholesale'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The new workflow saves an hour.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'workflow'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Bond yield rose this morning.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'yield'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Write the abstract last.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'abstract'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The analysis supports the claim.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'analysis'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Build a clearer argument.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'argument'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'How will you assess progress?', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'assess'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The assignment is due Friday.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'assignment'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'That assumption is untested.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'assumption'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Add three sources to the bibliography.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'bibliography'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The case study is from 2019.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'case study'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Every citation needs a page number.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'citation'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'What evidence supports this claim?', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'claim'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Compare the two methods.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'compare'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The conclusion is too short.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'conclusion'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Give more historical context.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'context'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Clarity is the first criterion.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'criterion'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Her critique was fair.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'critique'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The data is incomplete.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'data'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The debate lasted an hour.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'debate'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Please define the term.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'define'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'He is finishing his dissertation.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'dissertation'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Send me the first draft.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'draft'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The essay needs a stronger thesis.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'essay'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Where is the evidence?', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'evidence'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Examine the results carefully.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'examine'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The experiment failed twice.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'experiment'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The findings were unexpected.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'findings'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'We used a simple framework.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'framework'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The hypothesis was rejected.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'hypothesis'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The policy implication is clear.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'implication'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'How do you interpret figure 2?', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'interpret'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The paper is in a top journal.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'journal'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The lecture is on Thursday.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'lecture'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The literature is thin on this.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'literature'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Describe your methodology.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'methodology'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Start with a one-page outline.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'outline'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'This paragraph is too long.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'paragraph'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Paraphrase the quote.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'paraphrase'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The article is in peer review.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'peer review'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The tool flagged possible plagiarism.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'plagiarism'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The premise is not proven.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'premise'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'We used qualitative interviews.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'qualitative'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Need more quantitative data.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'quantitative'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, '120 people filled the questionnaire.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'questionnaire'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Add the reference in APA style.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'reference'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The sample is too small.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'sample'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'She is a leading scholar.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'scholar'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The seminar is optional.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'seminar'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Use a more recent source.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'source'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The statistics are outdated.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'statistics'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Write a 200-word summary.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'summary'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The theory does not fit the data.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'theory'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'State your thesis in one sentence.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'thesis'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Age is the independent variable.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'variable'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'I signed up for the writing workshop.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'workshop'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'A mixed-methods approach works here.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'approach'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Read chapter 4 before class.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'chapter'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The concept is hard to define.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'concept'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Contrast the two theories.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'contrast'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'These results contribute to the debate.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'contribute'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'We derive the formula in appendix A.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'derive'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Evaluate the strengths of each model.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'evaluate'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Age is a confounding factor.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'factor'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'A key feature is the sample size.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'feature'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Identify the main limitation.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'identify'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Figure 1 illustrates the trend.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'illustrate'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The results indicate a weak effect.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'indicate'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The main issue is bias.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'issue'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The method is described below.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'method'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'This pattern does not occur in adults.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'occur'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Only 12 percent completed the course.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'percent'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The study covers a five-year period.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'period'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The first principle is transparency.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'principle'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Follow the same procedure twice.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'procedure'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The process took three months.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'process'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The task does not require prior knowledge.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'require'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Further research is needed.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'research'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'What role does culture play?', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'role'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'See section 3.2 for details.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'section'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The difference is statistically significant.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'significant'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The results are similar to Smith (2018).', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'similar'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Be more specific in the abstract.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'specific'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The essay needs a clearer structure.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'structure'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Subsequent studies found the opposite.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'subsequent'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The sample is not sufficient.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'sufficient'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The paper is mainly theoretical.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'theoretical'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Is this a valid conclusion?', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'valid'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Group A improved', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'whereas'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Move that claim to a footnote.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'footnote'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The raw scores are in the appendix.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'appendix'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The paragraph lacks coherence.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'coherence'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Talk to your supervisor first.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'supervisor'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'We arrived at the airport early.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'airport'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'I prefer an aisle seat.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'aisle'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Arrival is at 18:40.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'arrival'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Baggage claim is on level 1.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'baggage'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Show your boarding pass at the gate.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'boarding pass'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The booking is under my name.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'booking'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The cabin crew was helpful.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'cabin'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Online check-in opens 24 hours before.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'check-in'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The connection is only 40 minutes.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'connection'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Go through customs after baggage.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'customs'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The delay was due to weather.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'delay'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Departure is from gate B12.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'departure'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Rome is our final destination.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'destination'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'She bought perfume in duty-free.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'duty-free'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The embassy issued a new visa.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'embassy'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The train fare is cheaper.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'fare'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The flight was overbooked.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'flight'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Please proceed to the gate.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'gate'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The hotel is near the station.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'hotel'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'I emailed you the itinerary.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'itinerary'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The journey takes nine hours.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'journey'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'We have a two-hour layover.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'layover'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'How many pieces of luggage?', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'luggage'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'My passport expires in May.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'passport'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Do you have a reservation?', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'reservation'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'We spent the day sightseeing.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'sightseeing'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'He bought a cheap souvenir.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'souvenir'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The suitcase is overweight.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'suitcase'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'We are in terminal 2.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'terminal'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'I lost my return ticket.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'ticket'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'You need a visa for this trip.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'visa'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The train leaves from platform 4.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'platform'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Leave the key at reception.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'reception'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'We ordered room service.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'room service'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The hotel shuttle is free.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'shuttle'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'A taxi is faster at this hour.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'taxi'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The square was full of tourists.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'tourist'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Is this a direct flight or a transfer?', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'transfer'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'She asked for a window seat.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'window seat'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'We need to check out by 11.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'check out'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'We land at 7 a.m.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'land'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The plane will take off soon.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'take off'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'I still need to pack.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'pack'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Book the hotel tonight.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'book'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Can I cancel without a fee?', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'cancel'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Please confirm the reservation.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'confirm'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'I need to exchange dollars.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'exchange'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'I filed a report for lost luggage.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'lost'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'I bought a one-way ticket.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'one-way'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'A round-trip is cheaper.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'round-trip'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Is a twin room available?', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'available'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The metro was crowded.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'crowded'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'This is a domestic flight.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'domestic'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Go to international arrivals.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'international'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'We found a nonstop flight.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'nonstop'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The flight was overbooked.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'overbooked'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Is the fare refundable?', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'refundable'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'I booked a single room.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'single'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'We need a double room.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'double'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The hostel is near the old town.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'hostel'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Do you have a city map?', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'map'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The museum is closed on Monday.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'museum'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Passport control was quick.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'passport control'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Security took twenty minutes.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'security'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'They put a stamp in my passport.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'stamp'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Check the timetable on the board.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'timetable'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The walking tour starts at nine.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'tour'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Our guide spoke slowly.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'guide'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'What currency do they take?', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'currency'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'I forgot my power adapter.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'adapter'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Travel insurance covered the delay.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'insurance'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );

-- Link 118 items → Business English
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 1
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'agenda'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 2
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'allocate'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 3
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'asset'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 4
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'audit'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 5
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'benchmark'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 6
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'bid'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 7
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'bonus'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 8
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'brand'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 9
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'budget'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 10
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'campaign'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 11
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'cash flow'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 12
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'client'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 13
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'collaborate'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 14
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'commission'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 15
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'competitor'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 16
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'compliance'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 17
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'consultant'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 18
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'contract'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 19
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'corporate'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 20
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'cost-effective'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 21
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'credit'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 22
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'deadline'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 23
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'deliverable'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 24
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'department'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 25
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'discount'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 26
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'dividend'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 27
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'due diligence'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 28
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'earnings'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 29
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'efficiency'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 30
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'employee'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 31
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'entrepreneur'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 32
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'equity'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 33
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'estimate'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 34
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'expense'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 35
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'feedback'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 36
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'forecast'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 37
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'franchise'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 38
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'funding'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 39
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'headquarters'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 40
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'hire'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 41
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'implementation'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 42
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'incentive'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 43
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'income'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 44
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'industry'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 45
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'inflation'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 46
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'initiative'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 47
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'innovation'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 48
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'inventory'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 49
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'invest'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 50
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'invoice'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 51
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'joint venture'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 52
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'kickoff'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 53
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'layoff'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 54
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'leverage'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 55
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'liability'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 56
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'logistics'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 57
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'margin'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 58
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'market'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 59
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'merger'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 60
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'milestone'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 61
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'negotiate'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 62
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'networking'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 63
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'objective'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 64
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'operations'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 65
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'opportunity'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 66
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'outsource'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 67
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'overhead'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 68
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'partnership'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 69
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'payroll'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 70
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'performance'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 71
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'pitch'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 72
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'policy'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 73
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'portfolio'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 74
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'profit'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 75
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'promotion'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 76
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'proposal'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 77
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'purchase'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 78
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'quarterly'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 79
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'quote'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 80
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'recruiter'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 81
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'regulation'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 82
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'remote'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 83
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'report'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 84
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'resign'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 85
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'resource'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 86
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'retail'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 87
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'revenue'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 88
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'risk'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 89
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'roadmap'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 90
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'salary'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 91
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'sales'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 92
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'scale'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 93
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'schedule'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 94
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'shareholder'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 95
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'shipping'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 96
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'shortage'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 97
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'skill set'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 98
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'stakeholder'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 99
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'startup'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 100
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'strategy'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 101
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'supply chain'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 102
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'survey'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 103
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'target'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 104
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'tax'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 105
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'tender'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 106
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'timeline'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 107
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'trade'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 108
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'training'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 109
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'transaction'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 110
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'turnover'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 111
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'upgrade'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 112
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'vendor'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 113
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'venture'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 114
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'warehouse'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 115
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'warranty'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 116
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'wholesale'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 117
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'workflow'
WHERE c.name = 'Business English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 118
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'yield'
WHERE c.name = 'Business English';

-- Link 90 items → Academic English
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 1
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'abstract'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 2
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'analysis'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 3
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'argument'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 4
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'assess'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 5
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'assignment'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 6
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'assumption'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 7
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'bibliography'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 8
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'case study'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 9
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'citation'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 10
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'claim'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 11
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'compare'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 12
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'conclusion'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 13
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'context'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 14
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'criterion'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 15
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'critique'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 16
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'data'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 17
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'debate'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 18
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'define'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 19
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'dissertation'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 20
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'draft'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 21
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'essay'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 22
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'evidence'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 23
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'examine'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 24
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'experiment'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 25
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'findings'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 26
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'framework'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 27
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'hypothesis'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 28
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'implication'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 29
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'interpret'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 30
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'journal'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 31
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'lecture'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 32
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'literature'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 33
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'methodology'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 34
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'outline'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 35
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'paragraph'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 36
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'paraphrase'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 37
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'peer review'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 38
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'plagiarism'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 39
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'premise'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 40
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'qualitative'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 41
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'quantitative'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 42
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'questionnaire'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 43
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'reference'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 44
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'sample'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 45
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'scholar'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 46
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'seminar'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 47
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'source'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 48
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'statistics'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 49
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'summary'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 50
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'theory'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 51
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'thesis'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 52
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'variable'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 53
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'workshop'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 54
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'approach'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 55
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'chapter'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 56
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'concept'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 57
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'contrast'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 58
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'contribute'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 59
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'derive'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 60
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'evaluate'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 61
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'factor'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 62
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'feature'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 63
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'identify'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 64
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'illustrate'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 65
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'indicate'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 66
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'issue'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 67
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'method'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 68
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'occur'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 69
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'percent'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 70
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'period'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 71
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'principle'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 72
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'procedure'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 73
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'process'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 74
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'require'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 75
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'research'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 76
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'role'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 77
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'section'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 78
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'significant'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 79
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'similar'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 80
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'specific'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 81
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'structure'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 82
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'subsequent'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 83
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'sufficient'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 84
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'theoretical'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 85
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'valid'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 86
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'whereas'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 87
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'footnote'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 88
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'appendix'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 89
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'coherence'
WHERE c.name = 'Academic English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 90
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'supervisor'
WHERE c.name = 'Academic English';

-- Link 72 items → Travel English
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 1
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'airport'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 2
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'aisle'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 3
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'arrival'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 4
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'baggage'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 5
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'boarding pass'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 6
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'booking'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 7
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'cabin'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 8
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'check-in'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 9
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'connection'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 10
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'customs'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 11
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'delay'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 12
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'departure'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 13
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'destination'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 14
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'duty-free'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 15
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'embassy'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 16
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'fare'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 17
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'flight'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 18
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'gate'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 19
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'hotel'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 20
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'itinerary'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 21
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'journey'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 22
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'layover'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 23
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'luggage'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 24
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'passport'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 25
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'reservation'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 26
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'sightseeing'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 27
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'souvenir'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 28
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'suitcase'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 29
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'terminal'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 30
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'ticket'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 31
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'visa'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 32
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'platform'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 33
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'reception'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 34
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'room service'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 35
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'shuttle'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 36
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'taxi'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 37
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'tourist'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 38
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'transfer'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 39
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'window seat'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 40
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'check out'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 41
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'land'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 42
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'take off'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 43
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'pack'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 44
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'book'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 45
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'cancel'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 46
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'confirm'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 47
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'exchange'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 48
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'lost'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 49
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'one-way'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 50
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'round-trip'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 51
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'valid'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 52
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'available'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 53
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'crowded'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 54
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'domestic'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 55
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'international'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 56
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'nonstop'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 57
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'overbooked'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 58
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'refundable'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 59
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'single'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 60
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'double'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 61
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'hostel'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 62
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'map'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 63
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'museum'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 64
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'passport control'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 65
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'security'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 66
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'stamp'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 67
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'timetable'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 68
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'tour'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 69
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'guide'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 70
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'currency'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 71
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'adapter'
WHERE c.name = 'Travel English';
INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, 72
FROM collection c
JOIN lexeme l ON l.language_id = 1 AND l.normalized_text = 'insurance'
WHERE c.name = 'Travel English';
