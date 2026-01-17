#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Chezmoi Update
# @raycast.mode fullOutput

# Optional parameters:
# @raycast.icon :package:
# @raycast.packageName Dotfiles
# @raycast.argument1 { "type": "text", "placeholder": "action (check/update)", "optional": true }

# Documentation:
# @raycast.description Check for and apply chezmoi dotfile updates
# @raycast.author loudog
# @raycast.authorURL https://github.com/loudoguno

STATUS_FILE="$HOME/.local/share/chezmoi-sync-status"
CHEZMOI_DIR="$HOME/.local/share/chezmoi"
ACTION="${1:-check}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

check_status() {
    cd "$CHEZMOI_DIR" || exit 1

    echo "Fetching latest from remote..."
    git fetch origin 2>/dev/null

    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse origin/main)

    if [[ "$LOCAL" != "$REMOTE" ]]; then
        BEHIND_COUNT=$(git rev-list HEAD..origin/main --count)
        echo ""
        echo -e "${YELLOW}Updates available!${NC}"
        echo "You are $BEHIND_COUNT commit(s) behind."
        echo ""
        echo "Recent changes:"
        git log HEAD..origin/main --oneline | head -5
        echo ""
        echo "Run with 'update' argument to apply, or run: chezmoi update"
    else
        echo ""
        echo -e "${GREEN}Already up to date!${NC}"
        if [[ -f "$STATUS_FILE" ]]; then
            LAST_CHECK=$(grep "checked_at" "$STATUS_FILE" | cut -d= -f2)
            echo "Last check: $LAST_CHECK"
        fi
    fi
}

apply_update() {
    echo "Applying chezmoi updates..."
    echo ""

    cd "$CHEZMOI_DIR" || exit 1

    # Show what will change
    echo "Changes to apply:"
    chezmoi diff --no-pager 2>/dev/null | head -30

    echo ""
    echo "Running chezmoi update..."

    if chezmoi update --apply; then
        echo ""
        echo -e "${GREEN}Update complete!${NC}"

        # Update status file
        echo "up_to_date" > "$STATUS_FILE"
        echo "checked_at=$(date '+%Y-%m-%d %H:%M:%S')" >> "$STATUS_FILE"
        echo "last_update=$(date '+%Y-%m-%d %H:%M:%S')" >> "$STATUS_FILE"
    else
        echo ""
        echo -e "${RED}Update failed!${NC}"
        echo "Check the output above for errors."
        exit 1
    fi
}

case "$ACTION" in
    check|c|"")
        check_status
        ;;
    update|u|apply|a)
        apply_update
        ;;
    *)
        echo "Usage: chezmoi-update.sh [check|update]"
        echo ""
        echo "  check  - Check for available updates (default)"
        echo "  update - Apply pending updates"
        exit 1
        ;;
esac
