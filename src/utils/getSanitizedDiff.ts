import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { getAISuggestions } from "./getAISuggestions";
import { writeMarkdown } from "./writeMarkdownFile";
import { ensureOllamaRunning } from "./checkOllama";

// Remove API keys, tokens, etc.
function removeSecrets(diff: string): string {
  return diff.replace(
    /(['"]?)([A-Za-z0-9_]*_?SECRET|API_KEY|TOKEN)(['"]?)\s*[:=]\s*(['"][^'"]+['"])/gi,
    '$1$2$3: "<redacted>"'
  );
}

// Removes long base64 strings (images, blobs)
function removeLargeBlobs(diff: string): string {
  return diff.replace(
    /(data:image\/[a-z]+;base64,[A-Za-z0-9+/=]{100,})/gi,
    "[large blob removed]"
  );
}

function removeYarnLockDiff(diff: string): string {
  return diff.replace(
    /^diff --git a\/[^\n]*yarn\.lock[^\n]*\n(?:.*\n)*?(?=^diff --git |\Z)/gm,
    ""
  );
}

export function getSanitizedDiff(rawDiff: string): string {
  return removeYarnLockDiff(removeLargeBlobs(removeSecrets(rawDiff)));
}
