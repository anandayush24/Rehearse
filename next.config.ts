import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static: deploys to any file host and works offline once cached by the service worker.
  output: "export",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH, // set to /Rehearse for GitHub Pages
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
