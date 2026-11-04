import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ADMIN_MENU_GROUPS } from "@/features/lcms/admin-content/admin-content-menu";
import { LMS_MENU_GROUPS } from "@/features/lms/components/lms-teacher-shell-config";

const read = (name: string) => readFileSync(resolve(process.cwd(), "src/routes/portals", name), "utf8");
const adminSource = read("admin-routes.tsx");
const teacherSource = read("teacher-routes.tsx");
const studentSource = read("student-routes.tsx");
const crmSource = read("crm-routes.tsx");
const guardsSource = readFileSync(resolve(process.cwd(), "src/app/router/route-guards.ts"), "utf8");
const source = [adminSource, teacherSource, studentSource, crmSource, read("route-shared.tsx")].join(";");

function routeBlock(src: string, routeName: string, nextRouteName: string) {
  const start = src.indexOf(`const ${routeName} = createRoute`);
  const end = src.indexOf(`const ${nextRouteName} = createRoute`, start);
  return src.slice(start, end < 0 ? undefined : end);
}

describe("canonical LMS workspace route ownership", () => {
  it("keeps admin, teacher and student as explicit TanStack Router routes", () => {
    expect(adminSource).toContain("const adminShellRoute = createRoute");
    expect(routeBlock(adminSource, "adminIndexRoute", "adminProfileRoute")).toContain('path: "/admin"');
    // Teacher is converted: a shell layout route whose Outlet renders one child route per page.
    expect(teacherSource).toContain("const teacherShellRoute = createRoute");
    expect(routeBlock(teacherSource, "teacherIndexRoute", "teacherPageRoutes")).toContain('path: "/teacher"');
    expect(routeBlock(studentSource, "studentRedirectRoute", "studentPortableExamRoute")).toContain('path: "/student"');
  });

  it("mounts account/profile UI inside the active workspace", () => {
    expect(source).toContain('path: adminPath("/profile")');
    expect(source).toContain('path: teacherPath("/profile")');
    expect(source).toContain('path: studentPath("/profile")');
  });

  it("keeps content authoring nested under Admin instead of creating an author portal", () => {
    expect(source).toContain("const adminContentRoutes = ADMIN_CONTENT_ROUTE_PATHS.map");
    expect(source).toContain("ADMIN_CONTENT_ROUTE_PATHS");
    expect(source).not.toContain('path: "/author"');
  });

  it("maps each canonical path to its matching auth compatibility boundary", () => {
    expect(adminSource).not.toContain("withPortalAuth(");
    expect(source).toContain("<PortalAuthGate portal={legacyPortalFromWorkspace(");
    expect(teacherSource).not.toContain("withPortalAuth(");
    expect(studentSource).not.toContain("withPortalAuth(");
    expect(studentSource).not.toContain("getParentRoute: () => rootRoute");
  });

  it("uses the typed canonical host predicate instead of treating the old LMS host list as canonical", () => {
    expect(adminSource).not.toContain("LMS_WORKSPACE_HOST");
    expect(teacherSource).not.toContain("LMS_WORKSPACE_HOST");
    expect(guardsSource).toContain("isCanonicalLmsWorkspaceHost(window.location)");
    expect(studentSource).not.toContain("LMS_WORKSPACE_HOST");
  });

  it("enforces the same matrix before every generated admin, teacher and CRM route", () => {
    // Teacher/Student/Admin-after-conversion: one `_authed` beforeLoad runs the matrix check + canonical host once.
    expect(source).toContain("beforeLoad: authedBeforeLoad");
    expect(guardsSource).toContain("enforceWorkspaceRoute(context.auth, location, workspace);");
    expect(guardsSource).toContain("enforceCanonicalWorkspaceHost(location, workspace);");
    expect(teacherSource).not.toContain("beforeLoad: ({ context, location }) => enforceWorkspaceRoute");
    expect(crmSource).not.toContain("beforeLoad");
    expect(crmSource).toContain("getParentRoute: () => crmShellRoute");
    expect(routeBlock(adminSource, "questionTypesRoute", "legacyAdminContentRoutes")).toContain("getParentRoute: () => authedRoute");
    expect(adminSource).toContain('id: "_adminShell"');
  });

  it("does not publish workspace-owned menu links without their workspace prefix", () => {
    const paths: string[] = [];
    const collect = (items: Array<{ path?: string; children?: Array<{ path?: string; children?: Array<{ path?: string }> }> }>) => {
      for (const item of items) {
        if (item.path) paths.push(item.path);
        if (item.children) collect(item.children);
      }
    };
    collect(ADMIN_MENU_GROUPS.flatMap((group) => group.items));
    collect(LMS_MENU_GROUPS.flatMap((group) => group.items));
    expect(paths.filter((path) => path.startsWith("/schools") || path.startsWith("/homework") || path.startsWith("/calendar") || path.startsWith("/resources") || path.startsWith("/reports"))).toEqual([]);
    expect(paths.filter((path) => path.startsWith("/admin/") || path.startsWith("/teacher/")).length).toBeGreaterThan(8);
  });
});
