"use client"

import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getApiErrorMessage } from "@/lib/api-fetch"

interface QueryErrorStateProps {
  title?: string
  error: unknown
  onRetry?: () => void
}

export function QueryErrorState({
  title = "Unable to load data",
  error,
  onRetry,
}: QueryErrorStateProps) {
  return (
    <div className="flex min-h-60 flex-col items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 px-6 py-10 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
        <AlertTriangle className="h-6 w-6 text-red-400" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {getApiErrorMessage(error)}
      </p>
      {onRetry ? (
        <Button variant="outline" className="mt-6" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
      ) : null}
    </div>
  )
}
