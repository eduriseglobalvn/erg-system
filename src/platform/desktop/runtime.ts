import { isTauriRuntime } from "@/lib/platform";
import type { Workspace } from "@/platform/workspaces/workspace-domain";

export const DESKTOP_WORKSPACES = ["TEACHER", "STUDENT"] as const;
export type DesktopWorkspace = (typeof DESKTOP_WORKSPACES)[number];
export type DesktopRuntime = "web" | "tauri";

export const DESKTOP_ALLOWED_ORIGINS = [
  "https://auth.erg.edu.vn",
  "https://api.erg.edu.vn",
  "https://lms.erg.edu.vn",
  "https://crm.erg.edu.vn",
  "http://127.0.0.1:3001",
  "http://localhost:3001",
] as const;

export type DesktopCapabilities = {
  runtime: DesktopRuntime;
  allowedWorkspaces: readonly DesktopWorkspace[];
  canOpenPortablePackages: boolean;
  canUseNativeCommands: boolean;
  canUseUpdater: boolean;
};

export function resolveDesktopRuntime(input: { tauriInternals?: boolean; protocol?: string }): DesktopRuntime {
  const protocol = input.protocol?.trim().toLowerCase();
  return input.tauriInternals === true || protocol === "tauri:" || protocol === "file:" ? "tauri" : "web";
}

export function getDesktopRuntime(): DesktopRuntime {
  if (typeof window === "undefined") return "web";
  return resolveDesktopRuntime({
    tauriInternals: isTauriRuntime(),
    protocol: window.location.protocol,
  });
}

export function getDesktopCapabilities(): DesktopCapabilities {
  const runtime = getDesktopRuntime();
  return {
    runtime,
    allowedWorkspaces: DESKTOP_WORKSPACES,
    // Portable package verification is pure Web Crypto and is shared by web,
    // PWA, and the Tauri webview. Native kiosk/update commands remain gated by
    // ERG-121/ERG-123 contracts.
    canOpenPortablePackages: true,
    // ERG-120 deliberately exposes no Rust command. ERG-121/122/123 add
    // narrowly scoped commands only after their contracts and threat model.
    canUseNativeCommands: false,
    // The updater bridge is available only inside the signed Tauri shell. The
    // web/PWA build intentionally stays on the manifest/download flow and
    // never attempts to import native updater APIs.
    canUseUpdater: runtime === "tauri",
  };
}

export function isDesktopWorkspace(workspace: Workspace): workspace is DesktopWorkspace {
  return DESKTOP_WORKSPACES.includes(workspace as DesktopWorkspace);
}

export function desktopWorkspaceFromPath(pathname: string): DesktopWorkspace | undefined {
  const segment = pathname.trim().toLowerCase().replace(/^\/+|\/+$/g, "").split("/")[0] ?? "";
  if (segment === "teacher") return "TEACHER";
  if (segment === "student") return "STUDENT";
  return undefined;
}

export function desktopPathFromLocation(location: Pick<Location, "pathname" | "hash">): string {
  const hashPath = location.hash.trim().replace(/^#/, "");
  if (hashPath.startsWith("/")) return hashPath.split(/[?#]/, 1)[0] || "/";
  return location.pathname || "/";
}

export function desktopWorkspaceFromLocation(location: Pick<Location, "pathname" | "hash">): DesktopWorkspace | undefined {
  return desktopWorkspaceFromPath(desktopPathFromLocation(location));
}

export function isAllowedDesktopOrigin(origin: string): boolean {
  const normalized = origin.trim().replace(/\/$/, "").toLowerCase();
  return DESKTOP_ALLOWED_ORIGINS.includes(normalized as (typeof DESKTOP_ALLOWED_ORIGINS)[number]);
}
