# NextFlow — LLM Workflow Builder

A pixel-perfect Krea.ai-inspired visual workflow builder for LLM pipelines, built with Next.js, React Flow, Google Gemini, and Trigger.dev.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 15 (App Router) | React framework |
| TypeScript (strict) | Type safety |
| React Flow | Visual workflow canvas |
| Trigger.dev v3 | All node execution (non-negotiable) |
| Transloadit | File uploads & media processing |
| Google Gemini API | LLM execution |
| Clerk | Authentication |
| PostgreSQL (Neon) + Prisma | Database & ORM |
| Zustand + zundo | State management + undo/redo |
| Tailwind CSS | Styling |
| Zod | Schema validation |
| Lucide React | Icons |

---

## Quick Start

### 1. Clone & install
```bash
git clone <repo>
cd nextflow
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env.local
```

Fill in all values in `.env.local`:

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | [Neon](https://neon.tech) — free PostgreSQL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | [Clerk](https://clerk.com) |
| `CLERK_SECRET_KEY` | Clerk dashboard |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com) |
| `TRIGGER_SECRET_KEY` | [Trigger.dev](https://trigger.dev) |
| `TRIGGER_PROJECT_REF` | Trigger.dev project settings |
| `NEXT_PUBLIC_TRANSLOADIT_KEY` | [Transloadit](https://transloadit.com) |
| `TRANSLOADIT_SECRET` | Transloadit settings |

### 3. Set up database
```bash
npm run db:generate
npm run db:push
```

### 4. Start Trigger.dev dev worker (in separate terminal)
```bash
npx trigger.dev@latest dev
```

### 5. Run the app
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Architecture

### Node Execution Flow
```
User clicks Run
  → /api/workflows/run (POST)
  → buildDAG() — topological sort into execution levels
  → For each level: trigger all Trigger.dev tasks CONCURRENTLY
  → Each task reports back output
  → WorkflowRun persisted to PostgreSQL
  → Client polls /api/history/:runId until complete
```

### Parallel Execution
Independent branches run simultaneously via `Promise.all()` at each topological level. A convergence node only executes once ALL its upstream dependencies complete.

### Type-Safe Connections
Handle types are enforced at connection time:
- `text` → can only connect to `text` or `any` targets
- `image` → can only connect to `image` or `any` targets  
- `video` → can only connect to `video` or `any` targets

Invalid connections are silently rejected in `isValidConnection()`.

### Undo/Redo
Powered by `zundo` (temporal middleware for Zustand). Tracks the last 50 node/edge states.

---

## Node Types

| Node | Description | Trigger.dev |
|---|---|---|
| Text | Static text input | No (static) |
| Upload Image | Transloadit upload | No (client-side) |
| Upload Video | Transloadit upload | No (client-side) |
| Run LLM | Google Gemini call | **Yes** — `run-llm` |
| Crop Image | FFmpeg crop | **Yes** — `crop-image` |
| Extract Frame | FFmpeg frame extraction | **Yes** — `extract-frame` |

---

## Sample Workflow: Product Marketing Kit Generator

Located in `src/lib/utils/sample-workflow.ts`. Demonstrates:
- **Branch A**: Upload Image → Crop → LLM Node #1 (product description)
- **Branch B**: Upload Video → Extract Frame
- **Convergence**: LLM Node #2 waits for BOTH branches, creates marketing tweet

Load it via the Import button or programmatically:
```ts
import { SAMPLE_WORKFLOW_NODES, SAMPLE_WORKFLOW_EDGES } from '@/lib/utils/sample-workflow';
useWorkflowStore.getState().loadWorkflow(SAMPLE_WORKFLOW_NODES, SAMPLE_WORKFLOW_EDGES);
```

---

## API Routes

| Method | Route | Description |
|---|---|---|
| GET | `/api/workflows` | List user's workflows |
| POST | `/api/workflows` | Save/update workflow |
| GET | `/api/workflows/:id` | Get single workflow |
| DELETE | `/api/workflows/:id` | Delete workflow |
| POST | `/api/workflows/run` | Execute workflow |
| GET | `/api/history` | Get run history |
| GET | `/api/history/:runId` | Poll run status |

All routes are protected by Clerk middleware and validated with Zod.

---

## Deployment (Vercel)

```bash
npm run build
vercel --prod
```

Set all environment variables in Vercel dashboard. The `DATABASE_URL` must point to your Neon PostgreSQL instance.

---

## Deliverables Checklist

- ✅ Pixel-perfect Krea-inspired dark UI
- ✅ Clerk authentication with protected routes
- ✅ Left sidebar with 6 node buttons + search
- ✅ Right sidebar with workflow history panel
- ✅ Node-level execution history with expand/collapse
- ✅ React Flow canvas with dot grid background
- ✅ Text Node with textarea and output handle
- ✅ Upload Image Node (Transloadit + preview)
- ✅ Upload Video Node (Transloadit + video player)
- ✅ LLM Node (Gemini + model selector + inline output)
- ✅ Crop Image Node (FFmpeg via Trigger.dev)
- ✅ Extract Frame Node (FFmpeg via Trigger.dev)
- ✅ All node executions via Trigger.dev tasks
- ✅ Pulsating glow effect on running nodes
- ✅ Pre-built Product Marketing Kit sample workflow
- ✅ Animated purple edges
- ✅ API routes with Zod validation
- ✅ Google Gemini with vision support (multimodal)
- ✅ TypeScript strict mode throughout
- ✅ PostgreSQL + Prisma ORM
- ✅ Workflow save/load to database
- ✅ Workflow history persistence to database
- ✅ Workflow export/import as JSON
- ✅ DAG validation (cycle detection)
- ✅ Parallel execution of independent branches
- ✅ Type-safe handle connections
- ✅ Undo/Redo (50 steps)
- ✅ MiniMap + Controls
- ✅ Collapsible sidebars
- ✅ Connected input state (disabled fields)
- ✅ Selective execution (full / selected / single)
# nextflow
# nextflow
