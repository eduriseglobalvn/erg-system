import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { navigate, search } = vi.hoisted(() => ({ navigate: vi.fn(), search: { value: "" } }));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
  useLocation: () => ({ searchStr: search.value }),
  useNavigate: () => navigate,
}));
vi.mock("@/platform/auth/hooks/use-auth-session", () => ({
  useAuthSession: () => ({
    account: { email: "admin@erg.edu.vn" },
    session: { workspaces: ["ADMIN"], permissions: ["lms.admin"], deniedPermissions: [], portals: ["lcms"], roles: [] },
  }),
}));
vi.mock("@/platform/auth/api/auth-api", () => ({ authApi: { logout: vi.fn() } }));
vi.mock("@/platform/auth/api/auth-storage", () => ({ logoutAccount: vi.fn() }));
vi.mock("@/platform/auth/api/auth-token-storage", () => ({ readStoredAuthSession: vi.fn(() => null) }));
vi.mock("@/platform/auth/api/student-auth-storage", () => ({ getCurrentStudentSession: vi.fn(() => null), logoutStudentSession: vi.fn() }));

import { AccessDeniedPage } from "./access-denied-page";

describe("AccessDeniedPage auto-redirect", () => {
  beforeEach(() => navigate.mockClear());

  it("returns the user to a route they are allowed to open", () => {
    search.value = "?portal=lcms&redirect=%2Fadmin%2Fprofile";
    render(<AccessDeniedPage />);
    expect(navigate).toHaveBeenCalledWith({ href: "/admin/profile", replace: true });
  });

  it("does not bounce back to a route the guard has no rule for (redirect loop)", () => {
    search.value = "?portal=lcms&redirect=%2Fadmin%2Fno-such-route";
    render(<AccessDeniedPage />);
    expect(navigate).not.toHaveBeenCalled();
  });
});
