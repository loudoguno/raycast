# Roam Research (Custom Fork) - Agentic Knowledge Agent

Personal fork of the [Roam Research Raycast extension](https://raycast.com/roamresearch/roam-research) with **semantic RAG** and **graph-aware AI** capabilities.

## Vision

Transform your Roam graph into an intelligent knowledge agent that:
- **Semantically searches** your notes (not just keywords)
- **Understands aliases** ([[AI]] = [[Artificial Intelligence]])
- **Traverses links** to find connections you didn't know existed
- **Answers questions** by synthesizing information across pages
- **Captures new thoughts** with AI-suggested links

## Quick Start

```bash
# 1. Clone the official extension
cd ~/code/raycast/extensions/forked
../scripts/fork-extension.sh roam-research roam-custom

# 2. Install dependencies
cd roam-custom
npm install

# 3. Configure Roam API
# Get token from: Roam > Settings > Graph > API Tokens
# Add to Raycast preferences

# 4. Start development
npm run dev
```

## Core Features (Planned)

### 1. Semantic Search
Search by meaning, not just keywords.
```
Query: "productivity tips"
Finds: Notes about GTD, time management, focus, workflows...
```

### 2. Alias-Aware Search
Automatically expands searches to include page aliases.
```
Search: "AI"
Also searches: [[Artificial Intelligence]], [[Machine Learning]], [[ML]]
```

### 3. Ask Roam (Agentic Q&A)
Ask questions, get synthesized answers with citations.
```
"What patterns do I notice in my productive weeks?"
→ AI analyzes your daily notes, finds correlations, cites sources
```

### 4. Graph Explorer
Visualize and traverse connections between pages.
```
Start: [[Productivity]]
See: All pages 1-2 hops away, grouped by connection type
```

### 5. Smart Capture
AI suggests links and placement for new notes.

## Architecture

See [DESIGN.md](./DESIGN.md) for full architecture.

```
┌──────────────────────────────────────┐
│         Raycast Extension            │
│  ┌─────────┐ ┌─────────┐ ┌────────┐ │
│  │Semantic │ │Ask Roam │ │Explore │ │
│  │ Search  │ │   AI    │ │ Graph  │ │
│  └────┬────┘ └────┬────┘ └───┬────┘ │
└───────┼──────────┼───────────┼──────┘
        │          │           │
        ▼          ▼           ▼
┌──────────────────────────────────────┐
│           Roam Agent Core            │
│  • Vector DB (LanceDB)               │
│  • Graph Index (SQLite)              │
│  • Embedding Pipeline                │
│  • Context Builder                   │
└──────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────┐
│   Roam Research API                  │
│   • Official SDK                     │
│   • Datalog Queries                  │
└──────────────────────────────────────┘
```

## Setup Requirements

### Roam API Token

1. Open Roam Research
2. Settings → Graph → API tokens
3. Create new token with "edit" scope
4. Add to Raycast extension preferences

### Embedding API (for semantic search)

Choose one:
- **OpenAI** (recommended): Add API key to preferences
- **Local** (free, slower): Uses all-MiniLM-L6-v2

### First-Time Indexing

On first run, the extension will:
1. Fetch all pages and blocks from your graph
2. Generate embeddings (takes a few minutes for large graphs)
3. Build graph index for link traversal

Progress shown in Raycast.

## Commands

| Command | Hotkey | Description |
|---------|--------|-------------|
| Semantic Search | `⌃⌥R` | Search by meaning across your graph |
| Ask Roam | `⌃⌥⇧R` | Ask questions, get AI-synthesized answers |
| Quick Capture | `⌃⌥⇧C` | Capture thought with suggested links |
| Explore Page | - | Visualize page connections |
| Daily Notes | `⌃⌥D` | Navigate daily notes |
| Submit Feedback | - | Report issues/request features |

## Planned Improvements

See [IMPROVEMENTS.md](./IMPROVEMENTS.md) for full roadmap.

### Phase 1: Foundation
- [ ] Basic semantic search
- [ ] Alias resolution
- [ ] Simple Q&A with Claude

### Phase 2: Graph Intelligence
- [ ] Link/backlink traversal
- [ ] Multi-hop path finding
- [ ] Contextual embeddings

### Phase 3: Advanced Agent
- [ ] Multi-step reasoning
- [ ] Suggested connections
- [ ] Smart capture with AI

## Feedback-Driven Development

Use the **Submit Feedback** command to create GitHub issues for improvements. Claude Code can pick up issues and implement them automatically.

### Workflow

1. Use extension, notice improvement opportunity
2. Run "Submit Feedback"
3. Describe enhancement
4. Issue created → Claude Code implements → PR → update

## File Structure

```
roam-custom/
├── src/
│   ├── semantic-search.tsx     # Vector-based search
│   ├── ask-roam.tsx           # Agentic Q&A
│   ├── explore-page.tsx       # Graph visualization
│   ├── quick-capture.tsx      # Smart capture
│   ├── daily-notes.tsx        # Daily note navigation
│   ├── submit-feedback.tsx    # Feedback command
│   └── lib/
│       ├── roam-api.ts        # Roam SDK wrapper
│       ├── embeddings.ts      # Embedding pipeline
│       ├── vector-db.ts       # LanceDB interface
│       ├── graph-index.ts     # SQLite graph index
│       ├── context-builder.ts # Build LLM context
│       └── agent.ts           # Agentic loop
├── DESIGN.md                   # Architecture docs
├── FEATURES.md                 # Feature specs
├── IMPROVEMENTS.md             # Roadmap
├── package.json
└── .upstream
```

## Development

```bash
# Start dev mode
npm run dev

# Run indexing manually
npm run index-graph

# Test semantic search
npm run test:search "productivity"
```

## Related Resources

### Existing MCP Servers
- [2b3pro/roam-research-mcp](https://github.com/2b3pro/roam-research-mcp) - Comprehensive MCP server
- [PhiloSolares/roam-mcp](https://github.com/PhiloSolares/roam-mcp) - Alternative MCP server

### Roam API Documentation
- [Official SDK](https://www.npmjs.com/package/@roam-research/roam-api-sdk)
- [Datalog Queries](https://davidbieber.com/snippets/2020-12-22-datalog-queries-for-roam-research/)

### RAG Architecture
- [Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval)
- [Graph RAG](https://weaviate.io/blog/graph-rag)

## Privacy

- **Local-first**: Embeddings stored locally, not in cloud
- **Your data**: Graph data only sent to Claude API for synthesis (opt-out available)
- **No telemetry**: No usage tracking

## License

Based on the official Roam Research extension.
