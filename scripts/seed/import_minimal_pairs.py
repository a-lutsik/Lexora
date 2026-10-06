#!/usr/bin/env python3
"""Generate V009 minimal-pair INSERT statements. Run from repo root."""
from pathlib import Path

# word_a, word_b, ipa_a, ipa_b, contrast_a, contrast_b, contrast_type
PAIRS = [
    # ── /iː/ vs /ɪ/ ────────────────────────────────────────
    ("ship", "sheep", "/ʃɪp/", "/ʃiːp/", "ɪ", "iː", "vowel"),
    ("bit", "beat", "/bɪt/", "/biːt/", "ɪ", "iː", "vowel"),
    ("sit", "seat", "/sɪt/", "/siːt/", "ɪ", "iː", "vowel"),
    ("lick", "leek", "/lɪk/", "/liːk/", "ɪ", "iː", "vowel"),
    ("fill", "feel", "/fɪl/", "/fiːl/", "ɪ", "iː", "vowel"),
    ("live", "leave", "/lɪv/", "/liːv/", "ɪ", "iː", "vowel"),
    ("rich", "reach", "/rɪtʃ/", "/riːtʃ/", "ɪ", "iː", "vowel"),
    ("chip", "cheap", "/tʃɪp/", "/tʃiːp/", "ɪ", "iː", "vowel"),
    ("bin", "bean", "/bɪn/", "/biːn/", "ɪ", "iː", "vowel"),
    ("mill", "meal", "/mɪl/", "/miːl/", "ɪ", "iː", "vowel"),
    ("pick", "peak", "/pɪk/", "/piːk/", "ɪ", "iː", "vowel"),
    ("hill", "heal", "/hɪl/", "/hiːl/", "ɪ", "iː", "vowel"),
    ("slip", "sleep", "/slɪp/", "/sliːp/", "ɪ", "iː", "vowel"),
    ("fit", "feet", "/fɪt/", "/fiːt/", "ɪ", "iː", "vowel"),
    ("list", "least", "/lɪst/", "/liːst/", "ɪ", "iː", "vowel"),
    ("dip", "deep", "/dɪp/", "/diːp/", "ɪ", "iː", "vowel"),
    # ── /æ/ vs /e/ ─────────────────────────────────────────
    ("bat", "bet", "/bæt/", "/bet/", "æ", "e", "vowel"),
    ("man", "men", "/mæn/", "/men/", "æ", "e", "vowel"),
    ("pan", "pen", "/pæn/", "/pen/", "æ", "e", "vowel"),
    ("sat", "set", "/sæt/", "/set/", "æ", "e", "vowel"),
    ("bad", "bed", "/bæd/", "/bed/", "æ", "e", "vowel"),
    ("tan", "ten", "/tæn/", "/ten/", "æ", "e", "vowel"),
    ("bag", "beg", "/bæg/", "/beg/", "æ", "e", "vowel"),
    ("sad", "said", "/sæd/", "/sed/", "æ", "e", "vowel"),
    ("land", "lend", "/lænd/", "/lend/", "æ", "e", "vowel"),
    ("flash", "flesh", "/flæʃ/", "/fleʃ/", "æ", "e", "vowel"),
    ("shall", "shell", "/ʃæl/", "/ʃel/", "æ", "e", "vowel"),
    ("and", "end", "/ænd/", "/end/", "æ", "e", "vowel"),
    # ── /ʌ/ vs /ɑː/ ────────────────────────────────────────
    ("cut", "cart", "/kʌt/", "/kɑːt/", "ʌ", "ɑː", "vowel"),
    ("hut", "heart", "/hʌt/", "/hɑːt/", "ʌ", "ɑː", "vowel"),
    ("luck", "lark", "/lʌk/", "/lɑːk/", "ʌ", "ɑː", "vowel"),
    ("duck", "dark", "/dʌk/", "/dɑːk/", "ʌ", "ɑː", "vowel"),
    ("cup", "carp", "/kʌp/", "/kɑːp/", "ʌ", "ɑː", "vowel"),
    ("come", "calm", "/kʌm/", "/kɑːm/", "ʌ", "ɑː", "vowel"),
    ("done", "darn", "/dʌn/", "/dɑːn/", "ʌ", "ɑː", "vowel"),
    ("bun", "barn", "/bʌn/", "/bɑːn/", "ʌ", "ɑː", "vowel"),
    # ── /ʌ/ vs /ɒ/ ─────────────────────────────────────────
    ("luck", "lock", "/lʌk/", "/lɒk/", "ʌ", "ɒ", "vowel"),
    ("duck", "dock", "/dʌk/", "/dɒk/", "ʌ", "ɒ", "vowel"),
    ("hut", "hot", "/hʌt/", "/hɒt/", "ʌ", "ɒ", "vowel"),
    ("cut", "cot", "/kʌt/", "/kɒt/", "ʌ", "ɒ", "vowel"),
    ("suck", "sock", "/sʌk/", "/sɒk/", "ʌ", "ɒ", "vowel"),
    ("bug", "bog", "/bʌg/", "/bɒg/", "ʌ", "ɒ", "vowel"),
    # ── /ʊ/ vs /uː/ ────────────────────────────────────────
    ("full", "fool", "/fʊl/", "/fuːl/", "ʊ", "uː", "vowel"),
    ("pull", "pool", "/pʊl/", "/puːl/", "ʊ", "uː", "vowel"),
    ("look", "luke", "/lʊk/", "/luːk/", "ʊ", "uː", "vowel"),
    ("could", "cooed", "/kʊd/", "/kuːd/", "ʊ", "uː", "vowel"),
    # ── /ɒ/ vs /ɔː/ ────────────────────────────────────────
    ("cot", "caught", "/kɒt/", "/kɔːt/", "ɒ", "ɔː", "vowel"),
    ("pot", "port", "/pɒt/", "/pɔːt/", "ɒ", "ɔː", "vowel"),
    ("not", "nought", "/nɒt/", "/nɔːt/", "ɒ", "ɔː", "vowel"),
    ("spot", "sport", "/spɒt/", "/spɔːt/", "ɒ", "ɔː", "vowel"),
    # ── /e/ vs /eɪ/ ────────────────────────────────────────
    ("pen", "pain", "/pen/", "/peɪn/", "e", "eɪ", "vowel"),
    ("wet", "wait", "/wet/", "/weɪt/", "e", "eɪ", "vowel"),
    ("test", "taste", "/test/", "/teɪst/", "e", "eɪ", "vowel"),
    ("pepper", "paper", "/ˈpepə/", "/ˈpeɪpə/", "e", "eɪ", "vowel"),
    ("sell", "sale", "/sel/", "/seɪl/", "e", "eɪ", "vowel"),
    # ── /ɜː/ vs /ɑː/ ───────────────────────────────────────
    ("bird", "bard", "/bɜːd/", "/bɑːd/", "ɜː", "ɑː", "vowel"),
    ("fur", "far", "/fɜː/", "/fɑː/", "ɜː", "ɑː", "vowel"),
    ("heard", "hard", "/hɜːd/", "/hɑːd/", "ɜː", "ɑː", "vowel"),
    ("stir", "star", "/stɜː/", "/stɑː/", "ɜː", "ɑː", "vowel"),
    # ── /æ/ vs /ɑː/ ────────────────────────────────────────
    ("cat", "cart", "/kæt/", "/kɑːt/", "æ", "ɑː", "vowel"),
    ("hat", "heart", "/hæt/", "/hɑːt/", "æ", "ɑː", "vowel"),
    ("pack", "park", "/pæk/", "/pɑːk/", "æ", "ɑː", "vowel"),
    ("match", "march", "/mætʃ/", "/mɑːtʃ/", "æ", "ɑː", "vowel"),
    ("had", "hard", "/hæd/", "/hɑːd/", "æ", "ɑː", "vowel"),
    # ── /ɪ/ vs /e/ ─────────────────────────────────────────
    ("pin", "pen", "/pɪn/", "/pen/", "ɪ", "e", "vowel"),
    ("tin", "ten", "/tɪn/", "/ten/", "ɪ", "e", "vowel"),
    ("lid", "led", "/lɪd/", "/led/", "ɪ", "e", "vowel"),
    # ── /θ/ vs /s/ ─────────────────────────────────────────
    ("think", "sink", "/θɪŋk/", "/sɪŋk/", "θ", "s", "consonant"),
    ("thick", "sick", "/θɪk/", "/sɪk/", "θ", "s", "consonant"),
    ("path", "pass", "/pɑːθ/", "/pɑːs/", "θ", "s", "consonant"),
    ("thumb", "some", "/θʌm/", "/sʌm/", "θ", "s", "consonant"),
    ("thing", "sing", "/θɪŋ/", "/sɪŋ/", "θ", "s", "consonant"),
    ("mouth", "mouse", "/maʊθ/", "/maʊs/", "θ", "s", "consonant"),
    ("tenth", "tense", "/tenθ/", "/tens/", "θ", "s", "consonant"),
    ("faith", "face", "/feɪθ/", "/feɪs/", "θ", "s", "consonant"),
    # ── /θ/ vs /f/ ─────────────────────────────────────────
    ("three", "free", "/θriː/", "/friː/", "θ", "f", "consonant"),
    ("thought", "fought", "/θɔːt/", "/fɔːt/", "θ", "f", "consonant"),
    ("thin", "fin", "/θɪn/", "/fɪn/", "θ", "f", "consonant"),
    ("thirst", "first", "/θɜːst/", "/fɜːst/", "θ", "f", "consonant"),
    # ── /ð/ vs /d/ ─────────────────────────────────────────
    ("they", "day", "/ðeɪ/", "/deɪ/", "ð", "d", "consonant"),
    ("then", "den", "/ðen/", "/den/", "ð", "d", "consonant"),
    ("there", "dare", "/ðeə/", "/deə/", "ð", "d", "consonant"),
    ("those", "doze", "/ðəʊz/", "/dəʊz/", "ð", "d", "consonant"),
    ("breathe", "breed", "/briːð/", "/briːd/", "ð", "d", "consonant"),
    ("worthy", "wordy", "/ˈwɜːði/", "/ˈwɜːdi/", "ð", "d", "consonant"),
    # ── /ð/ vs /z/ ─────────────────────────────────────────
    ("breathe", "breeze", "/briːð/", "/briːz/", "ð", "z", "consonant"),
    ("clothe", "close", "/kləʊð/", "/kləʊz/", "ð", "z", "consonant"),
    ("teethe", "tease", "/tiːð/", "/tiːz/", "ð", "z", "consonant"),
    # ── /v/ vs /w/ ─────────────────────────────────────────
    ("vest", "west", "/vest/", "/west/", "v", "w", "consonant"),
    ("vine", "wine", "/vaɪn/", "/waɪn/", "v", "w", "consonant"),
    ("veal", "wheel", "/viːl/", "/wiːl/", "v", "w", "consonant"),
    ("very", "wary", "/ˈveri/", "/ˈweəri/", "v", "w", "consonant"),
    ("verse", "worse", "/vɜːs/", "/wɜːs/", "v", "w", "consonant"),
    ("vet", "wet", "/vet/", "/wet/", "v", "w", "consonant"),
    # ── /l/ vs /r/ ─────────────────────────────────────────
    ("light", "right", "/laɪt/", "/raɪt/", "l", "r", "consonant"),
    ("long", "wrong", "/lɒŋ/", "/rɒŋ/", "l", "r", "consonant"),
    ("glass", "grass", "/glɑːs/", "/grɑːs/", "l", "r", "consonant"),
    ("play", "pray", "/pleɪ/", "/preɪ/", "l", "r", "consonant"),
    ("led", "red", "/led/", "/red/", "l", "r", "consonant"),
    ("lock", "rock", "/lɒk/", "/rɒk/", "l", "r", "consonant"),
    ("collect", "correct", "/kəˈlekt/", "/kəˈrekt/", "l", "r", "consonant"),
    ("fly", "fry", "/flaɪ/", "/fraɪ/", "l", "r", "consonant"),
    ("alive", "arrive", "/əˈlaɪv/", "/əˈraɪv/", "l", "r", "consonant"),
    ("belly", "berry", "/ˈbeli/", "/ˈberi/", "l", "r", "consonant"),
    ("late", "rate", "/leɪt/", "/reɪt/", "l", "r", "consonant"),
    ("law", "raw", "/lɔː/", "/rɔː/", "l", "r", "consonant"),
    # ── /ʃ/ vs /s/ ─────────────────────────────────────────
    ("ship", "sip", "/ʃɪp/", "/sɪp/", "ʃ", "s", "consonant"),
    ("she", "see", "/ʃiː/", "/siː/", "ʃ", "s", "consonant"),
    ("shock", "sock", "/ʃɒk/", "/sɒk/", "ʃ", "s", "consonant"),
    ("shine", "sign", "/ʃaɪn/", "/saɪn/", "ʃ", "s", "consonant"),
    ("bash", "bass", "/bæʃ/", "/bæs/", "ʃ", "s", "consonant"),
    ("show", "so", "/ʃəʊ/", "/səʊ/", "ʃ", "s", "consonant"),
    # ── /tʃ/ vs /ʃ/ ────────────────────────────────────────
    ("cheap", "sheep", "/tʃiːp/", "/ʃiːp/", "tʃ", "ʃ", "consonant"),
    ("chew", "shoe", "/tʃuː/", "/ʃuː/", "tʃ", "ʃ", "consonant"),
    ("catch", "cash", "/kætʃ/", "/kæʃ/", "tʃ", "ʃ", "consonant"),
    ("watch", "wash", "/wɒtʃ/", "/wɒʃ/", "tʃ", "ʃ", "consonant"),
    ("chair", "share", "/tʃeə/", "/ʃeə/", "tʃ", "ʃ", "consonant"),
    # ── /dʒ/ vs /j/ ────────────────────────────────────────
    ("jet", "yet", "/dʒet/", "/jet/", "dʒ", "j", "consonant"),
    ("joke", "yolk", "/dʒəʊk/", "/jəʊk/", "dʒ", "j", "consonant"),
    ("jam", "yam", "/dʒæm/", "/jæm/", "dʒ", "j", "consonant"),
    # ── /b/ vs /p/ ─────────────────────────────────────────
    ("buy", "pie", "/baɪ/", "/paɪ/", "b", "p", "consonant"),
    ("bear", "pear", "/beə/", "/peə/", "b", "p", "consonant"),
    ("beach", "peach", "/biːtʃ/", "/piːtʃ/", "b", "p", "consonant"),
    ("bill", "pill", "/bɪl/", "/pɪl/", "b", "p", "consonant"),
    # ── /g/ vs /k/ ─────────────────────────────────────────
    ("gap", "cap", "/gæp/", "/kæp/", "g", "k", "consonant"),
    ("goat", "coat", "/gəʊt/", "/kəʊt/", "g", "k", "consonant"),
    ("bag", "back", "/bæg/", "/bæk/", "g", "k", "consonant"),
    ("glass", "class", "/glɑːs/", "/klɑːs/", "g", "k", "consonant"),
    # ── /n/ vs /ŋ/ ─────────────────────────────────────────
    ("thin", "thing", "/θɪn/", "/θɪŋ/", "n", "ŋ", "consonant"),
    ("ran", "rang", "/ræn/", "/ræŋ/", "n", "ŋ", "consonant"),
    ("win", "wing", "/wɪn/", "/wɪŋ/", "n", "ŋ", "consonant"),
    ("sin", "sing", "/sɪn/", "/sɪŋ/", "n", "ŋ", "consonant"),
    ("ton", "tongue", "/tʌn/", "/tʌŋ/", "n", "ŋ", "consonant"),
    # ── /s/ vs /z/ ─────────────────────────────────────────
    ("sip", "zip", "/sɪp/", "/zɪp/", "s", "z", "consonant"),
    ("price", "prize", "/praɪs/", "/praɪz/", "s", "z", "consonant"),
    ("ice", "eyes", "/aɪs/", "/aɪz/", "s", "z", "consonant"),
    ("rice", "rise", "/raɪs/", "/raɪz/", "s", "z", "consonant"),
    ("bus", "buzz", "/bʌs/", "/bʌz/", "s", "z", "consonant"),
    # ── /f/ vs /v/ ─────────────────────────────────────────
    ("fan", "van", "/fæn/", "/væn/", "f", "v", "consonant"),
    ("fine", "vine", "/faɪn/", "/vaɪn/", "f", "v", "consonant"),
    ("safe", "save", "/seɪf/", "/seɪv/", "f", "v", "consonant"),
    ("leaf", "leave", "/liːf/", "/liːv/", "f", "v", "consonant"),
    ("few", "view", "/fjuː/", "/vjuː/", "f", "v", "consonant"),
]


def sql_str(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def main() -> None:
    assert len(PAIRS) >= 100, len(PAIRS)
    keys = {(p[0], p[1], "en") for p in PAIRS}
    assert len(keys) == len(PAIRS), "duplicate word pairs"

    rows = []
    for word_a, word_b, ipa_a, ipa_b, ca, cb, ctype in PAIRS:
        rows.append(
            f"    ({sql_str(word_a)}, {sql_str(word_b)}, {sql_str(ipa_a)}, {sql_str(ipa_b)}, "
            f"{sql_str(ca)}, {sql_str(cb)}, {sql_str(ctype)}, 'en')"
        )

    sql = (
        "INSERT OR IGNORE INTO minimal_pair\n"
        "    (word_a, word_b, ipa_a, ipa_b, contrast_phoneme_a, contrast_phoneme_b, contrast_type, language)\n"
        "VALUES\n"
        + ",\n".join(rows)
        + ";\n"
    )
    out = Path(__file__).resolve().parent / "data" / "minimal_pairs.sql"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(sql, encoding="utf-8")
    csv = Path(__file__).resolve().parent / "data" / "minimal_pairs.csv"
    csv.write_text(
        "word_a,word_b,ipa_a,ipa_b,contrast_phoneme_a,contrast_phoneme_b,contrast_type,language\n"
        + "\n".join(
            f"{a},{b},{ia},{ib},{ca},{cb},{ct},en"
            for a, b, ia, ib, ca, cb, ct in PAIRS
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"wrote {len(PAIRS)} pairs to {out}")


if __name__ == "__main__":
    main()
