"use client"

import * as React from "react"
import { Loader2, Github } from "lucide-react"
import { DateRange } from "react-day-picker"
import { RepoSelector } from "@/components/RepoSelector"
import { DateRangeSelector } from "@/components/DateRangeSelector"
import { SummaryCard } from "@/components/SummaryCard"
import { PriorityPRSelector } from "@/components/PriorityPRSelector"
import { Button } from "@/components/ui/button"

interface Repository {
  name: string
  full_name: string
  description: string | null
  language: string | null
  is_fork: boolean
  is_private: boolean
  url: string
}

interface SummaryResponse {
  summary: string
  repo_name: string
  commits_analyzed: number
  prs_analyzed: number
}

interface GenerateSummaryRequest {
  repo_name: string
  start_date?: string
  end_date?: string
  prioritized_pr_numbers?: number[]
}

export default function Home() {
  const [repos, setRepos] = React.useState<Repository[]>([])
  const [selectedRepo, setSelectedRepo] = React.useState<string>("")
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>()
  const [prioritizedPRs, setPrioritizedPRs] = React.useState<number[]>([])
  const [summary, setSummary] = React.useState<SummaryResponse | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [fetchingRepos, setFetchingRepos] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  React.useEffect(() => {
    fetchRepositories()
  }, [])

  const fetchRepositories = async () => {
    setFetchingRepos(true)
    setError(null)
    try {
      const response = await fetch(`${API_URL}/api/repos`)
      if (!response.ok) {
        throw new Error("Failed to fetch repositories")
      }
      const data = await response.json()
      setRepos(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setFetchingRepos(false)
    }
  }

  const generateSummary = async () => {
    if (!selectedRepo) return

    setLoading(true)
    setError(null)
    setSummary(null)

    try {
      const body: GenerateSummaryRequest = {
        repo_name: selectedRepo,
      }

      if (dateRange?.from) {
        body.start_date = dateRange.from.toISOString()
      }
      if (dateRange?.to) {
        body.end_date = dateRange.to.toISOString()
      }

      if (prioritizedPRs.length > 0) {
        body.prioritized_pr_numbers = prioritizedPRs
      }

      const response = await fetch(`${API_URL}/api/generate-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to generate summary")
      }

      const data: SummaryResponse = await response.json()
      setSummary(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-4 text-center">
          <div className="flex items-center justify-center gap-3">
            <Github className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Repo2Resume
            </h1>
          </div>
          <p className="text-muted-foreground">
            Generate professional resume summaries from your GitHub contributions
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {fetchingRepos ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">
              Loading repositories...
            </span>
          </div>
        ) : (
          <div className="space-y-6 rounded-lg border bg-card p-6 shadow-sm">
            <RepoSelector
              repos={repos}
              selectedRepo={selectedRepo}
              onRepoChange={setSelectedRepo}
            />

            <DateRangeSelector
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />

            <PriorityPRSelector
              repoName={selectedRepo}
              selectedPRs={prioritizedPRs}
              onPRsChange={setPrioritizedPRs}
              apiUrl={API_URL}
            />

            <Button
              onClick={generateSummary}
              disabled={!selectedRepo || loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Summary...
                </>
              ) : (
                "Generate Summary"
              )}
            </Button>
          </div>
        )}

        {summary && (
          <SummaryCard
            summary={summary.summary}
            repoName={summary.repo_name}
            commitsAnalyzed={summary.commits_analyzed}
            prsAnalyzed={summary.prs_analyzed}
          />
        )}
      </div>
    </main>
  )
}
