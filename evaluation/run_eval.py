import json
import urllib.request
import urllib.error
import os

def main():
    # Resolve relative paths
    base_dir = os.path.dirname(os.path.abspath(__file__))
    eval_set_path = os.path.join(base_dir, "../data/eval_set.json")
    results_path = os.path.join(base_dir, "results.json")
    
    if not os.path.exists(eval_set_path):
        print(f"[-] Error: Evaluation dataset not found at {eval_set_path}")
        return
        
    # Read eval articles dataset
    try:
        with open(eval_set_path, "r") as f:
            articles = json.load(f)
    except Exception as e:
        print(f"[-] Error reading {eval_set_path}: {e}")
        return
        
    # Build payload
    payload = {"articles": articles}
    data = json.dumps(payload).encode("utf-8")
    
    # Target /evaluate endpoint
    url = "http://localhost:8000/evaluate"
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    
    print("[*] Contacting FastAPI backend /evaluate endpoint to benchmark grounding...")
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            res_body = response.read().decode("utf-8")
            response_data = json.loads(res_body)
            
        # Display clean stdout evaluation report
        print("\n=======================================================")
        print("           GROUNDED EVALUATION BENCHMARK               ")
        print("=======================================================")
        print(f" Total Articles Evaluated : {response_data['total_articles']}")
        print(f" Decision Threshold       : {response_data['threshold']} (Gap >= 0.6 = Slop)")
        print(f" Accuracy                 : {response_data['accuracy']:.2%}")
        print(f" Precision                : {response_data['precision']:.2%}")
        print(f" Recall                   : {response_data['recall']:.2%}")
        print(f" F1-Score                 : {response_data['f1']:.2%}")
        print(f" Pipeline latency         : {response_data.get('processing_time_ms', 0)} ms")
        print("-------------------------------------------------------")
        print(" Confusion Matrix Details:")
        cm = response_data['confusion_matrix']
        # Confusion matrix is [[TP, FP], [FN, TN]]
        print(f"   - True Positives (Slop correctly flagged) : {cm[0][0]}")
        print(f"   - False Positives (Quality flagged as Slop) : {cm[0][1]}")
        print(f"   - False Negatives (Slop missed as Quality) : {cm[1][0]}")
        print(f"   - True Negatives (Quality correctly flagged) : {cm[1][1]}")
        print("=======================================================")
        
        # Write results object to file
        os.makedirs(base_dir, exist_ok=True)
        with open(results_path, "w") as f:
            json.dump(response_data, f, indent=2)
        print(f"[+] Evaluation results saved to: {results_path}\n")
        
    except urllib.error.URLError as e:
        print(f"\n[-] Connection Error: Could not connect to API server at {url}")
        print("    Ensure the FastAPI backend is running before triggering the benchmark.")
        print("    Start Command: cd backend && uvicorn main:app --reload")
        print(f"    Technical details: {e}\n")
    except Exception as e:
        print(f"\n[-] Unexpected error during evaluation execution: {e}\n")

if __name__ == "__main__":
    main()
