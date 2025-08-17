import fetch from "node-fetch";
import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";

type GitReviewExample = {
  prNumber: number;
  hash: string;
  diff: string;
  comment: string;
};

type CacheFile = {
  repo: string;
  fetchedAt: string;
  examples: GitReviewExample[];
};

/**
 * Fetch historical review comments from GitHub PRs
 * with caching to ./context.json
 */

// TODO : Apply heuristics to extract only actionable, code-related review comments instead of dumping every “LGTM” into the LLM prompt.
export async function gitReviewExamples(
  remoteUrl: string,
  githubToken: string,
  maxExamples: number = 100,
  cacheTTL: number = 1000 * 60 * 60 * 24 // 24 hours
): Promise<GitReviewExample[]> {
  const match = remoteUrl.match(/github\.com[:/](.+?)\/(.+?)(\.git)?$/);
  if (!match) throw new Error(`Could not parse GitHub repo URL: ${remoteUrl}`);
  const [, owner, repo] = match;

  const repoKey = `${owner}/${repo}`;
  const cachePath = path.resolve(__dirname, "../context.json");

  // Define cache shape: repo -> { fetchedAt, maxExamples, examples }
  let cache: Record<
    string,
    { fetchedAt: string; maxExamples: number; examples: GitReviewExample[] }
  > = {};

  if (existsSync(cachePath)) {
    try {
      cache = JSON.parse(readFileSync(cachePath, "utf-8"));
    } catch (err) {
      console.warn("Failed to parse cache file, starting fresh...");
      cache = {};
    }
  }

  const repoCache = cache[repoKey];
  const isFresh =
    repoCache &&
    Date.now() - new Date(repoCache.fetchedAt).getTime() < cacheTTL &&
    repoCache.maxExamples === maxExamples;

  if (isFresh) {
    console.log(`Using cached review examples for ${repoKey}`);
    return repoCache.examples.slice(0, maxExamples);
  }

  // Otherwise, fetch fresh from GitHub
  console.log(`Fetching review examples from GitHub API for ${repoKey}…`);
  const headers = {
    Authorization: `token ${githubToken}`,
    Accept: "application/vnd.github+json",
  };

  const prsRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=100`,
    { headers }
  );
  if (!prsRes.ok) {
    throw new Error(`Failed to fetch PRs: ${prsRes.status} ${prsRes.statusText}`);
  }
  const prs = await prsRes.json();

  const examples: GitReviewExample[] = [];

  for (const pr of prs as any) {
    if (examples.length >= maxExamples) break;

    const prNumber = pr.number;

    const commentsRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/comments?per_page=100`,
      { headers }
    );
    if (!commentsRes.ok) continue;
    const comments = await commentsRes.json();

    for (const c of comments as any) {
      if (examples.length >= maxExamples) break;

      examples.push({
        prNumber,
        hash: c.commit_id,
        diff: c.diff_hunk,
        comment: c.body,
      });
    }
  }

  // Update cache with new/updated repo entry
  cache[repoKey] = {
    fetchedAt: new Date().toISOString(),
    maxExamples,
    examples,
  };

  writeFileSync(cachePath, JSON.stringify(cache, null, 2), "utf-8");
  console.log(`Cached review examples for ${repoKey} to context.json`);

  return examples;
}
