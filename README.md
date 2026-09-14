# Paro

Paro is a general-purpose AI assistant: a ChatGPT-style web app with streaming
responses, persistent multi-conversation history, and a clean, extensible
architecture designed so tools and long-term memory can be added later
without rewriting the core system.

This is a **foundation**, not a demo - the pieces (LLM provider abstraction,
context management, LangGraph agent workflow, pgvector-ready schema) are
built to be extended, not thrown away.

---

## Overview

- Chat with Paro, create and switch between multiple conversations, rename
  or delete them.
- Assistant responses stream token-by-token over Server-Sent Events (SSE).
- Full Markdown rendering (headings, lists, tables, code blocks with syntax
  highlighting, inline code) with copy-to-clipboard on messages and code
  blocks.
- Responsive, mobile-friendly UI with a collapsible sidebar drawer.
- No AI provider lock-in: the backend talks to an `LLMProvider` interface,
  not directly to NVIDIA's SDK, so another provider can be added later
  without touching the agent or API layers.

**Out of scope for V1** (by design - see the build spec): tool calling
(web search / calculator / file analysis), long-term semantic memory /
RAG, real user authentication, Kubernetes, object storage, and
microservices. The schema and architecture leave room for all of these.

---

## Architecture

```text
Browser (Next.js)
      |
      | SSE / REST, same-origin via Nginx in production
      v
   Nginx  ───────────────►  Next.js frontend (App Router)
      |
      | /api/*
      v
   FastAPI backend
      |
      v
  Chat Service ─── Context Manager (recent-message windowing)
      |
      v
  Paro Agent (LangGraph)
   load_context → prepare_messages → call_llm → save_response
      |
      v
  LLMProvider (abstract)
      |
      v
  NVIDIAProvider  (NVIDIA NIM, OpenAI-compatible API)
      |
      v
PostgreSQL (+ pgvector, reserved for future RAG)   Redis (reserved for cache/rate-limit/background work)
```

Key design decisions:

- **Provider abstraction** (`backend/app/llm/base.py`, `nvidia.py`,
  `factory.py`): all agent/service code depends on `LLMProvider`, never on
  the NVIDIA SDK directly. Adding OpenAI or Anthropic later is a new class
  plus one line in the factory.
- **LangGraph workflow** (`backend/app/agents/graph.py`): the canonical
  turn-taking flow (`load_context → prepare_messages → call_llm →
  save_response`) is defined as a graph so tool nodes can be inserted later
  without restructuring the app. The streaming HTTP path reuses the same
  building blocks (see the docstring in `graph.py` for why streaming
  doesn't go through `graph.ainvoke` directly).
- **Context management** (`backend/app/services/context_manager.py`):
  recency + rough token-budget trimming today; the interface is narrow
  enough to swap in summarization or retrieval later.
- **pgvector from day one** (`MemoryItem` model): unused by app logic in
  V1, but present so semantic memory can be added as a feature, not a
  migration.
- **SSE streaming correctness**: conversation ownership is validated
  *before* the SSE stream opens, because `StreamingResponse` commits its
  HTTP status code before the generator runs - validating inside the
  generator would silently turn a 404 into a 200 with an in-band error
  event.

---

## Requirements

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose v2
- For local (non-Docker) development:
  - Python 3.12+
  - Node.js 20+
  - A PostgreSQL 16 instance with the `vector` extension available (the
    `pgvector/pgvector:pg16` image is used in Docker Compose)
  - Redis 7+
- An NVIDIA API key (see [NVIDIA setup](#nvidia-api-key) below)

---

## Environment variables

Copy the template and fill in real values:

```bash
cp .env.example .env
```

| Variable | Used by | Description |
|---|---|---|
| `ENVIRONMENT` | backend | `development`, `production`, or `test`. Disables `/api/docs` in production. |
| `DEBUG` | backend | Verbose logging when `true`. |
| `LOG_LEVEL` | backend | Python logging level. |
| `CORS_ORIGINS` | backend | Comma-separated list of allowed frontend origins. |
| `LLM_PROVIDER` | backend | Currently only `nvidia`. Extension point for future providers. |
| `NVIDIA_API_KEY` | backend | **You generate and paste this yourself** (see below). Never sent to the frontend. |
| `NVIDIA_BASE_URL` | backend | NVIDIA NIM's OpenAI-compatible base URL. |
| `NVIDIA_MODEL` | backend | Model name/tag, e.g. `meta/llama-3.1-70b-instruct`. Never hardcoded in code. |
| `MAX_CONTEXT_MESSAGES` | backend | Max recent messages sent to the model per turn. |
| `MAX_CONTEXT_TOKENS` | backend | Rough token budget guard for context trimming. |
| `LLM_TEMPERATURE`, `LLM_MAX_OUTPUT_TOKENS` | backend | Generation parameters. |
| `DATABASE_URL` | backend | `postgresql+asyncpg://user:pass@host:5432/db`. |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Docker Compose | Used to initialize the Postgres container; must match `DATABASE_URL`. |
| `REDIS_URL` | backend | `redis://host:6379/0`. |
| `REQUEST_MAX_BODY_BYTES` | backend | Hard cap on incoming request body size. |
| `RATE_LIMIT_PER_MINUTE` | backend | Reserved for rate-limiting middleware/infrastructure. |
| `NEXT_PUBLIC_API_URL` | frontend | Origin the browser calls, **without** a trailing `/api` (the client appends `/api/...` itself). In Docker Compose production this is the Nginx origin (e.g. `http://localhost`); in local dev it's the backend directly (e.g. `http://localhost:8000`). |

### NVIDIA API key

Per project scope, **API key provisioning is handled outside of this
codebase**: log in to your NVIDIA Developer account, create/select API
access, generate a key, and paste it into `NVIDIA_API_KEY` in your `.env`
file. The application only ever reads it from the environment.

---

## Local development

### Option A: everything in Docker (recommended)

```bash
cp .env.example .env   # fill in NVIDIA_API_KEY
docker compose -f docker-compose.dev.yml up --build
```

- Backend: http://localhost:8000 (interactive docs at `/api/docs`)
- Frontend: http://localhost:3000
- Postgres migrations run automatically on backend startup.
- Both services hot-reload on file changes (source is volume-mounted).

Stop with `Ctrl+C`, or in another terminal:

```bash
docker compose -f docker-compose.dev.yml down
```

### Option B: running services individually

**Postgres + Redis only, via Docker:**

```bash
docker compose -f docker-compose.dev.yml up -d postgres redis
```

**Backend:**

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp ../.env.example .env   # adjust DATABASE_URL/REDIS_URL to localhost
alembic upgrade head
uvicorn app.main:app --reload
```

**Frontend:**

```bash
cd frontend
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

---

## Docker Compose usage

```bash
docker compose up --build      # production stack: postgres, redis, backend, frontend, nginx
docker compose down            # stop and remove containers
docker compose logs -f backend # tail logs for one service
docker compose ps              # see service status/health
```

The production stack serves everything through Nginx on port 80
(`HTTP_PORT` to change it): `/` goes to the Next.js app, `/api/*` goes to
FastAPI, and `/api/chat` specifically disables proxy buffering so SSE
tokens aren't held back before reaching the browser.

---

## Database & migrations

Schema changes are managed exclusively through Alembic - never modify
tables by hand.

```bash
cd backend
alembic revision --autogenerate -m "describe the change"
alembic upgrade head
alembic downgrade -1   # roll back one migration
```

The initial migration (`migrations/versions/0001_initial_schema.py`)
creates `users`, `conversations`, `messages`, enables the `vector`
extension, and creates `memory_items` (reserved for future RAG - unused by
application code today).

---

## API

All endpoints are prefixed with `/api`. Requests are scoped to a user via
an `X-User-Id` header (a UUID the frontend generates and persists in
`localStorage` - see [Environment variables](#environment-variables) for
why there's no real login system yet).

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Service + database health. |
| POST | `/conversations` | Create a conversation. |
| GET | `/conversations` | List the current user's conversations. |
| GET | `/conversations/{id}` | Get one conversation. |
| PATCH | `/conversations/{id}` | Rename a conversation. |
| DELETE | `/conversations/{id}` | Delete a conversation and its messages. |
| GET | `/conversations/{id}/messages` | List messages in a conversation. |
| POST | `/chat` | Send a message; streams the assistant's reply as SSE (`chunk` / `done` / `error` events). |

Interactive Swagger docs are available at `/api/docs` when
`ENVIRONMENT != production`.

---

## Testing

**Backend** (`pytest`, mocked LLM - no real NVIDIA calls):

```bash
cd backend
docker compose -f ../docker-compose.dev.yml up -d postgres redis
createdb -h localhost -U paro paro_test   # or: docker exec -it <postgres container> createdb -U paro paro_test
pytest
```

**Frontend** (`vitest` + Testing Library):

```bash
cd frontend
npm test
```

---

## Deployment (Linux server)

1. Install Docker + Docker Compose on the server.
2. Clone the repo, `cp .env.example .env`, fill in production values
   (real `NVIDIA_API_KEY`, strong `POSTGRES_PASSWORD`, `CORS_ORIGINS` and
   `NEXT_PUBLIC_API_URL` matching your real domain, `ENVIRONMENT=production`).
3. `docker compose up -d --build`
4. Put a TLS-terminating layer in front of Nginx (a managed load balancer,
   or Certbot + an HTTPS `server` block added to `nginx/nginx.conf`) -
   the config already ships with the security headers and is structured so
   adding a `listen 443 ssl;` block is a small, isolated change.
5. Point DNS at the server and confirm `/api/health` responds through the
   public URL.

For updates: pull the new code, then `docker compose up -d --build` -
migrations run automatically on backend startup.

---

## Troubleshooting

**Backend container keeps restarting / migration errors on startup**
Check `docker compose logs backend`. Usually means Postgres isn't ready
yet or `DATABASE_URL` doesn't match the `postgres` service's credentials -
`docker-entrypoint.sh` retries migrations a few times before giving up.

**Chat responses arrive all at once instead of streaming**
Almost always a proxy buffering issue. If you've changed
`nginx/nginx.conf`, make sure the `/api/chat` location still has
`proxy_buffering off;` and `X-Accel-Buffering: no` isn't being stripped
somewhere upstream (the backend also sets this header directly).

**"Missing X-User-Id header" / 401s from the API**
The frontend generates this automatically in the browser. If you're
calling the API directly (curl/Postman), pass a `X-User-Id: <any-uuid>`
header yourself.

**NVIDIA requests fail with an auth error**
`NVIDIA_API_KEY` is empty or invalid in your `.env`. The backend logs a
warning at startup if the key is missing.

**`alembic revision --autogenerate` produces an empty migration**
Make sure your models are actually imported - `migrations/env.py` imports
`app.database.models` for its side effect of registering tables on
`Base.metadata`; if you add a new model module, import it there too.

**Frontend can't reach the backend in production**
Check that `NEXT_PUBLIC_API_URL` has **no** trailing `/api` (the client
appends it) and matches wherever Nginx is actually reachable from the
browser - not the internal Docker service name.
