import React from "react";

// ─── Icon primitives ──────────────────────────────────────────────────────────

export const CheckIcon = () => (
  <svg className="w-3.5 h-3.5 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

export const WarnIcon = () => (
  <svg className="w-3.5 h-3.5 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

export const XIcon = () => (
  <svg className="w-3.5 h-3.5 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

export const GithubIcon = () => (
  <svg className="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

export const CodeIcon = () => (
  <svg className="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 24 24">
    <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
  </svg>
);

// ─── Reusable chart / display primitives ──────────────────────────────────────

interface BarChartProps {
  items: { label: string; value: number }[];
  colors: string[];
}

export function BarChart({ items, colors }: BarChartProps) {
  const max = Math.max(...items.map(i => i.value), 1);
  return (
    <div className="space-y-2">
      {items.map(({ label, value }, idx) => (
        <div key={label} className="flex items-center gap-3">
          <span className="text-xs text-slate-400 w-24 truncate shrink-0">{label}</span>
          <div className="flex-1 bg-slate-800 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-700"
              style={{ width: `${(value / max) * 100}%`, background: colors[idx % colors.length] }}
            />
          </div>
          <span className="text-xs text-slate-400 w-6 text-right">{value}</span>
        </div>
      ))}
    </div>
  );
}

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({ segments }: { segments: DonutSegment[] }) {
  const total = segments.reduce((s, i) => s + i.value, 0) || 1;
  let offset = 0;
  const r = 40, cx = 50, cy = 50, circ = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="w-24 h-24 shrink-0">
        {segments.map(({ value, color }, i) => {
          const pct = value / total;
          const dash = pct * circ;
          const el = (
            <circle
              key={i} cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="18"
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset * circ}
              style={{ transition: "stroke-dasharray 0.7s" }}
            />
          );
          offset += pct;
          return el;
        })}
      </svg>
      <div className="space-y-1">
        {segments.map(({ label, value, color }) => (
          <div key={label} className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
            <span className="text-slate-300">{label}</span>
            <span className="text-slate-500 ml-auto pl-2">{Math.round((value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ScoreRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="8" />
        <circle
          cx="50" cy="50" r="45" fill="none" stroke="url(#scoreGrad)" strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-1000"
        />
        <defs>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white">{score}</span>
        <span className="text-xs text-slate-400">/100</span>
      </div>
    </div>
  );
}

interface SkillBadgeProps {
  skill: string;
  type: "verified" | "learnable" | "missing";
}

export function SkillBadge({ skill, type }: SkillBadgeProps) {
  const styles = {
    verified: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
    learnable: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
    missing: "bg-red-500/20 text-red-300 border border-red-500/30",
  };
  const icons = { verified: <CheckIcon />, learnable: <WarnIcon />, missing: <XIcon /> };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${styles[type]}`}>
      {icons[type]}{skill}
    </span>
  );
}
