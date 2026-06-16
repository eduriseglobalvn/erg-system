import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { NavUser } from "@/components/nav-user";

vi.mock("@/components/ui/sidebar-context", () => ({
  useSidebar: () => ({ isMobile: false }),
}));

vi.mock("@/platform/i18n", () => ({
  useI18n: () => ({
    locale: "vi",
    setLocale: vi.fn(),
    t: (key: string) =>
      ({
        "common.account": "Tài khoản",
        "common.settings": "Cài đặt",
        "common.notifications": "Thông báo",
        "common.logout": "Đăng xuất",
        "locale.language": "Ngôn ngữ",
      })[key] ?? key,
  }),
}));

test("NavUser uses Fluent avatar fallback and a shadcn locale toggle group", async () => {
  const { container } = render(
    <NavUser
      user={{
        name: "Nguyen Ngoc Anh",
        email: "ngocanh@erg.vn",
        avatar: "",
      }}
    />,
  );

  expect(screen.getByText("Nguyen Ngoc Anh")).toBeInTheDocument();
  expect(container.querySelector("[data-slot='avatar-fallback']")).toHaveClass("bg-[var(--primary)]");

  fireEvent.pointerDown(screen.getByRole("button", { name: /Nguyen Ngoc Anh/ }));

  expect(await screen.findByText("Ngôn ngữ")).toBeInTheDocument();
  expect(document.querySelector("[data-slot='toggle-group']")).toBeInTheDocument();
});
