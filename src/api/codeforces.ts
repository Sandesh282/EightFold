import type { CodeforcesData } from "../types";
import { computeRatingConsistency } from "./genuineness";

// Re-export so tests can import from either location
export { computeRatingConsistency } from "./genuineness";

export async function fetchCodeforcesData(handle: string): Promise<CodeforcesData> {
  const infoRes = await fetch(`https://codeforces.com/api/user.info?handles=${handle}`);
  if (!infoRes.ok) throw new Error(`Codeforces handle "${handle}" not found or API unavailable.`);
  const infoData = await infoRes.json();
  if (infoData.status !== "OK")
    throw new Error(infoData.comment || `Codeforces handle "${handle}" not found or API unavailable.`);

  const user = infoData.result[0];

  // Fetch ALL submissions (up to 500 for richer stats)
  const [subRes, ratingRes] = await Promise.all([
    fetch(`https://codeforces.com/api/user.status?handle=${handle}&from=1&count=500`),
    fetch(`https://codeforces.com/api/user.ratingChanges?handle=${handle}`),
  ]);

  const subData = await subRes.json();
  const ratingText = await ratingRes.text();
  let ratingData: { status: string; result?: unknown[] } = { status: "FAILED" };
  try { ratingData = JSON.parse(ratingText); } catch (_) { /* ignore parse failure */ }

  const solved = new Set<string>();
  const tags: Record<string, number> = {};
  const difficultyCount: Record<number, number> = {};
  let accepted = 0, wrongAnswer = 0, tle = 0;

  if (subData.status === "OK") {
    for (const sub of subData.result) {
      if (sub.verdict === "OK") {
        const key = `${sub.problem.contestId}-${sub.problem.index}`;
        solved.add(key);
        accepted++;

        const rating = sub.problem.rating || 0;
        if (rating > 0) {
          const bucket = Math.floor(rating / 200) * 200;
          difficultyCount[bucket] = (difficultyCount[bucket] || 0) + 1;
        }

        for (const tag of (sub.problem.tags || []) as string[]) {
          tags[tag] = (tags[tag] || 0) + 1;
        }
      } else if (sub.verdict === "WRONG_ANSWER") wrongAnswer++;
      else if (sub.verdict === "TIME_LIMIT_EXCEEDED") tle++;
    }
  }

  const tagData = Object.entries(tags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  const topTags = tagData.map(t => t.tag);

  const difficultyDistribution = Object.entries(difficultyCount)
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .map(([rating, count]) => ({ rating: parseInt(rating), count }));

  const totalDifficultyWeighted = difficultyDistribution.reduce((sum, d) => sum + d.rating * d.count, 0);
  const totalProblemsWithRating = difficultyDistribution.reduce((sum, d) => sum + d.count, 0);
  const avgDifficulty = totalProblemsWithRating > 0
    ? Math.round(totalDifficultyWeighted / totalProblemsWithRating)
    : 0;

  const hardestProblem = difficultyDistribution.length > 0
    ? difficultyDistribution[difficultyDistribution.length - 1].rating
    : 0;

  const ratingHistory = ratingData.status === "OK" && Array.isArray(ratingData.result)
    ? (ratingData.result as {
        contestName: string; newRating: number; oldRating: number; ratingUpdateTimeSeconds: number;
      }[]).slice(-20).map(r => ({
        contestName: r.contestName,
        rating: r.newRating,
        change: r.newRating - r.oldRating,
        date: new Date(r.ratingUpdateTimeSeconds * 1000).toLocaleDateString(),
      }))
    : [];

  const currentRating = user.rating || 0;
  const ratingConsistency = computeRatingConsistency({ currentRating, avgDifficulty, ratingHistory });

  const totalSubmissions = subData.status === "OK" ? subData.result.length : 0;
  const acceptanceRate = totalSubmissions > 0 ? Math.round((accepted / totalSubmissions) * 100) : 0;

  return {
    rating: user.rating || 0,
    maxRating: user.maxRating || 0,
    rank: user.rank || "unrated",
    maxRank: user.maxRank || "unrated",
    solvedCount: solved.size,
    totalSubmissions,
    acceptanceRate,
    topTags,
    tagData,
    difficultyDistribution,
    avgDifficulty,
    hardestProblem,
    ratingConsistency,
    ratingHistory,
    verdicts: { accepted, wrongAnswer, tle },
    contribution: user.contribution || 0,
  };
}
