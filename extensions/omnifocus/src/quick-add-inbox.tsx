import { LaunchProps, showToast, Toast, popToRoot } from "@raycast/api";
import { addTask } from "./lib/api/add-task";
import { Destination } from "./lib/types";

const INBOX: Destination = {
  id: "__inbox__",
  name: "Inbox",
  type: "inbox",
  breadcrumb: "Inbox",
  projectName: null,
  hasChildren: false,
  depth: 0,
};

export default async function QuickAddInbox(
  props: LaunchProps<{ arguments: { task: string } }>,
) {
  const taskName = props.arguments.task?.trim();
  if (!taskName) {
    await showToast({ style: Toast.Style.Failure, title: "Task name is required" });
    return;
  }

  const toast = await showToast({ style: Toast.Style.Animated, title: "Adding to inbox..." });

  try {
    await addTask(INBOX, { name: taskName });
    toast.style = Toast.Style.Success;
    toast.title = "Added to inbox";
    toast.message = taskName;
    await popToRoot();
  } catch (error) {
    toast.style = Toast.Style.Failure;
    toast.title = "Failed to add task";
    toast.message = error instanceof Error ? error.message : String(error);
  }
}
