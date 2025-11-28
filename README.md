# Repo2Resume

Turn your GitHub contributions into resume-ready summaries using AI.

![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=next.js&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)

## Features

- Fetches your commits and PRs from any GitHub repository
- Generates professional, achievement-focused summaries via OpenAI
- Filter by date range and prioritize specific PRs
- Custom prompt support for tailored output
- One-click copy to clipboard

## Quick Start

```bash
# Clone and configure
git clone https://github.com/yourusername/repo2resume.git
cd repo2resume
cp backend/.env.example backend/.env
# Add your GITHUB_TOKEN and OPENAI_API_KEY to backend/.env

# Run with Docker
docker-compose up --build
```

Open http://localhost:3000

## Requirements

- GitHub Personal Access Token (with `repo` scope)
- OpenAI API Key

## Tech Stack

**Backend:** FastAPI, httpx, OpenAI SDK, Pydantic
**Frontend:** Next.js 16, TypeScript, Tailwind CSS, shadcn/ui
**Infra:** Docker, Docker Compose

## License

GPL-3.0-or-later 
