# EightFold

AI-powered candidate screening tool that verifies real engineering skills using live GitHub and Codeforces data — before the first interview.

**Live demo:** [eight-fold.vercel.app](https://eight-fold.vercel.app)

---

## What It Does

EightFold fetches a candidate's public GitHub profile (repos, languages, detected frameworks, recent activity) and Codeforces competitive programming record (rating, solved problems, difficulty distribution, tag breakdown). It runs a **deterministic rating consistency algorithm** to signal whether public evidence supports their claimed rating, then passes the enriched profile to **Gemini AI** for structured per-requirement alignment scoring against a provided job description.

The output is:
- An overall **match score** (0–100) with a hiring recommendation
- Per-requirement **alignment scores** with one-line evidence strings — sourced from public repos, not inferred
- Five candidate **dimension scores** (GitHub Activity, DSA Strength, Stack Fit, Project Depth, Experience Proxy)
- A **Codeforces consistency signal** with named, explainable thresholds
- A **ramp-up estimate** and AI synthesis paragraph

---

## Architecture

```
React Frontend (Vite + Tailwind CSS v4)
──────────────────────────────────────────────────────────────────
GitHub REST API  ─┐
                  ├──► src/api/gemini.ts  ──► AnalysisDashboard
Codeforces API  ──┘
```

**Data flow:**
1. User enters GitHub username + Codeforces handle + job description
2. `fetchGitHubData()` — fetches user info, repos, public events, and runs tech-stack detection by scanning dependency files (serialized to comply with GitHub's abuse rate limit policy)
3. `fetchCodeforcesData()` — fetches user info, up to 500 submissions, and rating history
4. `computeRatingConsistency()` — deterministic heuristic comparing rating vs. average problem difficulty, recent spike detection, and contest count
5. `analyzeWithGemini()` — sends enriched profile + JD to Gemini; retries transient `5xx` errors with exponential backoff, then cascades through model fallbacks
6. Structured JSON validated at runtime and rendered in `AnalysisDashboard`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS v4 |
| AI | Gemini AI — `gemini-3.8-flash` → `gemini-3.5-flash` → `gemini-2.5-flash` fallback chain |
| APIs | GitHub REST API · Codeforces API |
| Error Handling | Typed `AppError` class with explicit error codes — no string matching in the UI |
| Testing | Vitest — 13 tests across 2 suites |
| Deployment | Vercel |

---

## Setup

```bash
# 1. Clone and install
git clone https://github.com/Sandesh282/EightFold.git
cd EightFold
npm install

# 2. Create environment file
cp .env.example .env
# Fill in your API keys (see Environment Variables below)

# 3. Run dev server
npm run dev
```

---

## Environment Variables

Create a `.env` file in the project root:

| Variable | Required | Description |
|---|---|---|
| `VITE_GEMINI_API_KEY` | ✅ Yes | Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `VITE_GITHUB_TOKEN` | Recommended | GitHub Personal Access Token — raises rate limit from 60 to 5,000 req/hr. Only needs `public_repo` read scope. |

> **Without `VITE_GEMINI_API_KEY`**: The app runs in **Demo mode** — it loads sample data so you can explore the full UI without any API calls. Click **Load Demo**.

> **Security note:** Because this is a purely client-side app, `VITE_*` variables are embedded in the browser bundle and are technically visible in DevTools. Mitigate by scoping the GitHub token to read-only `public_repo` and setting a monthly spend cap on your Gemini API key in Google Cloud Console.

---

## Running Tests

```bash
npm test              # run once (13 tests across 2 suites)
npm run test:watch    # watch mode
```

**Test coverage:**
- `tests/codeforces.test.ts` — 7 unit tests for the rating consistency algorithm (all thresholds and edge cases)
- `tests/gemini.test.ts` — 6 unit tests for the Gemini prompt builder

---

## Deployment

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Set environment variables in the Vercel dashboard:
   - `VITE_GEMINI_API_KEY`
   - `VITE_GITHUB_TOKEN`
4. Deploy — `npm run build` runs automatically

> Updating env vars in Vercel does **not** trigger an automatic redeploy. Push an empty commit (`git commit --allow-empty`) to force a fresh build that picks up the new values.

---

## Rating Consistency Algorithm

`computeRatingConsistency()` in `src/api/genuineness.ts` produces a consistency signal — **not** a cheating accusation. It compares public evidence (problems solved, difficulty distribution, contest history) against the claimed CF rating.

| Signal | Condition | Meaning |
|---|---|---|
| `Expert-level rating` | Rating ≥ 2,500 | Bypasses all heuristics |
| `Inconsistent` | Gap > 500 OR spike > 300 in last 5 OR (< 10 contests AND rating > 1,600) | Rating significantly exceeds observed difficulty evidence |
| `Low evidence` | Gap 301–500 | Moderate gap; insufficient data to be confident |
| `Consistent` | \|Gap\| < 250 | Rating closely matches average difficulty solved |
| `Likely consistent` | Otherwise | Minor mismatch, within acceptable range |
| `N/A` | Rating = 0 | No data available |

All thresholds are named constants in `genuineness.ts` and documented inline.

---

## Project Structure

```
EightFold/
├── src/
│   ├── App.tsx                      ← Orchestration; error handling via AppError
│   ├── errors.ts                    ← Typed AppError class + AppErrorCode union
│   ├── types.ts                     ← All TypeScript interfaces
│   ├── api/
│   │   ├── github.ts                ← GitHub REST API; serialized dep fetching
│   │   ├── codeforces.ts            ← CF API + consistency check
│   │   ├── genuineness.ts           ← Pure consistency function (tested)
│   │   ├── gemini.ts                ← Gemini SDK; retry backoff + model fallback
│   │   └── prompt.ts                ← Pure prompt builder (tested)
│   ├── components/
│   │   ├── InputPanel.tsx           ← Form, loading steps, error display
│   │   ├── AnalysisDashboard.tsx    ← Results container
│   │   ├── HiringCard.tsx           ← Score, label, recommendation
│   │   ├── SkillsTable.tsx          ← Per-requirement alignment scores
│   │   ├── DimensionChart.tsx       ← 5-dimension radar + bars
│   │   └── ui.tsx                   ← Shared icons + chart primitives
│   └── mockData.json                ← Demo mode sample data
├── tests/
│   ├── codeforces.test.ts           ← Vitest: consistency algorithm (7 tests)
│   └── gemini.test.ts               ← Vitest: prompt builder (6 tests)
├── vercel.json                      ← Locks deployment to Vite frontend only
└── .env.example
```
