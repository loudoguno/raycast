import {
  Form,
  ActionPanel,
  Action,
  showToast,
  Toast,
  Icon,
  popToRoot,
} from "@raycast/api";
import { useState, useEffect } from "react";
import { isBdInstalled, createIssue } from "./lib/bd-client";
import { discoverProjectPaths } from "./lib/project-scanner";
import { CREATE_TIPS } from "./lib/education";
import type { BeadType } from "./lib/types";

export default function BeadsCreate() {
  const [projects, setProjects] = useState<{ name: string; path: string }[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isBdInstalled()) {
      showToast({
        style: Toast.Style.Failure,
        title: "Beads not installed",
        message: "Install with: brew install beads",
      });
      setIsLoading(false);
      return;
    }

    const discovered = discoverProjectPaths();
    setProjects(discovered);
    setIsLoading(false);
  }, []);

  async function handleSubmit(values: {
    project: string;
    title: string;
    type: BeadType;
    priority: string;
    description: string;
    labels: string;
    parent: string;
  }) {
    if (!values.title.trim()) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Title is required",
      });
      return;
    }

    if (!values.project) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Select a project",
      });
      return;
    }

    try {
      const result = createIssue(values.project, values.title.trim(), {
        type: values.type || undefined,
        priority: values.priority ? parseInt(values.priority) : undefined,
        description: values.description?.trim() || undefined,
        labels: values.labels?.trim() || undefined,
        parent: values.parent?.trim() || undefined,
      });

      // Extract issue ID from the result text
      const idMatch = result.match(/([A-Za-z]+-[a-z0-9]+)/);
      const issueId = idMatch ? idMatch[1] : "new issue";

      await showToast({
        style: Toast.Style.Success,
        title: "Bead created!",
        message: `${issueId} in ${projects.find((p) => p.path === values.project)?.name || "project"}`,
      });
      popToRoot();
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to create bead",
        message: String(error),
      });
    }
  }

  if (!isLoading && projects.length === 0) {
    return (
      <Form>
        <Form.Description text="No beads-enabled projects found. Run `bd init` in a project first, or check your scan directory in preferences." />
      </Form>
    );
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Create Bead"
            icon={Icon.Plus}
            onSubmit={handleSubmit}
          />
        </ActionPanel>
      }
    >
      <Form.Dropdown id="project" title="Project" info={CREATE_TIPS.title}>
        {projects.map((p) => (
          <Form.Dropdown.Item
            key={p.path}
            value={p.path}
            title={p.name}
            icon={Icon.Folder}
          />
        ))}
      </Form.Dropdown>

      <Form.TextField
        id="title"
        title="Title"
        placeholder="Fix login redirect on expired sessions"
        info={CREATE_TIPS.title}
      />

      <Form.Dropdown
        id="type"
        title="Type"
        defaultValue="task"
        info={CREATE_TIPS.type}
      >
        <Form.Dropdown.Item value="task" title="Task" icon={Icon.CheckCircle} />
        <Form.Dropdown.Item value="bug" title="Bug" icon={Icon.Bug} />
        <Form.Dropdown.Item value="feature" title="Feature" icon={Icon.Star} />
        <Form.Dropdown.Item value="chore" title="Chore" icon={Icon.Hammer} />
        <Form.Dropdown.Item value="epic" title="Epic" icon={Icon.Folder} />
        <Form.Dropdown.Item
          value="decision"
          title="Decision (ADR)"
          icon={Icon.LightBulb}
        />
      </Form.Dropdown>

      <Form.Dropdown
        id="priority"
        title="Priority"
        defaultValue="2"
        info={CREATE_TIPS.priority}
      >
        <Form.Dropdown.Item
          value="4"
          title="Critical (4)"
          icon={{ source: Icon.ExclamationMark, tintColor: "#EF4444" }}
        />
        <Form.Dropdown.Item
          value="3"
          title="High (3)"
          icon={{ source: Icon.ArrowUp, tintColor: "#F97316" }}
        />
        <Form.Dropdown.Item
          value="2"
          title="Medium (2)"
          icon={{ source: Icon.Minus, tintColor: "#F59E0B" }}
        />
        <Form.Dropdown.Item
          value="1"
          title="Low (1)"
          icon={{ source: Icon.ArrowDown, tintColor: "#3B82F6" }}
        />
        <Form.Dropdown.Item
          value="0"
          title="Backlog (0)"
          icon={{ source: Icon.Tray, tintColor: "#6B7280" }}
        />
      </Form.Dropdown>

      <Form.TextArea
        id="description"
        title="Description"
        placeholder="Markdown supported. Include what 'done' looks like so agents know when to stop."
        info={CREATE_TIPS.description}
      />

      <Form.Separator />

      <Form.TextField
        id="labels"
        title="Labels"
        placeholder="health,ui,auth (comma-separated)"
        info={CREATE_TIPS.labels}
      />

      <Form.TextField
        id="parent"
        title="Parent Issue ID"
        placeholder="e.g., LouCam-973 (nest under an epic)"
        info={CREATE_TIPS.parent}
      />
    </Form>
  );
}
