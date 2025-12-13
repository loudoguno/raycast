#!/bin/bash
# test-fetch.sh - Test fetching Claude usage via Safari automation
#
# Prerequisites:
# 1. Safari must have "Allow JavaScript from Apple Events" enabled
#    Safari > Settings > Advanced > "Show features for web developers"
#    Then: Develop menu > Allow JavaScript from Apple Events
# 2. You must be logged into claude.ai in Safari

echo "Fetching Claude usage data via Safari..."
echo "Make sure you're logged into claude.ai in Safari"
echo ""

osascript <<'EOF'
tell application "Safari"
    -- Check if there's already a tab with claude.ai/settings
    set foundTab to false
    set targetURL to "https://claude.ai/settings/usage"

    repeat with w in windows
        repeat with t in tabs of w
            if URL of t contains "claude.ai/settings" then
                set current tab of w to t
                set foundTab to true
                exit repeat
            end if
        end repeat
        if foundTab then exit repeat
    end repeat

    if not foundTab then
        -- Open new tab with usage page
        tell window 1
            set current tab to (make new tab with properties {URL:targetURL})
        end tell
    end if

    activate

    -- Wait for page to load
    delay 3

    -- Extract usage data from the page
    set usageText to do JavaScript "
        const getText = () => {
            const body = document.body.innerText;
            // Look for usage percentages
            const lines = body.split('\\n').filter(l =>
                l.includes('% used') ||
                l.includes('Resets') ||
                l.includes('session') ||
                l.includes('Weekly') ||
                l.includes('models')
            );
            return lines.join('\\n');
        };
        getText();
    " in document 1

    return usageText
end tell
EOF

echo ""
echo "--- Raw output above ---"
