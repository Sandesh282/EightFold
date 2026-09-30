import React from "react";
import type { SkillSimilarity } from "../types";
import { SkillBadge, BarChart } from "./ui";

interface SkillsTableProps {
  skillSimilarity: SkillSimilarity[];
}

export function SkillsTable({ skillSimilarity }: SkillsTableProps) {
  const observed = skillSimilarity.filter(s => s.status === "observed");
  const partial = skillSimilarity.filter(s => s.status === "partial");
  const notFound = skillSimilarity.filter(s => s.status === "not-found");

  return (
    <div className="space-y-5">
      {/* Badge breakdown */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Skill Breakdown</h3>
        <div className="space-y-4">
          {(
            [
              ["observed", "Observed in public repos", observed],
              ["partial", "Partial evidence", partial],
              ["not-found", "No public evidence", notFound],
            ] as const
          ).map(([type, labelText, items]) => (
            <div key={type}>
              <p className="text-xs text-slate-500 mb-2">{labelText}</p>
              <div className="flex flex-wrap gap-2">
                {items.length > 0
                  ? items.map(s => <SkillBadge key={s.skill} skill={s.skill} type={type} />)
                  : <span className="text-xs text-slate-600 italic">None</span>
                }
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-skill similarity scores */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Requirement Alignment</h3>
        <div className="space-y-3">
          {skillSimilarity.map(s => (
            <div key={s.skill}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-300">{s.skill}</span>
                <span className="text-xs text-slate-500 font-mono">{(s.score * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full transition-all duration-700"
                  style={{
                    width: `${s.score * 100}%`,
                    background: s.status === "observed"
                      ? "#10b981"
                      : s.status === "partial"
                      ? "#f59e0b"
                      : "#ef4444",
                  }}
                />
              </div>
              {s.evidence && (
                <p className="text-xs text-slate-600 mt-0.5 truncate" title={s.evidence}>{s.evidence}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Count bar chart */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Skill Match Overview</h3>
        <BarChart
          items={[
            { label: "Observed", value: observed.length },
            { label: "Partial", value: partial.length },
            { label: "Not found", value: notFound.length },
          ]}
          colors={["#10b981", "#f59e0b", "#ef4444"]}
        />
      </div>
    </div>
  );
}
