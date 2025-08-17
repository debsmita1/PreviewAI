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

TARGET_REPO=""
MODE="staged"
CUSTOM_PROMPT=""

# Parse flags
while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo)
      TARGET_REPO="$2"
      shift 2
      ;;
    --mode)
      MODE="$2"
      shift 2
      ;;
    --prompt)
      CUSTOM_PROMPT="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 --repo <path> [--mode staged|commit|<rev>] [--prompt <path-to-json>]"
      exit 1
      ;;
  esac
done

if [ -z "$TARGET_REPO" ]; then
  echo "❌ Error: --repo is required"
  echo "Usage: $0 --repo <path> [--mode staged|commit|<rev>] [--prompt <custom text>]"
  exit 1
fi

if [ ! -d "$TARGET_REPO" ]; then
  echo "❌ Target repo not found: $TARGET_REPO"
  exit 1
fi

TOOL_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd "$TOOL_DIR"
if [ ! -d "node_modules" ]; then
  echo "📦 Installing tool dependencies in $TOOL_DIR..."
  npm install --no-audit --no-fund --silent
fi

echo "📦 Installing required dependencies..."
(cd "$TOOL_DIR" && npm install --save-dev typescript ts-node @types/node eslint simple-git)

# Capture diff from target repo
cd "$TARGET_REPO"

if [ "$MODE" = "staged" ]; then
  if git diff --cached --quiet; then
    echo "⚠️  No staged changes found. Falling back to last commit."
    DIFF=$(git show --pretty=medium --unified=0 HEAD)
  else
    echo "Using staged changes for review."
    DIFF=$(git diff --cached --unified=0)
  fi
elif [ "$MODE" = "commit" ]; then
  echo "Using last commit diff."
  DIFF=$(git show --pretty=medium --unified=0 HEAD)
else
  echo "Using revision/range: $MODE"
  DIFF=$(git diff --unified=0 "$MODE")
fi

REPORT_DIR="$TARGET_REPO/.code-review"
echo "📂 Creating report directory: $REPORT_DIR"
mkdir -p "$REPORT_DIR"

echo "🚀 Running Code Pre-Review Assistant on repo: $TARGET_REPO"

# Pass prompt only if provided
CMD="ts-node \"$TOOL_DIR/src/ai-code-review.ts\" \"$TARGET_REPO\""
if [ -n "$CUSTOM_PROMPT" ]; then
  CMD="$CMD --prompt \"$CUSTOM_PROMPT\""
fi

(echo "$DIFF" | eval $CMD > "$REPORT_DIR/code-review.md") & REVIEW_PID=$!
spin $REVIEW_PID
wait $REVIEW_PID

echo "✅ Code review generated: $REPORT_DIR/code-review.md"
echo "👉 Open in VS Code with Cmd+Shift+V (Ctrl+Shift+V on Windows/Linux) to preview."
