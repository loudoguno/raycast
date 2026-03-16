import {
  Action,
  ActionPanel,
  Form,
  getPreferenceValues,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { getGraphOrPrimary } from "./lib/graph-config";
import { appendToDailyNote, appendToPage, getAllPages } from "./lib/roam-api";
import type { Preferences } from "./lib/types";

export default function QuickCaptureCommand() {
  const prefs = getPreferenceValues<Preferences>();
  const { pop } = useNavigation();

  const { data: graph, isLoading: isGraphLoading } = usePromise(
    () => getGraphOrPrimary(prefs.primaryGraph),
    [],
  );

  const { data: pages, isLoading: isPagesLoading } = usePromise(
    async (g) => {
      if (!g) return {};
      return getAllPages(g);
    },
    [graph],
  );

  return (
    <Form
      navigationTitle={graph ? `Capture → ${graph.name}` : "Quick Capture"}
      isLoading={isGraphLoading || isPagesLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Capture"
            onSubmit={async (values: { content: string; page: string }) => {
              if (!graph) return;
              const content = values.content.trim();
              if (!content) {
                await showToast({
                  title: "Content can't be empty",
                  style: Toast.Style.Failure,
                });
                return;
              }

              await showToast({
                title: "Saving…",
                style: Toast.Style.Animated,
              });
              try {
                if (values.page) {
                  await appendToPage(graph, values.page, content);
                } else {
                  await appendToDailyNote(graph, content);
                }
                await showToast({
                  title: "Captured!",
                  style: Toast.Style.Success,
                });
                pop();
              } catch (e) {
                const msg = e instanceof Error ? e.message : "Failed";
                await showToast({
                  title: "Capture failed",
                  message: msg,
                  style: Toast.Style.Failure,
                });
              }
            }}
          />
        </ActionPanel>
      }
    >
      <Form.TextArea
        id="content"
        title="Content"
        placeholder="What's on your mind?"
        autoFocus
      />
      <Form.Dropdown id="page" title="Destination" defaultValue="">
        <Form.Dropdown.Item key="dnp" value="" title="Daily Note (default)" />
        {pages &&
          Object.entries(pages)
            .sort(([, a], [, b]) => a.localeCompare(b))
            .map(([uid, title]) => (
              <Form.Dropdown.Item key={uid} value={uid} title={title} />
            ))}
      </Form.Dropdown>
    </Form>
  );
}
