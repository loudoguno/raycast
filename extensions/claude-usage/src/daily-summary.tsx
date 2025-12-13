import { Detail, showToast, Toast, ActionPanel, Action, Icon, Color, Clipboard } from "@raycast/api";
import { useEffect, useState } from "react";
import { homedir } from "os";
import { readdir, readFile, stat } from "fs/promises";
import { join } from "path";
import { checkGitStatus, getGitStatusSymbol, GitStatus } from "./utils/git";

// ============================================================================
// Types
// ============================================================================

interface SessionActivity {
  project: string;
  projectPath: string;
  sessionFile: string;
  timestamp: Date;
  userPrompts: string[];
  filesCreated: string[];
  filesModified: string[];
  toolsUsed: Record<string, number>;
  codeBlockCount: number;
  linesWritten: number;
  gitStatus?: GitStatus;
}

interface DailySummary {
  dateRange: string;
  rangeType: TimeRange;
  sessions: SessionActivity[];
  totalPrompts: number;
  totalFilesCreated: number;
  totalFilesModified: number;
  totalLinesWritten: number;
  projectsWorkedOn: string[];
  topTools: [string, number][];
  activityByDay: Record<string, number>; // date string -> prompt count
  activityByHour: number[]; // 24 hours
  uniqueDaysActive: number;
  error?: string;
}

export type TimeRange = "today" | "yesterday" | "week" | "month" | "custom";

interface TimeRangeConfig {
  label: string;
  startDate: Date;
  endDate: Date;
}

// ============================================================================
// Constants
// ============================================================================

const CLAUDE_DIR = join(homedir(), ".claude");
const PROJECTS_DIR = join(CLAUDE_DIR, "projects");

// ============================================================================
// Time Range Helpers
// ============================================================================

function getTimeRangeConfig(range: TimeRange): TimeRangeConfig {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (range) {
    case "today":
      return {
        label: "Today",
        startDate: today,
        endDate: now,
      };
    case "yesterday": {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        label: "Yesterday",
        startDate: yesterday,
        endDate: today,
      };
    }
    case "week": {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return {
        label: "Past 7 Days",
        startDate: weekAgo,
        endDate: now,
      };
    }
    case "month": {
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 30);
      return {
        label: "Past 30 Days",
        startDate: monthAgo,
        endDate: now,
      };
    }
    default:
      return {
        label: "Today",
        startDate: today,
        endDate: now,
      };
  }
}

function isInRange(timestamp: Date, start: Date, end: Date): boolean {
  return timestamp >= start && timestamp <= end;
}

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// ============================================================================
// Session Parsing
// ============================================================================

async function parseSessionFile(
  filePath: string,
  projectName: string,
  projectPath: string,
  startDate: Date,
  endDate: Date
): Promise<SessionActivity | null> {
  try {
    const content = await readFile(filePath, "utf-8");
    const lines = content.trim().split("\n");

    const activity: SessionActivity = {
      project: projectName,
      projectPath: projectPath,
      sessionFile: filePath,
      timestamp: new Date(0),
      userPrompts: [],
      filesCreated: [],
      filesModified: [],
      toolsUsed: {},
      codeBlockCount: 0,
      linesWritten: 0,
    };

    let hasActivityInRange = false;

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);

        // Check timestamp from various sources
        let entryDate: Date | null = null;
        if (entry.timestamp) {
          entryDate = new Date(entry.timestamp);
        } else if (entry.message?.timestamp) {
          entryDate = new Date(entry.message.timestamp);
        }

        if (entryDate && isInRange(entryDate, startDate, endDate)) {
          hasActivityInRange = true;
          if (entryDate > activity.timestamp) {
            activity.timestamp = entryDate;
          }
        }

        // Extract user prompts
        if (entry.userType === "external" && entry.message?.role === "user" && entry.message?.content) {
          const contents = Array.isArray(entry.message.content) ? entry.message.content : [entry.message.content];
          for (const c of contents) {
            if (typeof c === "string" && c.trim() && !c.startsWith("<system")) {
              activity.userPrompts.push(c.trim().substring(0, 300));
            } else if (c?.type === "text" && c.text && !c.text.startsWith("<system")) {
              activity.userPrompts.push(c.text.trim().substring(0, 300));
            }
          }
        }

        // Track tool usage and file operations from assistant messages
        if (entry.message?.role === "assistant" && entry.message?.content) {
          const contents = Array.isArray(entry.message.content) ? entry.message.content : [entry.message.content];
          for (const c of contents) {
            // Tool usage
            if (c?.type === "tool_use" && c.name) {
              activity.toolsUsed[c.name] = (activity.toolsUsed[c.name] || 0) + 1;

              // Track file operations
              const input = c.input || {};
              if (input.file_path) {
                if (c.name === "Write") {
                  activity.filesCreated.push(input.file_path);
                  if (input.content) {
                    activity.linesWritten += (input.content.match(/\n/g) || []).length + 1;
                  }
                } else if (c.name === "Edit") {
                  activity.filesModified.push(input.file_path);
                  if (input.new_string) {
                    activity.linesWritten += (input.new_string.match(/\n/g) || []).length + 1;
                  }
                }
              }
            }

            // Count code blocks in text responses
            if (c?.type === "text" && c.text) {
              const codeBlocks = (c.text.match(/```/g) || []).length / 2;
              activity.codeBlockCount += Math.floor(codeBlocks);
            }
          }
        }
      } catch {
        // Skip malformed lines
      }
    }

    return hasActivityInRange ? activity : null;
  } catch {
    return null;
  }
}

// ============================================================================
// Activity Scanning
// ============================================================================

async function scanActivity(range: TimeRange): Promise<DailySummary> {
  const config = getTimeRangeConfig(range);

  const summary: DailySummary = {
    dateRange: config.label,
    rangeType: range,
    sessions: [],
    totalPrompts: 0,
    totalFilesCreated: 0,
    totalFilesModified: 0,
    totalLinesWritten: 0,
    projectsWorkedOn: [],
    topTools: [],
    activityByDay: {},
    activityByHour: new Array(24).fill(0),
    uniqueDaysActive: 0,
  };

  try {
    const projectDirs = await readdir(PROJECTS_DIR);
    const allToolUsage: Record<string, number> = {};
    const gitStatusCache: Record<string, GitStatus> = {}; // Cache git status per project

    for (const projectDir of projectDirs) {
      if (projectDir.startsWith(".")) continue;

      const projectPath = join(PROJECTS_DIR, projectDir);
      const projectStat = await stat(projectPath);
      if (!projectStat.isDirectory()) continue;

      const originalPath = "/" + projectDir.replace(/-/g, "/").replace(/^\//, "");
      const projectName = projectDir.split("-").pop() || projectDir;

      // Check git status for this project (cache it)
      if (!gitStatusCache[originalPath]) {
        gitStatusCache[originalPath] = await checkGitStatus(originalPath);
      }
      const gitStatus = gitStatusCache[originalPath];

      const sessionFiles = await readdir(projectPath);

      for (const sessionFile of sessionFiles) {
        if (!sessionFile.endsWith(".jsonl")) continue;

        const sessionPath = join(projectPath, sessionFile);
        const sessionStat = await stat(sessionPath);

        // Quick filter: skip files not modified in our range (with buffer)
        const bufferDate = new Date(config.startDate);
        bufferDate.setDate(bufferDate.getDate() - 1);
        if (sessionStat.mtime < bufferDate) continue;

        const activity = await parseSessionFile(sessionPath, projectName, originalPath, config.startDate, config.endDate);

        if (activity && activity.userPrompts.length > 0) {
          activity.gitStatus = gitStatus; // Add git status to activity
          summary.sessions.push(activity);
          summary.totalPrompts += activity.userPrompts.length;
          summary.totalFilesCreated += [...new Set(activity.filesCreated)].length;
          summary.totalFilesModified += [...new Set(activity.filesModified)].length;
          summary.totalLinesWritten += activity.linesWritten;

          if (!summary.projectsWorkedOn.includes(projectName)) {
            summary.projectsWorkedOn.push(projectName);
          }

          // Track activity by day
          const dayKey = formatDateKey(activity.timestamp);
          summary.activityByDay[dayKey] = (summary.activityByDay[dayKey] || 0) + activity.userPrompts.length;

          // Track activity by hour
          const hour = activity.timestamp.getHours();
          summary.activityByHour[hour] += activity.userPrompts.length;

          // Aggregate tool usage
          for (const [tool, count] of Object.entries(activity.toolsUsed)) {
            allToolUsage[tool] = (allToolUsage[tool] || 0) + count;
          }
        }
      }
    }

    // Calculate unique days active
    summary.uniqueDaysActive = Object.keys(summary.activityByDay).length;

    // Sort tools by usage
    summary.topTools = Object.entries(allToolUsage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    // Sort sessions by timestamp (most recent first)
    summary.sessions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  } catch (error) {
    summary.error = error instanceof Error ? error.message : "Failed to scan activity";
  }

  return summary;
}

// ============================================================================
// Visualization Helpers
// ============================================================================

function createActivityHeatmap(activityByDay: Record<string, number>, range: TimeRange): string {
  if (range === "today" || range === "yesterday") return "";

  const days = range === "week" ? 7 : 30;
  const today = new Date();
  const cells: string[] = [];

  // Find max activity for scaling
  const maxActivity = Math.max(...Object.values(activityByDay), 1);

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const key = formatDateKey(date);
    const activity = activityByDay[key] || 0;

    // Scale to intensity (0-4)
    const intensity = Math.ceil((activity / maxActivity) * 4);
    const chars = ["·", "░", "▒", "▓", "█"];
    cells.push(chars[intensity]);
  }

  // Format as rows of 7 for week view
  if (range === "week") {
    return `\`${cells.join("")}\``;
  }

  // Format as calendar grid for month
  let grid = "";
  for (let row = 0; row < Math.ceil(cells.length / 7); row++) {
    grid += cells.slice(row * 7, (row + 1) * 7).join("") + "\n";
  }
  return `\`\`\`\n${grid.trim()}\n\`\`\``;
}

function createHourlyChart(activityByHour: number[]): string {
  const maxActivity = Math.max(...activityByHour, 1);
  const barChars = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];

  let chart = "";
  for (let h = 6; h <= 23; h++) { // Show 6am - 11pm
    const activity = activityByHour[h];
    const barIndex = Math.round((activity / maxActivity) * (barChars.length - 1));
    chart += barChars[barIndex];
  }

  return `\`${chart}\`\n*6am → 11pm*`;
}

function getMostProductiveHour(activityByHour: number[]): string {
  let maxHour = 0;
  let maxActivity = 0;
  for (let h = 0; h < 24; h++) {
    if (activityByHour[h] > maxActivity) {
      maxActivity = activityByHour[h];
      maxHour = h;
    }
  }
  if (maxActivity === 0) return "—";

  const period = maxHour >= 12 ? "pm" : "am";
  const hour12 = maxHour % 12 || 12;
  return `${hour12}${period}`;
}

function getProductivityEmoji(prompts: number, range: TimeRange): string {
  const thresholds = {
    today: [5, 15, 30, 50],
    yesterday: [5, 15, 30, 50],
    week: [20, 50, 100, 200],
    month: [50, 150, 300, 500],
    custom: [20, 50, 100, 200],
  };

  const t = thresholds[range];
  if (prompts >= t[3]) return "🔥";
  if (prompts >= t[2]) return "⚡";
  if (prompts >= t[1]) return "✨";
  if (prompts >= t[0]) return "👍";
  return "🌱";
}

// ============================================================================
// Markdown Generation
// ============================================================================

function generateMarkdown(summary: DailySummary): string {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const emoji = getProductivityEmoji(summary.totalPrompts, summary.rangeType);

  let md = `# ${summary.dateRange} ${emoji}\n`;
  md += `*Generated ${timeStr}*\n\n`;

  if (summary.error) {
    md += `> ⚠️ ${summary.error}\n\n`;
  }

  // ==================== STATS ====================
  if (summary.sessions.length > 0) {
    md += `---\n\n`;

    // Big number stats
    md += `## Overview\n\n`;
    md += `| 💬 Prompts | 📁 Projects | 📝 Files Created | ✏️ Files Modified | 📊 Lines Written |\n`;
    md += `|:----------:|:-----------:|:----------------:|:-----------------:|:----------------:|\n`;
    md += `| **${summary.totalPrompts}** | **${summary.projectsWorkedOn.length}** | **${summary.totalFilesCreated}** | **${summary.totalFilesModified}** | **${summary.totalLinesWritten.toLocaleString()}** |\n\n`;

    // Activity heatmap (for week/month)
    if (summary.rangeType === "week" || summary.rangeType === "month") {
      md += `### Activity\n`;
      md += createActivityHeatmap(summary.activityByDay, summary.rangeType);
      md += `\n*${summary.uniqueDaysActive} active day${summary.uniqueDaysActive !== 1 ? "s" : ""}*\n\n`;
    }

    // Hourly distribution
    if (summary.totalPrompts > 5) {
      md += `### Peak Hours\n`;
      md += createHourlyChart(summary.activityByHour);
      md += `\n\n**Most productive:** ${getMostProductiveHour(summary.activityByHour)}\n\n`;
    }

    // Top tools
    if (summary.topTools.length > 0) {
      md += `### Tools Used\n`;
      for (const [tool, count] of summary.topTools) {
        const bar = "█".repeat(Math.ceil((count / summary.topTools[0][1]) * 10));
        md += `\`${tool.padEnd(12)}\` ${bar} ${count}\n`;
      }
      md += `\n`;
    }

    // ==================== SESSIONS ====================
    md += `---\n\n`;
    md += `## Sessions\n\n`;

    // Group and show sessions
    const byProject: Record<string, SessionActivity[]> = {};
    for (const session of summary.sessions) {
      if (!byProject[session.project]) {
        byProject[session.project] = [];
      }
      byProject[session.project].push(session);
    }

    for (const [projectName, sessions] of Object.entries(byProject)) {
      const totalPrompts = sessions.reduce((sum, s) => sum + s.userPrompts.length, 0);
      const latestSession = sessions[0];
      const time = latestSession.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const gitSymbol = latestSession.gitStatus ? getGitStatusSymbol(latestSession.gitStatus) : "";

      md += `### ${gitSymbol ? gitSymbol + " " : ""}${projectName}\n`;
      md += `📁 \`${latestSession.projectPath}\`\n`;
      md += `*${totalPrompts} prompts · Last active ${time}*\n\n`;

      // Show sample prompts from latest session
      const prompts = latestSession.userPrompts.slice(0, 3);
      if (prompts.length > 0) {
        md += `**Recent prompts:**\n`;
        for (const prompt of prompts) {
          const truncated = prompt.length > 100 ? prompt.substring(0, 100) + "..." : prompt;
          md += `- "${truncated}"\n`;
        }
        md += `\n`;
      }

      // Files
      const allCreated = [...new Set(sessions.flatMap(s => s.filesCreated))];
      const allModified = [...new Set(sessions.flatMap(s => s.filesModified))];

      if (allCreated.length > 0) {
        md += `**Created:** ${allCreated.slice(0, 4).map(f => `\`${f.split("/").pop()}\``).join(", ")}`;
        if (allCreated.length > 4) md += ` +${allCreated.length - 4} more`;
        md += `\n`;
      }
      if (allModified.length > 0) {
        md += `**Modified:** ${allModified.slice(0, 4).map(f => `\`${f.split("/").pop()}\``).join(", ")}`;
        if (allModified.length > 4) md += ` +${allModified.length - 4} more`;
        md += `\n`;
      }

      md += `\n`;
    }
  } else {
    md += `---\n\n`;
    md += `## No activity\n\n`;
    md += `No Claude Code sessions found for ${summary.dateRange.toLowerCase()}.\n`;
  }

  md += `---\n\n`;
  md += `*Press ⌘R to refresh · ⌘C to copy for standup*`;

  return md;
}

function generateStandupText(summary: DailySummary): string {
  if (summary.sessions.length === 0) {
    return `No Claude Code activity for ${summary.dateRange.toLowerCase()}.`;
  }

  let text = `## Claude Code Summary - ${summary.dateRange}\n\n`;
  text += `**Stats:** ${summary.totalPrompts} prompts across ${summary.projectsWorkedOn.length} project(s)\n\n`;

  if (summary.projectsWorkedOn.length > 0) {
    text += `**Projects:**\n`;
    for (const project of summary.projectsWorkedOn) {
      const sessions = summary.sessions.filter(s => s.project === project);
      const prompts = sessions.reduce((sum, s) => sum + s.userPrompts.length, 0);
      text += `- ${project} (${prompts} prompts)\n`;
    }
    text += `\n`;
  }

  if (summary.totalFilesCreated > 0 || summary.totalFilesModified > 0) {
    text += `**Files:** ${summary.totalFilesCreated} created, ${summary.totalFilesModified} modified\n`;
  }

  return text;
}

// ============================================================================
// Component
// ============================================================================

interface SummaryCommandProps {
  initialRange?: TimeRange;
}

export function SummaryCommand({ initialRange = "today" }: SummaryCommandProps) {
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>(initialRange);

  const fetchSummary = async (range: TimeRange) => {
    setIsLoading(true);
    setTimeRange(range);
    try {
      const result = await scanActivity(range);
      setSummary(result);
      if (result.error) {
        showToast({ style: Toast.Style.Failure, title: "Error", message: result.error });
      }
    } catch (error) {
      showToast({ style: Toast.Style.Failure, title: "Error", message: "Failed to load summary" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary(initialRange);
  }, []);

  const copyForStandup = async () => {
    if (summary) {
      await Clipboard.copy(generateStandupText(summary));
      showToast({ style: Toast.Style.Success, title: "Copied!", message: "Summary copied for standup" });
    }
  };

  const markdown = summary ? generateMarkdown(summary) : "Loading...";

  return (
    <Detail
      isLoading={isLoading}
      markdown={markdown}
      actions={
        <ActionPanel>
          <ActionPanel.Section title="Time Range">
            <Action
              title="Today"
              icon={timeRange === "today" ? Icon.CheckCircle : Icon.Calendar}
              onAction={() => fetchSummary("today")}
            />
            <Action
              title="Yesterday"
              icon={timeRange === "yesterday" ? Icon.CheckCircle : Icon.Calendar}
              onAction={() => fetchSummary("yesterday")}
            />
            <Action
              title="Past 7 Days"
              icon={timeRange === "week" ? Icon.CheckCircle : Icon.Calendar}
              onAction={() => fetchSummary("week")}
            />
            <Action
              title="Past 30 Days"
              icon={timeRange === "month" ? Icon.CheckCircle : Icon.Calendar}
              onAction={() => fetchSummary("month")}
            />
          </ActionPanel.Section>
          <ActionPanel.Section title="Actions">
            <Action
              title="Refresh"
              icon={Icon.ArrowClockwise}
              shortcut={{ modifiers: ["cmd"], key: "r" }}
              onAction={() => fetchSummary(timeRange)}
            />
            <Action
              title="Copy for Standup"
              icon={Icon.Clipboard}
              shortcut={{ modifiers: ["cmd"], key: "c" }}
              onAction={copyForStandup}
            />
            <Action.Open
              title="Open Claude Projects Folder"
              icon={Icon.Folder}
              target={PROJECTS_DIR}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

// Default export for daily-summary command
export default function DailySummaryCommand() {
  return <SummaryCommand initialRange="today" />;
}
