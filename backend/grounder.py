import re

# List of reputable named authorities to scan for
NAMED_AUTHORITIES = [
    "WHO", "CDC", "NIH", "NHS", "FDA", "USDA", 
    "Mayo Clinic", "Harvard", "Stanford", "Oxford", "Cambridge",
    "American Heart Association", "American Cancer Society",
    "National Institutes", "European Food Safety"
]

# Common research and study references
NAMED_STUDIES = [
    "a study", "a trial", "a review", "a meta-analysis",
    "a systematic review", "researchers at", "scientists at",
    "published in", "Journal of", "et al", "according to"
]

def check_grounding(claim_sentence: str, 
                      sentence_index: int,
                      all_sentences: list[str], 
                      article_links: list[dict]) -> dict:
    """
    Checks if a specific claim is grounded based on four deterministic rules.
    
    Args:
        claim_sentence (str): The text of the claim.
        sentence_index (int): Index of this sentence in the article list.
        all_sentences (list[str]): Complete list of sentences in the article.
        article_links (list[dict]): List of link elements extracted from the article.
        
    Returns:
        dict: A dictionary containing:
            - "grounded": bool
            - "condition_met": "nearby_link|named_authority|named_study|year_citation|none"
            - "reason": human-readable explanation string
    """
    # Identify adjacent context sentences (before and after)
    current_sent = claim_sentence
    before_sent = all_sentences[sentence_index - 1] if sentence_index > 0 else ""
    after_sent = all_sentences[sentence_index + 1] if sentence_index < len(all_sentences) - 1 else ""
    
    candidates = [current_sent, before_sent, after_sent]
    candidates = [c for c in candidates if c] # Clean empty candidates

    # CONDITION 1: Nearby hyperlink
    for link in article_links:
        href = link.get("href", "")
        anchor = link.get("anchor_text", "")
        surr = link.get("surrounding_sentence", "")
        
        for cand in candidates:
            cand_lower = cand.lower()
            # A match happens if the link's anchor text or surrounding sentence is present inside candidate
            if (anchor and anchor.lower() in cand_lower) or \
               (surr and surr.lower() in cand_lower) or \
               (surr and cand_lower in surr.lower()):
                return {
                    "grounded": True,
                    "condition_met": "nearby_link",
                    "reason": f"Claim or adjacent sentence is linked to a source: {href} (via '{anchor}')"
                }

    # CONDITION 2: Named authority present in claim or adjacent sentences
    for auth in NAMED_AUTHORITIES:
        # Use word boundaries to avoid matching sub-strings of names
        pattern = r'\b' + re.escape(auth) + r'\b'
        for cand in candidates:
            if re.search(pattern, cand, re.IGNORECASE):
                return {
                    "grounded": True,
                    "condition_met": "named_authority",
                    "reason": f"Mentions reputable authority: '{auth}' in claim or adjacent context"
                }

    # CONDITION 3: Named study pattern
    for study in NAMED_STUDIES:
        pattern = r'\b' + re.escape(study) + r'\b'
        for cand in candidates:
            if re.search(pattern, cand, re.IGNORECASE):
                return {
                    "grounded": True,
                    "condition_met": "named_study",
                    "reason": f"Mentions source pattern: '{study}' in claim or adjacent context"
                }

    # CONDITION 4: Year citation pattern
    year_pattern_paren = re.compile(r'\(\s*(19\d{2}|20\d{2})\s*\)')
    year_pattern_in = re.compile(r'\bin\s*(19\d{2}|20\d{2})\b', re.IGNORECASE)
    
    for cand in candidates:
        m_paren = year_pattern_paren.search(cand)
        m_in = year_pattern_in.search(cand)
        if m_paren:
            return {
                "grounded": True,
                "condition_met": "year_citation",
                "reason": f"Contains citation year: ({m_paren.group(1)})"
            }
        if m_in:
            return {
                "grounded": True,
                "condition_met": "year_citation",
                "reason": f"Contains year reference: 'in {m_in.group(1)}'"
            }

    # If no grounding condition is satisfied
    return {
        "grounded": False,
        "condition_met": "none",
        "reason": "No nearby hyperlink, named authority, named study, or citation year found in the claim or adjacent sentences."
    }
