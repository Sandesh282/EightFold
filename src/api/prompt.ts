import type { GitHubData, CodeforcesData } from "../types";

export function buildPrompt(
  githubData: GitHubData,
  cfData: CodeforcesData,
  jobDescription: string
): string {
  return `
You are an expert technical hiring assistant. Perform a deep analysis of this candidate against the job description.

## Candidate GitHub Profile
- Public repos: ${githubData.repos} | Stars: ${githubData.totalStars} | Forks: ${githubData.totalForks} | Followers: ${githubData.followers}
- Account age: ${githubData.accountAgeDays} days
- Languages by repo count: ${githubData.languageData.map(l => `${l.lang}(${l.count} repos)`).join(", ")}
- Languages by actual code bytes (top 3 repos): ${githubData.languageBytes.map(l => `${l.lang}(${(l.bytes / 1024).toFixed(1)}KB)`).join(", ") || "N/A"}
- Frameworks/libraries detected in dependency files: ${githubData.detectedTech.length ? githubData.detectedTech.join(", ") : "none detected"}
- Recent activity (last 90 days): ${githubData.activity.pushes} pushes, ${githubData.activity.prs} PRs, ${githubData.activity.issues} issues across ${githubData.activity.activeRepos} repos
- Bio: ${githubData.bio || "N/A"}
- Top repos: ${githubData.topRepos.map(r => `${r.name}[${r.lang}, ⭐${r.stars}, 🍴${r.forks}]: ${r.description}`).join(" | ")}

## Candidate Codeforces Profile
- Current rating: ${cfData.rating} (max: ${cfData.maxRating})
- Rank: ${cfData.rank} (max: ${cfData.maxRank})
- Problems solved: ${cfData.solvedCount} | Total submissions: ${cfData.totalSubmissions} | Acceptance rate: ${cfData.acceptanceRate}%
- Average difficulty of solved problems: ${cfData.avgDifficulty} (CF rating scale)
- Hardest problem solved: ${cfData.hardestProblem} rated
- Rating genuineness estimate: ${cfData.ratingConsistency} (based on problem difficulty distribution, rating spike patterns, and contest count vs rating)
- Difficulty distribution: ${cfData.difficultyDistribution.map(d => `${d.rating}(${d.count})`).join(", ") || "N/A"}
- Top problem tags: ${cfData.tagData.map(t => `${t.tag}(${t.count})`).join(", ")}
- Verdicts: ${cfData.verdicts.accepted} AC / ${cfData.verdicts.wrongAnswer} WA / ${cfData.verdicts.tle} TLE
- Contribution: ${cfData.contribution}

## Job Description
${jobDescription}

## Instructions
Extract every distinct skill/technology/requirement from the job description. For each one, produce an alignment score (0.0–1.0) representing how strongly the candidate's **observed public evidence** supports that requirement. This is an evidence-based estimate, not a vector similarity computation.

Return ONLY a valid JSON object with this exact shape:
{
  "score": <overall 0-100>,
  "label": <"Strong Match" | "Good Match" | "Partial Match" | "Weak Match">,
  "skillSimilarity": [
    { "skill": "<requirement name>", "score": <0.0-1.0>, "status": <"observed"|"partial"|"not-found">, "evidence": "<one line: what public evidence was observed, or 'No public evidence found'>" }
  ],
  "dimensions": {
    "githubActivity": { "score": <0-100>, "summary": "<one line>" },
    "dsaStrength": { "score": <0-100>, "summary": "<one line>" },
    "stackFit": { "score": <0-100>, "summary": "<one line>" },
    "projectDepth": { "score": <0-100>, "summary": "<one line>" },
    "experienceProxy": { "score": <0-100>, "summary": "<one line>" }
  },
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "redFlags": ["<concern if any, else empty array>"],
  "hiringRecommendation": <"Strong Hire" | "Hire" | "Maybe" | "No Hire">,
  "learningPrediction": "<Estimated ramp-up time to become productive in this role, e.g. '2–4 weeks'>",
  "aiInsight": "<3-4 sentence synthesis covering what the evidence shows, gaps, and hiring rationale>"
}
`;
}
