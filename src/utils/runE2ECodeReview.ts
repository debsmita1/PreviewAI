import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { getAISuggestions } from "./getAISuggestions";
import { writeMarkdown } from "./writeMarkdownFile";
import { ensureOllamaRunning } from "./checkOllama";
import { getSanitizedDiff } from "./getSanitizedDiff";
import { CustomPromptType } from "../types";

export async function runE2ECodeReview(
  repoPath: string,
  gitDiff: string,
  customPrompt?: CustomPromptType
) {
  let sanitizedDiff = getSanitizedDiff(gitDiff);

  const coveragePath = join(repoPath, ".code-review", "coverage-summary.json");
  let coverageSummary = {};
  if (existsSync(coveragePath)) {
    coverageSummary = JSON.parse(readFileSync(coveragePath, "utf8"));
  }

  ensureOllamaRunning("llama3:latest");
  let aiSuggestions = await getAISuggestions(sanitizedDiff, customPrompt);

  let reviewMD = `
# Code Review Report

## Git Diff (Sanitized)
\`\`\`diff
${sanitizedDiff}
\`\`\`

## PreviewAI Suggestions
${aiSuggestions}

`;

  writeMarkdown(reviewMD, repoPath);
}
