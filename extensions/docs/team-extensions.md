# Developing Extensions for Raycast Teams

## Overview

Raycast for Teams allows organizations to build, share, and discover extensions in a **private store** accessible only to team members. This is ideal for:

- Internal workflow tools
- Company-specific integrations
- Proprietary automation
- Team productivity enhancements

## Key Differences: Public vs. Team Extensions

| Feature | Public Extensions | Team Extensions |
|---------|------------------|-----------------|
| **Store** | Public Raycast Store | Private organization store |
| **Review** | Raycast team review required | No external review needed |
| **Access** | Anyone can install | Organization members only |
| **Publishing** | PR to raycast/extensions | Direct to org store |
| **Approval** | Community review process | Internal approval |
| **Use Case** | General audience | Internal tools & workflows |
| **Speed** | Slower (review process) | Faster (no external review) |

## Getting Started

### Step 1: Create an Organization

1. Navigate to Raycast settings
2. Go to the Teams section
3. Create a new organization
4. Choose a unique handle (e.g., `@yourcompany`)
5. Configure organization settings

### Step 2: Set Up Local Repository

```bash
# Create a directory for your team extensions
mkdir ~/raycast-team-extensions
cd ~/raycast-team-extensions

# Initialize git (optional but recommended)
git init
```

**Note**: Team extensions are stored separately from public extensions for better organization and access control.

### Step 3: Create Your First Team Extension

The development process is identical to public extensions:

```bash
# Use Raycast's Create Extension command
# Select your team organization as the target
# Choose a template and configure
```

Or manually:

```bash
# Navigate to your team extensions directory
cd ~/raycast-team-extensions

# Create extension using Raycast command
# Follow the prompts
```

### Step 4: Develop Your Extension

Development is the same as public extensions:

```bash
cd your-extension
npm install && npm run dev
```

- Hot reloading works the same
- Test in Raycast as usual
- Build and validate: `npm run build`

## Publishing Team Extensions

```bash
npm run publish
```

For team extensions:
- Publishes to your **private organization store**
- No PR to raycast/extensions
- No external review process
- Immediately available to team members

## Managing Team Members

### Inviting Members

1. Go to organization settings
2. Generate an invite link
3. Share with team members
4. They accept and gain access to all private extensions

### Permissions

- **Admin**: Full access, can publish extensions
- **Member**: Can install and use extensions
- **Developer**: Can develop and publish extensions

## Best Practices for Team Extensions

### Organization

```
raycast-team-extensions/
├── internal-tools/
│   ├── jira-integration/
│   ├── slack-shortcuts/
│   └── ...
├── automation/
│   ├── deployment-tools/
│   ├── monitoring/
│   └── ...
└── docs/
    └── internal-guide.md
```

### Security

1. **API Keys**: Use Raycast preferences, never hardcode
2. **Internal APIs**: Safe to use internal endpoints
3. **Secrets**: Store securely, not in code
4. **Access Control**: Use organization roles appropriately

### Documentation

- Document internal tools thoroughly
- Include setup instructions for new team members
- Maintain a team extension catalog
- Share best practices internally

### Version Control

```bash
# Use git for team extensions
git init
git add .
git commit -m "Add new extension"
git push origin main
```

Benefits:
- Track changes
- Collaborate with team
- Review code before publishing
- Rollback if needed

## Development Workflow

### 1. Plan

- Identify team needs
- Gather requirements
- Design the extension

### 2. Develop

```bash
npm run dev
# Build and test
```

### 3. Review (Internal)

- Share with teammates
- Get feedback
- Iterate on design

### 4. Publish

```bash
npm run publish
# Goes to private store immediately
```

### 5. Maintain

- Update based on feedback
- Fix bugs quickly
- Add features as needed

## Common Use Cases

### Internal Tools

- Company wiki search
- Internal documentation browser
- Team directory lookup
- Project shortcuts

### Integrations

- Internal APIs
- Custom CRM integrations
- Proprietary services
- Company-specific tools

### Automation

- Deployment shortcuts
- Environment management
- Database queries
- Log searching

### Productivity

- Meeting room booking
- PTO requests
- Expense submissions
- Time tracking

## Migration: Public to Team

To convert a public extension idea to a team extension:

1. Create in your team organization instead
2. Use internal APIs freely
3. Skip public review process
4. Publish to private store

To convert a team extension to public:

1. Remove internal API references
2. Generalize the functionality
3. Follow public store guidelines
4. Publish via PR to raycast/extensions

## Troubleshooting

**Extension not appearing for team?**
- Ensure team members are invited
- Check organization permissions
- Verify member accepted invite
- Try "Refresh Extensions" command

**Publishing to wrong store?**
- Check organization selection during creation
- Verify `package.json` configuration
- Ensure you're signed into correct account

**Access denied?**
- Check your organization role
- Verify you have developer permissions
- Contact organization admin

## Resources

- [Raycast for Teams](https://raycast.com/teams)
- [Teams Documentation](https://developers.raycast.com/teams/getting-started)
- [API Reference](https://developers.raycast.com/api-reference)

## Example Team Extension

```tsx
// An internal company directory lookup
import { List, ActionPanel, Action } from "@raycast/api";
import { useEffect, useState } from "react";
import { fetchEmployees } from "./internal-api"; // Internal API

export default function Command() {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Safe to use internal APIs in team extensions
    fetchEmployees().then((data) => {
      setEmployees(data);
      setIsLoading(false);
    });
  }, []);

  return (
    <List isLoading={isLoading}>
      {employees.map((emp) => (
        <List.Item
          key={emp.id}
          title={emp.name}
          subtitle={emp.role}
          accessories={[{ text: emp.email }]}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard content={emp.email} />
              <Action.OpenInBrowser url={emp.profileUrl} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
```

---

Team extensions empower your organization to build custom tools tailored to your exact workflows. Happy building! 🏢
