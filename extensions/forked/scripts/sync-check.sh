#!/bin/bash
# sync-check.sh - Check for upstream changes to forked extensions
#
# Usage: ./sync-check.sh [extension-name]
# Example: ./sync-check.sh linear-custom
# Example: ./sync-check.sh (checks all forks)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FORKED_DIR="$(dirname "$SCRIPT_DIR")"
UPSTREAM_CACHE="$FORKED_DIR/.upstream-cache"
EXTENSION="${1:-}"

check_extension() {
    local ext_dir="$1"
    local ext_name=$(basename "$ext_dir")

    if [ ! -f "$ext_dir/.upstream" ]; then
        echo "  ⚠️  No .upstream file found, skipping"
        return
    fi

    # Source the upstream file
    source "$ext_dir/.upstream"

    echo "  Upstream: $UPSTREAM_PATH"
    echo "  Forked from: ${FORKED_FROM_COMMIT:0:12}"
    echo "  Last sync: $LAST_SYNC_CHECK"

    # Update upstream cache
    cd "$UPSTREAM_CACHE"
    git sparse-checkout add "$UPSTREAM_PATH" 2>/dev/null || true
    git fetch origin main --quiet

    # Get latest upstream commit for this extension
    LATEST_COMMIT=$(git log -1 --format="%H" origin/main -- "$UPSTREAM_PATH")
    LATEST_DATE=$(git log -1 --format="%ci" origin/main -- "$UPSTREAM_PATH")

    if [ "$LATEST_COMMIT" = "$LAST_SYNCED_COMMIT" ]; then
        echo "  ✅ Up to date!"
    else
        echo "  ⚡ Updates available!"
        echo ""
        echo "  Latest upstream: ${LATEST_COMMIT:0:12} ($LATEST_DATE)"
        echo ""
        echo "  Changes since your fork:"
        git log --oneline "${LAST_SYNCED_COMMIT}..origin/main" -- "$UPSTREAM_PATH" | head -10

        CHANGE_COUNT=$(git log --oneline "${LAST_SYNCED_COMMIT}..origin/main" -- "$UPSTREAM_PATH" | wc -l | tr -d ' ')
        if [ "$CHANGE_COUNT" -gt 10 ]; then
            echo "  ... and $((CHANGE_COUNT - 10)) more commits"
        fi

        echo ""
        echo "  To see full diff:"
        echo "    cd $UPSTREAM_CACHE"
        echo "    git diff ${LAST_SYNCED_COMMIT:0:12}..origin/main -- $UPSTREAM_PATH"
    fi

    # Update last sync check date
    TODAY=$(date +%Y-%m-%d)
    sed -i.bak "s/LAST_SYNC_CHECK=.*/LAST_SYNC_CHECK=$TODAY/" "$ext_dir/.upstream"
    rm -f "$ext_dir/.upstream.bak"
}

echo "=== Raycast Fork Sync Checker ==="
echo ""

# Ensure upstream cache exists
if [ ! -d "$UPSTREAM_CACHE" ]; then
    echo "Setting up upstream cache..."
    git clone --filter=blob:none --sparse https://github.com/raycast/extensions.git "$UPSTREAM_CACHE"
    cd "$UPSTREAM_CACHE"
    git sparse-checkout init --cone
fi

if [ -n "$EXTENSION" ]; then
    # Check specific extension
    EXT_PATH="$FORKED_DIR/$EXTENSION"
    if [ ! -d "$EXT_PATH" ]; then
        echo "ERROR: Extension '$EXTENSION' not found at $EXT_PATH"
        exit 1
    fi
    echo "Checking: $EXTENSION"
    check_extension "$EXT_PATH"
else
    # Check all forked extensions
    for dir in "$FORKED_DIR"/*/; do
        dir_name=$(basename "$dir")
        # Skip template and scripts
        if [[ "$dir_name" == "_template" ]] || [[ "$dir_name" == "scripts" ]] || [[ "$dir_name" == ".upstream-cache" ]]; then
            continue
        fi

        if [ -f "$dir/.upstream" ]; then
            echo "Checking: $dir_name"
            check_extension "$dir"
            echo ""
        fi
    done
fi

echo "=== Done ==="
