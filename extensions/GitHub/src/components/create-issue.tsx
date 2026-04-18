import {
  Action,
  ActionPanel,
  Form,
  Icon,
  Toast,
  showToast,
  useNavigation,
  open,
} from "@raycast/api";
import { usePromise } from "@raycast/utils";
import {
  createIssue,
  fetchLabels,
  fetchMilestones,
  fetchCollaborators,
} from "../lib/github-client";

export function CreateIssueForm({
  owner,
  repo,
}: {
  owner: string;
  repo: string;
}) {
  const { pop } = useNavigation();

  const { data: labels, isLoading: labelsLoading } = usePromise(fetchLabels, [
    owner,
    repo,
  ]);
  const { data: milestones, isLoading: milestonesLoading } = usePromise(
    fetchMilestones,
    [owner, repo],
  );
  const { data: collaborators, isLoading: collabsLoading } = usePromise(
    fetchCollaborators,
    [owner, repo],
  );

  const isLoading = labelsLoading || milestonesLoading || collabsLoading;

  async function handleSubmit(values: {
    title: string;
    body: string;
    labels: string[];
    assignees: string[];
    milestone: string;
  }) {
    if (!values.title.trim()) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Title is required",
      });
      return;
    }

    try {
      await showToast({
        style: Toast.Style.Animated,
        title: "Creating issue...",
      });

      const issueUrl = await createIssue(owner, repo, {
        title: values.title.trim(),
        body: values.body || undefined,
        labels: values.labels.length > 0 ? values.labels : undefined,
        assignees: values.assignees.length > 0 ? values.assignees : undefined,
        milestone: values.milestone
          ? parseInt(values.milestone, 10)
          : undefined,
      });

      await showToast({
        style: Toast.Style.Success,
        title: "Issue created",
        primaryAction: {
          title: "Open in Browser",
          onAction: () => open(issueUrl),
        },
      });

      pop();
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to create issue",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return (
    <Form
      isLoading={isLoading}
      navigationTitle={`New Issue · ${owner}/${repo}`}
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Create Issue"
            icon={Icon.Plus}
            onSubmit={handleSubmit}
          />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="title"
        title="Title"
        placeholder="Issue title"
        autoFocus
      />
      <Form.TextArea
        id="body"
        title="Description"
        placeholder="Describe the issue... (Markdown supported)"
        enableMarkdown
      />

      <Form.Separator />

      <Form.TagPicker id="labels" title="Labels">
        {labels?.map((label) => (
          <Form.TagPicker.Item
            key={label.name}
            value={label.name}
            title={label.name}
            icon={{ source: Icon.Dot, tintColor: `#${label.color}` }}
          />
        ))}
      </Form.TagPicker>

      <Form.TagPicker id="assignees" title="Assignees">
        {collaborators?.map((c) => (
          <Form.TagPicker.Item
            key={c.login}
            value={c.login}
            title={c.login}
            icon={Icon.Person}
          />
        ))}
      </Form.TagPicker>

      <Form.Dropdown id="milestone" title="Milestone">
        <Form.Dropdown.Item value="" title="None" />
        {milestones?.map((m) => (
          <Form.Dropdown.Item
            key={m.number}
            value={String(m.number)}
            title={m.title}
          />
        ))}
      </Form.Dropdown>
    </Form>
  );
}
