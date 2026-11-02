import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import { AppShell } from "@/components/app-shell";
import { NavProvider } from "@/components/nav-provider";
import { getManifest } from "@/lib/data";
import { buildNav } from "@/lib/nav";
import { STORAGE_KEY } from "@/lib/storage-key";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: { default: "Rehearse", template: "%s · Rehearse" },
  description: "Senior engineering interview prep: questions, model answers and spaced repetition.",
  applicationName: "Rehearse",
  manifest: `${BASE}/manifest.webmanifest`,
  icons: { icon: `${BASE}/icon.svg`, apple: `${BASE}/icons/icon-192.png` },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1014" },
  ],
};

/** Runs before first paint so the saved theme and text size apply without a flash. */
const THEME_SCRIPT = `(function(){var d=document.documentElement;try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(
  STORAGE_KEY,
)})||"null");var st=s&&s.state&&s.state.settings||{};var t=st.theme||"system";if(t==="system")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";d.dataset.theme=t;d.dataset.font=String(st.fontScale==null?1:st.fontScale)}catch(e){d.dataset.theme="light"}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  const nav = buildNav(getManifest());
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrains.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <NavProvider nav={nav}>
          <AppShell>{children}</AppShell>
        </NavProvider>
      </body>
    </html>
  );
}
