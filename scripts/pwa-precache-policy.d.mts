export type PwaManifestEntry = {
  url: string;
  revision: string | null;
  size: number;
};

export function extractShellAssetUrls(indexHtml: string): Set<string>;
export function filterPwaPrecacheManifest(
  entries: PwaManifestEntry[],
  indexHtmlPath: string,
): Promise<{ manifest: PwaManifestEntry[]; warnings: string[] }>;
