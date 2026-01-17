#!/bin/bash
# Auto-generates README.md from script metadata
# Called by pre-push hook

SCRIPTS_DIR="$(dirname "$0")/.."
README="$SCRIPTS_DIR/README.md"

cat > "$README" << 'HEADER'
# Raycast Scripts

Custom Raycast script commands for quick actions and automation.

## Scripts Index

| Script | Title | Description |
|--------|-------|-------------|
HEADER

# Parse each script and extract metadata
for script in "$SCRIPTS_DIR"/*.sh "$SCRIPTS_DIR"/*.applescript; do
  [[ -f "$script" ]] || continue
  filename=$(basename "$script")

  # Extract title and description, handling various formats
  title=$(grep -m1 '@raycast.title' "$script" 2>/dev/null | sed 's/.*@raycast.title[[:space:]]*//' | tr -d '\r')
  description=$(grep -m1 '@raycast.description' "$script" 2>/dev/null | sed 's/.*@raycast.description[[:space:]]*//' | tr -d '\r')

  # Skip if no title found
  [[ -z "$title" ]] && continue

  # Clean up description - default if empty or just whitespace
  description=$(echo "$description" | xargs)
  [[ -z "$description" || "$description" == "-" || ${#description} -lt 3 ]] && description="-"

  echo "| \`$filename\` | $title | $description |" >> "$README"
done

cat >> "$README" << FOOTER

## Adding New Scripts

1. Create your script in this directory
2. Include Raycast metadata comments at the top
3. Make executable: \`chmod +x your-script.sh\`
4. The README will be auto-updated before push

---
*Last updated: $(date +%Y-%m-%d)*
FOOTER

echo "README.md updated"
