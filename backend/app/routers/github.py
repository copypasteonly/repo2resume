from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import datetime
from app.models.schemas import (
    Repository,
    SummaryRequest,
    SummaryResponse,
    PaginatedPullRequestResponse,
)
from app.services.github_service import GitHubService
from app.services.llm_service import LLMService, DEFAULT_PROMPT
from app.config import Settings, get_settings

router = APIRouter(prefix="/api", tags=["github"])

# Service singletons
_github_service: Optional[GitHubService] = None
_llm_service: Optional[LLMService] = None


def get_github_service(settings: Settings = Depends(get_settings)) -> GitHubService:
    global _github_service
    if _github_service is None:
        _github_service = GitHubService(settings.github_token)
    return _github_service


def get_llm_service(settings: Settings = Depends(get_settings)) -> LLMService:
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService(settings.openai_api_key)
    return _llm_service


@router.get("/default-prompt")
async def get_default_prompt():
    """Get the default prompt for summary generation."""
    return {"prompt": DEFAULT_PROMPT}


@router.get("/repos", response_model=List[Repository])
async def get_repositories(
    github_service: GitHubService = Depends(get_github_service),
):
    """Fetch all repositories for the authenticated user."""
    try:
        repos = await github_service.get_repositories()
        return repos
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/repos/{repo_name:path}/pull-requests",
    response_model=PaginatedPullRequestResponse,
)
async def get_repo_pull_requests(
    repo_name: str,
    page: int = 0,
    per_page: int = 30,
    github_service: GitHubService = Depends(get_github_service),
):
    """Fetch pull requests for a specific repository created by the authenticated user with pagination."""
    try:
        prs, has_more = await github_service.get_paginated_pull_requests(
            repo_name, page_num=page, per_page=per_page
        )
        return PaginatedPullRequestResponse(
            items=prs,
            page=page,
            per_page=per_page,
            has_more=has_more,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-summary", response_model=SummaryResponse)
async def generate_summary(
    request: SummaryRequest,
    github_service: GitHubService = Depends(get_github_service),
    llm_service: LLMService = Depends(get_llm_service),
):
    """Generate a resume-ready summary for a specific repository."""
    try:
        start_date = (
            datetime.fromisoformat(request.start_date) if request.start_date else None
        )
        end_date = (
            datetime.fromisoformat(request.end_date) if request.end_date else None
        )

        # Fetch commits and PRs concurrently
        commits = await github_service.get_commits(
            request.repo_name, start_date=start_date, end_date=end_date
        )
        pull_requests = await github_service.get_pull_requests(
            request.repo_name, start_date=start_date, end_date=end_date
        )

        # Generate summary using LLM
        summary = await llm_service.generate_summary(
            request.repo_name,
            commits,
            pull_requests,
            request.prioritized_pr_numbers,
            request.custom_prompt,
        )

        return SummaryResponse(
            summary=summary,
            repo_name=request.repo_name,
            commits_analyzed=len(commits),
            prs_analyzed=len(pull_requests),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
