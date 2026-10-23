import { lcmsWorkspacePaths, lmsPaths } from "@/app/portal-route-registry";
import { canonicalAdminWorkspacePath } from "@/features/lcms/admin-content/admin-content-route";
import { teacherPath } from "@/platform/workspaces/workspace-paths";
import type { LegacyPortal } from "@/platform/workspaces/legacy-portal-compat";

export type LegacyRouteRedirect = { target: "lms" | "crm"; path?: string };

/** Public migration deadline used by dashboards/telemetry to track alias removal. */
export const LEGACY_ALIAS_SUNSET_DATE = "2026-12-31";

export function resolveLegacyRouteRedirect(rawPath: string, activePortal: LegacyPortal | null = "lms"): LegacyRouteRedirect | undefined {
  const path = normalizePath(rawPath);
  if (!path) return undefined;

  if (path === "crm" || path.startsWith("crm/")) {
    return { target: "crm", path: suffixPath("/", path.slice("crm".length)) };
  }

  if (path === "admin" || path.startsWith("admin/")) {
    return { target: "lms", path: suffixPath("/admin", path.slice("admin".length)) };
  }

  if (path === "lcms" || path.startsWith("lcms/")) {
    return { target: "lms", path: suffixPath("/admin", path.slice("lcms".length)) };
  }

  if (path === "dashboard" || path.startsWith("dashboard/")) {
    return { target: "lms", path: suffixPath("/teacher", path.slice("dashboard".length)) };
  }

  if (path === "student" || path.startsWith("student/")) {
    return { target: "lms", path: suffixPath("/student", path.slice("student".length)) };
  }

  if (path === "elearning" || path.startsWith("elearning/")) {
    return { target: "lms", path: suffixPath("/student", path.slice("elearning".length)) };
  }

  if (path === "learner" || path.startsWith("learner/")) {
    return { target: "lms", path: suffixPath("/student", path.slice("learner".length)) };
  }

  const adminOnly = new Set<string>(lcmsWorkspacePaths.filter((segment) => !lmsPaths.includes(segment as (typeof lmsPaths)[number])));
  if (adminOnly.has(path) || (activePortal === "lcms" && ["resources", "questions", "quiz-bank", "quiz-editor"].includes(path))) {
    return { target: "lms", path: canonicalAdminWorkspacePath(`/${path}`) };
  }

  if ([...lmsPaths, "resources", "homework/class", "classes", "profile"].includes(path)) {
    return { target: "lms", path: teacherPath(`/${path}`) };
  }

  if (path === "kho-hoc-lieu" || path.startsWith("kho-hoc-lieu/")) {
    return { target: "lms", path: activePortal === "lcms" ? canonicalAdminWorkspacePath("/resources") : teacherPath("/resources") };
  }
  if (path === "chuong-trinh" || path.startsWith("chuong-trinh/")) {
    return { target: "lms", path: activePortal === "lcms" ? canonicalAdminWorkspacePath("/resources") : teacherPath("/resources") };
  }
  if (["cong-dong", "portfolio", "quizzes"].includes(path)) {
    return { target: "lms", path: activePortal === "lcms" ? canonicalAdminWorkspacePath("/resources") : teacherPath("/resources") };
  }

  return undefined;
}

export function recordLegacyAliasHit(path: string, redirect: LegacyRouteRedirect) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("erg-legacy-route-alias-hit", {
      detail: {
        path: normalizePath(path),
        target: redirect.target,
        targetPath: redirect.path ?? "/",
        sunsetDate: LEGACY_ALIAS_SUNSET_DATE,
        timestamp: Date.now(),
      },
    }),
  );
}

function normalizePath(path: string) {
  return path.trim().toLowerCase().replace(/^\/+|\/+$/g, "");
}

function suffixPath(base: string, suffix: string) {
  const normalizedSuffix = suffix.replace(/^\/+|\/+$/g, "");
  if (!normalizedSuffix) return base;
  return `${base.replace(/\/$/, "")}/${normalizedSuffix}`;
}
