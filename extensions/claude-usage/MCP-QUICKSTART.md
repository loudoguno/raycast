# MCP Servers Quickstart Guide

A comprehensive guide to installing and effectively using four powerful MCP servers with Claude Code.

---

## Installation Commands

Run these in your terminal to add all four MCP servers:

```bash
# Playwright - Browser automation
claude mcp add playwright -- npx @playwright/mcp@latest

# Chrome DevTools - Network inspection & debugging
claude mcp add chrome-devtools -- npx chrome-devtools-mcp@latest

# Sequential Thinking - Structured problem-solving
claude mcp add sequential-thinking -- npx -y @modelcontextprotocol/server-sequential-thinking

# Context7 - Up-to-date documentation fetching
claude mcp add context7 -- npx -y @upstash/context7-mcp@latest
```

After adding, restart Claude Code and verify with:
```bash
claude mcp list
```

---

## 1. Playwright MCP

**Purpose:** Browser automation through structured accessibility snapshots (no screenshots needed).

### Key Tools
| Tool | Description |
|------|-------------|
| `browser_navigate` | Navigate to a URL |
| `browser_snapshot` | Get accessibility tree of current page |
| `browser_click` | Click an element |
| `browser_type` | Type text into an input |
| `browser_select` | Select dropdown option |
| `browser_press_key` | Press keyboard keys |
| `browser_wait_for` | Wait for element/condition |

### Common Workflows

**Web Scraping:**
```
navigate → snapshot → extract data → repeat
```

**Form Automation:**
```
navigate → snapshot → fill fields → submit → verify
```

**Testing:**
```
navigate → interact → assert → screenshot
```

### Tips & Best Practices

1. **Install browsers manually first** - Playwright needs browsers installed with proper permissions:
   ```bash
   npx playwright install chromium
   ```

2. **Use specific versions** - If you encounter issues with `@latest`, pin to a working version:
   ```bash
   claude mcp add playwright -- npx @playwright/mcp@0.0.50
   ```

3. **80/20 Rule** - 80% of automation uses just: `navigate`, `snapshot`, `click`, `type`, `select`, `press_key`, `wait_for`

4. **Security** - The browser runs with your user permissions. Don't automate sensitive sites without understanding the risks.

5. **Allowed hosts** - Restrict which sites can be accessed:
   ```bash
   claude mcp add playwright -- npx @playwright/mcp@latest --allowed-hosts "example.com,api.example.com"
   ```

### Example Prompts

```
"Navigate to https://example.com and take a snapshot of the page structure"

"Fill out the login form with username 'test' and password 'demo', then submit"

"Find all links on this page and list their URLs"
```

---

## 2. Chrome DevTools MCP

**Purpose:** Debug web pages, inspect network requests, analyze performance, and execute JavaScript.

### Key Tools
| Tool | Description |
|------|-------------|
| `navigate_page` | Navigate to a URL |
| `list_network_requests` | List all network requests made by the page |
| `get_network_request` | Get details of a specific request/response |
| `list_console_messages` | View console output (logs, errors, warnings) |
| `evaluate_script` | Execute JavaScript in page context |
| `take_screenshot` | Capture page screenshot |
| `take_snapshot` | Get DOM snapshot |
| `performance_start_trace` | Start performance recording |
| `performance_stop_trace` | Stop and get performance data |

### Common Workflows

**API Debugging:**
```
navigate → list_network_requests → get_network_request (for specific API call) → analyze response
```

**Error Investigation:**
```
navigate → list_console_messages → identify errors → evaluate_script to inspect state
```

**Performance Analysis:**
```
performance_start_trace → navigate/interact → performance_stop_trace → analyze insights
```

### Tips & Best Practices

1. **Start with console messages** - When debugging, always check `list_console_messages` first for errors.

2. **Security warning** - Never use with browsers containing saved passwords, authenticated sessions, or personal data. The debugging protocol exposes ALL browser content including cookies and localStorage.

3. **Isolated browser** - Run with a fresh browser profile for security:
   ```bash
   # Launch Chrome with separate profile first
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --user-data-dir=/tmp/chrome-mcp-profile
   ```

4. **Network filtering** - When looking for specific requests, note the URL patterns in `list_network_requests` output, then use `get_network_request` for details.

5. **JavaScript execution** - Use `evaluate_script` to:
   - Extract data: `document.querySelector('.price').textContent`
   - Check state: `window.localStorage.getItem('token')`
   - Trigger actions: `document.querySelector('button').click()`

### Example Prompts

```
"Go to https://example.com/api-page and show me all the network requests, especially any API calls"

"Check the console for any JavaScript errors on this page"

"Execute JavaScript to get the current user's session data from localStorage"

"Start a performance trace, navigate to the homepage, then show me performance insights"
```

---

## 3. Sequential Thinking MCP

**Purpose:** Break down complex problems into structured, step-by-step thinking with the ability to revise, branch, and refine.

### Key Tools
| Tool | Description |
|------|-------------|
| `process_thought` | Process a single thought in the sequence |
| `generate_summary` | Get overview of thinking progress |
| `clear_history` | Reset thinking history |

### Thinking Stages

Sequential Thinking guides through cognitive stages:
1. **Problem Definition** - Clarify what you're solving
2. **Research** - Gather relevant information
3. **Analysis** - Break down the problem
4. **Synthesis** - Combine insights
5. **Conclusion** - Form final answer/solution

### When to Use It

- **Complex decisions** - Major architectural choices, technology selection
- **Problem decomposition** - Breaking large problems into manageable pieces
- **Research planning** - Structuring investigation approach
- **Root cause analysis** - Debugging complex issues systematically
- **Project planning** - Evaluating projects through defined stages

### Tips & Best Practices

1. **Revision is encouraged** - Unlike linear thinking, you can go back and revise earlier thoughts as understanding deepens.

2. **Branching** - When you see multiple valid approaches, branch into alternative reasoning paths to explore each.

3. **Dynamic adjustment** - The number of thoughts isn't fixed. Add more as needed or conclude early.

4. **Filter noise** - Use it to systematically filter out irrelevant information.

5. **Hypothesis generation** - Great for generating and then verifying solution hypotheses.

### Example Prompts

```
"Use sequential thinking to help me decide between PostgreSQL and MongoDB for my new project"

"Think through step-by-step how to debug this intermittent authentication failure"

"Help me break down the architecture for a real-time notification system"

"Walk me through the decision process for choosing a state management solution for React"
```

---

## 4. Context7 MCP

**Purpose:** Fetch up-to-date, version-specific documentation directly into your prompts.

### Key Tools
| Tool | Description |
|------|-------------|
| `resolve-library-id` | Convert library name to Context7 ID |
| `get-library-docs` | Fetch documentation for a library |

### The Magic Phrase

Add **"use context7"** to any prompt to automatically fetch relevant docs:

```
"How do I set up routing in Next.js 14? use context7"

"Show me how to use React Query for data fetching use context7"
```

### Tips & Best Practices

1. **Auto-invoke with rules** - Add this to your project's rules so you don't have to type "use context7" every time:
   ```
   Always use Context7 MCP tools before planning or implementing code
   that involves external libraries or frameworks.
   ```

2. **Use topics for focus** - When fetching docs, specify a topic:
   ```
   "Get Next.js documentation focused on 'app router' use context7"
   ```

3. **Pagination for more** - If initial docs aren't enough, Context7 supports up to 10 pages (100 snippets):
   ```
   "Get more Next.js routing docs, page 2 use context7"
   ```

4. **Explicit library IDs** - If you know the Context7 ID format (`/org/project`), use it directly:
   ```
   "Get docs for /vercel/next.js use context7"
   ```

5. **Version-specific** - Context7 fetches version-specific docs, so your code examples match your actual dependencies.

6. **Submit missing libraries** - If a library isn't available, you can submit it to Context7.

### Example Prompts

```
"How do I implement authentication with NextAuth.js? use context7"

"Show me Prisma schema examples for a blog with posts and comments use context7"

"What's the correct way to handle errors in tRPC? use context7"

"Get Tailwind CSS documentation focused on 'flexbox' use context7"
```

---

## Combining MCP Servers

These servers work powerfully together:

### Example: Debug a Web App Issue

1. **Context7** - Get latest docs for the framework you're using
2. **Sequential Thinking** - Structure your debugging approach
3. **Chrome DevTools** - Inspect network requests and console errors
4. **Playwright** - Automate reproduction steps

### Example: Build a Feature with Live Docs

```
"I need to add real-time updates to my React app using Socket.io.
Use context7 to get the latest Socket.io docs, then use sequential
thinking to plan the implementation approach."
```

### Example: Reverse Engineer an API

```
"Navigate to https://example.com/dashboard using Playwright, then
use Chrome DevTools to list all API requests and show me the
response structure for any data-fetching endpoints."
```

---

## Troubleshooting

### Playwright Issues
- **Browser not found**: Run `npx playwright install chromium`
- **Permission errors**: Don't let Claude install browsers - do it manually with sudo if needed
- **Version mismatch**: Pin to a specific version instead of `@latest`

### Chrome DevTools Issues
- **Can't connect**: Make sure Chrome is running with remote debugging enabled
- **No requests showing**: Refresh the page after DevTools connects

### Sequential Thinking Issues
- **Verbose output**: Set `DISABLE_THOUGHT_LOGGING=true` environment variable

### Context7 Issues
- **Rate limited**: Get an API key from context7.com/dashboard for higher limits
- **Library not found**: Try different name variations, or submit the library to Context7
- **Outdated docs**: Specify the exact version in your prompt

---

## Sources

- [Microsoft Playwright MCP](https://github.com/microsoft/playwright-mcp)
- [Playwright MCP Best Practices](https://supatest.ai/blog/playwright-mcp-setup-guide)
- [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)
- [Chrome DevTools MCP Guide](https://developer.chrome.com/blog/chrome-devtools-mcp)
- [Sequential Thinking MCP](https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking)
- [Sequential Thinking Deep Dive](https://medium.com/@Micheal-Lanham/building-smarter-ai-agents-how-sequential-thinking-mcp-transforms-complex-problem-solving-443e68b4d487)
- [Context7 MCP](https://github.com/upstash/context7)
- [Context7 Best Practices](https://upstash.com/blog/context7-mcp)
