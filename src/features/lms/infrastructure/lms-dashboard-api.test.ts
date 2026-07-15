import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  hasApiBase: vi.fn(),
  readStoredAuthSession: vi.fn(),
  resolveCurrentPortal: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({
  apiRequest: mocks.apiRequest,
  hasApiBase: mocks.hasApiBase,
}));

vi.mock("@/platform/auth/api/auth-token-storage", () => ({
  readStoredAuthSession: mocks.readStoredAuthSession,
  resolveCurrentPortal: mocks.resolveCurrentPortal,
}));

async function loadModule() {
  vi.resetModules();
  return import("@/features/lms/infrastructure/lms-dashboard-api");
}

function sessionBootstrap() {
  return {
    availableScopeOptions: [
      { label: "ERG School", level: "school", unitId: "school-1" },
      { label: "6A1", level: "class", unitId: "school-1" },
    ],
    currentScope: {
      classId: "class-1",
      level: "class",
      unitId: "school-1",
    },
    manageableClasses: [{ id: "class-1", name: "6A1", unitId: "school-1" }],
    manageableUnits: [{ id: "school-1", level: "school", name: "ERG School" }],
    permissions: {
      canAccessGlobalErg: false,
      deniedPermissions: [],
      grantedPermissions: ["lms.assignment.read"],
      roles: ["teacher"],
    },
    user: {
      email: "teacher@erg.edu.vn",
      id: "teacher-1",
      name: "Teacher One",
    },
  };
}

function sessionBootstrapForUser(id: string) {
  return {
    ...sessionBootstrap(),
    user: {
      email: `${id}@erg.edu.vn`,
      id,
      name: id,
    },
  };
}

describe("LMS dashboard API", () => {
  beforeEach(() => {
    mocks.apiRequest.mockReset();
    mocks.hasApiBase.mockReset();
    mocks.readStoredAuthSession.mockReset();
    mocks.resolveCurrentPortal.mockReset();
    mocks.resolveCurrentPortal.mockReturnValue("lms");
  });

  test("uses mock bootstrap only when no API base is configured", async () => {
    mocks.hasApiBase.mockReturnValue(false);
    const { listEducationUnits, loadLmsDashboardBootstrap } = await loadModule();

    const units = await listEducationUnits({ limit: 2 });
    const bootstrap = await loadLmsDashboardBootstrap();

    expect(units.source).toBe("mock");
    expect(units.items.length).toBeGreaterThan(0);
    expect(bootstrap.classes.length).toBeGreaterThan(0);
    expect(mocks.apiRequest).not.toHaveBeenCalled();
  });

  test("propagates session bootstrap failures when API base is configured", async () => {
    mocks.hasApiBase.mockReturnValue(true);
    mocks.apiRequest.mockRejectedValueOnce(new Error("session denied"));
    const { listEducationUnits } = await loadModule();

    await expect(listEducationUnits()).rejects.toThrow("session denied");
  });

  test("keeps API-backed bootstrap data instead of refilling mock classes", async () => {
    mocks.hasApiBase.mockReturnValue(true);
    mocks.apiRequest.mockResolvedValueOnce(sessionBootstrap());
    const { loadLmsDashboardBootstrap } = await loadModule();

    const bootstrap = await loadLmsDashboardBootstrap();

    expect(bootstrap.schools).toHaveLength(1);
    expect(bootstrap.classes).toHaveLength(1);
    expect(bootstrap.schools[0]?.id).toBe("school-1");
    expect(bootstrap.classes[0]?.id).toBe("class-1");
  });

  test("preserves roles, grants, and denies from the current session", async () => {
    mocks.hasApiBase.mockReturnValue(true);
    mocks.apiRequest.mockResolvedValueOnce({
      ...sessionBootstrap(),
      permissions: {
        canAccessGlobalErg: false,
        deniedPermissions: ["lms.assignment.delete"],
        grantedPermissions: ["lms.assignment.*"],
        roles: ["teacher", "lms_teacher_standard"],
      },
    });
    const { loadLmsDashboardBootstrap } = await loadModule();

    const bootstrap = await loadLmsDashboardBootstrap();

    expect(bootstrap.permissions.roles).toEqual(["teacher", "lms_teacher_standard"]);
    expect(bootstrap.permissions.grantedPermissions).toEqual(["lms.assignment.*"]);
    expect(bootstrap.permissions.deniedPermissions).toEqual(["lms.assignment.delete"]);
  });

  test("does not reuse in-memory session bootstrap across accounts", async () => {
    mocks.hasApiBase.mockReturnValue(true);
    mocks.readStoredAuthSession
      .mockReturnValueOnce({ accountId: "teacher-1", accessToken: "token-a", portal: "lms" })
      .mockReturnValueOnce({ accountId: "teacher-2", accessToken: "token-b", portal: "lms" });
    mocks.apiRequest
      .mockResolvedValueOnce(sessionBootstrapForUser("teacher-1"))
      .mockResolvedValueOnce(sessionBootstrapForUser("teacher-2"));
    const { loadCurrentSessionBootstrap } = await loadModule();

    const first = await loadCurrentSessionBootstrap();
    const second = await loadCurrentSessionBootstrap();

    expect(first?.user.id).toBe("teacher-1");
    expect(second?.user.id).toBe("teacher-2");
    expect(mocks.apiRequest).toHaveBeenCalledTimes(2);
  });
});
