# Hello World List Template

A simple Raycast extension template using the List view with actions.

## Features

- Displays a list of items
- Each item has an icon, title, and subtitle
- Actions panel with copy and open browser actions
- Demonstrates basic list interaction patterns

## Getting Started

1. Copy this template to your extensions directory
2. Run `npm install && npm run dev`
3. Open Raycast and search for "Hello World List"
4. Try the actions by pressing ⌘ K or Enter

## Structure

```
hello-world-list/
├── src/
│   └── index.tsx       # Main command with list
├── package.json        # Extension metadata
└── README.md          # This file
```

## Customization

Edit `src/index.tsx` to:
- Add your own items
- Change icons and styling
- Add more actions
- Implement search/filtering
- Fetch data from APIs

## Key Concepts

- **List**: Container for displaying items
- **List.Item**: Individual list items with icon, title, subtitle
- **ActionPanel**: Actions available for each item
- **Actions**: Copy, open browser, custom actions

## Resources

- [List Component Docs](https://developers.raycast.com/api-reference/user-interface/list)
- [Actions Documentation](https://developers.raycast.com/api-reference/user-interface/actions)
