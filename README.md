# 🔍 HogQL Agent

> An autonomous AI agent that translates natural language into HogQL, executes against ClickHouse, and self-corrects errors — streamed in real-time.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         BROWSER (React + Vite)                      │
│  ┌──────────┐   ┌──────────────┐   ┌─────────────────────────────┐  │
│  │ QueryInput│──▶│ useQueryStream│──▶│ AgentStream / ResultsTable │  │
│  └──────────┘   │   (SSE)       │   └─────────────────────────────┘  │
│                 └──────┬───────┘                                    │
└────────────────────────┼────────────────────────────────────────────┘
                         │ POST /api/query/stream
                         ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI + Python)                        │
│  ┌─────────────────────────────────────────┐                        │
│  │           HogQLAgent (while loop)       │                        │
│  │  ┌──────────┐  ┌──────────────────────┐ │  ┌──────────────────┐  │
│  │  │ LLM Call  │  │  Tool Execution      │ │  │  Schema Inspector│  │
│  │  │ (NVIDIA   │──│  • execute_hogql     │─│──│  • list_tables   │  │
│  │  │  API)     │  │  • inspect_schema    │ │  │  • get_schema    │  │
│  │  └──────────┘  │  • get_tables        │ │  └────────┬─────────┘  │
│  │                └──────────────────────┘ │           │            │
│  └─────────────────────────────────────────┘           │            │
└─────────────────────────────────────────────────────────┼────────────┘
                                                         │
                         ┌───────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────────────────┐
│               CLICKHOUSE (Analytics Database)                       │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐                       │
│   │  events  │   │ persons  │   │ sessions │                       │
│   │ (10,000) │   │  (200)   │   │  (500)   │                       │
│   └──────────┘   └──────────┘   └──────────┘                       │
└──────────────────────────────────────────────────────────────────────┘
```

## Features

- **Natural Language to HogQL** — Ask analytics questions in plain English
- **Autonomous Error Recovery** — Agent inspects schema, reads errors, and retries automatically
- **Real-Time Streaming** — Watch the agent think, call tools, and correct mistakes via SSE
- **Schema-Aware** — Agent discovers tables and columns before writing queries
- **Read-Only Safety** — All queries are validated to prevent any data modification
- **Beautiful Dark UI** — Professional React interface with live execution visualization
- **No Agent Frameworks** — Custom while-loop orchestration, no LangChain or similar dependencies
- **Mock Data Included** — 10,000 events, 200 persons, 500 sessions ready to query

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/NITIN9181/Agentic-Text-to-HogQL-Execution.git
cd Agentic-Text-to-HogQL-Execution
```

### 2. Set up environment

```bash
cp .env.example .env
# Edit .env and add your NVIDIA API key:
# NVIDIA_API_KEY=nvapi-your-key-here
```

### 3. Run with Docker Compose

```bash
docker-compose up --build
```

### 4. Open the app

Navigate to **http://localhost:5173**

## How It Works

1. **User submits** a natural language question (e.g., "How many pageviews in the last 7 days?")
2. **Backend creates** an agent with conversation history and tool definitions
3. **Agent loop begins** — the LLM is called with tools available:
   - `get_available_tables` — discovers what tables exist
   - `inspect_schema` — examines column names, types, and sample data
   - `execute_hogql` — runs a HogQL SELECT query
4. **If a query fails**, the error message is fed back to the LLM along with suggestions
5. **The agent retries** with a corrected query (up to 10 iterations)
6. **Every step is streamed** to the frontend via Server-Sent Events in real-time
7. **Final results** are displayed in a formatted data table

## Example Queries

| Question | What it does |
|----------|-------------|
| "Count events by type in the last 7 days" | Groups events by name with date filter |
| "Show daily active users for the past month" | Counts distinct users per day |
| "Which pages have the most pageviews?" | Extracts URL from properties, ranks by count |
| "Compare free vs pro user activity" | Joins events with persons, groups by plan |
| "What's the average session duration?" | Aggregates session metrics |

## Tech Stack

| Component | Technology |
|-----------|-----------|
| LLM | NVIDIA GPT-OSS-120B |
| Backend | Python 3.11, FastAPI, OpenAI SDK |
| Database | ClickHouse 23.12 |
| Frontend | React 18, TypeScript, Vite, TailwindCSS |
| Streaming | Server-Sent Events (SSE) |
| Infrastructure | Docker Compose |

## Project Structure

```
agentic-hogql/
├── docker-compose.yml          # Three-service orchestration
├── .env.example                # Environment variables template
├── docker/
│   └── clickhouse/
│       └── init.sql            # Database schema + 10K mock records
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── src/
│       ├── main.py             # FastAPI app entry point
│       ├── config.py           # Pydantic settings
│       ├── agent/
│       │   ├── executor.py     # Core agentic while-loop
│       │   └── prompts.py      # System prompt with HogQL rules
│       ├── database/
│       │   ├── clickhouse_executor.py  # Read-only query execution
│       │   └── schema_inspector.py     # Table/column discovery
│       ├── api/
│       │   └── routes.py       # SSE streaming endpoint
│       └── tests/
│           ├── test_agent.py
│           └── test_clickhouse.py
└── frontend/
    ├── Dockerfile
    ├── package.json
    └── src/
        ├── App.tsx             # Root component
        ├── types.ts            # TypeScript event types
        ├── hooks/
        │   └── useQueryStream.ts   # SSE connection hook
        └── components/
            ├── Layout.tsx
            ├── QueryInput.tsx
            ├── AgentStream.tsx
            ├── EventCard.tsx
            └── ResultsTable.tsx
```

## License

MIT