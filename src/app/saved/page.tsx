import type { Metadata } from "next";

import { SavedView } from "@/components/saved-view";

export const metadata: Metadata = { title: "Saved" };

export default function SavedPage() {
  return <SavedView />;
}
