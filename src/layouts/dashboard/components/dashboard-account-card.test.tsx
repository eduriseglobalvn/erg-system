import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { DashboardAccountCard } from "@/layouts/dashboard/components/dashboard-account-card";

vi.mock("@/platform/auth", () => ({
  getCurrentAccount: () => null,
}));

vi.mock("@/platform/i18n", () => ({
  useI18n: () => ({
    t: (key: string) =>
      ({
        "common.settings": "Cài đặt",
        "dashboard.getHelp": "Trợ giúp",
        "common.search": "Tìm kiếm",
      })[key] ?? key,
  }),
}));

test("keeps the mock teacher account visible with a Fluent Avatar fallback", () => {
  const { container } = render(<DashboardAccountCard />);

  expect(screen.getByText("Nguyen Ngoc Anh")).toBeInTheDocument();
  expect(screen.getByText("ngocanh@erg.vn")).toBeInTheDocument();

  const avatar = container.querySelector("[data-slot='avatar']");
  expect(avatar).toBeInTheDocument();
  expect(container.querySelector("[data-slot='avatar-fallback']")).toHaveClass("bg-[var(--erg-blue)]");
});
