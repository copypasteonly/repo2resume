"use client"

import * as React from "react"
import { format } from "date-fns"
import { Loader2, ListChecks } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"

interface PullRequest {
  number: number
  title: string
  body: string | null
  state: string
  labels: string[]
  created_at: string
  merged_at: string | null
}

interface PaginatedPullRequestResponse {
  items: PullRequest[]
  page: number
  per_page: number
  has_more: boolean
}

const PRS_PER_PAGE = 20

interface PriorityPRSelectorProps {
  repoName: string
  selectedPRs: number[]
  onPRsChange: (prNumbers: number[]) => void
  apiUrl: string
}

export function PriorityPRSelector({
  repoName,
  selectedPRs,
  onPRsChange,
  apiUrl,
}: PriorityPRSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [prs, setPrs] = React.useState<PullRequest[]>([])
  const [loading, setLoading] = React.useState(false)
  const [loadingMore, setLoadingMore] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [tempSelected, setTempSelected] = React.useState<number[]>(selectedPRs)
  const [currentPage, setCurrentPage] = React.useState(0)
  const [hasMore, setHasMore] = React.useState(true)

  const fetchPRs = async (page: number = 0, append: boolean = false) => {
    if (!repoName) return

    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
      setPrs([])
      setCurrentPage(0)
      setHasMore(true)
    }

    setError(null)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: PRS_PER_PAGE.toString(),
      })
      const response = await fetch(
        `${apiUrl}/api/repos/${encodeURIComponent(repoName)}/pull-requests?${params.toString()}`
      )
      if (!response.ok) {
        throw new Error("Failed to fetch pull requests")
      }
      const data: PaginatedPullRequestResponse | PullRequest[] = await response.json()
      const items: PullRequest[] = Array.isArray(data) ? data : data.items ?? []
      const nextHasMore = Array.isArray(data)
        ? data.length === PRS_PER_PAGE
        : data.has_more
      const nextPage = Array.isArray(data) ? page : data.page

      if (append) {
        setPrs((prev) => [...prev, ...items])
      } else {
        setPrs(items)
      }

      setHasMore(nextHasMore)
      setCurrentPage(nextPage)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      if (append) {
        setLoadingMore(false)
      } else {
        setLoading(false)
      }
    }
  }

  const loadMore = () => {
    if (!hasMore) return
    fetchPRs(currentPage + 1, true)
  }

  React.useEffect(() => {
    if (open && repoName) {
      fetchPRs()
      setTempSelected(selectedPRs)
    }
  }, [open, repoName])

  const handleToggle = (prNumber: number) => {
    setTempSelected((prev) =>
      prev.includes(prNumber)
        ? prev.filter((n) => n !== prNumber)
        : [...prev, prNumber]
    )
  }

  const handleSave = () => {
    onPRsChange(tempSelected)
    setOpen(false)
  }

  const handleCancel = () => {
    setTempSelected(selectedPRs)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          disabled={!repoName}
          className="w-full h-9 justify-start"
          type="button"
        >
          <ListChecks className="mr-2 h-4 w-4" />
          <span className="flex-1 text-left">
            {selectedPRs.length > 0
              ? `${selectedPRs.length} PR${selectedPRs.length > 1 ? "s" : ""} selected`
              : "Select priority PRs"}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Priority Pull Requests</DialogTitle>
          <DialogDescription>
            Select PRs to highlight in your summary.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[50vh] overflow-y-auto space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : error ? (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          ) : prs.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No pull requests found.
            </div>
          ) : (
            <div className="space-y-1">
              {prs.map((pr) => (
                <label
                  key={pr.number}
                  htmlFor={`pr-${pr.number}`}
                  className={`flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-colors hover:bg-accent/50 ${
                    tempSelected.includes(pr.number)
                      ? "border-primary/50 bg-accent/30"
                      : "border-border"
                  }`}
                >
                  <Checkbox
                    id={`pr-${pr.number}`}
                    checked={tempSelected.includes(pr.number)}
                    onCheckedChange={() => handleToggle(pr.number)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>#{pr.number}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          pr.state === "open"
                            ? "bg-green-500/20 text-green-400"
                            : pr.merged_at
                            ? "bg-purple-500/20 text-purple-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {pr.state === "open" ? "Open" : pr.merged_at ? "Merged" : "Closed"}
                      </span>
                      <span>{format(new Date(pr.created_at), "MMM d, yyyy")}</span>
                    </div>
                    <p className="text-sm font-medium leading-tight truncate">
                      {pr.title}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
          {!loading && !error && prs.length > 0 && hasMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full"
              type="button"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load more"
              )}
            </Button>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" size="sm" onClick={handleCancel} type="button">
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} type="button">
            Done{tempSelected.length > 0 && ` (${tempSelected.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
