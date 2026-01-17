#!/bin/bash

# generate-claude-built-registry
# Scans Claude-built artifacts and generates registry JSON
#
# Sources scanned:
#   - ~/.claude/skills/*/SKILL.md (PAI skills)
#   - ~/aia/bin/* (CLI tools)
#   - ~/aia/tools.yml (aia tool definitions)
#   - ~/code/raycast/scripts/pai/*.sh (Raycast scripts)
#   - ~/.zshrc aliases

set -e

PAI_DIR="${PAI_DIR:-$HOME/.claude}"
REGISTRY_FILE="$PAI_DIR/claude-built-registry.json"
USAGE_FILE="$PAI_DIR/claude-built-usage.json"

# Ensure jq is available
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required but not installed"
    exit 1
fi

# Initialize items array
items="[]"

# Helper to get file creation date (macOS)
get_created_date() {
    stat -f "%SB" -t "%Y-%m-%dT%H:%M:%SZ" "$1" 2>/dev/null || echo "1970-01-01T00:00:00Z"
}

# Helper to get file modification date (macOS)
get_modified_date() {
    stat -f "%Sm" -t "%Y-%m-%dT%H:%M:%SZ" "$1" 2>/dev/null || echo "1970-01-01T00:00:00Z"
}

# Helper to add item to array
add_item() {
    local json="$1"
    items=$(echo "$items" | jq --argjson item "$json" '. + [$item]')
}

# ============================================
# SCAN SKILLS
# ============================================
echo "Scanning skills..."
for skill_dir in "$PAI_DIR"/skills/*/; do
    skill_md="$skill_dir/SKILL.md"
    if [[ -f "$skill_md" ]]; then
        # Extract YAML frontmatter (between first and second ---)
        frontmatter=$(awk '/^---$/{if(++c==1)next; if(c==2)exit}c==1' "$skill_md")

        name=$(echo "$frontmatter" | grep -E "^name:" | sed 's/^name:[[:space:]]*//' | tr -d '"')
        desc=$(echo "$frontmatter" | grep -E "^description:" | sed 's/^description:[[:space:]]*//' | tr -d '"')

        if [[ -n "$name" ]]; then
            id="skill-$(echo "$name" | tr '[:upper:]' '[:lower:]')"
            trigger="/$name"
            created=$(get_created_date "$skill_md")
            updated=$(get_modified_date "$skill_md")

            # Extract tags from description (words after USE WHEN)
            tags=$(echo "$desc" | sed -n 's/.*USE WHEN[[:space:]]*//p' | tr ',' '\n' | tr ' ' '\n' | grep -E '^[a-z]+$' | head -5 | jq -R -s 'split("\n") | map(select(length > 0))')
            [[ -z "$tags" || "$tags" == "[]" ]] && tags='["skill"]'

            item=$(jq -n \
                --arg id "$id" \
                --arg name "$name" \
                --arg desc "$desc" \
                --arg path "$skill_md" \
                --arg trigger "$trigger" \
                --arg created "$created" \
                --arg updated "$updated" \
                --argjson tags "$tags" \
                '{
                    id: $id,
                    type: "skill",
                    name: $name,
                    description: $desc,
                    path: $path,
                    trigger: $trigger,
                    created_at: $created,
                    updated_at: $updated,
                    tags: $tags,
                    execution: {
                        type: "terminal",
                        command: ("cd ~/.claude && claude -p " + $trigger)
                    }
                }')
            add_item "$item"
            echo "  + Skill: $name"
        fi
    fi
done

# ============================================
# SCAN CLI TOOLS (~/aia/bin)
# ============================================
echo "Scanning CLI tools..."
for tool in "$HOME"/aia/bin/*; do
    if [[ -x "$tool" && -f "$tool" ]]; then
        name=$(basename "$tool")

        # Try to extract description from header comment
        desc=$(head -10 "$tool" | grep -E "^#[[:space:]]+" | grep -iv "#!/" | head -1 | sed 's/^#[[:space:]]*//')
        [[ -z "$desc" ]] && desc="CLI tool: $name"

        created=$(get_created_date "$tool")
        updated=$(get_modified_date "$tool")
        id="cli-$name"

        item=$(jq -n \
            --arg id "$id" \
            --arg name "$name" \
            --arg desc "$desc" \
            --arg path "$tool" \
            --arg created "$created" \
            --arg updated "$updated" \
            '{
                id: $id,
                type: "cli",
                name: $name,
                description: $desc,
                path: $path,
                created_at: $created,
                updated_at: $updated,
                tags: ["cli", "terminal"],
                execution: {
                    type: "terminal",
                    command: $path
                }
            }')
        add_item "$item"
        echo "  + CLI: $name"
    fi
done

# ============================================
# SCAN tools.yml
# ============================================
echo "Scanning tools.yml..."
TOOLS_YML="$HOME/aia/tools.yml"
if [[ -f "$TOOLS_YML" ]]; then
    created=$(get_created_date "$TOOLS_YML")
    updated=$(get_modified_date "$TOOLS_YML")

    # Parse tools.yml (simple format: name: + desc: + cmd:)
    current_tool=""
    current_desc=""
    current_cmd=""

    while IFS= read -r line; do
        # Skip comments and empty lines
        [[ "$line" =~ ^[[:space:]]*# ]] && continue
        [[ -z "${line// }" ]] && continue

        # Tool name line
        if [[ "$line" =~ ^([a-zA-Z][a-zA-Z0-9_-]*):$ ]]; then
            # Save previous tool if exists
            if [[ -n "$current_tool" && -n "$current_cmd" ]]; then
                id="tool-$current_tool"
                item=$(jq -n \
                    --arg id "$id" \
                    --arg name "$current_tool" \
                    --arg desc "${current_desc:-Tool: $current_tool}" \
                    --arg path "$TOOLS_YML" \
                    --arg created "$created" \
                    --arg updated "$updated" \
                    --arg cmd "$current_cmd" \
                    '{
                        id: $id,
                        type: "tool",
                        name: ("aia " + $name),
                        description: $desc,
                        path: $path,
                        created_at: $created,
                        updated_at: $updated,
                        tags: ["aia", "tool"],
                        execution: {
                            type: "terminal",
                            command: ("aia " + $name)
                        }
                    }')
                add_item "$item"
                echo "  + Tool: aia $current_tool"
            fi
            current_tool="${BASH_REMATCH[1]}"
            current_desc=""
            current_cmd=""
        elif [[ "$line" =~ ^[[:space:]]+desc:[[:space:]]*(.+)$ ]]; then
            current_desc="${BASH_REMATCH[1]}"
        elif [[ "$line" =~ ^[[:space:]]+cmd:[[:space:]]*(.+)$ ]]; then
            current_cmd="${BASH_REMATCH[1]}"
        fi
    done < "$TOOLS_YML"

    # Save last tool
    if [[ -n "$current_tool" && -n "$current_cmd" ]]; then
        id="tool-$current_tool"
        item=$(jq -n \
            --arg id "$id" \
            --arg name "$current_tool" \
            --arg desc "${current_desc:-Tool: $current_tool}" \
            --arg path "$TOOLS_YML" \
            --arg created "$created" \
            --arg cmd "$current_cmd" \
            '{
                id: $id,
                type: "tool",
                name: ("aia " + $name),
                description: $desc,
                path: $path,
                created_at: $created,
                tags: ["aia", "tool"],
                execution: {
                    type: "terminal",
                    command: ("aia " + $name)
                }
            }')
        add_item "$item"
        echo "  + Tool: aia $current_tool"
    fi
fi

# ============================================
# SCAN RAYCAST SCRIPTS
# ============================================
echo "Scanning Raycast scripts..."
RAYCAST_DIR="$HOME/code/raycast/scripts/pai"
if [[ -d "$RAYCAST_DIR" ]]; then
    for script in "$RAYCAST_DIR"/*.sh; do
        if [[ -f "$script" ]]; then
            name=$(basename "$script" .sh)

            # Extract raycast metadata
            title=$(grep -E "@raycast.title" "$script" | sed 's/.*@raycast.title[[:space:]]*//' | head -1)
            desc=$(grep -E "@raycast.description" "$script" | sed 's/.*@raycast.description[[:space:]]*//' | head -1)

            [[ -z "$title" ]] && title="$name"
            [[ -z "$desc" ]] && desc="Raycast script: $name"

            created=$(get_created_date "$script")
            updated=$(get_modified_date "$script")
            id="raycast-$name"

            # Build deeplink (raycast script command format)
            deeplink="raycast://script-commands/$name"

            item=$(jq -n \
                --arg id "$id" \
                --arg name "$title" \
                --arg desc "$desc" \
                --arg path "$script" \
                --arg created "$created" \
                --arg updated "$updated" \
                --arg deeplink "$deeplink" \
                '{
                    id: $id,
                    type: "raycast",
                    name: $name,
                    description: $desc,
                    path: $path,
                    created_at: $created,
                    updated_at: $updated,
                    tags: ["raycast", "pai"],
                    execution: {
                        type: "raycast-deeplink",
                        deeplink: $deeplink
                    }
                }')
            add_item "$item"
            echo "  + Raycast: $title"
        fi
    done
fi

# ============================================
# SCAN ALIASES
# ============================================
echo "Scanning shell aliases..."
if [[ -f "$HOME/.zshrc" ]]; then
    created=$(get_created_date "$HOME/.zshrc")
    updated=$(get_modified_date "$HOME/.zshrc")

    while IFS= read -r line; do
        if [[ "$line" =~ ^alias[[:space:]]+([^=]+)=[\'\"]*(.+)[\'\"]*$ ]]; then
            name="${BASH_REMATCH[1]}"
            cmd="${BASH_REMATCH[2]}"
            # Clean up quotes
            cmd="${cmd%\"}"
            cmd="${cmd%\'}"
            cmd="${cmd#\"}"
            cmd="${cmd#\'}"

            id="alias-$name"

            item=$(jq -n \
                --arg id "$id" \
                --arg name "$name" \
                --arg desc "$cmd" \
                --arg path "$HOME/.zshrc" \
                --arg created "$created" \
                --arg updated "$updated" \
                --arg cmd "$cmd" \
                '{
                    id: $id,
                    type: "alias",
                    name: $name,
                    description: $desc,
                    path: $path,
                    created_at: $created,
                    updated_at: $updated,
                    tags: ["alias", "shell"],
                    execution: {
                        type: "terminal",
                        command: $cmd
                    }
                }')
            add_item "$item"
            echo "  + Alias: $name"
        fi
    done < <(grep -E "^alias " "$HOME/.zshrc")
fi

# ============================================
# MERGE WITH USAGE DATA
# ============================================
if [[ -f "$USAGE_FILE" ]]; then
    echo "Merging usage data..."
    items=$(echo "$items" | jq --slurpfile usage "$USAGE_FILE" '
        map(. + (($usage[0][.id] // {}) | {last_used: .last_used, use_count: .use_count}))
        | map(. + {last_used: (.last_used // .created_at), use_count: (.use_count // 0)})
    ')
else
    # Initialize with defaults
    items=$(echo "$items" | jq 'map(. + {last_used: .created_at, use_count: 0})')
fi

# ============================================
# GENERATE REGISTRY
# ============================================
timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
count=$(echo "$items" | jq 'length')

registry=$(jq -n \
    --arg version "1.0" \
    --arg generated "$timestamp" \
    --argjson items "$items" \
    '{
        version: $version,
        generated_at: $generated,
        items: $items
    }')

echo "$registry" > "$REGISTRY_FILE"

echo ""
echo "Registry generated: $REGISTRY_FILE"
echo "Total items: $count"
