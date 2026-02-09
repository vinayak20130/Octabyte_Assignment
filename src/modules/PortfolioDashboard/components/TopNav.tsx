"use client";

import { Button } from "@/components/ui/button";
import { Briefcase, Activity, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ago`;
}

interface TopNavProps {
  lastFetchTime: Date | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export function TopNav({
  lastFetchTime,
  isLoading,
  onRefresh,
}: TopNavProps) {
  const statusText = lastFetchTime ? `Last updated: ${timeAgo(lastFetchTime)}` : "";

  return (
    <nav className="bg-white border-b px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-900">
            <Briefcase className="size-4 text-white" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-gray-900">
            Portfolio Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Activity className="size-3.5 text-green-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">{statusText}</span>
          <Button
            variant="ghost"
            size="xs"
            onClick={onRefresh}
            className="text-muted-foreground"
          >
            <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>
    </nav>
  );
}
