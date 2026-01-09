# Roam Agent - Feature Specifications

Detailed specs for the key differentiating features.

---

## Feature 1: Alias-Aware Search

### The Problem
In Roam, a page can have multiple names:
- `[[Artificial Intelligence]]` might also be referenced as `[[AI]]`, `[[Machine Learning]]`, `[[ML]]`
- Standard search only finds exact matches

### The Solution

```
User searches: "What do I know about AI?"

System:
1. Detect "AI" as a potential alias
2. Query alias index → finds [[Artificial Intelligence]], [[AI]], [[Machine Learning]]
3. Expand search to include all aliased pages
4. Show results from ALL related pages, grouped intelligently
```

### Implementation

```typescript
// Alias resolution
interface AliasIndex {
  // Map from any name → canonical page
  resolve(term: string): PageRef[];

  // Get all aliases for a page
  getAliases(pageUid: string): string[];

  // Build from Roam data
  buildFromGraph(pages: RoamPage[]): void;
}

// Detection strategies
const aliasStrategies = [
  // 1. Explicit Roam aliases (if you use a convention like "Aliases:: [[X]], [[Y]]")
  findExplicitAliases,

  // 2. Redirect pages ("[[AI]]" page contains only "[[Artificial Intelligence]]")
  findRedirectPages,

  // 3. Abbreviation detection ("AI" → "Artificial Intelligence")
  detectAbbreviations,

  // 4. Semantic similarity (embedding distance < threshold)
  findSemanticAliases,
];
```

### User Experience

```
┌─────────────────────────────────────────────────────┐
│ 🔍 Semantic Search: "AI applications"               │
├─────────────────────────────────────────────────────┤
│ ℹ️ Also searching: [[Artificial Intelligence]],     │
│    [[Machine Learning]], [[Neural Networks]]        │
├─────────────────────────────────────────────────────┤
│ 📄 Artificial Intelligence                          │
│    "GPT-4 represents a major leap in AI..."        │
│    → 12 blocks, 8 backlinks                        │
│                                                     │
│ 📄 Project: ML Pipeline                             │
│    "Using AI to classify customer tickets..."      │
│    → 5 blocks, 3 backlinks                         │
│                                                     │
│ 📝 Daily Notes / 2024-01-15                         │
│    "Interesting AI paper on reasoning..."          │
│    → Referenced from [[Reading List]]              │
└─────────────────────────────────────────────────────┘
```

---

## Feature 2: Link & Reference Context

### The Problem
When you retrieve a block, you lose crucial context:
- What page is it on?
- What's the parent block?
- What pages does it link TO?
- What blocks REFERENCE this block?

### The Solution: Full Graph Context

For every retrieved block, show:

```
┌─────────────────────────────────────────────────────┐
│ Block: "The key insight is that [[spaced           │
│         repetition]] works best with ((active       │
│         recall)) techniques"                        │
├─────────────────────────────────────────────────────┤
│ 📍 Location:                                        │
│    [[Learning Strategies]] > Memory > Key Insights │
│                                                     │
│ 🔗 Links to:                                        │
│    → [[Spaced Repetition]] (15 blocks)             │
│    → ((8a7f3b2c)) "Active recall means..." [expand]│
│                                                     │
│ ↩️ Referenced by:                                   │
│    ← [[Study Techniques]] "See also: ((this))"     │
│    ← [[Book: Make It Stick]] "This aligns with..." │
│    ← 3 more...                                     │
│                                                     │
│ 👥 Sibling blocks:                                  │
│    • Previous: "Another finding from the paper..." │
│    • Next: "This suggests a workflow of..."        │
└─────────────────────────────────────────────────────┘
```

### Implementation

```typescript
interface BlockContext {
  block: RoamBlock;

  // Hierarchy
  breadcrumb: string[];        // ["Page", "Parent", "Grandparent"]
  siblings: RoamBlock[];       // Adjacent blocks
  children: RoamBlock[];       // Nested blocks

  // Outgoing (what this block points to)
  outgoingPageLinks: PageWithPreview[];
  outgoingBlockRefs: BlockWithPreview[];

  // Incoming (what points to this block)
  backlinks: BacklinkWithContext[];

  // Metadata
  createdDate: Date;
  lastEdited: Date;
}

async function buildBlockContext(
  blockUid: string,
  options: {
    siblingCount: number;      // How many siblings to include
    backlinkLimit: number;     // Max backlinks to fetch
    resolveRefs: boolean;      // Inline block ref content
  }
): Promise<BlockContext>;
```

### Context for LLM

When sending to Claude, format context richly:

```markdown
## Query Context

### Primary Result
**Page**: [[Learning Strategies]]
**Path**: Learning Strategies > Memory Techniques > Key Insights
**Block**: "The key insight is that [[spaced repetition]] works best with active recall"

### Linked Pages
- **[[Spaced Repetition]]**: "A learning technique where reviews are spaced out over increasing intervals..."
- **[[Active Recall]]**: "The practice of actively stimulating memory during learning..."

### Backlinks (blocks that reference this)
1. From [[Study Techniques]]: "The most effective approach combines ((8a7f3b2c)) with regular practice"
2. From [[Book Notes: Make It Stick]]: "Research supports ((8a7f3b2c)) - see Chapter 4"

### Sibling Context
- Previous: "Research from 2019 showed 40% better retention"
- Next: "This suggests a daily review workflow"
```

---

## Feature 3: Multi-Hop Graph Traversal

### The Problem
Sometimes the answer isn't in one block—it's in the CONNECTIONS:

> "How does my productivity system relate to my health goals?"

This requires traversing:
```
[[Productivity System]]
    → links to [[Morning Routine]]
        → links to [[Exercise]]
            → links to [[Health Goals]]
```

### The Solution: Graph-Aware Retrieval

```typescript
interface GraphTraversal {
  // Find paths between concepts
  findPaths(
    from: string,     // Starting page/concept
    to: string,       // Target page/concept
    maxHops: number   // Limit traversal depth
  ): GraphPath[];

  // Expand neighborhood
  expandNeighborhood(
    pageUid: string,
    options: {
      hops: number;           // How far to expand
      direction: 'in' | 'out' | 'both';
      minConnections: number; // Filter weak connections
    }
  ): GraphNeighborhood;

  // Find clusters
  findRelatedCluster(
    seedPages: string[],
    threshold: number
  ): PageCluster;
}

interface GraphPath {
  nodes: PageRef[];
  edges: LinkRef[];
  totalHops: number;
  strength: number;  // Based on link density
}
```

### User Experience: "Explore Connections"

```
┌─────────────────────────────────────────────────────┐
│ 🔍 Find connections: Productivity ↔ Health         │
├─────────────────────────────────────────────────────┤
│ Found 3 paths:                                      │
│                                                     │
│ Path 1 (2 hops, strongest):                        │
│ [[Productivity]] → [[Morning Routine]] → [[Health]]│
│ "My morning routine links these directly"          │
│                                                     │
│ Path 2 (3 hops):                                   │
│ [[Productivity]] → [[Energy Management]]           │
│    → [[Sleep]] → [[Health]]                        │
│ "Energy is the bridge concept"                     │
│                                                     │
│ Path 3 (3 hops):                                   │
│ [[Productivity]] → [[Focus]] → [[Exercise]]        │
│    → [[Health]]                                    │
│ "Exercise improves focus which boosts productivity"│
│                                                     │
│ 💡 AI Insight:                                      │
│ "Your notes suggest a strong bidirectional         │
│  relationship: health habits fuel productivity,    │
│  and productivity systems help maintain health     │
│  routines. The [[Morning Routine]] page is the    │
│  central hub connecting these domains."           │
└─────────────────────────────────────────────────────┘
```

---

## Feature 4: Contextual Embeddings

### The Problem
Standard embedding: Just the text
```
embed("This is important for the project")
// Loses: WHICH project? What context? Why important?
```

### The Solution: Embed with Context

```typescript
function createContextualChunk(block: RoamBlock): string {
  const parts = [
    // Page context
    `Page: [[${block.pageTitle}]]`,

    // Aliases if any
    block.pageAliases.length > 0
      ? `(also known as: ${block.pageAliases.map(a => `[[${a}]]`).join(', ')})`
      : '',

    // Hierarchy
    `Location: ${block.breadcrumb.join(' > ')}`,

    // The actual content
    `Content: ${block.string}`,

    // Outgoing links (important for topic association)
    block.outgoingLinks.length > 0
      ? `Links to: ${block.outgoingLinks.map(l => `[[${l.title}]]`).join(', ')}`
      : '',

    // Backlink count (importance signal)
    block.incomingRefCount > 0
      ? `Referenced by ${block.incomingRefCount} other blocks`
      : '',
  ];

  return parts.filter(Boolean).join('\n');
}

// Example output:
/*
Page: [[Project Alpha]]
(also known as: [[Alpha Project]], [[PA]])
Location: Project Alpha > Q4 Planning > Key Decisions
Content: We decided to use React for the frontend because of team expertise
Links to: [[React]], [[Frontend Architecture]], [[Team Skills]]
Referenced by 5 other blocks
*/
```

### Embedding Strategy

```typescript
interface EmbeddingStrategy {
  // What to embed
  granularity: 'block' | 'page' | 'section';

  // How much context to include
  contextDepth: number;  // Parent levels to include

  // Whether to include linked content
  includeLinkedPreviews: boolean;

  // Chunking for long pages
  maxChunkSize: number;
  chunkOverlap: number;
}

const recommendedStrategy: EmbeddingStrategy = {
  granularity: 'block',
  contextDepth: 2,           // Include 2 parent levels
  includeLinkedPreviews: true,
  maxChunkSize: 512,         // Tokens
  chunkOverlap: 50,
};
```

---

## Feature 5: Agentic Question Answering

### The Problem
Simple RAG: Retrieve → Generate
- Doesn't handle complex questions
- Can't reason across multiple sources
- No verification or exploration

### The Solution: Agent Loop

```typescript
interface AgentStep {
  thought: string;      // What the agent is thinking
  action: AgentAction;  // What it decides to do
  observation: string;  // What it learned
}

type AgentAction =
  | { type: 'search'; query: string }
  | { type: 'traverse'; from: string; direction: 'in' | 'out' }
  | { type: 'expand'; pageUid: string }
  | { type: 'compare'; pages: string[] }
  | { type: 'synthesize'; blocks: string[] }
  | { type: 'answer'; response: string };

async function agentLoop(question: string): Promise<AgentResponse> {
  const steps: AgentStep[] = [];
  let context = { question, gatheredInfo: [] };

  while (steps.length < MAX_STEPS) {
    const step = await planNextStep(context, steps);
    steps.push(step);

    if (step.action.type === 'answer') {
      return {
        answer: step.action.response,
        reasoning: steps,
        sources: extractSources(steps),
      };
    }

    // Execute action and update context
    const result = await executeAction(step.action);
    context.gatheredInfo.push(result);
  }
}
```

### Example: Complex Question

```
User: "What patterns do I notice in my most productive weeks,
       and how do they relate to my sleep and exercise habits?"

Agent reasoning:

Step 1:
  Thought: "I need to find entries about productive weeks"
  Action: search("productive week" OR "high productivity")
  Observation: Found 8 relevant blocks in daily notes

Step 2:
  Thought: "Now I should find sleep-related content nearby"
  Action: traverse(from: daily_notes, filter: sleep OR exercise)
  Observation: Found correlations in 5 daily notes

Step 3:
  Thought: "Let me check the [[Productivity]] and [[Health]] pages for patterns"
  Action: expand([[Productivity]], [[Sleep]], [[Exercise]])
  Observation: Found explicit connections documented

Step 4:
  Thought: "I have enough to synthesize an answer"
  Action: synthesize(all_gathered_blocks)

Final Answer:
  "Based on your notes, I found several patterns:

   1. **Sleep correlation**: In 6 of 8 'productive weeks', you noted
      getting 7+ hours of sleep. Your [[Sleep Tracking]] page confirms
      this pattern.

   2. **Exercise timing**: Morning exercise appears in 5 productive weeks.
      Your [[Morning Routine]] page links this to 'mental clarity'.

   3. **Explicit insight**: On [[2024-01-15]], you wrote:
      'Realized my best weeks have morning exercise AND 7hr sleep'

   Sources: [[2024-01-15]], [[2024-01-22]], [[Productivity]], [[Sleep Tracking]]"
```

---

## Feature 6: Smart Capture

### The Problem
Adding new notes means:
- Manually finding the right page
- Remembering to add links
- Forgetting related content

### The Solution: AI-Assisted Capture

```
User types: "Interesting idea from podcast - habit stacking
            could work for my morning routine"

AI suggests:
┌─────────────────────────────────────────────────────┐
│ 📝 Quick Capture                                    │
├─────────────────────────────────────────────────────┤
│ Your note:                                          │
│ "Interesting idea from podcast - habit stacking    │
│  could work for my morning routine"                │
├─────────────────────────────────────────────────────┤
│ 🔗 Suggested links:                                 │
│ ☑️ [[Habit Stacking]] (existing page, 12 blocks)   │
│ ☑️ [[Morning Routine]] (existing page, 8 blocks)   │
│ ☐ [[Podcasts]] (would create new page)             │
│                                                     │
│ 📍 Suggested location:                              │
│ → [[Morning Routine]] > Ideas to Try               │
│   (based on content similarity)                    │
│                                                     │
│ 🔄 Related existing content:                        │
│ • "Atomic Habits suggests stacking..." [[Book Notes]]│
│ • "Current morning routine: wake, coffee..."       │
├─────────────────────────────────────────────────────┤
│ [Capture] [Edit First] [Cancel]                    │
└─────────────────────────────────────────────────────┘
```

---

## Data Structures Summary

```typescript
// Core types
interface RoamPage {
  uid: string;
  title: string;
  aliases: string[];
  children: RoamBlock[];
  editedTime: number;
  createdTime: number;
}

interface RoamBlock {
  uid: string;
  string: string;
  pageUid: string;
  parentUid: string | null;
  children: RoamBlock[];
  order: number;
  editedTime: number;
  createdTime: number;
}

// Enriched types for retrieval
interface EnrichedBlock extends RoamBlock {
  pageTitle: string;
  pageAliases: string[];
  breadcrumb: string[];
  outgoingLinks: PageRef[];
  outgoingRefs: BlockRef[];
  incomingRefs: BlockRef[];
  embedding?: number[];
}

// Search results
interface SearchResult {
  block: EnrichedBlock;
  score: number;
  matchType: 'semantic' | 'keyword' | 'graph';
  highlights: TextRange[];
  context: BlockContext;
}

// Agent types
interface AgentResponse {
  answer: string;
  confidence: number;
  sources: SourceCitation[];
  reasoning?: AgentStep[];
  suggestedFollowups: string[];
}

interface SourceCitation {
  blockUid: string;
  pageTitle: string;
  excerpt: string;
  relevance: number;
}
```

---

## Next Steps

1. **Validate with existing MCP**: Test [2b3pro/roam-research-mcp](https://github.com/2b3pro/roam-research-mcp) to understand current capabilities
2. **Prototype embedding pipeline**: Small script to export graph, generate embeddings, test retrieval
3. **Design Raycast UI**: Mockups for search results with graph context
4. **Benchmark**: Test with your actual graph size to understand performance needs
