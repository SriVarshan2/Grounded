import re
import nltk
from nltk.tokenize import sent_tokenize

# Download required nltk data
nltk.download('punkt', quiet=True)
nltk.download('punkt_tab', quiet=True)

CAUSAL_VERBS = [
    "reduce", "reduces", "reduced",
    "prevent", "prevents", "prevented",
    "improve", "improves", "improved",
    "cause", "causes", "caused",
    "boost", "boosts", "boosted",
    "increase", "increases", "increased",
    "decrease", "decreases", "decreased",
    "enhance", "enhances", "enhanced",
    "lower", "lowers", "lowered",
    "raise", "raises", "raised",
    "fight", "fights", "fought",
    "treat", "treats", "treated",
    "heal", "heals", "healed",
    "cure", "cures", "cured",
    "protect", "protects", "protected",
    "help", "helps", "helped",
    "support", "supports", "supported",
    "promote", "promotes", "promoted",
    "inhibit", "inhibits", "inhibited",
    "stimulate", "stimulates", "stimulated",
    "suppress", "suppresses", "suppressed"
]

TRIGGER_PHRASES = [
    "studies show", "research shows",
    "research suggests", "research indicates",
    "clinically proven", "scientifically proven",
    "experts say", "doctors recommend",
    "proven to", "evidence suggests",
    "data shows", "trials show",
    "according to research",
    "studies indicate", "studies suggest"
]

NUMBER_PATTERN = re.compile(
    r'\b\d+\.?\d*\s*(%|percent|mg|mcg|iu|grams?|kg|lb)\b'
    r'|\b\d+\s*(times|x)\s*(more|less|better|worse)\b'
    r'|\b\d+\s*out\s*of\s*\d+\b',
    re.IGNORECASE
)

COMPARATIVE_PATTERN = re.compile(
    r'\bmore\s+than\s+\d+\b'
    r'|\bup\s+to\s+\d+\b'
    r'|\bas\s+much\s+as\s+\d+\b'
    r'|\bbetter\s+than\b'
    r'|\bmore\s+effective\s+than\b'
    r'|\btimes\s+more\b',
    re.IGNORECASE
)

def extract_claims(sentences: list[str]) -> list[dict]:
    results = []
    for sentence in sentences:
        sentence_lower = sentence.lower()
        is_claim = False
        claim_type = "none"
        matched_pattern = ""

        # Rule 1: Number pattern
        match = NUMBER_PATTERN.search(sentence)
        if match:
            is_claim = True
            claim_type = "number"
            matched_pattern = match.group()

        # Rule 2: Causal verbs
        if not is_claim:
            for verb in CAUSAL_VERBS:
                if f" {verb} " in f" {sentence_lower} ":
                    is_claim = True
                    claim_type = "causal"
                    matched_pattern = verb
                    break

        # Rule 3: Trigger phrases
        if not is_claim:
            for phrase in TRIGGER_PHRASES:
                if phrase in sentence_lower:
                    is_claim = True
                    claim_type = "trigger_phrase"
                    matched_pattern = phrase
                    break

        # Rule 4: Comparative
        if not is_claim:
            match = COMPARATIVE_PATTERN.search(sentence)
            if match:
                is_claim = True
                claim_type = "comparative"
                matched_pattern = match.group()

        results.append({
            "text": sentence,
            "is_claim": is_claim,
            "claim_type": claim_type,
            "matched_pattern": matched_pattern
        })

    return results
