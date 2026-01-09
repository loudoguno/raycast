# Roam Research Agentic RAG - Design Document

A semantic knowledge agent for querying your Roam graph with full context awareness of pages, aliases, links, and block references.

## Problem Statement

Standard Roam search is keyword-based. You want:
- **Semantic search**: Find conceptually related content, not just keyword matches
- **Graph awareness**: See how pages link together, understand aliases, traverse references
- **Agentic queries**: Ask questions and get synthesized answers, not just search results
- **Context preservation**: AI sees the full structure (parent blocks, linked pages, backlinks)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         RAYCAST EXTENSION                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │ Semantic    │  │ Ask Roam   │  │ Graph       │                 │
│  │ Search      │  │ Question   │  │ Explorer    │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ROAM AGENT CORE                                │
│                                                                     │
│  ┌─────────────────┐    ┌─────────────────┐    ┌────────────────┐  │
│  │ Query Planner   │───▶│ Context Builder │───▶│ LLM Interface  │  │
│  │ (understands    │    │ (assembles full │    │ (Claude API)   │  │
│  │  intent)        │    │  graph context) │    │                │  │
│  └─────────────────┘    └─────────────────┘    └────────────────┘  │
│           │                      │                                  │
│           ▼                      ▼                                  │
│  ┌─────────────────┐    ┌─────────────────┐                        │
│  │ Vector Search   │    │ Graph Traverser │                        │
│  │ (semantic)      │    │ (links/refs)    │                        │
│  └─────────────────┘    └─────────────────┘                        │
└────────────────────────────┬────────────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                              ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│     LOCAL VECTOR DB     │    │      ROAM API           │
│  (embeddings + graph    │    │  (live queries)         │
│   metadata)             │    │                         │
│                         │    │  - Official SDK         │
│  - ChromaDB / LanceDB   │    │  - MCP Server           │
│  - SQLite for metadata  │    │  - Datalog queries      │
└─────────────────────────┘    └─────────────────────────┘
              │                              │
              └──────────────┬───────────────┘
                             ▼
                  ┌─────────────────────┐
                  │   ROAM GRAPH        │
                  │   (source of truth) │
                  └─────────────────────┘
```

---

## Core Concepts

### 1. Graph-Aware Embeddings

Standard RAG embeds text chunks. For Roam, we need **graph-aware chunks**:

```typescript
interface RoamBlock {
  uid: string;
  string: string;           // The actual text
  pageTitle: string;        // Parent page
  pageAliases: string[];    // [[alias]] links to this page

  // Graph structure
  parentUid: string | null;
  childrenUids: string[];

  // References
  outgoingLinks: PageRef[];   // [[Page]] links in this block
  outgoingRefs: BlockRef[];   // ((block-uid)) refs in this block
  incomingRefs: BlockRef[];   // Blocks that reference this one (backlinks)

  // Metadata
  createdTime: number;
  editedTime: number;
  createdBy: string;
}

interface PageRef {
  title: string;
  aliases: string[];
  uid: string;
}

interface BlockRef {
  uid: string;
  string: string;
  pageTitle: string;
}
```

### 2. Contextual Embedding Strategy

Instead of embedding raw text, embed **contextual chunks**:

```typescript
// BAD: Loses context
embed("This is a key insight about the project")

// GOOD: Preserves context
embed(`
Page: [[Project Alpha]] (aliases: [[Alpha]], [[PA]])
Parent: "Q4 Planning > Key Decisions"
Block: "This is a key insight about the project"
Links to: [[Budget]], [[Timeline]]
Referenced by: 3 other blocks
`)
```

This follows Anthropic's [Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval) approach.

### 3. Hybrid Retrieval

Combine multiple retrieval strategies:

| Strategy | What it finds | When to use |
|----------|--------------|-------------|
| **Vector search** | Semantically similar content | "What do I know about X?" |
| **Keyword (BM25)** | Exact term matches | Specific names, codes, IDs |
| **Graph traversal** | Connected pages/blocks | "What's related to X?" |
| **Temporal** | Recent or date-ranged | "What did I write last week?" |

---

## Data Model

### Embedding Storage (Vector DB)

```typescript
// ChromaDB / LanceDB collection
{
  id: "block_uid",
  embedding: float[1536],  // OpenAI ada-002 or similar

  // Stored metadata for filtering
  metadata: {
    page_title: string,
    page_uid: string,
    block_text: string,
    parent_path: string,      // "Page > Parent > Grandparent"

    // For graph-aware retrieval
    outgoing_links: string[], // Page titles
    incoming_ref_count: number,

    // For temporal filtering
    created_time: number,
    edited_time: number,

    // For alias resolution
    page_aliases: string[],
  }
}
```

### Graph Index (SQLite)

```sql
-- Pages with aliases
CREATE TABLE pages (
  uid TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  created_time INTEGER,
  edited_time INTEGER
);

CREATE TABLE page_aliases (
  page_uid TEXT REFERENCES pages(uid),
  alias TEXT NOT NULL,
  PRIMARY KEY (page_uid, alias)
);

-- Block relationships
CREATE TABLE blocks (
  uid TEXT PRIMARY KEY,
  page_uid TEXT REFERENCES pages(uid),
  parent_uid TEXT REFERENCES blocks(uid),
  string TEXT,
  "order" INTEGER,
  created_time INTEGER,
  edited_time INTEGER
);

-- Links and references
CREATE TABLE links (
  from_block_uid TEXT REFERENCES blocks(uid),
  to_page_uid TEXT REFERENCES pages(uid),
  link_type TEXT CHECK (link_type IN ('page_ref', 'block_ref', 'tag'))
);

CREATE TABLE block_refs (
  from_block_uid TEXT REFERENCES blocks(uid),
  to_block_uid TEXT REFERENCES blocks(uid)
);

-- Indexes for fast traversal
CREATE INDEX idx_links_to ON links(to_page_uid);
CREATE INDEX idx_refs_to ON block_refs(to_block_uid);
CREATE INDEX idx_blocks_page ON blocks(page_uid);
```

---

## Query Flow

### Example: "What have I written about productivity systems?"

```
1. QUERY PLANNING
   ├── Detect intent: semantic search + synthesis
   ├── Extract concepts: ["productivity", "systems", "workflows"]
   └── Plan: vector search → expand via links → synthesize

2. RETRIEVAL
   ├── Vector search: top 20 semantically similar blocks
   ├── Alias expansion: "productivity" → also check [[GTD]], [[PKM]]
   ├── Graph expansion: for top 5 results, fetch linked pages
   └── Deduplicate and rank

3. CONTEXT BUILDING
   ├── For each relevant block:
   │   ├── Fetch parent hierarchy (breadcrumb)
   │   ├── Fetch sibling blocks (immediate context)
   │   ├── Resolve block references (inline)
   │   └── Note incoming backlinks
   └── Assemble into structured context

4. SYNTHESIS
   ├── Send to Claude with graph-aware prompt
   ├── Prompt includes:
   │   ├── Retrieved blocks with full context
   │   ├── Graph structure visualization
   │   └── Instruction to cite sources
   └── Return answer with [[page]] links
```

---

## Implementation Options

### Option A: Raycast Extension + Local Services

```
Raycast Extension (TypeScript)
    ↓
Local Python service (FastAPI)
    ├── ChromaDB (embeddings)
    ├── SQLite (graph index)
    └── Roam API SDK
```

**Pros**: Full control, fast local queries, works offline after sync
**Cons**: Complex setup, need to run background service

### Option B: Raycast + MCP Server

```
Raycast Extension (TypeScript)
    ↓
Enhanced MCP Server (extends 2b3pro/roam-research-mcp)
    ├── Add vector search tools
    ├── Add graph traversal tools
    └── Roam API (existing)
```

**Pros**: Reuses existing MCP ecosystem, Claude Desktop integration
**Cons**: MCP still maturing, less control over retrieval

### Option C: Pure Raycast with Cloud Services

```
Raycast Extension (TypeScript)
    ├── Pinecone/Weaviate (cloud vectors)
    ├── Claude API (synthesis)
    └── Roam API (direct)
```

**Pros**: Simplest deployment, no local services
**Cons**: Latency, cost, privacy concerns

### Recommendation: Hybrid (A + B)

Build a **local-first system** with **MCP compatibility**:

```
Raycast Extension
    ↓
roam-agent-core (Node.js library)
    ├── LanceDB (local vectors, zero-config)
    ├── better-sqlite3 (graph index)
    ├── Roam API SDK
    └── Claude API

Also expose as MCP server for Claude Desktop
```

---

## Key Components to Build

### 1. Graph Sync Engine

```typescript
// Sync Roam graph to local index
class RoamSyncEngine {
  async fullSync(): Promise<SyncResult>;
  async incrementalSync(since: Date): Promise<SyncResult>;
  async watchForChanges(): AsyncIterator<Change>;
}
```

### 2. Embedding Pipeline

```typescript
// Generate contextual embeddings
class EmbeddingPipeline {
  async embedBlock(block: RoamBlock): Promise<Embedding>;
  async embedWithContext(block: RoamBlock, depth: number): Promise<Embedding>;
  async batchEmbed(blocks: RoamBlock[]): Promise<Embedding[]>;
}
```

### 3. Hybrid Retriever

```typescript
// Multi-strategy retrieval
class HybridRetriever {
  async search(query: string, options: SearchOptions): Promise<SearchResult[]>;
  async expandViaGraph(blockUids: string[], hops: number): Promise<RoamBlock[]>;
  async resolveAliases(terms: string[]): Promise<Map<string, string[]>>;
}
```

### 4. Context Builder

```typescript
// Build rich context for LLM
class ContextBuilder {
  async buildContext(blocks: RoamBlock[], query: string): Promise<string>;
  formatAsMarkdown(blocks: RoamBlock[]): string;
  formatAsStructured(blocks: RoamBlock[]): StructuredContext;
}
```

### 5. Agent Interface

```typescript
// Agentic query handling
class RoamAgent {
  async ask(question: string): Promise<AgentResponse>;
  async search(query: string): Promise<SearchResult[]>;
  async explore(startPage: string, depth: number): Promise<GraphView>;
}
```

---

## Raycast Commands

### 1. `Ask Roam` (Primary)
- Natural language questions about your graph
- Returns synthesized answer with citations
- Shows related pages/blocks

### 2. `Semantic Search`
- Vector-based search
- Shows results with context preview
- Actions: Open in Roam, Copy block ref, Show connections

### 3. `Explore Page`
- Select a page, see its graph neighborhood
- Incoming links, outgoing links, aliases
- Visual mini-graph (if possible)

### 4. `Quick Capture with Context`
- Capture new thought
- AI suggests relevant pages to link
- Auto-tags based on content

### 5. `Daily Digest`
- AI summary of today's notes
- Surfaces connections to past content
- Suggests follow-ups

---

## Technical Decisions

### Embedding Model

| Model | Dimensions | Quality | Speed | Cost |
|-------|------------|---------|-------|------|
| OpenAI text-embedding-3-small | 1536 | Good | Fast | $0.02/1M |
| OpenAI text-embedding-3-large | 3072 | Best | Medium | $0.13/1M |
| Voyage-2 | 1024 | Excellent | Fast | $0.10/1M |
| Local (all-MiniLM-L6-v2) | 384 | Decent | Instant | Free |

**Recommendation**: Start with `text-embedding-3-small`, option for local fallback.

### Vector Database

| DB | Setup | Performance | Features |
|----|-------|-------------|----------|
| ChromaDB | Easy | Good | Simple API |
| LanceDB | Zero-config | Excellent | Native TypeScript |
| Qdrant | Medium | Excellent | Advanced filtering |
| SQLite + vec | Simple | Good | Single file |

**Recommendation**: LanceDB for zero-config local deployment.

### Sync Strategy

| Approach | Freshness | Complexity | API Usage |
|----------|-----------|------------|-----------|
| Full export + reindex | Minutes old | Low | High (periodic) |
| Incremental via API | Near real-time | Medium | Medium |
| Webhook (if available) | Real-time | High | Low |

**Recommendation**: Incremental sync on extension launch + manual refresh.

---

## Privacy & Security

- **Local-first**: Embeddings stored locally, not in cloud
- **API tokens**: Stored in Raycast secure preferences
- **No telemetry**: Your graph data never leaves your machine (except to Claude API for synthesis)
- **Optional**: Full offline mode with local LLM (Ollama)

---

## Development Phases

### Phase 1: Foundation (MVP)
- [ ] Fork existing Roam extension
- [ ] Add Roam API SDK integration
- [ ] Basic semantic search (embed on first run)
- [ ] Simple "Ask" command with Claude

### Phase 2: Graph Awareness
- [ ] Build graph index (SQLite)
- [ ] Alias resolution
- [ ] Link/backlink traversal
- [ ] Context builder with graph info

### Phase 3: Advanced Retrieval
- [ ] Hybrid search (vector + BM25 + graph)
- [ ] Contextual embeddings
- [ ] Incremental sync
- [ ] Caching layer

### Phase 4: Agent Features
- [ ] Multi-step reasoning
- [ ] Suggested connections
- [ ] Daily digest
- [ ] Quick capture with AI suggestions

### Phase 5: Polish
- [ ] MCP server exposure
- [ ] Offline mode
- [ ] Performance optimization
- [ ] Graph visualization

---

## Open Questions

1. **Embedding granularity**: Block-level, page-level, or sliding window?
2. **Update strategy**: How to handle edited blocks efficiently?
3. **Large graphs**: What's the scaling limit? (10k pages? 100k blocks?)
4. **Claude usage**: Per-query API calls vs. batched synthesis?
5. **Cross-graph**: Support multiple Roam graphs?

---

## Resources

### Roam API
- [Official SDK](https://www.npmjs.com/package/@roam-research/roam-api-sdk)
- [2b3pro/roam-research-mcp](https://github.com/2b3pro/roam-research-mcp)
- [PhiloSolares/roam-mcp](https://github.com/PhiloSolares/roam-mcp)
- [Roam JSON Export Format](https://davidbieber.com/snippets/2020-04-25-roam-json-export/)
- [Datalog Queries for Roam](https://davidbieber.com/snippets/2020-12-22-datalog-queries-for-roam-research/)

### RAG Architecture
- [Anthropic Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval)
- [Neo4j RAG Tutorial](https://neo4j.com/blog/developer/rag-tutorial/)
- [Embeddings + Knowledge Graphs](https://towardsdatascience.com/embeddings-knowledge-graphs-the-ultimate-tools-for-rag-systems-cbbcca29f0fd/)
- [GraphRAG with Weaviate](https://weaviate.io/blog/graph-rag)

### Tools
- [LanceDB](https://lancedb.com/) - Zero-config vector DB
- [ChromaDB](https://www.trychroma.com/) - Simple vector DB
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) - Fast SQLite for Node
