import {
  List,
  Icon,
  Color,
  ActionPanel,
  Action,
  showToast,
  Toast,
  Keyboard,
  confirmAlert,
  Alert,
} from "@raycast/api";
import { useState, useEffect, useCallback } from "react";
import * as fs from "fs";
import * as path from "path";
import matter from "gray-matter";
import { STAGE_DIRS, STAGES, Stage } from "./lib/constants";

interface Prompt {
  title: string;
  stage: Stage;
  tags: string[];
  machine: string;
  updated: string;
  body: string;
  filePath: string;
}

const STAGE_ICONS: Record<Stage, { icon: Icon; color: Color }> = {
  inbox: { icon: Icon.Tray, color: Color.Blue },
  wip: { icon: Icon.Hammer, color: Color.Orange },
  outbox: { icon: Icon.Airplane, color: Color.Green },
  complete: { icon: Icon.Trophy, color: Color.Purple },
};

const STAGE_ORDER: Stage[] = ["outbox", "wip", "inbox", "complete"];
const STAGE_FLOW: Stage[] = ["inbox", "wip", "outbox", "complete"];

function getNextStage(current: Stage): Stage | null {
  const idx = STAGE_FLOW.indexOf(current);
  return idx < STAGE_FLOW.length - 1 ? STAGE_FLOW[idx + 1] : null;
}

function getPreviousStage(current: Stage): Stage | null {
  const idx = STAGE_FLOW.indexOf(current);
  return idx > 0 ? STAGE_FLOW[idx - 1] : null;
}

function movePromptToStage(prompt: Prompt, newStage: Stage): string {
  const raw = fs.readFileSync(prompt.filePath, "utf-8");
  const { data, content } = matter(raw);
  data.stage = newStage;
  data.updated = new Date().toISOString().split("T")[0];
  const newContent = matter.stringify(content, data);
  const destDir = STAGE_DIRS[newStage];
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  const newPath = path.join(destDir, path.basename(prompt.filePath));
  fs.writeFileSync(newPath, newContent, "utf-8");
  fs.unlinkSync(prompt.filePath);
  return newPath;
}

function loadPrompts(): Prompt[] {
  const prompts: Prompt[] = [];
  for (const stage of STAGES) {
    const dir = STAGE_DIRS[stage];
    if (!fs.existsSync(dir)) continue;
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".md") && !f.startsWith("_template"));
    for (const file of files) {
      const filePath = path.join(dir, file);
      const raw = fs.readFileSync(filePath, "utf-8");
      const { data, content } = matter(raw);
      prompts.push({
        title: (data.title as string) || file.replace(/\.md$/, ""),
        stage: (data.stage as Stage) || stage,
        tags: Array.isArray(data.tags) ? data.tags : [],
        machine: (data.machine as string) || "any",
        updated: data.updated ? String(data.updated) : "",
        body: content.trim(),
        filePath,
      });
    }
  }
  return prompts;
}

export default function BrowsePromptbox() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(() => {
    setPrompts(loadPrompts());
  }, []);

  useEffect(() => {
    reload();
    setIsLoading(false);
  }, []);

  return (
    <List searchBarPlaceholder="Search prompts…" isLoading={isLoading}>
      {STAGE_ORDER.map((stage) => {
        const stagePrompts = prompts
          .filter((p) => p.stage === stage)
          .sort((a, b) => (b.updated > a.updated ? 1 : -1));
        if (stagePrompts.length === 0) return null;
        const { icon, color } = STAGE_ICONS[stage];
        return (
          <List.Section
            key={stage}
            title={stage.charAt(0).toUpperCase() + stage.slice(1)}
            subtitle={`${stagePrompts.length}`}
          >
            {stagePrompts.map((p) => (
              <List.Item
                key={p.filePath}
                title={p.title}
                subtitle={p.body.slice(0, 80)}
                icon={{ source: icon, tintColor: color }}
                accessories={[
                  ...p.tags.map((t) => ({ tag: t })),
                  { text: p.machine },
                  { date: p.updated ? new Date(p.updated) : undefined },
                ]}
                actions={
                  <ActionPanel>
                    <Action.Open
                      title="Open in VS Code"
                      target={p.filePath}
                      application="com.microsoft.VSCode"
                      icon={Icon.Code}
                    />
                    {getNextStage(p.stage) && (
                      <Action
                        title={`Move to ${(getNextStage(p.stage) as string).charAt(0).toUpperCase() + (getNextStage(p.stage) as string).slice(1)}`}
                        icon={Icon.ArrowRight}
                        shortcut={{
                          modifiers: ["cmd", "shift"],
                          key: "arrowRight",
                        }}
                        onAction={async () => {
                          const next = getNextStage(p.stage)!;
                          movePromptToStage(p, next);
                          await showToast({
                            style: Toast.Style.Success,
                            title: `Moved to ${next}`,
                          });
                          reload();
                        }}
                      />
                    )}
                    {getPreviousStage(p.stage) && (
                      <Action
                        title={`Move to ${(getPreviousStage(p.stage) as string).charAt(0).toUpperCase() + (getPreviousStage(p.stage) as string).slice(1)}`}
                        icon={Icon.ArrowLeft}
                        shortcut={{
                          modifiers: ["cmd", "shift"],
                          key: "arrowLeft",
                        }}
                        onAction={async () => {
                          const prev = getPreviousStage(p.stage)!;
                          movePromptToStage(p, prev);
                          await showToast({
                            style: Toast.Style.Success,
                            title: `Moved to ${prev}`,
                          });
                          reload();
                        }}
                      />
                    )}
                    <Action
                      title="Delete Prompt"
                      icon={Icon.Trash}
                      style={Action.Style.Destructive}
                      shortcut={{ modifiers: ["cmd"], key: "backspace" }}
                      onAction={async () => {
                        if (
                          await confirmAlert({
                            title: "Delete Prompt",
                            message: `Are you sure you want to delete "${p.title}"? This cannot be undone.`,
                            primaryAction: {
                              title: "Delete",
                              style: Alert.ActionStyle.Destructive,
                            },
                          })
                        ) {
                          fs.unlinkSync(p.filePath);
                          await showToast({
                            style: Toast.Style.Success,
                            title: "Prompt deleted",
                          });
                          reload();
                        }
                      }}
                    />
                  </ActionPanel>
                }
              />
            ))}
          </List.Section>
        );
      })}
    </List>
  );
}
