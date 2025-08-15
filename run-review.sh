#!/usr/bin/env bash
set -euo pipefail

spin() {
  local sp='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
  local i=0
  tput civis
  while kill -0 "$1" 2>/dev/null; do
    i=$(( (i+1) % 8 ))
    printf "\r${sp:$i:1} Generating code review..."
    sleep 0.1
  done
  printf "\r"
  tput cnorm
}

# Usage: ./run-review.sh /path/to/target-repo [staged|commit|<rev>|default:staged] 
TOOL_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
TARGET_REPO="${1:-}"
MODE="${2:-staged}"

if [ -z "$TARGET_REPO" ]; then
  echo "Usage: $0 /path/to/target-repo [staged|commit|<rev>|default:staged]"
  exit 1
fi

if [ ! -d "$TARGET_REPO" ]; then
  echo "Target repo not found: $TARGET_REPO"
  exit 1
fi

cd "$TOOL_DIR"
if [ ! -d "node_modules" ]; then
  echo "Installing tool dependencies in $TOOL_DIR..."
  npm install --no-audit --no-fund --silent
fi

echo "📦 Installing required dependencies..."
(cd "$TOOL_DIR" && npm install --save-dev typescript ts-node @types/node eslint simple-git)

# Capture diff from target repo
cd "$TARGET_REPO"
# Default to "staged" if MODE is empty or unset
if [ -z "${MODE:-}" ]; then
  MODE="staged"
fi

if [ "$MODE" = "staged" ]; then
  if git diff --cached --quiet; then
    # no staged changes, fallback to last commit
    echo "No staged changes found. Using last commit diff."
    DIFF=$(git show --pretty=medium --unified=0 HEAD)
  else
    echo "Using staged changes for review."
    DIFF=$(git diff --cached --unified=0)
  fi
elif [ "$MODE" = "commit" ]; then
  echo "Using last commit diff."
  DIFF=$(git show --pretty=medium --unified=0 HEAD)
else
  # allow user-specified rev or range
  echo "Using specified revision or range"
  DIFF=$(git diff --unified=0 "$MODE")
fi

# Ensure output directory exists in target repo
REPORT_DIR="$TARGET_REPO/.code-review"
echo "📂 Creating report directory: $REPORT_DIR"
mkdir -p "$REPORT_DIR"

echo "🚀 Running Code Pre-Review Assistant on repo: $TARGET_REPO "
(echo "$DIFF" | ts-node "$TOOL_DIR/src/ai-code-review.ts" "$TARGET_REPO" > "$REPORT_DIR/code-review.md"
) & REVIEW_PID=$!
spin $REVIEW_PID
wait $REVIEW_PID
echo "✅ Code review generated: $REPORT_DIR/code-review.md"
echo "Open in VS Code and press Cmd+Shift+V (Ctrl+Shift+V) to preview."


# npm run review -- /Users/dsantra/Documents/community-plugins