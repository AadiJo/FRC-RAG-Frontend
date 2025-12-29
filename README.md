 # FRC RAG Frontend

 The responsive web interface for **FRC RAG** — a Retrieval‑Augmented Generation (RAG) assistant tuned for FIRST Robotics Competition teams.

 > **Note:** This repository contains the Next.js + Convex web app (UI + API routes + Convex functions). The RAG backend service is separate.

 ## Overview

 FRC teams lose time re-learning solutions that already exist: interpreting rules, comparing strategies, and iterating mechanisms under tight deadlines. FRC RAG is designed to reduce that friction by giving teams a fast chat interface that can pull in retrieval context (rules/docs + your own indexed PDFs) and stream back answers.

 Instead of searching across PDFs, forum posts, and notes manually, the app supports:

 - Chatting with an FRC-focused assistant (with model selection)
 - Optional web search for time-sensitive info
 - Indexing PDFs from Google Drive so your team’s docs can be used as private context

 ## Features

 - Chat-first workflow: `/chat` is the primary interface with streaming responses.
 - RAG context (rules + documents): The chat pipeline can fetch retrieval context and display sources/related images when provided by the backend.
 - Google Drive PDF indexing: Connect Drive and index text-based PDFs to use as personalized retrieval context.
 - Web search toggle: Optional “Search” tool in chat (requires `TAVILY_API_KEY`).
 - Multi-model support: Pick from configured models (OpenRouter/Groq-backed).
 - Chat management:
    - Sidebar chat list with search
    - Pin/unpin chats
    - Rename and delete chats
    - Branch a new chat from a message
    - Global history search (Cmd/Ctrl+K) across chats and messages
    - Export/import history and bulk deletion in Settings → History
 - Auth modes:
    - Guest mode (anonymous sessions)
    - Google sign-in (Convex Auth) to increase limits and unlock Settings
 - API key storage: Users can store provider API keys (encrypted in Convex using `API_KEY_SECRET`).
 - Usage limits: Settings shows usage; creation endpoints check limits before creating chats.

 ## Quick Start

 ### 1. Install dependencies (Bun)

 ```bash
 bun install
 ```

 ### 2. Set up Convex

 ```bash
 bunx convex login
 bunx convex dev
 ```

 This will create/update `.env.local` with your Convex deployment URL(s). Keep that file.

 ### 3. Configure environment variables

 Use `.env.example` as the checklist, but don’t overwrite `.env.local` created by Convex.

 Common variables:

 - In Next.js (`.env.local`):
    - `NEXT_PUBLIC_CONVEX_URL` (created by Convex)
    - `NEXT_PUBLIC_RAG_BACKEND_URL` (your RAG backend base URL)
    - `TAVILY_API_KEY` (only if you want web search)
 - In Convex (set via `bunx convex env set ...` or the Convex dashboard):
    - `CONVEX_SITE_URL` (e.g. `http://localhost:3000`)
    - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
    - `API_KEY_SECRET` (required to encrypt user-stored API keys)

 Example:

 ```bash
 bunx convex env set API_KEY_SECRET "$(openssl rand -hex 64)"
 bunx convex env set CONVEX_SITE_URL "http://localhost:3000"
 bunx convex env set GOOGLE_CLIENT_ID "..."
 bunx convex env set GOOGLE_CLIENT_SECRET "..."
 ```

 ### 4. Run the dev server

 In one terminal (Convex):

 ```bash
 bunx convex dev
 ```

 In another terminal (Next.js):

 ```bash
 bun dev
 ```

 Open http://localhost:3000

 ## Project Structure

 ```
 ├── app/                   # Next.js App Router (pages + API routes)
 │   ├── (home)/            # Landing page
 │   ├── auth/              # Login (Google via Convex Auth)
 │   ├── chat/              # Chat routes
 │   ├── settings/          # Account, API keys, models, history, docs, attachments
 │   └── api/               # Next.js API routes (chat, ingest, rate-limits, tools)
 ├── app/components/        # App-specific UI (chat, history, layout, settings)
 ├── components/            # Shared UI primitives (shadcn/ui, prompt-kit, etc.)
 ├── convex/                # Convex schema + queries/mutations/actions
 ├── lib/                   # Core utilities (models, RAG helpers, routes, etc.)
 ├── public/                # Static assets
 ├── docs/                  # Infra/setup docs (RAG backend + vector store guide)
 ├── package.json           # Scripts (bun dev/build/typecheck/lint/test)
 └── tsconfig.json          # TypeScript configuration
 ```

 ## Configuration

 Key variables (see `.env.example`):

 - `NEXT_PUBLIC_CONVEX_URL` — Next.js: Convex deployment URL used by the web app  
 - `CONVEX_SITE_URL` — Convex: Site URL used by Convex Auth  
 - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Convex: Google OAuth  
 - `API_KEY_SECRET` — Convex: encrypts user API keys at rest (required)  
 - `NEXT_PUBLIC_RAG_BACKEND_URL` — Next.js: Base URL for the RAG backend service  
 - `TAVILY_API_KEY` — Next.js: Enables the web search tool

 ## Planned Additions
   - Chat sharing (public links)