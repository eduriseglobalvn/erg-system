import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PortalSidebarWorkspaceHeader } from "./portal-sidebar-workspace-header";

vi.mock("@tanstack/react-router", () => ({
  useLocation: () => ({ pathname: "/admin" }),
  useNavigate: () => vi.fn(),
}));

describe("PortalSidebarWorkspaceHeader", () => {
  it("renders current workspace label and subtitle in expanded mode", () => {
    render(
      <PortalSidebarWorkspaceHeader
        active
        collapsed={false}
        onNavigate={vi.fn()}
        portalInfo={{
          name: "ERG",
          workspaceCapabilities: ["ADMIN", "TEACHER"],
        }}
      />,
    );

    expect(screen.getByText("Admin LMS")).toBeInTheDocument();
    expect(screen.getByText("Quản trị hệ thống")).toBeInTheDocument();
  });

  it("opens menu and handles workspace selection", () => {
    const handleNavigate = vi.fn();
    render(
      <PortalSidebarWorkspaceHeader
        active
        collapsed={false}
        onNavigate={handleNavigate}
        portalInfo={{
          name: "ERG",
          workspaceCapabilities: ["ADMIN", "TEACHER"],
        }}
      />,
    );

    const button = screen.getByRole("button", { name: /Không gian làm việc: Admin LMS/i });
    fireEvent.click(button);

    expect(screen.getByText("Không gian làm việc")).toBeInTheDocument();
    expect(screen.getByText("Giáo viên")).toBeInTheDocument();

    const teacherOption = screen.getByText("Giáo viên");
    fireEvent.click(teacherOption);

    expect(handleNavigate).toHaveBeenCalledWith("/teacher/home");
    expect(window.localStorage.getItem("erg_last_workspace")).toBe("TEACHER");
  });

  it("renders properly in fluid mode without opening menu when user has only 1 workspace", () => {
    render(
      <PortalSidebarWorkspaceHeader
        active
        collapsed={false}
        fluid
        portalInfo={{
          name: "ERG",
          workspaceCapabilities: ["ADMIN"],
        }}
      />,
    );

    expect(screen.getByText("Admin LMS")).toBeInTheDocument();
    const button = screen.getByRole("button", { name: /Không gian làm việc: Admin LMS/i });
    fireEvent.click(button);

    // Menu should NOT open when there is only 1 workspace
    expect(screen.queryByText("Không gian làm việc")).not.toBeInTheDocument();
  });
});
