# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Repo2Resume is a full-stack application that uses GitHub API + OpenAI to generate professional resume summaries from repository contributions. It consists of a FastAPI backend and Next.js 15 frontend, both containerized with Docker.

## Development Commands

### Docker (Recommended)
```bash
# Initial setup
cp backend/.env.example backend/.env
# Edit backend/.env with GITHUB_TOKEN and OPENAI_API_KEY

# Start everything
docker-compose up --build

# Stop everything
docker-compose down

# Rebuild only backend after code changes
docker-compose up --build backend

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Local Development

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with tokens
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev  # Development server on port 3000
npm run build  # Production build
```

## Architecture

### Backend Architecture (FastAPI)

**Service Layer Pattern:**
- `app/services/github_service.py` - PyGithub wrapper for fetching repos/commits/PRs
- `app/services/llm_service.py` - OpenAI client for generating summaries
- `app/routers/github.py` - API endpoints with dependency injection

**Dependency Injection Pattern:**
Services are injected via FastAPI's `Depends()` mechanism:
- `get_settings()` - Cached settings loaded from environment variables
- `get_github_service()` - Creates GitHubService with token from settings
- `get_llm_service()` - Creates LLMService with OpenAI key from settings

This ensures services are created per-request with proper configuration.

**CORS Configuration:**
CORS is configured in `app/main.py` to allow frontend on `http://localhost:3000`. When adding new frontend URLs (e.g., production domains), update `allow_origins` list.

### Frontend Architecture (Next.js 15)

**App Router Structure:**
- `app/page.tsx` - Main page (client component) with all state management
- `app/layout.tsx` - Root layout, sets dark mode via `className="dark"`
- `app/globals.css` - Gruvbox dark theme color variables

**Component Organization:**
- `components/ui/` - Shadcn/ui base components (button, card, select, calendar, popover)
- `components/` - Custom business components (RepoSelector, DateRangeSelector, SummaryCard)

**State Management:**
All state lives in `app/page.tsx` as a single client component. No external state management library is used. API calls are made with native `fetch()`.

**API Communication:**
Frontend calls backend via `NEXT_PUBLIC_API_URL` environment variable. In Docker, this is set to `http://backend:8000` (internal network). For local dev, it defaults to `http://localhost:8000`.


## Environment Variables

**Backend (.env):**
```
GITHUB_TOKEN=ghp_...  # Requires 'repo' scope for private repos
OPENAI_API_KEY=sk-...
```

**Frontend (.env.local):**
```
NEXT_PUBLIC_API_URL=http://localhost:8000  # Only for local dev, Docker uses compose env
```

## GitHub API Integration

**Repository Fetching Strategy:**
`github_service.get_repositories()` uses specific parameters:
```python
affiliation="owner,collaborator,organization_member"
visibility="all"
sort="updated"
```

This ensures ALL accessible repos are returned (owned, collaborator, org), not just owned repos. The `repo` token scope is required for private repository access.

**Commit/PR Filtering:**
Date filtering is done client-side in the service layer (not via GitHub API params for PRs) because PR filtering by date is not supported in all cases by the GitHub API.

## LLM Configuration

The LLM service uses:
- Model: `gpt-5-mini` (configurable in `llm_service.py`)
- Temperature: `1` (high creativity for resume writing)
- Max tokens: Uncapped (removed to allow longer summaries)

The prompt emphasizes first-person, achievement-focused language suitable for resumes.

## UI Theme (Gruvbox Dark)

Color scheme is defined in `frontend/app/globals.css` as CSS custom properties:
- Background: `#282828`
- Primary (yellow): `#fabd2f`
- Secondary (green): `#b8bb26`
- Accent (red): `#fb4934`
- Muted: `#504945`

When adding new UI components, use these Tailwind classes: `bg-background`, `text-foreground`, `bg-primary`, etc.

## API Endpoints

**GET /api/repos**
Returns list of all accessible repositories with metadata (name, language, is_private, is_fork, etc.)

**POST /api/generate-summary**
Accepts: `{repo_name, start_date?, end_date?}`
Returns: `{summary, repo_name, commits_analyzed, prs_analyzed}`

Dates must be ISO 8601 format strings if provided.

## Debugging

- Backend API docs (Swagger): http://localhost:8000/docs
- Backend health check: http://localhost:8000/health
- Frontend runs on: http://localhost:3000

If frontend can't reach backend in Docker, verify the `NEXT_PUBLIC_API_URL` is set to `http://backend:8000` (service name, not localhost).

## Docker Notes

**Frontend Dockerfile** requires `output: 'standalone'` in next.config.js for the multi-stage build to work correctly. The production stage copies from `.next/standalone`.

**Backend Dockerfile** uses Python 3.12 slim. The `curl` command in healthcheck may fail if curl is not installed in the image - this is expected for the slim image.

**Networking:** Both services are on `repo2resume-network` bridge network. Frontend references backend as `http://backend:8000` using Docker's internal DNS.
