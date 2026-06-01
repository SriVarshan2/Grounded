from claims import extract_claims
from grounder import check_grounding
from scorer import compute_score

def run_evaluation(articles: list[dict]) -> dict:
    """
    Executes the claims evaluation pipeline against pre-labeled validation articles.
    Classifies articles as 'slop' (grounding gap >= 0.6) or 'quality' (< 0.6)
    and computes confusion matrix statistics.
    
    Args:
        articles (list[dict]): A list of article objects, each having:
            - "url": str
            - "sentences": list[str]
            - "links": list[dict]
            - "human_label": "slop" | "quality"
            
    Returns:
        dict: Performance metrics including TP, TN, FP, FN, precision, recall, F1, and accuracy.
    """
    tp = 0  # True Positives: Human = slop, Predicted = slop
    fp = 0  # False Positives: Human = quality, Predicted = slop
    tn = 0  # True Negatives: Human = quality, Predicted = quality
    fn = 0  # False Negatives: Human = slop, Predicted = quality
    
    threshold = 0.6
    
    for article in articles:
        sentences = article.get("sentences", [])
        links = article.get("links", [])
        human_label = article.get("human_label", "quality")
        
        # 1. Run claims extraction
        claims = extract_claims(sentences)
        
        # 2. Check grounding for each claim
        for idx, claim in enumerate(claims):
            if claim["is_claim"]:
                grounding_res = check_grounding(claim["text"], idx, sentences, links)
                claim["grounded"] = grounding_res["grounded"]
            else:
                claim["grounded"] = False
                
        # 3. Compute score
        score_res = compute_score(claims)
        gap = score_res["grounding_gap"]
        
        # 4. Predict based on threshold of 0.6
        predicted_label = "slop" if gap >= threshold else "quality"
        
        # 5. Tabulate confusion matrix counts
        if human_label == "slop":
            if predicted_label == "slop":
                tp += 1
            else:
                fn += 1
        elif human_label == "quality":
            if predicted_label == "slop":
                fp += 1
            else:
                tn += 1
                
    total_articles = len(articles)
    
    # Calculate rates safely to prevent DivisionByZero
    accuracy = round((tp + tn) / total_articles, 4) if total_articles > 0 else 0.0
    precision = round(tp / (tp + fp), 4) if (tp + fp) > 0 else 0.0
    recall = round(tp / (tp + fn), 4) if (tp + fn) > 0 else 0.0
    f1 = round(2 * (precision * recall) / (precision + recall), 4) if (precision + recall) > 0 else 0.0
    
    return {
        "threshold": threshold,
        "total_articles": total_articles,
        "true_positives": tp,
        "true_negatives": tn,
        "false_positives": fp,
        "false_negatives": fn,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "accuracy": accuracy,
        "confusion_matrix": [
            [tp, fp],
            [fn, tn]
        ]
    }
