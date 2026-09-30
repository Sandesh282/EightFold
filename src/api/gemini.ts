import { GoogleGenerativeAI } from "@google/generative-ai";
import { AppError } from "../errors";
import type { GitHubData, CodeforcesData, GeminiAnalysis } from "../types";
import { buildPrompt } from "./prompt";

export { buildPrompt } from "./prompt";

// ─── Response validator ───────────────────────────────────────────────────────

/** Validates Gemini JSON output has required fields before we trust it as GeminiAnalysis */
function validateGeminiResponse(obj: unknown): GeminiAnalysis {
  if (!obj || typeof obj !== "object")
    throw new AppError("GEMINI_BAD_RESPONSE", "Gemini returned non-object JSON.");
  const r = obj as Record<string, unknown>;
  const required = [
    "score", "label", "skillSimilarity", "dimensions",
    "strengths", "weaknesses", "hiringRecommendation", "aiInsight",
  ] as const;
  for (const key of required) {
    if (!(key in r))
      throw new AppError("GEMINI_BAD_RESPONSE", `Gemini response missing required field: "${key}".`);
  }
  if (typeof r.score !== "number")
    throw new AppError("GEMINI_BAD_RESPONSE", 'Gemini "score" must be a number.');
  if (!Array.isArray(r.skillSimilarity))
    throw new AppError("GEMINI_BAD_RESPONSE", 'Gemini "skillSimilarity" must be an array.');
  if (!Array.isArray(r.strengths))
    throw new AppError("GEMINI_BAD_RESPONSE", 'Gemini "strengths" must be an array.');
  return r as unknown as GeminiAnalysis;
}

// ─── Retry + fallback pipeline ────────────────────────────────────────────────

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY as string);

/**
 * Models to try in order.
 * The SDK resolves these names against the v1beta endpoint, so we use
 * the exact model IDs returned by ListModels for this API key.
 */
const MODELS = ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-2.5-flash"] as const;

const MAX_RETRIES = 2;          // retries per model before giving up on it
const BACKOFF_BASE_MS = 1000;   // 1 s → 2 s exponential

/**
 * True for transient server errors that are safe to retry.
 * Quota (429), service overload (503), internal error (500).
 */
function isRetryable(msg: string): boolean {
  return msg.includes("429") || msg.includes("503") || msg.includes("500");
}

/**
 * True for errors that mean the whole model is unavailable or unauthorized.
 * We fall through to the next model for these.
 */
function isFallthrough(msg: string): boolean {
  return msg.includes("404") || msg.includes("403") || msg.includes("401");
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Attempt to call one specific model, retrying on transient errors with
 * exponential backoff. Throws AppError on permanent failures.
 */
async function tryModel(modelName: string, prompt: string): Promise<GeminiAnalysis> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const waitMs = BACKOFF_BASE_MS * Math.pow(2, attempt - 1);
      console.warn(`[Gemini] ${modelName} attempt ${attempt + 1}, retrying in ${waitMs}ms...`);
      await sleep(waitMs);
    }

    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const clean = text
        .replace(/^```json\n?/, "")
        .replace(/^```\n?/, "")
        .replace(/\n?```$/, "");
      return validateGeminiResponse(JSON.parse(clean));
    } catch (e) {
      lastError = e as Error;
      const msg = lastError.message || "";

      if (isRetryable(msg)) {
        // Transient server error: retry with backoff (if retries remain)
        continue;
      }
      // Permanent error for this model (404/403/401 or bad JSON): stop retrying this model
      throw e;
    }
  }

  // Retries exhausted on a transient error — fall through to next model
  throw lastError;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function analyzeWithGemini(params: {
  githubData: GitHubData;
  cfData: CodeforcesData;
  jobDescription: string;
}): Promise<GeminiAnalysis> {
  const { githubData, cfData, jobDescription } = params;
  const prompt = buildPrompt(githubData, cfData, jobDescription);
  let lastError: Error | undefined;

  for (const modelName of MODELS) {
    try {
      return await tryModel(modelName, prompt);
    } catch (e) {
      lastError = e as Error;
      const msg = lastError.message || "";

      // Re-throw immediately for clear permanent errors (bad key, bad response)
      if (msg.includes("401") || (e instanceof AppError && e.code === "GEMINI_BAD_RESPONSE")) {
        throw new AppError("GEMINI_TOKEN_INVALID", "Gemini API key is unauthorized. Generate a new one at aistudio.google.com.");
      }

      if (msg.includes("429")) {
        // Quota hit — try next model immediately (no point retrying the same one)
        console.warn(`[Gemini] Quota exceeded on ${modelName}, falling back to next model.`);
        continue;
      }

      if (msg.includes("404") || msg.includes("403")) {
        // Model not found or forbidden — try next model
        console.warn(`[Gemini] Model ${modelName} unavailable (${msg.slice(0, 60)}), falling back.`);
        continue;
      }

      if (msg.includes("503") || msg.includes("500")) {
        // Retries on this model are already exhausted inside tryModel.
        // Fall through to the next model in the list.
        console.warn(`[Gemini] ${modelName} service unavailable after retries, falling back.`);
        continue;
      }

      // Unknown error — re-throw
      throw new AppError("GEMINI_BAD_RESPONSE", msg || "Unexpected Gemini error.");
    }
  }

  // Every model failed
  const msg = lastError?.message || "";
  if (msg.includes("429"))
    throw new AppError("GEMINI_QUOTA_EXCEEDED", "Gemini API quota exhausted across all available models. Try again in a few minutes.");
  if (msg.includes("503") || msg.includes("500"))
    throw new AppError("GEMINI_SERVICE_UNAVAILABLE", "Gemini API is temporarily unavailable. This is a Google server issue — please try again in 30 seconds.");

  throw new AppError("GEMINI_BAD_RESPONSE", msg || "Gemini analysis failed after all retries.");
}
