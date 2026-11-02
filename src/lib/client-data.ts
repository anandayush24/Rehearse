"use client";

import { useEffect, useState } from "react";

import type { Manifest, SearchDoc, TopicData } from "@/content/types";

/** Runtime loaders for the static JSON in /data. Each URL is fetched once per page load. */

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const cache = new Map<string, Promise<unknown>>();

function getJson<T>(url: string): Promise<T> {
  let promise = cache.get(url);
  if (!promise) {
    promise = fetch(BASE + url).then((res) => {
      if (!res.ok) throw new Error(`Could not load ${url} (${res.status})`);
      return res.json();
    });
    promise.catch(() => cache.delete(url)); // allow a retry after a failure
    cache.set(url, promise);
  }
  return promise as Promise<T>;
}

export const loadManifest = () => getJson<Manifest>("/data/manifest.json");
export const loadTopic = (id: string) => getJson<TopicData>(`/data/topics/${id}.json`);
export const loadSearchDocs = () => getJson<SearchDoc[]>("/data/search.json");

interface Remote<T> {
  data?: T;
  error?: Error;
}

/** Loads JSON on the client. Returns `{}` until the data (or an error) for `url` is ready. */
export function useRemote<T>(url: string | null): Remote<T> {
  const [result, setResult] = useState<Remote<T> & { url: string | null }>({ url: null });
  useEffect(() => {
    if (!url) return;
    let live = true;
    getJson<T>(url).then(
      (data) => live && setResult({ url, data }),
      (error: Error) => live && setResult({ url, error }),
    );
    return () => {
      live = false;
    };
  }, [url]);
  return result.url === url ? result : {};
}

export const useManifest = () => useRemote<Manifest>("/data/manifest.json");
