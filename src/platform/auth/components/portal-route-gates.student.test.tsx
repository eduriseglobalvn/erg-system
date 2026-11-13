import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { auth, pathname } = vi.hoisted(() => ({
  auth: { value: {} as Record<string, unknown> },
  pathname: { value: "/teacher/home" },
}));

vi.mock("@tanstack/react-router", () => ({
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate">{to}</div>,
  useLocation: () => ({ pathname: pathname.value, searchStr: "", hash: "" }),
}));
vi.mock("@/platform/auth/hooks/use-auth-session", () => ({ useAuthSession: () => auth.value }));
vi.mock("@/platform/auth/api/auth-storage", () => ({ getAuthScope: () => ({ session: null }), getCurrentAccount: () => null }));
vi.mock("@/platform/auth/api/student-auth-storage", () => ({ getCurrentStudentSession: () => null }));
vi.mock("@/platform/auth/components/reauth-dialog", () => ({ ReauthDialog: () => null }));

import { PortalAuthGate } from "./portal-route-gates";

const pendingOnboarding = {
  status: "FIRST_LOGIN_RESTRICTED",
  isProfileCompleted: false,
  recoveryEmailMasked: null,
  recoveryEmailVerified: false,
  mustChangePassword: true,
  nextSteps: ["COMPLETE_PROFILE", "CHANGE_PASSWORD"],
};

function signIn(lifecycle: unknown, workspaces: string[], portals: string[]) {
  auth.value = {
    account: { id: "u1", email: "u1@erg.edu.vn", lifecycle },
    session: { permissions: ["elearning.assignment.read_self"], deniedPermissions: [], roles: [], portals, workspaces },
    reauthRequired: false,
    actions: {},
  };
}

describe("PortalAuthGate with a learner-only session", () => {
  beforeEach(() => {
    pathname.value = "/teacher/home";
  });

  it("sends a student on a teacher page to the student home", () => {
    signIn({ ...pendingOnboarding, status: "ACTIVE", nextSteps: [] }, ["STUDENT"], ["elearning"]);
    render(<PortalAuthGate portal="lms"><p>teacher page</p></PortalAuthGate>);
    expect(screen.getByTestId("navigate").textContent).toBe("/student");
  });

  it("never sends a student to onboarding, whatever the lifecycle flags say", () => {
    pathname.value = "/student";
    signIn(pendingOnboarding, ["STUDENT"], ["elearning"]);
    render(<PortalAuthGate portal="elearning"><p>student home</p></PortalAuthGate>);
    expect(screen.getByText("student home")).toBeTruthy();
  });

  it("still sends a teacher with pending onboarding to /onboarding", () => {
    signIn(pendingOnboarding, ["TEACHER"], ["lms"]);
    render(<PortalAuthGate portal="lms"><p>teacher page</p></PortalAuthGate>);
    expect(screen.getByTestId("navigate").textContent).toBe("/onboarding");
  });

  it("keeps a blocked student on access denied", () => {
    signIn({ ...pendingOnboarding, status: "BLOCKED", nextSteps: [] }, ["STUDENT"], ["elearning"]);
    render(<PortalAuthGate portal="lms"><p>teacher page</p></PortalAuthGate>);
    expect(screen.getByTestId("navigate").textContent).toMatch(/^\/access-denied\?/);
  });
});
