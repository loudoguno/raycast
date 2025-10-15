# Getting Started with Raycast Extension Development

## System Requirements

- **Raycast**: Version 1.26.0 or higher
- **Node.js**: Version 22.14 or higher
  - Recommended: Use [nvm](https://github.com/nvm-sh/nvm) for managing Node.js versions
- **npm**: Version 7 or higher
- **TypeScript & React**: Basic familiarity recommended
  - [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
  - [React Getting Started](https://react.dev/)

## Authentication

You must be signed into Raycast to use extension development commands like "Create Extension" or "Import Extension".

## Creating Your First Extension

### Step 1: Use the Create Extension Command

1. Open Raycast (⌘ Space)
2. Search for **Create Extension**
3. Select a template:
   - **Detail**: For displaying information
   - **List**: For browsing items
   - **Form**: For user input
   - **Menu Bar**: For menu bar commands
   - And more...
4. Choose a parent folder (e.g., `~/code/extensions`)
5. Configure your extension:
   - Extension name
   - Command name
   - Description
   - Author information

### Step 2: Install Dependencies and Start Development

```bash
# Navigate to your extension directory
cd your-extension-name

# Install dependencies and start development mode
npm install && npm run dev
```

### Step 3: Test Your Extension

1. Open Raycast
2. Search for your extension or command name
3. Your extension will appear and be ready to use

### Step 4: Make Changes

Edit `./src/index.tsx` to modify your extension. Changes will **hot-reload automatically** in Raycast!

```tsx
import { Detail } from "@raycast/api";

export default function Command() {
  return <Detail markdown="# Hello World!" />;
}
```

## Development Workflow

### Development Mode

```bash
npm run dev
```

- Enables hot reloading
- Extensions remain in Raycast after stopping the dev server
- Changes reflect immediately when you edit source files

### Building

```bash
npm run build
```

- Compiles TypeScript
- Validates extension configuration
- Ensures readiness for publishing

### Linting

```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run fix-lint
```

## Extension Structure

```
your-extension/
├── src/
│   └── index.tsx          # Main command entry point
├── assets/
│   ├── icon.png          # Extension icon
│   └── ...               # Other assets
├── package.json          # Extension metadata
├── tsconfig.json         # TypeScript config
├── README.md            # Documentation
└── CHANGELOG.md         # Version history
```

## package.json Configuration

The `package.json` file contains your extension's metadata:

```json
{
  "name": "my-extension",
  "title": "My Extension",
  "description": "Does something useful",
  "icon": "icon.png",
  "author": "yourname",
  "license": "MIT",
  "commands": [
    {
      "name": "index",
      "title": "My Command",
      "description": "Command description",
      "mode": "view"
    }
  ]
}
```

## Next Steps

1. Explore [UI Components](./ui-components.md)
2. Browse [example extensions](https://github.com/raycast/extensions)
3. Read the [API Reference](https://developers.raycast.com/api-reference)
4. Join the [Raycast Community](https://raycast.com/community)

## Troubleshooting

**Extension not appearing?**
- Try the "Refresh Extensions" command in Raycast
- Ensure `npm run dev` is running
- Check for TypeScript errors in your terminal

**Hot reload not working?**
- Restart `npm run dev`
- Check file permissions
- Verify you're editing the correct source file

**Build errors?**
- Check Node.js version: `node --version`
- Update dependencies: `npm install`
- Review TypeScript errors in terminal output

## Resources

- [Official Documentation](https://developers.raycast.com/)
- [API Reference](https://developers.raycast.com/api-reference)
- [Extensions Repository](https://github.com/raycast/extensions)
- [Community Slack](https://raycast.com/community)
