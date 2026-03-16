import {
  Action,
  ActionPanel,
  Form,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { saveGraph } from "./lib/graph-config";
import { createClient, q } from "./lib/roam-client";

export default function AddGraphCommand() {
  const { pop } = useNavigation();

  return (
    <Form
      navigationTitle="Add Roam Graph"
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Connect Graph"
            onSubmit={async (values: { name: string; token: string }) => {
              const name = values.name.trim();
              const token = values.token.trim();

              if (!name || !token) {
                await showToast({
                  title: "Name and token are required",
                  style: Toast.Style.Failure,
                });
                return;
              }

              // Validate the connection
              await showToast({
                title: "Connecting…",
                style: Toast.Style.Animated,
              });
              try {
                const client = createClient(name, token);
                await q(client, "[:find ?e . :where [?e :node/title]]");
                await saveGraph({ name, token });
                await showToast({
                  title: `Connected to ${name}`,
                  style: Toast.Style.Success,
                });
                pop();
              } catch (e) {
                const msg = e instanceof Error ? e.message : "Unknown error";
                await showToast({
                  title: "Connection failed",
                  message: msg,
                  style: Toast.Style.Failure,
                });
              }
            }}
          />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="name"
        title="Graph Name"
        placeholder="my-graph"
        info="The name of your Roam graph (visible in the URL: roamresearch.com/#/app/GRAPH_NAME)"
      />
      <Form.PasswordField
        id="token"
        title="API Token"
        placeholder="roam-graph-token-..."
        info="Generate at: Roam → Settings → Graph → API Tokens → + New API Token. Use 'edit' scope for full functionality."
      />
      <Form.Description
        title=""
        text="You must be the graph owner to generate API tokens. Encrypted graphs are not supported."
      />
    </Form>
  );
}
