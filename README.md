# Grounded

## Overview
Grounded is a claim‑verification web app that fetches an article, extracts specific claims, checks grounding against sources, and returns a detailed score. It consists of:
- **Backend** – FastAPI server (`uvicorn backend.main:app`) hosted at **https://grounded-api-nyy1.onrender.com**.
- **Frontend** – React UI (`npm start`) hosted at **https://grounded-f8gv.vercel.app**.

## Deployment Links
- Frontend: https://grounded-f8gv.vercel.app
- Backend: https://grounded-api-nyy1.onrender.com

## Quick Start (Local Development)
1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd grounded
   ```
2. **Backend**
   ```bash
   # install dependencies
   pip install -r backend/requirements.txt
   # run the API
   uvicorn backend.main:app --host 0.0.0.0 --port 8000
   ```
   The API will be reachable at `http://localhost:8000`.
3. **Frontend**
   ```bash
   cd frontend
   npm install
   # The proxy is removed – the app uses REACT_APP_API_URL env var.
   REACT_APP_API_URL=http://localhost:8000 npm start
   ```
   Open `http://localhost:3000` (or the next free port) in a browser.

## Environment Configuration
- **`.env.production`** (already present) sets `REACT_APP_API_URL=https://grounded-api-nyy1.onrender.com` for production.
- The frontend also falls back to `http://localhost:8000` when the env variable is missing, allowing seamless local testing.

## Implementation Plan
1. **Backend** – ensure all required packages (`fastapi`, `uvicorn`, `requests`, `beautifulsoup4`, `lxml`, `python-dotenv`, `pydantic`, `nltk`) are installed. The `nltk` data is downloaded on startup.
2. **Frontend** – replace all hard‑coded `localhost:8000` strings with `process.env.REACT_APP_API_URL || "http://localhost:8000"` (already applied).
3. **Vercel Config** – `vercel.json` now contains an `env` block exposing the API URL and the required rewrite.
4. **Testing** – Run both services, paste an article URL in the UI and click **Analyze**. Results should appear without hanging.
5. **Deployment** – Deploy the frontend to Vercel (already live) and the backend to Render (already live). No further changes are required.

## Usage
1. Visit the frontend URL.
2. Enter an article URL or paste raw text.
3. Click **Analyze** – the app calls the backend, processes claims, and displays a score card and detailed claim list.

## Contributing
Feel free to open issues or submit pull requests. Follow the standard Git workflow:
```bash
git checkout -b feature/your-feature
# make changes
git commit -m "feat: description"
git push origin feature/your-feature
```
