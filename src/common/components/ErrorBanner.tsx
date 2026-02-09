"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ErrorBannerProps {
  message: string;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
      <AlertTriangle className="size-4 text-amber-600 mt-0.5 shrink-0" />
      <p className="text-sm text-amber-800 flex-1">{message}</p>
      <button
        onClick={() => setIsDismissed(true)}
        className="text-amber-600 hover:text-amber-800 shrink-0 rounded-sm p-0.5 hover:bg-amber-100 transition-colors"
        aria-label="Dismiss"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
