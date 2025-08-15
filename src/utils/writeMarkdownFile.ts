import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

export function writeMarkdown(output: string, repoPath: string): void {
  console.log("📄 Writing code review output...");

  // Path to the .code-review folder inside the repo
  const reviewDir = join(repoPath, ".code-review");

  // Create folder if it doesn't exist
  if (!existsSync(reviewDir)) {
    mkdirSync(reviewDir, { recursive: true });
  }

  // Full path to the markdown file
  const reviewFilePath = join(reviewDir, "code-review.md");

  // Write the markdown file
  writeFileSync(reviewFilePath, output, "utf8");
}
