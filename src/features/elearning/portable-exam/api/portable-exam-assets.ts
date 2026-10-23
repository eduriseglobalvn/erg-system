import type { PortableExamAsset } from "@/features/elearning/portable-exam/types/portable-exam-types";

export function resolvePortableAssetReferences<T>(value: T, manifest: unknown): T {
  const assets = portableAssetsById(manifest);
  return resolveValue(value, assets) as T;
}

export function portableAssetsById(manifest: unknown): ReadonlyMap<string, PortableExamAsset> {
  const assets = new Map<string, PortableExamAsset>();
  if (!isRecord(manifest)) return assets;

  const nestedAssets = Array.isArray(manifest.assets) ? manifest.assets : [];
  for (const item of nestedAssets) {
    if (!isRecord(item)) continue;
    const id = stringValue(item.id ?? item.assetId ?? item.mediaId);
    if (id) assets.set(id, item);
  }

  for (const [id, value] of Object.entries(manifest)) {
    if (id === "assets" || !isRecord(value)) continue;
    assets.set(id, value);
  }
  return assets;
}

export function portableAssetReferenceIds(value: unknown): string[] {
  const ids = new Set<string>();
  visitStrings(value, (item) => {
    const id = assetIdFromUrl(item);
    if (id) ids.add(id);
  });
  return [...ids].sort();
}

function resolveValue(value: unknown, assets: ReadonlyMap<string, PortableExamAsset>): unknown {
  if (typeof value === "string") {
    const id = assetIdFromUrl(value);
    if (!id) return value;
    const asset = assets.get(id);
    if (!asset) return value;
    if (asset.contentBase64) return `data:${asset.mimeType || "application/octet-stream"};base64,${asset.contentBase64}`;
    return asset.url || value;
  }
  if (Array.isArray(value)) return value.map((item) => resolveValue(item, assets));
  if (!isRecord(value)) return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolveValue(item, assets)]));
}

function assetIdFromUrl(value: string) {
  const match = /^asset:\/\/([^/?#]+)$/i.exec(value.trim());
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

function visitStrings(value: unknown, visitor: (value: string) => void): void {
  if (typeof value === "string") {
    visitor(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => visitStrings(item, visitor));
    return;
  }
  if (isRecord(value)) Object.values(value).forEach((item) => visitStrings(item, visitor));
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
