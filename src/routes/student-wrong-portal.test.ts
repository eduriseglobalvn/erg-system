import { createMemoryHistory, createRouter } from "@tanstack/react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { routeTree } from "@/routes/app-routes";
import { createAuthRouteState } from "@/platform/auth/router/auth-route-context";
import type { TeacherAccountLifecycle } from "@/platform/auth/types/account-lifecycle";

// STU-02 / STU-01: a learner-only account never stops on an error or onboarding page; it goes to the student home.
const STUDENT_PERMISSIONS = [
  "elearning.announcement.read_self",
  "elearning.assignment.read_self",
  "elearning.dashboard.read",
  "elearning.discussion.write_self",
  "lms.assignment.read_self",
  "lms.assignment.submit",
  "lms.quiz.play",
  "lms.schedule.read_self",
];

const lifecycle = (overrides: Partial<TeacherAccountLifecycle> = {}): TeacherAccountLifecycle => ({
  status: "ACTIVE",
  isProfileCompleted: true,
  recoveryEmailMasked: null,
  recoveryEmailVerified: true,
  mustChangePassword: false,
  nextSteps: [],
  ...overrides,
});

const student = (accountLifecycle = lifecycle(), permissions = STUDENT_PERMISSIONS) => createAuthRouteState({
  account: { id: "s1", email: "hs1@erg.edu.vn", lifecycle: accountLifecycle } as never,
  session: { permissions, portals: ["elearning"], roles: ["lms.learner"], workspaces: ["STUDENT"] },
  apiBacked: true,
});
const teacher = createAuthRouteState({
  account: { id: "t1", email: "gv1@erg.edu.vn", lifecycle: lifecycle() } as never,
  session: { permissions: ["lms.dashboard.read"], portals: ["lms"], roles: ["teacher"], workspaces: ["TEACHER"] },
  apiBacked: true,
});
const guest = createAuthRouteState({ account: null, session: null, apiBacked: true });

async function landing(auth: ReturnType<typeof createAuthRouteState>, path: string) {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [path] }), context: { auth } });
  await router.load();
  return router.state.location.pathname;
}

describe("a student who opens a page outside the student portal lands on the student home", () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each([
    "/teacher/home",
    "/admin",
    "/admin/settings/roles",
    "/onboarding",
    "/seo",
    "/teacher/khong-ton-tai",
  ])("student %s -> /student", async (path) => {
    expect(await landing(student(), path)).toBe("/student");
  });

  it("uses / on the student host", async () => {
    vi.stubGlobal("location", new URL("https://elearning.erg.edu.local/teacher/home"));
    expect(await landing(student(), "/teacher/home")).toBe("/");
  });

  it("keeps a student whose lifecycle still asks for onboarding out of /onboarding", async () => {
    const pending = lifecycle({ status: "FIRST_LOGIN_RESTRICTED", mustChangePassword: true, isProfileCompleted: false, nextSteps: ["COMPLETE_PROFILE", "CHANGE_PASSWORD"] });
    expect(await landing(student(pending), "/student")).toBe("/student");
    expect(await landing(student(pending), "/onboarding")).toBe("/student");
  });

  it("still denies a blocked student account", async () => {
    expect(await landing(student(lifecycle({ status: "BLOCKED" })), "/teacher/home")).toBe("/access-denied");
  });

  it("denies (no loop) when the student portal itself refuses the page", async () => {
    expect(await landing(student(lifecycle(), ["lms.quiz.play"]), "/student")).toBe("/access-denied");
  });

  it("denies a teacher without the permission", async () => {
    expect(await landing(teacher, "/admin")).toBe("/access-denied");
  });

  it("sends a guest to login", async () => {
    expect(await landing(guest, "/teacher/home")).toBe("/login");
  });
});
