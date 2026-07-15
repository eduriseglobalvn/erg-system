import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { TeacherOnboardingWorkspace } from "@/platform/auth/components/teacher-onboarding-workspace";
import type { TeacherAccountLifecycle } from "@/platform/auth/types/account-lifecycle";
import type { TeacherAccount } from "@/platform/auth/types/auth-types";

const account = {
  id: "teacher-1",
  fullName: "Nguyễn An",
  email: "teacher@erg.edu.vn",
  phone: "",
} as TeacherAccount;

function lifecycle(nextSteps: TeacherAccountLifecycle["nextSteps"]): TeacherAccountLifecycle {
  return {
    status: nextSteps.length ? "FIRST_LOGIN_RESTRICTED" : "ACTIVE",
    isProfileCompleted: !nextSteps.includes("COMPLETE_PROFILE"),
    recoveryEmailMasked: nextSteps.includes("VERIFY_RECOVERY_EMAIL") ? null : "r***@erg.edu.vn",
    recoveryEmailVerified: !nextSteps.includes("VERIFY_RECOVERY_EMAIL"),
    mustChangePassword: nextSteps.includes("CHANGE_PASSWORD"),
    nextSteps,
  };
}

describe("teacher onboarding workspace", () => {
  test("resumes from backend nextSteps instead of restarting the profile step", () => {
    render(
      <TeacherOnboardingWorkspace
        account={account}
        lifecycle={lifecycle(["VERIFY_RECOVERY_EMAIL", "CHANGE_PASSWORD"])}
        onChangePassword={vi.fn()}
        onComplete={vi.fn()}
        onLogout={vi.fn()}
        onRequestRecovery={vi.fn()}
        onUpdateProfile={vi.fn()}
        onVerifyRecovery={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "Xác minh email khôi phục" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Số điện thoại")).not.toBeInTheDocument();
  });

  test("advances only when the backend returns updated lifecycle nextSteps", async () => {
    const onUpdateProfile = vi.fn().mockResolvedValue({
      ...account,
      phone: "0909000111",
      lifecycle: lifecycle(["VERIFY_RECOVERY_EMAIL", "CHANGE_PASSWORD"]),
    });

    render(
      <TeacherOnboardingWorkspace
        account={account}
        lifecycle={lifecycle(["COMPLETE_PROFILE", "VERIFY_RECOVERY_EMAIL", "CHANGE_PASSWORD"])}
        onChangePassword={vi.fn()}
        onComplete={vi.fn()}
        onLogout={vi.fn()}
        onRequestRecovery={vi.fn()}
        onUpdateProfile={onUpdateProfile}
        onVerifyRecovery={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Lưu và tiếp tục" }));
    expect(await screen.findByText("Vui lòng nhập số điện thoại.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Số điện thoại"), { target: { value: "0909000111" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu và tiếp tục" }));

    await waitFor(() => expect(onUpdateProfile).toHaveBeenCalledWith({ fullName: "Nguyễn An", phone: "0909000111" }));
    expect(await screen.findByRole("heading", { name: "Xác minh email khôi phục" })).toBeInTheDocument();
  });

  test("verifies recovery email then changes the temporary password", async () => {
    const onRequestRecovery = vi.fn().mockResolvedValue({
      challengeId: "challenge-1",
      maskedEmail: "r***@erg.edu.vn",
      expiresAt: "2026-07-14T12:00:00Z",
      retryAfterSeconds: 60,
    });
    const onVerifyRecovery = vi.fn().mockResolvedValue({
      verified: true,
      lifecycle: lifecycle(["CHANGE_PASSWORD"]),
    });
    const onChangePassword = vi.fn().mockResolvedValue({ lifecycle: lifecycle([]), revokedSessions: 2 });
    const onComplete = vi.fn();

    render(
      <TeacherOnboardingWorkspace
        account={account}
        lifecycle={lifecycle(["VERIFY_RECOVERY_EMAIL", "CHANGE_PASSWORD"])}
        onChangePassword={onChangePassword}
        onComplete={onComplete}
        onLogout={vi.fn()}
        onRequestRecovery={onRequestRecovery}
        onUpdateProfile={vi.fn()}
        onVerifyRecovery={onVerifyRecovery}
      />,
    );

    fireEvent.change(screen.getByLabelText("Email khôi phục"), { target: { value: "recovery@erg.edu.vn" } });
    fireEvent.click(screen.getByRole("button", { name: "Gửi mã xác minh" }));
    await screen.findByLabelText("Mã xác minh");
    fireEvent.change(screen.getByLabelText("Mã xác minh"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Xác minh" }));

    await screen.findByRole("heading", { name: "Đổi mật khẩu lần đầu" });
    fireEvent.change(screen.getByLabelText("Mật khẩu tạm thời"), { target: { value: "Temporary@123" } });
    fireEvent.change(screen.getByLabelText("Mật khẩu mới"), { target: { value: "NewPassword@123" } });
    fireEvent.change(screen.getByLabelText("Xác nhận mật khẩu mới"), { target: { value: "NewPassword@123" } });
    fireEvent.click(screen.getByRole("button", { name: "Hoàn tất onboarding" }));

    await waitFor(() => expect(onChangePassword).toHaveBeenCalledWith({ currentPassword: "Temporary@123", newPassword: "NewPassword@123" }));
    expect(onComplete).toHaveBeenCalled();
  });
});
