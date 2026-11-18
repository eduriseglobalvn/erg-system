import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { TeacherOnboardingWorkspace } from "@/platform/auth/components/teacher-onboarding-workspace";
import { requiresTeacherOnboarding, type TeacherAccountLifecycle } from "@/platform/auth/types/account-lifecycle";

function lifecycle(overrides: Partial<TeacherAccountLifecycle> = {}): TeacherAccountLifecycle {
  return {
    status: "ACTIVE",
    isProfileCompleted: true,
    recoveryEmailMasked: null,
    recoveryEmailVerified: false,
    mustChangePassword: false,
    nextSteps: [],
    ...overrides,
  };
}

describe("requiresTeacherOnboarding", () => {
  test("only a pending password change gates the account", () => {
    expect(requiresTeacherOnboarding(lifecycle({ mustChangePassword: true }))).toBe(true);
    expect(requiresTeacherOnboarding(lifecycle({ nextSteps: ["CHANGE_PASSWORD"] }))).toBe(true);
    expect(requiresTeacherOnboarding(lifecycle({ status: "FIRST_LOGIN_RESTRICTED", nextSteps: ["COMPLETE_PROFILE", "VERIFY_RECOVERY_EMAIL"] }))).toBe(false);
    expect(requiresTeacherOnboarding(null)).toBe(false);
  });
});

describe("teacher onboarding workspace", () => {
  test("asks only for the password and completes once it no longer must change, even if the old BE still lists other steps", async () => {
    const onChangePassword = vi.fn().mockResolvedValue({
      lifecycle: lifecycle({ status: "FIRST_LOGIN_RESTRICTED", nextSteps: ["COMPLETE_PROFILE", "VERIFY_RECOVERY_EMAIL"] }),
      revokedSessions: 2,
    });
    const onComplete = vi.fn();
    render(<TeacherOnboardingWorkspace onChangePassword={onChangePassword} onComplete={onComplete} onLogout={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Đổi mật khẩu lần đầu" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Số điện thoại")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Mật khẩu tạm thời"), { target: { value: "Temporary@123" } });
    fireEvent.change(screen.getByLabelText("Mật khẩu mới"), { target: { value: "NewPassword@123" } });
    fireEvent.change(screen.getByLabelText("Xác nhận mật khẩu mới"), { target: { value: "NewPassword@123" } });
    fireEvent.click(screen.getByRole("button", { name: "Hoàn tất thiết lập" }));

    await waitFor(() => expect(onChangePassword).toHaveBeenCalledWith({ currentPassword: "Temporary@123", newPassword: "NewPassword@123" }));
    await waitFor(() => expect(onComplete).toHaveBeenCalled());
  });
});
