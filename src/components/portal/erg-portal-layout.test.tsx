import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

vi.mock("@/components/portal/use-portal-notifications", () => ({ notificationPortalFromPath: () => "lms", usePortalNotifications: () => ({ notifications: [], unreadCount: undefined }) }));
import ErgPortalLayout from "@/components/portal/ErgPortalLayout";

vi.mock("@tanstack/react-router", () => ({
  useLocation: () => ({ pathname: "/calendar" }),
  useNavigate: () => vi.fn(),
}));

it("coordinates sidebar and workspace movement through one shell column", () => {
  render(
    <ErgPortalLayout
      menuGroups={[]}
      portalInfo={{ name: "Admin" }}
    >
      <div>Lịch trung tâm</div>
    </ErgPortalLayout>,
  );

  const shell = screen.getByTestId("erg-portal-shell");
  const main = screen.getByTestId("erg-portal-main");
  expect(shell).toHaveAttribute("data-sidebar-width", "264");
  expect(getComputedStyle(main).width).not.toBe("0px");

  fireEvent.click(screen.getByRole("button", { name: "Thu gọn menu" }));

  expect(shell).toHaveAttribute("data-sidebar-width", "80");
  expect(main).toHaveAttribute(
    "data-sidebar-collapsed",
    "true",
  );
});
