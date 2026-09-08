import type { RatingConsistency } from "../types";

export function computeRatingConsistency(params: {
  currentRating: number;
  avgDifficulty: number;
  ratingHistory: { change: number }[];
}): RatingConsistency {
  const { currentRating, avgDifficulty, ratingHistory } = params;

  if (currentRating === 0) return "N/A";
  if (currentRating >= 2500) return "Expert level";

  if (avgDifficulty > 0 && currentRating > 0) {
    const ratingVsDifficulty = currentRating - avgDifficulty;
    const recentChanges = ratingHistory.slice(-5).map(r => r.change);
    const hasSuddenSpike = recentChanges.some(c => c > 300);
    const contestCount = ratingHistory.length;
    const lowContestHighRating = contestCount < 10 && currentRating > 1600;

    if (ratingVsDifficulty > 500 || hasSuddenSpike || lowContestHighRating) {
      return "Suspicious";
    } else if (ratingVsDifficulty > 300) {
      return "Questionable";
    } else if (Math.abs(ratingVsDifficulty) < 250) {
      return "Genuine";
    } else {
      return "Likely genuine";
    }
  }

  return "N/A";
}
