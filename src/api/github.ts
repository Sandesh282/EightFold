const BASE = "https://api.github.com";
const token = import.meta.env.VITE_GITHUB_TOKEN as string | undefined;
const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

import type { GitHubData } from "../types";

async function ghFetch(url: string, useAuth = true): Promise<Response> {
  const res = await fetch(url, { headers: useAuth ? authHeaders : {} });
  if (res.status === 401 && useAuth) return ghFetch(url, false);
  return res;
}

// Common frameworks/libraries to look for in dependency files
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

async function fetchDeps(owner: string, repo: string): Promise<string[]> {
  const files = ["package.json", "requirements.txt", "go.mod", "pom.xml", "Cargo.toml"];
  const results = await Promise.all(
    files.map(f =>
      ghFetch(`${BASE}/repos/${owner}/${repo}/contents/${f}`)
        .then(r => (r.ok ? r.json() : null))
        .catch(() => null)
    )
  );
  const found = new Set<string>();
  for (const file of results) {
    if (!file?.content) continue;
    const content = atob(file.content.replace(/\n/g, "")).toLowerCase();
    for (const tech of KNOWN_TECH) {
      if (content.includes(`"${tech}"`) || content.includes(tech)) found.add(tech);
    }
  }
  return [...found];
}

async function fetchLangBytes(owner: string, repo: string): Promise<Record<string, number>> {
  const res = await ghFetch(`${BASE}/repos/${owner}/${repo}/languages`);
  return res.ok ? res.json() : {};
}

export async function fetchGitHubData(username: string): Promise<GitHubData> {
  const [userRes, reposRes, eventsRes] = await Promise.all([
    ghFetch(`${BASE}/users/${username}`),
    ghFetch(`${BASE}/users/${username}/repos?per_page=100&sort=updated`),
    ghFetch(`${BASE}/users/${username}/events/public?per_page=100`),
  ]);

  if (userRes.status === 403)
    throw new Error("GitHub API rate limit hit. Add a valid VITE_GITHUB_TOKEN in .env to fix this.");
  if (userRes.status === 404)
    throw new Error(`GitHub username "${username}" not found.`);
  if (!userRes.ok)
    throw new Error(`GitHub error (${userRes.status}). Check your inputs.`);

  const user = await userRes.json();
  const repos = await reposRes.json();
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

  // Fetch language bytes + deps for top 3 repos in parallel
  const [langBytesResults, depsResults] = await Promise.all([
    Promise.all(top3.map((r: { name: string }) => fetchLangBytes(username, r.name))),
    Promise.all(top3.map((r: { name: string }) => fetchDeps(username, r.name))),
  ]);

  // Merge language bytes across top 3
  const totalBytes: Record<string, number> = {};
  for (const lb of langBytesResults) {
    for (const [lang, bytes] of Object.entries(lb as Record<string, number>)) {
      totalBytes[lang] = (totalBytes[lang] || 0) + bytes;
    }
  }
  const languageBytes = Object.entries(totalBytes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([lang, bytes]) => ({ lang, bytes }));

  // Deduplicate detected frameworks across all repos
  const detectedTech = [...new Set((depsResults as string[][]).flat())];

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
