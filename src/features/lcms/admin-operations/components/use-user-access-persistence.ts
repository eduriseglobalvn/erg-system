import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

import {
  saveUserAccess,
  type AccessManagedUser,
  type AccessScopeOption,
  type EffectiveAccess,
  type UserAccessPolicy,
} from "@/features/lcms/admin-operations/api/access-management-api";
import { createTeacherAccount } from "@/features/lcms/admin-operations/api/teacher-account-api";
import {
  assignAdminUserRoles,
  updateAdminUserProfile,
  updateAdminUserStatus,
  type AdminUserDetail,
  type AdminUserStatus,
} from "@/features/lcms/admin-operations/api/user-admin-api";
import type { DraftPolicy, ProfileDraft } from "@/features/lcms/admin-operations/types/user-access-control";
import { mergeDraftPolicy, policyFromDraft, sortUsers } from "@/features/lcms/admin-operations/utils/user-access-control-utils";
import { queryKeys } from "@/lib/query-keys";

type Params = {
  accountId: string;
  applyUserDetail: (detail: AdminUserDetail) => void;
  draft: DraftPolicy;
  policies: UserAccessPolicy[];
  profileDraft: ProfileDraft;
  rootAdmin: boolean;
  roleDraft: string[];
  scopeResults: AccessScopeOption[];
  selectedUserId: string;
  setEffective: (effective: EffectiveAccess) => void;
  setError: (message: string) => void;
  setNotice: (message: string) => void;
  setPolicies: (policies: UserAccessPolicy[]) => void;
  setUsers: (update: (current: AccessManagedUser[]) => AccessManagedUser[]) => void;
  tenantId: string;
};

/** Save actions of the access-control workspace. Each one handles its own failure, so callers may fire-and-forget. */
export function useUserAccessPersistence(p: Params) {
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingRoles, setSavingRoles] = useState(false);
  const [savingAccess, setSavingAccess] = useState(false);

  const profileMutation = useMutation({
    mutationFn: ({ userId, draft }: { userId: string; draft: ProfileDraft }) => updateAdminUserProfile(userId, draft),
  });
  const rolesMutation = useMutation({
    mutationFn: ({ userId, roles }: { userId: string; roles: string[] }) => assignAdminUserRoles(userId, roles),
  });
  const statusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: AdminUserStatus }) => updateAdminUserStatus(userId, status),
  });
  const accessMutation = useMutation({
    mutationFn: ({ userId, policies }: { userId: string; policies: UserAccessPolicy[] }) => saveUserAccess(userId, { policies }),
  });
  const provisionTeacherMutation = useMutation({
    mutationKey: queryKeys.adminOperations.userAccess.provision(p.tenantId, p.accountId),
    mutationFn: createTeacherAccount,
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

  async function persistPolicies() {
    if (!p.selectedUserId) return;
    setSavingAccess(true);
    p.setError("");
    p.setNotice("");
    try {
      const nextPolicies = mergeDraftPolicy(p.policies, policyFromDraft(p.draft, p.scopeResults));
      const detail = await accessMutation.mutateAsync({ userId: p.selectedUserId, policies: nextPolicies });
      p.setPolicies(detail.policies);
      p.setEffective(detail.effective);
      p.setUsers((current) => sortUsers(current.map((user) => (user.id === detail.user.id ? detail.user : user))));
      p.setNotice("Đã cập nhật phân quyền truy cập thành công.");
    } catch (err) {
      p.setError(err instanceof Error ? err.message : "Không thể lưu phân quyền truy cập.");
    } finally {
      setSavingAccess(false);
    }
  }

  return {
    persistPolicies,
    persistProfile,
    persistRoles,
    persistStatus,
    provisionTeacher: provisionTeacherMutation.mutateAsync,
    savingAccess,
    savingProfile,
    savingRoles,
  };
}
