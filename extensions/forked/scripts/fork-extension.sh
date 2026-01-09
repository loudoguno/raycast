#!/bin/bash
# fork-extension.sh - Helper script for forking Raycast extensions
#
# Usage: ./fork-extension.sh <extension-name> [custom-suffix]
# Example: ./fork-extension.sh linear
# Example: ./fork-extension.sh obsidian my-obsidian

set -e

EXTENSION_NAME="${1:-}"
CUSTOM_SUFFIX="${2:-custom}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FORKED_DIR="$(dirname "$SCRIPT_DIR")"
UPSTREAM_CACHE="$FORKED_DIR/.upstream-cache"

if [ -z "$EXTENSION_NAME" ]; then
    echo "Usage: $0 <extension-name> [custom-suffix]"
    echo ""
    echo "Available extensions can be found at:"
    echo "  https://github.com/raycast/extensions/tree/main/extensions"
    echo ""
    echo "Examples:"
    echo "  $0 linear"
    echo "  $0 obsidian my-obsidian"
    echo "  $0 roam-research"
    exit 1
fi

CUSTOM_NAME="${EXTENSION_NAME}-${CUSTOM_SUFFIX}"
TARGET_DIR="$FORKED_DIR/$CUSTOM_NAME"

echo "=== Raycast Extension Fork Script ==="
echo ""
echo "Extension: $EXTENSION_NAME"
echo "Custom Name: $CUSTOM_NAME"
echo "Target: $TARGET_DIR"
echo ""

# Check if target already exists
if [ -d "$TARGET_DIR" ]; then
    echo "ERROR: $TARGET_DIR already exists"
    echo "Remove it first or choose a different suffix"
    exit 1
fi

# Set up upstream cache if not exists
if [ ! -d "$UPSTREAM_CACHE" ]; then
    echo "Setting up upstream cache (first run, this may take a moment)..."
    git clone --filter=blob:none --sparse https://github.com/raycast/extensions.git "$UPSTREAM_CACHE"
    cd "$UPSTREAM_CACHE"
    git sparse-checkout init --cone
fi

cd "$UPSTREAM_CACHE"

# Add the extension to sparse checkout
echo "Fetching extension from upstream..."
git sparse-checkout add "extensions/$EXTENSION_NAME"
git pull origin main

# Check if extension exists
if [ ! -d "extensions/$EXTENSION_NAME" ]; then
    echo "ERROR: Extension '$EXTENSION_NAME' not found in upstream"
    echo "Check the name at: https://github.com/raycast/extensions/tree/main/extensions"
    exit 1
fi

# Get current commit
UPSTREAM_COMMIT=$(git rev-parse HEAD)
FORK_DATE=$(date +%Y-%m-%d)

# Copy extension
echo "Copying extension to $TARGET_DIR..."
cp -r "extensions/$EXTENSION_NAME" "$TARGET_DIR"

# Get original author from package.json
cd "$TARGET_DIR"
ORIGINAL_AUTHOR=$(grep -o '"author": *"[^"]*"' package.json | head -1 | sed 's/"author": *"\([^"]*\)"/\1/')

# Create .upstream tracking file
cat > .upstream << EOF
# Upstream Tracking File
UPSTREAM_REPO=https://github.com/raycast/extensions
UPSTREAM_PATH=extensions/$EXTENSION_NAME
FORKED_FROM_COMMIT=$UPSTREAM_COMMIT
FORKED_DATE=$FORK_DATE
LAST_SYNC_CHECK=$FORK_DATE
LAST_SYNCED_COMMIT=$UPSTREAM_COMMIT
SYNC_NOTES=Initial fork
EOF

# Create MODS.md from template
cat > MODS.md << EOF
# $CUSTOM_NAME - Modifications

## Fork Information

| Field | Value |
|-------|-------|
| **Original Extension** | $EXTENSION_NAME |
| **Original Author** | $ORIGINAL_AUTHOR |
| **Fork Date** | $FORK_DATE |
| **Upstream Commit** | $UPSTREAM_COMMIT |
| **Raycast Store URL** | https://raycast.com/$ORIGINAL_AUTHOR/$EXTENSION_NAME |

---

## Customizations

### Keyboard Shortcuts

| Command | Original | Custom | Notes |
|---------|----------|--------|-------|
| | | | |

### UI/Aesthetic Changes

- [ ] (Add your UI customizations here)

### Feature Additions

- [ ] (Add new features here)

### Feature Modifications

- [ ] (Document modified features here)

### Feature Removals

- [ ] (Document removed features here)

---

## Files Modified

\`\`\`
(List files you've modified here)
\`\`\`

---

## Sync History

| Date | Upstream Commit | Changes Merged | Conflicts |
|------|-----------------|----------------|-----------|
| $FORK_DATE | ${UPSTREAM_COMMIT:0:12} | Initial fork | N/A |

---

## Testing Notes

- [ ] All commands working
- [ ] Auth flows tested (if applicable)
EOF

# Modify package.json to make it unique
echo "Updating package.json identity..."
if command -v jq &> /dev/null; then
    # Use jq if available
    jq --arg name "$CUSTOM_NAME" \
       --arg title "$(jq -r '.title' package.json) (Custom)" \
       '.name = $name | .title = $title' package.json > package.json.tmp
    mv package.json.tmp package.json
else
    # Fallback to sed
    sed -i.bak "s/\"name\": *\"[^\"]*\"/\"name\": \"$CUSTOM_NAME\"/" package.json
    sed -i.bak 's/"title": *"\([^"]*\)"/"title": "\1 (Custom)"/' package.json
    rm -f package.json.bak
fi

echo ""
echo "=== Fork Complete ==="
echo ""
echo "Next steps:"
echo "  1. cd $TARGET_DIR"
echo "  2. npm install"
echo "  3. npm run dev"
echo ""
echo "Your forked extension will appear in Raycast as:"
echo "  $(grep -o '"title": *"[^"]*"' package.json | head -1 | sed 's/"title": *"\([^"]*\)"/\1/')"
echo ""
echo "Edit MODS.md to track your customizations!"
