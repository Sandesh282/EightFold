/**
 * Typed error codes used across all API modules.
 * App.tsx uses a switch on `error.code` — never string matching.
 */
export type AppErrorCode =
  | "GITHUB_RATE_LIMIT"
  | "GITHUB_TOKEN_INVALID"
  | "GITHUB_USER_NOT_FOUND"
  | "GITHUB_API_ERROR"
  | "GITHUB_ABUSE_DETECTED"
  | "CODEFORCES_USER_NOT_FOUND"
  | "CODEFORCES_API_ERROR"
  | "GEMINI_QUOTA_EXCEEDED"
  | "GEMINI_TOKEN_INVALID"
  | "GEMINI_SERVICE_UNAVAILABLE"
  | "GEMINI_BAD_RESPONSE"
  | "UNKNOWN";

export class AppError extends Error {
  readonly code: AppErrorCode;

  constructor(code: AppErrorCode, message: string) {
    super(message);
    this.name = "AppError";
    this.code = code;
  }
}
