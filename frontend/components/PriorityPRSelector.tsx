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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

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
          className="w-full"
          type="button"
        >
          <ListChecks className="mr-2 h-4 w-4" />
          Prioritize Specific PRs
          {selectedPRs.length > 0 && (
            <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {selectedPRs.length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Select Priority Pull Requests</DialogTitle>
          <DialogDescription>
            Choose the PRs you want to highlight in your resume summary. Selected
            PRs will be given more weight and detail in the generated summary.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto space-y-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">
                Loading pull requests...
              </span>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          ) : prs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No pull requests found for this repository.
            </div>
          ) : (
            <Accordion type="multiple" className="space-y-2">
              {prs.map((pr) => (
                <AccordionItem
                  key={pr.number}
                  value={`pr-${pr.number}`}
                  className={`rounded-lg border transition-colors ${
                    tempSelected.includes(pr.number)
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-start space-x-3 p-4">
                    <Checkbox
                      id={`pr-${pr.number}`}
                      checked={tempSelected.includes(pr.number)}
                      onCheckedChange={() => handleToggle(pr.number)}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <label
                          htmlFor={`pr-${pr.number}`}
                          className="cursor-pointer flex-1"
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-sm text-muted-foreground">
                              #{pr.number}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${
                                pr.state === "open"
                                  ? "bg-green-500/20 text-green-700 dark:text-green-400"
                                  : pr.merged_at
                                  ? "bg-purple-500/20 text-purple-700 dark:text-purple-400"
                                  : "bg-red-500/20 text-red-700 dark:text-red-400"
                              }`}
                            >
                              {pr.state === "open"
                                ? "Open"
                                : pr.merged_at
                                ? "Merged"
                                : "Closed"}
                            </span>
                            {pr.labels.length > 0 && (
                              <div className="flex gap-1">
                                {pr.labels.slice(0, 3).map((label) => (
                                  <span
                                    key={label}
                                    className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground"
                                  >
                                    {label}
                                  </span>
                                ))}
                                {pr.labels.length > 3 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{pr.labels.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <h3 className="font-medium text-foreground mt-2">
                            {pr.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            Created {format(new Date(pr.created_at), "MMM d, yyyy")}
                          </p>
                        </label>
                        {pr.body && (
                          <AccordionTrigger className="hover:no-underline py-0 h-6" />
                        )}
                      </div>
                      {pr.body && (
                        <AccordionContent className="pb-0">
                          <div className="mt-2 pt-2 border-t border-border">
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {pr.body}
                            </p>
                          </div>
                        </AccordionContent>
                      )}
                    </div>
                  </div>
                </AccordionItem>
              ))}
            </Accordion>
          )}
          {!loading && !error && prs.length > 0 && hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loadingMore}
                type="button"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading more...
                  </>
                ) : (
                  `Load more PRs`
                )}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} type="button">
            Cancel
          </Button>
          <Button onClick={handleSave} type="button">
            Save Selection ({tempSelected.length} selected)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
