"use client";

import { btn } from "@/components/ui";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="py-24 text-center" role="alert">
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        {error.message || "An unexpected error occurred."} Your progress is saved in this browser and is not
        affected.
      </p>
      <button type="button" onClick={reset} className={`${btn} mt-6`}>
        Try again
      </button>
    </div>
  );
}
