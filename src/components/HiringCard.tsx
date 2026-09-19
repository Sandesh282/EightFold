import React from "react";
import type { GeminiAnalysis } from "../types";
import { ScoreRing } from "./ui";

interface HiringCardProps {
  score: GeminiAnalysis["score"];
  label: GeminiAnalysis["label"];
  hiringRecommendation: GeminiAnalysis["hiringRecommendation"];
  strengths: GeminiAnalysis["strengths"];
  weaknesses: GeminiAnalysis["weaknesses"];
  redFlags: GeminiAnalysis["redFlags"];
}

const recommendationStyle: Record<string, string> = {
  "Strong Hire": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  Hire: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  Maybe: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  "No Hire": "bg-red-500/20 text-red-300 border-red-500/30",
};

export function HiringCard({
  score,
  label,
  hiringRecommendation,
  strengths,
  weaknesses,
  redFlags,
}: HiringCardProps) {
  return (
    <div className="backdrop-blur-xl bg-gradient-to-br from-indigo-600/20 to-cyan-600/20 border border-indigo-500/20 rounded-2xl p-8 shadow-xl">
      {/* Score ring + label */}
      <div className="text-center mb-6">
        <ScoreRing score={score} />
        <h2 className="text-2xl font-bold mt-4 text-white">{label}</h2>
        <p className="text-slate-400 text-sm mt-1">Overall candidate match score</p>
      </div>

      {/* Hiring recommendation */}
      <div className="flex justify-center mb-6">
        <span
          className={`border px-4 py-1.5 rounded-full text-sm font-semibold ${
            recommendationStyle[hiringRecommendation] ?? "bg-slate-500/20 text-slate-300 border-slate-500/30"
          }`}
        >
          {hiringRecommendation}
        </span>
      </div>

      {/* Strengths & weaknesses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {strengths?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Strengths</p>
            <ul className="space-y-1">
              {strengths.map(s => (
                <li key={s} className="text-slate-300 text-sm flex items-start gap-1.5">
                  <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>{s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {weaknesses?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">Gaps</p>
            <ul className="space-y-1">
              {weaknesses.map(w => (
                <li key={w} className="text-slate-300 text-sm flex items-start gap-1.5">
                  <span className="text-amber-400 mt-0.5 shrink-0">△</span>{w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Red flags */}
      {redFlags?.filter(Boolean).length > 0 && (
        <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
          <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1">⚠ Red Flags</p>
          {redFlags.filter(Boolean).map(f => (
            <p key={f} className="text-red-300 text-sm">{f}</p>
          ))}
        </div>
      )}
    </div>
  );
}
