import {
  List,
  Icon,
  Color,
  ActionPanel,
  Action,
  showToast,
  Toast,
} from "@raycast/api";
import { useState, useEffect, useCallback } from "react";
import * as fs from "fs";
import * as path from "path";
import matter from "gray-matter";
import { STAGE_DIRS } from "./lib/constants";

interface CompletedPrompt {
  title: string;
  tags: string[];
  machine: string;
  updated: string;
  fired: string;
  sessionId: string;
  body: string;
  filePath: string;
}

function loadCompletePrompts(): CompletedPrompt[] {
  const dir = STAGE_DIRS.complete;
  if (!fs.existsSync(dir)) return [];
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_template"));
  return files
    .map((file) => {
      const filePath = path.join(dir, file);
      const raw = fs.readFileSync(filePath, "utf-8");
      const { data, content } = matter(raw);
      return {
        title: (data.title as string) || file.replace(/\.md$/, ""),
        tags: Array.isArray(data.tags) ? data.tags : [],
        machine: (data.machine as string) || "any",
        updated: data.updated ? String(data.updated) : "",
        fired: data.fired ? String(data.fired) : "",
        sessionId: data.session_id ? String(data.session_id) : "",
        body: content.trim(),
        filePath,
      };
    })
    .sort((a, b) => (b.updated > a.updated ? 1 : -1));
}

function moveToOutbox(prompt: CompletedPrompt): string {
  const raw = fs.readFileSync(prompt.filePath, "utf-8");
  const { data, content } = matter(raw);
  data.stage = "outbox";
  data.updated = new Date().toISOString().split("T")[0];
  const newContent = matter.stringify(content, data);
  const destDir = STAGE_DIRS.outbox;
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  const newPath = path.join(destDir, path.basename(prompt.filePath));
  fs.writeFileSync(newPath, newContent, "utf-8");
  fs.unlinkSync(prompt.filePath);
  return newPath;
}

export default function ReviewComplete() {
  const [prompts, setPrompts] = useState<CompletedPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(() => {
    setPrompts(loadCompletePrompts());
  }, []);

  useEffect(() => {
    reload();
    setIsLoading(false);
  }, []);

  return (
    <List
      searchBarPlaceholder="Search completed prompts…"
      isLoading={isLoading}
      isShowingDetail
    >
      {prompts.length === 0 ? (
        <List.EmptyView
          title="No completed prompts"
          description="Completed prompts appear here after firing"
        />
      ) : (
        prompts.map((p) => (
          <List.Item
            key={p.filePath}
            title={p.title}
            icon={{ source: Icon.Trophy, tintColor: Color.Purple }}
            accessories={[
              ...p.tags.map((t) => ({ tag: t })),
              { text: p.machine },
            ]}
            detail={<List.Item.Detail markdown={p.body} />}
            actions={
              <ActionPanel>
                {p.sessionId ? (
                  <Action.CopyToClipboard
                    title="Copy Resume Command"
                    content={`claude --resume ${p.sessionId}`}
                    icon={Icon.Terminal}
                  />
                ) : null}
                <Action
                  title="Revisit (move to Outbox)"
                  icon={Icon.ArrowRight}
                  onAction={async () => {
                    moveToOutbox(p);
                    await showToast({
                      style: Toast.Style.Success,
                      title: "Moved back to Outbox",
                    });
                    reload();
                  }}
                />
                <Action.Open
                  title="Open in VS Code"
                  target={p.filePath}
                  application="com.microsoft.VSCode"
                  icon={Icon.Code}
                />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
