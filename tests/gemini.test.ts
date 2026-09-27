import { describe, it, expect } from "vitest";
import { buildPrompt } from "../src/api/prompt";
import type { GitHubData, CodeforcesData } from "../src/types";

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockGitHubData: GitHubData = {
  repos: 14,
  followers: 22,
  following: 10,
  accountAgeDays: 900,
  languages: ["TypeScript", "Python", "JavaScript"],
  languageData: [
    { lang: "TypeScript", count: 8 },
    { lang: "Python", count: 4 },
    { lang: "JavaScript", count: 2 },
  ],
  languageBytes: [
    { lang: "TypeScript", bytes: 120000 },
    { lang: "Python", bytes: 45000 },
  ],
  detectedTech: ["react", "fastapi", "vitest"],
  totalStars: 52,
  totalForks: 18,
  activity: { pushes: 37, prs: 5, issues: 3, activeRepos: 4 },
  summary: "14 repos · TypeScript, Python, JavaScript",
  bio: "Full-stack developer",
  avatarUrl: "https://example.com/avatar.png",
  profileUrl: "https://github.com/testuser",
  topRepos: [
    {
      name: "eightfold",
      stars: 20,
      forks: 5,
      lang: "TypeScript",
      description: "AI candidate screening tool",
      url: "https://github.com/testuser/eightfold",
      updatedAt: "2024-09-01",
    },
  ],
};

const mockCFData: CodeforcesData = {
  rating: 1650,
  maxRating: 1700,
  rank: "expert",
  maxRank: "expert",
  solvedCount: 120,
  totalSubmissions: 280,
  acceptanceRate: 43,
  topTags: ["dp", "graphs", "greedy"],
  tagData: [
    { tag: "dp", count: 35 },
    { tag: "graphs", count: 20 },
    { tag: "greedy", count: 18 },
  ],
  difficultyDistribution: [
    { rating: 1200, count: 30 },
    { rating: 1600, count: 50 },
    { rating: 2000, count: 10 },
  ],
  avgDifficulty: 1520,
  hardestProblem: 2100,
  ratingConsistency: "Genuine",
  ratingHistory: [{ contestName: "Round 900", rating: 1650, change: 50, date: "1/1/2024" }],
  verdicts: { accepted: 120, wrongAnswer: 100, tle: 30 },
  contribution: 10,
};

const MOCK_JD = "We are looking for a full-stack engineer with React, TypeScript, FastAPI, and strong DSA skills.";

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("buildPrompt", () => {
  it("includes the GitHub repo count", () => {
    const prompt = buildPrompt(mockGitHubData, mockCFData, MOCK_JD);
    expect(prompt).toContain("14");          // repos: 14
    expect(prompt).toContain("Public repos");
  });

  it("includes the Codeforces rating", () => {
    const prompt = buildPrompt(mockGitHubData, mockCFData, MOCK_JD);
    expect(prompt).toContain("1650");        // rating: 1650
    expect(prompt).toContain("Current rating");
  });

  it("includes the job description text verbatim", () => {
    const prompt = buildPrompt(mockGitHubData, mockCFData, MOCK_JD);
    expect(prompt).toContain(MOCK_JD);
  });

  it("contains the required JSON shape instruction", () => {
    const prompt = buildPrompt(mockGitHubData, mockCFData, MOCK_JD);
    expect(prompt).toContain('"skillSimilarity"');
    expect(prompt).toContain('"dimensions"');
    expect(prompt).toContain('"hiringRecommendation"');
    expect(prompt).toContain('"score"');
    expect(prompt).toContain('"label"');
  });

  it("includes detected tech from dependency files", () => {
    const prompt = buildPrompt(mockGitHubData, mockCFData, MOCK_JD);
    expect(prompt).toContain("react");
    expect(prompt).toContain("fastapi");
    expect(prompt).toContain("vitest");
  });

  it("includes ratingConsistency signal", () => {
    const prompt = buildPrompt(mockGitHubData, mockCFData, MOCK_JD);
    expect(prompt).toContain("Genuine");
  });
});
