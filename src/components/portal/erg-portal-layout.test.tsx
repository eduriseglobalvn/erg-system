import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import ErgPortalLayout from "@/components/portal/ErgPortalLayout";

vi.mock("@/routes/router-compat", () => ({
  useLocation: () => ({ pathname: "/calendar" }),
  useNavigate: () => vi.fn(),
}));

it("coordinates sidebar and workspace movement through one shell column", () => {
  render(
    <ErgPortalLayout
      menuGroups={[]}
      portalInfo={{ name: "LCMS" }}
    >
      <div>Lịch trung tâm</div>
    </ErgPortalLayout>,
  );

  const shell = screen.getByTestId("erg-portal-shell");
  const main = screen.getByTestId("erg-portal-main");
  expect(shell).toHaveAttribute("data-sidebar-width", "236");
  expect(getComputedStyle(main).width).not.toBe("0px");

  fireEvent.click(screen.getByRole("button", { name: "Thu gon menu" }));

  expect(shell).toHaveAttribute("data-sidebar-width", "72");
  expect(main).toHaveAttribute(
    "data-sidebar-collapsed",
    "true",
  );
});
