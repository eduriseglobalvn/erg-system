import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { PortalWorkspaceSwitcher } from "./portal-workspace-switcher";

vi.mock("@tanstack/react-router", () => ({
  useLocation: () => ({ pathname: "/teacher/classes" }),
}));

it("prefers canonical BFF workspaces over conflicting legacy portals", () => {
  render(<PortalWorkspaceSwitcher portals={["crm"]} workspaces={["ADMIN", "TEACHER"]} />);

  fireEvent.click(screen.getByRole("button"));

  expect(screen.getByText("Admin LMS").closest("a")).toHaveAttribute("href", expect.stringContaining("/admin"));
  expect(screen.getByText("Teacher").closest("a")).toHaveAttribute("href", "/teacher/classes");
  expect(screen.queryByText("CRM")).toBeNull();
});
