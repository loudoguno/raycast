### 🎯 Project Goal
This project is focused on **building custom Raycast extensions** for SalesSprint. The primary tech stack is:
- **Raycast API** for extension development
- **TypeScript** for type safety
- **React** for UI components
- **Node.js** for backend functionality

### 🔄 Project Awareness & Context
- **At session start**:
  - Check for `agents/INITIAL.md` to understand project goals and requirements
  - Review `agents/PROGRESS.md` to understand what's been completed and current status
  - **Verify `agents/MOC.md`** matches actual project structure - update if files/folders have been added/removed manually
- **During development**:
  - Reference [Raycast API documentation](https://developers.raycast.com/) extensively
  - Use consistent naming conventions, file structure, and architecture patterns for Raycast extensions
  - Follow Raycast conventions: Manifest-driven development, proper command structure, and extension best practices
  - Test extensions frequently using Raycast's developer mode

### 🧱 Code Structure & Modularity
- **Never create a file longer than 500 lines of code.** If a file approaches this limit, refactor by splitting it into smaller components or utility files.
- **Organize code into clearly separated modules**, following Raycast best practices:
  - `src/` - Extension source code
    - Commands (top-level TypeScript/React files for each command)
    - `components/` - Reusable React components
    - `utils/` - Utility functions and helpers
    - `hooks/` - Custom React hooks
    - `types/` - TypeScript type definitions
  - `assets/` - Icons, images, and other static assets
  - `package.json` - Extension metadata and dependencies
- **Use TypeScript path aliases** when beneficial for cleaner imports
- **Prefer named exports** over default exports for better refactoring and IDE support
- **Use environment variables** via Raycast preferences for sensitive configuration

### 🎨 Design & User Experience
- **Follow Raycast design guidelines** - use native Raycast components (List, Detail, Form, etc.)
- **Optimize for keyboard-first interaction** - ensure all actions are accessible via keyboard
- **Provide clear feedback** - use toast notifications, loading states, and error messages
- **Support Raycast's native search** - implement proper filtering and search functionality
- **Use appropriate icons** - leverage Raycast's icon library or custom SVG icons in assets/

### ⚡ Performance & Best Practices
- **Optimize command startup time** - lazy load heavy dependencies when possible
- **Cache API responses** appropriately using Raycast's Cache API
- **Handle errors gracefully** - show user-friendly error messages with actionable solutions
- **Use Raycast's built-in components** - List, Detail, Form, Action, ActionPanel, etc.
- **Follow React best practices** - proper hooks usage, component composition, state management

### 🧪 Testing & Validation
- **Test in Raycast Developer mode** frequently during development
- **Run TypeScript checks** with `npm run build` or `tsc --noEmit`
- **Run linting** with `npm run lint` and fix all errors
- **Test all commands and actions** manually before considering a task complete
- **Test edge cases** - empty states, errors, slow network, etc.

### ✅ Task Completion & Session End
- **Follow the task order** when executing implementation plans
- **Validate each task** before moving to the next (type check, lint, manual testing)
- **Before each commit** (end of session):
  - Update `agents/PROGRESS.md` with session accomplishments
  - Update `agents/MOC.md` if any files/folders were added, removed, or restructured
  - Update `README.md` if setup instructions, dependencies, or usage changed

### 📎 Style & Conventions
- **Use TypeScript** for all code - enable strict mode
- **Follow React/Raycast conventions**:
  - PascalCase for component names
  - camelCase for variables and functions
  - SCREAMING_SNAKE_CASE for constants
- **Use ESLint and Prettier** for consistent code formatting
- **Write JSDoc comments** for complex functions and utilities:
  ```typescript
  /**
   * Fetches sales data from the SalesSprint API
   * @param cohortId - The cohort identifier
   * @returns Promise with sales metrics
   */
  export async function getSalesMetrics(cohortId: string): Promise<SalesMetrics> {
    // implementation
  }
  ```

### 📚 Documentation & Explainability
- **Update `README.md`** when setup steps change, new dependencies are added, or commands are modified
- **Document each command's purpose** in package.json metadata
- **Add inline comments** for important decisions or workarounds
- **Document required preferences** in the extension manifest

### 🧠 AI Behavior Rules
- **Never assume missing context. Ask questions if uncertain.**
- **Never hallucinate libraries or APIs** – only use known Raycast APIs and verified npm packages
- **Always confirm file paths** exist before referencing them in imports
- **Never delete or overwrite existing code** unless explicitly instructed to or if part of a planned task
- **Reference Raycast documentation frequently** - don't guess at API usage
- **Follow the established patterns** in the codebase - maintain consistency with existing extensions

### 🚀 Raycast-Specific Guidelines
- **Extension manifest** (`package.json`) must include proper metadata:
  - Name, title, description, author
  - Commands with title, description, mode (view/no-view/menu-bar)
  - Required preferences and their types
- **Use Raycast's native components** instead of custom HTML/CSS
- **Implement proper keyboard shortcuts** for common actions
- **Support Raycast's theming** - avoid hardcoded colors
- **Follow the principle of least surprise** - behavior should match user expectations from other Raycast extensions
