import { beforeEach, describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const hooks = vi.hoisted(() => ({
  useEmployees: vi.fn(),
  useEmployeeDetail: vi.fn(),
  useEmployeeSecurityEvents: vi.fn(),
  useEmployeeSecurityFeed: vi.fn(),
  useEmployeeRoleOptions: vi.fn(),
  useEmployeeCommands: vi.fn(),
}));

vi.mock("@/features/employee-management/hooks/use-employee-management", () => hooks);

import { EmployeeListWorkspace } from "@/features/employee-management/components/employee-list-workspace";
import { EmployeeSecurityTimeline } from "@/features/employee-management/components/employee-security-timeline";
import { EmployeeAccessLogWorkspace } from "@/features/employee-management/components/employee-access-log-workspace";
import { EmployeeDetailDrawer } from "@/features/employee-management/components/employee-detail-drawer";

describe("employee management workspace", () => {
  beforeEach(() => {
    hooks.useEmployeeDetail.mockReturnValue({ data: undefined, isPending: false, isError: false, refetch: vi.fn() });
    hooks.useEmployeeSecurityEvents.mockReturnValue({ data: { items: [] }, isPending: false, isError: false, refetch: vi.fn() });
    hooks.useEmployeeSecurityFeed.mockReturnValue({ data: { items: [], page: 1, limit: 50, total: 0, totalPages: 0 }, isPending: false, isError: false, refetch: vi.fn() });
    hooks.useEmployeeRoleOptions.mockReturnValue({ data: [{ id: "role-it", name: "it_operator" }], isPending: false, isError: false });
    const command = { mutateAsync: vi.fn(), isPending: false };
    hooks.useEmployeeCommands.mockReturnValue({ create: command, update: command, status: command, roles: command, resetCredential: command, revokeSession: command });
  });

  test("renders employee identity roles status and last login from the server", () => {
    hooks.useEmployees.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        users: [{
          id: "user-1", email: "teacher@erg.edu.vn", fullName: "Teacher One", phone: "0909000000",
          status: "ACTIVE", roles: ["lms_teacher"], isProfileCompleted: true,
          last_login_at: "2026-07-15T08:00:00Z", createdAt: "2026-01-01T00:00:00Z",
          employeeCode: "GV-001", departmentId: "training", jobTitle: "Senior Teacher",
          scopes: ["SCHOOL:school-1"], activeDeviceCount: 2, activePlatforms: ["WEB_DESKTOP", "WEB_MOBILE"],
          riskCode: "RAPID_SESSION_REPLACEMENT", riskSeverity: "HIGH",
        }],
        meta: { page: 1, limit: 25, total: 1, totalPages: 1 },
      },
    });
    render(<EmployeeListWorkspace tenantId="tenant-1" />);

    expect(screen.getByText("Teacher One")).toBeInTheDocument();
    expect(screen.getByText("teacher@erg.edu.vn")).toBeInTheDocument();
    expect(screen.getByText("lms_teacher")).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    expect(screen.getByText("GV-001")).toBeInTheDocument();
    expect(screen.getByText("Senior Teacher")).toBeInTheDocument();
    expect(screen.getByText("2 thiết bị")).toBeInTheDocument();
    expect(screen.getByText("RAPID_SESSION_REPLACEMENT")).toBeInTheDocument();
  });

  test("quick assigns a real role group from the employee row", async () => {
    const roles = vi.fn().mockResolvedValue({});
    hooks.useEmployeeCommands.mockReturnValue({
      create: { mutateAsync: vi.fn(), isPending: false }, update: { mutateAsync: vi.fn(), isPending: false },
      status: { mutateAsync: vi.fn(), isPending: false }, roles: { mutateAsync: roles, isPending: false },
      resetCredential: { mutateAsync: vi.fn(), isPending: false }, revokeSession: { mutateAsync: vi.fn(), isPending: false },
    });
    hooks.useEmployees.mockReturnValue({
      isPending: false, isError: false,
      data: { users: [{ id: "user-1", email: "teacher@erg.edu.vn", fullName: "Teacher One", status: "ACTIVE", roles: ["lms_teacher"], isProfileCompleted: true, createdAt: "2026-01-01T00:00:00Z" }], meta: { page: 1, limit: 25, total: 1, totalPages: 1 } },
    });

    render(<EmployeeListWorkspace tenantId="tenant-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Thao tác cho Teacher One" }));
    fireEvent.click(screen.getByText("Gán nhóm quyền"));
    fireEvent.mouseDown(screen.getByLabelText("Nhóm quyền"));
    fireEvent.click(screen.getByText("it_operator"));
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận gán quyền" }));

    await waitFor(() => expect(roles).toHaveBeenCalledWith({ userId: "user-1", roles: ["lms_teacher", "it_operator"] }));
  });

  test("renders security warning with platform and risk code", () => {
    hooks.useEmployeeSecurityEvents.mockReturnValue({
      isPending: false,
      isError: false,
      data: { items: [{ id: "event-1", eventType: "RAPID_SESSION_REPLACEMENT", severity: "HIGH", platform: "WEB_DESKTOP", result: "WARNING", riskCode: "RAPID_SESSION_REPLACEMENT", metadata: {}, occurredAt: "2026-07-15T08:05:00Z" }] },
    });
    render(<EmployeeSecurityTimeline tenantId="tenant-1" userId="user-1" />);

    expect(screen.getByText("RAPID_SESSION_REPLACEMENT")).toBeInTheDocument();
    expect(screen.getByText(/WEB_DESKTOP/)).toBeInTheDocument();
    expect(screen.getByText("WARNING")).toBeInTheDocument();
  });

  test("renders a dedicated unified employee access log with identity and warning context", () => {
    hooks.useEmployeeSecurityFeed.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        page: 1,
        limit: 50,
        total: 1,
        totalPages: 1,
        items: [{
          id: "event-1",
          sourceType: "SECURITY_EVENT",
          eventType: "RAPID_SESSION_REPLACEMENT",
          tenantId: "tenant-1",
          userId: "teacher-1",
          userName: "Nguyễn Văn Giáo Viên",
          userEmail: "teacher@erg.edu.vn",
          severity: "HIGH",
          platform: "WEB_DESKTOP",
          result: "WARNING",
          riskCode: "RAPID_SESSION_REPLACEMENT",
          ipAddress: "10.0.0.12",
          metadata: {},
          occurredAt: "2026-07-15T08:05:00Z",
        }],
      },
    });

    render(<EmployeeAccessLogWorkspace tenantId="tenant-1" />);

    expect(screen.getByText("Nguyễn Văn Giáo Viên")).toBeInTheDocument();
    expect(screen.getByText("RAPID_SESSION_REPLACEMENT")).toBeInTheDocument();
    expect(screen.getByText(/WEB_DESKTOP/)).toBeInTheDocument();
    expect(screen.getByText(/10\.0\.0\.12/)).toBeInTheDocument();
  });

  test("edits basic and professional employee information from the detail drawer", async () => {
    const update = vi.fn().mockResolvedValue({});
    hooks.useEmployeeCommands.mockReturnValue({
      create: { mutateAsync: vi.fn(), isPending: false }, update: { mutateAsync: update, isPending: false },
      status: { mutateAsync: vi.fn(), isPending: false }, roles: { mutateAsync: vi.fn(), isPending: false },
      resetCredential: { mutateAsync: vi.fn(), isPending: false }, revokeSession: { mutateAsync: vi.fn(), isPending: false },
    });
    hooks.useEmployeeDetail.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        account: { user: { id: "user-1", fullName: "Teacher One", email: "teacher@erg.edu.vn", phone: "0909", status: "ACTIVE", roles: ["lms_teacher"] }, sessions: [] },
        profile: { id: "profile-1", userId: "user-1", tenantId: "tenant-1", employeeCode: "GV-001", jobTitle: "Teacher", emergencyContact: {} },
      },
    });

    render(<EmployeeDetailDrawer tenantId="tenant-1" userId="user-1" onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Chỉnh sửa hồ sơ" }));
    fireEvent.change(screen.getByLabelText("Họ và tên"), { target: { value: "Teacher Updated" } });
    fireEvent.change(screen.getByLabelText("Chức danh"), { target: { value: "Senior Teacher" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu hồ sơ" }));

    await waitFor(() => expect(update).toHaveBeenCalledWith({
      userId: "user-1",
      payload: expect.objectContaining({
        fullName: "Teacher Updated",
        profile: expect.objectContaining({ employeeCode: "GV-001", jobTitle: "Senior Teacher" }),
      }),
    }));
  });
});
