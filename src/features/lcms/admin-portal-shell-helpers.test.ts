import { expect, it } from "vitest";

import { resolveActiveMenuItem } from "./admin-portal-shell-helpers";

it("uses the menu entry for listed paths and its group for flow-only screens", () => {
  expect(resolveActiveMenuItem("/admin/schools/list").label).toBe("Danh sách trường");
  expect(resolveActiveMenuItem("/admin/schools/classes").label).toBe("Quản lý trường học");
  expect(resolveActiveMenuItem("/admin/employees/access-logs").label).toBe("Nhật ký truy cập");
  expect(resolveActiveMenuItem("/admin").label).toBe("Trang chủ");
  expect(resolveActiveMenuItem("/admin/unknown").label).toBe("Trang chủ");
});
