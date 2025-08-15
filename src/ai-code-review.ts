import { readFileSync } from "fs";
import { runE2ECodeReview } from "./utils/runE2ECodeReview";

async function main() {
  const repoPath = process.argv[2] || process.cwd();
  try {
    await runE2ECodeReview(repoPath, readFileSync(0, "utf-8"));
  } catch (err) {
    console.error("Error running code review:", err);
    process.exit(1);
  }
}

main().catch(console.error);
