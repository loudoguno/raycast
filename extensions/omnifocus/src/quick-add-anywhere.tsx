import {
  Action,
  ActionPanel,
  Form,
  Icon,
  List,
  showToast,
  Toast,
  popToRoot,
  Color,
} from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { useState } from "react";
import { listDestinations } from "./lib/api/list-destinations";
import { listTags } from "./lib/api/list-tags";
import { addTask } from "./lib/api/add-task";
import { setRepetition } from "./lib/api/set-repetition";
import { Destination, RepetitionMethod } from "./lib/types";

const REPEAT_PRESETS = [
  { label: "None", value: "" },
  { label: "Daily", value: "FREQ=DAILY" },
  { label: "Weekdays", value: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR" },
  { label: "Weekly", value: "FREQ=WEEKLY" },
  { label: "Biweekly", value: "FREQ=WEEKLY;INTERVAL=2" },
  { label: "Monthly", value: "FREQ=MONTHLY" },
  { label: "Yearly", value: "FREQ=YEARLY" },
  { label: "Custom...", value: "__custom__" },
];

const REPEAT_METHODS = [
  { label: "Fixed Schedule", value: "fixed" as RepetitionMethod },
  {
    label: "Due Again After Completion",
    value: "due-after-completion" as RepetitionMethod,
  },
  {
    label: "Defer Again After Completion",
    value: "defer-after-completion" as RepetitionMethod,
  },
];

export default function QuickAddAnywhere() {
  const {
    data: rawDestinations,
    isLoading: destinationsLoading,
    revalidate: revalidateDestinations,
  } = usePromise(listDestinations);

  const { data: rawTags, isLoading: tagsLoading } = usePromise(listTags);

  // Defensive: ensure data is always an array
  const destinations = Array.isArray(rawDestinations) ? rawDestinations : [];
  const tags = Array.isArray(rawTags) ? rawTags : [];

  function iconForDestination(dest: Destination) {
    if (dest.type === "inbox")
      return { source: Icon.Tray, tintColor: Color.Blue };
    if (dest.type === "project")
      return { source: Icon.Folder, tintColor: Color.Purple };
    if (dest.hasChildren) return { source: Icon.List, tintColor: Color.Orange };
    return { source: Icon.Circle, tintColor: Color.SecondaryText };
  }

  function depthPrefix(dest: Destination): string {
    if (dest.type === "inbox" || dest.type === "project") return "";
    return "  ".repeat(dest.depth - 1) + "└ ";
  }

  return (
    <List
      isLoading={destinationsLoading || tagsLoading}
      searchBarPlaceholder="Search projects and tasks..."
    >
      {destinations.map((dest) => (
        <List.Item
          key={dest.id}
          icon={iconForDestination(dest)}
          title={depthPrefix(dest) + dest.name}
          subtitle={
            dest.type !== "inbox" && dest.depth > 0
              ? (dest.projectName ?? undefined)
              : undefined
          }
          accessories={
            dest.hasChildren
              ? [{ icon: Icon.ChevronRight, tooltip: "Has subtasks" }]
              : dest.type === "project"
                ? [{ tag: "Project" }]
                : dest.type === "inbox"
                  ? [{ tag: "Inbox" }]
                  : []
          }
          actions={
            <ActionPanel>
              <Action.Push
                title={
                  dest.type === "task" ? "Add Subtask Here" : "Add Task Here"
                }
                icon={Icon.Plus}
                target={
                  <TaskForm
                    destination={dest}
                    tags={tags}
                    onTaskAdded={revalidateDestinations}
                  />
                }
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

function TaskForm({
  destination,
  tags,
  onTaskAdded,
}: {
  destination: Destination;
  tags: { id: string; name: string }[];
  onTaskAdded: () => void;
}) {
  const [repeatValue, setRepeatValue] = useState("");

  const destinationLabel =
    destination.type === "inbox"
      ? "Inbox"
      : destination.type === "project"
        ? destination.name
        : destination.breadcrumb;

  async function handleSubmit(values: {
    name: string;
    note: string;
    dueDate: Date | null;
    flagged: boolean;
    tags: string[];
    repeat: string;
    repeatMethod: string;
    customRepeat: string;
  }) {
    if (!values.name.trim()) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Task name is required",
      });
      return;
    }

    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Creating task...",
    });

    try {
      // Resolve tag names from IDs
      const tagNames = values.tags.map((tagId) => {
        const tag = tags.find((t) => t.id === tagId);
        return tag?.name ?? tagId;
      });

      const taskId = await addTask(destination, {
        name: values.name.trim(),
        note: values.note?.trim() || undefined,
        dueDate: values.dueDate || undefined,
        flagged: values.flagged,
        tags: tagNames,
      });

      // Set repetition if specified
      const ruleString =
        values.repeat === "__custom__"
          ? values.customRepeat?.trim()
          : values.repeat;
      if (ruleString) {
        const method = (values.repeatMethod as RepetitionMethod) || "fixed";
        await setRepetition(taskId, ruleString, method);
      }

      toast.style = Toast.Style.Success;
      toast.title =
        destination.type === "task" ? "Subtask added" : "Task added";
      toast.message = `"${values.name}" → ${destinationLabel}`;

      onTaskAdded();
      await popToRoot();
    } catch (error) {
      toast.style = Toast.Style.Failure;
      toast.title = "Failed to create task";
      toast.message = error instanceof Error ? error.message : String(error);
    }
  }

  return (
    <Form
      navigationTitle={`Add to: ${destinationLabel}`}
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Add Task"
            icon={Icon.Plus}
            onSubmit={handleSubmit}
          />
        </ActionPanel>
      }
    >
      <Form.Description
        title="Destination"
        text={
          destination.type === "task"
            ? `Subtask of: ${destinationLabel}`
            : destinationLabel
        }
      />

      <Form.TextField
        id="name"
        title="Name"
        placeholder="Task name"
        autoFocus
      />

      <Form.Checkbox id="flagged" label="Flagged" defaultValue={false} />

      <Form.Separator />

      <Form.TagPicker id="tags" title="Tags">
        {tags.map((tag) => (
          <Form.TagPicker.Item key={tag.id} value={tag.id} title={tag.name} />
        ))}
      </Form.TagPicker>

      <Form.DatePicker
        id="dueDate"
        title="Due Date"
        type={Form.DatePicker.Type.DateTime}
      />

      <Form.Separator />

      <Form.Dropdown id="repeat" title="Repeat" onChange={setRepeatValue}>
        {REPEAT_PRESETS.map((preset) => (
          <Form.Dropdown.Item
            key={preset.value || "none"}
            value={preset.value}
            title={preset.label}
          />
        ))}
      </Form.Dropdown>

      {repeatValue && repeatValue !== "__custom__" && (
        <Form.Dropdown
          id="repeatMethod"
          title="Repeat Method"
          defaultValue="fixed"
        >
          {REPEAT_METHODS.map((m) => (
            <Form.Dropdown.Item key={m.value} value={m.value} title={m.label} />
          ))}
        </Form.Dropdown>
      )}

      {repeatValue === "__custom__" && (
        <>
          <Form.TextField
            id="customRepeat"
            title="Custom Rule"
            placeholder="FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE,FR"
            info="iCalendar RRULE format"
          />
          <Form.Dropdown
            id="repeatMethod"
            title="Repeat Method"
            defaultValue="fixed"
          >
            {REPEAT_METHODS.map((m) => (
              <Form.Dropdown.Item
                key={m.value}
                value={m.value}
                title={m.label}
              />
            ))}
          </Form.Dropdown>
        </>
      )}

      <Form.Separator />

      <Form.TextArea
        id="note"
        title="Note"
        placeholder="Add a note..."
        enableMarkdown
      />
    </Form>
  );
}
