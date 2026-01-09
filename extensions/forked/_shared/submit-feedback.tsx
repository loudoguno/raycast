/**
 * Submit Feedback Command
 *
 * Creates a GitHub issue in the raycast/extensions repo (or your fork)
 * linked to this specific extension. Enables iterative development
 * workflow where you can submit improvements from the extension itself.
 *
 * SETUP:
 * 1. Copy this file to your extension's src/ directory
 * 2. Add the command to package.json (see below)
 * 3. Configure EXTENSION_INFO at the bottom
 *
 * WORKFLOW:
 * 1. User runs "Submit Feedback" command
 * 2. Fills out form (type, title, description)
 * 3. Issue created in GitHub
 * 4. Claude Code can pick up the issue and implement
 * 5. PR submitted, user gets update
 */

import {
  Action,
  ActionPanel,
  Form,
  showToast,
  Toast,
  getPreferenceValues,
  open,
  Clipboard,
  popToRoot,
} from "@raycast/api";
import { useState } from "react";

// ============================================
// CONFIGURE THIS FOR YOUR EXTENSION
// ============================================
const EXTENSION_INFO = {
  // Your GitHub repo (fork of raycast/extensions or your own)
  githubRepo: "YOUR_USERNAME/raycast-extensions",

  // Extension name (matches folder in extensions/)
  extensionName: "extension-name-here",

  // Extension display name
  displayName: "Extension Display Name",

  // Labels to add to issues
  defaultLabels: ["enhancement", "extension: extension-name-here"],

  // Optional: Link to your CLAUDE.md or contribution guide
  contributingUrl: "",
};
// ============================================

interface Preferences {
  githubToken?: string;
}

interface FormValues {
  feedbackType: string;
  title: string;
  description: string;
  steps?: string;
  expected?: string;
  actual?: string;
  priority: string;
}

const FEEDBACK_TYPES = [
  { value: "bug", title: "🐛 Bug Report" },
  { value: "feature", title: "✨ Feature Request" },
  { value: "improvement", title: "🔧 Improvement" },
  { value: "question", title: "❓ Question" },
];

const PRIORITIES = [
  { value: "low", title: "Low - Nice to have" },
  { value: "medium", title: "Medium - Would improve workflow" },
  { value: "high", title: "High - Blocking my usage" },
];

export default function SubmitFeedback() {
  const [feedbackType, setFeedbackType] = useState("feature");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const preferences = getPreferenceValues<Preferences>();

  async function handleSubmit(values: FormValues) {
    setIsSubmitting(true);

    try {
      const issueBody = generateIssueBody(values);
      const issueTitle = `[${EXTENSION_INFO.displayName}] ${values.title}`;

      if (preferences.githubToken) {
        // Direct API submission
        await createGitHubIssue(issueTitle, issueBody, values, preferences.githubToken);
        await showToast({
          style: Toast.Style.Success,
          title: "Feedback Submitted",
          message: "Issue created in GitHub",
        });
      } else {
        // Fallback: Open GitHub new issue page with pre-filled content
        const url = generateGitHubIssueUrl(issueTitle, issueBody, values);
        await open(url);
        await showToast({
          style: Toast.Style.Success,
          title: "Opening GitHub",
          message: "Complete the issue submission in your browser",
        });
      }

      // Copy issue body to clipboard as backup
      await Clipboard.copy(issueBody);

      popToRoot();
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Submission Failed",
        message: error instanceof Error ? error.message : "Unknown error",
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
          <Action.SubmitForm title="Submit Feedback" onSubmit={handleSubmit} />
          <Action
            title="Open Extension Issues"
            onAction={() =>
              open(
                `https://github.com/${EXTENSION_INFO.githubRepo}/issues?q=is%3Aissue+label%3A%22extension%3A+${EXTENSION_INFO.extensionName}%22`
              )
            }
          />
        </ActionPanel>
      }
    >
      <Form.Description
        title="Submit Feedback"
        text={`Share feedback for ${EXTENSION_INFO.displayName}. This will create a GitHub issue that can be picked up for implementation.`}
      />

      <Form.Dropdown id="feedbackType" title="Type" value={feedbackType} onChange={setFeedbackType}>
        {FEEDBACK_TYPES.map((type) => (
          <Form.Dropdown.Item key={type.value} value={type.value} title={type.title} />
        ))}
      </Form.Dropdown>

      <Form.TextField id="title" title="Title" placeholder="Brief summary of your feedback" />

      <Form.TextArea
        id="description"
        title="Description"
        placeholder="Describe your feedback in detail..."
        enableMarkdown
      />

      {feedbackType === "bug" && (
        <>
          <Form.Separator />
          <Form.TextArea
            id="steps"
            title="Steps to Reproduce"
            placeholder="1. Open command X&#10;2. Click Y&#10;3. See error"
          />
          <Form.TextField id="expected" title="Expected Behavior" placeholder="What should happen" />
          <Form.TextField id="actual" title="Actual Behavior" placeholder="What actually happens" />
        </>
      )}

      <Form.Separator />

      <Form.Dropdown id="priority" title="Priority" defaultValue="medium">
        {PRIORITIES.map((p) => (
          <Form.Dropdown.Item key={p.value} value={p.value} title={p.title} />
        ))}
      </Form.Dropdown>

      {!preferences.githubToken && (
        <Form.Description
          title="Note"
          text="Add a GitHub token in preferences for direct submission, or the issue will open in your browser."
        />
      )}
    </Form>
  );
}

function generateIssueBody(values: FormValues): string {
  const sections = [
    `## ${FEEDBACK_TYPES.find((t) => t.value === values.feedbackType)?.title || "Feedback"}`,
    "",
    `**Extension**: ${EXTENSION_INFO.displayName}`,
    `**Priority**: ${values.priority}`,
    "",
    "### Description",
    values.description,
  ];

  if (values.feedbackType === "bug") {
    sections.push(
      "",
      "### Steps to Reproduce",
      values.steps || "_Not provided_",
      "",
      "### Expected Behavior",
      values.expected || "_Not provided_",
      "",
      "### Actual Behavior",
      values.actual || "_Not provided_"
    );
  }

  sections.push(
    "",
    "---",
    `_Submitted via ${EXTENSION_INFO.displayName} extension feedback command_`,
    "",
    "<!-- CLAUDE_CODE_CONTEXT",
    `Extension: ${EXTENSION_INFO.extensionName}`,
    `Repo: ${EXTENSION_INFO.githubRepo}`,
    `Type: ${values.feedbackType}`,
    `Priority: ${values.priority}`,
    "-->",
  );

  return sections.join("\n");
}

function generateGitHubIssueUrl(title: string, body: string, values: FormValues): string {
  const labels = [...EXTENSION_INFO.defaultLabels];
  if (values.feedbackType === "bug") labels.push("bug");
  if (values.feedbackType === "feature") labels.push("enhancement");

  const params = new URLSearchParams({
    title,
    body,
    labels: labels.join(","),
  });

  return `https://github.com/${EXTENSION_INFO.githubRepo}/issues/new?${params.toString()}`;
}

async function createGitHubIssue(
  title: string,
  body: string,
  values: FormValues,
  token: string
): Promise<void> {
  const labels = [...EXTENSION_INFO.defaultLabels];
  if (values.feedbackType === "bug") labels.push("bug");
  if (values.feedbackType === "feature") labels.push("enhancement");

  const response = await fetch(`https://api.github.com/repos/${EXTENSION_INFO.githubRepo}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github.v3+json",
    },
    body: JSON.stringify({
      title,
      body,
      labels,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `GitHub API error: ${response.status}`);
  }
}
