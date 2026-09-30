import React, { useState } from "react";
import mockData from "./mockData.json";
import { fetchGitHubData } from "./api/github";
import { fetchCodeforcesData } from "./api/codeforces";
import { analyzeWithGemini } from "./api/gemini";
import { InputPanel } from "./components/InputPanel";
import { AnalysisDashboard } from "./components/AnalysisDashboard";
import { AppError } from "./errors";
import type { FormState, AnalysisResult } from "./types";

const IS_DEMO_MODE =
  !import.meta.env.VITE_GEMINI_API_KEY ||
  import.meta.env.VITE_GEMINI_API_KEY === "<your_gemini_api_key>";

const DEMO_STEPS = [
  "Fetching GitHub profile & repos...",
  "Scanning top repos for frameworks & activity...",
  "Fetching Codeforces data...",
  "Running Gemini AI analysis...",
];

function parseApiError(e: unknown): string {
  if (e instanceof AppError) {
    switch (e.code) {
      case "GITHUB_TOKEN_INVALID":
        return "GitHub token is invalid or revoked. Generate a new one at github.com/settings/tokens.";
      case "GITHUB_RATE_LIMIT":
        return "GitHub rate limit hit. Add a VITE_GITHUB_TOKEN in your .env — this raises the limit to 5,000 req/hr.";
      case "GITHUB_ABUSE_DETECTED":
        return "GitHub abuse rate limit triggered. The app now sends requests serially to prevent this. Wait 60 seconds and try again.";
      case "GITHUB_USER_NOT_FOUND":
        return e.message;
      case "GITHUB_API_ERROR":
        return e.message;
      case "CODEFORCES_USER_NOT_FOUND":
        return e.message;
      case "CODEFORCES_API_ERROR":
        return "Codeforces API is temporarily unavailable. Try again in a moment.";
      case "GEMINI_TOKEN_INVALID":
        return "Gemini API key is invalid or revoked. Generate a new key at aistudio.google.com.";
      case "GEMINI_QUOTA_EXCEEDED":
        return "Gemini API quota exhausted. The app tried all fallback models. Wait a few minutes and try again.";
      case "GEMINI_SERVICE_UNAVAILABLE":
        return "Gemini servers are temporarily overloaded (503). This is a Google issue — please wait 30 seconds and retry.";
      case "GEMINI_BAD_RESPONSE":
        return "Gemini returned an unexpected response. Please try again.";
      default:
        return e.message || "An unexpected error occurred.";
    }
  }
  // Fallback for non-AppError exceptions (e.g. JSON.parse failures)
  return (e as Error)?.message || "An unexpected error occurred.";
}

export default function App() {
  const [form, setForm] = useState<FormState>({ github: "", codeforces: "", jobDesc: "" });
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");

  const runDemo = async () => {
    setError("");
    setLoading(true);
    setResults(null);
    for (let i = 0; i < DEMO_STEPS.length; i++) {
      setStep(i);
      await new Promise(r => setTimeout(r, 700));
    }
    setResults(mockData as unknown as AnalysisResult);
    setLoading(false);
  };

  const handleAnalyze = async () => {
    setError("");
    setLoading(true);
    setResults(null);
    try {
      setStep(0);
      const githubData = await fetchGitHubData(form.github);

      setStep(1);
      const cfData = await fetchCodeforcesData(form.codeforces);

      setStep(2);
      const aiResult = await analyzeWithGemini({
        githubData,
        cfData,
        jobDescription: form.jobDesc,
      });

      setStep(3);
      setResults({ ...aiResult, github: githubData, codeforces: cfData });
    } catch (e) {
      setError(parseApiError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white font-sans">
      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-16">

        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-xs text-indigo-300 mb-6">
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
            AI-Powered Skill Verification
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Beyond Resume —<br />Hire by Proof, Not Claims
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Verify real skills using GitHub activity and Codeforces ratings. Get an AI-generated
            match score before the first interview.
          </p>

          {IS_DEMO_MODE && (
            <div className="mt-4 inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 text-xs text-amber-300">
              ⚡ Demo mode — add <code className="font-mono mx-1">VITE_GEMINI_API_KEY</code> to .env for live analysis
            </div>
          )}
        </div>

        {/* Input form */}
        <InputPanel
          form={form}
          onChange={setForm}
          onAnalyze={handleAnalyze}
          onDemo={runDemo}
          loading={loading}
          step={step}
          error={error}
          isDemoMode={IS_DEMO_MODE}
        />

        {/* Results */}
        {results && <AnalysisDashboard data={results} />}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
