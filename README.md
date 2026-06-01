# Grounded
> Specific claims. No sources. We count them.

## The Problem
Health articles publish specific-sounding claims every day with nothing behind them. Numbers without studies. Statistics without sources. Assertions without evidence. Nobody checks. Readers trust them.

## What Grounded Does
Grounded detects the gap between how specific an article sounds and how much evidence it actually provides. It finds every specific claim in a health article, checks each one for grounding, and computes a single metric: the Grounding Gap.

## The Signal: Grounding Gap
Grounding Gap = Ungrounded Claims / Total Specific Claims

A claim is SPECIFIC if it contains:
- A number or percentage
- A causal verb (reduces, prevents, causes, boosts)
- A claim trigger phrase (studies show, clinically proven)
- A comparative assertion (more effective than, up to X%)

A claim is GROUNDED if it has:
- A hyperlink in or adjacent to the sentence
- A named authority (WHO, CDC, NIH, NHS, Mayo Clinic)
- A named study pattern (published in, Journal of, et al)
- A year citation pattern like (2023)

Gap 0.0-0.3: Well grounded
Gap 0.3-0.6: Partially grounded  
Gap 0.6-0.8: Poorly grounded
Gap 0.8-1.0: Ungrounded

## Why This Is Not An LLM Wrapper
The entire detection pipeline uses:
- spaCy dependency parsing for claim detection
- HTML structure analysis for link extraction
- Pattern matching for authority and citation detection
- Deterministic arithmetic for gap computation

No OpenAI. No Anthropic. No Gemini. No model judgment.
Same article always returns the same score.

## Evaluation

```text
Confusion Matrix:
                 Predicted Slop    Predicted Quality
Actual Slop      5                 7
Actual Quality   0                 8

Metrics:
Precision:  1.00
Recall:     0.42  
F1 Score:   0.59
Accuracy:   0.65
```

Threshold: 0.60
Dataset: 20 health articles (10 quality, 10 slop)
Labeling: Manual human review

## Known Limitations
1. Opinion pieces — no citations expected, false positives
2. Citation laundering — copied citations not verified
3. Articles under 200 words — too few claims
4. Paywalled sources — cannot verify linked content

## How To Run
cd backend
pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn main:app --reload --port 8000

cd frontend
npm install
npm start

Open http://localhost:3000

## API
POST /analyze
{ "url": "https://..." }

Returns grounding_gap, verdict, and per-claim analysis.

## Built For
Slop Scan 2026
"Did a human check this before publishing?"
