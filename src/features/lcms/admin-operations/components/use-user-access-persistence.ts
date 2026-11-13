import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

import {
  assignAdminUserRoles,
  updateAdminUserProfile,
  updateAdminUserStatus,
  type AdminUserDetail,
  type AdminUserStatus,
} from "@/features/lcms/admin-operations/api/user-admin-api";
import type { ProfileDraft } from "@/features/lcms/admin-operations/types/user-access-control";

type Params = {
  applyUserDetail: (detail: AdminUserDetail) => void;
  profileDraft: ProfileDraft;
  rootAdmin: boolean;
  roleDraft: string[];
  selectedUserId: string;
  setError: (message: string) => void;
  setNotice: (message: string) => void;
};

/** Save actions of the access-control workspace. Each one handles its own failure, so callers may fire-and-forget. */
export function useUserAccessPersistence(p: Params) {
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingRoles, setSavingRoles] = useState(false);

  const profileMutation = useMutation({
    mutationFn: ({ userId, draft }: { userId: string; draft: ProfileDraft }) => updateAdminUserProfile(userId, draft),
  });
  const rolesMutation = useMutation({
    mutationFn: ({ userId, roles }: { userId: string; roles: string[] }) => assignAdminUserRoles(userId, roles),
  });
  const statusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: AdminUserStatus }) => updateAdminUserStatus(userId, status),
  });

  async function persistProfile() {
    if (!p.selectedUserId) return;
    setSavingProfile(true);
    p.setError("");
    p.setNotice("");
    try {
      p.applyUserDetail(await profileMutation.mutateAsync({ userId: p.selectedUserId, draft: p.profileDraft }));
      p.setNotice("Đã cập nhật hồ sơ thành viên thành công.");
    } catch (err) {
      p.setError(err instanceof Error ? err.message : "Không thể cập nhật hồ sơ thành viên.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function persistRoles() {
    if (!p.selectedUserId) return;
    setSavingRoles(true);
    p.setError("");
    p.setNotice("");
    try {
      p.applyUserDetail(await rolesMutation.mutateAsync({ userId: p.selectedUserId, roles: p.roleDraft }));
      p.setNotice("Đã cập nhật vai trò đăng nhập thành công.");
    } catch (err) {
      p.setError(err instanceof Error ? err.message : "Không thể cập nhật vai trò.");
    } finally {
      setSavingRoles(false);
    }
  }

  async function persistStatus(nextStatus: AdminUserStatus) {
    if (!p.selectedUserId || p.rootAdmin) return;
    p.setError("");
    p.setNotice("");
    try {
      p.applyUserDetail(await statusMutation.mutateAsync({ userId: p.selectedUserId, status: nextStatus }));
      p.setNotice(nextStatus === "ACTIVE" ? "Tài khoản đã kích hoạt thành công." : "Trạng thái tài khoản đã thay đổi.");
    } catch (err) {
      p.setError(err instanceof Error ? err.message : "Không thể thay đổi trạng thái tài khoản.");
    }
  }

  return {
    persistProfile,
    persistRoles,
    persistStatus,
    savingProfile,
    savingRoles,
  };
}
