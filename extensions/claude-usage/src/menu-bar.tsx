import { MenuBarExtra, open, showHUD, LaunchType, launchCommand } from "@raycast/api";
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
  error?: string;
}

/**
 * Parse "X hr Y min" format and return total minutes remaining
 */
function parseSessionResetTime(resetsIn: string | null): number | null {
  if (!resetsIn) return null;

  let totalMinutes = 0;

  const hourMatch = resetsIn.match(/(\d+)\s*h/i);
  if (hourMatch) {
    totalMinutes += parseInt(hourMatch[1]) * 60;
  }

  const minMatch = resetsIn.match(/(\d+)\s*m/i);
  if (minMatch) {
    totalMinutes += parseInt(minMatch[1]);
  }

  return totalMinutes > 0 ? totalMinutes : null;
}

/**
 * Calculate session pacing - assumes 5 hour (300 min) session window
 */
function calculateSessionPacing(usedPercentage: number | null, resetsIn: string | null): string {
  if (usedPercentage === null) return "";

  const minutesRemaining = parseSessionResetTime(resetsIn);
  if (minutesRemaining === null) return "";

  const sessionDurationMinutes = 5 * 60;
  const minutesElapsed = sessionDurationMinutes - minutesRemaining;
  const sessionElapsedPercentage = (minutesElapsed / sessionDurationMinutes) * 100;
  const diff = Math.round(sessionElapsedPercentage - usedPercentage);

  if (diff > 0) return `${diff}% ahead`;
  if (diff < 0) return `${Math.abs(diff)}% behind`;
  return "On schedule";
}

/**
 * Parse reset time string like "Mon 3:00 AM" and calculate hours until reset
 */
function parseResetTime(resetsAt: string | null): number | null {
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
    if (currentTotalMinutes >= targetTotalMinutes) {
      daysUntil = 7;
    }
  }

  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + daysUntil);
  targetDate.setHours(targetHour, parseInt(minuteStr), 0, 0);

  const hoursUntilReset = (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursUntilReset;
}

/**
 * Calculate weekly pacing status - whether user is ahead or behind schedule
 */
function calculatePacing(usedPercentage: number | null, resetsAt: string | null): string {
  if (usedPercentage === null) return "";

  const hoursUntilReset = parseResetTime(resetsAt);
  if (hoursUntilReset === null) return "";

  const totalHoursInWeek = 7 * 24;
  const hoursElapsed = totalHoursInWeek - hoursUntilReset;
  const weekElapsedPercentage = (hoursElapsed / totalHoursInWeek) * 100;
  const diff = Math.round(weekElapsedPercentage - usedPercentage);

  if (diff > 0) return `${diff}% ahead`;
  if (diff < 0) return `${Math.abs(diff)}% behind`;
  return "On schedule";
}

export default function MenuBar() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsage = async (interactive = false) => {
    setIsLoading(true);
    try {
      // Use quiet mode by default to avoid opening Safari windows
      // Only use interactive mode when user explicitly requests refresh
      const result = await runAppleScript({ quiet: !interactive });
      setUsage(result);
    } catch (error) {
      setUsage({
        currentSession: { usedPercentage: null, resetsIn: null },
        weekly: {
          allModels: { usedPercentage: null, resetsAt: null },
          sonnet: { usedPercentage: null, resetsAt: null },
        },
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  const getMenuBarTitle = (): string => {
    if (isLoading) return "C: ...";
    if (usage?.error) return "C: !";
    if (usage?.currentSession.usedPercentage !== null) {
      return `C: ${usage.currentSession.usedPercentage}%`;
    }
    return "C: —";
  };

  const formatPercentage = (value: number | null): string => {
    if (value === null) return "—";
    return `${value}%`;
  };

  const sessionPacing = calculateSessionPacing(
    usage?.currentSession.usedPercentage ?? null,
    usage?.currentSession.resetsIn ?? null
  );
  const allModelsPacing = calculatePacing(
    usage?.weekly.allModels.usedPercentage ?? null,
    usage?.weekly.allModels.resetsAt ?? null
  );
  const sonnetPacing = calculatePacing(
    usage?.weekly.sonnet.usedPercentage ?? null,
    usage?.weekly.sonnet.resetsAt ?? null
  );

  return (
    <MenuBarExtra icon="command-icon.png" title={getMenuBarTitle()} isLoading={isLoading}>
      {usage?.error && <MenuBarExtra.Item title={`Error: ${usage.error}`} />}

      <MenuBarExtra.Section title="Current Session">
        <MenuBarExtra.Item
          title={`${formatPercentage(usage?.currentSession.usedPercentage)} used`}
          subtitle={sessionPacing || (usage?.currentSession.resetsIn ? `Resets in ${usage.currentSession.resetsIn}` : undefined)}
        />
      </MenuBarExtra.Section>

      <MenuBarExtra.Section title="Weekly Limits">
        <MenuBarExtra.Item
          title={`All Models: ${formatPercentage(usage?.weekly.allModels.usedPercentage)}`}
          subtitle={allModelsPacing || (usage?.weekly.allModels.resetsAt ? `Resets ${usage.weekly.allModels.resetsAt}` : undefined)}
        />
        <MenuBarExtra.Item
          title={`Sonnet Only: ${formatPercentage(usage?.weekly.sonnet.usedPercentage)}`}
          subtitle={sonnetPacing || (usage?.weekly.sonnet.resetsAt ? `Resets ${usage.weekly.sonnet.resetsAt}` : undefined)}
        />
      </MenuBarExtra.Section>

      <MenuBarExtra.Section>
        <MenuBarExtra.Item
          title="Refresh"
          shortcut={{ modifiers: ["cmd"], key: "r" }}
          onAction={async () => {
            await fetchUsage(true); // Interactive mode - will open Safari if needed
            await showHUD("Usage refreshed");
          }}
        />
        <MenuBarExtra.Item
          title="Open Full View"
          shortcut={{ modifiers: ["cmd"], key: "o" }}
          onAction={() => launchCommand({ name: "show-usage", type: LaunchType.UserInitiated })}
        />
        <MenuBarExtra.Item
          title="Open Claude Usage Page"
          shortcut={{ modifiers: ["cmd"], key: "b" }}
          onAction={() => open("https://claude.ai/settings/usage")}
        />
      </MenuBarExtra.Section>
    </MenuBarExtra>
  );
}
