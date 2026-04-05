import {
  Action,
  ActionPanel,
  Form,
  Icon,
  List,
  LocalStorage,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { useEffect, useRef, useState } from "react";
import { discoverExtensions } from "./lib/extensions";
import { createIssue } from "./lib/github-client";
import { DraftState, ExtensionInfo } from "./lib/types";

const DRAFT_KEY = "feedback-draft";

const FEEDBACK_TYPES = [
  { value: "bug", label: "Bug Report" },
  { value: "feature", label: "Feature Request" },
  { value: "improvement", label: "Improvement" },
] as const;

function typeToLabel(type: string): string {
  switch (type) {
    case "bug":
      return "bug";
    case "feature":
      return "enhancement";
    case "improvement":
      return "improvement";
    default:
      return "feedback";
  }
}

function FeedbackForm({
  extensions,
  draft,
  onClearDraft,
}: {
  extensions: ExtensionInfo[];
  draft?: DraftState;
  onClearDraft: () => void;
}) {
  const { pop } = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  // Track current form values for draft saving
  const formValues = useRef({
    extensionName: draft?.extensionName || extensions[0]?.name || "",
    title: draft?.title || "",
    description: draft?.description || "",
    feedbackType: draft?.feedbackType || "bug",
  });

  function saveDraft() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const v = formValues.current;
      if (!v.title && !v.description) return; // Don't save empty drafts
      const state: DraftState = {
        extensionName: v.extensionName,
        title: v.title,
        description: v.description,
        feedbackType: v.feedbackType,
        savedAt: Date.now(),
      };
      await LocalStorage.setItem(DRAFT_KEY, JSON.stringify(state));
    }, 1000);
  }

  async function handleSubmit(values: {
    extensionName: string;
    title: string;
    description: string;
    feedbackType: string;
  }) {
    setIsSubmitting(true);
    try {
      const ext = extensions.find((e) => e.name === values.extensionName);
      const extLabel = ext ? ext.name : values.extensionName;
      const issueTitle = `[${extLabel}] ${values.title}`;
      const labels = ["feedback", `ext:${extLabel}`, typeToLabel(values.feedbackType)];

      const issue = await createIssue({
        title: issueTitle,
        body: values.description || "_No description provided._",
        labels,
      });

      await LocalStorage.removeItem(DRAFT_KEY);
      onClearDraft();
      await showToast({
        style: Toast.Style.Success,
        title: "Feedback submitted",
        message: `#${issue.number}`,
        primaryAction: {
          title: "Open in Browser",
          onAction: () => {
            import("@raycast/api").then(({ open }) => open(issue.html_url));
          },
        },
      });
      pop();
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to submit",
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form
      isLoading={isSubmitting}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Submit Feedback" icon={Icon.Upload} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Dropdown
        id="extensionName"
        title="Extension"
        defaultValue={formValues.current.extensionName}
        onChange={(v) => {
          formValues.current.extensionName = v;
          saveDraft();
        }}
      >
        {extensions.map((ext) => (
          <Form.Dropdown.Item key={ext.name} value={ext.name} title={ext.title} />
        ))}
      </Form.Dropdown>

      <Form.Dropdown
        id="feedbackType"
        title="Type"
        defaultValue={formValues.current.feedbackType}
        onChange={(v) => {
          formValues.current.feedbackType = v;
          saveDraft();
        }}
      >
        {FEEDBACK_TYPES.map((t) => (
          <Form.Dropdown.Item key={t.value} value={t.value} title={t.label} />
        ))}
      </Form.Dropdown>

      <Form.TextField
        id="title"
        title="Title"
        placeholder="Brief summary of the feedback"
        defaultValue={formValues.current.title}
        onChange={(v) => {
          formValues.current.title = v;
          saveDraft();
        }}
      />

      <Form.TextArea
        id="description"
        title="Description"
        placeholder="Describe the issue, expected behavior, or feature request"
        defaultValue={formValues.current.description}
        onChange={(v) => {
          formValues.current.description = v;
          saveDraft();
        }}
      />
    </Form>
  );
}

export default function SubmitFeedback() {
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const extensions = discoverExtensions();
  const { push } = useNavigation();

  useEffect(() => {
    LocalStorage.getItem<string>(DRAFT_KEY).then((raw) => {
      if (raw) {
        try {
          setDraft(JSON.parse(raw));
        } catch {
          // Corrupted draft — ignore
        }
      }
      setIsLoading(false);
    });
  }, []);

  // No draft or user chose to skip — show form directly
  if (showForm || (!isLoading && !draft)) {
    return <FeedbackForm extensions={extensions} draft={draft ?? undefined} onClearDraft={() => setDraft(null)} />;
  }

  // Draft exists — show resume prompt
  if (draft) {
    const ext = extensions.find((e) => e.name === draft.extensionName);
    const savedAgo = formatTimeAgo(draft.savedAt);

    return (
      <List isLoading={isLoading}>
        <List.Item
          title={`Continue: ${draft.title || "(untitled)"}`}
          subtitle={ext?.title}
          accessories={[{ text: savedAgo, icon: Icon.Clock }]}
          actions={
            <ActionPanel>
              <Action
                title="Continue Editing"
                icon={Icon.Pencil}
                onAction={() => {
                  push(
                    <FeedbackForm extensions={extensions} draft={draft} onClearDraft={() => setDraft(null)} />,
                  );
                }}
              />
              <Action
                title="Discard Draft"
                icon={Icon.Trash}
                style={Action.Style.Destructive}
                shortcut={{ modifiers: ["ctrl"], key: "x" }}
                onAction={async () => {
                  await LocalStorage.removeItem(DRAFT_KEY);
                  setDraft(null);
                  setShowForm(true);
                }}
              />
              <Action
                title="New Feedback"
                icon={Icon.Plus}
                shortcut={{ modifiers: ["cmd"], key: "n" }}
                onAction={() => {
                  setDraft(null);
                  setShowForm(true);
                }}
              />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  return <List isLoading={true} />;
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
