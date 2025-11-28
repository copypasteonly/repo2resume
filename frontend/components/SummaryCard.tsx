"use client"

import * as React from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SummaryCardProps {
  summary: string
  repoName: string
  commitsAnalyzed: number
  prsAnalyzed: number
}

export function SummaryCard({
  summary,
  repoName,
  commitsAnalyzed,
  prsAnalyzed,
}: SummaryCardProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <h3 className="font-medium truncate">{repoName}</h3>
          <p className="text-xs text-muted-foreground">
            {commitsAnalyzed} commits, {prsAnalyzed} PRs analyzed
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          className="shrink-0 h-8 w-8"
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      <div className="text-sm leading-relaxed whitespace-pre-wrap">
        {summary}
      </div>
    </div>
  )
}
