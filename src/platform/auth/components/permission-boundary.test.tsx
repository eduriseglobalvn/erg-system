import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("@/platform/auth/hooks/use-auth-session", () => ({
  useAuthSession: () => ({ session: { permissions: [], deniedPermissions: [] } }),
}));

import { PermissionBoundary } from "@/platform/auth/components/permission-boundary";

test("renders content only when effective permission allows it", () => {
  const { rerender } = render(
    <PermissionBoundary permission="lms.grade.write" permissions={["lms.grade.*"]} deniedPermissions={[]}>
      <button>Finalize</button>
    </PermissionBoundary>,
  );
  expect(screen.getByRole("button", { name: "Finalize" })).toBeInTheDocument();

  rerender(
    <PermissionBoundary permission="lms.grade.write" permissions={["lms.*"]} deniedPermissions={["lms.grade.*"]} fallback={<p>Không có quyền</p>}>
      <button>Finalize</button>
    </PermissionBoundary>,
  );
  expect(screen.queryByRole("button", { name: "Finalize" })).not.toBeInTheDocument();
  expect(screen.getByText("Không có quyền")).toBeInTheDocument();
});
