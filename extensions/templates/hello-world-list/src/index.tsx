import { List, ActionPanel, Action, Icon } from "@raycast/api";

interface Item {
  id: string;
  title: string;
  subtitle: string;
  icon: Icon;
}

const items: Item[] = [
  {
    id: "1",
    title: "Welcome to Raycast",
    subtitle: "Start building amazing extensions",
    icon: Icon.Star,
  },
  {
    id: "2",
    title: "Learn the Basics",
    subtitle: "Explore UI components and APIs",
    icon: Icon.Book,
  },
  {
    id: "3",
    title: "Add Actions",
    subtitle: "Make your extension interactive",
    icon: Icon.Bolt,
  },
  {
    id: "4",
    title: "Fetch Data",
    subtitle: "Connect to APIs and services",
    icon: Icon.Globe,
  },
  {
    id: "5",
    title: "Publish",
    subtitle: "Share your extension with the world",
    icon: Icon.Upload,
  },
];

export default function Command() {
  return (
    <List>
      {items.map((item) => (
        <List.Item
          key={item.id}
          icon={item.icon}
          title={item.title}
          subtitle={item.subtitle}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard
                title="Copy Title"
                content={item.title}
              />
              <Action.OpenInBrowser url="https://developers.raycast.com" />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
