"""
PII Redaction Service
Detects and tokenizes sensitive personal information before it reaches the AI.
Handles Indian-specific PII formats: Aadhaar, PAN, phone numbers, etc.
Two-pass pipeline: spaCy NER (names/orgs/places) + Regex (IDs/numbers).
"""
import re

# ──────────────────────────────────────────────
#  Internal counter (per-request, reset each call)
# ──────────────────────────────────────────────
def _next_token(category: str, counter: dict) -> str:
    counter[category] = counter.get(category, 0) + 1
    return f"[{category}_{counter[category]}]"


# ──────────────────────────────────────────────
#  PII Patterns  (Indian context + universal)
# ──────────────────────────────────────────────
PII_PATTERNS = [
    # Aadhaar: 12 digits optionally separated by spaces/dashes
    ("AADHAAR", r"\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b"),

    # PAN Card: ABCDE1234F format
    ("PAN", r"\b[A-Z]{5}[0-9]{4}[A-Z]\b"),

    # Voter ID: ABC1234567
    ("VOTER_ID", r"\b[A-Z]{3}[0-9]{7}\b"),

    # Passport: A1234567
    ("PASSPORT", r"\b[A-PR-WYa-pr-wy][1-9]\d{7}\b"),

    # IFSC Code: SBIN0001234
    ("IFSC", r"\b[A-Z]{4}0[A-Z0-9]{6}\b"),

    # Indian phone: +91, 0 prefix, or plain 10-digit starting with 6-9
    ("PHONE", r"(\+91[\s\-]?|0)?[6-9]\d{9}\b"),

    # Email address
    ("EMAIL", r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b"),

    # Bank account numbers (9–18 digits, standalone)
    ("BANK_ACC", r"(?<!\d)\d{9,18}(?!\d)"),

    # GST number: 22AAAAA0000A1Z5
    ("GST", r"\b\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]\b"),

    # UPI ID: name@bank
    ("UPI", r"\b[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}\b"),

    # Date of birth patterns: DD/MM/YYYY or DD-MM-YYYY
    ("DOB", r"\b(0?[1-9]|[12]\d|3[01])[\/\-](0?[1-9]|1[0-2])[\/\-](19|20)\d{2}\b"),

    # Pincode: 6-digit Indian PIN
    ("PINCODE", r"\b[1-9][0-9]{5}\b"),
]

# ──────────────────────────────────────────────
#  spaCy NER — for names, orgs, places
# ──────────────────────────────────────────────
_nlp = None

def _get_nlp():
    """Lazy-load spaCy model so import is fast."""
    global _nlp
    if _nlp is None:
        try:
            import spacy
            _nlp = spacy.load("en_core_web_sm")
        except Exception:
            _nlp = False   # Mark as unavailable so we don't retry every call
    return _nlp if _nlp else None


def _redact_ner(text: str, counter: dict, token_map: dict) -> str:
    """
    Use spaCy Named Entity Recognition to find and replace:
      PERSON  -> [NAME_N]
      ORG     -> [ORG_N]
      GPE/LOC -> [PLACE_N]
    Processes in reverse order to preserve character offsets.
    """
    nlp = _get_nlp()
    if not nlp:
        return text  # Fall back gracefully if spaCy not available

    doc = nlp(text)

    entities = []
    for ent in doc.ents:
        if ent.label_ == "PERSON":
            cat = "NAME"
        elif ent.label_ == "ORG":
            cat = "ORG"
        elif ent.label_ in ("GPE", "LOC"):
            cat = "PLACE"
        else:
            continue
        entities.append((ent.start_char, ent.end_char, ent.text, cat))

    # Replace from end to start so positions stay valid
    for start, end, original, cat in sorted(entities, key=lambda x: x[0], reverse=True):
        token = _next_token(cat, counter)
        token_map[token] = original
        text = text[:start] + token + text[end:]

    return text


def redact_pii(text: str) -> tuple[str, dict]:
    """
    Two-pass redaction:
      Pass 1 — spaCy NER  -> names, organisations, places
      Pass 2 — Regex      -> Aadhaar, PAN, phone, email, DOB, etc.
    Returns (redacted_text, token_map).
    The token_map is sent to the client only; server never stores it.
    """
    counter: dict = {}
    token_map: dict = {}

    # Pass 1: NER-based (names / orgs / places)
    text = _redact_ner(text, counter, token_map)

    # Pass 2: Regex-based (structured Indian PII)
    for category, pattern in PII_PATTERNS:
        def replace_match(m, cat=category, internal_cnt=counter):
            token = _next_token(cat, internal_cnt)
            token_map[token] = m.group(0)
            return token
        text = re.sub(pattern, replace_match, text)

    return text, token_map


def get_redaction_summary(token_map: dict) -> dict:
    """Return a count of each PII type found (for UI display)."""
    summary: dict = {}
    for token in token_map:
        # Token format: [CATEGORY_N]
        category = token.strip("[]").rsplit("_", 1)[0]
        summary[category] = summary.get(category, 0) + 1
    return summary
