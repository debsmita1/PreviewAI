import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";

export function runNpmAudit(repoPath: string): string {
  console.log("Running audit...");
  const npmLock = join(repoPath, "package-lock.json");
  const yarnLock = join(repoPath, "yarn.lock");
  if (existsSync(npmLock)) {
    try {
      return execSync(`npm audit --json`, { cwd: repoPath }).toString();
    } catch (err: any) {
      return "npm audit returned issues:\n" + err.stdout?.toString();
    }
  } else if (existsSync(yarnLock)) {
    try {
      return execSync(`yarn audit --json`, { cwd: repoPath }).toString();
    } catch (err: any) {
      return "yarn audit returned issues:\n" + err.stdout?.toString();
    }
  } else {
    return "No lockfile found. Skipping audit (project may use pnpm or another manager).";
  }
}