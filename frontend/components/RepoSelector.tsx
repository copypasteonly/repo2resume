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
    <div className="space-y-1.5">
      <label className="text-sm font-medium">Repository</label>
      <Select value={selectedRepo} onValueChange={onRepoChange}>
        <SelectTrigger className="h-9">
          <SelectValue placeholder="Select a repository" />
        </SelectTrigger>
        <SelectContent>
          {repos.map((repo) => (
            <SelectItem key={repo.full_name} value={repo.full_name}>
              <span className="flex items-center gap-2">
                {repo.name}
                {repo.is_private && (
                  <span className="text-xs text-muted-foreground">Private</span>
                )}
                {repo.is_fork && (
                  <span className="text-xs text-muted-foreground">Fork</span>
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
