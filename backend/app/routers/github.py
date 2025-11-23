from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime
from app.models.schemas import (
    Repository,
    SummaryRequest,
    SummaryResponse,
    PaginatedPullRequestResponse,
)
from app.services.github_service import GitHubService
from app.services.llm_service import LLMService
from app.config import Settings, get_settings

router = APIRouter(prefix="/api", tags=["github"])


def get_github_service(settings: Settings = Depends(get_settings)) -> GitHubService:
    return GitHubService(settings.github_token)


def get_llm_service(settings: Settings = Depends(get_settings)) -> LLMService:
    return LLMService(settings.openai_api_key)


@router.get("/repos", response_model=List[Repository])
async def get_repositories(
    github_service: GitHubService = Depends(get_github_service),
):
    """Fetch all repositories for the authenticated user."""
    try:
        repos = github_service.get_repositories()
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
        prs, has_more = github_service.get_paginated_pull_requests(
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
        # Parse dates if provided
        start_date = (
            datetime.fromisoformat(request.start_date) if request.start_date else None
        )
        end_date = (
            datetime.fromisoformat(request.end_date) if request.end_date else None
        )

        # Fetch commits and PRs
        commits = github_service.get_commits(
            request.repo_name, start_date=start_date, end_date=end_date
        )
        pull_requests = github_service.get_pull_requests(
            request.repo_name, start_date=start_date, end_date=end_date
        )

        # Generate summary using LLM
        summary = llm_service.generate_summary(
            request.repo_name, commits, pull_requests, request.prioritized_pr_numbers
        )

        return SummaryResponse(
            summary=summary,
            repo_name=request.repo_name,
            commits_analyzed=len(commits),
            prs_analyzed=len(pull_requests),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
