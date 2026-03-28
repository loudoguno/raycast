import {
  List,
  Icon,
  Color,
  ActionPanel,
  Action,
  showToast,
  Toast,
  Clipboard,
} from "@raycast/api";
import { useState, useEffect } from "react";
import * as fs from "fs";
import * as path from "path";
import matter from "gray-matter";
import { STAGE_DIRS, CURRENT_MACHINE } from "./lib/constants";

interface Prompt {
  title: string;
  tags: string[];
  machine: string;
  updated: string;
  body: string;
  filePath: string;
}

function loadOutboxPrompts(): Prompt[] {
  const dir = STAGE_DIRS.outbox;
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
        body: content.trim(),
        filePath,
      };
    })
    .sort((a, b) => (b.updated > a.updated ? 1 : -1));
}

export default function FirePrompt() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setPrompts(loadOutboxPrompts());
    setIsLoading(false);
  }, []);

  return (
    <List searchBarPlaceholder="Search outbox prompts…" isLoading={isLoading}>
      {prompts.length === 0 ? (
        <List.EmptyView
          title="No outbox prompts"
          description="Move prompts to outbox to fire them"
        />
      ) : (
        prompts.map((p) => {
          const isCrossMachine =
            p.machine !== "any" && p.machine !== CURRENT_MACHINE;
          return (
            <List.Item
              key={p.filePath}
              title={p.title}
              subtitle={
                isCrossMachine
                  ? `⚠️ Target: ${p.machine} (current: ${CURRENT_MACHINE})`
                  : p.body.slice(0, 80)
              }
              icon={{
                source: Icon.Airplane,
                tintColor: isCrossMachine ? Color.Orange : Color.Green,
              }}
              accessories={[
                ...p.tags.map((t) => ({ tag: t })),
                ...(isCrossMachine
                  ? [
                      {
                        icon: {
                          source: Icon.ExclamationMark,
                          tintColor: Color.Orange,
                        },
                        tooltip: `This prompt targets ${p.machine}, but you are on ${CURRENT_MACHINE}`,
                      },
                    ]
                  : []),
                { text: p.machine },
                { date: p.updated ? new Date(p.updated) : undefined },
              ]}
              actions={
                <ActionPanel>
                  <Action
                    title="Fire Prompt"
                    icon={Icon.Airplane}
                    onAction={async () => {
                      await Clipboard.copy(p.body);
                      await showToast({
                        style: isCrossMachine
                          ? Toast.Style.Animated
                          : Toast.Style.Success,
                        title: isCrossMachine
                          ? `⚠️ Warning: prompt targets ${p.machine}, you are on ${CURRENT_MACHINE}`
                          : "Prompt copied — paste into Claude Code",
                      });
                    }}
                  />
                  <Action.CopyToClipboard
                    title="Copy Content"
                    content={p.body}
                    shortcut={{ modifiers: ["cmd"], key: "c" }}
                  />
                </ActionPanel>
              }
            />
          );
        })
      )}
    </List>
  );
}
