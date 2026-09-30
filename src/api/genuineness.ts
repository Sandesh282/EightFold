import type { RatingConsistencySignal } from "../types";

// Named thresholds — easy to explain in an interview
const RATING_GAP_INCONSISTENT = 500;   // rating much higher than avg difficulty solved
const RATING_GAP_LOW_EVIDENCE = 300;   // moderate gap — limited evidence
const RATING_GAP_CONSISTENT = 250;     // within expected range
const SPIKE_THRESHOLD = 300;           // single-contest gain that looks unusual
const LOW_CONTEST_THRESHOLD = 10;      // fewer contests = less reliable signal
const LOW_CONTEST_MIN_RATING = 1600;   // high rating with very few contests

/**
 * Deterministic heuristic that signals how consistent a user's CF rating
 * is with their observed problem-solving history.
 *
 * Signals:
 *   "Expert-level rating" — rating >= 2500, bypasses all heuristics
 *   "Inconsistent"        — large gap, sudden spike, or low-contest + high-rating
 *   "Low evidence"        — moderate gap; not enough data to be confident
 *   "Consistent"          — rating closely matches avg difficulty solved
 *   "Likely consistent"   — minor mismatch, within acceptable range
 *   "N/A"                 — no rating data available
 *
 * Does NOT claim to detect cheating. Signals only consistency of public evidence.
 */
export function computeRatingConsistency(params: {
  currentRating: number;
  avgDifficulty: number;
  ratingHistory: { change: number }[];
}): RatingConsistencySignal {
  const { currentRating, avgDifficulty, ratingHistory } = params;

  if (currentRating === 0) return "N/A";
  if (currentRating >= 2500) return "Expert-level rating";

  if (avgDifficulty > 0 && currentRating > 0) {
    const ratingVsDifficulty = currentRating - avgDifficulty;
    const recentChanges = ratingHistory.slice(-5).map(r => r.change);
    const hasSuddenSpike = recentChanges.some(c => c > SPIKE_THRESHOLD);
    const contestCount = ratingHistory.length;
    const lowContestHighRating =
      contestCount < LOW_CONTEST_THRESHOLD && currentRating > LOW_CONTEST_MIN_RATING;

    if (ratingVsDifficulty > RATING_GAP_INCONSISTENT || hasSuddenSpike || lowContestHighRating) {
      return "Inconsistent";
    } else if (ratingVsDifficulty > RATING_GAP_LOW_EVIDENCE) {
      return "Low evidence";
    } else if (Math.abs(ratingVsDifficulty) < RATING_GAP_CONSISTENT) {
      return "Consistent";
    } else {
      return "Likely consistent";
    }
  }

  return "N/A";
}
