#!/bin/bash
# fork-all-tier1.sh - Fork all Tier 1 extensions with submit-feedback
#
# This script forks the essential extensions and sets up the
# iterative development workflow with submit-feedback commands.
#
# Usage: ./fork-all-tier1.sh [github_username]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FORKED_DIR="$(dirname "$SCRIPT_DIR")"
SHARED_DIR="$FORKED_DIR/_shared"

GITHUB_USERNAME="${1:-YOUR_GITHUB_USERNAME}"

# Tier 1 extensions to fork
TIER1_EXTENSIONS=(
  "github"
  "linear"
  "obsidian"
  "roam-research"
  "brew"
  "1password"
  "spotify-player"
  "apple-reminders"
)

echo "=== Tier 1 Extension Fork Script ==="
echo ""
echo "This will fork the following extensions:"
for ext in "${TIER1_EXTENSIONS[@]}"; do
  echo "  - $ext"
done
echo ""
echo "GitHub username: $GITHUB_USERNAME"
echo "Target directory: $FORKED_DIR"
echo ""
read -p "Continue? [y/N] " confirm

if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  echo "Cancelled."
  exit 0
fi

# Fork each extension
for ext in "${TIER1_EXTENSIONS[@]}"; do
  echo ""
  echo "=== Forking: $ext ==="

  CUSTOM_NAME="${ext}-custom"
  TARGET="$FORKED_DIR/$CUSTOM_NAME"

  # Skip if already exists
  if [ -d "$TARGET" ]; then
    echo "  Already exists, skipping..."
    continue
  fi

  # Run fork script
  "$SCRIPT_DIR/fork-extension.sh" "$ext" "custom" || {
    echo "  Warning: Fork failed for $ext, skipping..."
    continue
  }

  # Add submit-feedback command
  if [ -f "$SHARED_DIR/submit-feedback.tsx" ] && [ -d "$TARGET/src" ]; then
    echo "  Adding submit-feedback command..."
    cp "$SHARED_DIR/submit-feedback.tsx" "$TARGET/src/"

    # Update EXTENSION_INFO in the file
    sed -i.bak "s/YOUR_USERNAME/$GITHUB_USERNAME/g" "$TARGET/src/submit-feedback.tsx"
    sed -i.bak "s/extension-name-here/$CUSTOM_NAME/g" "$TARGET/src/submit-feedback.tsx"
    sed -i.bak "s/Extension Display Name/${ext^} (Custom)/g" "$TARGET/src/submit-feedback.tsx"
    rm -f "$TARGET/src/submit-feedback.tsx.bak"
  fi

  echo "  Done!"
done

echo ""
echo "=== Summary ==="
echo ""
echo "Forked extensions:"
for ext in "${TIER1_EXTENSIONS[@]}"; do
  TARGET="$FORKED_DIR/${ext}-custom"
  if [ -d "$TARGET" ]; then
    echo "  ✅ ${ext}-custom"
  else
    echo "  ❌ ${ext}-custom (failed)"
  fi
done

echo ""
echo "Next steps:"
echo "  1. cd into each extension directory"
echo "  2. Run: npm install && npm run dev"
echo "  3. Test in Raycast"
echo "  4. Use 'Submit Feedback' to request improvements"
echo ""
echo "Tip: Run multiple extensions in parallel:"
echo "  for ext in github-custom linear-custom obsidian-custom; do"
echo "    (cd $FORKED_DIR/\$ext && npm install && npm run dev &)"
echo "  done"
