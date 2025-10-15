# Raycast UI Components

Raycast extensions use React and provide several built-in UI components for building consistent, user-friendly interfaces.

## Main UI Components

### List
Use for displaying multiple similar items in a list format.

```tsx
import { List } from "@raycast/api";

export default function Command() {
  return (
    <List>
      <List.Item title="Item 1" />
      <List.Item title="Item 2" />
    </List>
  );
}
```

**Best for**: Search results, browsing items, task lists

### Grid
Use for displaying items with images in a grid layout.

```tsx
import { Grid } from "@raycast/api";

export default function Command() {
  return (
    <Grid>
      <Grid.Item content="image.png" title="Item 1" />
      <Grid.Item content="image.png" title="Item 2" />
    </Grid>
  );
}
```

**Best for**: Image galleries, app launchers, visual content

### Detail
Use for presenting detailed information about a single item.

```tsx
import { Detail } from "@raycast/api";

export default function Command() {
  return <Detail markdown="# Hello World" />;
}
```

**Best for**: Documentation, single item views, rich text content

### Form
Use for collecting user input and creating new content.

```tsx
import { Form, ActionPanel, Action } from "@raycast/api";

export default function Command() {
  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={(values) => console.log(values)} />
        </ActionPanel>
      }
    >
      <Form.TextField id="name" title="Name" />
      <Form.TextArea id="description" title="Description" />
    </Form>
  );
}
```

**Best for**: Settings, creating items, data entry

## ActionPanel

Every component can have an ActionPanel with actions and keyboard shortcuts.

```tsx
import { List, ActionPanel, Action } from "@raycast/api";

export default function Command() {
  return (
    <List>
      <List.Item
        title="Item"
        actions={
          <ActionPanel>
            <Action.CopyToClipboard content="Copied!" />
            <Action.OpenInBrowser url="https://raycast.com" />
          </ActionPanel>
        }
      />
    </List>
  );
}
```

## Loading States

Use the `isLoading` prop to show loading indicators:

```tsx
import { List } from "@raycast/api";
import { useState, useEffect } from "react";

export default function Command() {
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchItems().then((data) => {
      setItems(data);
      setIsLoading(false);
    });
  }, []);

  return (
    <List isLoading={isLoading}>
      {items.map((item) => (
        <List.Item key={item.id} title={item.title} />
      ))}
    </List>
  );
}
```

## Best Practices

1. **Render quickly**: Keep initial render fast and show content immediately
2. **Use loading states**: Show `isLoading` while fetching data
3. **Keyboard shortcuts**: Associate actions with intuitive shortcuts
4. **Consistent patterns**: Use the right component for the job
5. **Responsive design**: Ensure your extension feels native to Raycast

## Resources

- [Official UI Documentation](https://developers.raycast.com/api-reference/user-interface)
- [API Reference](https://developers.raycast.com/api-reference)
- [Examples](https://developers.raycast.com/examples)
