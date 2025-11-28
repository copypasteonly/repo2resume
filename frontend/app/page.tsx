"use client"

import * as React from "react"
import { Loader2, Github, ChevronDown, RotateCcw } from "lucide-react"
import { DateRange } from "react-day-picker"
import { RepoSelector } from "@/components/RepoSelector"
import { DateRangeSelector } from "@/components/DateRangeSelector"
import { SummaryCard } from "@/components/SummaryCard"
import { PriorityPRSelector } from "@/components/PriorityPRSelector"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

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
  custom_prompt?: string
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
  const [customPrompt, setCustomPrompt] = React.useState<string>("")
  const [defaultPrompt, setDefaultPrompt] = React.useState<string>("")
  const [isPromptOpen, setIsPromptOpen] = React.useState(false)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  React.useEffect(() => {
    fetchRepositories()
    fetchDefaultPrompt()
  }, [])

  const fetchDefaultPrompt = async () => {
    try {
      const response = await fetch(`${API_URL}/api/default-prompt`)
      if (response.ok) {
        const data = await response.json()
        setDefaultPrompt(data.prompt)
      }
    } catch {
      // Silently fail - default prompt is optional
    }
  }

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

      if (customPrompt.trim()) {
        body.custom_prompt = customPrompt.trim()
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
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg space-y-6">
        {/* Header */}
        <header className="text-center space-y-2">
          <div className="inline-flex items-center gap-2">
            <Github className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-semibold text-foreground">
              Repo2Resume
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Turn your GitHub contributions into resume-ready summaries
          </p>
        </header>

        {/* Error */}
        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Main Form */}
        {fetchingRepos ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading repositories...
            </span>
          </div>
        ) : (
          <div className="space-y-4">
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

            <Collapsible open={isPromptOpen} onOpenChange={setIsPromptOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between h-9 px-3 text-sm text-muted-foreground hover:text-foreground">
                  Custom Prompt
                  <ChevronDown className={`h-4 w-4 transition-transform ${isPromptOpen ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2 space-y-2">
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder={defaultPrompt || "Enter custom instructions for generating your summary..."}
                  className="w-full h-32 px-3 py-2 text-sm bg-muted/50 border border-border rounded-md resize-y focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCustomPrompt(defaultPrompt)}
                    disabled={!defaultPrompt}
                    className="text-xs"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Use Default
                  </Button>
                  {customPrompt && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setCustomPrompt("")}
                      className="text-xs text-muted-foreground"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Button
              onClick={generateSummary}
              disabled={!selectedRepo || loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Summary"
              )}
            </Button>
          </div>
        )}

        {/* Result */}
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
