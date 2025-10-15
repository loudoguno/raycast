# Publishing Raycast Extensions

## Overview

Publishing a Raycast extension makes it available in the public Raycast Store for all users to discover and install.

## Prerequisites

Before publishing:

1. ✅ Your extension builds without errors
2. ✅ You've tested all functionality thoroughly
3. ✅ You have a GitHub account (required for PR)
4. ✅ Your extension follows [Raycast's guidelines](https://developers.raycast.com/basics/prepare-an-extension-for-store)

## Publishing Process

### Step 1: Validate Your Extension

```bash
npm run build
```

Ensure your extension compiles without errors or warnings.

### Step 2: Publish

```bash
npm run publish
```

This command will:
1. Validate your extension
2. Authenticate with GitHub (if not already)
3. Create a pull request in the [raycast/extensions](https://github.com/raycast/extensions) repository
4. Open the PR in your browser

### Step 3: Wait for Review

- The Raycast team will review your pull request
- They may request changes or improvements
- Respond to feedback in the GitHub PR
- Once approved, your PR will be merged

### Step 4: Automatic Publication

After your PR is merged:
- Your extension is **automatically published** to the Raycast Store
- Users can discover and install it immediately
- Updates follow the same PR process

## Sharing Your Extension

After publication:

1. Open Raycast
2. Search for **Manage Extensions**
3. Find your extension
4. Press `⌘` `⌥` `.` to copy the extension link
5. Share the link anywhere!

## Extension Guidelines

### Metadata

- **Clear title**: Descriptive and concise
- **Good description**: Explain what your extension does
- **Icon**: High-quality, relevant icon (PNG format)
- **Keywords**: Help users discover your extension
- **README**: Document usage and features

### Code Quality

- **TypeScript**: Use proper types
- **Error handling**: Handle errors gracefully
- **Performance**: Fast and responsive
- **API keys**: Use Raycast's preferences for sensitive data
- **Dependencies**: Keep dependencies minimal

### User Experience

- **Intuitive**: Easy to understand and use
- **Fast**: Load quickly, show loading states
- **Helpful**: Good error messages
- **Consistent**: Follow Raycast UI patterns
- **Keyboard-first**: Support keyboard shortcuts

## Updating Your Extension

To publish updates:

1. Make your changes
2. Update `CHANGELOG.md`
3. Bump version in `package.json`
4. Run `npm run publish` again
5. Create a new PR with your changes

## Manual Publishing

If the automated publish script doesn't work:

1. Fork [raycast/extensions](https://github.com/raycast/extensions)
2. Add your extension to the `extensions/` directory
3. Create a pull request manually
4. Follow the review process

## Private Extensions (Teams/Organizations)

For team extensions:

```bash
npm run publish
```

- Publishes to your **private organization store**
- No external review required
- Only accessible to organization members
- Faster deployment cycle

See [Team Extensions](./team-extensions.md) for more details.

## Store Best Practices

### Discoverability

- Use relevant keywords
- Write a compelling description
- Include screenshots in README
- Add useful examples

### Maintenance

- Respond to user issues
- Update dependencies regularly
- Fix bugs promptly
- Add requested features when appropriate

### Community

- Be responsive to feedback
- Help users in GitHub issues
- Share tips and tricks
- Collaborate with other developers

## Common Issues

**"Extension already exists"**
- Someone may have already published a similar extension
- Consider a different name or unique angle

**Build failures in CI**
- Ensure `npm run build` works locally
- Check for environment-specific issues
- Review CI logs in the GitHub PR

**Rejected PR**
- Review Raycast's guidelines
- Address reviewer feedback
- Make requested changes
- Be patient and professional

## Resources

- [Prepare Extension for Store](https://developers.raycast.com/basics/prepare-an-extension-for-store)
- [Store Guidelines](https://developers.raycast.com/basics/prepare-an-extension-for-store)
- [Extensions Repository](https://github.com/raycast/extensions)
- [Community](https://raycast.com/community)

## Checklist

Before publishing, ensure:

- [ ] Extension builds successfully
- [ ] All commands work as expected
- [ ] README is complete and helpful
- [ ] CHANGELOG is up to date
- [ ] Icon is high quality
- [ ] No hardcoded API keys or secrets
- [ ] Error handling is implemented
- [ ] Loading states are shown
- [ ] Keyboard shortcuts are intuitive
- [ ] Code follows TypeScript best practices

---

Ready to share your extension with the world? Run `npm run publish` and let's go! 🚀
