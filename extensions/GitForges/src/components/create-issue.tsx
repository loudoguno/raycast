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
import { getProvider } from "../lib/providers";
import type { Repo } from "../lib/types";

const PROVIDER_LABEL: Record<Repo["provider"], string> = {
  github: "GitHub",
  forgejo: "Forgejo",
};

export function CreateIssueForm({ repo }: { repo: Repo }) {
  const { pop } = useNavigation();
  const provider = getProvider(repo.provider);

  const { data: labels, isLoading: labelsLoading } = usePromise(
    provider.fetchLabels.bind(provider),
    [repo.owner.login, repo.name],
  );
  const { data: milestones, isLoading: milestonesLoading } = usePromise(
    provider.fetchMilestones.bind(provider),
    [repo.owner.login, repo.name],
  );
  const { data: collaborators, isLoading: collabsLoading } = usePromise(
    provider.fetchCollaborators.bind(provider),
    [repo.owner.login, repo.name],
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

      const issueUrl = await provider.createIssue(repo.owner.login, repo.name, {
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
        title: `Issue created on ${PROVIDER_LABEL[repo.provider]}`,
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
      navigationTitle={`New Issue \u00b7 ${repo.fullName} (${PROVIDER_LABEL[repo.provider]})`}
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
