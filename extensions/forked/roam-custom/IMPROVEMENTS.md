# Roam Custom - Planned Improvements

Roadmap for the agentic Roam Research knowledge agent.

---

## Status Legend
- 🔴 Not Started
- 🟡 In Progress
- 🟢 Completed
- ⏸️ On Hold

---

## Phase 1: Foundation (MVP)

### 🔴 Roam API Integration
**Priority**: Critical
**Description**: Solid foundation using official Roam SDK.
**Tasks**:
- [ ] Set up @roam-research/roam-api-sdk
- [ ] Implement authentication flow
- [ ] Basic CRUD operations (read pages, create blocks)
- [ ] Datalog query support

### 🔴 Graph Export & Indexing
**Priority**: Critical
**Description**: Export graph data for local indexing.
**Tasks**:
- [ ] Full graph export via API
- [ ] Parse pages, blocks, links
- [ ] Store in SQLite for fast queries
- [ ] Incremental sync (detect changes)

### 🔴 Basic Embedding Pipeline
**Priority**: Critical
**Description**: Generate embeddings for semantic search.
**Tasks**:
- [ ] Set up LanceDB (zero-config vector DB)
- [ ] Integrate OpenAI embeddings API
- [ ] Embed all blocks with basic context
- [ ] Simple similarity search

### 🔴 Basic Semantic Search Command
**Priority**: Critical
**Description**: First working semantic search.
**UI**:
- Search input
- Results with relevance score
- Click to open in Roam

---

## Phase 2: Alias & Link Awareness

### 🔴 Alias Resolution
**Priority**: High
**Description**: Expand searches to include page aliases.
**Implementation**:
- [ ] Detect explicit aliases (from page content patterns)
- [ ] Detect redirect pages (page with only one link)
- [ ] Detect abbreviations (AI → Artificial Intelligence)
- [ ] Store alias mappings in index

**User Experience**:
```
Searching: "AI"
Also searching: [[Artificial Intelligence]], [[Machine Learning]]
```

### 🔴 Link Extraction
**Priority**: High
**Description**: Parse and index all links between pages/blocks.
**Link Types**:
- `[[Page Reference]]`
- `((block-reference))`
- `#tag` and `#[[tag with spaces]]`
- `@mentions` (if used)

### 🔴 Backlink Indexing
**Priority**: High
**Description**: Index incoming references for each page/block.
**Use Cases**:
- Show "Referenced by X blocks" in search results
- Expand context to include backlink content
- Find related content via shared references

### 🔴 Contextual Embeddings
**Priority**: High
**Description**: Include page/hierarchy context in embeddings.
**Context Format**:
```
Page: [[Project Alpha]] (aliases: [[PA]])
Path: Project Alpha > Q4 Planning > Decisions
Content: "We chose React for the frontend"
Links to: [[React]], [[Frontend]]
Referenced by: 3 blocks
```

---

## Phase 3: Graph Traversal

### 🔴 Multi-Hop Path Finding
**Priority**: High
**Description**: Find connection paths between concepts.
**Query**: "How does productivity connect to health?"
**Result**:
```
[[Productivity]] → [[Morning Routine]] → [[Exercise]] → [[Health]]
"Your morning routine links these concepts"
```

### 🔴 Neighborhood Expansion
**Priority**: High
**Description**: Expand search to include linked pages.
**Algorithm**:
1. Find top N semantic matches
2. For each match, get linked pages (1-2 hops)
3. Include relevant linked content in results

### 🔴 Graph Explorer Command
**Priority**: Medium
**Description**: Visualize page connections.
**UI**:
- Select starting page
- Show incoming/outgoing links
- Grouped by connection type
- Click to expand

---

## Phase 4: Agentic Q&A

### 🔴 Basic Ask Roam Command
**Priority**: High
**Description**: Ask questions, get synthesized answers.
**Flow**:
1. Semantic search for relevant blocks
2. Build context with graph info
3. Send to Claude with prompt
4. Return answer with citations

### 🔴 Multi-Step Reasoning
**Priority**: Medium
**Description**: Agent loop for complex questions.
**Steps**:
1. Plan: What info do I need?
2. Search: Find relevant content
3. Expand: Follow links if needed
4. Synthesize: Generate answer

### 🔴 Citation & Source Linking
**Priority**: High
**Description**: Every claim backed by specific blocks.
**Format**:
```
"Your notes suggest X [1] and Y [2]"

Sources:
[1] [[Page A]] > Block content...
[2] [[Page B]] > Block content...
```

### 🔴 Confidence Scoring
**Priority**: Low
**Description**: Indicate answer confidence based on evidence.
**Levels**:
- High: Multiple supporting blocks
- Medium: Some evidence
- Low: Inferred/speculative

---

## Phase 5: Smart Capture

### 🔴 Quick Capture Command
**Priority**: High
**Description**: Fastest path to capture a thought.
**UI**: Single text input, optional destination

### 🔴 AI-Suggested Links
**Priority**: Medium
**Description**: Suggest relevant pages to link.
**Implementation**:
- Embed capture text
- Find similar existing pages
- Suggest as `[[links]]`

### 🔴 AI-Suggested Placement
**Priority**: Medium
**Description**: Suggest where to place the new block.
**Options**:
- Daily note (default)
- Existing page (based on content)
- New page (suggest title)

### 🔴 Template-Based Capture
**Priority**: Low
**Description**: Capture with predefined structures.
**Templates**:
- Meeting note
- Book note
- Idea
- Task

---

## Phase 6: Daily Notes & Navigation

### 🔴 Daily Notes Navigator
**Priority**: Medium
**Description**: Browse daily notes by date.
**UI**:
- List of recent daily notes
- Date picker
- Preview content

### 🔴 Daily Digest Command
**Priority**: Low
**Description**: AI summary of today's notes.
**Includes**:
- Notes created today
- Connections to past content
- Suggested follow-ups

---

## Phase 7: Performance & Polish

### 🔴 Incremental Sync
**Priority**: High
**Description**: Only re-index changed content.
**Implementation**:
- Track last sync timestamp
- Query only modified blocks
- Update embeddings for changed content

### 🔴 Background Indexing
**Priority**: Medium
**Description**: Index updates without blocking UI.
**Implementation**:
- Web worker or separate process
- Progress indicator
- Graceful degradation

### 🔴 Caching Layer
**Priority**: Medium
**Description**: Cache frequent queries and contexts.
**Cache**:
- Recent search results
- Page metadata
- Embedding lookups

### 🔴 Large Graph Optimization
**Priority**: Medium
**Description**: Handle graphs with 10k+ pages.
**Strategies**:
- Lazy loading
- Pagination
- Index sharding

---

## Integration Ideas (Future)

### 🔴 MCP Server Mode
**Description**: Expose as MCP server for Claude Desktop.
**Benefit**: Use same agent from Claude Code/Desktop.

### 🔴 Obsidian Cross-Reference
**Description**: Find related content across Roam and Obsidian.

### 🔴 Readwise Integration
**Description**: Search highlights alongside Roam notes.

---

## Technical Decisions

### Embedding Model
- **Default**: OpenAI text-embedding-3-small (cheap, good)
- **Alternative**: Local all-MiniLM-L6-v2 (free, private)

### Vector Database
- **Choice**: LanceDB (zero-config, TypeScript native)
- **Alternative**: ChromaDB, SQLite with vec extension

### Graph Index
- **Choice**: SQLite with better-sqlite3
- **Schema**: Pages, blocks, links tables with indexes

### LLM for Synthesis
- **Choice**: Claude (via Raycast's AI or direct API)
- **Alternative**: Local Ollama for privacy

---

## Notes

- Start simple, add complexity incrementally
- Test with real graph to understand performance
- Consider privacy: local-first where possible
- Document decisions in DESIGN.md
