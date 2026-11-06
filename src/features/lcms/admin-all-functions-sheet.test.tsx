import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ADMIN_MENU_GROUPS } from "@/features/lcms/admin-content/admin-content-menu";
import { AdminAllFunctionsSheet } from "@/features/lcms/admin-all-functions-sheet";
import { canNavigateToAdminPath, filterAdminMenuGroups } from "@/features/lcms/admin-mobile-dock-config";

function setup(canAccess: (path: string) => boolean = () => true) {
  const onNavigate = vi.fn();
  const onClose = vi.fn();
  render(<AdminAllFunctionsSheet canAccess={canAccess} menuGroups={ADMIN_MENU_GROUPS} onClose={onClose} onNavigate={onNavigate} open />);
  return { onClose, onNavigate };
}

describe("admin menu permission filtering (real matrix)", () => {
  const groupLabels = (granted: string[], denied: string[] = []) =>
    filterAdminMenuGroups(ADMIN_MENU_GROUPS, (path) => canNavigateToAdminPath(path, granted, denied))
      .flatMap((group) => group.items.map((item) => item.label));

  it("keeps Nhân sự with full permission and drops it without", () => {
    expect(groupLabels(["*"])).toContain("Nhân sự");
    expect(groupLabels([])).not.toContain("Nhân sự");
    expect(groupLabels(["lms.admin"], ["users.manage"])).not.toContain("Nhân sự");
  });
});

describe("AdminAllFunctionsSheet", () => {
  it("clears the search text after the sheet closes", () => {
    const onClose = vi.fn();
    const { rerender } = render(<AdminAllFunctionsSheet canAccess={() => true} menuGroups={ADMIN_MENU_GROUPS} onClose={onClose} onNavigate={vi.fn()} open />);
    fireEvent.change(screen.getByRole("searchbox", { name: "Tìm chức năng" }), { target: { value: "trường" } });
    fireEvent.click(screen.getByRole("button", { name: "Đóng" }));
    expect(onClose).toHaveBeenCalled();
    rerender(<AdminAllFunctionsSheet canAccess={() => true} menuGroups={ADMIN_MENU_GROUPS} onClose={onClose} onNavigate={vi.fn()} open={false} />);
    rerender(<AdminAllFunctionsSheet canAccess={() => true} menuGroups={ADMIN_MENU_GROUPS} onClose={onClose} onNavigate={vi.fn()} open />);
    expect(screen.getByRole("searchbox", { name: "Tìm chức năng" })).toHaveValue("");
  });

  it("is a dialog titled Tất cả chức năng with the Nhân sự group", () => {
    setup();
    const dialog = screen.getByRole("dialog", { name: "Tất cả chức năng" });
    expect(within(dialog).getByText("Nhân sự")).toBeInTheDocument();
  });

  it("navigates and closes when a function is picked", () => {
    const { onClose, onNavigate } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Danh sách trường" }));
    expect(onNavigate).toHaveBeenCalledWith("/admin/schools/list");
    expect(onClose).toHaveBeenCalled();
  });

  it("filters by the search box", () => {
    setup();
    fireEvent.change(screen.getByRole("searchbox", { name: "Tìm chức năng" }), { target: { value: "danh sách trường" } });
    expect(screen.getByRole("button", { name: "Danh sách trường" })).toBeInTheDocument();
    expect(screen.queryByText("Nhân sự")).toBeNull();
    fireEvent.change(screen.getByRole("searchbox", { name: "Tìm chức năng" }), { target: { value: "zzzz" } });
    expect(screen.getByText("Không tìm thấy chức năng phù hợp.")).toBeInTheDocument();
  });

  it("hides what the session cannot open", () => {
    setup((path) => canNavigateToAdminPath(path, ["lms.admin"], ["users.manage"]));
    expect(screen.queryByText("Nhân sự")).toBeNull();
    expect(screen.getByRole("button", { name: "Trang chủ" })).toBeInTheDocument();
  });
});
