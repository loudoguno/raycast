#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Keybinding Cheatsheet
# @raycast.mode silent

# Optional parameters:
# @raycast.icon ⌨️
# @raycast.packageName Keybindings

# Documentation:
# @raycast.description Open keybinding cheatsheet generated from registry
# @raycast.author Lou DeSantis

REPO_DIR="$HOME/keybindings"
REGISTRY="$REPO_DIR/registry/keybindings.json"
OUTPUT="/tmp/keybinding-cheatsheet.html"

if [ ! -f "$REGISTRY" ]; then
  echo "Registry not found at $REGISTRY"
  exit 1
fi

# Generate HTML cheatsheet from registry JSON
jq -r '
def category_icon:
  if . == "simultaneous" then "⚡"
  elif . == "simlayer" then "🔲"
  elif . == "layer" then "📐"
  elif . == "text" then "📝"
  elif . == "sidecar" then "📱"
  else "⌨️"
  end;

def categorize:
  if (.id | test("sidecar")) then "Sidecar Workarounds"
  elif (.id | test("^sim-")) then "Simultaneous Keys"
  elif (.keys | test("^[a-z]\\+[a-z]$")) then "Simlayers (hold first key)"
  elif (.id | test("capslock")) then "Capslock Layer"
  elif (.id | test("^slash-")) then "Slash Sublayer"
  elif (.id | test("^x-")) then "X Mode"
  elif (.tool == "defaultkeybinding") then "Text Editing (Cocoa)"
  elif (.id | test("semicolon|tab-right")) then "Fast Search Layers"
  else "Other"
  end;

"<!DOCTYPE html>
<html>
<head>
<meta charset=\"utf-8\">
<title>Keybinding Cheatsheet</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, \"SF Mono\", Menlo, monospace;
    background: #1a1b26;
    color: #a9b1d6;
    padding: 20px;
    font-size: 13px;
  }
  h1 {
    color: #7aa2f7;
    font-size: 18px;
    margin-bottom: 4px;
    letter-spacing: 1px;
  }
  .subtitle {
    color: #565f89;
    font-size: 11px;
    margin-bottom: 16px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 12px;
  }
  .category {
    background: #24283b;
    border-radius: 8px;
    padding: 12px;
    border: 1px solid #2f3549;
  }
  .category h2 {
    color: #bb9af7;
    font-size: 13px;
    margin-bottom: 8px;
    padding-bottom: 4px;
    border-bottom: 1px solid #2f3549;
  }
  .binding {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 3px 0;
    border-bottom: 1px solid #1a1b26;
  }
  .binding:last-child { border-bottom: none; }
  .keys {
    background: #2f3549;
    color: #7dcfff;
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 600;
    font-size: 12px;
    white-space: nowrap;
    min-width: 80px;
    text-align: center;
  }
  .action {
    color: #c0caf5;
    font-size: 12px;
    text-align: right;
    flex: 1;
    margin-left: 12px;
  }
  .sidecar .keys { color: #ff9e64; }
  .footer {
    text-align: center;
    color: #565f89;
    font-size: 10px;
    margin-top: 12px;
  }
</style>
</head>
<body>
<h1>KEYBINDING CHEATSHEET</h1>
<div class=\"subtitle\">Generated from registry/keybindings.json \u2022 " + (now | strftime("%Y-%m-%d %H:%M")) + "</div>
<div class=\"grid\">" +

# Group by category and render
([.keybindings[] | {binding: ., cat: categorize}] | group_by(.cat) | sort_by(.[0].cat) |
  map(
    "<div class=\"category\">" +
    "<h2>" + .[0].cat + " (" + (length | tostring) + ")</h2>" +
    ([.[] |
      "<div class=\"binding" + (if (.binding.id | test("sidecar")) then " sidecar" else "" end) + "\">" +
      "<span class=\"keys\">" + .binding.keys + "</span>" +
      "<span class=\"action\">" + (.binding.action | gsub(" \\(Sidecar workaround\\)"; "") | gsub(" \\(sidecar workaround\\)"; "")) + "</span>" +
      "</div>"
    ] | join("")) +
    "</div>"
  ) | join("")) +

"</div>
<div class=\"footer\">x+/ to open \u2022 \u2318W to close \u2022 ~/keybindings/registry/keybindings.json</div>
</body>
</html>"
' "$REGISTRY" > "$OUTPUT"

open "$OUTPUT"
