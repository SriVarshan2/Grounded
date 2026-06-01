import requests
import json
import time
import os

API_URL = "http://localhost:8000/analyze"

ARTICLES = [
    # QUALITY articles — expected low gap
    {
        "url": "https://medlineplus.gov/healthysleep.html",
        "human_label": "quality",
        "source": "MedlinePlus (Government)"
    },
    {
        "url": "https://medlineplus.gov/caffeine.html",
        "human_label": "quality",
        "source": "MedlinePlus (Government)"
    },
    {
        "url": "https://medlineplus.gov/vitamind.html",
        "human_label": "quality",
        "source": "MedlinePlus (Government)"
    },
    {
        "url": "https://medlineplus.gov/dietarysupplements.html",
        "human_label": "quality",
        "source": "MedlinePlus (Government)"
    },
    {
        "url": "https://www.nhlbi.nih.gov/health/sleep-deprivation",
        "human_label": "quality",
        "source": "NIH (Government)"
    },
    {
        "url": "https://www.cdc.gov/healthyweight/healthy_eating/index.html",
        "human_label": "quality",
        "source": "CDC (Government)"
    },
    {
        "url": "https://www.nhs.uk/live-well/eat-well/food-types/fish-and-shellfish-nutrition/",
        "human_label": "quality",
        "source": "NHS (Government)"
    },
    {
        "url": "https://www.mayoclinic.org/healthy-lifestyle/nutrition-and-healthy-eating/in-depth/caffeine/art-20045678",
        "human_label": "quality",
        "source": "Mayo Clinic"
    },
    {
        "url": "https://medlineplus.gov/omega3fattyacids.html",
        "human_label": "quality",
        "source": "MedlinePlus (Government)"
    },
    {
        "url": "https://www.nhs.uk/live-well/eat-well/food-types/milk-and-dairy-nutrition/",
        "human_label": "quality",
        "source": "NHS (Government)"
    },

    # SLOP articles — expected high gap
    {
        "url": "https://www.healthline.com/nutrition/10-proven-benefits-of-blueberries",
        "human_label": "slop",
        "source": "Healthline"
    },
    {
        "url": "https://www.healthline.com/nutrition/vitamin-d-deficiency-symptoms",
        "human_label": "slop",
        "source": "Healthline"
    },
    {
        "url": "https://www.healthline.com/nutrition/magnesium-benefits",
        "human_label": "slop",
        "source": "Healthline"
    },
    {
        "url": "https://www.healthline.com/nutrition/coffee-good-or-bad",
        "human_label": "slop",
        "source": "Healthline"
    },
    {
        "url": "https://www.healthline.com/nutrition/10-benefits-of-exercise",
        "human_label": "slop",
        "source": "Healthline"
    },
    {
        "url": "https://www.webmd.com/diet/health-benefits-of-turmeric",
        "human_label": "slop",
        "source": "WebMD"
    },
    {
        "url": "https://www.webmd.com/diet/health-benefits-of-magnesium",
        "human_label": "slop",
        "source": "WebMD"
    },
    {
        "url": "https://www.webmd.com/vitamins-and-supplements/health-benefits-vitamin-c",
        "human_label": "slop",
        "source": "WebMD"
    },
    {
        "url": "https://www.webmd.com/diet/health-benefits-of-zinc",
        "human_label": "slop",
        "source": "WebMD"
    },
    {
        "url": "https://www.healthline.com/nutrition/melatonin",
        "human_label": "slop",
        "source": "Healthline"
    }
]

THRESHOLD = 0.6


def run_evaluation():
    results = []
    tp = tn = fp = fn = 0
    failed = 0

    print("=== GROUNDED EVALUATION ===\n")
    print(f"Running on {len(ARTICLES)} articles...\n")

    for article in ARTICLES:
        try:
            response = requests.post(
                API_URL,
                json={"url": article["url"]},
                timeout=30
            )
            data = response.json()

            if "grounding_gap" not in data:
                print(f"SKIP {article['url']} — fetch failed")
                failed += 1
                continue

            gap = data["grounding_gap"]
            predicted = "slop" if gap >= THRESHOLD else "quality"
            actual = article["human_label"]
            correct = predicted == actual

            if actual == "slop" and predicted == "slop":
                tp += 1
            elif actual == "quality" and predicted == "quality":
                tn += 1
            elif actual == "quality" and predicted == "slop":
                fp += 1
            elif actual == "slop" and predicted == "quality":
                fn += 1

            status = "CORRECT" if correct else "WRONG"
            print(f"[{status}] {article['source']}")
            print(f"  Gap: {gap} | Predicted: {predicted} | Actual: {actual}")
            print(f"  Claims: {data['total_claims']} total, {data['ungrounded_count']} ungrounded\n")

            results.append({
                "url": article["url"],
                "source": article["source"],
                "grounding_gap": gap,
                "predicted": predicted,
                "actual": actual,
                "correct": correct,
                "total_claims": data["total_claims"]
            })

            time.sleep(1)

        except Exception as e:
            print(f"ERROR {article['url']}: {e}")
            failed += 1

    total = tp + tn + fp + fn
    if total == 0:
        print("No results. Check backend is running.")
        return

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = (2 * precision * recall / (precision + recall)
          if (precision + recall) > 0 else 0)
    accuracy = (tp + tn) / total

    print("\n" + "="*50)
    print("CONFUSION MATRIX")
    print("="*50)
    print(f"                Predicted SLOP  Predicted QUALITY")
    print(f"Actual SLOP     {tp:<16} {fn}")
    print(f"Actual QUALITY  {fp:<16} {tn}")
    print("\nMETRICS")
    print("="*50)
    print(f"Precision:  {precision:.2f}")
    print(f"Recall:     {recall:.2f}")
    print(f"F1 Score:   {f1:.2f}")
    print(f"Accuracy:   {accuracy:.2f}")
    print(f"\nThreshold:  {THRESHOLD}")
    print(f"Evaluated:  {total} articles")
    print(f"Failed:     {failed} articles (fetch errors)")

    # Ensure evaluation directory exists
    os.makedirs("evaluation", exist_ok=True)
    with open("evaluation/results.json", "w") as f:
        json.dump({
            "threshold": THRESHOLD,
            "total_articles": total,
            "failed_fetches": failed,
            "true_positives": tp,
            "true_negatives": tn,
            "false_positives": fp,
            "false_negatives": fn,
            "precision": round(precision, 2),
            "recall": round(recall, 2),
            "f1": round(f1, 2),
            "accuracy": round(accuracy, 2),
            "per_article": results
        }, f, indent=2)

    print("\nResults saved to evaluation/results.json")

if __name__ == "__main__":
    run_evaluation()
