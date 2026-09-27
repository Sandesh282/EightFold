import { describe, it, expect } from "vitest";
import { computeRatingConsistency } from "../src/api/genuineness";

/**
 * Tests for the genuineness detection algorithm extracted from codeforces.ts
 *
 * Algorithm signals:
 *  - rating >= 2500 → "Expert level" (bypass all heuristics)
 *  - (rating - avgDifficulty) > 500  OR spike > 300 in last 5 OR (contests < 10 AND rating > 1600) → "Suspicious"
 *  - (rating - avgDifficulty) > 300 → "Questionable"
 *  - |rating - avgDifficulty| < 250  → "Genuine"
 *  - otherwise → "Likely genuine"
 */

const mkHistory = (changes: number[]) => changes.map(c => ({ change: c }));

describe("computeRatingConsistency", () => {
  it("flags low-contest + high-rating as Suspicious", () => {
    // contestCount=8 (<10), rating=1800 (>1600) → lowContestHighRating = true
    const result = computeRatingConsistency({
      currentRating: 1800,
      avgDifficulty: 900,
      ratingHistory: mkHistory(Array(8).fill(50)), // 8 contests, no spike
    });
    expect(result).toBe("Suspicious");
  });

  it("returns Genuine for well-calibrated profile", () => {
    // |1500 - 1300| = 200 < 250, 20 contests, no spike
    const result = computeRatingConsistency({
      currentRating: 1500,
      avgDifficulty: 1300,
      ratingHistory: mkHistory(Array(20).fill(40)),
    });
    expect(result).toBe("Genuine");
  });

  it("returns Expert level for rating >= 2500", () => {
    const result = computeRatingConsistency({
      currentRating: 2600,
      avgDifficulty: 900, // would be Suspicious otherwise
      ratingHistory: mkHistory([]),
    });
    expect(result).toBe("Expert level");
  });

  it("flags sudden spike > 300 in last 5 contests as Suspicious", () => {
    // Last 5 include a +350 spike
    const history = [...Array(15).fill(0).map(() => ({ change: 30 })), { change: 350 }];
    const result = computeRatingConsistency({
      currentRating: 1700,
      avgDifficulty: 1600,
      ratingHistory: history,
    });
    expect(result).toBe("Suspicious");
  });

  it("returns Questionable when rating exceeds avg difficulty by 301–500", () => {
    // 1900 - 1550 = 350 → Questionable
    const result = computeRatingConsistency({
      currentRating: 1900,
      avgDifficulty: 1550,
      ratingHistory: mkHistory(Array(20).fill(40)),
    });
    expect(result).toBe("Questionable");
  });

  it("returns Likely genuine for moderate mismatch", () => {
    // |1800 - 1500| = 300 → not < 250 (Genuine) and not > 300 (Questionable) → Likely genuine
    const result = computeRatingConsistency({
      currentRating: 1800,
      avgDifficulty: 1500,
      ratingHistory: mkHistory(Array(20).fill(40)),
    });
    expect(result).toBe("Likely genuine");
  });

  it("returns N/A when rating is 0", () => {
    const result = computeRatingConsistency({
      currentRating: 0,
      avgDifficulty: 1000,
      ratingHistory: [],
    });
    expect(result).toBe("N/A");
  });
});
