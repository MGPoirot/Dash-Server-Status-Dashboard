// src/methods/fetch.ts
import { MetricConfig } from "../types/metric";
import { SeriesNode } from "../types/nodes";

export async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, {
    signal,
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }

  return (await res.json()) as T;
}

export function fetchConfig(metricId: string, signal?: AbortSignal) {
  return fetchJson<MetricConfig>(
    `/configs/${encodeURIComponent(metricId)}.json`,
    signal
  );
}

export function fetchSeries(metricId: string, signal?: AbortSignal) {
  return fetchJson<SeriesNode>(
    `/series/${encodeURIComponent(metricId)}.json`,
    signal
  );
}

export function fetchLatest(metricId: string, signal?: AbortSignal) {
  return fetchJson<SeriesNode>(
    `/latest/${encodeURIComponent(metricId)}.json`,
    signal
  );
}