import { readFileSync, existsSync } from "fs";
import { runE2ECodeReview } from "./utils/runE2ECodeReview";
import { CustomPromptType } from "./types";

async function main() {
  const args = process.argv.slice(2);
  const repoPath = args[0] || process.cwd();

  let customPrompt: CustomPromptType | undefined = undefined;

  // Parse args
  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--prompt") {
      const filePath = args[i + 1];
      if (!filePath || !filePath.endsWith(".json") || !existsSync(filePath)) {
        console.error("❌ Error: --prompt must be a valid path to a JSON file");
        process.exit(1);
      }
      try {
        customPrompt = JSON.parse(readFileSync(filePath, "utf-8"));
      } catch (err) {
        console.error("❌ Error: Failed to parse JSON in prompt file:", err);
        process.exit(1);
      }
      i++;
    }
  }

  try {
    const diffInput = readFileSync(0, "utf-8"); // diff from stdin
    await runE2ECodeReview(repoPath, diffInput, customPrompt);
  } catch (err) {
    console.error("Error running code review:", err);
    process.exit(1);
  }
}

main().catch(console.error);
