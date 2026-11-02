import Link from "next/link";

import { btnPrimary } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <p className="font-mono text-sm text-muted">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">That page does not exist</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
        The question or topic may have been renamed. Search with Ctrl K to find it.
      </p>
      <Link href="/" className={`${btnPrimary} mt-6`}>
        Back to the dashboard
      </Link>
    </div>
  );
}
