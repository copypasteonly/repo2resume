from openai import OpenAI, APIConnectionError, RateLimitError, AuthenticationError, BadRequestError, APIStatusError
from typing import List, Optional
from app.models.schemas import Commit, PullRequest


class LLMService:
    def __init__(self, api_key: str):
        self.client = OpenAI(
            api_key=api_key,
            max_retries=3,
            timeout=60.0
        )

    def generate_summary(
        self,
        repo_name: str,
        commits: List[Commit],
        pull_requests: List[PullRequest],
        prioritized_pr_numbers: Optional[List[int]] = None,
    ) -> str:
        """Generate a professional resume-ready summary of repository contributions."""

        # Separate prioritized and regular PRs
        prioritized_prs = []
        regular_prs = []

        if prioritized_pr_numbers:
            pr_numbers_set = set(prioritized_pr_numbers)
            for pr in pull_requests:
                if pr.number in pr_numbers_set:
                    prioritized_prs.append(pr)
                else:
                    regular_prs.append(pr)
        else:
            regular_prs = pull_requests

        # Prepare commits data
        commits_text = "\n".join(
            [f"- {commit.message} (by {commit.author})" for commit in commits[:100]]
        )

        # Prepare prioritized PRs data (show full details)
        prioritized_prs_text = ""
        if prioritized_prs:
            prioritized_prs_text = "\n\n**PRIORITY PULL REQUESTS** (MUST highlight these):\n" + "\n".join(
                [
                    f"- #{pr.number}: {pr.title} [{pr.state}] (Labels: {', '.join(pr.labels) if pr.labels else 'None'})\n  Description: {pr.body if pr.body else 'No description'}"
                    for pr in prioritized_prs
                ]
            )

        # Prepare regular PRs data
        regular_prs_text = "\n".join(
            [
                f"- #{pr.number}: {pr.title} [{pr.state}] (Labels: {', '.join(pr.labels) if pr.labels else 'None'})\n  {pr.body[:200] if pr.body else 'No description'}..."
                for pr in regular_prs[:50]
            ]
        )

        prs_text = prioritized_prs_text + "\n\nOther Pull Requests:\n" + regular_prs_text if prioritized_prs else regular_prs_text

        prompt = f"""You are a professional resume writer analyzing GitHub contributions for a repository.

Repository: {repo_name}

Commits ({len(commits)} total):
{commits_text}

Pull Requests ({len(pull_requests)} total):
{prs_text}

Generate a professional resume-ready summary using bullet points. Focus on the MOST SIGNIFICANT contributions:

**PRIORITIZATION RULES:**
1. **PRIORITY PULL REQUESTS marked above MUST be featured prominently** - dedicate at least one bullet point per priority PR
2. Highlight the largest/most complex pull requests first (after priority PRs)
3. Focus on technically challenging problems solved
4. Emphasize advanced technologies, frameworks, and architectural decisions
5. Group related smaller changes into meaningful accomplishments

**FORMAT:**
- Use bullet points (one per major accomplishment)
- Each bullet should be 3-4 sentences (detailed but concise)
- Write in first person ("Developed...", "Implemented...", "Architected...")
- Start with action verbs (Developed, Implemented, Architected, Optimized, Refactored, Built, Designed, etc.)
- Include specific technical details, technologies used, and the problem solved

**CONTENT FOCUS:**
- Major features and their technical complexity
- Complex bugs and the sophisticated solutions used
- Performance optimizations and their measurable impact
- Architecture improvements and design patterns
- Advanced technologies, frameworks, libraries, and tools used
- Scale and scope (if dealing with large datasets, high traffic, etc.)

**AVOID:**
- Trivial changes (typo fixes, minor formatting)
- Vague statements without technical detail
- Preambles or meta-commentary
- Grouping unrelated items together

Start directly with the bullet points. No introduction needed."""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a professional resume writer who creates compelling, achievement-focused summaries of technical work.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=1,
            )

            return response.choices[0].message.content.strip()
        except AuthenticationError:
            raise Exception("Invalid OpenAI API key. Please check your OPENAI_API_KEY.")
        except RateLimitError as e:
            raise Exception("OpenAI API rate limit exceeded. Please try again later.")
        except APIConnectionError as e:
            raise Exception("Failed to connect to OpenAI API. Please check your internet connection.")
        except BadRequestError as e:
            raise Exception(f"Invalid request to OpenAI API: {str(e)}")
        except APIStatusError as e:
            raise Exception(f"OpenAI API error ({e.status_code}): {str(e)}")
        except Exception as e:
            raise Exception(f"Failed to generate summary: {str(e)}")
