import { GoogleGenerativeAI } from "@google/generative-ai";
import type { GitHubData, CodeforcesData, GeminiAnalysis } from "../types";
import { buildPrompt } from "./prompt";

// Re-export so callers can import buildPrompt from either location
export { buildPrompt } from "./prompt";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY as string);
const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash-lite", "gemini-2.0-flash-001"] as const;

export async function analyzeWithGemini(params: {
  githubData: GitHubData;
  cfData: CodeforcesData;
  jobDescription: string;
}): Promise<GeminiAnalysis> {
  const { githubData, cfData, jobDescription } = params;
  let lastError: Error | undefined;

  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(buildPrompt(githubData, cfData, jobDescription));
      const text = result.response.text().trim();
      const clean = text
        .replace(/^```json\n?/, "")
        .replace(/^```\n?/, "")
        .replace(/\n?```$/, "");
      return JSON.parse(clean) as GeminiAnalysis;
    } catch (e) {
      lastError = e as Error;
      const msg = (e as Error).message || "";
      // Only fall through to next model on quota (429) or model-not-found (404)
      if (!msg.includes("429") && !msg.includes("404")) throw e;
    }
  }
  throw lastError;
}
