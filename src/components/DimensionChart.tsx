import React from "react";
import type { AnalysisDimensions } from "../types";

interface DimensionChartProps {
  dimensions: AnalysisDimensions;
}

const DIMENSION_LABELS: Record<keyof AnalysisDimensions, string> = {
  githubActivity: "GitHub Activity",
  dsaStrength: "DSA Strength",
  stackFit: "Stack Fit",
  projectDepth: "Project Depth",
  experienceProxy: "Experience",
};

const DIMENSION_COLORS: Record<keyof AnalysisDimensions, string> = {
  githubActivity: "#6366f1",
  dsaStrength: "#06b6d4",
  stackFit: "#10b981",
  projectDepth: "#f59e0b",
  experienceProxy: "#ec4899",
};

function scoreColor(score: number): string {
  if (score >= 75) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}

export function DimensionChart({ dimensions }: DimensionChartProps) {
  const keys = Object.keys(dimensions) as (keyof AnalysisDimensions)[];

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-5">
        Candidate Dimensions
      </h3>

      <div className="space-y-4">
        {keys.map(key => {
          const dim = dimensions[key];
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-slate-300">{DIMENSION_LABELS[key]}</span>
                <span className={`text-sm font-bold font-mono ${scoreColor(dim.score)}`}>
                  {dim.score}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 mb-1">
                <div
                  className="h-2 rounded-full transition-all duration-700"
                  style={{
                    width: `${dim.score}%`,
                    background: DIMENSION_COLORS[key],
                  }}
                />
              </div>
              <p className="text-xs text-slate-500">{dim.summary}</p>
            </div>
          );
        })}
      </div>

      {/* Radar polygon — simple SVG, no lib needed */}
      <div className="mt-6 flex justify-center">
        <svg viewBox="0 0 200 200" className="w-48 h-48 opacity-80">
          {/* Rings */}
          {[25, 50, 75, 100].map(pct => (
            <polygon
              key={pct}
              points={radarPoints(keys.length, pct / 100, 80)}
              fill="none"
              stroke="#1e293b"
              strokeWidth="1"
            />
          ))}
          {/* Axes */}
          {keys.map((_, i) => {
            const angle = (i / keys.length) * 2 * Math.PI - Math.PI / 2;
            return (
              <line
                key={i}
                x1="100" y1="100"
                x2={100 + 80 * Math.cos(angle)}
                y2={100 + 80 * Math.sin(angle)}
                stroke="#1e293b"
                strokeWidth="1"
              />
            );
          })}
          {/* Data polygon */}
          <polygon
            points={radarPoints(
              keys.length,
              1,
              80,
              keys.map(k => dimensions[k].score / 100)
            )}
            fill="rgba(99,102,241,0.2)"
            stroke="#6366f1"
            strokeWidth="1.5"
          />
          {/* Data points */}
          {keys.map((k, i) => {
            const angle = (i / keys.length) * 2 * Math.PI - Math.PI / 2;
            const r = (dimensions[k].score / 100) * 80;
            return (
              <circle
                key={k}
                cx={100 + r * Math.cos(angle)}
                cy={100 + r * Math.sin(angle)}
                r="3"
                fill="#06b6d4"
              />
            );
          })}
          {/* Labels */}
          {keys.map((k, i) => {
            const angle = (i / keys.length) * 2 * Math.PI - Math.PI / 2;
            const lr = 95;
            return (
              <text
                key={k}
                x={100 + lr * Math.cos(angle)}
                y={100 + lr * Math.sin(angle)}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#64748b"
                fontSize="9"
              >
                {DIMENSION_LABELS[k].split(" ")[0]}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function radarPoints(
  n: number,
  scale: number,
  radius: number,
  perPointScales?: number[]
): string {
  return Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    const r = radius * (perPointScales ? perPointScales[i] : scale);
    return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`;
  }).join(" ");
}
