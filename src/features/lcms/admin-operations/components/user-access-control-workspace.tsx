import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { QUERY_POLICIES } from "@/lib/query-policy";

import {
  AccessSection,
  EmptyBlock,
  MemberDetailHeader,
  ProfileSection,
  RolesSection,
} from "@/features/lcms/admin-operations/components/user-access-control-sections";
import {
  UserAccessHeader,
  UserAccessMemberList,
  UserAccessSectionTabs,
} from "@/features/lcms/admin-operations/components/user-access-control-panels";
import { UserAccessErrorState } from "@/features/lcms/admin-operations/components/user-access-error-state";
import { useAccessScopeResults } from "@/features/lcms/admin-operations/components/use-access-scope-results";
import { useEffectiveAccessPreview } from "@/features/lcms/admin-operations/components/use-effective-access-preview";
import { useUserAccessPersistence } from "@/features/lcms/admin-operations/components/use-user-access-persistence";
import {
  getAccessManagementOptions,
  getUserAccess,
  listAccessManagedUsers,
  type AccessManagementOptions,
  type AccessManagedUser,
  type AccessScopeType,
  type EffectiveAccess,
  type UserAccessPolicy,
} from "@/features/lcms/admin-operations/api/access-management-api";
import { type CreateTeacherAccountResponse } from "@/features/lcms/admin-operations/api/teacher-account-api";
import { CreateTeacherAccountDialog } from "@/features/lcms/admin-operations/components/create-teacher-account-dialog";
import { getAdminUser, type AdminUserDetail } from "@/features/lcms/admin-operations/api/user-admin-api";
import type { DraftPolicy, ProfileDraft, WorkspaceSection } from "@/features/lcms/admin-operations/types/user-access-control";
import {
  blankDraft,
  EMPTY_PROFILE_DRAFT,
  isRootAdmin,
  isSuperAdmin,
  mergeDetailIntoUsers,
  mergeUser,
  profileDraftFromDetail,
  sortUsers,
} from "@/features/lcms/admin-operations/utils/user-access-control-utils";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePacedStateBatch } from "@/hooks/use-paced-state-batch";
import { cn } from "@/lib/utils";
import { getCurrentAccountId } from "@/platform/auth/api/auth-storage";

export function UserAccessControlWorkspace({
  defaultSection = "profile",
  scopeDescription,
}: {
  defaultSection?: WorkspaceSection;
  scopeDescription?: string;
}) {
  const queryClient = useQueryClient();
  const tenantId = getDefaultTenantId();
  const accountId = getCurrentAccountId("lcms");
  const [users, setUsers] = useState<AccessManagedUser[]>([]);
  const [options, setOptions] = useState<AccessManagementOptions | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUserDetail, setSelectedUserDetail] = useState<AdminUserDetail | null>(null);
  const [policies, setPolicies] = useState<UserAccessPolicy[]>([]);
  const [effective, setEffective] = useState<EffectiveAccess | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [activeSection, setActiveSection] = useState<WorkspaceSection>(defaultSection);
  const [draft, setDraft] = useState<DraftPolicy>(blankDraft);
  const [profileDraft, setProfileDraft] = useState<ProfileDraft>(EMPTY_PROFILE_DRAFT);
  const [roleDraft, setRoleDraft] = useState<string[]>([]);
  const [scopeSearch, setScopeSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [retryToken, setRetryToken] = useState(0);
  const [createTeacherDialogOpen, setCreateTeacherDialogOpen] = useState(false);
  const debouncedQuery = useDebouncedValue(query);
  const debouncedScopeSearch = useDebouncedValue(scopeSearch);
  const paceStateUpdate = usePacedStateBatch();

  const { loadingScopes, scopeResults, scopeTotal } = useAccessScopeResults({
    accountId,
    onError: setError,
    scopeType: draft.scopeType,
    search: debouncedScopeSearch,
    tenantId,
  });


  useEffect(() => {
    paceStateUpdate(() => setActiveSection(defaultSection));
  }, [defaultSection, paceStateUpdate]);

  useEffect(() => {
    let cancelled = false;
    paceStateUpdate(() => {
      if (cancelled) return;
      setLoadingUsers(true);
      setError("");
    });

    Promise.all([
      queryClient.fetchQuery({
        queryKey: queryKeys.adminOperations.userAccess.users(debouncedQuery, status, tenantId, accountId),
        queryFn: ({ signal }) => listAccessManagedUsers({ search: debouncedQuery, status, page: 1, limit: 100 }, signal),
        staleTime: QUERY_POLICIES.reference.staleTime,
      }),
      queryClient.fetchQuery({
        queryKey: queryKeys.adminOperations.userAccess.options(tenantId, accountId),
        queryFn: ({ signal }) => getAccessManagementOptions(signal),
        staleTime: QUERY_POLICIES.reference.staleTime,
      }),
    ])
      .then(([userList, accessOptions]) => {
        if (cancelled) return;

        const sortedUsers = sortUsers(userList.items);
        setUsers(sortedUsers);
        setOptions(accessOptions);
        setSelectedUserId((current) => current || sortedUsers[0]?.id || "");
        setDraft(blankDraft());
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Không thể tải danh sách thành viên.");
      })
      .finally(() => {
        if (!cancelled) setLoadingUsers(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accountId, debouncedQuery, paceStateUpdate, queryClient, retryToken, status, tenantId]);

  useEffect(() => {
    if (!selectedUserId) {
      paceStateUpdate(() => {
        setSelectedUserDetail(null);
        setPolicies([]);
        setEffective(null);
        setProfileDraft(EMPTY_PROFILE_DRAFT);
        setRoleDraft([]);
      });
      return;
    }

    let cancelled = false;
    paceStateUpdate(() => {
      if (cancelled) return;
      setLoadingDetail(true);
      setError("");
      setNotice("");
    });

    Promise.all([
      queryClient.fetchQuery({
        queryKey: queryKeys.adminOperations.userAccess.detailAccess(selectedUserId, tenantId, accountId),
        queryFn: ({ signal }) => getUserAccess(selectedUserId, signal),
        staleTime: QUERY_POLICIES.reference.staleTime,
      }),
      queryClient.fetchQuery({
        queryKey: queryKeys.adminOperations.userAccess.detailUser(selectedUserId, tenantId, accountId),
        queryFn: ({ signal }) => getAdminUser(selectedUserId, signal),
        staleTime: QUERY_POLICIES.reference.staleTime,
      }),
    ])
      .then(([accessDetail, userDetail]) => {
        if (cancelled) return;

        setPolicies(accessDetail.policies);
        setEffective(accessDetail.effective);
        setOptions((current) => current ?? accessDetail.assignable);
        applyUserDetail(userDetail);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Không thể tải chi tiết thành viên.");
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accountId, paceStateUpdate, queryClient, selectedUserId, tenantId]);

  useEffectiveAccessPreview({
    accountId,
    modules: options?.modules,
    policies,
    selectedUserDetail,
    selectedUserId,
    setEffective,
    tenantId,
    users,
  });

  const selectedListUser = users.find((user) => user.id === selectedUserId);
  const selectedUser = selectedUserId ? mergeUser(selectedListUser, selectedUserDetail) : null;
  const assignableRoles = useMemo(
    () => (draft.scopeType ? (options?.roleGroups ?? []).filter((role) => role.scopeTypes.includes(draft.scopeType as AccessScopeType)) : []),
    [draft.scopeType, options?.roleGroups],
  );
  const scopeOptions = draft.scopeType ? scopeResults : [];
  const superAdmin = isSuperAdmin(selectedUser);
  const rootAdmin = isRootAdmin(selectedUser);
  const hasLoadError = Boolean(error && !loadingUsers && users.length === 0);

  const {
    persistPolicies,
    persistProfile,
    persistRoles,
    persistStatus,
    provisionTeacher,
    savingAccess,
    savingProfile,
    savingRoles,
  } = useUserAccessPersistence({
    accountId,
    applyUserDetail,
    draft,
    policies,
    profileDraft,
    rootAdmin,
    roleDraft,
    scopeResults,
    selectedUserId,
    setEffective,
    setError,
    setNotice,
    setPolicies,
    setUsers,
    tenantId,
  });

  function retryLoadUsers() {
    void queryClient.invalidateQueries({ queryKey: queryKeys.adminOperations.userAccess.users(debouncedQuery, status, tenantId, accountId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.adminOperations.userAccess.options(tenantId, accountId) });
    setRetryToken((current) => current + 1);
  }

  function handleTeacherCreated(response: CreateTeacherAccountResponse) {
    setSelectedUserId(response.user.id);
    setNotice("Tài khoản giáo viên đã được tạo. Trạng thái onboarding sẽ do backend quản lý.");
    void queryClient.invalidateQueries({ queryKey: queryKeys.adminOperations.userAccess.users(debouncedQuery, status, tenantId, accountId) });
    setRetryToken((current) => current + 1);
  }

  function applyUserDetail(userDetail: AdminUserDetail) {
    setSelectedUserDetail(userDetail);
    setProfileDraft(profileDraftFromDetail(userDetail));
    setRoleDraft(userDetail.roles ?? []);
    setUsers((current) => mergeDetailIntoUsers(current, userDetail));
  }

  function updateDraftScopeType(scopeType: AccessScopeType) {
    if (!options) return;
    setScopeSearch("");
    setDraft({ ...blankDraft(), scopeType });
  }

  function addPolicy() {
    if (!draft.scopeType || !draft.scopeId || !draft.roleGroup || draft.modules.length === 0) return;
    const scopeType = draft.scopeType;
    const scope = scopeResults.find((item) => item.scopeType === scopeType && item.scopeId === draft.scopeId);
    setPolicies((current) => [
      ...current.filter((policy) => !(policy.scopeType === scopeType && policy.scopeId === draft.scopeId)),
      {
        scopeType,
        scopeId: draft.scopeId,
        scopeName: scope?.name,
        roleGroup: draft.roleGroup,
        modules: draft.modules,
      },
    ]);
    setNotice("Đã thêm cấu hình quyền vào bản nháp. Hãy bấm 'Lưu phân quyền' để áp dụng chính thức.");
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
        hasLoadError ? "" : "flex min-h-full flex-col",
      )}
    >
      <UserAccessHeader
        canCreateTeacher={Boolean(options)}
        error={hasLoadError ? "" : error}
        notice={notice}
        onCreateTeacher={() => setCreateTeacherDialogOpen(true)}
        scopeDescription={scopeDescription}
        users={users}
      />

      {hasLoadError ? (
        <div className="border-t border-slate-200 bg-white p-6">
          <UserAccessErrorState message={error} onRetry={retryLoadUsers} />
        </div>
      ) : (
      <div className="grid min-h-[560px] flex-1 lg:grid-cols-[340px_minmax(0,1fr)]">
        <UserAccessMemberList
          hasLoadError={hasLoadError}
          loadingUsers={loadingUsers}
          onQueryChange={setQuery}
          onSelect={setSelectedUserId}
          onStatusChange={setStatus}
          query={query}
          selectedUserId={selectedUserId}
          status={status}
          users={users}
        />

        <main className="min-w-0 bg-white">
          {!selectedUser ? (
            <div className="grid min-h-[360px] place-items-center p-8">
              {hasLoadError ? (
                <UserAccessErrorState message={error} onRetry={retryLoadUsers} />
              ) : (
                <EmptyBlock label="Chọn một thành viên từ danh sách bên trái để cấu hình chi tiết." />
              )}
            </div>
          ) : (
            <div className="p-6 space-y-6">
              <MemberDetailHeader
                user={selectedUser}
                effective={effective}
                loading={loadingDetail}
                rootAdmin={rootAdmin}
                superAdmin={superAdmin}
                onActivate={() => void persistStatus("ACTIVE")}
                onDeactivate={() => void persistStatus("INACTIVE")}
                onBan={() => void persistStatus("BANNED")}
                onBlock={() => void persistStatus("BLOCKED")}
              />

              <UserAccessSectionTabs active={activeSection} onChange={setActiveSection} />

              <div className="mt-4 pb-12">
                {activeSection === "profile" && (
                  <ProfileSection
                    draft={profileDraft}
                    user={selectedUser}
                    saving={savingProfile}
                    onChange={setProfileDraft}
                    onSave={() => void persistProfile()}
                  />
                )}

                {activeSection === "roles" && (
                  <RolesSection
                    currentRoles={roleDraft}
                    rootAdmin={rootAdmin}
                    saving={savingRoles}
                    onChange={setRoleDraft}
                    onSave={() => void persistRoles()}
                  />
                )}

                {activeSection === "access" && (
                  <AccessSection
                    draft={draft}
                    effective={effective}
                    loading={loadingDetail}
                    loadingScopes={loadingScopes}
                    modules={options?.modules ?? []}
                    policies={policies}
                    roleGroups={options?.roleGroups ?? []}
                    scopeOptions={scopeOptions}
                    scopeSearch={scopeSearch}
                    scopeTotal={scopeTotal}
                    assignableRoles={assignableRoles}
                    saving={savingAccess}
                    onAddPolicy={addPolicy}
                    onDraftChange={setDraft}
                    onRemovePolicy={(index) => setPolicies((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                    onSave={() => void persistPolicies()}
                    onScopeSearchChange={setScopeSearch}
                    onScopeTypeChange={updateDraftScopeType}
                  />
                )}
              </div>
            </div>
          )}
        </main>
      </div>
      )}
      <CreateTeacherAccountDialog
        open={createTeacherDialogOpen}
        options={options ?? { modules: [], roleGroups: [], scopes: [] }}
        onClose={() => setCreateTeacherDialogOpen(false)}
        onCreated={handleTeacherCreated}
        onProvision={(input) => provisionTeacher(input)}
      />
    </div>
  );
}
