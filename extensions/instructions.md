# Raycast Extension Development Guide

## Prerequisites

- **Raycast**: Version 1.26.0 or higher
- **Node.js**: Version 22.14 or higher (use [nvm](https://github.com/nvm-sh/nvm) for version management)
- **npm**: Version 7 or higher
- **Knowledge**: Basic familiarity with React and TypeScript
- **Sign in**: You must be signed into Raycast to use development commands

## Quick Start

### Creating a New Extension

1. Open Raycast
2. Search for **Create Extension** command
3. Select a template (e.g., Detail, List, Form, etc.)
4. Choose a parent folder for your extension
5. Follow the prompts to configure your extension

### Development Workflow

```bash
# Navigate to your extension directory
cd your-extension-name

# Install dependencies and start development mode
npm install && npm run dev
```

Development mode features:
- **Hot reloading**: Changes to your code automatically reload in Raycast
- **Persistent**: Extensions remain in Raycast even after stopping `npm run dev`
- **Testing**: Search for your extension or command name in Raycast to test

### Building Your Extension

```bash
# Validate your extension builds correctly
npm run build
```

This command:
- Compiles your TypeScript code
- Validates your extension configuration
- Ensures everything is ready for publishing

### Publishing to the Raycast Store

```bash
# Publish your extension
npm run publish
```

This command will:
1. Validate your extension
2. Open a GitHub pull request in the [Raycast extensions repository](https://github.com/raycast/extensions)
3. Wait for Raycast team review
4. Once merged, your extension is automatically published to the Store

**Important**: Ensure your extension follows [Raycast's guidelines](https://developers.raycast.com/basics/prepare-an-extension-for-store) before publishing.

### Sharing Your Published Extension

After publication:
1. Open Raycast
2. Search for **Manage Extensions**
3. Press `⌘` `⌥` `.` to copy the extension link

## Team & Organization Extensions

Developing extensions for Raycast Teams/Organizations differs from public extensions in several key ways:

### Setting Up Team Development

1. **Create an Organization**
   - Navigate to Raycast Teams settings
   - Create an organization with a unique handle
   - This gives you access to a private extension store

2. **Set Up Local Repository**
   - Create a dedicated repository for your team extensions
   - Clone it locally for development
   - Team extensions are stored separately from public extensions

3. **Development Process**
   - Use the same CLI commands (`npm run dev`, `npm run build`)
   - Extensions are developed identically to public extensions
   - The difference is in the publishing destination

### Publishing Team Extensions

```bash
npm run publish
```

For team extensions:
- Extensions are published to your **private organization store**
- Only accessible to organization members
- No public review process required
- Faster deployment cycle for internal tools

### Key Differences: Public vs. Team Extensions

| Aspect | Public Extensions | Team Extensions |
|--------|------------------|-----------------|
| **Store** | Public Raycast Store | Private organization store |
| **Review** | Raycast team review required | No external review |
| **Access** | Anyone can install | Organization members only |
| **Publishing** | PR to raycast/extensions | Direct to org store |
| **Use Case** | General audience | Internal workflows & tools |

### Inviting Team Members

1. Navigate to your organization settings
2. Generate an invite link
3. Share with teammates
4. They can then access all private extensions

## Common Commands Reference

| Command | Description |
|---------|-------------|
| `npm install` | Install extension dependencies |
| `npm run dev` | Start development mode with hot reload |
| `npm run build` | Build and validate extension |
| `npm run publish` | Publish extension to store |
| `npm run lint` | Lint your code |
| `npm run fix-lint` | Auto-fix linting issues |

## Built-in Raycast Commands for Extension Development

### Available in Raycast:

- **Create Extension**: Scaffold a new extension from templates
- **Import Extension**: Import an existing extension
- **Manage Extensions**: View and manage all installed extensions
- **Developer**: Access extension logs and debugging info
- **Refresh Extensions**: Reload all extensions

## Project Structure

```
your-extension/
├── src/
│   └── index.tsx          # Main entry point
├── assets/               # Icons and images
├── package.json          # Extension metadata & dependencies
├── tsconfig.json         # TypeScript configuration
├── README.md            # Extension documentation
└── CHANGELOG.md         # Version history
```

## Tips for Rapid Development

1. **Use Templates**: Start with built-in templates for common patterns
2. **Hot Reload**: Keep `npm run dev` running and test changes instantly
3. **API Docs**: Reference the [Raycast API docs](https://developers.raycast.com/api-reference) frequently
4. **Components**: Use built-in Raycast UI components for consistency
5. **Examples**: Browse the [extensions repository](https://github.com/raycast/extensions) for inspiration

## Resources

- [Official Documentation](https://developers.raycast.com/)
- [API Reference](https://developers.raycast.com/api-reference)
- [Extensions Repository](https://github.com/raycast/extensions)
- [Community](https://raycast.com/community)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React Docs](https://react.dev/)

## Troubleshooting

- **Extension not appearing**: Try "Refresh Extensions" command in Raycast
- **Build errors**: Check Node.js and npm versions meet requirements
- **Hot reload not working**: Restart `npm run dev`
- **Sign-in issues**: Ensure you're signed into Raycast

---

Happy building! 🚀
