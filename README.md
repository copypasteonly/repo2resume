# Repo2Resume

A full-stack application that generates professional, resume-ready summaries of your GitHub contributions using AI. Simply select a repository, optionally filter by date range, and get a polished summary highlighting your technical accomplishments.

![Gruvbox Dark Theme](https://img.shields.io/badge/theme-gruvbox%20dark-fb4934?style=flat-square)
![FastAPI](https://img.shields.io/badge/backend-FastAPI-009688?style=flat-square)
![Next.js](https://img.shields.io/badge/frontend-Next.js%2015-000000?style=flat-square)

## Features

- **Automated GitHub Analysis**: Fetches commits and pull requests from your repositories
- **AI-Powered Summaries**: Uses GPT-4.1 to generate professional, resume-ready descriptions
- **Date Range Filtering**: Optionally filter contributions by specific time periods
- **Beautiful UI**: Dark Gruvbox theme with Shadcn components
- **One-Click Copy**: Easy copy-to-clipboard for generated summaries
- **Full Repository Support**: Shows all your repos (public, private, and forks)
- **Docker Ready**: Complete Docker Compose setup for easy deployment

## Prerequisites

- **Docker & Docker Compose** (recommended) OR
- **Python 3.12+** and **Node.js 20+**
- **GitHub Personal Access Token** with `repo` scope
- **OpenAI API Key** with GPT-4 access

## Quick Start with Docker

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd repo2resume
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and add your tokens:

```env
GITHUB_TOKEN=ghp_your_github_personal_access_token_here
OPENAI_API_KEY=sk-your_openai_api_key_here
```

Create a `.env.local` file in the `frontend` directory (optional for Docker):

```bash
cp frontend/.env.local.example frontend/.env.local
```

### 3. Start the Application

```bash
docker-compose up --build
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### 4. Stop the Application

```bash
docker-compose down
```

## Local Development Setup

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your GitHub and OpenAI tokens

# Run the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local if needed (default: http://localhost:8000)

# Run the development server
npm run dev
```

Visit http://localhost:3000 to use the application.

## Getting Your API Keys

### GitHub Personal Access Token

1. Go to [GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a descriptive name (e.g., "Repo2Resume")
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - Or minimum: `public_repo` and `read:user`
5. Click "Generate token"
6. Copy the token immediately (you won't see it again!)

### OpenAI API Key

1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Click "Create new secret key"
3. Give it a name (e.g., "Repo2Resume")
4. Copy the key immediately (you won't see it again!)
5. Ensure your account has access to GPT-4 models

## Usage

1. **Open the Application**: Navigate to http://localhost:3000
2. **Select Repository**: Choose from the dropdown list of your repositories
3. **Set Date Range** (Optional): Click the date picker to filter contributions by time period, or leave blank for all-time history
4. **Generate Summary**: Click the "Generate Summary" button
5. **Copy Summary**: Use the copy button to copy the generated text to your clipboard
6. **Use in Resume**: Paste the summary into your resume, LinkedIn profile, or portfolio!

## Project Structure

```
repo2resume/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application
│   │   ├── config.py            # Environment configuration
│   │   ├── models/
│   │   │   └── schemas.py       # Pydantic models
│   │   ├── routers/
│   │   │   └── github.py        # API endpoints
│   │   └── services/
│   │       ├── github_service.py # PyGithub integration
│   │       └── llm_service.py    # OpenAI integration
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── app/
│   │   ├── page.tsx             # Main page
│   │   ├── layout.tsx           # Root layout
│   │   └── globals.css          # Gruvbox theme
│   ├── components/
│   │   ├── ui/                  # Shadcn components
│   │   ├── RepoSelector.tsx
│   │   ├── DateRangeSelector.tsx
│   │   └── SummaryCard.tsx
│   ├── lib/
│   │   └── utils.ts
│   ├── package.json
│   ├── Dockerfile
│   └── .env.local.example
├── docker-compose.yml
└── README.md
```

## API Endpoints

### `GET /api/repos`
Fetches all repositories for the authenticated GitHub user.

**Response:**
```json
[
  {
    "name": "my-repo",
    "full_name": "username/my-repo",
    "description": "A cool project",
    "language": "TypeScript",
    "is_fork": false,
    "is_private": false,
    "url": "https://github.com/username/my-repo"
  }
]
```

### `POST /api/generate-summary`
Generates a resume-ready summary for a specific repository.

**Request Body:**
```json
{
  "repo_name": "username/my-repo",
  "start_date": "2024-01-01T00:00:00Z",  // Optional
  "end_date": "2024-12-31T23:59:59Z"     // Optional
}
```

**Response:**
```json
{
  "summary": "I developed and maintained...",
  "repo_name": "username/my-repo",
  "commits_analyzed": 145,
  "prs_analyzed": 23
}
```

## Technologies Used

### Backend
- **FastAPI** - Modern Python web framework
- **PyGithub** - GitHub API wrapper
- **OpenAI Python SDK** - GPT-4 integration
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Shadcn/ui** - Beautifully designed components
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Unstyled, accessible components
- **Lucide React** - Icon library
- **date-fns** - Date manipulation

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

## Customization

### Change the Theme

Edit `frontend/app/globals.css` to customize the Gruvbox color scheme:

```css
:root {
  --background: 16 12% 16%;      /* #282828 */
  --primary: 45 100% 58%;         /* #fabd2f */
  /* ... modify other colors ... */
}
```

### Adjust AI Prompt

Edit `backend/app/services/llm_service.py` to customize the summary generation prompt and style.

### Change LLM Model

Edit the model in `backend/app/services/llm_service.py`:

```python
response = self.client.chat.completions.create(
    model="gpt-4-turbo",  # Change to "gpt-3.5-turbo" for cost savings
    # ...
)
```

## Troubleshooting

### "Failed to fetch repositories"
- Verify your GitHub token is valid and has the correct scopes
- Check that the token is properly set in `backend/.env`

### "Failed to generate summary"
- Ensure your OpenAI API key is valid
- Verify your account has access to GPT-4 models
- Check API usage limits on your OpenAI account

### CORS Errors
- Make sure the backend is running on port 8000
- Verify `NEXT_PUBLIC_API_URL` in frontend `.env.local` matches your backend URL

### Docker Build Failures
- Ensure Docker and Docker Compose are installed and running
- Try `docker-compose down -v` to remove volumes, then rebuild

## License

MIT License - feel free to use this for your own projects!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ using FastAPI, Next.js, and GPT-4
