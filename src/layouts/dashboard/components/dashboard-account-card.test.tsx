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

test("keeps the mock teacher account visible with accessible MUI actions", () => {
  render(<DashboardAccountCard />);

  expect(screen.getByText("Nguyen Ngoc Anh")).toBeInTheDocument();
  expect(screen.getByText("ngocanh@erg.vn")).toBeInTheDocument();
  expect(screen.getByText("NN")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Cài đặt" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Trợ giúp" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Tìm kiếm" })).toBeVisible();
  expect(screen.getByLabelText("Tài khoản của Nguyen Ngoc Anh")).toBeVisible();
});
