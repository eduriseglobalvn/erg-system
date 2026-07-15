import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import { fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { LmsBottomDock } from "./lms-bottom-dock";

describe("LmsBottomDock", () => {
  it("uses MUI styling without Tailwind or lucide", () => {
    const source = readFileSync(resolve("src/features/lms/mobile/components/lms-bottom-dock.tsx"), "utf8");
    expect(source).not.toContain("lucide-react");
    expect(source).not.toContain("className=");
  });

  it("keeps mobile navigation accessible and selectable", () => {
    const onNavigate = vi.fn();
    render(
      <LmsBottomDock
        activeSection="home"
        items={[{ id: "home", icon: HomeRoundedIcon, label: "Trang chủ", path: "/home" }]}
        onNavigate={onNavigate}
      />,
    );

    const item = screen.getByRole("button", { name: "Trang chủ" });
    expect(item).toHaveAttribute("aria-current", "page");
    fireEvent.click(item);
    expect(onNavigate).toHaveBeenCalledWith("/home");
  });
});
