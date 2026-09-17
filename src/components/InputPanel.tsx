import React from "react";
import type { FormState } from "../types";
import { GithubIcon, CodeIcon } from "./ui";

const STEPS = [
  "Fetching GitHub profile & repos...",
  "Scanning top repos for frameworks & activity...",
  "Fetching Codeforces data...",
  "Running Gemini AI analysis...",
];

interface InputPanelProps {
  form: FormState;
  onChange: (form: FormState) => void;
  onAnalyze: () => void;
  onDemo: () => void;
  loading: boolean;
  step: number;
  error: string;
  isDemoMode: boolean;
}

export function InputPanel({
  form,
  onChange,
  onAnalyze,
  onDemo,
  loading,
  step,
  error,
  isDemoMode,
}: InputPanelProps) {
  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl mb-10">
      <div className="space-y-5">
        {/* GitHub */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">GitHub Username</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <GithubIcon />
            </span>
            <input
              id="github-username"
              type="text"
              placeholder="e.g. torvalds"
              value={form.github}
              onChange={e => onChange({ ...form, github: e.target.value })}
              disabled={loading}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 transition-all disabled:opacity-50"
            />
          </div>
        </div>

        {/* Codeforces */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Codeforces Handle</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <CodeIcon />
            </span>
            <input
              id="cf-handle"
              type="text"
              placeholder="e.g. tourist"
              value={form.codeforces}
              onChange={e => onChange({ ...form, codeforces: e.target.value })}
              disabled={loading}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 transition-all disabled:opacity-50"
            />
          </div>
        </div>

        {/* Job Description */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Job Description</label>
          <textarea
            id="job-description"
            rows={4}
            placeholder="Paste the job description here..."
            value={form.jobDesc}
            onChange={e => onChange({ ...form, jobDesc: e.target.value })}
            disabled={loading}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 transition-all resize-none disabled:opacity-50"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-300">
            ⚠ {error}
          </div>
        )}

        {/* Loading steps */}
        {loading && (
          <div className="space-y-2">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`flex items-center gap-2 text-xs transition-all ${
                  i < step ? "text-emerald-400" : i === step ? "text-indigo-300" : "text-slate-600"
                }`}
              >
                {i < step ? (
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : i === step ? (
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <span className="w-3.5 h-3.5 inline-block" />
                )}
                {s}
              </div>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            id="analyze-btn"
            onClick={onAnalyze}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98]"
          >
            {loading ? "Analyzing..." : "Analyze Candidate"}
          </button>

          {isDemoMode && (
            <button
              id="demo-btn"
              onClick={onDemo}
              disabled={loading}
              className="px-5 bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-60 text-slate-300 font-medium rounded-xl transition-all duration-200 text-sm"
            >
              Demo
            </button>
          )}
        </div>

        {isDemoMode && (
          <p className="text-xs text-center text-slate-600">
            Demo loads mock data without API calls · Add <code className="text-indigo-400">VITE_GEMINI_API_KEY</code> for live analysis
          </p>
        )}
      </div>
    </div>
  );
}
