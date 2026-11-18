import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { navigate, logout, sessionState } = vi.hoisted(() => ({
  navigate: vi.fn(),
  logout: vi.fn(() => Promise.resolve()),
  sessionState: {
    value: {
      workspaces: ["ADMIN"] as const,
      permissions: ["lms.admin"],
      deniedPermissions: [] as string[],
      portals: ["lcms"] as const,
    },
  },
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, ...props }: { to: string; children: React.ReactNode }) => <a href={to} {...props}>{children}</a>,
  useLocation: () => ({ searchStr: "?portal=lms&email=admin%40erg.edu.vn&redirect=%2Fhome" }),
  useNavigate: () => navigate,
}));

vi.mock("@/platform/auth/hooks/use-auth-session", () => ({
  useAuthSession: () => ({
    account: { email: "admin@erg.edu.vn" },
    session: sessionState.value,
  }),
}));

vi.mock("@/platform/auth/api/auth-api", () => ({ authApi: { logout } }));
vi.mock("@/platform/auth/api/auth-storage", () => ({ logoutAccount: vi.fn() }));
vi.mock("@/platform/auth/api/auth-token-storage", () => ({ readStoredAuthSession: vi.fn(() => null) }));
vi.mock("@/platform/auth/api/student-auth-storage", () => ({ getCurrentStudentSession: vi.fn(() => null), logoutStudentSession: vi.fn() }));

import { AccessDeniedPage } from "./access-denied-page";

describe("AccessDeniedPage", () => {
  it("explains the denied Teacher request and offers the entitled Admin workspace", () => {
    render(<AccessDeniedPage />);

    expect(screen.getByRole("heading", { name: /Bạn chưa có quyền vào Cổng giáo viên/i })).toBeInTheDocument();
    expect(screen.getByText("admin@erg.edu.vn")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Cổng quản trị/i })).toHaveAttribute("href", "/admin");
    expect(screen.getByText(/chưa được cấp quyền/i)).toBeInTheDocument();
  });

  it("keeps the recovery surface explicit when no workspace capability is available", () => {
    sessionState.value = { workspaces: ["ADMIN"], permissions: [], deniedPermissions: [], portals: ["lcms"] };
    render(<AccessDeniedPage />);

    expect(screen.getByText("Tài khoản chưa có cổng nào dùng được")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Cổng quản trị/i })).not.toBeInTheDocument();
  });

  it("clears the current session when the user chooses another account", () => {
    sessionState.value = { workspaces: ["ADMIN"], permissions: ["lms.admin"], deniedPermissions: [], portals: ["lcms"] };
    render(<AccessDeniedPage />);

    fireEvent.click(screen.getByRole("button", { name: /Đăng nhập tài khoản khác/i }));
    expect(logout).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith({ replace: true, search: { redirect: "/home" }, to: "/login" });
  });
});
