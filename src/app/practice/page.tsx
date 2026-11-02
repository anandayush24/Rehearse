import type { Metadata } from "next";
import { Suspense } from "react";

import { PracticeApp } from "@/components/practice-app";
import { Skeleton } from "@/components/ui";

export const metadata: Metadata = { title: "Practice" };

export default function PracticePage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <PracticeApp />
    </Suspense>
  );
}
