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

/**
 * Deterministic heuristic signal — based on rating vs. average problem difficulty,
 * contest count, and recent rating spike detection. Does NOT imply cheating.
 */
export type RatingConsistencySignal =
  | "Expert-level rating"
  | "Consistent"
  | "Likely consistent"
  | "Low evidence"
  | "Inconsistent"
  | "N/A";

/** @deprecated Use RatingConsistencySignal */
export type RatingConsistency = RatingConsistencySignal;

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
  ratingConsistency: RatingConsistencySignal;
  ratingHistory: RatingHistoryEntry[];
  verdicts: { accepted: number; wrongAnswer: number; tle: number };
  contribution: number;
}

// ─── Gemini Analysis ─────────────────────────────────────────────────────────

/**
 * observed   = found in public GitHub repos/deps
 * partial    = some evidence; may need to be built on the job
 * not-found  = no public evidence observed
 */
export type SkillStatus = "observed" | "partial" | "not-found";

/** Per-requirement alignment score produced by AI synthesis */
export interface RequirementAlignment {
  skill: string;
  /** 0.0–1.0 alignment score from AI synthesis — not a vector cosine similarity */
  score: number;
  status: SkillStatus;
  /** One-line description of what public evidence was observed */
  evidence: string;
}

/** @deprecated Use RequirementAlignment */
export type SkillSimilarity = RequirementAlignment;

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
  /** @see RequirementAlignment — scores are AI alignment estimates, not cosine similarity */
  skillSimilarity: RequirementAlignment[];
  dimensions: AnalysisDimensions;
  strengths: string[];
  weaknesses: string[];
  redFlags: string[];
  hiringRecommendation: HiringRecommendation;
  /** AI-generated ramp-up estimate — an LLM opinion, not a predictive model */
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
