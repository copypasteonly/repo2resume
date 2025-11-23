"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Repository {
  name: string
  full_name: string
  description: string | null
  language: string | null
  is_fork: boolean
  is_private: boolean
  url: string
}

interface RepoSelectorProps {
  repos: Repository[]
  selectedRepo: string
  onRepoChange: (repoName: string) => void
}

export function RepoSelector({
  repos,
  selectedRepo,
  onRepoChange,
}: RepoSelectorProps) {
  return (
    <div className="w-full space-y-2">
      <label className="text-sm font-medium text-foreground">
        Select Repository
      </label>
      <Select value={selectedRepo} onValueChange={onRepoChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Choose a repository..." />
        </SelectTrigger>
        <SelectContent>
          {repos.map((repo) => (
            <SelectItem key={repo.full_name} value={repo.full_name}>
              <div className="flex items-center gap-2">
                <span>{repo.name}</span>
                {repo.is_private && (
                  <span className="text-xs text-muted-foreground">(Private)</span>
                )}
                {repo.is_fork && (
                  <span className="text-xs text-muted-foreground">(Fork)</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
