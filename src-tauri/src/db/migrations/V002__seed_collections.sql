-- ============================================================
-- LEXORA — V002: Seed system collections with content
-- GENERATED FILE. Do not edit by hand.
-- Regenerate with any of:
--   python3 scripts/seed/import_frequency.py
--   python3 scripts/seed/import_phrasal.py
--   python3 scripts/seed/import_irregular.py
-- Source data: scripts/seed/data/*.csv
-- Generated at: 2026-08-20T16:56:57.813507+00:00
--
-- Idempotent: every statement is INSERT OR IGNORE or guarded by
-- NOT EXISTS, so re-applying this migration changes nothing.
--
-- Data representation decisions:
--  * Irregular verbs: the lexeme is the BASE form only (pos='verb');
--    past / participle forms are stored in translation.sense as
--    "past: <past>; participle: <participle>" next to the RU
--    translation. No separate lexemes are created for past forms.
--  * Phrasal verbs: one lexeme per phrasal verb (pos='phrasal_verb'),
--    RU translation in translation (source='seed'), usage example
--    in example (source='seed').
--  * Frequency words: lexeme rows with frequency_rank; part_of_speech
--    is filled where known (top function/content words), else NULL.
--  * 'Business English' is intentionally left empty (no data yet).
-- ============================================================

-- ── Section 1: Top 5000 Words (frequency lexicon) ──────────
-- 2000 lexemes, source: scripts/seed/data/top5000.csv

INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'you', 'you', 'pron', 1, 1),
    (1, 'the', 'the', 'det', 2, 1),
    (1, 'to', 'to', 'prep', 3, 1),
    (1, 'it', 'it', 'pron', 4, 1),
    (1, 'and', 'and', 'conj', 5, 1),
    (1, 'that', 'that', 'det', 6, 1),
    (1, 'of', 'of', 'prep', 7, 1),
    (1, 'is', 'is', 'verb', 8, 1),
    (1, 'in', 'in', 'prep', 9, 1),
    (1, 'what', 'what', 'pron', 10, 1),
    (1, 'we', 'we', 'pron', 11, 1),
    (1, 'me', 'me', 'pron', 12, 1),
    (1, 'this', 'this', 'det', 13, 1),
    (1, 'he', 'he', 'pron', 14, 1),
    (1, 'for', 'for', 'prep', 15, 1),
    (1, 'my', 'my', 'det', 16, 1),
    (1, 'on', 'on', 'prep', 17, 1),
    (1, 'have', 'have', 'verb', 18, 1),
    (1, 'your', 'your', 'det', 19, 1),
    (1, 'do', 'do', 'verb', 20, 1),
    (1, 'was', 'was', 'verb', 21, 1),
    (1, 'no', 'no', 'adv', 22, 1),
    (1, 'not', 'not', 'adv', 23, 1),
    (1, 'be', 'be', 'verb', 24, 1),
    (1, 'are', 'are', 'verb', 25, 1),
    (1, 'know', 'know', 'verb', 26, 1),
    (1, 'can', 'can', 'verb', 27, 1),
    (1, 'with', 'with', 'prep', 28, 1),
    (1, 'but', 'but', 'conj', 29, 1),
    (1, 'all', 'all', NULL, 30, 1),
    (1, 'so', 'so', 'conj', 31, 1),
    (1, 'just', 'just', 'adv', 32, 1),
    (1, 'there', 'there', 'adv', 33, 1),
    (1, 'here', 'here', 'adv', 34, 1),
    (1, 'they', 'they', 'pron', 35, 1),
    (1, 'like', 'like', 'verb', 36, 1),
    (1, 'get', 'get', 'verb', 37, 1),
    (1, 'she', 'she', 'pron', 38, 1),
    (1, 'go', 'go', 'verb', 39, 1),
    (1, 'if', 'if', 'conj', 40, 1),
    (1, 'right', 'right', 'adj', 41, 1),
    (1, 'out', 'out', 'prep', 42, 1),
    (1, 'about', 'about', 'prep', 43, 1),
    (1, 'up', 'up', 'prep', 44, 1),
    (1, 'at', 'at', 'prep', 45, 1),
    (1, 'him', 'him', 'pron', 46, 1),
    (1, 'now', 'now', 'adv', 47, 1),
    (1, 'one', 'one', 'num', 48, 1),
    (1, 'come', 'come', 'verb', 49, 1),
    (1, 'well', 'well', 'adv', 50, 1),
    (1, 'her', 'her', 'pron', 51, 1),
    (1, 'how', 'how', 'adv', 52, 1),
    (1, 'will', 'will', 'verb', 53, 1),
    (1, 'got', 'got', NULL, 54, 1),
    (1, 'want', 'want', 'verb', 55, 1),
    (1, 'think', 'think', 'verb', 56, 1),
    (1, 'as', 'as', 'conj', 57, 1),
    (1, 'see', 'see', 'verb', 58, 1),
    (1, 'did', 'did', 'verb', 59, 1),
    (1, 'good', 'good', 'adj', 60, 1),
    (1, 'who', 'who', 'pron', 61, 1),
    (1, 'why', 'why', 'adv', 62, 1),
    (1, 'from', 'from', 'prep', 63, 1),
    (1, 'let', 'let', 'verb', 64, 1),
    (1, 'his', 'his', 'det', 65, 1),
    (1, 'yes', 'yes', 'adv', 66, 1),
    (1, 'when', 'when', 'adv', 67, 1),
    (1, 'going', 'going', NULL, 68, 1),
    (1, 'time', 'time', 'noun', 69, 1),
    (1, 'an', 'an', 'det', 70, 1),
    (1, 'back', 'back', 'adv', 71, 1),
    (1, 'look', 'look', 'verb', 72, 1),
    (1, 'us', 'us', 'pron', 73, 1),
    (1, 'would', 'would', 'verb', 74, 1),
    (1, 'them', 'them', 'pron', 75, 1),
    (1, 'where', 'where', 'adv', 76, 1),
    (1, 'were', 'were', 'verb', 77, 1),
    (1, 'take', 'take', 'verb', 78, 1),
    (1, 'then', 'then', 'adv', 79, 1),
    (1, 'had', 'had', 'verb', 80, 1),
    (1, 'or', 'or', 'conj', 81, 1),
    (1, 'been', 'been', 'verb', 82, 1),
    (1, 'our', 'our', 'det', 83, 1),
    (1, 'tell', 'tell', 'verb', 84, 1),
    (1, 'really', 'really', 'adv', 85, 1),
    (1, 'man', 'man', 'noun', 86, 1),
    (1, 'some', 'some', NULL, 87, 1),
    (1, 'say', 'say', 'verb', 88, 1),
    (1, 'could', 'could', 'verb', 89, 1),
    (1, 'by', 'by', 'prep', 90, 1),
    (1, 'need', 'need', 'verb', 91, 1),
    (1, 'something', 'something', 'pron', 92, 1),
    (1, 'has', 'has', 'verb', 93, 1),
    (1, 'too', 'too', 'adv', 94, 1),
    (1, 'more', 'more', NULL, 95, 1),
    (1, 'way', 'way', 'noun', 96, 1),
    (1, 'down', 'down', 'prep', 97, 1),
    (1, 'make', 'make', 'verb', 98, 1),
    (1, 'very', 'very', 'adv', 99, 1),
    (1, 'never', 'never', 'adv', 100, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'only', 'only', 'adv', 101, 1),
    (1, 'people', 'people', 'noun', 102, 1),
    (1, 'over', 'over', 'prep', 103, 1),
    (1, 'because', 'because', 'conj', 104, 1),
    (1, 'little', 'little', 'adj', 105, 1),
    (1, 'please', 'please', NULL, 106, 1),
    (1, 'love', 'love', 'verb', 107, 1),
    (1, 'should', 'should', 'verb', 108, 1),
    (1, 'mean', 'mean', 'verb', 109, 1),
    (1, 'said', 'said', NULL, 110, 1),
    (1, 'sorry', 'sorry', NULL, 111, 1),
    (1, 'give', 'give', 'verb', 112, 1),
    (1, 'off', 'off', 'prep', 113, 1),
    (1, 'am', 'am', 'verb', 114, 1),
    (1, 'thank', 'thank', NULL, 115, 1),
    (1, 'any', 'any', NULL, 116, 1),
    (1, 'two', 'two', 'num', 117, 1),
    (1, 'even', 'even', 'adv', 118, 1),
    (1, 'much', 'much', NULL, 119, 1),
    (1, 'doing', 'doing', 'verb', 120, 1),
    (1, 'sure', 'sure', 'adj', 121, 1),
    (1, 'thing', 'thing', 'noun', 122, 1),
    (1, 'these', 'these', 'det', 123, 1),
    (1, 'help', 'help', 'verb', 124, 1),
    (1, 'first', 'first', 'num', 125, 1),
    (1, 'into', 'into', 'prep', 126, 1),
    (1, 'anything', 'anything', 'pron', 127, 1),
    (1, 'still', 'still', 'adv', 128, 1),
    (1, 'find', 'find', 'verb', 129, 1),
    (1, 'life', 'life', 'noun', 130, 1),
    (1, 'nothing', 'nothing', 'noun', 131, 1),
    (1, 'sir', 'sir', NULL, 132, 1),
    (1, 'day', 'day', 'noun', 133, 1),
    (1, 'god', 'god', NULL, 134, 1),
    (1, 'work', 'work', 'noun', 135, 1),
    (1, 'their', 'their', 'det', 136, 1),
    (1, 'again', 'again', 'adv', 137, 1),
    (1, 'maybe', 'maybe', 'adv', 138, 1),
    (1, 'must', 'must', 'verb', 139, 1),
    (1, 'before', 'before', 'prep', 140, 1),
    (1, 'other', 'other', 'adj', 141, 1),
    (1, 'wait', 'wait', 'verb', 142, 1),
    (1, 'stop', 'stop', 'verb', 143, 1),
    (1, 'call', 'call', 'verb', 144, 1),
    (1, 'after', 'after', 'prep', 145, 1),
    (1, 'talk', 'talk', 'verb', 146, 1),
    (1, 'away', 'away', 'adv', 147, 1),
    (1, 'than', 'than', 'conj', 148, 1),
    (1, 'thought', 'thought', NULL, 149, 1),
    (1, 'home', 'home', 'noun', 150, 1),
    (1, 'night', 'night', 'noun', 151, 1),
    (1, 'put', 'put', 'verb', 152, 1),
    (1, 'great', 'great', 'adj', 153, 1),
    (1, 'those', 'those', 'det', 154, 1),
    (1, 'last', 'last', 'adj', 155, 1),
    (1, 'better', 'better', 'adj', 156, 1),
    (1, 'everything', 'everything', 'pron', 157, 1),
    (1, 'told', 'told', NULL, 158, 1),
    (1, 'new', 'new', 'adj', 159, 1),
    (1, 'things', 'things', NULL, 160, 1),
    (1, 'always', 'always', 'adv', 161, 1),
    (1, 'keep', 'keep', 'verb', 162, 1),
    (1, 'long', 'long', 'adj', 163, 1),
    (1, 'years', 'years', NULL, 164, 1),
    (1, 'leave', 'leave', 'verb', 165, 1),
    (1, 'does', 'does', 'verb', 166, 1),
    (1, 'money', 'money', 'noun', 167, 1),
    (1, 'around', 'around', 'prep', 168, 1),
    (1, 'name', 'name', 'noun', 169, 1),
    (1, 'place', 'place', 'noun', 170, 1),
    (1, 'ever', 'ever', NULL, 171, 1),
    (1, 'feel', 'feel', 'verb', 172, 1),
    (1, 'guys', 'guys', NULL, 173, 1),
    (1, 'father', 'father', 'noun', 174, 1),
    (1, 'guy', 'guy', 'noun', 175, 1),
    (1, 'made', 'made', NULL, 176, 1),
    (1, 'old', 'old', 'adj', 177, 1),
    (1, 'which', 'which', 'pron', 178, 1),
    (1, 'big', 'big', 'adj', 179, 1),
    (1, 'lot', 'lot', 'noun', 180, 1),
    (1, 'done', 'done', 'verb', 181, 1),
    (1, 'hello', 'hello', NULL, 182, 1),
    (1, 'nice', 'nice', 'adj', 183, 1),
    (1, 'believe', 'believe', 'verb', 184, 1),
    (1, 'girl', 'girl', 'noun', 185, 1),
    (1, 'someone', 'someone', 'pron', 186, 1),
    (1, 'fine', 'fine', NULL, 187, 1),
    (1, 'thanks', 'thanks', NULL, 188, 1),
    (1, 'wanted', 'wanted', NULL, 189, 1),
    (1, 'kind', 'kind', 'noun', 190, 1),
    (1, 'coming', 'coming', NULL, 191, 1),
    (1, 'house', 'house', 'noun', 192, 1),
    (1, 'every', 'every', NULL, 193, 1),
    (1, 'through', 'through', 'prep', 194, 1),
    (1, 'being', 'being', 'verb', 195, 1),
    (1, 'course', 'course', NULL, 196, 1),
    (1, 'stay', 'stay', 'verb', 197, 1),
    (1, 'left', 'left', NULL, 198, 1),
    (1, 'dad', 'dad', NULL, 199, 1),
    (1, 'enough', 'enough', 'adv', 200, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'happened', 'happened', NULL, 201, 1),
    (1, 'came', 'came', NULL, 202, 1),
    (1, 'may', 'may', 'verb', 203, 1),
    (1, 'mother', 'mother', 'noun', 204, 1),
    (1, 'wrong', 'wrong', 'adj', 205, 1),
    (1, 'world', 'world', 'noun', 206, 1),
    (1, 'bad', 'bad', 'adj', 207, 1),
    (1, 'might', 'might', 'verb', 208, 1),
    (1, 'three', 'three', 'num', 209, 1),
    (1, 'today', 'today', 'adv', 210, 1),
    (1, 'listen', 'listen', 'verb', 211, 1),
    (1, 'another', 'another', NULL, 212, 1),
    (1, 'understand', 'understand', 'verb', 213, 1),
    (1, 'hear', 'hear', 'verb', 214, 1),
    (1, 'remember', 'remember', 'verb', 215, 1),
    (1, 'ask', 'ask', 'verb', 216, 1),
    (1, 'own', 'own', 'adj', 217, 1),
    (1, 'same', 'same', 'adj', 218, 1),
    (1, 'show', 'show', NULL, 219, 1),
    (1, 'else', 'else', NULL, 220, 1),
    (1, 'kill', 'kill', 'verb', 221, 1),
    (1, 'talking', 'talking', NULL, 222, 1),
    (1, 'found', 'found', NULL, 223, 1),
    (1, 'next', 'next', 'adj', 224, 1),
    (1, 'getting', 'getting', NULL, 225, 1),
    (1, 'care', 'care', NULL, 226, 1),
    (1, 'car', 'car', 'noun', 227, 1),
    (1, 'looking', 'looking', NULL, 228, 1),
    (1, 'son', 'son', NULL, 229, 1),
    (1, 'try', 'try', 'verb', 230, 1),
    (1, 'woman', 'woman', 'noun', 231, 1),
    (1, 'went', 'went', NULL, 232, 1),
    (1, 'hi', 'hi', NULL, 233, 1),
    (1, 'dead', 'dead', NULL, 234, 1),
    (1, 'many', 'many', NULL, 235, 1),
    (1, 'mind', 'mind', 'noun', 236, 1),
    (1, 'friend', 'friend', 'noun', 237, 1),
    (1, 'best', 'best', 'adj', 238, 1),
    (1, 'mom', 'mom', NULL, 239, 1),
    (1, 'hell', 'hell', NULL, 240, 1),
    (1, 'morning', 'morning', 'noun', 241, 1),
    (1, 'trying', 'trying', NULL, 242, 1),
    (1, 'boy', 'boy', 'noun', 243, 1),
    (1, 'together', 'together', NULL, 244, 1),
    (1, 'yourself', 'yourself', 'pron', 245, 1),
    (1, 'job', 'job', 'noun', 246, 1),
    (1, 'saw', 'saw', NULL, 247, 1),
    (1, 'family', 'family', 'noun', 248, 1),
    (1, 'real', 'real', 'adj', 249, 1),
    (1, 'without', 'without', 'prep', 250, 1),
    (1, 'baby', 'baby', NULL, 251, 1),
    (1, 'room', 'room', 'noun', 252, 1),
    (1, 'already', 'already', 'adv', 253, 1),
    (1, 'move', 'move', 'verb', 254, 1),
    (1, 'most', 'most', NULL, 255, 1),
    (1, 'seen', 'seen', NULL, 256, 1),
    (1, 'live', 'live', 'verb', 257, 1),
    (1, 'miss', 'miss', NULL, 258, 1),
    (1, 'actually', 'actually', 'adv', 259, 1),
    (1, 'shit', 'shit', NULL, 260, 1),
    (1, 'both', 'both', NULL, 261, 1),
    (1, 'heard', 'heard', NULL, 262, 1),
    (1, 'once', 'once', 'conj', 263, 1),
    (1, 'ready', 'ready', 'adj', 264, 1),
    (1, 'head', 'head', 'noun', 265, 1),
    (1, 'called', 'called', NULL, 266, 1),
    (1, 'used', 'used', NULL, 267, 1),
    (1, 'idea', 'idea', 'noun', 268, 1),
    (1, 'knew', 'knew', NULL, 269, 1),
    (1, 'hold', 'hold', NULL, 270, 1),
    (1, 'happy', 'happy', 'adj', 271, 1),
    (1, 'door', 'door', 'noun', 272, 1),
    (1, 'such', 'such', NULL, 273, 1),
    (1, 'fuck', 'fuck', NULL, 274, 1),
    (1, 'brother', 'brother', NULL, 275, 1),
    (1, 'also', 'also', 'adv', 276, 1),
    (1, 'pretty', 'pretty', NULL, 277, 1),
    (1, 'bit', 'bit', NULL, 278, 1),
    (1, 'took', 'took', NULL, 279, 1),
    (1, 'yet', 'yet', 'adv', 280, 1),
    (1, 'men', 'men', NULL, 281, 1),
    (1, 'whole', 'whole', 'adj', 282, 1),
    (1, 'start', 'start', NULL, 283, 1),
    (1, 'use', 'use', 'verb', 284, 1),
    (1, 'while', 'while', 'conj', 285, 1),
    (1, 'since', 'since', 'prep', 286, 1),
    (1, 'wife', 'wife', NULL, 287, 1),
    (1, 'days', 'days', NULL, 288, 1),
    (1, 'guess', 'guess', NULL, 289, 1),
    (1, 'tomorrow', 'tomorrow', 'adv', 290, 1),
    (1, 'matter', 'matter', NULL, 291, 1),
    (1, 'meet', 'meet', 'verb', 292, 1),
    (1, 'bring', 'bring', 'verb', 293, 1),
    (1, 'tonight', 'tonight', NULL, 294, 1),
    (1, 'everyone', 'everyone', 'pron', 295, 1),
    (1, 'run', 'run', 'verb', 296, 1),
    (1, 'hard', 'hard', 'adj', 297, 1),
    (1, 'alone', 'alone', NULL, 298, 1),
    (1, 'myself', 'myself', 'pron', 299, 1),
    (1, 'school', 'school', 'noun', 300, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'gone', 'gone', NULL, 301, 1),
    (1, 'end', 'end', 'noun', 302, 1),
    (1, 'saying', 'saying', NULL, 303, 1),
    (1, 'phone', 'phone', 'noun', 304, 1),
    (1, 'play', 'play', 'verb', 305, 1),
    (1, 'looks', 'looks', NULL, 306, 1),
    (1, 'fucking', 'fucking', NULL, 307, 1),
    (1, 'problem', 'problem', 'noun', 308, 1),
    (1, 'few', 'few', 'adj', 309, 1),
    (1, 'friends', 'friends', NULL, 310, 1),
    (1, 'ago', 'ago', 'adv', 311, 1),
    (1, 'open', 'open', 'verb', 312, 1),
    (1, 'anyone', 'anyone', 'pron', 313, 1),
    (1, 'killed', 'killed', NULL, 314, 1),
    (1, 'hope', 'hope', 'verb', 315, 1),
    (1, 'face', 'face', 'noun', 316, 1),
    (1, 'until', 'until', 'prep', 317, 1),
    (1, 'lost', 'lost', NULL, 318, 1),
    (1, 'police', 'police', NULL, 319, 1),
    (1, 'excuse', 'excuse', NULL, 320, 1),
    (1, 'turn', 'turn', NULL, 321, 1),
    (1, 'business', 'business', 'noun', 322, 1),
    (1, 'case', 'case', 'noun', 323, 1),
    (1, 'wants', 'wants', NULL, 324, 1),
    (1, 'says', 'says', NULL, 325, 1),
    (1, 'true', 'true', 'adj', 326, 1),
    (1, 'die', 'die', 'verb', 327, 1),
    (1, 'heart', 'heart', 'noun', 328, 1),
    (1, 'soon', 'soon', 'adv', 329, 1),
    (1, 'each', 'each', NULL, 330, 1),
    (1, 'worry', 'worry', NULL, 331, 1),
    (1, 'later', 'later', 'adv', 332, 1),
    (1, 'year', 'year', 'noun', 333, 1),
    (1, 'watch', 'watch', 'verb', 334, 1),
    (1, 'music', 'music', 'noun', 335, 1),
    (1, 'hand', 'hand', 'noun', 336, 1),
    (1, 'having', 'having', 'verb', 337, 1),
    (1, 'probably', 'probably', 'adv', 338, 1),
    (1, 'beautiful', 'beautiful', 'adj', 339, 1),
    (1, 'doctor', 'doctor', NULL, 340, 1),
    (1, 'sit', 'sit', 'verb', 341, 1),
    (1, 'eat', 'eat', 'verb', 342, 1),
    (1, 'thinking', 'thinking', NULL, 343, 1),
    (1, 'young', 'young', 'adj', 344, 1),
    (1, 'second', 'second', 'num', 345, 1),
    (1, 'working', 'working', NULL, 346, 1),
    (1, 'water', 'water', 'noun', 347, 1),
    (1, 'person', 'person', 'noun', 348, 1),
    (1, 'part', 'part', 'noun', 349, 1),
    (1, 'kids', 'kids', NULL, 350, 1),
    (1, 'late', 'late', 'adj', 351, 1),
    (1, 'stuff', 'stuff', NULL, 352, 1),
    (1, 'exactly', 'exactly', NULL, 353, 1),
    (1, 'under', 'under', 'prep', 354, 1),
    (1, 'death', 'death', NULL, 355, 1),
    (1, 'minute', 'minute', 'noun', 356, 1),
    (1, 'pay', 'pay', 'verb', 357, 1),
    (1, 'crazy', 'crazy', NULL, 358, 1),
    (1, 'forget', 'forget', NULL, 359, 1),
    (1, 'everybody', 'everybody', 'pron', 360, 1),
    (1, 'kid', 'kid', 'noun', 361, 1),
    (1, 'change', 'change', 'verb', 362, 1),
    (1, 'gave', 'gave', NULL, 363, 1),
    (1, 'happen', 'happen', 'verb', 364, 1),
    (1, 'damn', 'damn', NULL, 365, 1),
    (1, 'five', 'five', 'num', 366, 1),
    (1, 'drink', 'drink', 'verb', 367, 1),
    (1, 'far', 'far', NULL, 368, 1),
    (1, 'knows', 'knows', NULL, 369, 1),
    (1, 'its', 'its', 'det', 370, 1),
    (1, 'whatever', 'whatever', NULL, 371, 1),
    (1, 'eyes', 'eyes', NULL, 372, 1),
    (1, 'shut', 'shut', NULL, 373, 1),
    (1, 'hit', 'hit', 'verb', 374, 1),
    (1, 'taking', 'taking', NULL, 375, 1),
    (1, 'easy', 'easy', 'adj', 376, 1),
    (1, 'times', 'times', NULL, 377, 1),
    (1, 'check', 'check', NULL, 378, 1),
    (1, 'hands', 'hands', NULL, 379, 1),
    (1, 'minutes', 'minutes', NULL, 380, 1),
    (1, 'deal', 'deal', NULL, 381, 1),
    (1, 'different', 'different', 'adj', 382, 1),
    (1, 'means', 'means', NULL, 383, 1),
    (1, 'point', 'point', 'noun', 384, 1),
    (1, 'inside', 'inside', 'prep', 385, 1),
    (1, 'makes', 'makes', NULL, 386, 1),
    (1, 'asked', 'asked', NULL, 387, 1),
    (1, 'somebody', 'somebody', 'pron', 388, 1),
    (1, 'mine', 'mine', NULL, 389, 1),
    (1, 'making', 'making', NULL, 390, 1),
    (1, 'body', 'body', 'noun', 391, 1),
    (1, 'afraid', 'afraid', NULL, 392, 1),
    (1, 'sleep', 'sleep', 'verb', 393, 1),
    (1, 'chance', 'chance', NULL, 394, 1),
    (1, 'dear', 'dear', NULL, 395, 1),
    (1, 'quite', 'quite', 'adv', 396, 1),
    (1, 'four', 'four', 'num', 397, 1),
    (1, 'anyway', 'anyway', 'adv', 398, 1),
    (1, 'close', 'close', NULL, 399, 1),
    (1, 'party', 'party', 'noun', 400, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'fun', 'fun', NULL, 401, 1),
    (1, 'against', 'against', 'prep', 402, 1),
    (1, 'word', 'word', 'noun', 403, 1),
    (1, 'comes', 'comes', NULL, 404, 1),
    (1, 'important', 'important', 'adj', 405, 1),
    (1, 'set', 'set', 'verb', 406, 1),
    (1, 'shall', 'shall', 'verb', 407, 1),
    (1, 'story', 'story', 'noun', 408, 1),
    (1, 'number', 'number', 'noun', 409, 1),
    (1, 'daughter', 'daughter', NULL, 410, 1),
    (1, 'least', 'least', NULL, 411, 1),
    (1, 'waiting', 'waiting', NULL, 412, 1),
    (1, 'hurt', 'hurt', NULL, 413, 1),
    (1, 'wish', 'wish', NULL, 414, 1),
    (1, 'moment', 'moment', 'noun', 415, 1),
    (1, 'fight', 'fight', NULL, 416, 1),
    (1, 'week', 'week', 'noun', 417, 1),
    (1, 'husband', 'husband', NULL, 418, 1),
    (1, 'girls', 'girls', NULL, 419, 1),
    (1, 'rest', 'rest', NULL, 420, 1),
    (1, 'married', 'married', NULL, 421, 1),
    (1, 'fire', 'fire', 'noun', 422, 1),
    (1, 'game', 'game', 'noun', 423, 1),
    (1, 'nobody', 'nobody', 'pron', 424, 1),
    (1, 'mr', 'mr', NULL, 425, 1),
    (1, 'children', 'children', NULL, 426, 1),
    (1, 'side', 'side', 'noun', 427, 1),
    (1, 'stand', 'stand', 'verb', 428, 1),
    (1, 'read', 'read', 'verb', 429, 1),
    (1, 'though', 'though', 'conj', 430, 1),
    (1, 'cut', 'cut', 'verb', 431, 1),
    (1, 'started', 'started', NULL, 432, 1),
    (1, 'sister', 'sister', NULL, 433, 1),
    (1, 'supposed', 'supposed', NULL, 434, 1),
    (1, 'between', 'between', 'prep', 435, 1),
    (1, 'child', 'child', 'noun', 436, 1),
    (1, 'goes', 'goes', NULL, 437, 1),
    (1, 'hours', 'hours', NULL, 438, 1),
    (1, 'speak', 'speak', 'verb', 439, 1),
    (1, 'women', 'women', NULL, 440, 1),
    (1, 'behind', 'behind', 'prep', 441, 1),
    (1, 'almost', 'almost', 'adv', 442, 1),
    (1, 'truth', 'truth', NULL, 443, 1),
    (1, 'blood', 'blood', 'noun', 444, 1),
    (1, 'able', 'able', 'adj', 445, 1),
    (1, 'lady', 'lady', NULL, 446, 1),
    (1, 'anymore', 'anymore', NULL, 447, 1),
    (1, 'playing', 'playing', NULL, 448, 1),
    (1, 'gets', 'gets', NULL, 449, 1),
    (1, 'shot', 'shot', NULL, 450, 1),
    (1, 'reason', 'reason', 'noun', 451, 1),
    (1, 'trouble', 'trouble', NULL, 452, 1),
    (1, 'break', 'break', 'verb', 453, 1),
    (1, 'war', 'war', 'noun', 454, 1),
    (1, 'city', 'city', 'noun', 455, 1),
    (1, 'walk', 'walk', 'verb', 456, 1),
    (1, 'town', 'town', NULL, 457, 1),
    (1, 'trust', 'trust', NULL, 458, 1),
    (1, 'met', 'met', NULL, 459, 1),
    (1, 'office', 'office', 'noun', 460, 1),
    (1, 'question', 'question', 'noun', 461, 1),
    (1, 'brought', 'brought', NULL, 462, 1),
    (1, 'yours', 'yours', NULL, 463, 1),
    (1, 'welcome', 'welcome', NULL, 464, 1),
    (1, 'high', 'high', 'adj', 465, 1),
    (1, 'couple', 'couple', NULL, 466, 1),
    (1, 'half', 'half', NULL, 467, 1),
    (1, 'died', 'died', NULL, 468, 1),
    (1, 'cool', 'cool', 'adj', 469, 1),
    (1, 'free', 'free', 'adj', 470, 1),
    (1, 'either', 'either', NULL, 471, 1),
    (1, 'seems', 'seems', NULL, 472, 1),
    (1, 'power', 'power', 'noun', 473, 1),
    (1, 'bye', 'bye', NULL, 474, 1),
    (1, 'buy', 'buy', 'verb', 475, 1),
    (1, 'telling', 'telling', NULL, 476, 1),
    (1, 'honey', 'honey', NULL, 477, 1),
    (1, 'tried', 'tried', NULL, 478, 1),
    (1, 'front', 'front', NULL, 479, 1),
    (1, 'team', 'team', 'noun', 480, 1),
    (1, 'answer', 'answer', 'verb', 481, 1),
    (1, 'gun', 'gun', NULL, 482, 1),
    (1, 'boys', 'boys', NULL, 483, 1),
    (1, 'line', 'line', 'noun', 484, 1),
    (1, 'send', 'send', 'verb', 485, 1),
    (1, 'news', 'news', NULL, 486, 1),
    (1, 'stupid', 'stupid', NULL, 487, 1),
    (1, 'bed', 'bed', NULL, 488, 1),
    (1, 'hurry', 'hurry', NULL, 489, 1),
    (1, 'full', 'full', 'adj', 490, 1),
    (1, 'months', 'months', NULL, 491, 1),
    (1, 'save', 'save', NULL, 492, 1),
    (1, 'sometimes', 'sometimes', 'adv', 493, 1),
    (1, 'become', 'become', NULL, 494, 1),
    (1, 'along', 'along', 'prep', 495, 1),
    (1, 'hate', 'hate', 'verb', 496, 1),
    (1, 'food', 'food', 'noun', 497, 1),
    (1, 'outside', 'outside', 'prep', 498, 1),
    (1, 'light', 'light', 'adj', 499, 1),
    (1, 'needs', 'needs', NULL, 500, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'dog', 'dog', 'noun', 501, 1),
    (1, 'country', 'country', 'noun', 502, 1),
    (1, 'clear', 'clear', 'adj', 503, 1),
    (1, 'order', 'order', NULL, 504, 1),
    (1, 'fact', 'fact', 'noun', 505, 1),
    (1, 'lord', 'lord', NULL, 506, 1),
    (1, 'captain', 'captain', NULL, 507, 1),
    (1, 'six', 'six', 'num', 508, 1),
    (1, 'hot', 'hot', 'adj', 509, 1),
    (1, 'funny', 'funny', NULL, 510, 1),
    (1, 'black', 'black', NULL, 511, 1),
    (1, 'alive', 'alive', NULL, 512, 1),
    (1, 'pick', 'pick', NULL, 513, 1),
    (1, 'feeling', 'feeling', NULL, 514, 1),
    (1, 'living', 'living', NULL, 515, 1),
    (1, 'ahead', 'ahead', NULL, 516, 1),
    (1, 'lose', 'lose', 'verb', 517, 1),
    (1, 'king', 'king', NULL, 518, 1),
    (1, 'plan', 'plan', NULL, 519, 1),
    (1, 'dinner', 'dinner', NULL, 520, 1),
    (1, 'sighs', 'sighs', NULL, 521, 1),
    (1, 'sort', 'sort', NULL, 522, 1),
    (1, 'leaving', 'leaving', NULL, 523, 1),
    (1, 'running', 'running', NULL, 524, 1),
    (1, 'boss', 'boss', NULL, 525, 1),
    (1, 'promise', 'promise', NULL, 526, 1),
    (1, 'taken', 'taken', NULL, 527, 1),
    (1, 'safe', 'safe', 'adj', 528, 1),
    (1, 'ma', 'ma', NULL, 529, 1),
    (1, 'book', 'book', 'noun', 530, 1),
    (1, 'sent', 'sent', NULL, 531, 1),
    (1, 'white', 'white', NULL, 532, 1),
    (1, 'hour', 'hour', 'noun', 533, 1),
    (1, 'anybody', 'anybody', 'pron', 534, 1),
    (1, 'small', 'small', 'adj', 535, 1),
    (1, 'perfect', 'perfect', NULL, 536, 1),
    (1, 'lives', 'lives', NULL, 537, 1),
    (1, 'special', 'special', 'adj', 538, 1),
    (1, 'parents', 'parents', NULL, 539, 1),
    (1, 'john', 'john', NULL, 540, 1),
    (1, 'himself', 'himself', 'pron', 541, 1),
    (1, 'perhaps', 'perhaps', 'adv', 542, 1),
    (1, 'sounds', 'sounds', NULL, 543, 1),
    (1, 'serious', 'serious', 'adj', 544, 1),
    (1, 'sick', 'sick', NULL, 545, 1),
    (1, 'company', 'company', 'noun', 546, 1),
    (1, 'ha', 'ha', NULL, 547, 1),
    (1, 'scared', 'scared', NULL, 548, 1),
    (1, 'uncle', 'uncle', NULL, 549, 1),
    (1, 'poor', 'poor', 'adj', 550, 1),
    (1, 'red', 'red', NULL, 551, 1),
    (1, 'past', 'past', 'prep', 552, 1),
    (1, 'earth', 'earth', NULL, 553, 1),
    (1, 'possible', 'possible', 'adj', 554, 1),
    (1, 'shoot', 'shoot', NULL, 555, 1),
    (1, 'touch', 'touch', NULL, 556, 1),
    (1, 'sound', 'sound', NULL, 557, 1),
    (1, 'top', 'top', NULL, 558, 1),
    (1, 'ass', 'ass', NULL, 559, 1),
    (1, 'laughs', 'laughs', NULL, 560, 1),
    (1, 'cannot', 'cannot', NULL, 561, 1),
    (1, 'asking', 'asking', NULL, 562, 1),
    (1, 'win', 'win', 'verb', 563, 1),
    (1, 'glad', 'glad', NULL, 564, 1),
    (1, 'control', 'control', NULL, 565, 1),
    (1, 'human', 'human', 'adj', 566, 1),
    (1, 'drive', 'drive', 'verb', 567, 1),
    (1, 'hair', 'hair', 'noun', 568, 1),
    (1, 'jack', 'jack', NULL, 569, 1),
    (1, 'bitch', 'bitch', NULL, 570, 1),
    (1, 'luck', 'luck', NULL, 571, 1),
    (1, 'murder', 'murder', NULL, 572, 1),
    (1, 'happens', 'happens', NULL, 573, 1),
    (1, 'air', 'air', 'noun', 574, 1),
    (1, 'ten', 'ten', 'num', 575, 1),
    (1, 'daddy', 'daddy', NULL, 576, 1),
    (1, 'finally', 'finally', NULL, 577, 1),
    (1, 'chuckles', 'chuckles', NULL, 578, 1),
    (1, 'fast', 'fast', 'adj', 579, 1),
    (1, 'cold', 'cold', 'adj', 580, 1),
    (1, 'seem', 'seem', 'verb', 581, 1),
    (1, 'laughing', 'laughing', NULL, 582, 1),
    (1, 'words', 'words', NULL, 583, 1),
    (1, 'hospital', 'hospital', NULL, 584, 1),
    (1, 'street', 'street', 'noun', 585, 1),
    (1, 'hang', 'hang', NULL, 586, 1),
    (1, 'dance', 'dance', 'verb', 587, 1),
    (1, 'meeting', 'meeting', NULL, 588, 1),
    (1, 'till', 'till', 'prep', 589, 1),
    (1, 'others', 'others', NULL, 590, 1),
    (1, 'catch', 'catch', 'verb', 591, 1),
    (1, 'follow', 'follow', 'verb', 592, 1),
    (1, 'sense', 'sense', NULL, 593, 1),
    (1, 'sex', 'sex', NULL, 594, 1),
    (1, 'lie', 'lie', NULL, 595, 1),
    (1, 'evening', 'evening', NULL, 596, 1),
    (1, 'master', 'master', NULL, 597, 1),
    (1, 'known', 'known', NULL, 598, 1),
    (1, 'dream', 'dream', NULL, 599, 1),
    (1, 'write', 'write', 'verb', 600, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'million', 'million', 'num', 601, 1),
    (1, 'voice', 'voice', 'noun', 602, 1),
    (1, 'sweet', 'sweet', NULL, 603, 1),
    (1, 'rather', 'rather', 'adv', 604, 1),
    (1, 'felt', 'felt', NULL, 605, 1),
    (1, 'sign', 'sign', NULL, 606, 1),
    (1, 'lucky', 'lucky', NULL, 607, 1),
    (1, 'somewhere', 'somewhere', 'adv', 608, 1),
    (1, 'bet', 'bet', NULL, 609, 1),
    (1, 'jesus', 'jesus', NULL, 610, 1),
    (1, 'longer', 'longer', NULL, 611, 1),
    (1, 'calling', 'calling', NULL, 612, 1),
    (1, 'worked', 'worked', NULL, 613, 1),
    (1, 'quiet', 'quiet', NULL, 614, 1),
    (1, 'looked', 'looked', NULL, 615, 1),
    (1, 'less', 'less', NULL, 616, 1),
    (1, 'pull', 'pull', 'verb', 617, 1),
    (1, 'beat', 'beat', NULL, 618, 1),
    (1, 'careful', 'careful', NULL, 619, 1),
    (1, 'coffee', 'coffee', NULL, 620, 1),
    (1, 'return', 'return', 'verb', 621, 1),
    (1, 'secret', 'secret', NULL, 622, 1),
    (1, 'weeks', 'weeks', NULL, 623, 1),
    (1, 'date', 'date', NULL, 624, 1),
    (1, 'seeing', 'seeing', NULL, 625, 1),
    (1, 'fall', 'fall', 'verb', 626, 1),
    (1, 'given', 'given', NULL, 627, 1),
    (1, 'ooh', 'ooh', NULL, 628, 1),
    (1, 'fault', 'fault', NULL, 629, 1),
    (1, 'straight', 'straight', NULL, 630, 1),
    (1, 'takes', 'takes', NULL, 631, 1),
    (1, 'song', 'song', NULL, 632, 1),
    (1, 'future', 'future', NULL, 633, 1),
    (1, 'gentlemen', 'gentlemen', NULL, 634, 1),
    (1, 'loved', 'loved', NULL, 635, 1),
    (1, 'changed', 'changed', NULL, 636, 1),
    (1, 'road', 'road', NULL, 637, 1),
    (1, 'calm', 'calm', NULL, 638, 1),
    (1, 'wonderful', 'wonderful', NULL, 639, 1),
    (1, 'mad', 'mad', NULL, 640, 1),
    (1, 'turned', 'turned', NULL, 641, 1),
    (1, 'drop', 'drop', NULL, 642, 1),
    (1, 'ladies', 'ladies', NULL, 643, 1),
    (1, 'learn', 'learn', 'verb', 644, 1),
    (1, 'step', 'step', NULL, 645, 1),
    (1, 'absolutely', 'absolutely', NULL, 646, 1),
    (1, 'early', 'early', 'adj', 647, 1),
    (1, 'explain', 'explain', 'verb', 648, 1),
    (1, 'clean', 'clean', 'verb', 649, 1),
    (1, 'piece', 'piece', NULL, 650, 1),
    (1, 'yesterday', 'yesterday', 'adv', 651, 1),
    (1, 'throw', 'throw', NULL, 652, 1),
    (1, 'picture', 'picture', NULL, 653, 1),
    (1, 'land', 'land', NULL, 654, 1),
    (1, 'feet', 'feet', NULL, 655, 1),
    (1, 'wonder', 'wonder', NULL, 656, 1),
    (1, 'questions', 'questions', NULL, 657, 1),
    (1, 'speaking', 'speaking', NULL, 658, 1),
    (1, 'worth', 'worth', NULL, 659, 1),
    (1, 'darling', 'darling', NULL, 660, 1),
    (1, 'dude', 'dude', NULL, 661, 1),
    (1, 'giving', 'giving', NULL, 662, 1),
    (1, 'president', 'president', NULL, 663, 1),
    (1, 'eye', 'eye', 'noun', 664, 1),
    (1, 'quick', 'quick', NULL, 665, 1),
    (1, 'moving', 'moving', NULL, 666, 1),
    (1, 'figure', 'figure', NULL, 667, 1),
    (1, 'state', 'state', 'noun', 668, 1),
    (1, 'strong', 'strong', 'adj', 669, 1),
    (1, 'sam', 'sam', NULL, 670, 1),
    (1, 'none', 'none', NULL, 671, 1),
    (1, 'amazing', 'amazing', NULL, 672, 1),
    (1, 'ones', 'ones', NULL, 673, 1),
    (1, 'works', 'works', NULL, 674, 1),
    (1, 'act', 'act', NULL, 675, 1),
    (1, 'needed', 'needed', NULL, 676, 1),
    (1, 'weird', 'weird', NULL, 677, 1),
    (1, 'law', 'law', 'noun', 678, 1),
    (1, 'worried', 'worried', NULL, 679, 1),
    (1, 'report', 'report', 'verb', 680, 1),
    (1, 'goodbye', 'goodbye', NULL, 681, 1),
    (1, 'missing', 'missing', NULL, 682, 1),
    (1, 'choice', 'choice', NULL, 683, 1),
    (1, 'happening', 'happening', NULL, 684, 1),
    (1, 'chief', 'chief', NULL, 685, 1),
    (1, 'wedding', 'wedding', NULL, 686, 1),
    (1, 'strange', 'strange', NULL, 687, 1),
    (1, 'general', 'general', NULL, 688, 1),
    (1, 'pain', 'pain', NULL, 689, 1),
    (1, 'kidding', 'kidding', NULL, 690, 1),
    (1, 'decided', 'decided', NULL, 691, 1),
    (1, 'ya', 'ya', NULL, 692, 1),
    (1, 'pass', 'pass', 'verb', 693, 1),
    (1, 'tired', 'tired', NULL, 694, 1),
    (1, 'class', 'class', NULL, 695, 1),
    (1, 'officer', 'officer', NULL, 696, 1),
    (1, 'kept', 'kept', NULL, 697, 1),
    (1, 'wake', 'wake', 'verb', 698, 1),
    (1, 'worse', 'worse', NULL, 699, 1),
    (1, 'busy', 'busy', NULL, 700, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'eh', 'eh', NULL, 701, 1),
    (1, 'mistake', 'mistake', NULL, 702, 1),
    (1, 'kiss', 'kiss', NULL, 703, 1),
    (1, 'court', 'court', NULL, 704, 1),
    (1, 'building', 'building', NULL, 705, 1),
    (1, 'finish', 'finish', NULL, 706, 1),
    (1, 'during', 'during', 'prep', 707, 1),
    (1, 'age', 'age', NULL, 708, 1),
    (1, 'ship', 'ship', NULL, 709, 1),
    (1, 'caught', 'caught', NULL, 710, 1),
    (1, 'marry', 'marry', NULL, 711, 1),
    (1, 'meant', 'meant', NULL, 712, 1),
    (1, 'sell', 'sell', 'verb', 713, 1),
    (1, 'dark', 'dark', 'adj', 714, 1),
    (1, 'watching', 'watching', NULL, 715, 1),
    (1, 'system', 'system', 'noun', 716, 1),
    (1, 'suppose', 'suppose', NULL, 717, 1),
    (1, 'evidence', 'evidence', NULL, 718, 1),
    (1, 'movie', 'movie', NULL, 719, 1),
    (1, 'ride', 'ride', NULL, 720, 1),
    (1, 'completely', 'completely', NULL, 721, 1),
    (1, 'mouth', 'mouth', 'noun', 722, 1),
    (1, 'totally', 'totally', NULL, 723, 1),
    (1, 'birthday', 'birthday', NULL, 724, 1),
    (1, 'tv', 'tv', NULL, 725, 1),
    (1, 'forgive', 'forgive', NULL, 726, 1),
    (1, 'born', 'born', NULL, 727, 1),
    (1, 'imagine', 'imagine', NULL, 728, 1),
    (1, 'information', 'information', 'noun', 729, 1),
    (1, 'instead', 'instead', 'adv', 730, 1),
    (1, 'definitely', 'definitely', NULL, 731, 1),
    (1, 'security', 'security', NULL, 732, 1),
    (1, 'certainly', 'certainly', NULL, 733, 1),
    (1, 'film', 'film', NULL, 734, 1),
    (1, 'month', 'month', 'noun', 735, 1),
    (1, 'lying', 'lying', NULL, 736, 1),
    (1, 'unless', 'unless', 'conj', 737, 1),
    (1, 'train', 'train', NULL, 738, 1),
    (1, 'seven', 'seven', 'num', 739, 1),
    (1, 'wear', 'wear', 'verb', 740, 1),
    (1, 'clothes', 'clothes', NULL, 741, 1),
    (1, 'michael', 'michael', NULL, 742, 1),
    (1, 'hotel', 'hotel', NULL, 743, 1),
    (1, 'christmas', 'christmas', NULL, 744, 1),
    (1, 'attack', 'attack', NULL, 745, 1),
    (1, 'round', 'round', NULL, 746, 1),
    (1, 'expect', 'expect', 'verb', 747, 1),
    (1, 'sing', 'sing', 'verb', 748, 1),
    (1, 'terrible', 'terrible', NULL, 749, 1),
    (1, 'george', 'george', NULL, 750, 1),
    (1, 'bag', 'bag', NULL, 751, 1),
    (1, 'history', 'history', 'noun', 752, 1),
    (1, 'blue', 'blue', NULL, 753, 1),
    (1, 'near', 'near', 'prep', 754, 1),
    (1, 'broke', 'broke', NULL, 755, 1),
    (1, 'station', 'station', NULL, 756, 1),
    (1, 'seriously', 'seriously', NULL, 757, 1),
    (1, 'forever', 'forever', NULL, 758, 1),
    (1, 'david', 'david', NULL, 759, 1),
    (1, 'frank', 'frank', NULL, 760, 1),
    (1, 'except', 'except', 'prep', 761, 1),
    (1, 'thinks', 'thinks', NULL, 762, 1),
    (1, 'message', 'message', NULL, 763, 1),
    (1, 'entire', 'entire', NULL, 764, 1),
    (1, 'joe', 'joe', NULL, 765, 1),
    (1, 'table', 'table', 'noun', 766, 1),
    (1, 'talked', 'talked', NULL, 767, 1),
    (1, 'across', 'across', 'prep', 768, 1),
    (1, 'rock', 'rock', NULL, 769, 1),
    (1, 'lovely', 'lovely', NULL, 770, 1),
    (1, 'handle', 'handle', NULL, 771, 1),
    (1, 'middle', 'middle', NULL, 772, 1),
    (1, 'buddy', 'buddy', NULL, 773, 1),
    (1, 'paid', 'paid', NULL, 774, 1),
    (1, 'protect', 'protect', NULL, 775, 1),
    (1, 'using', 'using', NULL, 776, 1),
    (1, 'floor', 'floor', NULL, 777, 1),
    (1, 'ran', 'ran', NULL, 778, 1),
    (1, 'swear', 'swear', NULL, 779, 1),
    (1, 'spend', 'spend', 'verb', 780, 1),
    (1, 'situation', 'situation', NULL, 781, 1),
    (1, 'ring', 'ring', NULL, 782, 1),
    (1, 'anywhere', 'anywhere', 'adv', 783, 1),
    (1, 'dangerous', 'dangerous', 'adj', 784, 1),
    (1, 'bill', 'bill', NULL, 785, 1),
    (1, 'york', 'york', NULL, 786, 1),
    (1, 'army', 'army', NULL, 787, 1),
    (1, 'lead', 'lead', 'verb', 788, 1),
    (1, 'bought', 'bought', NULL, 789, 1),
    (1, 'finished', 'finished', NULL, 790, 1),
    (1, 'fair', 'fair', NULL, 791, 1),
    (1, 'sun', 'sun', 'noun', 792, 1),
    (1, 'letter', 'letter', NULL, 793, 1),
    (1, 'fool', 'fool', NULL, 794, 1),
    (1, 'attention', 'attention', NULL, 795, 1),
    (1, 'club', 'club', NULL, 796, 1),
    (1, 'simple', 'simple', 'adj', 797, 1),
    (1, 'interesting', 'interesting', NULL, 798, 1),
    (1, 'space', 'space', NULL, 799, 1),
    (1, 'test', 'test', NULL, 800, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'box', 'box', NULL, 801, 1),
    (1, 'group', 'group', 'noun', 802, 1),
    (1, 'single', 'single', NULL, 803, 1),
    (1, 'sitting', 'sitting', NULL, 804, 1),
    (1, 'marriage', 'marriage', NULL, 805, 1),
    (1, 'join', 'join', 'verb', 806, 1),
    (1, 'fear', 'fear', NULL, 807, 1),
    (1, 'peace', 'peace', NULL, 808, 1),
    (1, 'forgot', 'forgot', NULL, 809, 1),
    (1, 'force', 'force', 'noun', 810, 1),
    (1, 'short', 'short', 'adj', 811, 1),
    (1, 'normal', 'normal', NULL, 812, 1),
    (1, 'charlie', 'charlie', NULL, 813, 1),
    (1, 'present', 'present', NULL, 814, 1),
    (1, 'enjoy', 'enjoy', NULL, 815, 1),
    (1, 'mike', 'mike', NULL, 816, 1),
    (1, 'crime', 'crime', NULL, 817, 1),
    (1, 'horse', 'horse', NULL, 818, 1),
    (1, 'ground', 'ground', NULL, 819, 1),
    (1, 'american', 'american', NULL, 820, 1),
    (1, 'count', 'count', NULL, 821, 1),
    (1, 'area', 'area', 'noun', 822, 1),
    (1, 'charge', 'charge', NULL, 823, 1),
    (1, 'honor', 'honor', NULL, 824, 1),
    (1, 'lunch', 'lunch', NULL, 825, 1),
    (1, 'miles', 'miles', NULL, 826, 1),
    (1, 'radio', 'radio', NULL, 827, 1),
    (1, 'idiot', 'idiot', NULL, 828, 1),
    (1, 'ball', 'ball', NULL, 829, 1),
    (1, 'surprise', 'surprise', NULL, 830, 1),
    (1, 'paper', 'paper', NULL, 831, 1),
    (1, 'key', 'key', NULL, 832, 1),
    (1, 'boat', 'boat', NULL, 833, 1),
    (1, 'quickly', 'quickly', NULL, 834, 1),
    (1, 'gold', 'gold', NULL, 835, 1),
    (1, 'bar', 'bar', NULL, 836, 1),
    (1, 'fish', 'fish', NULL, 837, 1),
    (1, 'mark', 'mark', NULL, 838, 1),
    (1, 'tom', 'tom', NULL, 839, 1),
    (1, 'wearing', 'wearing', NULL, 840, 1),
    (1, 'crying', 'crying', NULL, 841, 1),
    (1, 'accident', 'accident', NULL, 842, 1),
    (1, 'government', 'government', 'noun', 843, 1),
    (1, 'eight', 'eight', 'num', 844, 1),
    (1, 'fell', 'fell', NULL, 845, 1),
    (1, 'cover', 'cover', NULL, 846, 1),
    (1, 'certain', 'certain', 'adj', 847, 1),
    (1, 'interested', 'interested', NULL, 848, 1),
    (1, 'deep', 'deep', NULL, 849, 1),
    (1, 'star', 'star', NULL, 850, 1),
    (1, 'sea', 'sea', NULL, 851, 1),
    (1, 'agree', 'agree', 'verb', 852, 1),
    (1, 'problems', 'problems', NULL, 853, 1),
    (1, 'detective', 'detective', NULL, 854, 1),
    (1, 'prison', 'prison', NULL, 855, 1),
    (1, 'major', 'major', 'adj', 856, 1),
    (1, 'stick', 'stick', NULL, 857, 1),
    (1, 'offer', 'offer', 'verb', 858, 1),
    (1, 'difficult', 'difficult', 'adj', 859, 1),
    (1, 'smart', 'smart', NULL, 860, 1),
    (1, 'personal', 'personal', NULL, 861, 1),
    (1, 'record', 'record', NULL, 862, 1),
    (1, 'stopped', 'stopped', NULL, 863, 1),
    (1, 'hide', 'hide', NULL, 864, 1),
    (1, 'whether', 'whether', 'conj', 865, 1),
    (1, 'bank', 'bank', NULL, 866, 1),
    (1, 'trip', 'trip', NULL, 867, 1),
    (1, 'relax', 'relax', NULL, 868, 1),
    (1, 'america', 'america', NULL, 869, 1),
    (1, 'public', 'public', 'adj', 870, 1),
    (1, 'list', 'list', NULL, 871, 1),
    (1, 'afternoon', 'afternoon', NULL, 872, 1),
    (1, 'brain', 'brain', NULL, 873, 1),
    (1, 'fix', 'fix', NULL, 874, 1),
    (1, 'bastard', 'bastard', NULL, 875, 1),
    (1, 'proud', 'proud', NULL, 876, 1),
    (1, 'tea', 'tea', NULL, 877, 1),
    (1, 'service', 'service', 'noun', 878, 1),
    (1, 'screaming', 'screaming', NULL, 879, 1),
    (1, 'forward', 'forward', NULL, 880, 1),
    (1, 'angry', 'angry', 'adj', 881, 1),
    (1, 'park', 'park', NULL, 882, 1),
    (1, 'soul', 'soul', NULL, 883, 1),
    (1, 'fighting', 'fighting', NULL, 884, 1),
    (1, 'peter', 'peter', NULL, 885, 1),
    (1, 'rich', 'rich', 'adj', 886, 1),
    (1, 'agent', 'agent', NULL, 887, 1),
    (1, 'blow', 'blow', NULL, 888, 1),
    (1, 'paul', 'paul', NULL, 889, 1),
    (1, 'dress', 'dress', NULL, 890, 1),
    (1, 'mary', 'mary', NULL, 891, 1),
    (1, 'missed', 'missed', NULL, 892, 1),
    (1, 'scene', 'scene', NULL, 893, 1),
    (1, 'killing', 'killing', NULL, 894, 1),
    (1, 'standing', 'standing', NULL, 895, 1),
    (1, 'saved', 'saved', NULL, 896, 1),
    (1, 'mm', 'mm', NULL, 897, 1),
    (1, 'respect', 'respect', NULL, 898, 1),
    (1, 'killer', 'killer', NULL, 899, 1),
    (1, 'ice', 'ice', NULL, 900, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'mess', 'mess', NULL, 901, 1),
    (1, 'tough', 'tough', NULL, 902, 1),
    (1, 'feels', 'feels', NULL, 903, 1),
    (1, 'church', 'church', NULL, 904, 1),
    (1, 'sad', 'sad', 'adj', 905, 1),
    (1, 'cell', 'cell', NULL, 906, 1),
    (1, 'drunk', 'drunk', NULL, 907, 1),
    (1, 'share', 'share', NULL, 908, 1),
    (1, 'camera', 'camera', NULL, 909, 1),
    (1, 'mm-hmm', 'mm-hmm', NULL, 910, 1),
    (1, 'within', 'within', 'prep', 911, 1),
    (1, 'card', 'card', NULL, 912, 1),
    (1, 'fly', 'fly', 'verb', 913, 1),
    (1, 'ben', 'ben', NULL, 914, 1),
    (1, 'girlfriend', 'girlfriend', NULL, 915, 1),
    (1, 'laugh', 'laugh', 'verb', 916, 1),
    (1, 'smell', 'smell', NULL, 917, 1),
    (1, 'broken', 'broken', NULL, 918, 1),
    (1, 'mum', 'mum', NULL, 919, 1),
    (1, 'honest', 'honest', NULL, 920, 1),
    (1, 'often', 'often', 'adv', 921, 1),
    (1, 'starting', 'starting', NULL, 922, 1),
    (1, 'calls', 'calls', NULL, 923, 1),
    (1, 'spent', 'spent', NULL, 924, 1),
    (1, 'third', 'third', 'num', 925, 1),
    (1, 'english', 'english', NULL, 926, 1),
    (1, 'visit', 'visit', NULL, 927, 1),
    (1, 'mama', 'mama', NULL, 928, 1),
    (1, 'judge', 'judge', NULL, 929, 1),
    (1, 'window', 'window', NULL, 930, 1),
    (1, 'hungry', 'hungry', NULL, 931, 1),
    (1, 'dare', 'dare', NULL, 932, 1),
    (1, 'relationship', 'relationship', NULL, 933, 1),
    (1, 'moved', 'moved', NULL, 934, 1),
    (1, 'prove', 'prove', NULL, 935, 1),
    (1, 'private', 'private', NULL, 936, 1),
    (1, 'wall', 'wall', NULL, 937, 1),
    (1, 'seat', 'seat', NULL, 938, 1),
    (1, 'i-i', 'i-i', NULL, 939, 1),
    (1, 'position', 'position', NULL, 940, 1),
    (1, 'lieutenant', 'lieutenant', NULL, 941, 1),
    (1, 'realize', 'realize', NULL, 942, 1),
    (1, 'lt', 'lt', NULL, 943, 1),
    (1, 'especially', 'especially', NULL, 944, 1),
    (1, 'machine', 'machine', NULL, 945, 1),
    (1, 'walking', 'walking', NULL, 946, 1),
    (1, 'art', 'art', 'noun', 947, 1),
    (1, 'pleasure', 'pleasure', NULL, 948, 1),
    (1, 'bloody', 'bloody', NULL, 949, 1),
    (1, 'college', 'college', NULL, 950, 1),
    (1, 'french', 'french', NULL, 951, 1),
    (1, 'involved', 'involved', NULL, 952, 1),
    (1, 'cry', 'cry', 'verb', 953, 1),
    (1, 'became', 'became', NULL, 954, 1),
    (1, 'lived', 'lived', NULL, 955, 1),
    (1, 'impossible', 'impossible', 'adj', 956, 1),
    (1, 'obviously', 'obviously', NULL, 957, 1),
    (1, 'neither', 'neither', NULL, 958, 1),
    (1, 'accept', 'accept', NULL, 959, 1),
    (1, 'boyfriend', 'boyfriend', NULL, 960, 1),
    (1, 'besides', 'besides', 'prep', 961, 1),
    (1, 'queen', 'queen', NULL, 962, 1),
    (1, 'teacher', 'teacher', 'noun', 963, 1),
    (1, 'cops', 'cops', NULL, 964, 1),
    (1, 'sake', 'sake', NULL, 965, 1),
    (1, 'loves', 'loves', NULL, 966, 1),
    (1, 'carry', 'carry', 'verb', 967, 1),
    (1, 'teach', 'teach', NULL, 968, 1),
    (1, 'apartment', 'apartment', NULL, 969, 1),
    (1, 'upset', 'upset', NULL, 970, 1),
    (1, 'green', 'green', NULL, 971, 1),
    (1, 'la', 'la', NULL, 972, 1),
    (1, 'liked', 'liked', NULL, 973, 1),
    (1, 'cute', 'cute', NULL, 974, 1),
    (1, 'evil', 'evil', NULL, 975, 1),
    (1, 'professor', 'professor', NULL, 976, 1),
    (1, 'contact', 'contact', NULL, 977, 1),
    (1, 'joke', 'joke', NULL, 978, 1),
    (1, 'cop', 'cop', NULL, 979, 1),
    (1, 'huge', 'huge', NULL, 980, 1),
    (1, 'holy', 'holy', NULL, 981, 1),
    (1, 'store', 'store', NULL, 982, 1),
    (1, 'jail', 'jail', NULL, 983, 1),
    (1, 'likes', 'likes', NULL, 984, 1),
    (1, 'lawyer', 'lawyer', NULL, 985, 1),
    (1, 'doubt', 'doubt', NULL, 986, 1),
    (1, 'continue', 'continue', 'verb', 987, 1),
    (1, 'appreciate', 'appreciate', NULL, 988, 1),
    (1, 'cat', 'cat', 'noun', 989, 1),
    (1, 'shop', 'shop', NULL, 990, 1),
    (1, 'driving', 'driving', NULL, 991, 1),
    (1, 'congratulations', 'congratulations', NULL, 992, 1),
    (1, 'wrote', 'wrote', NULL, 993, 1),
    (1, 'village', 'village', NULL, 994, 1),
    (1, 'quit', 'quit', NULL, 995, 1),
    (1, 'field', 'field', NULL, 996, 1),
    (1, 'james', 'james', NULL, 997, 1),
    (1, 'wine', 'wine', NULL, 998, 1),
    (1, 'decision', 'decision', NULL, 999, 1),
    (1, 'south', 'south', NULL, 1000, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'sleeping', 'sleeping', NULL, 1001, 1),
    (1, 'slow', 'slow', 'adj', 1002, 1),
    (1, 'laughter', 'laughter', NULL, 1003, 1),
    (1, 'island', 'island', NULL, 1004, 1),
    (1, 'glass', 'glass', NULL, 1005, 1),
    (1, 'beginning', 'beginning', NULL, 1006, 1),
    (1, 'cash', 'cash', NULL, 1007, 1),
    (1, 'dying', 'dying', NULL, 1008, 1),
    (1, 'hundred', 'hundred', 'num', 1009, 1),
    (1, 'whose', 'whose', 'pron', 1010, 1),
    (1, 'difference', 'difference', NULL, 1011, 1),
    (1, 'plane', 'plane', NULL, 1012, 1),
    (1, 'push', 'push', NULL, 1013, 1),
    (1, 'continues', 'continues', NULL, 1014, 1),
    (1, 'mmm', 'mmm', NULL, 1015, 1),
    (1, 'singing', 'singing', NULL, 1016, 1),
    (1, 'eating', 'eating', NULL, 1017, 1),
    (1, 'north', 'north', NULL, 1018, 1),
    (1, 'mrs', 'mrs', NULL, 1019, 1),
    (1, 'tree', 'tree', 'noun', 1020, 1),
    (1, 'madam', 'madam', NULL, 1021, 1),
    (1, 'gift', 'gift', NULL, 1022, 1),
    (1, 'truck', 'truck', NULL, 1023, 1),
    (1, 'putting', 'putting', NULL, 1024, 1),
    (1, 'bear', 'bear', NULL, 1025, 1),
    (1, 'board', 'board', NULL, 1026, 1),
    (1, 'grab', 'grab', NULL, 1027, 1),
    (1, 'beer', 'beer', NULL, 1028, 1),
    (1, 'stuck', 'stuck', NULL, 1029, 1),
    (1, 'magic', 'magic', NULL, 1030, 1),
    (1, 'support', 'support', 'verb', 1031, 1),
    (1, 'rules', 'rules', NULL, 1032, 1),
    (1, 'grunts', 'grunts', NULL, 1033, 1),
    (1, 'partner', 'partner', NULL, 1034, 1),
    (1, 'reach', 'reach', 'verb', 1035, 1),
    (1, 'wind', 'wind', NULL, 1036, 1),
    (1, 'colonel', 'colonel', NULL, 1037, 1),
    (1, 'max', 'max', NULL, 1038, 1),
    (1, 'immediately', 'immediately', NULL, 1039, 1),
    (1, 'seconds', 'seconds', NULL, 1040, 1),
    (1, 'thousand', 'thousand', 'num', 1041, 1),
    (1, 'gives', 'gives', NULL, 1042, 1),
    (1, 'experience', 'experience', NULL, 1043, 1),
    (1, 'cheers', 'cheers', NULL, 1044, 1),
    (1, 'victim', 'victim', NULL, 1045, 1),
    (1, 'upon', 'upon', 'prep', 1046, 1),
    (1, 'computer', 'computer', 'noun', 1047, 1),
    (1, 'christ', 'christ', NULL, 1048, 1),
    (1, 'planet', 'planet', NULL, 1049, 1),
    (1, 'promised', 'promised', NULL, 1050, 1),
    (1, 'bus', 'bus', NULL, 1051, 1),
    (1, 'henry', 'henry', NULL, 1052, 1),
    (1, 'dirty', 'dirty', NULL, 1053, 1),
    (1, 'search', 'search', NULL, 1054, 1),
    (1, 'staying', 'staying', NULL, 1055, 1),
    (1, 'dreams', 'dreams', NULL, 1056, 1),
    (1, 'arrest', 'arrest', NULL, 1057, 1),
    (1, 'holding', 'holding', NULL, 1058, 1),
    (1, 'suddenly', 'suddenly', NULL, 1059, 1),
    (1, 'usually', 'usually', 'adv', 1060, 1),
    (1, 'lots', 'lots', NULL, 1061, 1),
    (1, 'shoes', 'shoes', NULL, 1062, 1),
    (1, 'er', 'er', NULL, 1063, 1),
    (1, 'jump', 'jump', NULL, 1064, 1),
    (1, 'rid', 'rid', NULL, 1065, 1),
    (1, 'yo', 'yo', NULL, 1066, 1),
    (1, 'knock', 'knock', NULL, 1067, 1),
    (1, 'owe', 'owe', NULL, 1068, 1),
    (1, 'harry', 'harry', NULL, 1069, 1),
    (1, 'grow', 'grow', 'verb', 1070, 1),
    (1, 'worst', 'worst', NULL, 1071, 1),
    (1, 'river', 'river', NULL, 1072, 1),
    (1, 'aunt', 'aunt', NULL, 1073, 1),
    (1, 'patient', 'patient', NULL, 1074, 1),
    (1, 'kitchen', 'kitchen', NULL, 1075, 1),
    (1, 'aah', 'aah', NULL, 1076, 1),
    (1, 'fat', 'fat', NULL, 1077, 1),
    (1, 'passed', 'passed', NULL, 1078, 1),
    (1, 'final', 'final', 'adj', 1079, 1),
    (1, 'summer', 'summer', NULL, 1080, 1),
    (1, 'bob', 'bob', NULL, 1081, 1),
    (1, 'listening', 'listening', NULL, 1082, 1),
    (1, 'escape', 'escape', NULL, 1083, 1),
    (1, 'everywhere', 'everywhere', 'adv', 1084, 1),
    (1, 'moon', 'moon', 'noun', 1085, 1),
    (1, 'arms', 'arms', NULL, 1086, 1),
    (1, 'turns', 'turns', NULL, 1087, 1),
    (1, 'address', 'address', NULL, 1088, 1),
    (1, 'ow', 'ow', NULL, 1089, 1),
    (1, 'match', 'match', NULL, 1090, 1),
    (1, 'gasps', 'gasps', NULL, 1091, 1),
    (1, 'grand', 'grand', NULL, 1092, 1),
    (1, 'shh', 'shh', NULL, 1093, 1),
    (1, 'nervous', 'nervous', NULL, 1094, 1),
    (1, 'de', 'de', NULL, 1095, 1),
    (1, 'choose', 'choose', 'verb', 1096, 1),
    (1, 'themselves', 'themselves', 'pron', 1097, 1),
    (1, 'decide', 'decide', 'verb', 1098, 1),
    (1, 'mate', 'mate', NULL, 1099, 1),
    (1, 'drinking', 'drinking', NULL, 1100, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'press', 'press', NULL, 1101, 1),
    (1, 'bother', 'bother', NULL, 1102, 1),
    (1, 'foot', 'foot', 'noun', 1103, 1),
    (1, 'blame', 'blame', NULL, 1104, 1),
    (1, 'crap', 'crap', NULL, 1105, 1),
    (1, 'drugs', 'drugs', NULL, 1106, 1),
    (1, 'type', 'type', NULL, 1107, 1),
    (1, 'rings', 'rings', NULL, 1108, 1),
    (1, 'mission', 'mission', NULL, 1109, 1),
    (1, 'named', 'named', NULL, 1110, 1),
    (1, 'heaven', 'heaven', NULL, 1111, 1),
    (1, 'picked', 'picked', NULL, 1112, 1),
    (1, 'paris', 'paris', NULL, 1113, 1),
    (1, 'race', 'race', NULL, 1114, 1),
    (1, 'risk', 'risk', NULL, 1115, 1),
    (1, 'books', 'books', NULL, 1116, 1),
    (1, 'further', 'further', NULL, 1117, 1),
    (1, 'danny', 'danny', NULL, 1118, 1),
    (1, 'action', 'action', NULL, 1119, 1),
    (1, 'allowed', 'allowed', NULL, 1120, 1),
    (1, 'orders', 'orders', NULL, 1121, 1),
    (1, 'learned', 'learned', NULL, 1122, 1),
    (1, 'price', 'price', NULL, 1123, 1),
    (1, 'arrived', 'arrived', NULL, 1124, 1),
    (1, 'nick', 'nick', NULL, 1125, 1),
    (1, 'otherwise', 'otherwise', 'adv', 1126, 1),
    (1, 'pictures', 'pictures', NULL, 1127, 1),
    (1, 'fit', 'fit', NULL, 1128, 1),
    (1, 'smoke', 'smoke', NULL, 1129, 1),
    (1, 'favor', 'favor', NULL, 1130, 1),
    (1, 'played', 'played', NULL, 1131, 1),
    (1, 'notice', 'notice', NULL, 1132, 1),
    (1, 'awesome', 'awesome', NULL, 1133, 1),
    (1, 'smile', 'smile', 'verb', 1134, 1),
    (1, 'director', 'director', NULL, 1135, 1),
    (1, 'guard', 'guard', NULL, 1136, 1),
    (1, 'begin', 'begin', 'verb', 1137, 1),
    (1, 'spot', 'spot', NULL, 1138, 1),
    (1, 'surprised', 'surprised', NULL, 1139, 1),
    (1, 'innocent', 'innocent', NULL, 1140, 1),
    (1, 'narrator', 'narrator', NULL, 1141, 1),
    (1, 'herself', 'herself', 'pron', 1142, 1),
    (1, 'london', 'london', NULL, 1143, 1),
    (1, 'feelings', 'feelings', NULL, 1144, 1),
    (1, 'enemy', 'enemy', NULL, 1145, 1),
    (1, 'battle', 'battle', NULL, 1146, 1),
    (1, 'ourselves', 'ourselves', 'pron', 1147, 1),
    (1, 'alex', 'alex', NULL, 1148, 1),
    (1, 'dollars', 'dollars', NULL, 1149, 1),
    (1, 'allow', 'allow', 'verb', 1150, 1),
    (1, 'nine', 'nine', 'num', 1151, 1),
    (1, 'gay', 'gay', NULL, 1152, 1),
    (1, 'department', 'department', NULL, 1153, 1),
    (1, 'guilty', 'guilty', NULL, 1154, 1),
    (1, 'apart', 'apart', NULL, 1155, 1),
    (1, 'earlier', 'earlier', NULL, 1156, 1),
    (1, 'duty', 'duty', NULL, 1157, 1),
    (1, 'jim', 'jim', NULL, 1158, 1),
    (1, 'suit', 'suit', NULL, 1159, 1),
    (1, 'bell', 'bell', NULL, 1160, 1),
    (1, 'west', 'west', NULL, 1161, 1),
    (1, 'legs', 'legs', NULL, 1162, 1),
    (1, 'hero', 'hero', NULL, 1163, 1),
    (1, 'destroy', 'destroy', NULL, 1164, 1),
    (1, 'stage', 'stage', NULL, 1165, 1),
    (1, 'bunch', 'bunch', NULL, 1166, 1),
    (1, 'according', 'according', NULL, 1167, 1),
    (1, 'chicken', 'chicken', NULL, 1168, 1),
    (1, 'bigger', 'bigger', NULL, 1169, 1),
    (1, 'grunting', 'grunting', NULL, 1170, 1),
    (1, 'low', 'low', NULL, 1171, 1),
    (1, 'helping', 'helping', NULL, 1172, 1),
    (1, 'admit', 'admit', 'verb', 1173, 1),
    (1, 'closed', 'closed', NULL, 1174, 1),
    (1, 'names', 'names', NULL, 1175, 1),
    (1, 'witness', 'witness', NULL, 1176, 1),
    (1, 'upstairs', 'upstairs', NULL, 1177, 1),
    (1, 'arm', 'arm', 'noun', 1178, 1),
    (1, 'steal', 'steal', NULL, 1179, 1),
    (1, 'jimmy', 'jimmy', NULL, 1180, 1),
    (1, 'kick', 'kick', NULL, 1181, 1),
    (1, 'twice', 'twice', NULL, 1182, 1),
    (1, 'cross', 'cross', NULL, 1183, 1),
    (1, 'ways', 'ways', NULL, 1184, 1),
    (1, 'sergeant', 'sergeant', NULL, 1185, 1),
    (1, 'indeed', 'indeed', NULL, 1186, 1),
    (1, 'gas', 'gas', NULL, 1187, 1),
    (1, 'keeping', 'keeping', NULL, 1188, 1),
    (1, 'energy', 'energy', NULL, 1189, 1),
    (1, 'pregnant', 'pregnant', NULL, 1190, 1),
    (1, 'waste', 'waste', NULL, 1191, 1),
    (1, 'helped', 'helped', NULL, 1192, 1),
    (1, 'fired', 'fired', NULL, 1193, 1),
    (1, 'favorite', 'favorite', NULL, 1194, 1),
    (1, 'tony', 'tony', NULL, 1195, 1),
    (1, 'taste', 'taste', NULL, 1196, 1),
    (1, 'locked', 'locked', NULL, 1197, 1),
    (1, 'places', 'places', NULL, 1198, 1),
    (1, 'writing', 'writing', NULL, 1199, 1),
    (1, 'adam', 'adam', NULL, 1200, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'brothers', 'brothers', NULL, 1201, 1),
    (1, 'starts', 'starts', NULL, 1202, 1),
    (1, 'prince', 'prince', NULL, 1203, 1),
    (1, 'form', 'form', NULL, 1204, 1),
    (1, 'sold', 'sold', NULL, 1205, 1),
    (1, 'silly', 'silly', NULL, 1206, 1),
    (1, 'mention', 'mention', NULL, 1207, 1),
    (1, 'build', 'build', 'verb', 1208, 1),
    (1, 'throat', 'throat', NULL, 1209, 1),
    (1, 'hole', 'hole', NULL, 1210, 1),
    (1, 'figured', 'figured', NULL, 1211, 1),
    (1, 'track', 'track', NULL, 1212, 1),
    (1, 'ringing', 'ringing', NULL, 1213, 1),
    (1, 'lock', 'lock', NULL, 1214, 1),
    (1, 'leg', 'leg', 'noun', 1215, 1),
    (1, 'above', 'above', 'prep', 1216, 1),
    (1, 'hiding', 'hiding', NULL, 1217, 1),
    (1, 'steve', 'steve', NULL, 1218, 1),
    (1, 'seemed', 'seemed', NULL, 1219, 1),
    (1, 'breakfast', 'breakfast', NULL, 1220, 1),
    (1, 'engine', 'engine', NULL, 1221, 1),
    (1, 'written', 'written', NULL, 1222, 1),
    (1, 'complete', 'complete', NULL, 1223, 1),
    (1, 'video', 'video', NULL, 1224, 1),
    (1, 'applause', 'applause', NULL, 1225, 1),
    (1, 'however', 'however', 'adv', 1226, 1),
    (1, 'pressure', 'pressure', NULL, 1227, 1),
    (1, 'fresh', 'fresh', NULL, 1228, 1),
    (1, 'weapon', 'weapon', NULL, 1229, 1),
    (1, 'sky', 'sky', NULL, 1230, 1),
    (1, 'stole', 'stole', NULL, 1231, 1),
    (1, 'study', 'study', 'noun', 1232, 1),
    (1, 'burn', 'burn', NULL, 1233, 1),
    (1, 'reading', 'reading', NULL, 1234, 1),
    (1, 'crowd', 'crowd', NULL, 1235, 1),
    (1, 'treat', 'treat', NULL, 1236, 1),
    (1, 'roll', 'roll', NULL, 1237, 1),
    (1, 'double', 'double', NULL, 1238, 1),
    (1, 'spirit', 'spirit', NULL, 1239, 1),
    (1, 'danger', 'danger', NULL, 1240, 1),
    (1, 'cost', 'cost', NULL, 1241, 1),
    (1, 'empty', 'empty', NULL, 1242, 1),
    (1, 'level', 'level', 'noun', 1243, 1),
    (1, 'memory', 'memory', NULL, 1244, 1),
    (1, 'itself', 'itself', 'pron', 1245, 1),
    (1, 'acting', 'acting', NULL, 1246, 1),
    (1, 'interest', 'interest', NULL, 1247, 1),
    (1, 'nose', 'nose', 'noun', 1248, 1),
    (1, 'plans', 'plans', NULL, 1249, 1),
    (1, 'following', 'following', NULL, 1250, 1),
    (1, 'bathroom', 'bathroom', NULL, 1251, 1),
    (1, 'built', 'built', NULL, 1252, 1),
    (1, 'closer', 'closer', NULL, 1253, 1),
    (1, 'ray', 'ray', NULL, 1254, 1),
    (1, 'sarah', 'sarah', NULL, 1255, 1),
    (1, 'band', 'band', NULL, 1256, 1),
    (1, 'groans', 'groans', NULL, 1257, 1),
    (1, 'apparently', 'apparently', NULL, 1258, 1),
    (1, 'excited', 'excited', NULL, 1259, 1),
    (1, 'richard', 'richard', NULL, 1260, 1),
    (1, 'losing', 'losing', NULL, 1261, 1),
    (1, 'animals', 'animals', NULL, 1262, 1),
    (1, 'flight', 'flight', NULL, 1263, 1),
    (1, 'nature', 'nature', NULL, 1264, 1),
    (1, 'raise', 'raise', 'verb', 1265, 1),
    (1, 'pop', 'pop', NULL, 1266, 1),
    (1, 'client', 'client', NULL, 1267, 1),
    (1, 'bomb', 'bomb', NULL, 1268, 1),
    (1, 'neck', 'neck', NULL, 1269, 1),
    (1, 'suspect', 'suspect', NULL, 1270, 1),
    (1, 'warm', 'warm', 'adj', 1271, 1),
    (1, 'extra', 'extra', NULL, 1272, 1),
    (1, 'bottle', 'bottle', NULL, 1273, 1),
    (1, 'van', 'van', NULL, 1274, 1),
    (1, 'heavy', 'heavy', 'adj', 1275, 1),
    (1, 'mommy', 'mommy', NULL, 1276, 1),
    (1, 'dogs', 'dogs', NULL, 1277, 1),
    (1, 'wild', 'wild', NULL, 1278, 1),
    (1, 'ridiculous', 'ridiculous', NULL, 1279, 1),
    (1, 'simply', 'simply', NULL, 1280, 1),
    (1, 'lee', 'lee', NULL, 1281, 1),
    (1, 'animal', 'animal', NULL, 1282, 1),
    (1, 'showed', 'showed', NULL, 1283, 1),
    (1, 'billy', 'billy', NULL, 1284, 1),
    (1, 'shooting', 'shooting', NULL, 1285, 1),
    (1, 'keeps', 'keeps', NULL, 1286, 1),
    (1, 'camp', 'camp', NULL, 1287, 1),
    (1, 'guns', 'guns', NULL, 1288, 1),
    (1, 'medical', 'medical', NULL, 1289, 1),
    (1, 'shame', 'shame', NULL, 1290, 1),
    (1, 'hoping', 'hoping', NULL, 1291, 1),
    (1, 'whom', 'whom', 'pron', 1292, 1),
    (1, 'bird', 'bird', NULL, 1293, 1),
    (1, 'majesty', 'majesty', NULL, 1294, 1),
    (1, 'flowers', 'flowers', NULL, 1295, 1),
    (1, 'famous', 'famous', NULL, 1296, 1),
    (1, 'asleep', 'asleep', NULL, 1297, 1),
    (1, 'beauty', 'beauty', NULL, 1298, 1),
    (1, 'driver', 'driver', NULL, 1299, 1),
    (1, 'keys', 'keys', NULL, 1300, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'rain', 'rain', NULL, 1301, 1),
    (1, 'awful', 'awful', NULL, 1302, 1),
    (1, 'large', 'large', 'adj', 1303, 1),
    (1, 'local', 'local', 'adj', 1304, 1),
    (1, 'deserve', 'deserve', NULL, 1305, 1),
    (1, 'goddamn', 'goddamn', NULL, 1306, 1),
    (1, 'stone', 'stone', NULL, 1307, 1),
    (1, 'jane', 'jane', NULL, 1308, 1),
    (1, 'grace', 'grace', NULL, 1309, 1),
    (1, 'consider', 'consider', 'verb', 1310, 1),
    (1, 'weekend', 'weekend', NULL, 1311, 1),
    (1, 'wondering', 'wondering', NULL, 1312, 1),
    (1, 'lay', 'lay', NULL, 1313, 1),
    (1, 'plenty', 'plenty', NULL, 1314, 1),
    (1, 'willing', 'willing', NULL, 1315, 1),
    (1, 'pants', 'pants', NULL, 1316, 1),
    (1, 'sweetheart', 'sweetheart', NULL, 1317, 1),
    (1, 'skin', 'skin', 'noun', 1318, 1),
    (1, 'excellent', 'excellent', NULL, 1319, 1),
    (1, 'asshole', 'asshole', NULL, 1320, 1),
    (1, 'beach', 'beach', NULL, 1321, 1),
    (1, 'faith', 'faith', NULL, 1322, 1),
    (1, 'beg', 'beg', NULL, 1323, 1),
    (1, 'fuckin', 'fuckin', NULL, 1324, 1),
    (1, 'responsible', 'responsible', NULL, 1325, 1),
    (1, 'military', 'military', NULL, 1326, 1),
    (1, 'cheering', 'cheering', NULL, 1327, 1),
    (1, 'opportunity', 'opportunity', NULL, 1328, 1),
    (1, 'common', 'common', NULL, 1329, 1),
    (1, 'bottom', 'bottom', NULL, 1330, 1),
    (1, 'german', 'german', NULL, 1331, 1),
    (1, 'whoever', 'whoever', NULL, 1332, 1),
    (1, 'cook', 'cook', 'verb', 1333, 1),
    (1, 'walked', 'walked', NULL, 1334, 1),
    (1, 'papers', 'papers', NULL, 1335, 1),
    (1, 'justice', 'justice', NULL, 1336, 1),
    (1, 'hall', 'hall', NULL, 1337, 1),
    (1, 'commander', 'commander', NULL, 1338, 1),
    (1, 'drug', 'drug', NULL, 1339, 1),
    (1, 'main', 'main', 'adj', 1340, 1),
    (1, 'knife', 'knife', NULL, 1341, 1),
    (1, 'devil', 'devil', NULL, 1342, 1),
    (1, 'necessary', 'necessary', NULL, 1343, 1),
    (1, 'although', 'although', 'conj', 1344, 1),
    (1, 'princess', 'princess', NULL, 1345, 1),
    (1, 'lights', 'lights', NULL, 1346, 1),
    (1, 'flying', 'flying', NULL, 1347, 1),
    (1, 'dick', 'dick', NULL, 1348, 1),
    (1, 'rose', 'rose', NULL, 1349, 1),
    (1, 'knowing', 'knowing', NULL, 1350, 1),
    (1, 'clearly', 'clearly', NULL, 1351, 1),
    (1, 'hat', 'hat', NULL, 1352, 1),
    (1, 'agreed', 'agreed', NULL, 1353, 1),
    (1, 'johnny', 'johnny', NULL, 1354, 1),
    (1, 'corner', 'corner', NULL, 1355, 1),
    (1, 'code', 'code', NULL, 1356, 1),
    (1, 'note', 'note', NULL, 1357, 1),
    (1, 'tommy', 'tommy', NULL, 1358, 1),
    (1, 'due', 'due', NULL, 1359, 1),
    (1, 'correct', 'correct', NULL, 1360, 1),
    (1, 'apologize', 'apologize', NULL, 1361, 1),
    (1, 'language', 'language', NULL, 1362, 1),
    (1, 'stars', 'stars', NULL, 1363, 1),
    (1, 'faster', 'faster', NULL, 1364, 1),
    (1, 'cars', 'cars', NULL, 1365, 1),
    (1, 'folks', 'folks', NULL, 1366, 1),
    (1, 'bullshit', 'bullshit', NULL, 1367, 1),
    (1, 'fellow', 'fellow', NULL, 1368, 1),
    (1, 'several', 'several', NULL, 1369, 1),
    (1, 'grandma', 'grandma', NULL, 1370, 1),
    (1, 'shows', 'shows', NULL, 1371, 1),
    (1, 'leader', 'leader', NULL, 1372, 1),
    (1, 'leaves', 'leaves', NULL, 1373, 1),
    (1, 'restaurant', 'restaurant', NULL, 1374, 1),
    (1, 'east', 'east', NULL, 1375, 1),
    (1, 'shouting', 'shouting', NULL, 1376, 1),
    (1, 'blind', 'blind', NULL, 1377, 1),
    (1, 'ghost', 'ghost', NULL, 1378, 1),
    (1, 'cup', 'cup', NULL, 1379, 1),
    (1, 'gotten', 'gotten', NULL, 1380, 1),
    (1, 'tight', 'tight', NULL, 1381, 1),
    (1, 'conversation', 'conversation', NULL, 1382, 1),
    (1, 'tells', 'tells', NULL, 1383, 1),
    (1, 'lies', 'lies', NULL, 1384, 1),
    (1, 'nor', 'nor', 'conj', 1385, 1),
    (1, 'pulled', 'pulled', NULL, 1386, 1),
    (1, 'hanging', 'hanging', NULL, 1387, 1),
    (1, 'speed', 'speed', NULL, 1388, 1),
    (1, 'stories', 'stories', NULL, 1389, 1),
    (1, 'health', 'health', 'noun', 1390, 1),
    (1, 'advice', 'advice', NULL, 1391, 1),
    (1, 'held', 'held', NULL, 1392, 1),
    (1, 'uh-huh', 'uh-huh', NULL, 1393, 1),
    (1, 'murdered', 'murdered', NULL, 1394, 1),
    (1, 'beyond', 'beyond', 'prep', 1395, 1),
    (1, 'rule', 'rule', NULL, 1396, 1),
    (1, 'hardly', 'hardly', NULL, 1397, 1),
    (1, 'possibly', 'possibly', NULL, 1398, 1),
    (1, 'inspector', 'inspector', NULL, 1399, 1),
    (1, 'cousin', 'cousin', NULL, 1400, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'trial', 'trial', NULL, 1401, 1),
    (1, 'emergency', 'emergency', NULL, 1402, 1),
    (1, 'ought', 'ought', 'verb', 1403, 1),
    (1, 'eddie', 'eddie', NULL, 1404, 1),
    (1, 'somehow', 'somehow', NULL, 1405, 1),
    (1, 'hearing', 'hearing', NULL, 1406, 1),
    (1, 'states', 'states', NULL, 1407, 1),
    (1, 'account', 'account', NULL, 1408, 1),
    (1, 'spoke', 'spoke', NULL, 1409, 1),
    (1, 'file', 'file', NULL, 1410, 1),
    (1, 'understood', 'understood', NULL, 1411, 1),
    (1, 'angel', 'angel', NULL, 1412, 1),
    (1, 'tape', 'tape', NULL, 1413, 1),
    (1, 'milk', 'milk', NULL, 1414, 1),
    (1, 'powerful', 'powerful', NULL, 1415, 1),
    (1, 'weapons', 'weapons', NULL, 1416, 1),
    (1, 'practice', 'practice', NULL, 1417, 1),
    (1, 'manager', 'manager', NULL, 1418, 1),
    (1, 'pardon', 'pardon', NULL, 1419, 1),
    (1, 'vote', 'vote', NULL, 1420, 1),
    (1, 'jake', 'jake', NULL, 1421, 1),
    (1, 'national', 'national', 'adj', 1422, 1),
    (1, 'career', 'career', NULL, 1423, 1),
    (1, 'minister', 'minister', NULL, 1424, 1),
    (1, 'super', 'super', NULL, 1425, 1),
    (1, 'taught', 'taught', NULL, 1426, 1),
    (1, 'robert', 'robert', NULL, 1427, 1),
    (1, 'biggest', 'biggest', NULL, 1428, 1),
    (1, 'plays', 'plays', NULL, 1429, 1),
    (1, 'natural', 'natural', NULL, 1430, 1),
    (1, 'dancing', 'dancing', NULL, 1431, 1),
    (1, 'copy', 'copy', NULL, 1432, 1),
    (1, 'plus', 'plus', NULL, 1433, 1),
    (1, 'martin', 'martin', NULL, 1434, 1),
    (1, 'cake', 'cake', NULL, 1435, 1),
    (1, 'freedom', 'freedom', NULL, 1436, 1),
    (1, 'among', 'among', 'prep', 1437, 1),
    (1, 'breath', 'breath', NULL, 1438, 1),
    (1, 'operation', 'operation', NULL, 1439, 1),
    (1, 'chris', 'chris', NULL, 1440, 1),
    (1, 'crew', 'crew', NULL, 1441, 1),
    (1, 'challenge', 'challenge', NULL, 1442, 1),
    (1, 'market', 'market', NULL, 1443, 1),
    (1, 'meat', 'meat', NULL, 1444, 1),
    (1, 'towards', 'towards', 'prep', 1445, 1),
    (1, 'bringing', 'bringing', NULL, 1446, 1),
    (1, 'dropped', 'dropped', NULL, 1447, 1),
    (1, 'student', 'student', 'noun', 1448, 1),
    (1, 'lied', 'lied', NULL, 1449, 1),
    (1, 'strength', 'strength', NULL, 1450, 1),
    (1, 'size', 'size', NULL, 1451, 1),
    (1, 'breathe', 'breathe', NULL, 1452, 1),
    (1, 'color', 'color', NULL, 1453, 1),
    (1, 'monster', 'monster', NULL, 1454, 1),
    (1, 'loud', 'loud', NULL, 1455, 1),
    (1, 'photo', 'photo', NULL, 1456, 1),
    (1, 'aw', 'aw', NULL, 1457, 1),
    (1, 'nearly', 'nearly', 'adv', 1458, 1),
    (1, 'sight', 'sight', NULL, 1459, 1),
    (1, 'greatest', 'greatest', NULL, 1460, 1),
    (1, 'games', 'games', NULL, 1461, 1),
    (1, 'bridge', 'bridge', NULL, 1462, 1),
    (1, 'dressed', 'dressed', NULL, 1463, 1),
    (1, 'arrested', 'arrested', NULL, 1464, 1),
    (1, 'horrible', 'horrible', NULL, 1465, 1),
    (1, 'coach', 'coach', NULL, 1466, 1),
    (1, 'planning', 'planning', NULL, 1467, 1),
    (1, 'checked', 'checked', NULL, 1468, 1),
    (1, 'breaking', 'breaking', NULL, 1469, 1),
    (1, 'noticed', 'noticed', NULL, 1470, 1),
    (1, 'fantastic', 'fantastic', NULL, 1471, 1),
    (1, 'screams', 'screams', NULL, 1472, 1),
    (1, 'serve', 'serve', 'verb', 1473, 1),
    (1, 'ideas', 'ideas', NULL, 1474, 1),
    (1, 'investigation', 'investigation', NULL, 1475, 1),
    (1, 'center', 'center', NULL, 1476, 1),
    (1, 'older', 'older', NULL, 1477, 1),
    (1, 'pack', 'pack', NULL, 1478, 1),
    (1, 'soldiers', 'soldiers', NULL, 1479, 1),
    (1, 'nonsense', 'nonsense', NULL, 1480, 1),
    (1, 'doc', 'doc', NULL, 1481, 1),
    (1, 'project', 'project', NULL, 1482, 1),
    (1, 'training', 'training', NULL, 1483, 1),
    (1, 'example', 'example', NULL, 1484, 1),
    (1, 'trick', 'trick', NULL, 1485, 1),
    (1, 'prepared', 'prepared', NULL, 1486, 1),
    (1, 'science', 'science', NULL, 1487, 1),
    (1, 'united', 'united', NULL, 1488, 1),
    (1, 'travel', 'travel', NULL, 1489, 1),
    (1, 'incredible', 'incredible', NULL, 1490, 1),
    (1, 'grandpa', 'grandpa', NULL, 1491, 1),
    (1, 'paying', 'paying', NULL, 1492, 1),
    (1, 'character', 'character', NULL, 1493, 1),
    (1, 'teeth', 'teeth', NULL, 1494, 1),
    (1, 'criminal', 'criminal', NULL, 1495, 1),
    (1, 'charles', 'charles', NULL, 1496, 1),
    (1, 'chinese', 'chinese', NULL, 1497, 1),
    (1, 'truly', 'truly', NULL, 1498, 1),
    (1, 'honestly', 'honestly', NULL, 1499, 1),
    (1, 'bro', 'bro', NULL, 1500, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'survive', 'survive', NULL, 1501, 1),
    (1, 'bobby', 'bobby', NULL, 1502, 1),
    (1, 'target', 'target', NULL, 1503, 1),
    (1, 'feed', 'feed', NULL, 1504, 1),
    (1, 'nurse', 'nurse', NULL, 1505, 1),
    (1, 'fake', 'fake', NULL, 1506, 1),
    (1, 'records', 'records', NULL, 1507, 1),
    (1, 'breathing', 'breathing', NULL, 1508, 1),
    (1, 'sweetie', 'sweetie', NULL, 1509, 1),
    (1, 'numbers', 'numbers', NULL, 1510, 1),
    (1, 'oil', 'oil', NULL, 1511, 1),
    (1, 'suicide', 'suicide', NULL, 1512, 1),
    (1, 'belong', 'belong', NULL, 1513, 1),
    (1, 'whoo', 'whoo', NULL, 1514, 1),
    (1, 'perfectly', 'perfectly', NULL, 1515, 1),
    (1, 'amy', 'amy', NULL, 1516, 1),
    (1, 'forgotten', 'forgotten', NULL, 1517, 1),
    (1, 'remain', 'remain', 'verb', 1518, 1),
    (1, 'original', 'original', NULL, 1519, 1),
    (1, 'papa', 'papa', NULL, 1520, 1),
    (1, 'onto', 'onto', NULL, 1521, 1),
    (1, 'concerned', 'concerned', NULL, 1522, 1),
    (1, 'credit', 'credit', NULL, 1523, 1),
    (1, 'ugh', 'ugh', NULL, 1524, 1),
    (1, 'invited', 'invited', NULL, 1525, 1),
    (1, 'discuss', 'discuss', NULL, 1526, 1),
    (1, 'research', 'research', 'noun', 1527, 1),
    (1, 'easier', 'easier', NULL, 1528, 1),
    (1, 'view', 'view', NULL, 1529, 1),
    (1, 'chair', 'chair', NULL, 1530, 1),
    (1, 'hurts', 'hurts', NULL, 1531, 1),
    (1, 'strike', 'strike', NULL, 1532, 1),
    (1, 'roger', 'roger', NULL, 1533, 1),
    (1, 'fill', 'fill', NULL, 1534, 1),
    (1, 'condition', 'condition', NULL, 1535, 1),
    (1, 'mountain', 'mountain', NULL, 1536, 1),
    (1, 'dr', 'dr', NULL, 1537, 1),
    (1, 'nowhere', 'nowhere', 'adv', 1538, 1),
    (1, 'sheriff', 'sheriff', NULL, 1539, 1),
    (1, 'kim', 'kim', NULL, 1540, 1),
    (1, 'turning', 'turning', NULL, 1541, 1),
    (1, 'brown', 'brown', NULL, 1542, 1),
    (1, 'recognize', 'recognize', NULL, 1543, 1),
    (1, 'heads', 'heads', NULL, 1544, 1),
    (1, 'audience', 'audience', NULL, 1545, 1),
    (1, 'jealous', 'jealous', NULL, 1546, 1),
    (1, 'pretend', 'pretend', NULL, 1547, 1),
    (1, 'society', 'society', NULL, 1548, 1),
    (1, 'finding', 'finding', NULL, 1549, 1),
    (1, 'shirt', 'shirt', NULL, 1550, 1),
    (1, 'comfortable', 'comfortable', NULL, 1551, 1),
    (1, 'meaning', 'meaning', NULL, 1552, 1),
    (1, 'guest', 'guest', NULL, 1553, 1),
    (1, 'pieces', 'pieces', NULL, 1554, 1),
    (1, 'dry', 'dry', NULL, 1555, 1),
    (1, 'letting', 'letting', NULL, 1556, 1),
    (1, 'began', 'began', NULL, 1557, 1),
    (1, 'aye', 'aye', NULL, 1558, 1),
    (1, 'jeff', 'jeff', NULL, 1559, 1),
    (1, 'female', 'female', NULL, 1560, 1),
    (1, 'release', 'release', NULL, 1561, 1),
    (1, 'ho', 'ho', NULL, 1562, 1),
    (1, 'cards', 'cards', NULL, 1563, 1),
    (1, 'pray', 'pray', NULL, 1564, 1),
    (1, 'unfortunately', 'unfortunately', NULL, 1565, 1),
    (1, 'balls', 'balls', NULL, 1566, 1),
    (1, 'destroyed', 'destroyed', NULL, 1567, 1),
    (1, 'ended', 'ended', NULL, 1568, 1),
    (1, 'universe', 'universe', NULL, 1569, 1),
    (1, 'prepare', 'prepare', NULL, 1570, 1),
    (1, 'opinion', 'opinion', NULL, 1571, 1),
    (1, 'movies', 'movies', NULL, 1572, 1),
    (1, 'soldier', 'soldier', NULL, 1573, 1),
    (1, 'wash', 'wash', 'verb', 1574, 1),
    (1, 'program', 'program', 'noun', 1575, 1),
    (1, 'heat', 'heat', NULL, 1576, 1),
    (1, 'usual', 'usual', NULL, 1577, 1),
    (1, 'ticket', 'ticket', NULL, 1578, 1),
    (1, 'stolen', 'stolen', NULL, 1579, 1),
    (1, 'prefer', 'prefer', NULL, 1580, 1),
    (1, 'aware', 'aware', NULL, 1581, 1),
    (1, 'surely', 'surely', NULL, 1582, 1),
    (1, 'male', 'male', NULL, 1583, 1),
    (1, 'base', 'base', NULL, 1584, 1),
    (1, 'matters', 'matters', NULL, 1585, 1),
    (1, 'lift', 'lift', NULL, 1586, 1),
    (1, 'lab', 'lab', NULL, 1587, 1),
    (1, 'command', 'command', NULL, 1588, 1),
    (1, 'proof', 'proof', NULL, 1589, 1),
    (1, 'cream', 'cream', NULL, 1590, 1),
    (1, 'selling', 'selling', NULL, 1591, 1),
    (1, 'believed', 'believed', NULL, 1592, 1),
    (1, 'create', 'create', 'verb', 1593, 1),
    (1, 'afford', 'afford', 'verb', 1594, 1),
    (1, 'sunday', 'sunday', NULL, 1595, 1),
    (1, 'total', 'total', NULL, 1596, 1),
    (1, 'dumb', 'dumb', NULL, 1597, 1),
    (1, 'threw', 'threw', NULL, 1598, 1),
    (1, 'france', 'france', NULL, 1599, 1),
    (1, 'birth', 'birth', NULL, 1600, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'created', 'created', NULL, 1601, 1),
    (1, 'realized', 'realized', NULL, 1602, 1),
    (1, 'british', 'british', NULL, 1603, 1),
    (1, 'noise', 'noise', NULL, 1604, 1),
    (1, 'nuts', 'nuts', NULL, 1605, 1),
    (1, 'students', 'students', NULL, 1606, 1),
    (1, 'birds', 'birds', NULL, 1607, 1),
    (1, 'social', 'social', 'adj', 1608, 1),
    (1, 'brilliant', 'brilliant', NULL, 1609, 1),
    (1, 'bodies', 'bodies', NULL, 1610, 1),
    (1, 'tie', 'tie', NULL, 1611, 1),
    (1, 'opened', 'opened', NULL, 1612, 1),
    (1, 'ours', 'ours', NULL, 1613, 1),
    (1, 'bucks', 'bucks', NULL, 1614, 1),
    (1, 'kevin', 'kevin', NULL, 1615, 1),
    (1, 'mister', 'mister', NULL, 1616, 1),
    (1, 'ugly', 'ugly', NULL, 1617, 1),
    (1, 'ryan', 'ryan', NULL, 1618, 1),
    (1, 'focus', 'focus', NULL, 1619, 1),
    (1, 'dan', 'dan', NULL, 1620, 1),
    (1, 'opens', 'opens', NULL, 1621, 1),
    (1, 'exist', 'exist', NULL, 1622, 1),
    (1, 'followed', 'followed', NULL, 1623, 1),
    (1, 'england', 'england', NULL, 1624, 1),
    (1, 'draw', 'draw', 'verb', 1625, 1),
    (1, 'purpose', 'purpose', NULL, 1626, 1),
    (1, 'letters', 'letters', NULL, 1627, 1),
    (1, 'daniel', 'daniel', NULL, 1628, 1),
    (1, 'opening', 'opening', NULL, 1629, 1),
    (1, 'bullet', 'bullet', NULL, 1630, 1),
    (1, 'anna', 'anna', NULL, 1631, 1),
    (1, 'lately', 'lately', NULL, 1632, 1),
    (1, 'stayed', 'stayed', NULL, 1633, 1),
    (1, 'falling', 'falling', NULL, 1634, 1),
    (1, 'season', 'season', NULL, 1635, 1),
    (1, 'ends', 'ends', NULL, 1636, 1),
    (1, 'suggest', 'suggest', 'verb', 1637, 1),
    (1, 'joy', 'joy', NULL, 1638, 1),
    (1, 'distance', 'distance', NULL, 1639, 1),
    (1, 'responsibility', 'responsibility', NULL, 1640, 1),
    (1, 'whenever', 'whenever', 'conj', 1641, 1),
    (1, 'issue', 'issue', 'noun', 1642, 1),
    (1, 'thousands', 'thousands', NULL, 1643, 1),
    (1, 'process', 'process', NULL, 1644, 1),
    (1, 'sword', 'sword', NULL, 1645, 1),
    (1, 'shower', 'shower', NULL, 1646, 1),
    (1, 'weak', 'weak', 'adj', 1647, 1),
    (1, 'fucked', 'fucked', NULL, 1648, 1),
    (1, 'lonely', 'lonely', NULL, 1649, 1),
    (1, 'happiness', 'happiness', NULL, 1650, 1),
    (1, 'eric', 'eric', NULL, 1651, 1),
    (1, 'tiny', 'tiny', NULL, 1652, 1),
    (1, 'desk', 'desk', NULL, 1653, 1),
    (1, 'pool', 'pool', NULL, 1654, 1),
    (1, 'property', 'property', NULL, 1655, 1),
    (1, 'forced', 'forced', NULL, 1656, 1),
    (1, 'settle', 'settle', NULL, 1657, 1),
    (1, 'indistinct', 'indistinct', NULL, 1658, 1),
    (1, 'weight', 'weight', NULL, 1659, 1),
    (1, 'received', 'received', NULL, 1660, 1),
    (1, 'gang', 'gang', NULL, 1661, 1),
    (1, 'bite', 'bite', NULL, 1662, 1),
    (1, 'friday', 'friday', NULL, 1663, 1),
    (1, 'disappeared', 'disappeared', NULL, 1664, 1),
    (1, 'interview', 'interview', NULL, 1665, 1),
    (1, 'expecting', 'expecting', NULL, 1666, 1),
    (1, 'surgery', 'surgery', NULL, 1667, 1),
    (1, 'horses', 'horses', NULL, 1668, 1),
    (1, 'mayor', 'mayor', NULL, 1669, 1),
    (1, 'babe', 'babe', NULL, 1670, 1),
    (1, 'ancient', 'ancient', NULL, 1671, 1),
    (1, 'handsome', 'handsome', NULL, 1672, 1),
    (1, 'thomas', 'thomas', NULL, 1673, 1),
    (1, 'saturday', 'saturday', NULL, 1674, 1),
    (1, 'staff', 'staff', NULL, 1675, 1),
    (1, 'lines', 'lines', NULL, 1676, 1),
    (1, 'unit', 'unit', NULL, 1677, 1),
    (1, 'fan', 'fan', NULL, 1678, 1),
    (1, 'gentleman', 'gentleman', NULL, 1679, 1),
    (1, 'introduce', 'introduce', NULL, 1680, 1),
    (1, 'fate', 'fate', NULL, 1681, 1),
    (1, 'split', 'split', NULL, 1682, 1),
    (1, 'recently', 'recently', NULL, 1683, 1),
    (1, 'expected', 'expected', NULL, 1684, 1),
    (1, 'add', 'add', 'verb', 1685, 1),
    (1, 'ordered', 'ordered', NULL, 1686, 1),
    (1, 'slowly', 'slowly', NULL, 1687, 1),
    (1, 'alarm', 'alarm', NULL, 1688, 1),
    (1, 'member', 'member', 'noun', 1689, 1),
    (1, 'slept', 'slept', NULL, 1690, 1),
    (1, 'signed', 'signed', NULL, 1691, 1),
    (1, 'enter', 'enter', NULL, 1692, 1),
    (1, 'spanish', 'spanish', NULL, 1693, 1),
    (1, 'garden', 'garden', NULL, 1694, 1),
    (1, 'brings', 'brings', NULL, 1695, 1),
    (1, 'brave', 'brave', NULL, 1696, 1),
    (1, 'pig', 'pig', NULL, 1697, 1),
    (1, 'model', 'model', NULL, 1698, 1),
    (1, 'finger', 'finger', NULL, 1699, 1),
    (1, 'medicine', 'medicine', NULL, 1700, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'access', 'access', NULL, 1701, 1),
    (1, 'failed', 'failed', NULL, 1702, 1),
    (1, 'flat', 'flat', NULL, 1703, 1),
    (1, 'easily', 'easily', NULL, 1704, 1),
    (1, 'discovered', 'discovered', NULL, 1705, 1),
    (1, 'based', 'based', NULL, 1706, 1),
    (1, 'screw', 'screw', NULL, 1707, 1),
    (1, 'insane', 'insane', NULL, 1708, 1),
    (1, 'cares', 'cares', NULL, 1709, 1),
    (1, 'weather', 'weather', NULL, 1710, 1),
    (1, 'fingers', 'fingers', NULL, 1711, 1),
    (1, 'san', 'san', NULL, 1712, 1),
    (1, 'scott', 'scott', NULL, 1713, 1),
    (1, 'path', 'path', NULL, 1714, 1),
    (1, 'soft', 'soft', NULL, 1715, 1),
    (1, 'harm', 'harm', NULL, 1716, 1),
    (1, 'style', 'style', NULL, 1717, 1),
    (1, 'community', 'community', 'noun', 1718, 1),
    (1, 'sees', 'sees', NULL, 1719, 1),
    (1, 'basically', 'basically', NULL, 1720, 1),
    (1, 'al', 'al', NULL, 1721, 1),
    (1, 'signal', 'signal', NULL, 1722, 1),
    (1, 'spare', 'spare', NULL, 1723, 1),
    (1, 'speech', 'speech', NULL, 1724, 1),
    (1, 'covered', 'covered', NULL, 1725, 1),
    (1, 'shake', 'shake', NULL, 1726, 1),
    (1, 'loose', 'loose', NULL, 1727, 1),
    (1, 'snow', 'snow', NULL, 1728, 1),
    (1, 'russian', 'russian', NULL, 1729, 1),
    (1, 'lake', 'lake', NULL, 1730, 1),
    (1, 'bright', 'bright', NULL, 1731, 1),
    (1, 'roof', 'roof', NULL, 1732, 1),
    (1, 'ohh', 'ohh', NULL, 1733, 1),
    (1, 'sending', 'sending', NULL, 1734, 1),
    (1, 'paint', 'paint', NULL, 1735, 1),
    (1, 'remind', 'remind', NULL, 1736, 1),
    (1, 'pal', 'pal', NULL, 1737, 1),
    (1, 'naked', 'naked', NULL, 1738, 1),
    (1, 'post', 'post', NULL, 1739, 1),
    (1, 'sugar', 'sugar', NULL, 1740, 1),
    (1, 'heading', 'heading', NULL, 1741, 1),
    (1, 'streets', 'streets', NULL, 1742, 1),
    (1, 'damage', 'damage', NULL, 1743, 1),
    (1, 'silence', 'silence', NULL, 1744, 1),
    (1, 'doors', 'doors', NULL, 1745, 1),
    (1, 'pete', 'pete', NULL, 1746, 1),
    (1, 'ed', 'ed', NULL, 1747, 1),
    (1, 'success', 'success', NULL, 1748, 1),
    (1, 'wet', 'wet', NULL, 1749, 1),
    (1, 'amount', 'amount', NULL, 1750, 1),
    (1, 'members', 'members', NULL, 1751, 1),
    (1, 'kate', 'kate', NULL, 1752, 1),
    (1, 'manage', 'manage', NULL, 1753, 1),
    (1, 'safety', 'safety', NULL, 1754, 1),
    (1, 'returned', 'returned', NULL, 1755, 1),
    (1, 'harder', 'harder', NULL, 1756, 1),
    (1, 'fbi', 'fbi', NULL, 1757, 1),
    (1, 'block', 'block', NULL, 1758, 1),
    (1, 'showing', 'showing', NULL, 1759, 1),
    (1, 'fancy', 'fancy', NULL, 1760, 1),
    (1, 'chef', 'chef', NULL, 1761, 1),
    (1, 'contract', 'contract', NULL, 1762, 1),
    (1, 'dig', 'dig', NULL, 1763, 1),
    (1, 'chest', 'chest', NULL, 1764, 1),
    (1, 'good-bye', 'good-bye', NULL, 1765, 1),
    (1, 'drinks', 'drinks', NULL, 1766, 1),
    (1, 'dave', 'dave', NULL, 1767, 1),
    (1, 'buried', 'buried', NULL, 1768, 1),
    (1, 'brian', 'brian', NULL, 1769, 1),
    (1, 'trade', 'trade', NULL, 1770, 1),
    (1, 'journey', 'journey', NULL, 1771, 1),
    (1, 'stomach', 'stomach', NULL, 1772, 1),
    (1, 'changes', 'changes', NULL, 1773, 1),
    (1, 'details', 'details', NULL, 1774, 1),
    (1, 'thoughts', 'thoughts', NULL, 1775, 1),
    (1, 'divorce', 'divorce', NULL, 1776, 1),
    (1, 'funeral', 'funeral', NULL, 1777, 1),
    (1, 'maria', 'maria', NULL, 1778, 1),
    (1, 'football', 'football', NULL, 1779, 1),
    (1, 'reality', 'reality', NULL, 1780, 1),
    (1, 'theory', 'theory', NULL, 1781, 1),
    (1, 'gosh', 'gosh', NULL, 1782, 1),
    (1, 'ruined', 'ruined', NULL, 1783, 1),
    (1, 'gate', 'gate', NULL, 1784, 1),
    (1, 'william', 'william', NULL, 1785, 1),
    (1, 'spread', 'spread', NULL, 1786, 1),
    (1, 'outta', 'outta', NULL, 1787, 1),
    (1, 'japanese', 'japanese', NULL, 1788, 1),
    (1, 'sudden', 'sudden', NULL, 1789, 1),
    (1, 'coat', 'coat', NULL, 1790, 1),
    (1, 'sooner', 'sooner', NULL, 1791, 1),
    (1, 'cheese', 'cheese', NULL, 1792, 1),
    (1, 'larry', 'larry', NULL, 1793, 1),
    (1, 'spring', 'spring', NULL, 1794, 1),
    (1, 'page', 'page', NULL, 1795, 1),
    (1, 'ears', 'ears', NULL, 1796, 1),
    (1, 'simon', 'simon', NULL, 1797, 1),
    (1, 'castle', 'castle', NULL, 1798, 1),
    (1, 'hidden', 'hidden', NULL, 1799, 1),
    (1, 'storm', 'storm', NULL, 1800, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'personally', 'personally', NULL, 1801, 1),
    (1, 'artist', 'artist', NULL, 1802, 1),
    (1, 'hill', 'hill', NULL, 1803, 1),
    (1, 'exciting', 'exciting', NULL, 1804, 1),
    (1, 'permission', 'permission', NULL, 1805, 1),
    (1, 'jerry', 'jerry', NULL, 1806, 1),
    (1, 'expensive', 'expensive', 'adj', 1807, 1),
    (1, 'tickets', 'tickets', NULL, 1808, 1),
    (1, 'forest', 'forest', NULL, 1809, 1),
    (1, 'barely', 'barely', NULL, 1810, 1),
    (1, 'eggs', 'eggs', NULL, 1811, 1),
    (1, 'goin', 'goin', NULL, 1812, 1),
    (1, 'regret', 'regret', NULL, 1813, 1),
    (1, 'lesson', 'lesson', NULL, 1814, 1),
    (1, 'lover', 'lover', NULL, 1815, 1),
    (1, 'bread', 'bread', NULL, 1816, 1),
    (1, 'andy', 'andy', NULL, 1817, 1),
    (1, 'subject', 'subject', NULL, 1818, 1),
    (1, 'legal', 'legal', NULL, 1819, 1),
    (1, 'growing', 'growing', NULL, 1820, 1),
    (1, 'ill', 'ill', NULL, 1821, 1),
    (1, 'jason', 'jason', NULL, 1822, 1),
    (1, 'mood', 'mood', NULL, 1823, 1),
    (1, 'owner', 'owner', NULL, 1824, 1),
    (1, 'caused', 'caused', NULL, 1825, 1),
    (1, 'beeping', 'beeping', NULL, 1826, 1),
    (1, 'points', 'points', NULL, 1827, 1),
    (1, 'dating', 'dating', NULL, 1828, 1),
    (1, 'loss', 'loss', NULL, 1829, 1),
    (1, 'secretary', 'secretary', NULL, 1830, 1),
    (1, 'revenge', 'revenge', NULL, 1831, 1),
    (1, 'santa', 'santa', NULL, 1832, 1),
    (1, 'likely', 'likely', 'adj', 1833, 1),
    (1, 'rent', 'rent', NULL, 1834, 1),
    (1, 'connection', 'connection', NULL, 1835, 1),
    (1, 'assistant', 'assistant', NULL, 1836, 1),
    (1, 'reasons', 'reasons', NULL, 1837, 1),
    (1, 'yelling', 'yelling', NULL, 1838, 1),
    (1, 'painting', 'painting', NULL, 1839, 1),
    (1, 'trees', 'trees', NULL, 1840, 1),
    (1, 'doctors', 'doctors', NULL, 1841, 1),
    (1, 'rush', 'rush', NULL, 1842, 1),
    (1, 'foreign', 'foreign', NULL, 1843, 1),
    (1, 'rough', 'rough', NULL, 1844, 1),
    (1, 'murderer', 'murderer', NULL, 1845, 1),
    (1, 'century', 'century', NULL, 1846, 1),
    (1, 'nights', 'nights', NULL, 1847, 1),
    (1, 'pair', 'pair', NULL, 1848, 1),
    (1, 'runs', 'runs', NULL, 1849, 1),
    (1, 'pocket', 'pocket', NULL, 1850, 1),
    (1, 'farm', 'farm', NULL, 1851, 1),
    (1, 'matt', 'matt', NULL, 1852, 1),
    (1, 'bike', 'bike', NULL, 1853, 1),
    (1, 'obvious', 'obvious', NULL, 1854, 1),
    (1, 'ate', 'ate', NULL, 1855, 1),
    (1, 'grew', 'grew', NULL, 1856, 1),
    (1, 'professional', 'professional', NULL, 1857, 1),
    (1, 'tim', 'tim', NULL, 1858, 1),
    (1, 'goodness', 'goodness', NULL, 1859, 1),
    (1, 'parts', 'parts', NULL, 1860, 1),
    (1, 'alan', 'alan', NULL, 1861, 1),
    (1, 'university', 'university', NULL, 1862, 1),
    (1, 'square', 'square', NULL, 1863, 1),
    (1, 'grandfather', 'grandfather', NULL, 1864, 1),
    (1, 'europe', 'europe', NULL, 1865, 1),
    (1, 'genius', 'genius', NULL, 1866, 1),
    (1, 'cases', 'cases', NULL, 1867, 1),
    (1, 'ruin', 'ruin', NULL, 1868, 1),
    (1, 'winter', 'winter', NULL, 1869, 1),
    (1, 'tongue', 'tongue', NULL, 1870, 1),
    (1, 'memories', 'memories', NULL, 1871, 1),
    (1, 'da', 'da', NULL, 1872, 1),
    (1, 'buying', 'buying', NULL, 1873, 1),
    (1, 'cancer', 'cancer', NULL, 1874, 1),
    (1, 'clock', 'clock', NULL, 1875, 1),
    (1, 'ocean', 'ocean', NULL, 1876, 1),
    (1, 'dna', 'dna', NULL, 1877, 1),
    (1, 'liar', 'liar', NULL, 1878, 1),
    (1, 'tour', 'tour', NULL, 1879, 1),
    (1, 'thief', 'thief', NULL, 1880, 1),
    (1, 'bleep', 'bleep', NULL, 1881, 1),
    (1, 'lisa', 'lisa', NULL, 1882, 1),
    (1, 'rights', 'rights', NULL, 1883, 1),
    (1, 'including', 'including', NULL, 1884, 1),
    (1, 'competition', 'competition', NULL, 1885, 1),
    (1, 'smith', 'smith', NULL, 1886, 1),
    (1, 'planned', 'planned', NULL, 1887, 1),
    (1, 'emily', 'emily', NULL, 1888, 1),
    (1, 'boring', 'boring', NULL, 1889, 1),
    (1, 'victims', 'victims', NULL, 1890, 1),
    (1, 'mentioned', 'mentioned', NULL, 1891, 1),
    (1, 'bones', 'bones', NULL, 1892, 1),
    (1, 'plant', 'plant', NULL, 1893, 1),
    (1, 'bless', 'bless', NULL, 1894, 1),
    (1, 'warning', 'warning', NULL, 1895, 1),
    (1, 'knocking', 'knocking', NULL, 1896, 1),
    (1, 'crash', 'crash', NULL, 1897, 1),
    (1, 'bedroom', 'bedroom', NULL, 1898, 1),
    (1, 'lower', 'lower', NULL, 1899, 1),
    (1, 'silver', 'silver', NULL, 1900, 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, frequency_rank, is_system)
VALUES
    (1, 'groaning', 'groaning', NULL, 1901, 1),
    (1, 'madame', 'madame', NULL, 1902, 1),
    (1, 'defense', 'defense', NULL, 1903, 1),
    (1, 'results', 'results', NULL, 1904, 1),
    (1, 'toilet', 'toilet', NULL, 1905, 1),
    (1, 'event', 'event', NULL, 1906, 1),
    (1, 'complicated', 'complicated', NULL, 1907, 1),
    (1, 'shape', 'shape', NULL, 1908, 1),
    (1, 'priest', 'priest', NULL, 1909, 1),
    (1, 'royal', 'royal', NULL, 1910, 1),
    (1, 'cheap', 'cheap', 'adj', 1911, 1),
    (1, 'romantic', 'romantic', NULL, 1912, 1),
    (1, 'downstairs', 'downstairs', NULL, 1913, 1),
    (1, 'invite', 'invite', NULL, 1914, 1),
    (1, 'fortune', 'fortune', NULL, 1915, 1),
    (1, 'tears', 'tears', NULL, 1916, 1),
    (1, 'avoid', 'avoid', 'verb', 1917, 1),
    (1, 'reached', 'reached', NULL, 1918, 1),
    (1, 'higher', 'higher', NULL, 1919, 1),
    (1, 'familiar', 'familiar', NULL, 1920, 1),
    (1, 'telephone', 'telephone', NULL, 1921, 1),
    (1, 'burning', 'burning', NULL, 1922, 1),
    (1, 'filled', 'filled', NULL, 1923, 1),
    (1, 'kelly', 'kelly', NULL, 1924, 1),
    (1, 'alice', 'alice', NULL, 1925, 1),
    (1, 'airport', 'airport', NULL, 1926, 1),
    (1, 'jobs', 'jobs', NULL, 1927, 1),
    (1, 'grown', 'grown', NULL, 1928, 1),
    (1, 'walter', 'walter', NULL, 1929, 1),
    (1, 'rachel', 'rachel', NULL, 1930, 1),
    (1, 'giant', 'giant', NULL, 1931, 1),
    (1, 'insurance', 'insurance', NULL, 1932, 1),
    (1, 'woods', 'woods', NULL, 1933, 1),
    (1, 'scare', 'scare', NULL, 1934, 1),
    (1, 'pleased', 'pleased', NULL, 1935, 1),
    (1, 'period', 'period', NULL, 1936, 1),
    (1, 'political', 'political', 'adj', 1937, 1),
    (1, 'player', 'player', NULL, 1938, 1),
    (1, 'stops', 'stops', NULL, 1939, 1),
    (1, 'secrets', 'secrets', NULL, 1940, 1),
    (1, 'laura', 'laura', NULL, 1941, 1),
    (1, 'repeat', 'repeat', NULL, 1942, 1),
    (1, 'photos', 'photos', NULL, 1943, 1),
    (1, 'finds', 'finds', NULL, 1944, 1),
    (1, 'statement', 'statement', NULL, 1945, 1),
    (1, 'suck', 'suck', NULL, 1946, 1),
    (1, 'younger', 'younger', NULL, 1947, 1),
    (1, 'china', 'china', NULL, 1948, 1),
    (1, 'humans', 'humans', NULL, 1949, 1),
    (1, 'delicious', 'delicious', NULL, 1950, 1),
    (1, 'particular', 'particular', NULL, 1951, 1),
    (1, 'proper', 'proper', NULL, 1952, 1),
    (1, 'rome', 'rome', NULL, 1953, 1),
    (1, 'belongs', 'belongs', NULL, 1954, 1),
    (1, 'attacked', 'attacked', NULL, 1955, 1),
    (1, 'bath', 'bath', NULL, 1956, 1),
    (1, 'hired', 'hired', NULL, 1957, 1),
    (1, 'site', 'site', NULL, 1958, 1),
    (1, 'knowledge', 'knowledge', NULL, 1959, 1),
    (1, 'led', 'led', NULL, 1960, 1),
    (1, 'guests', 'guests', NULL, 1961, 1),
    (1, 'celebrate', 'celebrate', NULL, 1962, 1),
    (1, 'map', 'map', NULL, 1963, 1),
    (1, 'horn', 'horn', NULL, 1964, 1),
    (1, 'eventually', 'eventually', NULL, 1965, 1),
    (1, 'pity', 'pity', NULL, 1966, 1),
    (1, 'powers', 'powers', NULL, 1967, 1),
    (1, 'ashamed', 'ashamed', NULL, 1968, 1),
    (1, 'assume', 'assume', NULL, 1969, 1),
    (1, 'glasses', 'glasses', NULL, 1970, 1),
    (1, 'rise', 'rise', NULL, 1971, 1),
    (1, 'fixed', 'fixed', NULL, 1972, 1),
    (1, 'request', 'request', NULL, 1973, 1),
    (1, 'officers', 'officers', NULL, 1974, 1),
    (1, 'pounds', 'pounds', NULL, 1975, 1),
    (1, 'data', 'data', NULL, 1976, 1),
    (1, 'carefully', 'carefully', NULL, 1977, 1),
    (1, 'per', 'per', NULL, 1978, 1),
    (1, 'depends', 'depends', NULL, 1979, 1),
    (1, 'jury', 'jury', NULL, 1980, 1),
    (1, 'waited', 'waited', NULL, 1981, 1),
    (1, 'positive', 'positive', NULL, 1982, 1),
    (1, 'attorney', 'attorney', NULL, 1983, 1),
    (1, 'direction', 'direction', NULL, 1984, 1),
    (1, 'families', 'families', NULL, 1985, 1),
    (1, 'doin', 'doin', NULL, 1986, 1),
    (1, 'forces', 'forces', NULL, 1987, 1),
    (1, 'location', 'location', NULL, 1988, 1),
    (1, 'walls', 'walls', NULL, 1989, 1),
    (1, 'useless', 'useless', NULL, 1990, 1),
    (1, 'grant', 'grant', NULL, 1991, 1),
    (1, 'saving', 'saving', NULL, 1992, 1),
    (1, 'speaks', 'speaks', NULL, 1993, 1),
    (1, 'fought', 'fought', NULL, 1994, 1),
    (1, 'meal', 'meal', NULL, 1995, 1),
    (1, 'deliver', 'deliver', NULL, 1996, 1),
    (1, 'answers', 'answers', NULL, 1997, 1),
    (1, 'changing', 'changing', NULL, 1998, 1),
    (1, 'temple', 'temple', NULL, 1999, 1),
    (1, 'scary', 'scary', NULL, 2000, 1);

INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, COALESCE(l.frequency_rank, 0)
FROM collection c
JOIN lexeme l ON l.language_id = 1
WHERE c.name = 'Top 5000 Words'
  AND l.normalized_text IN ('you', 'the', 'to', 'it', 'and', 'that', 'of', 'is', 'in', 'what', 'we', 'me', 'this', 'he', 'for', 'my', 'on', 'have', 'your', 'do', 'was', 'no', 'not', 'be', 'are', 'know', 'can', 'with', 'but', 'all', 'so', 'just', 'there', 'here', 'they', 'like', 'get', 'she', 'go', 'if', 'right', 'out', 'about', 'up', 'at', 'him', 'now', 'one', 'come', 'well', 'her', 'how', 'will', 'got', 'want', 'think', 'as', 'see', 'did', 'good', 'who', 'why', 'from', 'let', 'his', 'yes', 'when', 'going', 'time', 'an', 'back', 'look', 'us', 'would', 'them', 'where', 'were', 'take', 'then', 'had', 'or', 'been', 'our', 'tell', 'really', 'man', 'some', 'say', 'could', 'by', 'need', 'something', 'has', 'too', 'more', 'way', 'down', 'make', 'very', 'never', 'only', 'people', 'over', 'because', 'little', 'please', 'love', 'should', 'mean', 'said', 'sorry', 'give', 'off', 'am', 'thank', 'any', 'two', 'even', 'much', 'doing', 'sure', 'thing', 'these', 'help', 'first', 'into', 'anything', 'still', 'find', 'life', 'nothing', 'sir', 'day', 'god', 'work', 'their', 'again', 'maybe', 'must', 'before', 'other', 'wait', 'stop', 'call', 'after', 'talk', 'away', 'than', 'thought', 'home', 'night', 'put', 'great', 'those', 'last', 'better', 'everything', 'told', 'new', 'things', 'always', 'keep', 'long', 'years', 'leave', 'does', 'money', 'around', 'name', 'place', 'ever', 'feel', 'guys', 'father', 'guy', 'made', 'old', 'which', 'big', 'lot', 'done', 'hello', 'nice', 'believe', 'girl', 'someone', 'fine', 'thanks', 'wanted', 'kind', 'coming', 'house', 'every', 'through', 'being', 'course', 'stay', 'left', 'dad', 'enough', 'happened', 'came', 'may', 'mother', 'wrong', 'world', 'bad', 'might', 'three', 'today', 'listen', 'another', 'understand', 'hear', 'remember', 'ask', 'own', 'same', 'show', 'else', 'kill', 'talking', 'found', 'next', 'getting', 'care', 'car', 'looking', 'son', 'try', 'woman', 'went', 'hi', 'dead', 'many', 'mind', 'friend', 'best', 'mom', 'hell', 'morning', 'trying', 'boy', 'together', 'yourself', 'job', 'saw', 'family', 'real', 'without', 'baby', 'room', 'already', 'move', 'most', 'seen', 'live', 'miss', 'actually', 'shit', 'both', 'heard', 'once', 'ready', 'head', 'called', 'used', 'idea', 'knew', 'hold', 'happy', 'door', 'such', 'fuck', 'brother', 'also', 'pretty', 'bit', 'took', 'yet', 'men', 'whole', 'start', 'use', 'while', 'since', 'wife', 'days', 'guess', 'tomorrow', 'matter', 'meet', 'bring', 'tonight', 'everyone', 'run', 'hard', 'alone', 'myself', 'school', 'gone', 'end', 'saying', 'phone', 'play', 'looks', 'fucking', 'problem', 'few', 'friends', 'ago', 'open', 'anyone', 'killed', 'hope', 'face', 'until', 'lost', 'police', 'excuse', 'turn', 'business', 'case', 'wants', 'says', 'true', 'die', 'heart', 'soon', 'each', 'worry', 'later', 'year', 'watch', 'music', 'hand', 'having', 'probably', 'beautiful', 'doctor', 'sit', 'eat', 'thinking', 'young', 'second', 'working', 'water', 'person', 'part', 'kids', 'late', 'stuff', 'exactly', 'under', 'death', 'minute', 'pay', 'crazy', 'forget', 'everybody', 'kid', 'change', 'gave', 'happen', 'damn', 'five', 'drink', 'far', 'knows', 'its', 'whatever', 'eyes', 'shut', 'hit', 'taking', 'easy', 'times', 'check', 'hands', 'minutes', 'deal', 'different', 'means', 'point', 'inside', 'makes', 'asked', 'somebody', 'mine', 'making', 'body', 'afraid', 'sleep', 'chance', 'dear', 'quite', 'four', 'anyway', 'close', 'party');

INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, COALESCE(l.frequency_rank, 0)
FROM collection c
JOIN lexeme l ON l.language_id = 1
WHERE c.name = 'Top 5000 Words'
  AND l.normalized_text IN ('fun', 'against', 'word', 'comes', 'important', 'set', 'shall', 'story', 'number', 'daughter', 'least', 'waiting', 'hurt', 'wish', 'moment', 'fight', 'week', 'husband', 'girls', 'rest', 'married', 'fire', 'game', 'nobody', 'mr', 'children', 'side', 'stand', 'read', 'though', 'cut', 'started', 'sister', 'supposed', 'between', 'child', 'goes', 'hours', 'speak', 'women', 'behind', 'almost', 'truth', 'blood', 'able', 'lady', 'anymore', 'playing', 'gets', 'shot', 'reason', 'trouble', 'break', 'war', 'city', 'walk', 'town', 'trust', 'met', 'office', 'question', 'brought', 'yours', 'welcome', 'high', 'couple', 'half', 'died', 'cool', 'free', 'either', 'seems', 'power', 'bye', 'buy', 'telling', 'honey', 'tried', 'front', 'team', 'answer', 'gun', 'boys', 'line', 'send', 'news', 'stupid', 'bed', 'hurry', 'full', 'months', 'save', 'sometimes', 'become', 'along', 'hate', 'food', 'outside', 'light', 'needs', 'dog', 'country', 'clear', 'order', 'fact', 'lord', 'captain', 'six', 'hot', 'funny', 'black', 'alive', 'pick', 'feeling', 'living', 'ahead', 'lose', 'king', 'plan', 'dinner', 'sighs', 'sort', 'leaving', 'running', 'boss', 'promise', 'taken', 'safe', 'ma', 'book', 'sent', 'white', 'hour', 'anybody', 'small', 'perfect', 'lives', 'special', 'parents', 'john', 'himself', 'perhaps', 'sounds', 'serious', 'sick', 'company', 'ha', 'scared', 'uncle', 'poor', 'red', 'past', 'earth', 'possible', 'shoot', 'touch', 'sound', 'top', 'ass', 'laughs', 'cannot', 'asking', 'win', 'glad', 'control', 'human', 'drive', 'hair', 'jack', 'bitch', 'luck', 'murder', 'happens', 'air', 'ten', 'daddy', 'finally', 'chuckles', 'fast', 'cold', 'seem', 'laughing', 'words', 'hospital', 'street', 'hang', 'dance', 'meeting', 'till', 'others', 'catch', 'follow', 'sense', 'sex', 'lie', 'evening', 'master', 'known', 'dream', 'write', 'million', 'voice', 'sweet', 'rather', 'felt', 'sign', 'lucky', 'somewhere', 'bet', 'jesus', 'longer', 'calling', 'worked', 'quiet', 'looked', 'less', 'pull', 'beat', 'careful', 'coffee', 'return', 'secret', 'weeks', 'date', 'seeing', 'fall', 'given', 'ooh', 'fault', 'straight', 'takes', 'song', 'future', 'gentlemen', 'loved', 'changed', 'road', 'calm', 'wonderful', 'mad', 'turned', 'drop', 'ladies', 'learn', 'step', 'absolutely', 'early', 'explain', 'clean', 'piece', 'yesterday', 'throw', 'picture', 'land', 'feet', 'wonder', 'questions', 'speaking', 'worth', 'darling', 'dude', 'giving', 'president', 'eye', 'quick', 'moving', 'figure', 'state', 'strong', 'sam', 'none', 'amazing', 'ones', 'works', 'act', 'needed', 'weird', 'law', 'worried', 'report', 'goodbye', 'missing', 'choice', 'happening', 'chief', 'wedding', 'strange', 'general', 'pain', 'kidding', 'decided', 'ya', 'pass', 'tired', 'class', 'officer', 'kept', 'wake', 'worse', 'busy', 'eh', 'mistake', 'kiss', 'court', 'building', 'finish', 'during', 'age', 'ship', 'caught', 'marry', 'meant', 'sell', 'dark', 'watching', 'system', 'suppose', 'evidence', 'movie', 'ride', 'completely', 'mouth', 'totally', 'birthday', 'tv', 'forgive', 'born', 'imagine', 'information', 'instead', 'definitely', 'security', 'certainly', 'film', 'month', 'lying', 'unless', 'train', 'seven', 'wear', 'clothes', 'michael', 'hotel', 'christmas', 'attack', 'round', 'expect', 'sing', 'terrible', 'george', 'bag', 'history', 'blue', 'near', 'broke', 'station', 'seriously', 'forever', 'david', 'frank', 'except', 'thinks', 'message', 'entire', 'joe', 'table', 'talked', 'across', 'rock', 'lovely', 'handle', 'middle', 'buddy', 'paid', 'protect', 'using', 'floor', 'ran', 'swear', 'spend', 'situation', 'ring', 'anywhere', 'dangerous', 'bill', 'york', 'army', 'lead', 'bought', 'finished', 'fair', 'sun', 'letter', 'fool', 'attention', 'club', 'simple', 'interesting', 'space', 'test');

INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, COALESCE(l.frequency_rank, 0)
FROM collection c
JOIN lexeme l ON l.language_id = 1
WHERE c.name = 'Top 5000 Words'
  AND l.normalized_text IN ('box', 'group', 'single', 'sitting', 'marriage', 'join', 'fear', 'peace', 'forgot', 'force', 'short', 'normal', 'charlie', 'present', 'enjoy', 'mike', 'crime', 'horse', 'ground', 'american', 'count', 'area', 'charge', 'honor', 'lunch', 'miles', 'radio', 'idiot', 'ball', 'surprise', 'paper', 'key', 'boat', 'quickly', 'gold', 'bar', 'fish', 'mark', 'tom', 'wearing', 'crying', 'accident', 'government', 'eight', 'fell', 'cover', 'certain', 'interested', 'deep', 'star', 'sea', 'agree', 'problems', 'detective', 'prison', 'major', 'stick', 'offer', 'difficult', 'smart', 'personal', 'record', 'stopped', 'hide', 'whether', 'bank', 'trip', 'relax', 'america', 'public', 'list', 'afternoon', 'brain', 'fix', 'bastard', 'proud', 'tea', 'service', 'screaming', 'forward', 'angry', 'park', 'soul', 'fighting', 'peter', 'rich', 'agent', 'blow', 'paul', 'dress', 'mary', 'missed', 'scene', 'killing', 'standing', 'saved', 'mm', 'respect', 'killer', 'ice', 'mess', 'tough', 'feels', 'church', 'sad', 'cell', 'drunk', 'share', 'camera', 'mm-hmm', 'within', 'card', 'fly', 'ben', 'girlfriend', 'laugh', 'smell', 'broken', 'mum', 'honest', 'often', 'starting', 'calls', 'spent', 'third', 'english', 'visit', 'mama', 'judge', 'window', 'hungry', 'dare', 'relationship', 'moved', 'prove', 'private', 'wall', 'seat', 'i-i', 'position', 'lieutenant', 'realize', 'lt', 'especially', 'machine', 'walking', 'art', 'pleasure', 'bloody', 'college', 'french', 'involved', 'cry', 'became', 'lived', 'impossible', 'obviously', 'neither', 'accept', 'boyfriend', 'besides', 'queen', 'teacher', 'cops', 'sake', 'loves', 'carry', 'teach', 'apartment', 'upset', 'green', 'la', 'liked', 'cute', 'evil', 'professor', 'contact', 'joke', 'cop', 'huge', 'holy', 'store', 'jail', 'likes', 'lawyer', 'doubt', 'continue', 'appreciate', 'cat', 'shop', 'driving', 'congratulations', 'wrote', 'village', 'quit', 'field', 'james', 'wine', 'decision', 'south', 'sleeping', 'slow', 'laughter', 'island', 'glass', 'beginning', 'cash', 'dying', 'hundred', 'whose', 'difference', 'plane', 'push', 'continues', 'mmm', 'singing', 'eating', 'north', 'mrs', 'tree', 'madam', 'gift', 'truck', 'putting', 'bear', 'board', 'grab', 'beer', 'stuck', 'magic', 'support', 'rules', 'grunts', 'partner', 'reach', 'wind', 'colonel', 'max', 'immediately', 'seconds', 'thousand', 'gives', 'experience', 'cheers', 'victim', 'upon', 'computer', 'christ', 'planet', 'promised', 'bus', 'henry', 'dirty', 'search', 'staying', 'dreams', 'arrest', 'holding', 'suddenly', 'usually', 'lots', 'shoes', 'er', 'jump', 'rid', 'yo', 'knock', 'owe', 'harry', 'grow', 'worst', 'river', 'aunt', 'patient', 'kitchen', 'aah', 'fat', 'passed', 'final', 'summer', 'bob', 'listening', 'escape', 'everywhere', 'moon', 'arms', 'turns', 'address', 'ow', 'match', 'gasps', 'grand', 'shh', 'nervous', 'de', 'choose', 'themselves', 'decide', 'mate', 'drinking', 'press', 'bother', 'foot', 'blame', 'crap', 'drugs', 'type', 'rings', 'mission', 'named', 'heaven', 'picked', 'paris', 'race', 'risk', 'books', 'further', 'danny', 'action', 'allowed', 'orders', 'learned', 'price', 'arrived', 'nick', 'otherwise', 'pictures', 'fit', 'smoke', 'favor', 'played', 'notice', 'awesome', 'smile', 'director', 'guard', 'begin', 'spot', 'surprised', 'innocent', 'narrator', 'herself', 'london', 'feelings', 'enemy', 'battle', 'ourselves', 'alex', 'dollars', 'allow', 'nine', 'gay', 'department', 'guilty', 'apart', 'earlier', 'duty', 'jim', 'suit', 'bell', 'west', 'legs', 'hero', 'destroy', 'stage', 'bunch', 'according', 'chicken', 'bigger', 'grunting', 'low', 'helping', 'admit', 'closed', 'names', 'witness', 'upstairs', 'arm', 'steal', 'jimmy', 'kick', 'twice', 'cross', 'ways', 'sergeant', 'indeed', 'gas', 'keeping', 'energy', 'pregnant', 'waste', 'helped', 'fired', 'favorite', 'tony', 'taste', 'locked', 'places', 'writing', 'adam');

INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, COALESCE(l.frequency_rank, 0)
FROM collection c
JOIN lexeme l ON l.language_id = 1
WHERE c.name = 'Top 5000 Words'
  AND l.normalized_text IN ('brothers', 'starts', 'prince', 'form', 'sold', 'silly', 'mention', 'build', 'throat', 'hole', 'figured', 'track', 'ringing', 'lock', 'leg', 'above', 'hiding', 'steve', 'seemed', 'breakfast', 'engine', 'written', 'complete', 'video', 'applause', 'however', 'pressure', 'fresh', 'weapon', 'sky', 'stole', 'study', 'burn', 'reading', 'crowd', 'treat', 'roll', 'double', 'spirit', 'danger', 'cost', 'empty', 'level', 'memory', 'itself', 'acting', 'interest', 'nose', 'plans', 'following', 'bathroom', 'built', 'closer', 'ray', 'sarah', 'band', 'groans', 'apparently', 'excited', 'richard', 'losing', 'animals', 'flight', 'nature', 'raise', 'pop', 'client', 'bomb', 'neck', 'suspect', 'warm', 'extra', 'bottle', 'van', 'heavy', 'mommy', 'dogs', 'wild', 'ridiculous', 'simply', 'lee', 'animal', 'showed', 'billy', 'shooting', 'keeps', 'camp', 'guns', 'medical', 'shame', 'hoping', 'whom', 'bird', 'majesty', 'flowers', 'famous', 'asleep', 'beauty', 'driver', 'keys', 'rain', 'awful', 'large', 'local', 'deserve', 'goddamn', 'stone', 'jane', 'grace', 'consider', 'weekend', 'wondering', 'lay', 'plenty', 'willing', 'pants', 'sweetheart', 'skin', 'excellent', 'asshole', 'beach', 'faith', 'beg', 'fuckin', 'responsible', 'military', 'cheering', 'opportunity', 'common', 'bottom', 'german', 'whoever', 'cook', 'walked', 'papers', 'justice', 'hall', 'commander', 'drug', 'main', 'knife', 'devil', 'necessary', 'although', 'princess', 'lights', 'flying', 'dick', 'rose', 'knowing', 'clearly', 'hat', 'agreed', 'johnny', 'corner', 'code', 'note', 'tommy', 'due', 'correct', 'apologize', 'language', 'stars', 'faster', 'cars', 'folks', 'bullshit', 'fellow', 'several', 'grandma', 'shows', 'leader', 'leaves', 'restaurant', 'east', 'shouting', 'blind', 'ghost', 'cup', 'gotten', 'tight', 'conversation', 'tells', 'lies', 'nor', 'pulled', 'hanging', 'speed', 'stories', 'health', 'advice', 'held', 'uh-huh', 'murdered', 'beyond', 'rule', 'hardly', 'possibly', 'inspector', 'cousin', 'trial', 'emergency', 'ought', 'eddie', 'somehow', 'hearing', 'states', 'account', 'spoke', 'file', 'understood', 'angel', 'tape', 'milk', 'powerful', 'weapons', 'practice', 'manager', 'pardon', 'vote', 'jake', 'national', 'career', 'minister', 'super', 'taught', 'robert', 'biggest', 'plays', 'natural', 'dancing', 'copy', 'plus', 'martin', 'cake', 'freedom', 'among', 'breath', 'operation', 'chris', 'crew', 'challenge', 'market', 'meat', 'towards', 'bringing', 'dropped', 'student', 'lied', 'strength', 'size', 'breathe', 'color', 'monster', 'loud', 'photo', 'aw', 'nearly', 'sight', 'greatest', 'games', 'bridge', 'dressed', 'arrested', 'horrible', 'coach', 'planning', 'checked', 'breaking', 'noticed', 'fantastic', 'screams', 'serve', 'ideas', 'investigation', 'center', 'older', 'pack', 'soldiers', 'nonsense', 'doc', 'project', 'training', 'example', 'trick', 'prepared', 'science', 'united', 'travel', 'incredible', 'grandpa', 'paying', 'character', 'teeth', 'criminal', 'charles', 'chinese', 'truly', 'honestly', 'bro', 'survive', 'bobby', 'target', 'feed', 'nurse', 'fake', 'records', 'breathing', 'sweetie', 'numbers', 'oil', 'suicide', 'belong', 'whoo', 'perfectly', 'amy', 'forgotten', 'remain', 'original', 'papa', 'onto', 'concerned', 'credit', 'ugh', 'invited', 'discuss', 'research', 'easier', 'view', 'chair', 'hurts', 'strike', 'roger', 'fill', 'condition', 'mountain', 'dr', 'nowhere', 'sheriff', 'kim', 'turning', 'brown', 'recognize', 'heads', 'audience', 'jealous', 'pretend', 'society', 'finding', 'shirt', 'comfortable', 'meaning', 'guest', 'pieces', 'dry', 'letting', 'began', 'aye', 'jeff', 'female', 'release', 'ho', 'cards', 'pray', 'unfortunately', 'balls', 'destroyed', 'ended', 'universe', 'prepare', 'opinion', 'movies', 'soldier', 'wash', 'program', 'heat', 'usual', 'ticket', 'stolen', 'prefer', 'aware', 'surely', 'male', 'base', 'matters', 'lift', 'lab', 'command', 'proof', 'cream', 'selling', 'believed', 'create', 'afford', 'sunday', 'total', 'dumb', 'threw', 'france', 'birth');

INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, COALESCE(l.frequency_rank, 0)
FROM collection c
JOIN lexeme l ON l.language_id = 1
WHERE c.name = 'Top 5000 Words'
  AND l.normalized_text IN ('created', 'realized', 'british', 'noise', 'nuts', 'students', 'birds', 'social', 'brilliant', 'bodies', 'tie', 'opened', 'ours', 'bucks', 'kevin', 'mister', 'ugly', 'ryan', 'focus', 'dan', 'opens', 'exist', 'followed', 'england', 'draw', 'purpose', 'letters', 'daniel', 'opening', 'bullet', 'anna', 'lately', 'stayed', 'falling', 'season', 'ends', 'suggest', 'joy', 'distance', 'responsibility', 'whenever', 'issue', 'thousands', 'process', 'sword', 'shower', 'weak', 'fucked', 'lonely', 'happiness', 'eric', 'tiny', 'desk', 'pool', 'property', 'forced', 'settle', 'indistinct', 'weight', 'received', 'gang', 'bite', 'friday', 'disappeared', 'interview', 'expecting', 'surgery', 'horses', 'mayor', 'babe', 'ancient', 'handsome', 'thomas', 'saturday', 'staff', 'lines', 'unit', 'fan', 'gentleman', 'introduce', 'fate', 'split', 'recently', 'expected', 'add', 'ordered', 'slowly', 'alarm', 'member', 'slept', 'signed', 'enter', 'spanish', 'garden', 'brings', 'brave', 'pig', 'model', 'finger', 'medicine', 'access', 'failed', 'flat', 'easily', 'discovered', 'based', 'screw', 'insane', 'cares', 'weather', 'fingers', 'san', 'scott', 'path', 'soft', 'harm', 'style', 'community', 'sees', 'basically', 'al', 'signal', 'spare', 'speech', 'covered', 'shake', 'loose', 'snow', 'russian', 'lake', 'bright', 'roof', 'ohh', 'sending', 'paint', 'remind', 'pal', 'naked', 'post', 'sugar', 'heading', 'streets', 'damage', 'silence', 'doors', 'pete', 'ed', 'success', 'wet', 'amount', 'members', 'kate', 'manage', 'safety', 'returned', 'harder', 'fbi', 'block', 'showing', 'fancy', 'chef', 'contract', 'dig', 'chest', 'good-bye', 'drinks', 'dave', 'buried', 'brian', 'trade', 'journey', 'stomach', 'changes', 'details', 'thoughts', 'divorce', 'funeral', 'maria', 'football', 'reality', 'theory', 'gosh', 'ruined', 'gate', 'william', 'spread', 'outta', 'japanese', 'sudden', 'coat', 'sooner', 'cheese', 'larry', 'spring', 'page', 'ears', 'simon', 'castle', 'hidden', 'storm', 'personally', 'artist', 'hill', 'exciting', 'permission', 'jerry', 'expensive', 'tickets', 'forest', 'barely', 'eggs', 'goin', 'regret', 'lesson', 'lover', 'bread', 'andy', 'subject', 'legal', 'growing', 'ill', 'jason', 'mood', 'owner', 'caused', 'beeping', 'points', 'dating', 'loss', 'secretary', 'revenge', 'santa', 'likely', 'rent', 'connection', 'assistant', 'reasons', 'yelling', 'painting', 'trees', 'doctors', 'rush', 'foreign', 'rough', 'murderer', 'century', 'nights', 'pair', 'runs', 'pocket', 'farm', 'matt', 'bike', 'obvious', 'ate', 'grew', 'professional', 'tim', 'goodness', 'parts', 'alan', 'university', 'square', 'grandfather', 'europe', 'genius', 'cases', 'ruin', 'winter', 'tongue', 'memories', 'da', 'buying', 'cancer', 'clock', 'ocean', 'dna', 'liar', 'tour', 'thief', 'bleep', 'lisa', 'rights', 'including', 'competition', 'smith', 'planned', 'emily', 'boring', 'victims', 'mentioned', 'bones', 'plant', 'bless', 'warning', 'knocking', 'crash', 'bedroom', 'lower', 'silver', 'groaning', 'madame', 'defense', 'results', 'toilet', 'event', 'complicated', 'shape', 'priest', 'royal', 'cheap', 'romantic', 'downstairs', 'invite', 'fortune', 'tears', 'avoid', 'reached', 'higher', 'familiar', 'telephone', 'burning', 'filled', 'kelly', 'alice', 'airport', 'jobs', 'grown', 'walter', 'rachel', 'giant', 'insurance', 'woods', 'scare', 'pleased', 'period', 'political', 'player', 'stops', 'secrets', 'laura', 'repeat', 'photos', 'finds', 'statement', 'suck', 'younger', 'china', 'humans', 'delicious', 'particular', 'proper', 'rome', 'belongs', 'attacked', 'bath', 'hired', 'site', 'knowledge', 'led', 'guests', 'celebrate', 'map', 'horn', 'eventually', 'pity', 'powers', 'ashamed', 'assume', 'glasses', 'rise', 'fixed', 'request', 'officers', 'pounds', 'data', 'carefully', 'per', 'depends', 'jury', 'waited', 'positive', 'attorney', 'direction', 'families', 'doin', 'forces', 'location', 'walls', 'useless', 'grant', 'saving', 'speaks', 'fought', 'meal', 'deliver', 'answers', 'changing', 'temple', 'scary');

-- ── Section 2: Phrasal Verbs ───────────────────────────────
-- 142 lexemes + RU translations + examples, source: scripts/seed/data/phrasal_verbs.csv

INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, is_system)
VALUES
    (1, 'ask out', 'ask out', 'phrasal_verb', 1),
    (1, 'back up', 'back up', 'phrasal_verb', 1),
    (1, 'blow up', 'blow up', 'phrasal_verb', 1),
    (1, 'break down', 'break down', 'phrasal_verb', 1),
    (1, 'break in', 'break in', 'phrasal_verb', 1),
    (1, 'break up', 'break up', 'phrasal_verb', 1),
    (1, 'bring up', 'bring up', 'phrasal_verb', 1),
    (1, 'brush up (on)', 'brush up (on)', 'phrasal_verb', 1),
    (1, 'call off', 'call off', 'phrasal_verb', 1),
    (1, 'calm down', 'calm down', 'phrasal_verb', 1),
    (1, 'carry on', 'carry on', 'phrasal_verb', 1),
    (1, 'carry out', 'carry out', 'phrasal_verb', 1),
    (1, 'catch up (with)', 'catch up (with)', 'phrasal_verb', 1),
    (1, 'check in', 'check in', 'phrasal_verb', 1),
    (1, 'check out', 'check out', 'phrasal_verb', 1),
    (1, 'cheer up', 'cheer up', 'phrasal_verb', 1),
    (1, 'come across', 'come across', 'phrasal_verb', 1),
    (1, 'come up (with)', 'come up (with)', 'phrasal_verb', 1),
    (1, 'count on', 'count on', 'phrasal_verb', 1),
    (1, 'cut down (on)', 'cut down (on)', 'phrasal_verb', 1),
    (1, 'cut off', 'cut off', 'phrasal_verb', 1),
    (1, 'deal with', 'deal with', 'phrasal_verb', 1),
    (1, 'do over', 'do over', 'phrasal_verb', 1),
    (1, 'drop by', 'drop by', 'phrasal_verb', 1),
    (1, 'drop off', 'drop off', 'phrasal_verb', 1),
    (1, 'end up', 'end up', 'phrasal_verb', 1),
    (1, 'fall apart', 'fall apart', 'phrasal_verb', 1),
    (1, 'fall behind', 'fall behind', 'phrasal_verb', 1),
    (1, 'figure out', 'figure out', 'phrasal_verb', 1),
    (1, 'fill in', 'fill in', 'phrasal_verb', 1),
    (1, 'fill out', 'fill out', 'phrasal_verb', 1),
    (1, 'find out', 'find out', 'phrasal_verb', 1),
    (1, 'get along (with)', 'get along (with)', 'phrasal_verb', 1),
    (1, 'get away', 'get away', 'phrasal_verb', 1),
    (1, 'get back', 'get back', 'phrasal_verb', 1),
    (1, 'get by', 'get by', 'phrasal_verb', 1),
    (1, 'get in', 'get in', 'phrasal_verb', 1),
    (1, 'get off', 'get off', 'phrasal_verb', 1),
    (1, 'get on', 'get on', 'phrasal_verb', 1),
    (1, 'get over', 'get over', 'phrasal_verb', 1),
    (1, 'get up', 'get up', 'phrasal_verb', 1),
    (1, 'give away', 'give away', 'phrasal_verb', 1),
    (1, 'give back', 'give back', 'phrasal_verb', 1),
    (1, 'give in', 'give in', 'phrasal_verb', 1),
    (1, 'give up', 'give up', 'phrasal_verb', 1),
    (1, 'go ahead', 'go ahead', 'phrasal_verb', 1),
    (1, 'go on', 'go on', 'phrasal_verb', 1),
    (1, 'go out', 'go out', 'phrasal_verb', 1),
    (1, 'go over', 'go over', 'phrasal_verb', 1),
    (1, 'grow up', 'grow up', 'phrasal_verb', 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, is_system)
VALUES
    (1, 'hand in', 'hand in', 'phrasal_verb', 1),
    (1, 'hand out', 'hand out', 'phrasal_verb', 1),
    (1, 'hang out', 'hang out', 'phrasal_verb', 1),
    (1, 'hang up', 'hang up', 'phrasal_verb', 1),
    (1, 'hold on', 'hold on', 'phrasal_verb', 1),
    (1, 'keep on', 'keep on', 'phrasal_verb', 1),
    (1, 'keep up (with)', 'keep up (with)', 'phrasal_verb', 1),
    (1, 'kick out', 'kick out', 'phrasal_verb', 1),
    (1, 'lay off', 'lay off', 'phrasal_verb', 1),
    (1, 'leave out', 'leave out', 'phrasal_verb', 1),
    (1, 'let down', 'let down', 'phrasal_verb', 1),
    (1, 'look after', 'look after', 'phrasal_verb', 1),
    (1, 'look down on', 'look down on', 'phrasal_verb', 1),
    (1, 'look for', 'look for', 'phrasal_verb', 1),
    (1, 'look forward to', 'look forward to', 'phrasal_verb', 1),
    (1, 'look into', 'look into', 'phrasal_verb', 1),
    (1, 'look out', 'look out', 'phrasal_verb', 1),
    (1, 'look up', 'look up', 'phrasal_verb', 1),
    (1, 'look up to', 'look up to', 'phrasal_verb', 1),
    (1, 'make up', 'make up', 'phrasal_verb', 1),
    (1, 'make up for', 'make up for', 'phrasal_verb', 1),
    (1, 'pick up', 'pick up', 'phrasal_verb', 1),
    (1, 'point out', 'point out', 'phrasal_verb', 1),
    (1, 'put away', 'put away', 'phrasal_verb', 1),
    (1, 'put off', 'put off', 'phrasal_verb', 1),
    (1, 'put on', 'put on', 'phrasal_verb', 1),
    (1, 'put out', 'put out', 'phrasal_verb', 1),
    (1, 'put up with', 'put up with', 'phrasal_verb', 1),
    (1, 'run into', 'run into', 'phrasal_verb', 1),
    (1, 'run out (of)', 'run out (of)', 'phrasal_verb', 1),
    (1, 'set off', 'set off', 'phrasal_verb', 1),
    (1, 'set up', 'set up', 'phrasal_verb', 1),
    (1, 'show up', 'show up', 'phrasal_verb', 1),
    (1, 'shut down', 'shut down', 'phrasal_verb', 1),
    (1, 'slow down', 'slow down', 'phrasal_verb', 1),
    (1, 'sort out', 'sort out', 'phrasal_verb', 1),
    (1, 'stand out', 'stand out', 'phrasal_verb', 1),
    (1, 'take after', 'take after', 'phrasal_verb', 1),
    (1, 'take off', 'take off', 'phrasal_verb', 1),
    (1, 'take on', 'take on', 'phrasal_verb', 1),
    (1, 'take out', 'take out', 'phrasal_verb', 1),
    (1, 'take over', 'take over', 'phrasal_verb', 1),
    (1, 'take up', 'take up', 'phrasal_verb', 1),
    (1, 'talk over', 'talk over', 'phrasal_verb', 1),
    (1, 'think over', 'think over', 'phrasal_verb', 1),
    (1, 'throw away', 'throw away', 'phrasal_verb', 1),
    (1, 'try on', 'try on', 'phrasal_verb', 1),
    (1, 'turn down', 'turn down', 'phrasal_verb', 1),
    (1, 'turn into', 'turn into', 'phrasal_verb', 1),
    (1, 'turn off', 'turn off', 'phrasal_verb', 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, is_system)
VALUES
    (1, 'turn on', 'turn on', 'phrasal_verb', 1),
    (1, 'turn out', 'turn out', 'phrasal_verb', 1),
    (1, 'turn up', 'turn up', 'phrasal_verb', 1),
    (1, 'wake up', 'wake up', 'phrasal_verb', 1),
    (1, 'warm up', 'warm up', 'phrasal_verb', 1),
    (1, 'watch out', 'watch out', 'phrasal_verb', 1),
    (1, 'work out', 'work out', 'phrasal_verb', 1),
    (1, 'write down', 'write down', 'phrasal_verb', 1),
    (1, 'bring about', 'bring about', 'phrasal_verb', 1),
    (1, 'bring back', 'bring back', 'phrasal_verb', 1),
    (1, 'bring down', 'bring down', 'phrasal_verb', 1),
    (1, 'call back', 'call back', 'phrasal_verb', 1),
    (1, 'come back', 'come back', 'phrasal_verb', 1),
    (1, 'come down', 'come down', 'phrasal_verb', 1),
    (1, 'come in', 'come in', 'phrasal_verb', 1),
    (1, 'cut out', 'cut out', 'phrasal_verb', 1),
    (1, 'dress up', 'dress up', 'phrasal_verb', 1),
    (1, 'eat out', 'eat out', 'phrasal_verb', 1),
    (1, 'fall down', 'fall down', 'phrasal_verb', 1),
    (1, 'get together', 'get together', 'phrasal_verb', 1),
    (1, 'go back', 'go back', 'phrasal_verb', 1),
    (1, 'go through', 'go through', 'phrasal_verb', 1),
    (1, 'hold up', 'hold up', 'phrasal_verb', 1),
    (1, 'lie down', 'lie down', 'phrasal_verb', 1),
    (1, 'move in', 'move in', 'phrasal_verb', 1),
    (1, 'move out', 'move out', 'phrasal_verb', 1),
    (1, 'pass away', 'pass away', 'phrasal_verb', 1),
    (1, 'pass out', 'pass out', 'phrasal_verb', 1),
    (1, 'pay back', 'pay back', 'phrasal_verb', 1),
    (1, 'plug in', 'plug in', 'phrasal_verb', 1),
    (1, 'rip off', 'rip off', 'phrasal_verb', 1),
    (1, 'sit down', 'sit down', 'phrasal_verb', 1),
    (1, 'sleep in', 'sleep in', 'phrasal_verb', 1),
    (1, 'slip up', 'slip up', 'phrasal_verb', 1),
    (1, 'stand up', 'stand up', 'phrasal_verb', 1),
    (1, 'stay up', 'stay up', 'phrasal_verb', 1),
    (1, 'switch off', 'switch off', 'phrasal_verb', 1),
    (1, 'switch on', 'switch on', 'phrasal_verb', 1),
    (1, 'tidy up', 'tidy up', 'phrasal_verb', 1),
    (1, 'top up', 'top up', 'phrasal_verb', 1),
    (1, 'wrap up', 'wrap up', 'phrasal_verb', 1),
    (1, 'zoom in', 'zoom in', 'phrasal_verb', 1);

-- RU translations (guarded by NOT EXISTS: no UNIQUE constraint on translation)
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'пригласить на свидание', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'ask out'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'поддержать; сделать резервную копию', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'back up'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'взорвать; разозлиться', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'blow up'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'сломаться; разрыдаться', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'break down'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'вломиться; вмешаться', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'break in'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'расстаться; распуститься', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'break up'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'воспитывать; поднять (тему)', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'bring up'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'освежить (знания)', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'brush up (on)'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'отменить', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'call off'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'успокоиться', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'calm down'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'продолжать', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'carry on'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'выполнять; проводить', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'carry out'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'догнать; наверстать', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'catch up (with)'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'зарегистрироваться', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'check in'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'выписаться; проверить', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'check out'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'взбодриться; утешить', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'cheer up'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'случайно встретить; натолкнуться', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'come across'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'придумать; предложить', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'come up (with)'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'рассчитывать на', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'count on'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'сократить', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'cut down (on)'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'отрезать; отключить', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'cut off'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'иметь дело с; справляться', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'deal with'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'переделать', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'do over'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'заглянуть; зайти', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'drop by'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'высадить; задремать', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'drop off'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'оказаться; кончить (чем-л.)', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'end up'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'развалиться; расклеиться', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'fall apart'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'отставать', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'fall behind'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'сообразить; разобраться', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'figure out'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'заполнить; заменить', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'fill in'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'заполнить (форму)', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'fill out'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'выяснить; узнать', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'find out'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'ладить с', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'get along (with)'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'уехать; ускользнуть', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'get away'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'вернуться', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'get back'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'сводить концы с концами; обходиться', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'get by'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'сесть (в транспорт); прибыть', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'get in'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'выйти (из транспорта)', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'get off'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'сесть (в транспорт); ладить', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'get on'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'оправиться от; преодолеть', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'get over'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'вставать', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'get up'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'раздарить; выдать (секрет)', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'give away'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'вернуть (вещь)', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'give back'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'уступить; сдаться', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'give in'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'бросить; отказаться', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'give up'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'продолжайте; вперёд', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'go ahead'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'продолжаться; происходить', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'go on'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'выходить (развлекаться); гаснуть', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'go out'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'повторить; просмотреть', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'go over'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'вырасти', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'grow up'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'сдать (работу)', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'hand in'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'раздавать', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'hand out'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'тусоваться; проводить время', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'hang out'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'повесить трубку', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'hang up'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'подождать; держаться', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'hold on'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'продолжать (делать)', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'keep on'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'не отставать; поддерживать', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'keep up (with)'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'выгнать', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'kick out'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'уволить (по сокращению)', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'lay off'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'пропустить; исключить', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'leave out'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'разочаровать; подвести', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'let down'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'присматривать за', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'look after'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'смотреть свысока', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'look down on'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'искать', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'look for'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'ждать с нетерпением', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'look forward to'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'расследовать; изучить', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'look into'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'быть осторожным', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'look out'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'искать (в словаре); налаживаться', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'look up'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'уважать; восхищаться', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'look up to'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'выдумать; помириться; составлять', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'make up'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'компенсировать', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'make up for'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'подобрать; заехать за; выучить', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'pick up'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'указать; заметить', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'point out'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'убрать (на место)', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'put away'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'откладывать', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'put off'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'надеть; включить', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'put on'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'потушить', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'put out'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'мириться с; терпеть', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'put up with'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'случайно встретить; столкнуться', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'run into'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'закончиться; иссякнуть', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'run out (of)'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'отправиться (в путь); вызвать', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'set off'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'организовать; установить', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'set up'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'появиться', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'show up'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'закрыть; выключить', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'shut down'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'замедлиться', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'slow down'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'разобраться; уладить', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'sort out'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'выделяться', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'stand out'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'быть похожим (на родителя)', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'take after'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'снять (одежду); взлететь', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'take off'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'взять на себя; нанять', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'take on'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'вынуть; вывести (куда-л.)', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'take out'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'взять под контроль', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'take over'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'заняться (хобби); занимать (место)', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'take up'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'обсудить', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'talk over'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'обдумать', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'think over'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'выбросить', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'throw away'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'примерить', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'try on'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'отклонить; убавить (звук)', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'turn down'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'превратиться в', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'turn into'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'выключить', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'turn off'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'включить', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'turn on'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'оказаться', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'turn out'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'появиться; прибавить (звук)', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'turn up'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'проснуться; разбудить', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'wake up'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'разогреться; размяться', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'warm up'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'остерегаться', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'watch out'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'тренироваться; получиться', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'work out'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'записать', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'write down'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'вызвать; повлечь', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'bring about'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'вернуть; напомнить', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'bring back'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'снизить; свергнуть', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'bring down'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'перезвонить', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'call back'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'вернуться', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'come back'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'спуститься; снизиться (о ценах)', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'come down'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'входить', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'come in'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'вырезать; прекратить', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'cut out'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'нарядиться', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'dress up'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'есть вне дома', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'eat out'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'упасть', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'fall down'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'собраться вместе', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'get together'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'возвращаться', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'go back'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'пережить; просмотреть', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'go through'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'задержать; ограбить', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'hold up'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'прилечь', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'lie down'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'въехать (в жильё)', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'move in'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'съехать', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'move out'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'скончаться', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'pass away'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'потерять сознание; раздавать', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'pass out'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'вернуть (долг)', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'pay back'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'включить (в розетку)', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'plug in'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'ободрать (о цене); сорвать', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'rip off'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'сесть', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'sit down'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'поспать подольше', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'sleep in'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'ошибиться; оступиться', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'slip up'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'встать; не прийти (на встречу)', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'stand up'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'не ложиться спать', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'stay up'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'выключить', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'switch off'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'включить', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'switch on'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'прибраться', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'tidy up'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'пополнить (счёт)', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'top up'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'завернуть; завершить', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'wrap up'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, source, confidence)
SELECT l.id, 2, 'увеличить (изображение)', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'zoom in'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );

-- Usage examples (guarded by NOT EXISTS)
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'He finally asked her out.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'ask out'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Back up your files regularly.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'back up'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The building was blown up.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'blow up'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'My car broke down on the highway.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'break down'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Thieves broke in last night.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'break in'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'They broke up after two years.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'break up'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'She brought up an interesting point.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'bring up'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'I need to brush up on my Spanish.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'brush up (on)'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The match was called off due to rain.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'call off'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Calm down and tell me what happened.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'calm down'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Carry on with your work.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'carry on'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'They carried out an experiment.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'carry out'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Let me catch up with my emails.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'catch up (with)'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'We checked in at the hotel.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'check in'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Check out this new website.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'check out'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Cheer up! Things will get better.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'cheer up'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'I came across an old photo.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'come across'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'She came up with a great idea.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'come up (with)'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'You can always count on me.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'count on'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'I''m trying to cut down on sugar.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'cut down (on)'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The electricity was cut off.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'cut off'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'How do you deal with stress?', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'deal with'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'I had to do the report over.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'do over'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Drop by anytime you''re in town.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'drop by'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Can you drop me off at the station?', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'drop off'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'We ended up staying home.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'end up'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The old chair fell apart.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'fall apart'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Don''t fall behind with your payments.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'fall behind'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'I can''t figure out this puzzle.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'figure out'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Please fill in this form.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'fill in'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Fill out the application carefully.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'fill out'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'I found out the truth yesterday.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'find out'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Do you get along with your colleagues?', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'get along (with)'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Let''s get away for the weekend.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'get away'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'When did you get back from Paris?', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'get back'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'We get by on a small salary.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'get by'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'What time does the train get in?', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'get in'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Get off at the next stop.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'get off'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'She got on the bus.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'get on'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'It took him a year to get over the divorce.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'get over'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'I get up at seven every day.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'get up'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'She gave away all her old clothes.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'give away'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Give me back my pen.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'give back'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Finally he gave in to their demands.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'give in'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Don''t give up learning English.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'give up'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Go ahead, I''m listening.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'go ahead'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'What''s going on here?', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'go on'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Let''s go out for dinner.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'go out'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Let''s go over the plan again.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'go over'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'I grew up in a small town.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'grow up'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Hand in your essays by Friday.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'hand in'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The teacher handed out the tests.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'hand out'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'We hang out at the café.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'hang out'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Don''t hang up, please.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'hang up'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Hold on a minute, please.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'hold on'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Keep on trying, you''ll succeed.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'keep on'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'It''s hard to keep up with the news.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'keep up (with)'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'He was kicked out of the club.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'kick out'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The company laid off 200 workers.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'lay off'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Don''t leave out any details.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'leave out'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'I won''t let you down.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'let down'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'She looks after her little brother.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'look after'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Don''t look down on people.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'look down on'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'What are you looking for?', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'look for'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'I look forward to hearing from you.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'look forward to'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The police are looking into the case.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'look into'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Look out! A car is coming.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'look out'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Look up the word in the dictionary.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'look up'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'He looks up to his father.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'look up to'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'He made up an excuse.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'make up'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'How can I make up for being late?', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'make up for'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'I''ll pick you up at eight.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'pick up'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'She pointed out my mistake.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'point out'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Put away your toys.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'put away'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Don''t put off your homework.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'put off'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Put on your coat, it''s cold.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'put on'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Firefighters put out the fire.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'put out'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'I can''t put up with this noise.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'put up with'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'I ran into an old friend.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'run into'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'We''ve run out of milk.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'run out (of)'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'We set off early in the morning.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'set off'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'They set up a new company.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'set up'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'He didn''t show up at the meeting.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'show up'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The factory was shut down.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'shut down'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Slow down, you''re driving too fast.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'slow down'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'We need to sort out this problem.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'sort out'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'She stands out in a crowd.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'stand out'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'He takes after his mother.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'take after'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The plane took off on time.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'take off'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'She took on more responsibility.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'take on'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Take out the trash, please.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'take out'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'A larger firm took over the company.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'take over'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'He took up painting.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'take up'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Let''s talk it over tonight.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'talk over'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Think it over before you decide.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'think over'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Don''t throw away those papers.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'throw away'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Can I try on these shoes?', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'try on'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'They turned down my offer.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'turn down'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The caterpillar turned into a butterfly.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'turn into'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Turn off the lights when you leave.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'turn off'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Turn on the TV, please.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'turn on'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'It turned out to be a mistake.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'turn out'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'He turned up late as usual.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'turn up'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'I woke up at six.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'wake up'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Warm up before you exercise.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'warm up'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Watch out for pickpockets.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'watch out'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Things worked out fine in the end.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'work out'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Write down my phone number.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'write down'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The reform brought about big changes.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'bring about'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'This song brings back memories.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'bring back'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'They brought down the prices.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'bring down'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'I''ll call you back later.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'call back'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'When will you come back?', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'come back'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Prices have come down.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'come down'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Come in, the door is open.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'come in'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Cut out junk food from your diet.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'cut out'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'The kids dressed up for the party.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'dress up'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Let''s eat out tonight.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'eat out'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Be careful not to fall down.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'fall down'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Let''s get together next week.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'get together'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'I want to go back home.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'go back'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'She went through a hard time.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'go through'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'We were held up in traffic.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'hold up'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'I''m going to lie down for a while.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'lie down'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'They moved in last week.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'move in'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'He moved out of his parents'' house.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'move out'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'His grandfather passed away last year.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'pass away'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'She passed out from the heat.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'pass out'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'I''ll pay you back tomorrow.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'pay back'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Plug in the charger.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'plug in'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'That restaurant really ripped us off.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'rip off'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Please, sit down.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'sit down'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'I love to sleep in on weekends.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'sleep in'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Everyone slips up sometimes.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'slip up'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'She stood up and left the room.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'stand up'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'We stayed up all night.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'stay up'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Switch off your phone during the flight.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'switch off'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Switch on the light, it''s dark.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'switch on'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Tidy up your room before lunch.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'tidy up'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'I need to top up my phone.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'top up'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Let''s wrap up the meeting.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'wrap up'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );
INSERT INTO example (lexeme_id, sentence, source, difficulty)
SELECT l.id, 'Zoom in to see the details.', 'seed', 2
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'zoom in'
  AND NOT EXISTS (
      SELECT 1 FROM example e
      WHERE e.lexeme_id = l.id AND e.source = 'seed'
  );

INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, COALESCE(l.frequency_rank, 0)
FROM collection c
JOIN lexeme l ON l.language_id = 1
WHERE c.name = 'Phrasal Verbs'
  AND l.normalized_text IN ('ask out', 'back up', 'blow up', 'break down', 'break in', 'break up', 'bring up', 'brush up (on)', 'call off', 'calm down', 'carry on', 'carry out', 'catch up (with)', 'check in', 'check out', 'cheer up', 'come across', 'come up (with)', 'count on', 'cut down (on)', 'cut off', 'deal with', 'do over', 'drop by', 'drop off', 'end up', 'fall apart', 'fall behind', 'figure out', 'fill in', 'fill out', 'find out', 'get along (with)', 'get away', 'get back', 'get by', 'get in', 'get off', 'get on', 'get over', 'get up', 'give away', 'give back', 'give in', 'give up', 'go ahead', 'go on', 'go out', 'go over', 'grow up', 'hand in', 'hand out', 'hang out', 'hang up', 'hold on', 'keep on', 'keep up (with)', 'kick out', 'lay off', 'leave out', 'let down', 'look after', 'look down on', 'look for', 'look forward to', 'look into', 'look out', 'look up', 'look up to', 'make up', 'make up for', 'pick up', 'point out', 'put away', 'put off', 'put on', 'put out', 'put up with', 'run into', 'run out (of)', 'set off', 'set up', 'show up', 'shut down', 'slow down', 'sort out', 'stand out', 'take after', 'take off', 'take on', 'take out', 'take over', 'take up', 'talk over', 'think over', 'throw away', 'try on', 'turn down', 'turn into', 'turn off', 'turn on', 'turn out', 'turn up', 'wake up', 'warm up', 'watch out', 'work out', 'write down', 'bring about', 'bring back', 'bring down', 'call back', 'come back', 'come down', 'come in', 'cut out', 'dress up', 'eat out', 'fall down', 'get together', 'go back', 'go through', 'hold up', 'lie down', 'move in', 'move out', 'pass away', 'pass out', 'pay back', 'plug in', 'rip off', 'sit down', 'sleep in', 'slip up', 'stand up', 'stay up', 'switch off', 'switch on', 'tidy up', 'top up', 'wrap up', 'zoom in');

-- ── Section 3: Irregular Verbs ─────────────────────────────
-- 114 base-form lexemes; past/participle live in translation.sense
-- source: scripts/seed/data/irregular_verbs.csv

INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, is_system)
VALUES
    (1, 'arise', 'arise', 'verb', 1),
    (1, 'awake', 'awake', 'verb', 1),
    (1, 'be', 'be', 'verb', 1),
    (1, 'bear', 'bear', 'verb', 1),
    (1, 'beat', 'beat', 'verb', 1),
    (1, 'become', 'become', 'verb', 1),
    (1, 'begin', 'begin', 'verb', 1),
    (1, 'bend', 'bend', 'verb', 1),
    (1, 'bet', 'bet', 'verb', 1),
    (1, 'bid', 'bid', 'verb', 1),
    (1, 'bind', 'bind', 'verb', 1),
    (1, 'bite', 'bite', 'verb', 1),
    (1, 'bleed', 'bleed', 'verb', 1),
    (1, 'blow', 'blow', 'verb', 1),
    (1, 'break', 'break', 'verb', 1),
    (1, 'bring', 'bring', 'verb', 1),
    (1, 'build', 'build', 'verb', 1),
    (1, 'burn', 'burn', 'verb', 1),
    (1, 'burst', 'burst', 'verb', 1),
    (1, 'buy', 'buy', 'verb', 1),
    (1, 'catch', 'catch', 'verb', 1),
    (1, 'choose', 'choose', 'verb', 1),
    (1, 'come', 'come', 'verb', 1),
    (1, 'cost', 'cost', 'verb', 1),
    (1, 'cut', 'cut', 'verb', 1),
    (1, 'deal', 'deal', 'verb', 1),
    (1, 'dig', 'dig', 'verb', 1),
    (1, 'do', 'do', 'verb', 1),
    (1, 'draw', 'draw', 'verb', 1),
    (1, 'dream', 'dream', 'verb', 1),
    (1, 'drink', 'drink', 'verb', 1),
    (1, 'drive', 'drive', 'verb', 1),
    (1, 'eat', 'eat', 'verb', 1),
    (1, 'fall', 'fall', 'verb', 1),
    (1, 'feed', 'feed', 'verb', 1),
    (1, 'feel', 'feel', 'verb', 1),
    (1, 'fight', 'fight', 'verb', 1),
    (1, 'find', 'find', 'verb', 1),
    (1, 'fly', 'fly', 'verb', 1),
    (1, 'forget', 'forget', 'verb', 1),
    (1, 'forgive', 'forgive', 'verb', 1),
    (1, 'freeze', 'freeze', 'verb', 1),
    (1, 'get', 'get', 'verb', 1),
    (1, 'give', 'give', 'verb', 1),
    (1, 'go', 'go', 'verb', 1),
    (1, 'grow', 'grow', 'verb', 1),
    (1, 'hang', 'hang', 'verb', 1),
    (1, 'have', 'have', 'verb', 1),
    (1, 'hear', 'hear', 'verb', 1),
    (1, 'hide', 'hide', 'verb', 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, is_system)
VALUES
    (1, 'hit', 'hit', 'verb', 1),
    (1, 'hold', 'hold', 'verb', 1),
    (1, 'hurt', 'hurt', 'verb', 1),
    (1, 'keep', 'keep', 'verb', 1),
    (1, 'know', 'know', 'verb', 1),
    (1, 'lay', 'lay', 'verb', 1),
    (1, 'lead', 'lead', 'verb', 1),
    (1, 'learn', 'learn', 'verb', 1),
    (1, 'leave', 'leave', 'verb', 1),
    (1, 'lend', 'lend', 'verb', 1),
    (1, 'let', 'let', 'verb', 1),
    (1, 'lie', 'lie', 'verb', 1),
    (1, 'light', 'light', 'verb', 1),
    (1, 'lose', 'lose', 'verb', 1),
    (1, 'make', 'make', 'verb', 1),
    (1, 'mean', 'mean', 'verb', 1),
    (1, 'meet', 'meet', 'verb', 1),
    (1, 'pay', 'pay', 'verb', 1),
    (1, 'put', 'put', 'verb', 1),
    (1, 'read', 'read', 'verb', 1),
    (1, 'ride', 'ride', 'verb', 1),
    (1, 'ring', 'ring', 'verb', 1),
    (1, 'rise', 'rise', 'verb', 1),
    (1, 'run', 'run', 'verb', 1),
    (1, 'say', 'say', 'verb', 1),
    (1, 'see', 'see', 'verb', 1),
    (1, 'seek', 'seek', 'verb', 1),
    (1, 'sell', 'sell', 'verb', 1),
    (1, 'send', 'send', 'verb', 1),
    (1, 'set', 'set', 'verb', 1),
    (1, 'shake', 'shake', 'verb', 1),
    (1, 'shine', 'shine', 'verb', 1),
    (1, 'shoot', 'shoot', 'verb', 1),
    (1, 'show', 'show', 'verb', 1),
    (1, 'shut', 'shut', 'verb', 1),
    (1, 'sing', 'sing', 'verb', 1),
    (1, 'sink', 'sink', 'verb', 1),
    (1, 'sit', 'sit', 'verb', 1),
    (1, 'sleep', 'sleep', 'verb', 1),
    (1, 'slide', 'slide', 'verb', 1),
    (1, 'speak', 'speak', 'verb', 1),
    (1, 'spend', 'spend', 'verb', 1),
    (1, 'spill', 'spill', 'verb', 1),
    (1, 'split', 'split', 'verb', 1),
    (1, 'spread', 'spread', 'verb', 1),
    (1, 'stand', 'stand', 'verb', 1),
    (1, 'steal', 'steal', 'verb', 1),
    (1, 'stick', 'stick', 'verb', 1),
    (1, 'sting', 'sting', 'verb', 1),
    (1, 'strike', 'strike', 'verb', 1);
INSERT OR IGNORE INTO lexeme
    (language_id, text, normalized_text, part_of_speech, is_system)
VALUES
    (1, 'swear', 'swear', 'verb', 1),
    (1, 'sweep', 'sweep', 'verb', 1),
    (1, 'swim', 'swim', 'verb', 1),
    (1, 'take', 'take', 'verb', 1),
    (1, 'teach', 'teach', 'verb', 1),
    (1, 'tear', 'tear', 'verb', 1),
    (1, 'tell', 'tell', 'verb', 1),
    (1, 'think', 'think', 'verb', 1),
    (1, 'throw', 'throw', 'verb', 1),
    (1, 'understand', 'understand', 'verb', 1),
    (1, 'wake', 'wake', 'verb', 1),
    (1, 'wear', 'wear', 'verb', 1),
    (1, 'win', 'win', 'verb', 1),
    (1, 'write', 'write', 'verb', 1);

-- RU translations + verb forms in sense (guarded by NOT EXISTS)
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'возникать', 'past: arose; participle: arisen', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'arise'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'просыпаться', 'past: awoke; participle: awoken', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'awake'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'быть', 'past: was/were; participle: been', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'be'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'нести; рождать', 'past: bore; participle: borne', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'bear'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'бить', 'past: beat; participle: beaten', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'beat'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'становиться', 'past: became; participle: become', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'become'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'начинать', 'past: began; participle: begun', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'begin'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'сгибать', 'past: bent; participle: bent', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'bend'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'делать ставку', 'past: bet; participle: bet', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'bet'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'предлагать цену', 'past: bid; participle: bid', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'bid'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'связывать', 'past: bound; participle: bound', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'bind'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'кусать', 'past: bit; participle: bitten', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'bite'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'кровоточить', 'past: bled; participle: bled', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'bleed'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'дуть', 'past: blew; participle: blown', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'blow'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'ломать', 'past: broke; participle: broken', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'break'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'приносить', 'past: brought; participle: brought', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'bring'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'строить', 'past: built; participle: built', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'build'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'гореть', 'past: burnt; participle: burnt', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'burn'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'лопаться', 'past: burst; participle: burst', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'burst'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'покупать', 'past: bought; participle: bought', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'buy'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'ловить', 'past: caught; participle: caught', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'catch'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'выбирать', 'past: chose; participle: chosen', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'choose'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'приходить', 'past: came; participle: come', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'come'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'стоить', 'past: cost; participle: cost', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'cost'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'резать', 'past: cut; participle: cut', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'cut'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'иметь дело', 'past: dealt; participle: dealt', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'deal'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'копать', 'past: dug; participle: dug', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'dig'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'делать', 'past: did; participle: done', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'do'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'рисовать; тянуть', 'past: drew; participle: drawn', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'draw'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'мечтать; видеть сон', 'past: dreamt; participle: dreamt', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'dream'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'пить', 'past: drank; participle: drunk', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'drink'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'водить (машину)', 'past: drove; participle: driven', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'drive'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'есть', 'past: ate; participle: eaten', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'eat'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'падать', 'past: fell; participle: fallen', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'fall'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'кормить', 'past: fed; participle: fed', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'feed'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'чувствовать', 'past: felt; participle: felt', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'feel'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'драться', 'past: fought; participle: fought', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'fight'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'находить', 'past: found; participle: found', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'find'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'летать', 'past: flew; participle: flown', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'fly'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'забывать', 'past: forgot; participle: forgotten', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'forget'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'прощать', 'past: forgave; participle: forgiven', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'forgive'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'замерзать', 'past: froze; participle: frozen', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'freeze'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'получать; становиться', 'past: got; participle: got', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'get'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'давать', 'past: gave; participle: given', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'give'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'идти; ехать', 'past: went; participle: gone', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'go'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'расти; выращивать', 'past: grew; participle: grown', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'grow'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'вешать', 'past: hung; participle: hung', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'hang'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'иметь', 'past: had; participle: had', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'have'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'слышать', 'past: heard; participle: heard', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'hear'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'прятать', 'past: hid; participle: hidden', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'hide'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'ударять', 'past: hit; participle: hit', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'hit'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'держать', 'past: held; participle: held', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'hold'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'причинять боль', 'past: hurt; participle: hurt', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'hurt'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'держать; хранить', 'past: kept; participle: kept', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'keep'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'знать', 'past: knew; participle: known', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'know'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'класть', 'past: laid; participle: laid', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'lay'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'вести; руководить', 'past: led; participle: led', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'lead'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'учить; узнавать', 'past: learnt; participle: learnt', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'learn'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'покидать; оставлять', 'past: left; participle: left', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'leave'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'одалживать', 'past: lent; participle: lent', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'lend'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'позволять', 'past: let; participle: let', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'let'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'лежать', 'past: lay; participle: lain', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'lie'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'зажигать; освещать', 'past: lit; participle: lit', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'light'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'терять', 'past: lost; participle: lost', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'lose'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'делать; создавать', 'past: made; participle: made', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'make'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'означать', 'past: meant; participle: meant', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'mean'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'встречать', 'past: met; participle: met', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'meet'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'платить', 'past: paid; participle: paid', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'pay'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'класть; ставить', 'past: put; participle: put', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'put'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'читать', 'past: read; participle: read', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'read'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'ездить верхом', 'past: rode; participle: ridden', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'ride'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'звонить; звенеть', 'past: rang; participle: rung', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'ring'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'подниматься', 'past: rose; participle: risen', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'rise'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'бежать', 'past: ran; participle: run', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'run'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'сказать', 'past: said; participle: said', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'say'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'видеть', 'past: saw; participle: seen', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'see'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'искать', 'past: sought; participle: sought', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'seek'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'продавать', 'past: sold; participle: sold', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'sell'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'отправлять', 'past: sent; participle: sent', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'send'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'устанавливать', 'past: set; participle: set', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'set'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'трясти', 'past: shook; participle: shaken', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'shake'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'светить', 'past: shone; participle: shone', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'shine'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'стрелять', 'past: shot; participle: shot', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'shoot'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'показывать', 'past: showed; participle: shown', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'show'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'закрывать', 'past: shut; participle: shut', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'shut'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'петь', 'past: sang; participle: sung', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'sing'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'тонуть', 'past: sank; participle: sunk', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'sink'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'сидеть', 'past: sat; participle: sat', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'sit'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'спать', 'past: slept; participle: slept', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'sleep'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'скользить', 'past: slid; participle: slid', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'slide'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'говорить', 'past: spoke; participle: spoken', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'speak'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'тратить; проводить (время)', 'past: spent; participle: spent', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'spend'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'проливать', 'past: spilt; participle: spilt', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'spill'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'раскалывать; делить', 'past: split; participle: split', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'split'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'распространять', 'past: spread; participle: spread', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'spread'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'стоять', 'past: stood; participle: stood', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'stand'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'воровать', 'past: stole; participle: stolen', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'steal'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'приклеивать; втыкать', 'past: stuck; participle: stuck', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'stick'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'жалить', 'past: stung; participle: stung', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'sting'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'ударять; бастовать', 'past: struck; participle: struck', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'strike'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'клясться', 'past: swore; participle: sworn', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'swear'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'подметать', 'past: swept; participle: swept', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'sweep'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'плавать', 'past: swam; participle: swum', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'swim'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'брать', 'past: took; participle: taken', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'take'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'учить (кого-л.)', 'past: taught; participle: taught', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'teach'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'рвать', 'past: tore; participle: torn', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'tear'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'рассказывать', 'past: told; participle: told', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'tell'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'думать', 'past: thought; participle: thought', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'think'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'бросать', 'past: threw; participle: thrown', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'throw'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'понимать', 'past: understood; participle: understood', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'understand'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'будить; просыпаться', 'past: woke; participle: woken', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'wake'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'носить (одежду)', 'past: wore; participle: worn', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'wear'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'выигрывать', 'past: won; participle: won', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'win'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );
INSERT INTO translation (lexeme_id, target_language_id, translated_text, sense, source, confidence)
SELECT l.id, 2, 'писать', 'past: wrote; participle: written', 'seed', 1.0
FROM lexeme l
WHERE l.language_id = 1 AND l.normalized_text = 'write'
  AND NOT EXISTS (
      SELECT 1 FROM translation t
      WHERE t.lexeme_id = l.id
        AND t.target_language_id = 2
        AND t.source = 'seed'
  );

INSERT OR IGNORE INTO collection_item (collection_id, lexeme_id, sort_order)
SELECT c.id, l.id, COALESCE(l.frequency_rank, 0)
FROM collection c
JOIN lexeme l ON l.language_id = 1
WHERE c.name = 'Irregular Verbs'
  AND l.normalized_text IN ('arise', 'awake', 'be', 'bear', 'beat', 'become', 'begin', 'bend', 'bet', 'bid', 'bind', 'bite', 'bleed', 'blow', 'break', 'bring', 'build', 'burn', 'burst', 'buy', 'catch', 'choose', 'come', 'cost', 'cut', 'deal', 'dig', 'do', 'draw', 'dream', 'drink', 'drive', 'eat', 'fall', 'feed', 'feel', 'fight', 'find', 'fly', 'forget', 'forgive', 'freeze', 'get', 'give', 'go', 'grow', 'hang', 'have', 'hear', 'hide', 'hit', 'hold', 'hurt', 'keep', 'know', 'lay', 'lead', 'learn', 'leave', 'lend', 'let', 'lie', 'light', 'lose', 'make', 'mean', 'meet', 'pay', 'put', 'read', 'ride', 'ring', 'rise', 'run', 'say', 'see', 'seek', 'sell', 'send', 'set', 'shake', 'shine', 'shoot', 'show', 'shut', 'sing', 'sink', 'sit', 'sleep', 'slide', 'speak', 'spend', 'spill', 'split', 'spread', 'stand', 'steal', 'stick', 'sting', 'strike', 'swear', 'sweep', 'swim', 'take', 'teach', 'tear', 'tell', 'think', 'throw', 'understand', 'wake', 'wear', 'win', 'write');
