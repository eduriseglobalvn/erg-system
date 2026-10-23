import {
  DEFAULT_DESKTOP_RELEASE_MANIFEST_BYTES,
  DEFAULT_DESKTOP_RELEASE_ORIGINS,
  parseDesktopReleaseManifest,
} from "@/features/desktop-release/api/desktop-release-manifest";
import type { DesktopReleaseManifest } from "@/features/desktop-release/types/desktop-release-types";

export const DEFAULT_DESKTOP_RELEASE_MANIFEST_URL =
  "https://releases.erg.edu.vn/desktop/stable/latest.json";

export function getDesktopReleaseManifestUrl() {
  const configured = import.meta.env?.VITE_DESKTOP_RELEASE_MANIFEST_URL?.trim();
  const raw = configured || DEFAULT_DESKTOP_RELEASE_MANIFEST_URL;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Desktop release manifest URL is invalid.");
  }
  const allowedOrigins = configuredOrigins();
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !allowedOrigins.includes(url.origin.toLowerCase())
  ) {
    throw new Error("Desktop release manifest URL must use an approved HTTPS origin.");
  }
  return url.toString();
}

export async function loadDesktopReleaseManifest(
  fetchImpl: typeof fetch = fetch,
): Promise<DesktopReleaseManifest> {
  const url = getDesktopReleaseManifestUrl();
  const response = await fetchImpl(url, {
    cache: "no-store",
    credentials: "omit",
    headers: { Accept: "application/json" },
    redirect: "error",
  });
  if (!response.ok) throw new Error(`Desktop release manifest request failed (${response.status}).`);
  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > DEFAULT_DESKTOP_RELEASE_MANIFEST_BYTES) {
    throw new Error("Desktop release manifest is too large.");
  }
  const body = await response.text();
  if (new TextEncoder().encode(body).byteLength > DEFAULT_DESKTOP_RELEASE_MANIFEST_BYTES) {
    throw new Error("Desktop release manifest is too large.");
  }
  try {
    return parseDesktopReleaseManifest(JSON.parse(body));
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("Desktop release manifest is invalid.");
  }
}

function configuredOrigins() {
  const configured = import.meta.env?.VITE_DESKTOP_RELEASE_ORIGINS?.trim();
  if (!configured) return DEFAULT_DESKTOP_RELEASE_ORIGINS.map((origin) => origin.toLowerCase());
  const origins = configured
    .split(",")
    .map((origin: string) => origin.trim().replace(/\/$/, "").toLowerCase())
    .filter(Boolean);
  return origins.length ? origins : DEFAULT_DESKTOP_RELEASE_ORIGINS.map((origin) => origin.toLowerCase());
}
