import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import InboxRoundedIcon from "@mui/icons-material/InboxRounded";
import TodayRoundedIcon from "@mui/icons-material/TodayRounded";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { LmsMobileShell } from "./lms-mobile-shell";

it("implements the LMS mobile shell with MUI instead of legacy utilities", () => {
  const source = readFileSync(resolve("src/features/lms/mobile/components/lms-mobile-shell.tsx"), "utf8");
  expect(source).not.toContain("lucide-react");
  expect(source).not.toContain("className=");
  expect(source).not.toContain("@/lib/utils");
});

it("renders the shared dock with an inbox badge, opens the account sheet and has no header bell", () => {
  const onNavigate = vi.fn();
  render(
    <LmsMobileShell
      activeLabel="Hôm nay"
      activeSection="home"
      classes={[]}
      dockItems={[
        { id: "home", icon: TodayRoundedIcon, label: "Hôm nay", path: "/teacher" },
        { id: "inbox", badgeCount: 3, icon: InboxRoundedIcon, label: "Hộp thư", path: "/teacher/notifications" },
        { id: "account", icon: AccountCircleRoundedIcon, label: "Tài khoản", opensSheet: true, path: "/teacher/account" },
      ]}
      schoolName="ERG"
      schools={[]}
      selectedClassId=""
      selectedClassName="9A1"
      selectedSchoolId=""
      teacherEmail="gv@erg.edu.vn"
      teacherName="Lê Thị Thùy"
      onClassChange={vi.fn()}
      onNavigate={onNavigate}
      onSchoolChange={vi.fn()}
      onSignOut={vi.fn()}
    >
      <div>Nội dung</div>
    </LmsMobileShell>,
  );

  expect(screen.queryByRole("button", { name: "Thông báo" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: /^Hộp thư, 3 chưa đọc$/ }));
  expect(onNavigate).toHaveBeenCalledWith("/teacher/notifications");
  fireEvent.click(within(screen.getByRole("navigation", { name: "Điều hướng giáo viên" })).getByRole("button", { name: "Tài khoản" }));
  expect(screen.getByText("gv@erg.edu.vn")).toBeInTheDocument();
});
