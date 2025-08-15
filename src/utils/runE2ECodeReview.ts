import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { getAISuggestions } from "./getAISuggestions";
import { writeMarkdown } from "./writeMarkdownFile";
import { ensureOllamaRunning } from "./checkOllama";
import { getSanitizedDiff } from "./getSanitizedDiff";

export async function runE2ECodeReview(repoPath: string, gitDiff: string) {
  let sanitizedDiff = getSanitizedDiff(gitDiff);

  // let auditReport = runNpmAudit(repoPath);

  const coveragePath = join(repoPath, ".code-review", "coverage-summary.json");
  let coverageSummary = {};
  if (existsSync(coveragePath)) {
    coverageSummary = JSON.parse(readFileSync(coveragePath, "utf8"));
  }
  // AI Reviewer
  ensureOllamaRunning("llama3:latest");
  let aiSuggestions = await getAISuggestions(sanitizedDiff);

  // Output
  let reviewMD = `
# Code Review Report

## Git Diff (Sanitized)
\`\`\`diff
${sanitizedDiff}
\`\`\`

## AI Suggestions
${aiSuggestions}

`;

  writeMarkdown(reviewMD, repoPath);
}
