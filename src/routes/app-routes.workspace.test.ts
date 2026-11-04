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
const source = [adminSource, teacherSource, studentSource, crmSource, read("route-shared.tsx")].join(";");
const accountMenuSource = readFileSync(resolve(process.cwd(), "src/layouts/dashboard/components/dashboard-account-menu.tsx"), "utf8");

function routeBlock(src: string, routeName: string, nextRouteName: string) {
  const start = src.indexOf(`const ${routeName} = createRoute`);
  const end = src.indexOf(`const ${nextRouteName} = createRoute`, start);
  return src.slice(start, end < 0 ? undefined : end);
}

describe("canonical LMS workspace route ownership", () => {
  it("keeps admin, teacher and student as explicit TanStack Router routes", () => {
    expect(routeBlock(adminSource, "adminWorkspaceRoute", "learningStandardsAdminRoute")).toContain('path: "/admin"');
    expect(routeBlock(teacherSource, "teacherWorkspaceRoute", "teacherPortableExamRoute")).toContain('path: "/teacher"');
    expect(routeBlock(studentSource, "studentRedirectRoute", "studentPortableExamRoute")).toContain('path: "/student"');
  });

  it("mounts account/profile UI inside the active workspace", () => {
    expect(source).toContain('path: adminPath("/profile")');
    expect(source).toContain('path: teacherPath("/profile")');
    expect(source).toContain('path: studentPath("/profile")');
    expect(accountMenuSource).toContain('teacherPath("/profile")');
    expect(accountMenuSource).not.toContain('to="/profile"');
  });

  it("keeps content authoring nested under Admin instead of creating an author portal", () => {
    expect(source).toContain("const adminContentRoutes = ADMIN_CONTENT_ROUTE_PATHS.map");
    expect(source).toContain("ADMIN_CONTENT_ROUTE_PATHS");
    expect(source).toContain("isCanonicalLmsWorkspaceHost(window.location)");
    expect(source).not.toContain('path: "/author"');
  });

  it("maps each canonical path to its matching auth compatibility boundary", () => {
    expect(routeBlock(adminSource, "adminWorkspaceRoute", "learningStandardsAdminRoute")).toContain('withPortalAuth("lcms"');
    expect(routeBlock(teacherSource, "teacherWorkspaceRoute", "teacherPortableExamRoute")).toContain('withPortalAuth("lms"');
    expect(routeBlock(studentSource, "studentRedirectRoute", "studentPortableExamRoute")).toContain('withPortalAuth("elearning"');
  });

  it("uses the typed canonical host predicate instead of treating the old LMS host list as canonical", () => {
    expect(source).toContain("isCanonicalLmsWorkspaceHost(window.location)");
    expect(routeBlock(adminSource, "adminWorkspaceRoute", "learningStandardsAdminRoute")).not.toContain("LMS_WORKSPACE_HOST");
    expect(routeBlock(teacherSource, "teacherWorkspaceRoute", "teacherPortableExamRoute")).not.toContain("LMS_WORKSPACE_HOST");
    expect(routeBlock(studentSource, "studentRedirectRoute", "studentPortableExamRoute")).not.toContain("LMS_WORKSPACE_HOST");
  });

  it("enforces the same matrix before every generated admin, teacher and CRM route", () => {
    expect(source).toContain('beforeLoad: ({ context, location }) => enforceWorkspaceRoute(context.auth, location, "ADMIN")');
    expect(source).toContain('beforeLoad: ({ context, location }) => enforceWorkspaceRoute(context.auth, location, "TEACHER")');
    expect(source).toContain('beforeLoad: ({ context, location }) => enforceWorkspaceRoute(context.auth, location, "CRM")');
    expect(routeBlock(adminSource, "questionTypesRoute", "legacyAdminContentRoutes")).toContain('enforceWorkspaceRoute(context.auth, location, "ADMIN")');
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
