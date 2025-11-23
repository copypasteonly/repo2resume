from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class Repository(BaseModel):
    name: str
    full_name: str
    description: Optional[str] = None
    language: Optional[str] = None
    is_fork: bool
    is_private: bool
    url: str


class Commit(BaseModel):
    sha: str
    message: str
    author: str
    date: datetime


class PullRequest(BaseModel):
    number: int
    title: str
    body: Optional[str] = None
    state: str
    labels: List[str]
    created_at: datetime
    merged_at: Optional[datetime] = None


class SummaryRequest(BaseModel):
    repo_name: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    prioritized_pr_numbers: Optional[List[int]] = None


class SummaryResponse(BaseModel):
    summary: str
    repo_name: str
    commits_analyzed: int
    prs_analyzed: int


class PaginatedPullRequestResponse(BaseModel):
    items: List[PullRequest]
    page: int
    per_page: int
    has_more: bool
