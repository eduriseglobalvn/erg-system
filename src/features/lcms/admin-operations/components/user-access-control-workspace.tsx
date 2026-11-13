import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { QUERY_POLICIES } from "@/lib/query-policy";

import {
  AccessSectionUnsupported,
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
import { useUserAccessPersistence } from "@/features/lcms/admin-operations/components/use-user-access-persistence";
import {
  listAccessManagedUsers,
  type AccessManagedUser,
} from "@/features/lcms/admin-operations/api/access-management-api";
import { getEffectivePermissions } from "@/features/access-management/api/access-management-api";
import { getAdminUser, type AdminUserDetail } from "@/features/lcms/admin-operations/api/user-admin-api";
import type { ProfileDraft, WorkspaceSection } from "@/features/lcms/admin-operations/types/user-access-control";
import {
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
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUserDetail, setSelectedUserDetail] = useState<AdminUserDetail | null>(null);
  const [effectivePermissions, setEffectivePermissions] = useState<string[] | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [activeSection, setActiveSection] = useState<WorkspaceSection>(defaultSection);
  const [profileDraft, setProfileDraft] = useState<ProfileDraft>(EMPTY_PROFILE_DRAFT);
  const [roleDraft, setRoleDraft] = useState<string[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [retryToken, setRetryToken] = useState(0);
  const debouncedQuery = useDebouncedValue(query);
  const paceStateUpdate = usePacedStateBatch();

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

    queryClient
      .fetchQuery({
        queryKey: queryKeys.adminOperations.userAccess.users(debouncedQuery, status, tenantId, accountId),
        queryFn: ({ signal }) => listAccessManagedUsers({ search: debouncedQuery, status, page: 1, limit: 100 }, signal),
        staleTime: QUERY_POLICIES.reference.staleTime,
      })
      .then((userList) => {
        if (cancelled) return;

        const sortedUsers = sortUsers(userList.items);
        setUsers(sortedUsers);
        setSelectedUserId((current) => current || sortedUsers[0]?.id || "");
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
        setEffectivePermissions(null);
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
        queryFn: ({ signal }) => getEffectivePermissions(selectedUserId, signal),
        staleTime: QUERY_POLICIES.reference.staleTime,
      }),
      queryClient.fetchQuery({
        queryKey: queryKeys.adminOperations.userAccess.detailUser(selectedUserId, tenantId, accountId),
        queryFn: ({ signal }) => getAdminUser(selectedUserId, signal),
        staleTime: QUERY_POLICIES.reference.staleTime,
      }),
    ])
      .then(([effective, userDetail]) => {
        if (cancelled) return;

        setEffectivePermissions(effective.effective_permissions ?? []);
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

  const selectedListUser = users.find((user) => user.id === selectedUserId);
  const selectedUser = selectedUserId ? mergeUser(selectedListUser, selectedUserDetail) : null;
  const superAdmin = isSuperAdmin(selectedUser);
  const rootAdmin = isRootAdmin(selectedUser);
  const hasLoadError = Boolean(error && !loadingUsers && users.length === 0);

  const {
    persistProfile,
    persistRoles,
    persistStatus,
    savingProfile,
    savingRoles,
  } = useUserAccessPersistence({
    applyUserDetail,
    profileDraft,
    rootAdmin,
    roleDraft,
    selectedUserId,
    setError,
    setNotice,
  });

  function retryLoadUsers() {
    void queryClient.invalidateQueries({ queryKey: queryKeys.adminOperations.userAccess.users(debouncedQuery, status, tenantId, accountId) });
    setRetryToken((current) => current + 1);
  }

  function applyUserDetail(userDetail: AdminUserDetail) {
    setSelectedUserDetail(userDetail);
    setProfileDraft(profileDraftFromDetail(userDetail));
    setRoleDraft(userDetail.roles ?? []);
    setUsers((current) => mergeDetailIntoUsers(current, userDetail));
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
        hasLoadError ? "" : "flex min-h-full flex-col",
      )}
    >
      <UserAccessHeader
        error={hasLoadError ? "" : error}
        notice={notice}
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
                effectivePermissions={effectivePermissions}
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

                {activeSection === "access" && <AccessSectionUnsupported />}
              </div>
            </div>
          )}
        </main>
      </div>
      )}
    </div>
  );
}
