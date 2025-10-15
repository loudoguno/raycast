import { Detail } from "@raycast/api";

export default function Command() {
  const markdown = `
# Hello World!

Welcome to your first Raycast extension.

## What you can do next:

- Edit this file to change the content
- Add more commands in \`package.json\`
- Use different UI components (List, Grid, Form)
- Add actions to your extension
- Fetch data from APIs
- Store preferences and settings

## Resources

- [Documentation](https://developers.raycast.com)
- [API Reference](https://developers.raycast.com/api-reference)
- [Examples](https://github.com/raycast/extensions)

Happy building! 🚀
  `;

  return <Detail markdown={markdown} />;
}
