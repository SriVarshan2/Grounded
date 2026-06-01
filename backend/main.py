import nltk
import os

# Download nltk data on startup
nltk_data_dir = "/tmp/nltk_data"
os.makedirs(nltk_data_dir, exist_ok=True)
nltk.data.path.append(nltk_data_dir)
nltk.download('punkt', download_dir=nltk_data_dir, quiet=True)
nltk.download('punkt_tab', download_dir=nltk_data_dir, quiet=True)

from nltk.tokenize import sent_tokenize
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import time
import sys

# Ensure backend directory is in python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from extractor import fetch_article
from claims import extract_claims
from grounder import check_grounding
from scorer import compute_score
from evaluator import run_evaluation

app = FastAPI(title="Grounded API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    url: str


class AnalyzeTextRequest(BaseModel):
    text: str


class ArticleEvaluationItem(BaseModel):
    url: str
    sentences: list[str]
    links: list[dict]
    human_label: str


class EvaluateRequest(BaseModel):
    articles: list[ArticleEvaluationItem]


@app.get("/")
def root():
    return {"status": "ok", "app": "Grounded"}


@app.get("/health")
def health():
    return {"status": "ok", "model": "grounded-v1"}


@app.post("/analyze")
def analyze(request: AnalyzeRequest):
    url = request.url.strip()
    
    # Auto-add https:// if missing
    if not url.startswith("http://") and not url.startswith("https://"):
        url = "https://" + url
        
    start = time.time()

    # Step 1: Fetch article
    article = fetch_article(url)
    if not article or "error" in article:
        error_msg = article.get("error", "Unknown error") if article else "No response"
        raise HTTPException(
            status_code=400,
            detail=f"Fetch failed: {error_msg}"
        )

    # Step 2: Extract claims
    claims = extract_claims(article["sentences"])

    # Step 3: Check grounding for each claim
    results = []
    for i, claim in enumerate(claims):
        if claim["is_claim"]:
            grounding = check_grounding(
                claim["text"],
                i,
                article["sentences"],
                article["links"]
            )
        else:
            grounding = {
                "grounded": False,
                "condition_met": "none",
                "reason": "not a specific claim"
            }
        results.append({
            **claim,
            "grounded": grounding["grounded"],
            "condition_met": grounding["condition_met"],
            "grounding_reason": grounding.get("reason", ""),
        })

    # Step 4: Compute score
    score = compute_score(results)

    # Count words
    word_count = len(article.get("text", "").split())

    return {
        "url": url,
        **score,
        "claims": results,
        "processing_time_ms": int((time.time() - start) * 1000),
        "word_count": word_count,
        "sentence_count": len(article.get("sentences", [])),
        "full_text": article.get("text", ""),
        "link_grounding_unavailable": False
    }


@app.post("/analyze-text")
def analyze_text(request: AnalyzeTextRequest):
    start = time.time()
    
    raw_text = request.text.strip()
    word_count = len(raw_text.split())
    if word_count < 20:  # Allow relatively short text, but need a meaningful chunk
        raise HTTPException(
            status_code=400,
            detail="Article too short to analyze meaningfully. Need at least 20 words."
        )

    # Segment sentences using NLTK
    sentences = [
        s.strip()
        for s in sent_tokenize(raw_text[:50000])
        if len(s.strip()) > 20
    ]
    
    if not sentences:
        raise HTTPException(
            status_code=400,
            detail="No readable sentences found."
        )

    # Extract claims
    claims = extract_claims(sentences)

    # Check grounding (no links available)
    results = []
    for i, claim in enumerate(claims):
        if claim["is_claim"]:
            grounding = check_grounding(
                claim["text"],
                i,
                sentences,
                []  # no links
            )
        else:
            grounding = {
                "grounded": False,
                "condition_met": "none",
                "reason": "not a specific claim"
            }
        results.append({
            **claim,
            "grounded": grounding["grounded"],
            "condition_met": grounding["condition_met"],
            "grounding_reason": grounding.get("reason", ""),
        })

    score = compute_score(results)

    return {
        "url": "Direct Text Input",
        **score,
        "claims": results,
        "processing_time_ms": int((time.time() - start) * 1000),
        "word_count": word_count,
        "sentence_count": len(sentences),
        "full_text": raw_text,
        "link_grounding_unavailable": True
    }


@app.post("/evaluate")
def evaluate(request: EvaluateRequest):
    start = time.time()
    articles_data = [art.model_dump() for art in request.articles]
    try:
        metrics = run_evaluation(articles_data)
        metrics["processing_time_ms"] = int((time.time() - start) * 1000)
        return metrics
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Evaluation pipeline failed: {str(e)}"
        )
