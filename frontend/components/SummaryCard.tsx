"use client"

import * as React from "react"
import { Copy, Check } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-primary">Repository Summary</CardTitle>
            <CardDescription className="mt-2">
              {repoName} • {commitsAnalyzed} commits • {prsAnalyzed} pull requests
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
            className="shrink-0"
          >
            {copied ? (
              <Check className="h-4 w-4 text-secondary" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose prose-invert max-w-none">
          <p className="whitespace-pre-wrap text-foreground leading-relaxed">
            {summary}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
