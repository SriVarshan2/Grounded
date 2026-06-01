def compute_score(claims_with_grounding: list[dict]) -> dict:
    """
    Aggregates claim detection results, calculates Grounding Gap metric,
    assigns quality verdicts, and evaluates overall reliability based on volume.
    
    Args:
        claims_with_grounding (list[dict]): List of claim-evaluated sentence dicts.
        
    Returns:
        dict: A dictionary containing:
            - "grounding_gap": float
            - "total_claims": int
            - "grounded_count": int
            - "ungrounded_count": int
            - "verdict": str
            - "reliability": "high|medium|low"
            - "reliability_note": str
    """
    # Filter for claims only
    specific_claims = [c for c in claims_with_grounding if c.get("is_claim", False)]
    total_claims = len(specific_claims)
    
    if total_claims == 0:
        return {
            "grounding_gap": 0.0,
            "total_claims": 0,
            "grounded_count": 0,
            "ungrounded_count": 0,
            "verdict": "No specific claims detected in the article.",
            "reliability": "low",
            "reliability_note": "No specific health or scientific claims were found in the text to evaluate."
        }
        
    grounded_count = sum(1 for c in specific_claims if c.get("grounded", False))
    ungrounded_count = total_claims - grounded_count
    
    # Grounding Gap = ungrounded / total specific claims
    grounding_gap = round(ungrounded_count / total_claims, 2)
    
    # Verdict logic based on score ranges
    if grounding_gap < 0.30:
        verdict = "Well grounded. Most claims have sources."
    elif grounding_gap < 0.60:
        verdict = "Partially grounded. Several claims lack sources."
    elif grounding_gap < 0.80:
        verdict = "Poorly grounded. Most claims have nothing behind them."
    else:
        verdict = "Ungrounded. Sounds specific. Cites almost nothing."
        
    # Reliability logic based on claim density/volume
    if total_claims >= 8:
        reliability = "high"
        reliability_note = "High claim density provides a robust indicator of grounding quality."
    elif 4 <= total_claims <= 7:
        reliability = "medium"
        reliability_note = "Moderate claim density; sufficient for assessment but check individual claims."
    else:
        reliability = "low"
        reliability_note = "Too few claims to be conclusive; results might not reflect overall quality."
        
    return {
        "grounding_gap": grounding_gap,
        "total_claims": total_claims,
        "grounded_count": grounded_count,
        "ungrounded_count": ungrounded_count,
        "verdict": verdict,
        "reliability": reliability,
        "reliability_note": reliability_note
    }
