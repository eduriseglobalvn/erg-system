import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, RefreshCw, Search } from "@/components/mui-icon-shim";
import { queryKeys } from "@/lib/query-keys";
import Button from "@mui/material/Button";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

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
import { createTeacherAccount, type CreateTeacherAccountResponse } from "@/features/lcms/admin-operations/api/teacher-account-api";
import { CreateTeacherAccountDialog } from "@/features/lcms/admin-operations/components/create-teacher-account-dialog";
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
  const [retryToken, setRetryToken] = useState(0);
  const [createTeacherDialogOpen, setCreateTeacherDialogOpen] = useState(false);
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
  const provisionTeacherMutation = useMutation({
    mutationKey: queryKeys.adminOperations.userAccess.provision(),
    mutationFn: createTeacherAccount,
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
  }, [debouncedQuery, paceStateUpdate, queryClient, retryToken, status]);

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
  const hasLoadError = Boolean(error && !loadingUsers && users.length === 0);

  function retryLoadUsers() {
    void queryClient.invalidateQueries({ queryKey: queryKeys.adminOperations.userAccess.users(debouncedQuery, status) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.adminOperations.userAccess.options() });
    setRetryToken((current) => current + 1);
  }

  function handleTeacherCreated(response: CreateTeacherAccountResponse) {
    setSelectedUserId(response.user.id);
    setNotice("Tài khoản giáo viên đã được tạo. Trạng thái onboarding sẽ do backend quản lý.");
    void queryClient.invalidateQueries({ queryKey: queryKeys.adminOperations.userAccess.users(debouncedQuery, status) });
    setRetryToken((current) => current + 1);
  }

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
    setNotice("Đã thêm cấu hình quyền vào bản nháp. Hãy bấm 'Lưu phân quyền' để áp dụng chính thức.");
  }

  async function persistProfile() {
    if (!selectedUserId) return;
    setSavingProfile(true);
    setError("");
    setNotice("");
    try {
      applyUserDetail(await profileMutation.mutateAsync({ userId: selectedUserId, draft: profileDraft }));
      setNotice("Đã cập nhật hồ sơ thành viên thành công.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật hồ sơ thành viên.");
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
      setNotice("Đã cập nhật vai trò đăng nhập thành công.");
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
      setNotice(nextStatus === "ACTIVE" ? "Tài khoản đã kích hoạt thành công." : "Trạng thái tài khoản đã thay đổi.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể thay đổi trạng thái tài khoản.");
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
      setNotice("Đã cập nhật phân quyền truy cập thành công.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu phân quyền truy cập.");
    } finally {
      setSavingAccess(false);
    }
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
        hasLoadError ? "" : "flex min-h-full flex-col",
      )}
    >
      <header className="border-b border-slate-200 px-6 py-5 bg-slate-50/40">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--erg-blue)]">ERG Identity & Access Management</p>
            <h2 className="mt-1.5 text-base font-bold text-slate-800">Quản lý tài khoản & phân quyền hệ thống</h2>
            <p className="mt-1 text-xs text-slate-400">
              Tập trung vào tài khoản nhân sự: chỉnh hồ sơ đăng nhập, active/deactive, gán vai trò và cấp quyền truy cập LMS/LCMS theo phạm vi hệ thống.
            </p>
            {scopeDescription ? <p className="mt-2 text-[10px] font-bold text-[var(--erg-blue)]">Cơ sở thụ hưởng: {scopeDescription}</p> : null}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button
              disabled={!options}
              startIcon={<PersonAddIcon />}
              variant="contained"
              onClick={() => setCreateTeacherDialogOpen(true)}
            >
              Tạo tài khoản giáo viên
            </Button>
            <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-slate-200 bg-white text-center divide-x divide-slate-200 shadow-sm shrink-0">
              <HeaderMetric label="Tổng tài khoản" value={String(users.length)} />
              <HeaderMetric label="Đang active" value={String(users.filter((user) => user.status === "ACTIVE").length)} />
              <HeaderMetric label="Chưa onboarding" value={String(users.filter((user) => !user.isProfileCompleted).length)} />
            </div>
          </div>
        </div>
        {error && !hasLoadError ? <Banner tone="error">{error}</Banner> : null}
        {notice ? <Banner tone="success">{notice}</Banner> : null}
      </header>

      {hasLoadError ? (
        <div className="border-t border-slate-200 bg-white p-6">
          <UserAccessErrorState message={error} onRetry={retryLoadUsers} />
        </div>
      ) : (
      <div className="grid min-h-[560px] flex-1 lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 bg-slate-50/20 lg:border-b-0 lg:border-r">
          <div className="space-y-2.5 border-b border-slate-200 p-4 bg-white">
            <label className="relative block">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              <input
                className="h-9 w-full rounded-lg border border-[#d7e0ec] bg-slate-50/50 pl-9 pr-3 text-xs outline-none transition focus:border-[var(--erg-blue)] focus:bg-white focus:ring-2 focus:ring-[var(--erg-blue)]/15 placeholder:text-slate-400 font-medium"
                placeholder="Tìm tên, email, điện thoại..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <AppSelect
              className="h-9 w-full rounded-lg border border-[#d7e0ec] bg-white px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue)]/15"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Ngừng hoạt động</option>
              <option value="BLOCKED">Đang tạm khóa</option>
              <option value="BANNED">Bị chặn vĩnh viễn</option>
              <option value="PENDING">Chờ kích hoạt</option>
            </AppSelect>
          </div>

          <div className="max-h-[520px] overflow-y-auto p-3.5 scrollbar-thin">
            {loadingUsers ? <LoadingBlock label="Đang tải danh sách thành viên..." /> : null}
            {!loadingUsers && users.length === 0 && !hasLoadError ? <EmptyBlock label="Không tìm thấy thành viên nào." /> : null}
            {users.map((user) => (
              <MemberRow key={user.id} user={user} active={user.id === selectedUserId} onClick={() => setSelectedUserId(user.id)} />
            ))}
          </div>
        </aside>

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

              {/* Polished Tabs Section */}
              <div className="flex border-b border-slate-200 mt-2 bg-slate-50/50 p-1 rounded-xl">
                {(Object.keys(sectionLabels) as WorkspaceSection[]).map((section) => {
                  const active = activeSection === section;
                  return (
                    <button
                      key={section}
                      type="button"
                      className={cn(
                        "flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-150",
                        active
                          ? "bg-white text-slate-800 shadow border border-slate-200/60"
                          : "text-slate-400 hover:text-slate-700"
                      )}
                      onClick={() => setActiveSection(section)}
                    >
                      {sectionLabels[section]}
                    </button>
                  );
                })}
              </div>

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
        onProvision={(input) => provisionTeacherMutation.mutateAsync(input)}
      />
    </div>
  );
}

function UserAccessErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="w-full max-w-xl rounded-2xl border border-rose-200 bg-rose-50/70 p-5 text-left shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-rose-200 bg-white text-rose-600">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-rose-900">Không tải được danh sách thành viên</h3>
          <p className="mt-1 break-words text-xs leading-5 text-rose-700">{message}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outlined"
              size="small"
              onClick={onRetry}
              startIcon={<RefreshCw className="h-3.5 w-3.5" />}
              className="h-8 border-rose-200 bg-white text-xs font-bold text-rose-700 hover:bg-rose-100"
            >
              Tải lại
            </Button>
            <span className="text-[11px] font-semibold text-rose-700/80">Kiểm tra API IAM hoặc đăng nhập lại nếu phiên đã hết hạn.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
