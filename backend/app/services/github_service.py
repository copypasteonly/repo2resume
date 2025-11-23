from github import Github, GithubException, BadCredentialsException, UnknownObjectException, RateLimitExceededException
from typing import Generator, List, Optional, Tuple
from datetime import datetime, timezone
from app.models.schemas import Repository, Commit, PullRequest
import time


class GitHubService:
    def __init__(self, token: str):
        try:
            self.client = Github(token)
            self.user = self.client.get_user()
        except BadCredentialsException:
            raise Exception("Invalid GitHub token. Please check your GITHUB_TOKEN.")
        except GithubException as e:
            raise Exception(f"Failed to authenticate with GitHub: {str(e)}")

    def _check_rate_limit(self):
        """Check rate limit and wait if necessary."""
        remaining, limit = self.client.rate_limiting
        if remaining < 10:
            reset_time = datetime.fromtimestamp(self.client.rate_limiting_resettime)
            wait_seconds = (reset_time - datetime.now()).total_seconds()
            if wait_seconds > 0:
                time.sleep(wait_seconds + 1)

    def get_repositories(self) -> List[Repository]:
        """Fetch all repositories the user has access to (owned, collaborator, and org repos)."""
        repos = []
        try:
            self._check_rate_limit()
            # Fetch all repos with all affiliations and both public/private visibility
            # This ensures we get: owned repos, repos where user is a collaborator, and org repos
            for repo in self.user.get_repos(
                affiliation="owner,collaborator,organization_member",
                visibility="all",
                sort="updated",
                direction="desc"
            ):
                repos.append(
                    Repository(
                        name=repo.name,
                        full_name=repo.full_name,
                        description=repo.description,
                        language=repo.language,
                        is_fork=repo.fork,
                        is_private=repo.private,
                        url=repo.html_url,
                    )
                )
            return repos
        except RateLimitExceededException:
            raise Exception("GitHub API rate limit exceeded. Please try again later.")
        except BadCredentialsException:
            raise Exception("Invalid GitHub token.")
        except GithubException as e:
            raise Exception(f"Failed to fetch repositories: {str(e)}")

    def _normalize_datetime(self, value: Optional[datetime]) -> Optional[datetime]:
        """Ensure datetime is timezone-aware for GitHub comparisons."""
        if value and value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value

    def _map_pull_request(self, pr) -> PullRequest:
        labels = [label.name for label in pr.labels]
        return PullRequest(
            number=pr.number,
            title=pr.title,
            body=pr.body,
            state=pr.state,
            labels=labels,
            created_at=pr.created_at,
            merged_at=pr.merged_at,
        )

    def _iter_filtered_pull_requests(
        self,
        repo,
        start_date: Optional[datetime],
        end_date: Optional[datetime],
    ) -> Generator:
        """Yield authenticated user's PRs filtered by optional date range."""
        paginated_prs = repo.get_pulls(state="all", sort="created", direction="desc")
        page_index = 0
        while True:
            page = paginated_prs.get_page(page_index)
            if not page:
                break
            page_index += 1

            for pr in page:
                if pr.user.login != self.user.login:
                    continue
                if end_date and pr.created_at > end_date:
                    continue
                if start_date and pr.created_at < start_date:
                    return
                yield pr

    def get_commits(
        self,
        repo_name: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> List[Commit]:
        """Fetch commits from a repository, optionally filtered by date range and authored by the authenticated user."""
        try:
            self._check_rate_limit()
            repo = self.client.get_repo(repo_name)
            commits = []

            kwargs = {}
            start_date = self._normalize_datetime(start_date)
            end_date = self._normalize_datetime(end_date)

            if start_date:
                kwargs["since"] = start_date
            if end_date:
                kwargs["until"] = end_date

            # Filter by authenticated user
            kwargs["author"] = self.user.login

            for commit in repo.get_commits(**kwargs):
                commits.append(
                    Commit(
                        sha=commit.sha,
                        message=commit.commit.message,
                        author=commit.commit.author.name,
                        date=commit.commit.author.date,
                    )
                )

            return commits
        except UnknownObjectException:
            raise Exception(f"Repository '{repo_name}' not found or you don't have access.")
        except RateLimitExceededException:
            raise Exception("GitHub API rate limit exceeded. Please try again later.")
        except GithubException as e:
            raise Exception(f"Failed to fetch commits: {str(e)}")

    def get_pull_requests(
        self,
        repo_name: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> List[PullRequest]:
        """Fetch all pull requests for the authenticated user, optionally filtered by date."""
        try:
            self._check_rate_limit()
            repo = self.client.get_repo(repo_name)
            start_date = self._normalize_datetime(start_date)
            end_date = self._normalize_datetime(end_date)

            prs = [
                self._map_pull_request(pr)
                for pr in self._iter_filtered_pull_requests(repo, start_date, end_date)
            ]
            return prs
        except UnknownObjectException:
            raise Exception(f"Repository '{repo_name}' not found or you don't have access.")
        except RateLimitExceededException:
            raise Exception("GitHub API rate limit exceeded. Please try again later.")
        except GithubException as e:
            raise Exception(f"Failed to fetch pull requests: {str(e)}")

    def get_paginated_pull_requests(
        self,
        repo_name: str,
        page_num: int = 0,
        per_page: int = 30,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Tuple[List[PullRequest], bool]:
        """Fetch a single page of pull requests for UI consumption."""
        try:
            self._check_rate_limit()
            repo = self.client.get_repo(repo_name)
            start_date = self._normalize_datetime(start_date)
            end_date = self._normalize_datetime(end_date)

            page_num = max(page_num, 0)
            per_page = max(1, min(per_page, 100))
            start_index = page_num * per_page

            buffer: List[PullRequest] = []
            filtered_index = 0

            iterator = self._iter_filtered_pull_requests(repo, start_date, end_date)
            for pr in iterator:
                if filtered_index < start_index:
                    filtered_index += 1
                    continue

                buffer.append(self._map_pull_request(pr))
                filtered_index += 1

                if len(buffer) >= per_page + 1:
                    break

            has_more = len(buffer) > per_page
            return buffer[:per_page], has_more
        except UnknownObjectException:
            raise Exception(f"Repository '{repo_name}' not found or you don't have access.")
        except RateLimitExceededException:
            raise Exception("GitHub API rate limit exceeded. Please try again later.")
        except GithubException as e:
            raise Exception(f"Failed to fetch pull requests: {str(e)}")
