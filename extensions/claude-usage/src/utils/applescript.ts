import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface UsageResult {
  currentSession: {
    usedPercentage: number | null;
    resetsIn: string | null;
  };
  weekly: {
    allModels: {
      usedPercentage: number | null;
      resetsAt: string | null;
    };
    sonnet: {
      usedPercentage: number | null;
      resetsAt: string | null;
    };
  };
  error?: string;
}

// Quiet mode: only reads from existing tab, never opens Safari or creates tabs
const APPLESCRIPT_QUIET = `
-- AppleScript to fetch Claude usage from Safari (quiet mode - no new windows)
-- Requires: Safari > Develop > Allow JavaScript from Apple Events

tell application "System Events"
    if not (exists process "Safari") then
        return "NO_SAFARI"
    end if
end tell

tell application "Safari"
    -- Look for existing Claude usage tab
    set foundTab to missing value

    repeat with w in windows
        repeat with t in tabs of w
            if URL of t contains "claude.ai/settings/usage" then
                set foundTab to t
                exit repeat
            end if
        end repeat
        if foundTab is not missing value then exit repeat
    end repeat

    -- If no existing tab, return without opening anything
    if foundTab is missing value then
        return "NO_TAB"
    end if

    -- Extract usage data using JavaScript
    set jsCode to "
    (function() {
        try {
            const bodyText = document.body.innerText;

            // Parse current session
            const sessionMatch = bodyText.match(/Current session[\\\\s\\\\S]*?Resets in ([^\\\\n]+)[\\\\s\\\\S]*?(\\\\d+)% used/i);

            // Parse all models
            const allModelsMatch = bodyText.match(/All models[\\\\s\\\\S]*?Resets ([^\\\\n]+)[\\\\s\\\\S]*?(\\\\d+)% used/i);

            // Parse sonnet
            const sonnetMatch = bodyText.match(/Sonnet only[\\\\s\\\\S]*?Resets ([^\\\\n]+)[\\\\s\\\\S]*?(\\\\d+)% used/i);

            return JSON.stringify({
                currentSession: sessionMatch ? {
                    resetsIn: sessionMatch[1].trim(),
                    percentage: parseInt(sessionMatch[2])
                } : null,
                allModels: allModelsMatch ? {
                    resetsAt: allModelsMatch[1].trim(),
                    percentage: parseInt(allModelsMatch[2])
                } : null,
                sonnet: sonnetMatch ? {
                    resetsAt: sonnetMatch[1].trim(),
                    percentage: parseInt(sonnetMatch[2])
                } : null
            });
        } catch (e) {
            return JSON.stringify({ error: e.message });
        }
    })();
    "

    try
        set result to do JavaScript jsCode in foundTab
        return result
    on error errMsg
        return "ERROR: " & errMsg
    end try
end tell
`;

// Interactive mode: will open Safari and create tab if needed
const APPLESCRIPT_INTERACTIVE = `
-- AppleScript to fetch Claude usage from Safari
-- Requires: Safari > Develop > Allow JavaScript from Apple Events

tell application "Safari"
    -- Check if Safari is running
    if not running then
        activate
        delay 1
    end if

    -- Look for existing Claude usage tab
    set foundTab to missing value
    set targetURL to "https://claude.ai/settings/usage"

    repeat with w in windows
        repeat with t in tabs of w
            if URL of t contains "claude.ai/settings/usage" then
                set foundTab to t
                exit repeat
            end if
        end repeat
        if foundTab is not missing value then exit repeat
    end repeat

    -- If no existing tab, create a new one in a new window (less disruptive)
    set createdNewTab to false
    if foundTab is missing value then
        -- Check if any window exists
        if (count of windows) is 0 then
            make new document with properties {URL:targetURL}
            set foundTab to current tab of front window
        else
            -- Create tab in last window to be less disruptive
            tell last window
                set newTab to make new tab with properties {URL:targetURL}
                set foundTab to newTab
            end tell
        end if
        set createdNewTab to true
        -- Wait for page to load
        delay 3
    end if

    -- Wait for page to be fully loaded
    repeat 30 times
        try
            set pageReady to do JavaScript "document.readyState" in foundTab
            if pageReady is "complete" then exit repeat
        end try
        delay 0.5
    end repeat

    -- Extra delay to ensure React has rendered
    delay 0.5

    -- Extract usage data using JavaScript
    set jsCode to "
    (function() {
        try {
            const bodyText = document.body.innerText;

            // Parse current session
            const sessionMatch = bodyText.match(/Current session[\\\\s\\\\S]*?Resets in ([^\\\\n]+)[\\\\s\\\\S]*?(\\\\d+)% used/i);

            // Parse all models
            const allModelsMatch = bodyText.match(/All models[\\\\s\\\\S]*?Resets ([^\\\\n]+)[\\\\s\\\\S]*?(\\\\d+)% used/i);

            // Parse sonnet
            const sonnetMatch = bodyText.match(/Sonnet only[\\\\s\\\\S]*?Resets ([^\\\\n]+)[\\\\s\\\\S]*?(\\\\d+)% used/i);

            return JSON.stringify({
                currentSession: sessionMatch ? {
                    resetsIn: sessionMatch[1].trim(),
                    percentage: parseInt(sessionMatch[2])
                } : null,
                allModels: allModelsMatch ? {
                    resetsAt: allModelsMatch[1].trim(),
                    percentage: parseInt(allModelsMatch[2])
                } : null,
                sonnet: sonnetMatch ? {
                    resetsAt: sonnetMatch[1].trim(),
                    percentage: parseInt(sonnetMatch[2])
                } : null
            });
        } catch (e) {
            return JSON.stringify({ error: e.message });
        }
    })();
    "

    try
        set result to do JavaScript jsCode in foundTab
        return result
    on error errMsg
        return "ERROR: " & errMsg
    end try
end tell
`;

export async function runAppleScript(options: { quiet?: boolean } = {}): Promise<UsageResult> {
  const { quiet = false } = options;
  const script = quiet ? APPLESCRIPT_QUIET : APPLESCRIPT_INTERACTIVE;

  try {
    // Run the AppleScript
    const { stdout, stderr } = await execAsync(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`, {
      timeout: 60000, // 60 second timeout
    });

    if (stderr) {
      console.error("AppleScript stderr:", stderr);
    }

    const output = stdout.trim();

    // Check for errors
    if (output.startsWith("ERROR:")) {
      return {
        currentSession: { usedPercentage: null, resetsIn: null },
        weekly: {
          allModels: { usedPercentage: null, resetsAt: null },
          sonnet: { usedPercentage: null, resetsAt: null },
        },
        error: output.replace("ERROR: ", ""),
      };
    }

    // Handle quiet mode responses (not errors, just no data available)
    if (output === "NO_SAFARI" || output === "NO_TAB") {
      return {
        currentSession: { usedPercentage: null, resetsIn: null },
        weekly: {
          allModels: { usedPercentage: null, resetsAt: null },
          sonnet: { usedPercentage: null, resetsAt: null },
        },
        // No error - just no data available in quiet mode
      };
    }

    // Parse the JSON result
    try {
      const data = JSON.parse(output);

      if (data.error) {
        return {
          currentSession: { usedPercentage: null, resetsIn: null },
          weekly: {
            allModels: { usedPercentage: null, resetsAt: null },
            sonnet: { usedPercentage: null, resetsAt: null },
          },
          error: data.error,
        };
      }

      return {
        currentSession: {
          usedPercentage: data.currentSession?.percentage ?? null,
          resetsIn: data.currentSession?.resetsIn ?? null,
        },
        weekly: {
          allModels: {
            usedPercentage: data.allModels?.percentage ?? null,
            resetsAt: data.allModels?.resetsAt ?? null,
          },
          sonnet: {
            usedPercentage: data.sonnet?.percentage ?? null,
            resetsAt: data.sonnet?.resetsAt ?? null,
          },
        },
      };
    } catch (parseError) {
      return {
        currentSession: { usedPercentage: null, resetsIn: null },
        weekly: {
          allModels: { usedPercentage: null, resetsAt: null },
          sonnet: { usedPercentage: null, resetsAt: null },
        },
        error: `Failed to parse response: ${output.substring(0, 200)}`,
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error executing AppleScript";

    // Provide helpful error messages
    if (errorMessage.includes("not allowed to send keystrokes")) {
      return {
        currentSession: { usedPercentage: null, resetsIn: null },
        weekly: {
          allModels: { usedPercentage: null, resetsAt: null },
          sonnet: { usedPercentage: null, resetsAt: null },
        },
        error:
          "Raycast needs Accessibility permissions. Go to System Settings > Privacy & Security > Accessibility and enable Raycast.",
      };
    }

    if (errorMessage.includes("JavaScript")) {
      return {
        currentSession: { usedPercentage: null, resetsIn: null },
        weekly: {
          allModels: { usedPercentage: null, resetsAt: null },
          sonnet: { usedPercentage: null, resetsAt: null },
        },
        error:
          "Safari JavaScript from Apple Events is not enabled. In Safari, go to Develop menu > Allow JavaScript from Apple Events.",
      };
    }

    return {
      currentSession: { usedPercentage: null, resetsIn: null },
      weekly: {
        allModels: { usedPercentage: null, resetsAt: null },
        sonnet: { usedPercentage: null, resetsAt: null },
      },
      error: errorMessage,
    };
  }
}
