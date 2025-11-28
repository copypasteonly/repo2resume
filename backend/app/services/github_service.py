import httpx
import asyncio
from typing import List, Optional, Tuple
from datetime import datetime, timezone
from app.models.schemas import Repository, Commit, PullRequest

# Simple in-memory cache
_cache: dict = {}
CACHE_TTL = 300  # 5 minutes


class GitHubService:
    BASE_URL = "https://api.github.com"

    def __init__(self, token: str):
        self.token = token
        self._user_login: Optional[str] = None
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                headers={
                    "Authorization": f"token {self.token}",
                    "Accept": "application/vnd.github.v3+json",
                },
                timeout=30.0,
            )
        return self._client

    async def _get_user_login(self) -> str:
        if self._user_login is None:
            client = await self._get_client()
            response = await client.get(f"{self.BASE_URL}/user")
            response.raise_for_status()
            self._user_login = response.json()["login"]
        return self._user_login

    async def _check_rate_limit(self):
        """Check rate limit and wait if necessary (async, capped at 60s)."""
        client = await self._get_client()
        response = await client.get(f"{self.BASE_URL}/rate_limit")
        if response.status_code == 200:
            data = response.json()
            remaining = data["resources"]["core"]["remaining"]
            reset_time = data["resources"]["core"]["reset"]
            if remaining < 10:
                wait_seconds = reset_time - datetime.now().timestamp()
                if wait_seconds > 0:
                    await asyncio.sleep(min(wait_seconds + 1, 60))

    async def get_repositories(self) -> List[Repository]:
        """Fetch all repositories with caching."""
        cache_key = f"repos:{self.token[:8]}"
        now = datetime.now().timestamp()

        if cache_key in _cache:
            cached_data, cached_time = _cache[cache_key]
            if now - cached_time < CACHE_TTL:
                return cached_data

        await self._check_rate_limit()
        client = await self._get_client()

        repos = []
        page = 1
        while True:
            response = await client.get(
                f"{self.BASE_URL}/user/repos",
                params={
                    "affiliation": "owner,collaborator,organization_member",
                    "visibility": "all",
                    "sort": "updated",
                    "direction": "desc",
                    "per_page": 100,
                    "page": page,
                },
            )
            response.raise_for_status()
            data = response.json()

            if not data:
                break

            for repo in data:
                repos.append(
                    Repository(
                        name=repo["name"],
                        full_name=repo["full_name"],
                        description=repo.get("description"),
                        language=repo.get("language"),
                        is_fork=repo.get("fork", False),
                        is_private=repo.get("private", False),
                        url=repo["html_url"],
                    )
                )
            page += 1

        _cache[cache_key] = (repos, now)
        return repos

    def _normalize_datetime(self, value: Optional[datetime]) -> Optional[datetime]:
        if value and value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value

    def _map_pull_request(self, pr: dict, include_labels: bool = True) -> PullRequest:
        labels = []
        if include_labels and pr.get("labels"):
            labels = [label["name"] for label in pr["labels"]]

        return PullRequest(
            number=pr["number"],
            title=pr["title"],
            body=pr.get("body"),
            state=pr["state"],
            labels=labels,
            created_at=datetime.fromisoformat(pr["created_at"].replace("Z", "+00:00")),
            merged_at=datetime.fromisoformat(pr["merged_at"].replace("Z", "+00:00")) if pr.get("merged_at") else None,
        )

    async def get_commits(
        self,
        repo_name: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> List[Commit]:
        """Fetch commits from a repository."""
        await self._check_rate_limit()
        client = await self._get_client()
        user_login = await self._get_user_login()

        start_date = self._normalize_datetime(start_date)
        end_date = self._normalize_datetime(end_date)

        params = {"author": user_login, "per_page": 100}
        if start_date:
            params["since"] = start_date.isoformat()
        if end_date:
            params["until"] = end_date.isoformat()

        commits = []
        page = 1
        while True:
            params["page"] = page
            response = await client.get(
                f"{self.BASE_URL}/repos/{repo_name}/commits",
                params=params,
            )
            response.raise_for_status()
            data = response.json()

            if not data:
                break

            for commit in data:
                commit_data = commit.get("commit", {})
                author_data = commit_data.get("author", {})
                commits.append(
                    Commit(
                        sha=commit["sha"],
                        message=commit_data.get("message", ""),
                        author=author_data.get("name", "Unknown"),
                        date=datetime.fromisoformat(
                            author_data.get("date", "").replace("Z", "+00:00")
                        ) if author_data.get("date") else datetime.now(timezone.utc),
                    )
                )
            page += 1

        return commits

    async def get_pull_requests(
        self,
        repo_name: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        include_labels: bool = True,
    ) -> List[PullRequest]:
        """Fetch pull requests for the authenticated user."""
        await self._check_rate_limit()
        client = await self._get_client()
        user_login = await self._get_user_login()

        start_date = self._normalize_datetime(start_date)
        end_date = self._normalize_datetime(end_date)

        prs = []
        page = 1
        while True:
            response = await client.get(
                f"{self.BASE_URL}/repos/{repo_name}/pulls",
                params={
                    "state": "all",
                    "sort": "created",
                    "direction": "desc",
                    "per_page": 100,
                    "page": page,
                },
            )
            response.raise_for_status()
            data = response.json()

            if not data:
                break

            for pr in data:
                if pr.get("user", {}).get("login") != user_login:
                    continue

                created_at = datetime.fromisoformat(pr["created_at"].replace("Z", "+00:00"))

                if end_date and created_at > end_date:
                    continue
                if start_date and created_at < start_date:
                    return prs

                prs.append(self._map_pull_request(pr, include_labels=include_labels))

            page += 1

        return prs

    async def get_paginated_pull_requests(
        self,
        repo_name: str,
        page_num: int = 0,
        per_page: int = 30,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Tuple[List[PullRequest], bool]:
        """Fetch a single page of pull requests for UI consumption."""
        await self._check_rate_limit()
        client = await self._get_client()
        user_login = await self._get_user_login()

        start_date = self._normalize_datetime(start_date)
        end_date = self._normalize_datetime(end_date)

        page_num = max(page_num, 0)
        per_page = max(1, min(per_page, 100))
        start_index = page_num * per_page

        buffer: List[PullRequest] = []
        filtered_index = 0
        api_page = 1

        while len(buffer) < per_page + 1:
            response = await client.get(
                f"{self.BASE_URL}/repos/{repo_name}/pulls",
                params={
                    "state": "all",
                    "sort": "created",
                    "direction": "desc",
                    "per_page": 100,
                    "page": api_page,
                },
            )
            response.raise_for_status()
            data = response.json()

            if not data:
                break

            for pr in data:
                if pr.get("user", {}).get("login") != user_login:
                    continue

                created_at = datetime.fromisoformat(pr["created_at"].replace("Z", "+00:00"))

                if end_date and created_at > end_date:
                    continue
                if start_date and created_at < start_date:
                    return buffer[:per_page], len(buffer) > per_page

                if filtered_index < start_index:
                    filtered_index += 1
                    continue

                buffer.append(self._map_pull_request(pr, include_labels=True))
                filtered_index += 1

                if len(buffer) >= per_page + 1:
                    break

            api_page += 1

        has_more = len(buffer) > per_page
        return buffer[:per_page], has_more

    async def close(self):
        """Close the HTTP client."""
        if self._client:
            await self._client.aclose()
            self._client = None
