import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { queryKeys } from "@/lib/query-keys";

import {
  AccessSection,
  Banner,
  EmptyBlock,
  HeaderMetric,
  LoadingBlock,
  MemberDetailHeader,
  MemberRow,
  ProfileSection,
  RolesSection,
} from "@/features/lcms/admin-operations/components/user-access-control-sections";
import { sectionLabels } from "@/features/lcms/admin-operations/constants/user-access-control";
import {
  getAccessManagementOptions,
  getUserAccess,
  listAccessScopes,
  listAccessManagedUsers,
  previewUserAccess,
  saveUserAccess,
  type AccessManagementOptions,
  type AccessManagedUser,
  type AccessScopeOption,
  type AccessScopeType,
  type EffectiveAccess,
  type UserAccessPolicy,
} from "@/features/lcms/admin-operations/api/access-management-api";
import {
  assignAdminUserRoles,
  getAdminUser,
  updateAdminUserProfile,
  updateAdminUserStatus,
  type AdminUserStatus,
  type AdminUserDetail,
} from "@/features/lcms/admin-operations/api/user-admin-api";
import type { DraftPolicy, ProfileDraft, WorkspaceSection } from "@/features/lcms/admin-operations/types/user-access-control";
import {
  blankDraft,
  isRootAdmin,
  isSuperAdmin,
  mergeDraftPolicy,
  mergeUser,
  policyFromDraft,
  sortUsers,
  superAdminEffectiveAccess,
} from "@/features/lcms/admin-operations/utils/user-access-control-utils";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePacedStateBatch } from "@/hooks/use-paced-state-batch";
import { cn } from "@/lib/utils";
import { AppSelect } from "@/components/ui/app-select";

export function UserAccessControlWorkspace({
  defaultSection = "profile",
  scopeDescription,
}: {
  defaultSection?: WorkspaceSection;
  scopeDescription?: string;
}) {
  const queryClient = useQueryClient();
  const [users, setUsers] = useState<AccessManagedUser[]>([]);
  const [options, setOptions] = useState<AccessManagementOptions | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUserDetail, setSelectedUserDetail] = useState<AdminUserDetail | null>(null);
  const [policies, setPolicies] = useState<UserAccessPolicy[]>([]);
  const [effective, setEffective] = useState<EffectiveAccess | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [activeSection, setActiveSection] = useState<WorkspaceSection>(defaultSection);
  const [draft, setDraft] = useState<DraftPolicy>({
    scopeType: "",
    scopeId: "",
    roleGroup: "",
    modules: [],
  });
  const [profileDraft, setProfileDraft] = useState<ProfileDraft>({ fullName: "", phone: "", jobTitle: "", avatarUrl: "", bio: "", gender: "", dateOfBirth: "", address: "", city: "", district: "", region: "" });
  const [roleDraft, setRoleDraft] = useState<string[]>([]);
  const [scopeSearch, setScopeSearch] = useState("");
  const [scopeResults, setScopeResults] = useState<AccessScopeOption[]>([]);
  const [scopeTotal, setScopeTotal] = useState(0);
  const [loadingScopes, setLoadingScopes] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingRoles, setSavingRoles] = useState(false);
  const [savingAccess, setSavingAccess] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const debouncedScopeSearch = useDebouncedValue(scopeSearch);
  const paceStateUpdate = usePacedStateBatch();

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
        queryKey: queryKeys.adminOperations.userAccess.users(debouncedQuery, status),
        queryFn: () => listAccessManagedUsers({ search: debouncedQuery, status, page: 1, limit: 100 }),
        staleTime: 60_000,
      }),
      queryClient.fetchQuery({
        queryKey: queryKeys.adminOperations.userAccess.options(),
        queryFn: getAccessManagementOptions,
        staleTime: 60_000,
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
  }, [debouncedQuery, paceStateUpdate, queryClient, status]);

  useEffect(() => {
    if (!selectedUserId) {
      paceStateUpdate(() => {
        setSelectedUserDetail(null);
        setPolicies([]);
        setEffective(null);
        setProfileDraft({ fullName: "", phone: "", jobTitle: "", avatarUrl: "", bio: "", gender: "", dateOfBirth: "", address: "", city: "", district: "", region: "" });
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
        queryKey: queryKeys.adminOperations.userAccess.detailAccess(selectedUserId),
        queryFn: () => getUserAccess(selectedUserId),
        staleTime: 60_000,
      }),
      queryClient.fetchQuery({
        queryKey: queryKeys.adminOperations.userAccess.detailUser(selectedUserId),
        queryFn: () => getAdminUser(selectedUserId),
        staleTime: 60_000,
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
  }, [paceStateUpdate, queryClient, selectedUserId]);

  useEffect(() => {
    if (!policies.length) {
      const roleSource = selectedUserDetail ?? users.find((user) => user.id === selectedUserId);
      paceStateUpdate(() => {
        setEffective(isSuperAdmin(roleSource) ? superAdminEffectiveAccess(options?.modules) : { highestScope: "none", modules: [], permissions: [] });
      });
      return;
    }

    let cancelled = false;
    queryClient
      .fetchQuery({
        queryKey: queryKeys.adminOperations.userAccess.preview(policies),
        queryFn: () => previewUserAccess({ policies }),
        staleTime: 30_000,
      })
      .then((result) => {
        if (!cancelled) setEffective(result);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [options?.modules, paceStateUpdate, policies, queryClient, selectedUserDetail, selectedUserId, users]);

  useEffect(() => {
    if (!draft.scopeType) {
      paceStateUpdate(() => {
        setScopeResults([]);
        setScopeTotal(0);
      });
      return;
    }

    let cancelled = false;
    paceStateUpdate(() => {
      if (!cancelled) setLoadingScopes(true);
    });
    queryClient
      .fetchQuery({
        queryKey: queryKeys.adminOperations.userAccess.scopes(draft.scopeType, debouncedScopeSearch),
        queryFn: () => listAccessScopes({ scopeType: draft.scopeType, search: debouncedScopeSearch, page: 1, limit: 20 }),
        staleTime: 60_000,
      })
      .then((result) => {
        if (cancelled) return;
        setScopeResults(result.items);
        setScopeTotal(result.total);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Không thể tải phạm vi cấp quyền.");
      })
      .finally(() => {
        if (!cancelled) setLoadingScopes(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedScopeSearch, draft.scopeType, paceStateUpdate, queryClient]);

  const selectedListUser = users.find((user) => user.id === selectedUserId);
  const selectedUser = selectedUserId ? mergeUser(selectedListUser, selectedUserDetail) : null;
  const assignableRoles = useMemo(
    () => (draft.scopeType ? (options?.roleGroups ?? []).filter((role) => role.scopeTypes.includes(draft.scopeType as AccessScopeType)) : []),
    [draft.scopeType, options?.roleGroups],
  );
  const scopeOptions = draft.scopeType ? scopeResults : [];
  const superAdmin = isSuperAdmin(selectedUser);
  const rootAdmin = isRootAdmin(selectedUser);

  function applyUserDetail(userDetail: AdminUserDetail) {
    setSelectedUserDetail(userDetail);
    setProfileDraft({
      fullName: userDetail.fullName ?? "",
      phone: userDetail.phone ?? "",
      jobTitle: userDetail.job_title ?? "",
      avatarUrl: userDetail.avatar_url ?? userDetail.avatarUrl ?? "",
      bio: userDetail.bio ?? "",
      gender: userDetail.gender ?? "",
      dateOfBirth: userDetail.date_of_birth ? userDetail.date_of_birth.slice(0, 10) : "",
      address: userDetail.address ?? "",
      city: userDetail.city ?? "",
      district: userDetail.district ?? "",
      region: userDetail.region ?? "",
    });
    setRoleDraft(userDetail.roles ?? []);
    setUsers((current) =>
      sortUsers(
        current.map((user) =>
          user.id === userDetail.id
            ? {
                ...user,
                fullName: userDetail.fullName,
                phone: userDetail.phone,
                status: userDetail.status,
                roles: userDetail.roles,
                isProfileCompleted: userDetail.isProfileCompleted,
              }
            : user,
        ),
      ),
    );
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
    setNotice("Đã thêm quyền vào bản nháp. Bấm Lưu phân quyền để áp dụng.");
  }

  async function persistProfile() {
    if (!selectedUserId) return;
    setSavingProfile(true);
    setError("");
    setNotice("");
    try {
      applyUserDetail(await profileMutation.mutateAsync({ userId: selectedUserId, draft: profileDraft }));
      setNotice("Đã cập nhật thông tin thành viên.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật thông tin thành viên.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function persistRoles() {
    if (!selectedUserId) return;
    setSavingRoles(true);
    setError("");
    setNotice("");
    try {
      applyUserDetail(await rolesMutation.mutateAsync({ userId: selectedUserId, roles: roleDraft }));
      setNotice("Đã cập nhật vai trò đăng nhập.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật vai trò.");
    } finally {
      setSavingRoles(false);
    }
  }

  async function persistStatus(nextStatus: AdminUserStatus) {
    if (!selectedUserId || rootAdmin) return;
    setError("");
    setNotice("");
    try {
      applyUserDetail(await statusMutation.mutateAsync({ userId: selectedUserId, status: nextStatus }));
      setNotice(nextStatus === "ACTIVE" ? "Tài khoản đã được kích hoạt." : "Tài khoản đã được khóa.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật trạng thái tài khoản.");
    }
  }

  async function persistPolicies() {
    if (!selectedUserId) return;
    setSavingAccess(true);
    setError("");
    setNotice("");
    try {
      const nextPolicies = mergeDraftPolicy(policies, policyFromDraft(draft, scopeResults));
      const detail = await accessMutation.mutateAsync({ userId: selectedUserId, policies: nextPolicies });
      setPolicies(detail.policies);
      setEffective(detail.effective);
      setUsers((current) => sortUsers(current.map((user) => (user.id === detail.user.id ? detail.user : user))));
      setNotice("Đã lưu phân quyền truy cập.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu phân quyền.");
    } finally {
      setSavingAccess(false);
    }
  }

  return (
    <div className="min-h-full overflow-hidden rounded-lg border border-[#e0e4ea] bg-white shadow-sm">
      <header className="border-b border-[#e0e4ea] px-5 py-5 lg:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold text-[var(--erg-blue)]">ERG IAM</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">Quản lý thành viên và quyền truy cập</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Một nơi để xem hồ sơ, trạng thái tài khoản, vai trò đăng nhập và phạm vi LMS của từng thành viên.
            </p>
            {scopeDescription ? <p className="mt-2 text-xs font-semibold text-[var(--erg-blue)]">Phạm vi: {scopeDescription}</p> : null}
          </div>
          <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-[#e0e4ea] bg-[#fafbfc] text-center">
            <HeaderMetric label="Thành viên" value={String(users.length)} />
            <HeaderMetric label="Đang hoạt động" value={String(users.filter((user) => user.status === "ACTIVE").length)} />
            <HeaderMetric label="Chưa onboarding" value={String(users.filter((user) => !user.isProfileCompleted).length)} />
          </div>
        </div>
        {error ? <Banner tone="error">{error}</Banner> : null}
        {notice ? <Banner tone="success">{notice}</Banner> : null}
      </header>

      <div className="grid min-h-[720px] lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 bg-slate-50/60 lg:border-b-0 lg:border-r">
          <div className="space-y-3 border-b border-slate-200 p-4">
            <label className="relative block">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                className="h-9 w-full rounded-md border border-[#d7e0ec] bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue)]/15"
                placeholder="Tìm theo tên, email, số điện thoại"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <AppSelect
              className="h-9 w-full rounded-md border border-[#d7e0ec] bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue)]/15"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Deactive/nghỉ việc</option>
              <option value="BLOCKED">Đã khóa</option>
              <option value="BANNED">Banned</option>
              <option value="PENDING">Chờ kích hoạt</option>
            </AppSelect>
          </div>

          <div className="max-h-[655px] overflow-auto p-3">
            {loadingUsers ? <LoadingBlock label="Đang tải thành viên" /> : null}
            {!loadingUsers && users.length === 0 ? <EmptyBlock label="Chưa có thành viên phù hợp." /> : null}
            {users.map((user) => (
              <MemberRow key={user.id} user={user} active={user.id === selectedUserId} onClick={() => setSelectedUserId(user.id)} />
            ))}
          </div>
        </aside>

        <main className="min-w-0 bg-white">
          {!selectedUser ? (
            <div className="grid min-h-[540px] place-items-center p-8">
              <EmptyBlock label="Chọn một thành viên để xem chi tiết." />
            </div>
          ) : (
            <div className="p-5 lg:p-6">
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

              <div className="mt-5 flex flex-wrap gap-2 border-b border-slate-200">
                {(Object.keys(sectionLabels) as WorkspaceSection[]).map((section) => (
                  <button
                    key={section}
                    className={cn(
                      "relative -mb-px h-11 rounded-t-xl px-4 text-sm font-semibold transition",
                      activeSection === section
                        ? "border-x border-t border-slate-200 bg-white text-slate-950"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                    )}
                    onClick={() => setActiveSection(section)}
                  >
                    {sectionLabels[section]}
                  </button>
                ))}
              </div>

              <div className="mt-5 pb-8">
                {activeSection === "profile" ? (
                  <ProfileSection
                    draft={profileDraft}
                    user={selectedUser}
                    saving={savingProfile}
                    onChange={setProfileDraft}
                    onSave={() => void persistProfile()}
                  />
                ) : null}

                {activeSection === "roles" ? (
                  <RolesSection
                    currentRoles={roleDraft}
                    rootAdmin={rootAdmin}
                    saving={savingRoles}
                    onChange={setRoleDraft}
                    onSave={() => void persistRoles()}
                  />
                ) : null}

                {activeSection === "access" ? (
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
                ) : null}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
