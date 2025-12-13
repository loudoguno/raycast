import { Detail, showToast, Toast, ActionPanel, Action } from "@raycast/api";
import { useEffect, useState } from "react";
import { runAppleScript } from "./utils/applescript";

interface UsageData {
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
  lastUpdated: Date | null;
  error: string | null;
}

const initialState: UsageData = {
  currentSession: { usedPercentage: null, resetsIn: null },
  weekly: {
    allModels: { usedPercentage: null, resetsAt: null },
    sonnet: { usedPercentage: null, resetsAt: null },
  },
  lastUpdated: null,
  error: null,
};

/**
 * Parse "X hr Y min" format and return total minutes remaining
 */
function parseSessionResetTime(resetsIn: string | null): number | null {
  if (!resetsIn) return null;

  let totalMinutes = 0;

  const hourMatch = resetsIn.match(/(\d+)\s*h/i);
  if (hourMatch) totalMinutes += parseInt(hourMatch[1]) * 60;

  const minMatch = resetsIn.match(/(\d+)\s*m/i);
  if (minMatch) totalMinutes += parseInt(minMatch[1]);

  return totalMinutes > 0 ? totalMinutes : null;
}

/**
 * Parse reset time string like "Mon 3:00 AM" and calculate hours until reset
 */
function parseWeeklyResetTime(resetsAt: string | null): number | null {
  if (!resetsAt) return null;

  const match = resetsAt.match(/(\w{3})\s+(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;

  const [, dayStr, hourStr, minuteStr, ampm] = match;

  const days: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };

  const targetDay = days[dayStr];
  if (targetDay === undefined) return null;

  let targetHour = parseInt(hourStr);
  if (ampm.toUpperCase() === "PM" && targetHour !== 12) targetHour += 12;
  if (ampm.toUpperCase() === "AM" && targetHour === 12) targetHour = 0;

  const now = new Date();
  const currentDay = now.getDay();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  let daysUntil = targetDay - currentDay;
  if (daysUntil < 0) daysUntil += 7;
  if (daysUntil === 0) {
    const currentTotalMinutes = currentHour * 60 + currentMinute;
    const targetTotalMinutes = targetHour * 60 + parseInt(minuteStr);
    if (currentTotalMinutes >= targetTotalMinutes) daysUntil = 7;
  }

  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + daysUntil);
  targetDate.setHours(targetHour, parseInt(minuteStr), 0, 0);

  return (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60);
}

/**
 * Create a clock-style visual showing time and usage
 */
function createTimelineVisual(
  label: string,
  usedPct: number | null,
  timeRemaining: string | null,
  totalDuration: number,
  elapsedUnits: number
): string {
  if (usedPct === null) return `${label}: No data`;

  const timeElapsedPct = Math.round((elapsedUnits / totalDuration) * 100);
  const pacing = timeElapsedPct - usedPct;

  // Create a 24-segment timeline (like clock hours)
  const segments = 24;
  const timeMarker = Math.round((timeElapsedPct / 100) * segments);
  const usageMarker = Math.round((usedPct / 100) * segments);

  let timeline = "";
  for (let i = 0; i < segments; i++) {
    if (i === timeMarker && i === usageMarker) {
      timeline += "◆"; // Both time and usage at same point
    } else if (i === timeMarker) {
      timeline += "│"; // Current time position
    } else if (i < usageMarker) {
      timeline += "█"; // Used
    } else {
      timeline += "░"; // Available
    }
  }

  // Status indicator
  let status: string;
  let icon: string;
  if (pacing > 15) {
    status = `${pacing}% ahead`;
    icon = "🟢";
  } else if (pacing > 0) {
    status = `${pacing}% ahead`;
    icon = "🟡";
  } else if (pacing === 0) {
    status = "On pace";
    icon = "⚪";
  } else if (pacing > -15) {
    status = `${Math.abs(pacing)}% behind`;
    icon = "🟠";
  } else {
    status = `${Math.abs(pacing)}% behind`;
    icon = "🔴";
  }

  return `**${label}** ${icon}
\`${timeline}\`
${usedPct}% used · ${timeRemaining || "?"} left · ${status}`;
}

/**
 * Create weekly calendar visual
 */
function createWeekCalendar(hoursUntilReset: number | null): string {
  const days = ["S", "M", "T", "W", "T", "F", "S"];
  const now = new Date();
  const currentDay = now.getDay();

  let resetDay = -1;
  if (hoursUntilReset !== null) {
    const daysUntil = Math.ceil(hoursUntilReset / 24);
    resetDay = (currentDay + daysUntil) % 7;
  }

  let calendar = "";
  for (let i = 0; i < 7; i++) {
    if (i === currentDay) {
      calendar += `[${days[i]}]`; // Current day
    } else if (i === resetDay) {
      calendar += `(${days[i]})`; // Reset day
    } else if (
      (resetDay > currentDay && i > currentDay && i < resetDay) ||
      (resetDay < currentDay && (i > currentDay || i < resetDay))
    ) {
      calendar += ` ${days[i]} `; // Days until reset
    } else {
      calendar += ` · `;
    }
  }

  return calendar;
}

export default function ShowUsage() {
  const [usage, setUsage] = useState<UsageData>(initialState);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsage = async () => {
    setIsLoading(true);
    try {
      const result = await runAppleScript();

      if (result.error) {
        setUsage({ ...initialState, error: result.error });
        showToast({ style: Toast.Style.Failure, title: "Failed to fetch usage", message: result.error });
      } else {
        setUsage({ ...result, lastUpdated: new Date(), error: null });
        showToast({ style: Toast.Style.Success, title: "Usage updated" });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setUsage({ ...initialState, error: errorMessage });
      showToast({ style: Toast.Style.Failure, title: "Error", message: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  // Calculate time metrics
  const sessionMinutesRemaining = parseSessionResetTime(usage.currentSession.resetsIn);
  const sessionTotalMinutes = 5 * 60; // 5 hour session
  const sessionElapsed = sessionMinutesRemaining ? sessionTotalMinutes - sessionMinutesRemaining : 0;

  const weeklyHoursRemaining = parseWeeklyResetTime(usage.weekly.allModels.resetsAt);
  const weekTotalHours = 7 * 24;
  const weekElapsed = weeklyHoursRemaining ? weekTotalHours - weeklyHoursRemaining : 0;

  // Format time remaining nicely
  const formatTimeRemaining = (hours: number | null): string => {
    if (hours === null) return "?";
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours)}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return `${days}d ${remainingHours}h`;
  };

  // Current time display
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

  const markdown = `
# ${timeStr}
*${dateStr}*

${usage.error ? `> ⚠️ ${usage.error}\n\n` : ""}

---

${createTimelineVisual(
  "Session",
  usage.currentSession.usedPercentage,
  usage.currentSession.resetsIn,
  sessionTotalMinutes,
  sessionElapsed
)}

---

${createTimelineVisual(
  "Weekly All",
  usage.weekly.allModels.usedPercentage,
  formatTimeRemaining(weeklyHoursRemaining),
  weekTotalHours,
  weekElapsed
)}

\`${createWeekCalendar(weeklyHoursRemaining)}\`
*[today] → (reset)*

---

${createTimelineVisual(
  "Weekly Sonnet",
  usage.weekly.sonnet.usedPercentage,
  formatTimeRemaining(weeklyHoursRemaining),
  weekTotalHours,
  weekElapsed
)}

---

*Updated ${usage.lastUpdated?.toLocaleTimeString() || "never"}*
`;

  return (
    <Detail
      isLoading={isLoading}
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action title="Refresh" onAction={fetchUsage} shortcut={{ modifiers: ["cmd"], key: "r" }} />
          <Action.OpenInBrowser title="Open Claude Usage Page" url="https://claude.ai/settings/usage" />
        </ActionPanel>
      }
    />
  );
}
