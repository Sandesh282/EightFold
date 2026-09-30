import { AppError } from "../errors";
import type { GitHubData } from "../types";

const BASE = "https://api.github.com";
const token = import.meta.env.VITE_GITHUB_TOKEN as string | undefined;
const authHeaders: Record<string, string> = token
  ? { Authorization: `Bearer ${token}` }
  : {};

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function ghFetch(url: string): Promise<Response> {
  const res = await fetch(url, { headers: authHeaders });

  if (res.status === 401) {
    throw new AppError(
      "GITHUB_TOKEN_INVALID",
      token
        ? "GitHub token is invalid or revoked. Generate a new one at github.com/settings/tokens."
        : "GitHub API returned 401 with no token present."
    );
  }

  if (res.status === 403) {
    // GitHub returns 403 for two distinct reasons:
    // 1. Primary rate limit exceeded (X-RateLimit-Remaining: 0)
    // 2. Secondary / abuse rate limit (concurrent request burst)
    const remaining = res.headers.get("X-RateLimit-Remaining");
    if (remaining === "0") {
      throw new AppError(
        "GITHUB_RATE_LIMIT",
        "GitHub primary rate limit exhausted. The app will work again when the limit resets (usually within an hour)."
      );
    }
    throw new AppError(
      "GITHUB_ABUSE_DETECTED",
      "GitHub secondary rate limit triggered. This is caused by sending too many requests at once. The app serializes requests now to prevent this — if it happens again, wait 60 seconds and retry."
    );
  }

  return res;
}

// ─── Tech stack detection ─────────────────────────────────────────────────────

const KNOWN_TECH = [
  "react", "vue", "angular", "next", "nuxt", "svelte",
  "express", "fastapi", "django", "flask", "spring", "nestjs", "hono",
  "mongodb", "mongoose", "prisma", "sequelize", "typeorm", "postgresql", "mysql", "redis",
  "tailwindcss", "bootstrap", "chakra-ui", "material-ui",
  "jest", "vitest", "mocha", "cypress", "playwright",
  "docker", "kubernetes", "terraform",
  "socket.io", "graphql", "trpc", "axios",
  "typescript", "webpack", "vite",
  "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy",
];

const DEP_FILES = ["package.json", "requirements.txt", "go.mod", "pom.xml", "Cargo.toml"];

/**
 * Fetch dependency files for ONE repo SEQUENTIALLY to avoid triggering
 * GitHub's abuse rate limits (which fire on concurrent bursts).
 * GitHub's own best-practice docs say: "Do not make requests concurrently."
 */
async function fetchDeps(owner: string, repo: string): Promise<string[]> {
  const found = new Set<string>();

  for (const file of DEP_FILES) {
    try {
      const res = await ghFetch(`${BASE}/repos/${owner}/${repo}/contents/${file}`);
      if (!res.ok) continue;
      const data = await res.json();
      if (!data?.content) continue;
      const content = atob(data.content.replace(/\n/g, "")).toLowerCase();
      for (const tech of KNOWN_TECH) {
        if (content.includes(`"${tech}"`) || content.includes(tech)) found.add(tech);
      }
    } catch {
      // 404 means the file doesn't exist in this repo — that's fine, skip silently.
      continue;
    }
  }

  return [...found];
}

async function fetchLangBytes(owner: string, repo: string): Promise<Record<string, number>> {
  const res = await ghFetch(`${BASE}/repos/${owner}/${repo}/languages`);
  return res.ok ? res.json() : {};
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function fetchGitHubData(username: string): Promise<GitHubData> {
  // These three can run concurrently — they are distinct resources, not a burst on one.
  const [userRes, reposRes, eventsRes] = await Promise.all([
    ghFetch(`${BASE}/users/${username}`),
    ghFetch(`${BASE}/users/${username}/repos?per_page=100&sort=updated`),
    ghFetch(`${BASE}/users/${username}/events/public?per_page=100`),
  ]);

  if (userRes.status === 404)
    throw new AppError("GITHUB_USER_NOT_FOUND", `GitHub username "${username}" not found.`);
  if (!userRes.ok)
    throw new AppError("GITHUB_API_ERROR", `GitHub error (${userRes.status}). Check your inputs.`);

  const user = await userRes.json();
  const repos = reposRes.ok ? await reposRes.json() : [];
  const events = eventsRes.ok ? await eventsRes.json() : [];

  // Language frequency by repo count
  const langCount: Record<string, number> = {};
  for (const repo of repos) {
    if (repo.language) langCount[repo.language] = (langCount[repo.language] || 0) + 1;
  }
  const languageData = Object.entries(langCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([lang, count]) => ({ lang, count }));
  const languages = languageData.map(l => l.lang);

  // Top 3 repos by stars for deep scan
  const top3 = [...repos]
    .sort((a: { stargazers_count: number }, b: { stargazers_count: number }) => b.stargazers_count - a.stargazers_count)
    .slice(0, 3);

  // ─── Phase 3: Serialize all per-repo deep-scan calls ─────────────────────
  // Running these concurrently (as before) fires 18 requests at once and
  // triggers GitHub's abuse rate limiter. We now run them one repo at a time.
  const totalBytes: Record<string, number> = {};
  const allDeps: string[][] = [];

  for (const repo of top3 as { name: string }[]) {
    const [langBytes, deps] = await Promise.all([
      fetchLangBytes(username, repo.name),  // 1 request — safe to run alongside deps
      fetchDeps(username, repo.name),        // ≤5 sequential requests internally
    ]);
    for (const [lang, bytes] of Object.entries(langBytes as Record<string, number>)) {
      totalBytes[lang] = (totalBytes[lang] || 0) + bytes;
    }
    allDeps.push(deps);
  }

  const languageBytes = Object.entries(totalBytes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([lang, bytes]) => ({ lang, bytes }));

  const detectedTech = [...new Set(allDeps.flat())];

  // Activity from events (last 90 days)
  const pushes = events.filter((e: { type: string }) => e.type === "PushEvent").length;
  const prs = events.filter((e: { type: string }) => e.type === "PullRequestEvent").length;
  const issues = events.filter((e: { type: string }) => e.type === "IssuesEvent").length;
  const activeRepos = [...new Set(events.map((e: { repo?: { name: string } }) => e.repo?.name))].length;

  const topRepos = [...repos]
    .sort((a: { stargazers_count: number }, b: { stargazers_count: number }) => b.stargazers_count - a.stargazers_count)
    .slice(0, 6)
    .map((r: {
      name: string; stargazers_count: number; forks_count: number;
      language: string | null; description: string | null; html_url: string; updated_at: string;
    }) => ({
      name: r.name,
      stars: r.stargazers_count,
      forks: r.forks_count,
      lang: r.language,
      description: r.description || "",
      url: r.html_url,
      updatedAt: r.updated_at,
    }));

  const totalStars = repos.reduce((s: number, r: { stargazers_count: number }) => s + r.stargazers_count, 0);
  const totalForks = repos.reduce((s: number, r: { forks_count: number }) => s + r.forks_count, 0);

  return {
    repos: user.public_repos,
    followers: user.followers,
    following: user.following,
    accountAgeDays: Math.floor((Date.now() - new Date(user.created_at).getTime()) / 86400000),
    languages,
    languageData,
    languageBytes,
    detectedTech,
    totalStars,
    totalForks,
    activity: { pushes, prs, issues, activeRepos },
    summary: `${user.public_repos} repos · ${languages.slice(0, 3).join(", ")}`,
    bio: user.bio || "",
    avatarUrl: user.avatar_url,
    profileUrl: user.html_url,
    topRepos,
  };
}
