import {
  Form,
  ActionPanel,
  Action,
  showToast,
  Toast,
  open,
} from "@raycast/api";
import * as fs from "fs";
import * as path from "path";
import { STAGE_DIRS } from "./lib/constants";

interface FormValues {
  title: string;
  spark: string;
  tags: string;
  machine: string;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export default function QuickCapture() {
  async function handleSubmit(values: FormValues) {
    const { title, spark, tags, machine } = values;
    if (!title.trim() || !spark.trim()) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Title and Spark are required",
      });
      return;
    }

    const slug = slugify(title);
    const today = new Date().toISOString().slice(0, 10);
    const tagsArray = tags
      ? tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    const frontmatter = [
      "---",
      `title: "${title.replace(/"/g, '\\"')}"`,
      `created: ${today}`,
      `updated: ${today}`,
      `stage: inbox`,
      `tags: [${tagsArray.join(", ")}]`,
      `machine: ${machine}`,
      `session_id: ""`,
      "---",
    ].join("\n");

    const content = `${frontmatter}\n\n${spark}\n`;
    const filePath = path.join(STAGE_DIRS.inbox, `${slug}.md`);

    try {
      fs.mkdirSync(STAGE_DIRS.inbox, { recursive: true });
      fs.writeFileSync(filePath, content, "utf-8");
      await showToast({
        style: Toast.Style.Success,
        title: "Saved to Inbox",
        primaryAction: {
          title: "Open in VS Code",
          onAction: () => open(filePath, "com.microsoft.VSCode"),
        },
      });
    } catch (err) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to save",
        message: String(err),
      });
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Save to Inbox" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="title" title="Title" placeholder="Prompt title" />
      <Form.TextArea id="spark" title="Spark" placeholder="What's the idea?" />
      <Form.TextField
        id="tags"
        title="Tags"
        placeholder="comma-separated (optional)"
      />
      <Form.Dropdown id="machine" title="Machine" defaultValue="any">
        <Form.Dropdown.Item value="mx3" title="mx3" />
        <Form.Dropdown.Item value="mxb" title="mxb" />
        <Form.Dropdown.Item value="any" title="any" />
      </Form.Dropdown>
    </Form>
  );
}
