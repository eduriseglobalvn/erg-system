import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { RolePermissionWorkspace } from "@/features/rbac/components/role-permission-workspace";
import { getRbacCatalog } from "@/features/rbac/api/rbac-api";

vi.mock("@/features/rbac/api/rbac-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/rbac/api/rbac-api")>()),
  getRbacCatalog: vi.fn(),
}));

test("renders role matrix from catalog", async () => {
  vi.mocked(getRbacCatalog).mockResolvedValue({
    functions: [{ code: "SCHOOL", label: "Trường học" }, { code: "AUDIT", label: "Nhật ký" }],
    roles: [
      { id: "role_pdt_operator", code: "pdt_operator", label: "Phòng đào tạo", description: "Điều phối đào tạo", canDo: [], cannotDo: [], exclusive: false },
      { id: "role_director", code: "director", label: "Giám đốc", description: "Xem toàn bộ", canDo: [], cannotDo: [], exclusive: true },
    ],
    matrix: {
      role_pdt_operator: { SCHOOL: "SUA", AUDIT: "NONE" },
      role_director: { SCHOOL: "XEM", AUDIT: "XEM" },
    },
  });
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RolePermissionWorkspace /></QueryClientProvider>);

  expect(await screen.findAllByText("Phòng đào tạo")).not.toHaveLength(0);
  expect(screen.getAllByText("Điều phối đào tạo")).not.toHaveLength(0);
  const table = screen.getByRole("table", { hidden: true });
  const rows = Array.from(table.querySelectorAll("tbody tr")).map((row) => Array.from(row.querySelectorAll("td")).map((cell) => cell.textContent));
  expect(rows).toEqual([["Trường học", "Sửa", "Xem"], ["Nhật ký", "—", "Xem"]]);
});
