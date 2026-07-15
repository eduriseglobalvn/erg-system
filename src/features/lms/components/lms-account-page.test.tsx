import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  updateProfile: vi.fn(),
  requestRecovery: vi.fn(),
  verifyRecovery: vi.fn(),
  changePassword: vi.fn(),
  saveCurrentAccount: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/platform/auth/api/account-security-api", () => ({
  updateMyTeacherProfile: mocks.updateProfile,
  requestRecoveryEmailChallenge: mocks.requestRecovery,
  verifyRecoveryEmailChallenge: mocks.verifyRecovery,
  changeMyPassword: mocks.changePassword,
}));

vi.mock("@/platform/auth/api/auth-storage", () => ({
  logoutAccount: vi.fn(),
  saveCurrentAccount: mocks.saveCurrentAccount,
}));

vi.mock("@/platform/auth/hooks/use-auth-session", () => ({
  useAuthSession: () => ({
    account: {
      id: "teacher-1",
      fullName: "Nguyễn An",
      email: "teacher@erg.edu.vn",
      phone: "",
      role: "teacher",
      title: "Giáo viên",
      status: "ACTIVE",
      lifecycle: { recoveryEmailMasked: "r***@erg.edu.vn", recoveryEmailVerified: true },
    },
    session: {
      permissions: ["lms.grade.read", "account.self.update", "account.self.password.change"],
      deniedPermissions: [],
    },
    actions: { signOut: mocks.signOut },
  }),
}));

import { LmsAccountPage } from "@/features/lms/components/lms-account-page";

describe("LMS account self-service", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
  });

  test("updates the phone through the account security API", async () => {
    mocks.updateProfile.mockResolvedValueOnce({ id: "teacher-1", fullName: "Nguyễn An", phone: "0909000111" });
    render(<LmsAccountPage onLoginLogs={vi.fn()} onSignedOut={vi.fn()} />);

    expect(screen.getByText("Chưa cập nhật")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cập nhật số điện thoại" }));
    fireEvent.change(screen.getByLabelText("Số điện thoại"), { target: { value: "0909000111" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu số điện thoại" }));

    await waitFor(() => expect(mocks.updateProfile).toHaveBeenCalledWith({ fullName: "Nguyễn An", phone: "0909000111" }));
    expect(mocks.saveCurrentAccount).toHaveBeenCalled();
  });

  test("changes the password through the account security API", async () => {
    mocks.changePassword.mockResolvedValueOnce({ revokedSessions: 1 });
    render(<LmsAccountPage onLoginLogs={vi.fn()} onSignedOut={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Đổi mật khẩu" }));
    fireEvent.change(screen.getByLabelText("Mật khẩu hiện tại"), { target: { value: "CurrentPassword@1" } });
    fireEvent.change(screen.getByLabelText("Mật khẩu mới"), { target: { value: "NewPassword@123" } });
    fireEvent.change(screen.getByLabelText("Xác nhận mật khẩu mới"), { target: { value: "NewPassword@123" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu mật khẩu mới" }));

    await waitFor(() => expect(mocks.changePassword).toHaveBeenCalledWith({ currentPassword: "CurrentPassword@1", newPassword: "NewPassword@123" }));
  });

  test("renders capabilities from effective permissions instead of hard-coded badges", () => {
    render(<LmsAccountPage onLoginLogs={vi.fn()} onSignedOut={vi.fn()} />);

    expect(screen.getByText("Bảng điểm")).toBeInTheDocument();
    expect(screen.queryByText("Điểm danh")).not.toBeInTheDocument();
    expect(screen.queryByText("Bài tập")).not.toBeInTheDocument();
  });
});
