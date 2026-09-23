import React from "react";
import type { AnalysisResult } from "../types";
import { HiringCard } from "./HiringCard";
import { SkillsTable } from "./SkillsTable";
import { DimensionChart } from "./DimensionChart";
import { DonutChart, BarChart, GithubIcon, CodeIcon } from "./ui";

interface AnalysisDashboardProps {
  data: AnalysisResult;
}

const LANG_COLORS = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ec4899"];
const DIFF_COLORS = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#f97316", "#ef4444", "#ec4899"];

const consistencyBadgeClass: Record<string, string> = {
  Genuine: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  "Expert level": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  "Likely genuine": "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  Questionable: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Suspicious: "bg-red-500/20 text-red-300 border-red-500/30",
};

export function AnalysisDashboard({ data }: AnalysisDashboardProps) {
  const { github, codeforces, skillSimilarity, dimensions, learningPrediction, aiInsight } = data;

  const langSegments = (github.languageData || []).map((l, i) => ({
    label: l.lang,
    value: l.count,
    color: LANG_COLORS[i % LANG_COLORS.length],
  }));

  return (
    <div className="space-y-5" style={{ animation: "fadeIn 0.4s ease-out" }}>

      {/* Hiring summary card */}
      <HiringCard
        score={data.score}
        label={data.label}
        hiringRecommendation={data.hiringRecommendation}
        strengths={data.strengths}
        weaknesses={data.weaknesses}
        redFlags={data.redFlags}
      />

      {/* Skills table */}
      <SkillsTable skillSimilarity={skillSimilarity} />

      {/* Dimension radar */}
      {dimensions && <DimensionChart dimensions={dimensions} />}

      {/* GitHub + Codeforces signal cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* GitHub */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center text-slate-400 text-xs mb-3">
            <GithubIcon />GitHub Languages
          </div>
          {langSegments.length > 0 ? (
            <DonutChart segments={langSegments} />
          ) : (
            <p className="text-slate-600 text-xs">No language data</p>
          )}
          <p className="text-slate-500 text-xs mt-3">{github.repos} public repos</p>
        </div>

        {/* Codeforces */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center text-slate-400 text-xs mb-3">
            <CodeIcon />Codeforces Signal
          </div>
          <div className="flex items-end gap-3">
            <p className="text-white font-semibold text-lg">Rating: {codeforces.rating}</p>
            <span className="text-xs text-slate-500 mb-0.5">max {codeforces.maxRating}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-1">
            <span className="text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full">
              {codeforces.rank}
            </span>
            {codeforces.ratingConsistency && codeforces.ratingConsistency !== "N/A" && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full border ${
                  consistencyBadgeClass[codeforces.ratingConsistency] ??
                  "bg-slate-500/20 text-slate-300 border-slate-500/30"
                }`}
              >
                Rating {codeforces.ratingConsistency}
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[
              { label: "Solved", val: codeforces.solvedCount },
              { label: "Avg Diff", val: codeforces.avgDifficulty || "N/A" },
              { label: "Hardest", val: codeforces.hardestProblem || "N/A" },
            ].map(({ label, val }) => (
              <div key={label} className="bg-slate-800/60 rounded-lg p-2 text-center">
                <p className="text-white font-semibold text-sm">{val}</p>
                <p className="text-slate-500 text-xs">{label}</p>
              </div>
            ))}
          </div>

          {codeforces.difficultyDistribution?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-slate-500 mb-2">Problems solved by difficulty</p>
              <BarChart
                items={codeforces.difficultyDistribution.map(d => ({
                  label: String(d.rating),
                  value: d.count,
                }))}
                colors={DIFF_COLORS}
              />
            </div>
          )}

          {codeforces.tagData?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-slate-500 mb-2">Top problem topics</p>
              <BarChart
                items={codeforces.tagData.map(t => ({ label: t.tag, value: t.count }))}
                colors={["#06b6d4"]}
              />
            </div>
          )}
        </div>
      </div>

      {/* Learning prediction */}
      <div className="backdrop-blur-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-5 shadow-xl flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <p className="text-xs text-amber-400/70 mb-0.5">Learning Prediction</p>
          <p className="text-white font-semibold">{learningPrediction}</p>
        </div>
      </div>

      {/* AI Insight */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/30 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 14.094A5.973 5.973 0 004 17v1H1v-1a3 3 0 013.75-2.906z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-white">AI Insight</h3>
        </div>
        <p className="text-slate-400 text-sm leading-relaxed">{aiInsight}</p>
      </div>
    </div>
  );
}
