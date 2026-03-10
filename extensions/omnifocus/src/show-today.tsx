import {
  Action,
  ActionPanel,
  Clipboard,
  Color,
  Icon,
  List,
  open,
  showToast,
  Toast,
} from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { listTodayTasks } from "./lib/api/list-today-tasks";
import { completeTask } from "./lib/api/complete-task";
import { updateTaskDate } from "./lib/api/update-task-date";
import { toggleFlag } from "./lib/api/toggle-flag";
import { completeAndAwait } from "./lib/api/complete-and-await";
import { TodayTask, TodaySection } from "./lib/types";

// --- Date helpers ---

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86400000);
}

function nextDayOfWeek(dayIndex: number, afterDate: Date): Date {
  const d = startOfDay(afterDate);
  const diff = (dayIndex - d.getDay() + 7) % 7 || 7;
  return addDays(d, diff);
}

function datePresets() {
  const now = new Date();
  const today = startOfDay(now);
  return {
    laterToday: new Date(now.getTime() + 3 * 3600000),
    tomorrow: new Date(addDays(today, 1).getTime() + 9 * 3600000), // 9 AM
    thisWeekend: new Date(nextDayOfWeek(6, today).getTime() + 10 * 3600000), // Sat 10 AM
    nextWeek: new Date(nextDayOfWeek(1, today).getTime() + 9 * 3600000), // Mon 9 AM
    nextMonth: new Date(today.getFullYear(), today.getMonth() + 1, today.getDate(), 9, 0, 0),
  };
}

// --- Section config ---

const SECTION_META: Record<TodaySection, { title: string; icon: Icon; tint: Color }> = {
  overdue: { title: "Overdue", icon: Icon.ExclamationMark, tint: Color.Red },
  "due-today": { title: "Due Today", icon: Icon.Clock, tint: Color.Orange },
  flagged: { title: "Flagged", icon: Icon.Flag, tint: Color.Orange },
  "due-soon": { title: "Due Soon", icon: Icon.Calendar, tint: Color.Blue },
};

const SECTION_ORDER: TodaySection[] = ["overdue", "due-today", "flagged", "due-soon"];

// --- URL helper ---

function omnifocusTaskUrl(taskId: string): string {
  return `omnifocus:///task/${taskId}`;
}

// --- Main Command ---

export default function ShowToday() {
  const { data, isLoading, revalidate } = usePromise(listTodayTasks);
  const tasks = data ?? [];

  const sections = SECTION_ORDER.map((key) => ({
    key,
    ...SECTION_META[key],
    tasks: tasks.filter((t) => t.section === key),
  })).filter((s) => s.tasks.length > 0);

  const totalCount = tasks.length;

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Filter today's tasks..."
    >
      {!isLoading && totalCount === 0 && (
        <List.EmptyView
          title="All Clear"
          description="No tasks due today, overdue, or flagged. Nice work."
          icon={Icon.CheckCircle}
        />
      )}
      {sections.map((section) => (
        <List.Section
          key={section.key}
          title={section.title}
          subtitle={`${section.tasks.length}`}
        >
          {section.tasks.map((task) => (
            <TaskListItem
              key={task.id}
              task={task}
              sectionTint={section.tint}
              onUpdate={revalidate}
            />
          ))}
        </List.Section>
      ))}
    </List>
  );
}

// --- Task List Item ---

function TaskListItem({
  task,
  sectionTint,
  onUpdate,
}: {
  task: TodayTask;
  sectionTint: Color;
  onUpdate: () => void;
}) {
  const accessories: List.Item.Accessory[] = [];

  // Estimated time
  if (task.estimatedMinutes) {
    const hrs = Math.floor(task.estimatedMinutes / 60);
    const mins = task.estimatedMinutes % 60;
    const est = hrs > 0 ? `${hrs}h${mins > 0 ? `${mins}m` : ""}` : `${mins}m`;
    accessories.push({ text: `~${est}`, tooltip: "Estimated time" });
  }

  // Tags (max 2)
  for (const tag of task.tags.slice(0, 2)) {
    accessories.push({ tag: { value: tag, color: Color.SecondaryText } });
  }
  if (task.tags.length > 2) {
    accessories.push({ text: `+${task.tags.length - 2}`, tooltip: `${task.tags.length} tags total` });
  }

  // Flag indicator (if in a non-flagged section but task is flagged)
  if (task.flagged && task.section !== "flagged") {
    accessories.push({ icon: { source: Icon.Flag, tintColor: Color.Orange }, tooltip: "Flagged" });
  }

  // Due date (relative display)
  if (task.dueDate) {
    accessories.push({ date: new Date(task.dueDate), tooltip: "Due date" });
  }

  // Defer indicator
  if (task.deferDate) {
    const defer = new Date(task.deferDate);
    if (defer > new Date()) {
      accessories.push({
        icon: { source: Icon.Clock, tintColor: Color.SecondaryText },
        tooltip: `Deferred until ${defer.toLocaleDateString()}`,
      });
    }
  }

  const url = omnifocusTaskUrl(task.id);

  return (
    <List.Item
      icon={{ source: Icon.Circle, tintColor: sectionTint }}
      title={task.name}
      subtitle={task.projectName ?? undefined}
      accessories={accessories}
      actions={
        <ActionPanel>
          {/* Primary: Open */}
          <Action
            title="Open in OmniFocus"
            icon={Icon.Eye}
            onAction={() => open(url)}
          />

          {/* Complete */}
          <Action
            title="Complete"
            icon={Icon.CheckCircle}
            shortcut={{ modifiers: ["cmd"], key: "d" }}
            onAction={async () => {
              await completeTask(task.id);
              await showToast({ style: Toast.Style.Success, title: "Completed", message: task.name });
              onUpdate();
            }}
          />

          {/* Reschedule submenu */}
          <ActionPanel.Submenu
            title="Reschedule..."
            icon={Icon.Calendar}
            shortcut={{ modifiers: ["cmd"], key: "e" }}
          >
            <RescheduleActions taskId={task.id} field="due" onUpdate={onUpdate} />
          </ActionPanel.Submenu>

          {/* Flag toggle */}
          <Action
            title={task.flagged ? "Unflag" : "Flag"}
            icon={Icon.Flag}
            shortcut={{ modifiers: ["cmd", "shift"], key: "f" }}
            onAction={async () => {
              const newVal = await toggleFlag(task.id);
              await showToast({
                style: Toast.Style.Success,
                title: newVal ? "Flagged" : "Unflagged",
                message: task.name,
              });
              onUpdate();
            }}
          />

          {/* Defer submenu */}
          <ActionPanel.Submenu
            title="Defer..."
            icon={Icon.Hourglass}
            shortcut={{ modifiers: ["cmd", "shift"], key: "e" }}
          >
            <RescheduleActions taskId={task.id} field="defer" onUpdate={onUpdate} />
          </ActionPanel.Submenu>

          {/* Complete & Await Reply */}
          <Action
            title="Complete and Await Reply"
            icon={Icon.Reply}
            shortcut={{ modifiers: ["cmd", "shift"], key: "w" }}
            onAction={async () => {
              await completeAndAwait(task.id);
              await showToast({
                style: Toast.Style.Success,
                title: "Completed + Waiting task created",
                message: `Waiting: ${task.name}`,
              });
              onUpdate();
            }}
          />

          {/* Copy actions */}
          <Action
            title="Copy OmniFocus URL"
            icon={Icon.Link}
            shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
            onAction={async () => {
              await Clipboard.copy(url);
              await showToast({ style: Toast.Style.Success, title: "URL copied" });
            }}
          />
          <Action
            title="Copy as Markdown Link"
            icon={Icon.CodeBlock}
            shortcut={{ modifiers: ["cmd", "shift"], key: "m" }}
            onAction={async () => {
              const md = `[${task.name}](${url})`;
              const html = `<a href="${url}">${task.name}</a>`;
              await Clipboard.copy({ text: md, html });
              await showToast({ style: Toast.Style.Success, title: "Markdown link copied" });
            }}
          />
        </ActionPanel>
      }
    />
  );
}

// --- Reschedule / Defer Actions (reused in both submenus) ---

function RescheduleActions({
  taskId,
  field,
  onUpdate,
}: {
  taskId: string;
  field: "due" | "defer";
  onUpdate: () => void;
}) {
  const presets = datePresets();
  const label = field === "due" ? "Due" : "Defer";

  async function set(date: Date | null, description: string) {
    await updateTaskDate(taskId, field, date);
    await showToast({
      style: Toast.Style.Success,
      title: `${label}: ${description}`,
    });
    onUpdate();
  }

  return (
    <>
      {field === "due" && (
        <Action
          title="Later Today (+3h)"
          icon={Icon.Clock}
          onAction={() => set(presets.laterToday, "Later today")}
        />
      )}
      <Action
        title="Tomorrow"
        icon={Icon.Sunrise}
        onAction={() => set(presets.tomorrow, "Tomorrow")}
      />
      <Action
        title="This Weekend"
        icon={Icon.MugSteam}
        onAction={() => set(presets.thisWeekend, "This weekend")}
      />
      <Action
        title="Next Week"
        icon={Icon.ArrowRightCircle}
        onAction={() => set(presets.nextWeek, "Next week")}
      />
      <Action
        title="In 1 Month"
        icon={Icon.Calendar}
        onAction={() => set(presets.nextMonth, "In 1 month")}
      />
      <Action
        title={`Remove ${label} Date`}
        icon={Icon.MinusCircle}
        style={Action.Style.Destructive}
        onAction={() => set(null, "Removed")}
      />
    </>
  );
}
