# EightFold

AI-powered candidate screening tool that verifies real engineering skills using live GitHub and Codeforces data — before the first interview.

## What it does

EightFold fetches a candidate's public GitHub profile (repos, languages, detected frameworks, recent activity) and Codeforces competitive programming record (rating, solved problems, difficulty distribution, tag breakdown) in parallel. It runs a **rating genuineness detection algorithm** to flag suspicious rating inflation patterns, then passes the enriched profile to **Gemini AI** for structured per-skill fit scoring against a provided job description. The result is an overall match score (0–100), a hiring recommendation, per-skill cosine similarity scores with evidence strings, and five candidate dimension scores.

A separate **Python FastAPI backend** accepts a resume PDF/DOCX upload alongside the GitHub and Codeforces data, performs additional resume text extraction, and powers a **Streamlit analytics dashboard** with Plotly visualisations for hiring decision support.

## Architecture

```
                                          ┌─────────────────────────────────┐
React Frontend (Vite + Tailwind)          │   Python Backend (separate)      │
─────────────────────────────────         │─────────────────────────────────│
GitHub API  ──┐                           │ Resume PDF/DOCX                  │
              ├──► Gemini AI             │   └─► PyMuPDF / python-docx      │
Codeforces ──┘     └─► Analysis UI       │         └─► Gemini AI            │
                                          │               └─► Streamlit      │
                                          │                   Dashboard      │
                                          └─────────────────────────────────┘

Data flow (frontend):
  1. User enters GitHub username + Codeforces handle + job description
  2. fetchGitHubData()   → parallel: user info, repos, events, top-repo deps & language bytes
  3. fetchCodeforcesData() → user.info + user.status (500 subs) + ratingChanges in parallel
  4. computeRatingConsistency() → heuristic check (spike detection, low-contest-high-rating, avg difficulty gap)
  5. analyzeWithGemini() → Gemini 2.5-flash (fallback → 2.0-flash-lite → 2.0-flash-001)
  6. Structured JSON rendered in AnalysisDashboard

Data flow (backend):
  1. POST /analyze with resume file + GitHub/CF JSON + JD
  2. FastAPI extracts resume text via PyMuPDF (PDF) or python-docx (DOCX)
  3. call_gemini() with model fallback → structured JSON
  4. Streamlit dashboard calls this endpoint and renders Plotly charts
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS v4 |
| AI | Gemini AI — `gemini-2.5-flash` with model fallback |
| APIs | GitHub REST API · Codeforces API |
| Backend | Python FastAPI + PyMuPDF + python-docx |
| Dashboard | Streamlit + Plotly |
| Testing | Vitest (frontend) · pytest + httpx (backend) |
| Deployment | Vercel (frontend) · Render (backend) |

## Setup

### Frontend

```bash
# 1. Clone and install
git clone https://github.com/YOUR_USERNAME/EightFold.git
cd EightFold
npm install

# 2. Create environment file
cp .env.example .env
# Then fill in your API keys in .env

# 3. Run dev server
npm run dev
```

### Backend

```bash
cd backend

# 1. Create a virtual environment
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Create environment file
cp .env.example .env
# Fill in GEMINI_API_KEY

# 4. Start the FastAPI server
uvicorn main:app --reload --port 8000

# 5. (Optional) Run the Streamlit dashboard
streamlit run dashboard.py
```

## Environment Variables

### Frontend (`.env` in project root)

| Variable | Required | Description |
|---|---|---|
| `VITE_GEMINI_API_KEY` | ✅ Yes | Gemini API key from [Google AI Studio](https://aistudio.google.com/) |
| `VITE_GITHUB_TOKEN` | Recommended | GitHub Personal Access Token — raises rate limit from 60 to 5,000 req/hr |

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | Same Gemini API key |

> **Without `VITE_GEMINI_API_KEY`**: The frontend runs in **Demo mode** — it loads sample mock data so you can see the full UI without any API calls. Click the **Demo** button.

## Running Tests

### Frontend (Vitest)

```bash
npm test              # run once
npm run test:watch    # watch mode
```

Tests cover:
- `tests/codeforces.test.ts` — 7 unit tests for the rating genuineness algorithm
- `tests/gemini.test.ts` — 6 unit tests for the Gemini prompt builder

### Backend (pytest)

```bash
cd backend
pip install pytest httpx
pytest ../tests/api/analyze_test.py -v
```

Tests cover:
- POST `/analyze` with text fixture returns HTTP 200
- Response JSON contains `score`, `label`, `skills`
- Endpoint works with no resume file

## Deployment

### Frontend → Vercel

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Set environment variables in Vercel dashboard:
   - `VITE_GEMINI_API_KEY`
   - `VITE_GITHUB_TOKEN`
4. Deploy — `npm run build` is run automatically

### Backend → Render

1. Create a new **Web Service** in [Render](https://render.com)
2. Connect your GitHub repo, set root to `backend/`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variable: `GEMINI_API_KEY`

## Genuineness Detection Algorithm

The `computeRatingConsistency()` function in `src/api/genuineness.ts` detects suspicious Codeforces rating patterns:

| Signal | Threshold | Flag |
|---|---|---|
| Rating ≥ 2500 | — | Expert level (bypass) |
| rating − avgDifficulty | > 500 | Suspicious |
| Recent rating spike | > 300 in last 5 contests | Suspicious |
| Low contest count + high rating | < 10 contests AND rating > 1600 | Suspicious |
| rating − avgDifficulty | 301–500 | Questionable |
| \|rating − avgDifficulty\| | < 250 | Genuine |
| Otherwise | — | Likely genuine |

## Project Structure

```
EightFold/
├── src/
│   ├── App.tsx                      ← Orchestration layer
│   ├── types.ts                     ← All TypeScript interfaces
│   ├── api/
│   │   ├── github.ts                ← GitHub REST API + parallel fetches
│   │   ├── codeforces.ts            ← CF API + genuineness detection
│   │   ├── genuineness.ts           ← Pure genuineness function (testable)
│   │   ├── gemini.ts                ← Gemini SDK + model fallback
│   │   └── prompt.ts                ← Pure prompt builder (testable)
│   ├── components/
│   │   ├── InputPanel.tsx           ← Form, loading steps, error display
│   │   ├── AnalysisDashboard.tsx    ← Results container
│   │   ├── HiringCard.tsx           ← Score, label, recommendation
│   │   ├── SkillsTable.tsx          ← Per-skill similarity scores
│   │   ├── DimensionChart.tsx       ← 5-dimension radar + bars
│   │   └── ui.tsx                   ← Shared icons + chart primitives
│   └── mockData.json                ← Demo mode sample data
├── backend/
│   ├── main.py                      ← FastAPI /analyze endpoint
│   ├── dashboard.py                 ← Streamlit analytics UI
│   └── requirements.txt
├── tests/
│   ├── codeforces.test.ts           ← Vitest: genuineness algorithm
│   ├── gemini.test.ts               ← Vitest: prompt builder
│   └── api/
│       └── analyze_test.py          ← pytest: FastAPI endpoint
└── .env.example
```
