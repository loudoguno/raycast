#!/bin/bash
# apply-upstream.sh - Apply upstream changes to a forked extension
#
# Usage: ./apply-upstream.sh <extension-name>
# Example: ./apply-upstream.sh linear-custom
#
# This creates a patch file and attempts to apply it.
# Manual conflict resolution may be required.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FORKED_DIR="$(dirname "$SCRIPT_DIR")"
UPSTREAM_CACHE="$FORKED_DIR/.upstream-cache"
EXTENSION="${1:-}"

if [ -z "$EXTENSION" ]; then
    echo "Usage: $0 <extension-name>"
    echo "Example: $0 linear-custom"
    exit 1
fi

EXT_PATH="$FORKED_DIR/$EXTENSION"

if [ ! -d "$EXT_PATH" ]; then
    echo "ERROR: Extension '$EXTENSION' not found at $EXT_PATH"
    exit 1
fi

if [ ! -f "$EXT_PATH/.upstream" ]; then
    echo "ERROR: No .upstream file found in $EXT_PATH"
    exit 1
fi

# Source the upstream file
source "$EXT_PATH/.upstream"

echo "=== Applying Upstream Changes ==="
echo ""
echo "Extension: $EXTENSION"
echo "Upstream: $UPSTREAM_PATH"
echo "Last synced: ${LAST_SYNCED_COMMIT:0:12}"
echo ""

# Update upstream cache
cd "$UPSTREAM_CACHE"
git sparse-checkout add "$UPSTREAM_PATH" 2>/dev/null || true
git fetch origin main --quiet

# Get latest commit
LATEST_COMMIT=$(git log -1 --format="%H" origin/main -- "$UPSTREAM_PATH")

if [ "$LATEST_COMMIT" = "$LAST_SYNCED_COMMIT" ]; then
    echo "Already up to date!"
    exit 0
fi

echo "Upstream has changes: ${LAST_SYNCED_COMMIT:0:12} → ${LATEST_COMMIT:0:12}"
echo ""

# Show what's changed
echo "Changes to apply:"
git log --oneline "${LAST_SYNCED_COMMIT}..origin/main" -- "$UPSTREAM_PATH"
echo ""

# Create patch file
PATCH_FILE="$EXT_PATH/upstream-${LATEST_COMMIT:0:12}.patch"
echo "Creating patch: $PATCH_FILE"
git diff "$LAST_SYNCED_COMMIT..origin/main" -- "$UPSTREAM_PATH" > "$PATCH_FILE"

if [ ! -s "$PATCH_FILE" ]; then
    echo "No file changes detected (might be commit messages only)"
    rm "$PATCH_FILE"

    # Update tracking anyway
    TODAY=$(date +%Y-%m-%d)
    sed -i.bak "s/LAST_SYNCED_COMMIT=.*/LAST_SYNCED_COMMIT=$LATEST_COMMIT/" "$EXT_PATH/.upstream"
    sed -i.bak "s/LAST_SYNC_CHECK=.*/LAST_SYNC_CHECK=$TODAY/" "$EXT_PATH/.upstream"
    rm -f "$EXT_PATH/.upstream.bak"
    exit 0
fi

echo ""
echo "Attempting to apply patch..."
echo ""

cd "$EXT_PATH"

# Calculate the strip level for patch
# Upstream path is like "extensions/linear", so we need -p2 to strip that
STRIP_LEVEL=2

# Try to apply
if patch -p$STRIP_LEVEL --dry-run < "$PATCH_FILE" > /dev/null 2>&1; then
    echo "Patch applies cleanly!"
    read -p "Apply now? [y/N] " confirm

    if [[ "$confirm" =~ ^[Yy]$ ]]; then
        patch -p$STRIP_LEVEL < "$PATCH_FILE"

        # Update tracking
        TODAY=$(date +%Y-%m-%d)
        sed -i.bak "s/LAST_SYNCED_COMMIT=.*/LAST_SYNCED_COMMIT=$LATEST_COMMIT/" ".upstream"
        sed -i.bak "s/LAST_SYNC_CHECK=.*/LAST_SYNC_CHECK=$TODAY/" ".upstream"
        sed -i.bak "s/SYNC_NOTES=.*/SYNC_NOTES=Synced on $TODAY/" ".upstream"
        rm -f ".upstream.bak"

        echo ""
        echo "✅ Patch applied successfully!"
        echo ""
        echo "Next steps:"
        echo "  1. Review the changes: git diff"
        echo "  2. Test the extension: npm run dev"
        echo "  3. Update MODS.md with sync info"
        echo "  4. Delete the patch file: rm $PATCH_FILE"
    else
        echo "Cancelled. Patch file saved at: $PATCH_FILE"
    fi
else
    echo "⚠️  Patch has conflicts!"
    echo ""
    echo "Manual steps required:"
    echo "  1. Review the patch: less $PATCH_FILE"
    echo "  2. Apply manually or use: patch -p$STRIP_LEVEL < $PATCH_FILE"
    echo "  3. Resolve conflicts in .rej files"
    echo "  4. Update .upstream with new LAST_SYNCED_COMMIT"
    echo ""
    echo "Showing conflicts:"
    patch -p$STRIP_LEVEL --dry-run < "$PATCH_FILE" 2>&1 || true
fi
