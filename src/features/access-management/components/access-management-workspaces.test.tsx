import { beforeEach, describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const hooks = vi.hoisted(() => ({
  usePermissionCatalog: vi.fn(),
  usePermissionDetail: vi.fn(),
  useRoles: vi.fn(),
  useRoleDetail: vi.fn(),
  usePermissionGroups: vi.fn(),
  useRoleCommands: vi.fn(),
}));

vi.mock("@/features/access-management/hooks/use-access-management", () => hooks);

import { PermissionCatalogWorkspace } from "@/features/access-management/components/permission-catalog-workspace";
import { RoleManagementWorkspace } from "@/features/access-management/components/role-management-workspace";
import { RoleEditorDrawer } from "@/features/access-management/components/role-editor-drawer";

describe("access-management workspaces", () => {
  beforeEach(() => {
    hooks.usePermissionDetail.mockReturnValue({ data: undefined, isPending: false, isError: false, refetch: vi.fn() });
    hooks.useRoleDetail.mockReturnValue({ data: undefined, isPending: false, isError: false });
    hooks.usePermissionGroups.mockReturnValue({ data: [], isPending: false, isError: false });
    hooks.useRoleCommands.mockReturnValue({
      create: { mutateAsync: vi.fn(), isPending: false },
      update: { mutateAsync: vi.fn(), isPending: false },
      remove: { mutateAsync: vi.fn(), isPending: false },
    });
  });

  test("renders the permission catalog grouped by module without DB id or unbound noise", () => {
    hooks.usePermissionCatalog.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        items: [
          {
            id: "perm_lms_assignment_create",
            name: "lms.assignment.create",
            group: "lms",
            label: "Create assignment",
            description: "Create an assignment",
            resource: "assignment",
            action: "create",
            portal: "lms",
            supportedScope: "school",
            status: "ACTIVE",
            isSystem: false,
            deprecatedAt: null,
            used: true,
            roleCount: 2,
            userCount: 8,
            bindings: [
              {
                id: "binding-1",
                surfaceType: "REST",
                surfaceIdentifier: "POST /api/v1/lms/assignments",
                enforced: true,
              },
            ],
          },
        ],
        page: 0,
        limit: 25,
        total: 1,
        totalPages: 1,
      },
    });
    render(<PermissionCatalogWorkspace tenantId="tenant-1" />);

    expect(screen.getByText("Học tập (LMS)")).toBeInTheDocument();
    expect(screen.getByText("Tạo bài tập")).toBeInTheDocument();
    expect(screen.getByText("lms.assignment.create")).toBeInTheDocument();
    expect(screen.queryByText("perm_lms_assignment_create")).not.toBeInTheDocument();
    expect(screen.queryByText("Chưa bind")).not.toBeInTheDocument();
    expect(screen.getByText("2 nhóm quyền · 8 người")).toBeInTheDocument();
  });

  test("renders real roles and does not expose legacy mock role rows", () => {
    hooks.useRoles.mockReturnValue({
      isPending: false,
      isError: false,
      data: [
        {
          id: "role_lms_teacher",
          name: "lms.learner",
          description: "Teacher permissions",
          permissions: ["lms.assignment.read"],
          is_default: false,
          createdAt: "2026-07-15T00:00:00Z",
          updated_at: "2026-07-15T00:00:00Z",
          updatedBy: "admin-1",
        },
      ],
    });
    render(<RoleManagementWorkspace tenantId="tenant-1" />);

    expect(screen.getByText("lms.learner")).toBeInTheDocument();
    expect(screen.getByText(/Học/)).toBeInTheDocument();
    expect(screen.queryByText("role_lms_teacher")).not.toBeInTheDocument();
    expect(screen.queryByText("Teacher Readonly")).not.toBeInTheDocument();
  });

  test("shows an error alert when the permission-groups request fails", () => {
    hooks.useRoles.mockReturnValue({ isPending: false, isError: false, data: [] });
    hooks.usePermissionGroups.mockReturnValue({ data: undefined, isPending: false, isError: true, refetch: vi.fn() });
    render(<RoleManagementWorkspace tenantId="tenant-1" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Không tải được danh mục quyền");
  });

  test("shows an alert instead of silently keeping stale roles after a failed refresh", () => {
    hooks.useRoles.mockReturnValue({
      isPending: false, isError: true, refetch: vi.fn(),
      data: [{ id: "r1", name: "lms.learner", permissions: [], is_default: false, createdAt: "2026-07-15T00:00:00Z", updated_at: "2026-07-15T00:00:00Z" }],
    });
    render(<RoleManagementWorkspace tenantId="tenant-1" />);
    expect(screen.getByRole("alert")).toHaveTextContent("dữ liệu đã tải trước đó");
  });

  test("edits a role with real grouped permissions and confirms sensitive grants", async () => {
    const update = vi.fn().mockResolvedValue({});
    hooks.useRoleCommands.mockReturnValue({
      create: { mutateAsync: vi.fn(), isPending: false },
      update: { mutateAsync: update, isPending: false },
      remove: { mutateAsync: vi.fn(), isPending: false },
    });
    hooks.useRoleDetail.mockReturnValue({
      data: {
        id: "role_lms_teacher",
        name: "lms_teacher",
        description: "Giáo viên",
        permissions: ["lms.assignment.read"],
        is_default: false,
        createdAt: "2026-07-15T00:00:00Z",
        updated_at: "2026-07-15T00:00:00Z",
        userCount: 12,
      },
      isPending: false,
      isError: false,
    });
    hooks.usePermissionGroups.mockReturnValue({
      isPending: false,
      isError: false,
      data: [
        {
          id: "group-rbac",
          name: "rbac",
          label: "Quản trị truy cập",
          order: 1,
          permissions: [
            { id: "perm-read", name: "lms.assignment.read", label: "Xem bài tập", group: "lms", status: "ACTIVE", isSystem: false, used: true, roleCount: 1, userCount: 12, bindings: [] },
            { id: "perm-users", name: "users.manage", label: "Quản lý người dùng", group: "rbac", status: "ACTIVE", isSystem: true, used: true, roleCount: 1, userCount: 2, bindings: [] },
          ],
        },
      ],
    });

    render(<RoleEditorDrawer tenantId="tenant-1" roleId="role_lms_teacher" onClose={vi.fn()} />);

    expect(screen.getByDisplayValue("lms_teacher")).toBeInTheDocument();
    expect(screen.getByText("12 người dùng bị ảnh hưởng")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: /users\.manage/i }));
    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    expect(screen.getByText("Xác nhận cấp quyền nhạy cảm")).toBeInTheDocument();
    expect(update).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận và lưu" }));

    await waitFor(() => expect(update).toHaveBeenCalledWith({
      roleId: "role_lms_teacher",
      payload: {
        name: "lms_teacher",
        description: "Giáo viên",
        permissions: ["lms.assignment.read", "users.manage"],
      },
    }));
  });
});
