import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProfilePage } from "@/features/profile/components/profile-page";
import { EMPTY_PASSWORD_FORM, EMPTY_PROFILE_FORM } from "@/features/profile/types/profile-types";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  useLocation: () => ({ pathname: "/student/profile", searchStr: "" }),
}));

vi.mock("@/features/profile/hooks/use-profile-page-controller", () => ({
  useProfilePageController: () => ({
    account: null,
    activeTab: "profile",
    avatarUrl: "",
    canChangePassword: false,
    changePassword: vi.fn(),
    completionPercent: 0,
    form: EMPTY_PROFILE_FORM,
    initials: "HS",
    isLoading: false,
    isSavingPassword: false,
    isSavingProfile: false,
    passwordForm: EMPTY_PASSWORD_FORM,
    passwordScore: 0,
    profileNotice: null,
    saveProfile: vi.fn(),
    securityNotice: null,
    setActiveTab: vi.fn(),
    setShowPasswords: vi.fn(),
    showPasswords: false,
    showWorkRoleFields: false,
    update: vi.fn(),
    updatePasswordField: vi.fn(),
  }),
}));

describe("ProfilePage for a student", () => {
  it("has a single save button, no ERG ACCOUNT label and no admin-only fields", () => {
    render(<ProfilePage />);
    expect(screen.getAllByRole("button", { name: "Lưu hồ sơ" })).toHaveLength(1);
    expect(screen.queryByText(/erg account/i)).toBeNull();
    expect(screen.queryByLabelText("Bộ phận")).toBeNull();
    expect(screen.queryByLabelText("Chức danh")).toBeNull();
    expect(screen.queryByText("Bộ phận")).toBeNull();
  });
});
