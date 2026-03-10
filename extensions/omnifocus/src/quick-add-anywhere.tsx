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
  Clipboard,
  open,
  Keyboard,
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

function omnifocusUrl(dest: Destination): string | null {
  if (dest.type === "inbox") return "omnifocus:///inbox";
  if (dest.type === "project") return `omnifocus:///project/${dest.id}`;
  if (dest.type === "task") return `omnifocus:///task/${dest.id}`;
  if (dest.type === "folder") return `omnifocus:///folder/${dest.id}`;
  if (dest.type === "tag") return `omnifocus:///tag/${dest.id}`;
  return null;
}

export default function QuickAddAnywhere() {
  const [typeFilter, setTypeFilter] = useState("all");

  const {
    data: rawDestinations,
    isLoading: destinationsLoading,
    revalidate: revalidateDestinations,
  } = usePromise(listDestinations);

  const { data: rawTags, isLoading: tagsLoading } = usePromise(listTags);

  // Defensive: ensure data is always an array
  const destinations = Array.isArray(rawDestinations) ? rawDestinations : [];
  const tags = Array.isArray(rawTags) ? rawTags : [];

  // Merge tags into the destination list as type "tag"
  const tagDestinations: Destination[] = tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    type: "tag" as const,
    breadcrumb: tag.name,
    projectName: null,
    hasChildren: false,
    depth: 0,
  }));
  const allDestinations = [...destinations, ...tagDestinations];

  const filteredDestinations =
    typeFilter === "all"
      ? allDestinations
      : allDestinations.filter((dest) => dest.type === typeFilter);

  function iconForDestination(dest: Destination) {
    if (dest.type === "inbox")
      return { source: Icon.Tray, tintColor: Color.Blue };
    if (dest.type === "folder")
      return { source: Icon.Folder, tintColor: Color.Yellow };
    if (dest.type === "project")
      return { source: Icon.AppWindowGrid2x2, tintColor: Color.Blue };
    if (dest.type === "tag")
      return { source: Icon.Tag, tintColor: Color.Green };
    if (dest.hasChildren) return { source: Icon.List, tintColor: Color.Orange };
    return { source: Icon.Circle, tintColor: Color.SecondaryText };
  }

  function depthPrefix(dest: Destination): string {
    if (dest.type !== "task") return "";
    return "  ".repeat(Math.max(0, dest.depth - 1)) + "└ ";
  }

  return (
    <List
      isLoading={destinationsLoading || tagsLoading}
      searchBarPlaceholder="Search projects and tasks..."
      searchBarAccessory={
        <List.Dropdown tooltip="Filter by Type" onChange={setTypeFilter}>
          <List.Dropdown.Item title="All" value="all" icon={Icon.BulletPoints} />
          <List.Dropdown.Item title="Folders" value="folder" icon={Icon.Folder} />
          <List.Dropdown.Item title="Projects" value="project" icon={Icon.AppWindowGrid2x2} />
          <List.Dropdown.Item title="Tasks" value="task" icon={Icon.Circle} />
          <List.Dropdown.Item title="Tags" value="tag" icon={Icon.Tag} />
        </List.Dropdown>
      }
    >
      {filteredDestinations.map((dest) => (
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
            dest.type === "folder"
              ? [{ tag: "Folder" }]
              : dest.type === "tag"
                ? [{ tag: "Tag" }]
                : dest.hasChildren
                  ? [{ icon: Icon.ChevronRight, tooltip: "Has subtasks" }]
                  : dest.type === "project"
                    ? [{ tag: "Project" }]
                    : dest.type === "inbox"
                      ? [{ tag: "Inbox" }]
                      : []
          }
          actions={
            <ActionPanel>
              {omnifocusUrl(dest) && (
                <Action
                  title="Open in OmniFocus"
                  icon={Icon.Eye}
                  onAction={() => open(omnifocusUrl(dest)!)}
                />
              )}
              <Action.Push
                title={
                  dest.type === "task"
                    ? "Add Subtask Here"
                    : dest.type === "tag"
                      ? "Add Task with Tag"
                      : dest.type === "folder"
                        ? "Add Task to Inbox"
                        : "Add Task Here"
                }
                icon={Icon.Plus}
                shortcut={{ modifiers: ["cmd"], key: "n" }}
                target={
                  <TaskForm
                    destination={
                      dest.type === "folder"
                        ? { id: "__inbox__", name: "Inbox", type: "inbox", breadcrumb: "Inbox", projectName: null, hasChildren: false, depth: 0 }
                        : dest.type === "tag"
                          ? { id: "__inbox__", name: "Inbox", type: "inbox", breadcrumb: "Inbox", projectName: null, hasChildren: false, depth: 0 }
                          : dest
                    }
                    tags={tags}
                    defaultTagIds={dest.type === "tag" ? [dest.id] : undefined}
                    onTaskAdded={revalidateDestinations}
                  />
                }
              />
              {omnifocusUrl(dest) && (
                <Action
                  title="Copy OmniFocus URL"
                  icon={Icon.Link}
                  shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
                  onAction={async () => {
                    await Clipboard.copy(omnifocusUrl(dest)!);
                    await showToast({ style: Toast.Style.Success, title: "URL copied" });
                  }}
                />
              )}
              {omnifocusUrl(dest) && (
                <Action
                  title="Copy as Markdown Link"
                  icon={Icon.CodeBlock}
                  shortcut={{ modifiers: ["cmd", "shift"], key: "m" }}
                  onAction={async () => {
                    const url = omnifocusUrl(dest)!;
                    const md = `[${dest.name}](${url})`;
                    const html = `<a href="${url}">${dest.name}</a>`;
                    await Clipboard.copy({ text: md, html });
                    await showToast({ style: Toast.Style.Success, title: "Markdown link copied" });
                  }}
                />
              )}
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
  defaultTagIds,
  onTaskAdded,
}: {
  destination: Destination;
  tags: { id: string; name: string }[];
  defaultTagIds?: string[];
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
    newTags: string;
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
      // Resolve existing tag names from IDs + parse new tags
      const existingTagNames = values.tags.map((tagId) => {
        const tag = tags.find((t) => t.id === tagId);
        return tag?.name ?? tagId;
      });
      const newTagNames = (values.newTags ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      const tagNames = [...existingTagNames, ...newTagNames];

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

      <Form.TagPicker id="tags" title="Tags" defaultValue={defaultTagIds}>
        {tags.map((tag) => (
          <Form.TagPicker.Item key={tag.id} value={tag.id} title={tag.name} />
        ))}
      </Form.TagPicker>

      <Form.TextField
        id="newTags"
        title="New Tags"
        placeholder="tag1, tag2, ..."
        info="Comma-separated. Creates tags if they don't exist."
      />

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
