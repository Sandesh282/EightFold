// ─── GitHub ───────────────────────────────────────────────────────────────────

export interface GitHubRepo {
  name: string;
  stars: number;
  forks: number;
  lang: string | null;
  description: string;
  url: string;
  updatedAt: string;
}

export interface GitHubActivity {
  pushes: number;
  prs: number;
  issues: number;
  activeRepos: number;
}

export interface GitHubData {
  repos: number;
  followers: number;
  following: number;
  accountAgeDays: number;
  languages: string[];
  languageData: { lang: string; count: number }[];
  languageBytes: { lang: string; bytes: number }[];
  detectedTech: string[];
  totalStars: number;
  totalForks: number;
  activity: GitHubActivity;
  summary: string;
  bio: string;
  avatarUrl: string;
  profileUrl: string;
  topRepos: GitHubRepo[];
}

// ─── Codeforces ──────────────────────────────────────────────────────────────

export interface DifficultyBucket {
  rating: number;
  count: number;
}

export interface TagCount {
  tag: string;
  count: number;
}

export interface RatingHistoryEntry {
  contestName: string;
  rating: number;
  change: number;
  date: string;
}

export type RatingConsistency =
  | "Expert level"
  | "Genuine"
  | "Likely genuine"
  | "Questionable"
  | "Suspicious"
  | "N/A";

export interface CodeforcesData {
  rating: number;
  maxRating: number;
  rank: string;
  maxRank: string;
  solvedCount: number;
  totalSubmissions: number;
  acceptanceRate: number;
  topTags: string[];
  tagData: TagCount[];
  difficultyDistribution: DifficultyBucket[];
  avgDifficulty: number;
  hardestProblem: number;
  ratingConsistency: RatingConsistency;
  ratingHistory: RatingHistoryEntry[];
  verdicts: { accepted: number; wrongAnswer: number; tle: number };
  contribution: number;
}

// ─── Gemini Analysis ─────────────────────────────────────────────────────────

export type SkillStatus = "verified" | "learnable" | "missing";

export interface SkillSimilarity {
  skill: string;
  score: number;
  status: SkillStatus;
  evidence: string;
}

export interface DimensionScore {
  score: number;
  summary: string;
}

export interface AnalysisDimensions {
  githubActivity: DimensionScore;
  dsaStrength: DimensionScore;
  stackFit: DimensionScore;
  projectDepth: DimensionScore;
  experienceProxy: DimensionScore;
}

export type HiringLabel = "Strong Match" | "Good Match" | "Partial Match" | "Weak Match";
export type HiringRecommendation = "Strong Hire" | "Hire" | "Maybe" | "No Hire";

export interface GeminiAnalysis {
  score: number;
  label: HiringLabel;
  skillSimilarity: SkillSimilarity[];
  dimensions: AnalysisDimensions;
  strengths: string[];
  weaknesses: string[];
  redFlags: string[];
  hiringRecommendation: HiringRecommendation;
  learningPrediction: string;
  aiInsight: string;
}

// ─── Combined result (what App stores in state) ───────────────────────────────

export interface AnalysisResult extends GeminiAnalysis {
  github: GitHubData;
  codeforces: CodeforcesData;
}

// ─── Form ─────────────────────────────────────────────────────────────────────

export interface FormState {
  github: string;
  codeforces: string;
  jobDesc: string;
}
