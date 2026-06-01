import re
import spacy
import sys

# Load spaCy model
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    nlp = None

# Rule 2: Causal/Effect base verbs
CAUSAL_VERBS = {
    "reduce", "prevent", "improve", "cause", "boost", "increase", 
    "decrease", "enhance", "lower", "raise", "fight", "treat", "heal", 
    "cure", "protect", "help", "support", "promote", "inhibit", 
    "stimulate", "suppress", "regulate", "accelerate", "slow"
}

# Rule 3: Trigger phrases
TRIGGER_PHRASES = [
    "studies show", "research shows", "research suggests",
    "research indicates", "clinically proven", "scientifically proven",
    "experts say", "doctors recommend", "proven to",
    "evidence suggests", "data shows", "trials show"
]

# Rule 4: Comparative substrings
COMPARATIVE_PHRASES = [
    "as much as", "better than", "more effective than", "times more"
]

def extract_claims(sentences: list[str]) -> list[dict]:
    """
    Scans a list of sentences and extracts specific claims based on four rules:
    Rule 1 (Number/Percentage), Rule 2 (Causal Verbs), Rule 3 (Trigger Phrases),
    and Rule 4 (Comparative Patterns).
    
    Args:
        sentences (list[str]): The list of sentences to evaluate.
        
    Returns:
        list[dict]: A list of dicts with keys:
            - "text" (str)
            - "is_claim" (bool)
            - "claim_type" (str): "number|causal|trigger_phrase|comparative" or ""
            - "matched_pattern" (str): The specific word or phrase matching the rule.
    """
    global nlp
    if nlp is None:
        try:
            nlp = spacy.load("en_core_web_sm")
        except OSError:
            import subprocess
            subprocess.run([sys.executable, "-m", "spacy", "download", "en_core_web_sm"], check=True)
            nlp = spacy.load("en_core_web_sm")

    results = []
    for sentence in sentences:
        if not sentence.strip():
            continue
            
        doc = nlp(sentence)
        is_claim = False
        claim_type = ""
        matched_pattern = ""
        sentence_lower = sentence.lower()
        
        # RULE 3 - Claim Trigger Phrases (higher semantic significance, check first)
        for phrase in TRIGGER_PHRASES:
            if phrase in sentence_lower:
                is_claim = True
                claim_type = "trigger_phrase"
                matched_pattern = phrase
                break
                
        # RULE 4 - Comparative Patterns
        if not is_claim:
            # Check explicit substrings
            for comp in COMPARATIVE_PHRASES:
                if comp in sentence_lower:
                    is_claim = True
                    claim_type = "comparative"
                    matched_pattern = comp
                    break
            
            # Check regex: more than X% and up to X%
            if not is_claim:
                more_than_match = re.search(r'\bmore than \d+(?:\.\d+)?%', sentence_lower)
                up_to_match = re.search(r'\bup to \d+(?:\.\d+)?%', sentence_lower)
                if more_than_match:
                    is_claim = True
                    claim_type = "comparative"
                    matched_pattern = more_than_match.group(0)
                elif up_to_match:
                    is_claim = True
                    claim_type = "comparative"
                    matched_pattern = up_to_match.group(0)

        # RULE 2 - Causal/Effect Verbs (lemma match)
        if not is_claim:
            causal_verbs_matched = []
            for token in doc:
                if token.pos_ in ("VERB", "AUX") and token.lemma_.lower() in CAUSAL_VERBS:
                    causal_verbs_matched.append(token.text)
            if causal_verbs_matched:
                is_claim = True
                claim_type = "causal"
                matched_pattern = ", ".join(causal_verbs_matched)

        # RULE 1 - Contains a number or percentage
        if not is_claim:
            # Check regex percentage: \d+% or \d+\.\d+%
            pct_match = re.search(r'\d+(?:\.\d+)?%', sentence)
            if pct_match:
                is_claim = True
                claim_type = "number"
                matched_pattern = pct_match.group(0)
            else:
                # Check spaCy like_num
                num_tokens = [t.text for t in doc if t.like_num]
                if num_tokens:
                    is_claim = True
                    claim_type = "number"
                    matched_pattern = ", ".join(num_tokens)

        results.append({
            "text": sentence,
            "is_claim": is_claim,
            "claim_type": claim_type,
            "matched_pattern": matched_pattern
        })
        
    return results
