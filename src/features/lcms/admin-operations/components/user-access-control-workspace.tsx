import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  BookOpen,
  Building2,
  Check,
  ChevronRight,
  Layers3,
  Loader2,
  MonitorPlay,
  Phone,
  Save,
  School,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  getAccessManagementOptions,
  getUserAccess,
  listAccessScopes,
  listAccessManagedUsers,
  previewUserAccess,
  saveUserAccess,
  type AccessManagementOptions,
  type AccessManagedUser,
  type AccessModule,
  type AccessRoleGroup,
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
import { cn } from "@/lib/utils";

type WorkspaceSection = "profile" | "roles" | "access";

type DraftPolicy = {
  scopeType: AccessScopeType | "";
  scopeId: string;
  roleGroup: string;
  modules: string[];
};

type ProfileDraft = {
  fullName: string;
  phone: string;
  jobTitle: string;
  avatarUrl: string;
  bio: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  city: string;
  district: string;
  region: string;
};

const sectionLabels: Record<WorkspaceSection, string> = {
  profile: "Thông tin",
  roles: "Vai trò",
  access: "Phân quyền",
};

const scopeLabels: Record<AccessScopeType | "none", string> = {
  system: "Hệ thống",
  center: "Trung tâm",
  school: "Trường học",
  none: "Chưa cấp",
};

const scopeHelp: Record<AccessScopeType, string> = {
  system: "Quản lý toàn bộ ERG LMS.",
  center: "Quản lý trung tâm và các trường trực thuộc.",
  school: "Chỉ quản lý lớp trong trường được cấp.",
};

const scopeIcons: Record<AccessScopeType, typeof ShieldCheck> = {
  system: ShieldCheck,
  center: Building2,
  school: School,
};

const moduleIcons: Record<string, typeof BookOpen> = {
  lms: BookOpen,
  resources: Layers3,
  media: MonitorPlay,
};

const ROOT_ADMIN_EMAIL = "admin@erg.edu.vn";

const roleOptions = [
  { id: "erg_super_admin", label: "Super Admin", hint: "Toàn quyền hệ thống" },
  { id: "admin", label: "Quản trị viên", hint: "Quản trị nghiệp vụ ERG" },
  { id: "center_admin", label: "Quản trị trung tâm", hint: "Quản lý trung tâm và trường thuộc trung tâm" },
  { id: "school_admin", label: "Quản trị trường", hint: "Quản lý lớp trong trường" },
  { id: "teacher", label: "Giáo viên", hint: "Dạy lớp và theo dõi học sinh" },
  { id: "media_manager", label: "Media", hint: "Quản lý học liệu, video, tài nguyên" },
];

const roleAliases: Record<string, string[]> = {
  erg_super_admin: ["SUPER_ADMIN", "system.super_admin", "erg_super_admin"],
  admin: ["admin"],
  center_admin: ["center_admin"],
  school_admin: ["school_admin"],
  teacher: ["teacher"],
  media_manager: ["media_manager"],
};

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
    const frameId = window.requestAnimationFrame(() => setActiveSection(defaultSection));
    return () => window.cancelAnimationFrame(frameId);
  }, [defaultSection]);

  useEffect(() => {
    let cancelled = false;
    const frameId = window.requestAnimationFrame(() => {
      if (cancelled) return;
      setLoadingUsers(true);
      setError("");
    });

    Promise.all([
      queryClient.fetchQuery({
        queryKey: ["admin-operations", "user-access", "users", query, status],
        queryFn: () => listAccessManagedUsers({ search: query, status, page: 1, limit: 100 }),
        staleTime: 60_000,
      }),
      queryClient.fetchQuery({
        queryKey: ["admin-operations", "user-access", "options"],
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
      window.cancelAnimationFrame(frameId);
    };
  }, [query, queryClient, status]);

  useEffect(() => {
    if (!selectedUserId) {
      const frameId = window.requestAnimationFrame(() => {
        setSelectedUserDetail(null);
        setPolicies([]);
        setEffective(null);
        setProfileDraft({ fullName: "", phone: "", jobTitle: "", avatarUrl: "", bio: "", gender: "", dateOfBirth: "", address: "", city: "", district: "", region: "" });
        setRoleDraft([]);
      });
      return () => window.cancelAnimationFrame(frameId);
    }

    let cancelled = false;
    const frameId = window.requestAnimationFrame(() => {
      if (cancelled) return;
      setLoadingDetail(true);
      setError("");
      setNotice("");
    });

    Promise.all([
      queryClient.fetchQuery({
        queryKey: ["admin-operations", "user-access", "detail", selectedUserId, "access"],
        queryFn: () => getUserAccess(selectedUserId),
        staleTime: 60_000,
      }),
      queryClient.fetchQuery({
        queryKey: ["admin-operations", "user-access", "detail", selectedUserId, "user"],
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
      window.cancelAnimationFrame(frameId);
    };
  }, [queryClient, selectedUserId]);

  useEffect(() => {
    if (!policies.length) {
      const roleSource = selectedUserDetail ?? users.find((user) => user.id === selectedUserId);
      const frameId = window.requestAnimationFrame(() => {
        setEffective(isSuperAdmin(roleSource) ? superAdminEffectiveAccess(options?.modules) : { highestScope: "none", modules: [], permissions: [] });
      });
      return () => window.cancelAnimationFrame(frameId);
    }

    let cancelled = false;
    queryClient
      .fetchQuery({
        queryKey: ["admin-operations", "user-access", "preview", policies],
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
  }, [options?.modules, policies, queryClient, selectedUserDetail, selectedUserId, users]);

  useEffect(() => {
    if (!draft.scopeType) {
      const frameId = window.requestAnimationFrame(() => {
        setScopeResults([]);
        setScopeTotal(0);
      });
      return () => window.cancelAnimationFrame(frameId);
    }

    let cancelled = false;
    const frameId = window.requestAnimationFrame(() => {
      if (!cancelled) setLoadingScopes(true);
    });
    queryClient
      .fetchQuery({
        queryKey: ["admin-operations", "user-access", "scopes", draft.scopeType, scopeSearch],
        queryFn: () => listAccessScopes({ scopeType: draft.scopeType, search: scopeSearch, page: 1, limit: 20 }),
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
      window.cancelAnimationFrame(frameId);
    };
  }, [draft.scopeType, queryClient, scopeSearch]);

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
    <div className="min-h-full overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-200 px-5 py-5 lg:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--erg-red)]">ERG IAM</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Quản lý thành viên và quyền truy cập</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Một nơi để xem hồ sơ, trạng thái tài khoản, vai trò đăng nhập và phạm vi LMS của từng thành viên.
            </p>
            {scopeDescription ? <p className="mt-2 text-xs font-semibold text-[var(--erg-blue)]">Phạm vi: {scopeDescription}</p> : null}
          </div>
          <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 text-center">
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
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[var(--erg-blue)] focus:ring-4 focus:ring-[rgb(0_0_139_/_0.08)]"
                placeholder="Tìm theo tên, email, số điện thoại"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-[var(--erg-blue)] focus:ring-4 focus:ring-[rgb(0_0_139_/_0.08)]"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Deactive/nghỉ việc</option>
              <option value="BLOCKED">Đã khóa</option>
              <option value="BANNED">Banned</option>
              <option value="PENDING">Chờ kích hoạt</option>
            </select>
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

function MemberRow({ active, user, onClick }: { active: boolean; user: AccessManagedUser; onClick: () => void }) {
  const superAdmin = isSuperAdmin(user);
  return (
    <button
      className={cn(
        "mb-2 flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition",
        active
          ? "border-[var(--erg-blue)] bg-[var(--erg-blue)] text-white shadow-lg shadow-slate-200"
          : "border-slate-200 bg-white text-slate-950 hover:border-slate-300 hover:bg-white",
      )}
      onClick={onClick}
    >
      <Avatar className="size-11 rounded-2xl">
        <AvatarImage src={user.avatarUrl} alt={user.fullName} />
        <AvatarFallback className="rounded-2xl bg-[rgb(0_0_139_/_0.08)] text-xs font-bold text-[var(--erg-blue)]">
          {initials(user.fullName || user.email)}
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold">{user.fullName || user.email}</span>
          {superAdmin ? <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">SUPER</span> : null}
        </span>
        <span className={cn("mt-1 block truncate text-xs", active ? "text-slate-300" : "text-slate-500")}>{user.email}</span>
        <span className={cn("mt-1 block truncate text-xs", active ? "text-slate-300" : "text-slate-500")}>
          {user.phone || "Chưa có SĐT"}
        </span>
        <span className="mt-3 flex flex-wrap gap-1">
          <MiniBadge active={active}>{statusLabel(user.status)}</MiniBadge>
          <MiniBadge active={active}>{scopeLabels[user.accessSummary.highestScope]}</MiniBadge>
        </span>
      </span>
      <ChevronRight className="mt-1 size-4 shrink-0" />
    </button>
  );
}

function MemberDetailHeader({
  effective,
  loading,
  rootAdmin,
  superAdmin,
  user,
  onActivate,
  onBan,
  onBlock,
  onDeactivate,
}: {
  effective: EffectiveAccess | null;
  loading: boolean;
  rootAdmin: boolean;
  superAdmin: boolean;
  user: ReturnType<typeof mergeUser>;
  onActivate: () => void;
  onBan: () => void;
  onBlock: () => void;
  onDeactivate: () => void;
}) {
  return (
    <section className="rounded-[20px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <Avatar className="size-16 rounded-[20px]">
            <AvatarImage src={user.avatarUrl} alt={user.fullName} />
            <AvatarFallback className="rounded-[20px] bg-[rgb(0_0_139_/_0.08)] text-base font-bold text-[var(--erg-blue)]">
              {initials(user.fullName || user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-2xl font-semibold tracking-tight text-slate-950">{user.fullName || user.email}</h3>
              {superAdmin ? <Badge className="rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-100">Super Admin</Badge> : null}
              <Badge variant="outline" className="rounded-lg border-slate-200 bg-white">
                {statusLabel(user.status)}
              </Badge>
            </div>
            <p className="mt-2 truncate text-sm text-slate-500">{user.email}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
              <span className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 ring-1 ring-slate-200">
                <Phone className="size-3.5" />
                {user.phone || "Chưa có số điện thoại"}
              </span>
              <span className="rounded-lg bg-white px-2.5 py-1 ring-1 ring-slate-200">
                {user.isProfileCompleted ? "Đã hoàn tất onboarding" : "Cần onboarding"}
              </span>
              <span className="rounded-lg bg-white px-2.5 py-1 ring-1 ring-slate-200">
                {loading ? "Đang tính quyền..." : `Quyền cao nhất: ${scopeLabels[effective?.highestScope ?? "none"]}`}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="h-10 rounded-xl border border-emerald-200 bg-white px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={rootAdmin || user.status === "ACTIVE"}
            onClick={onActivate}
          >
            Active
          </button>
          <button
            className="h-10 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={rootAdmin || user.status !== "ACTIVE"}
            onClick={onDeactivate}
          >
            Deactive
          </button>
          <button
            className="h-10 rounded-xl border border-orange-200 bg-white px-4 text-sm font-semibold text-orange-700 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={rootAdmin || user.status === "BLOCKED"}
            onClick={onBlock}
          >
            Block
          </button>
          <button
            className="h-10 rounded-xl border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={rootAdmin || user.status === "BANNED"}
            onClick={onBan}
          >
            Ban
          </button>
        </div>
      </div>
    </section>
  );
}

function ProfileSection({
  user,
  draft,
  onChange,
  onSave,
  saving,
}: {
  user: ReturnType<typeof mergeUser>;
  draft: ProfileDraft;
  onChange: (draft: ProfileDraft) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const update = <K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) => onChange({ ...draft, [key]: value });

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="rounded-[22px] border border-[var(--erg-border)] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-lg font-bold text-[var(--erg-text)]">Hồ sơ thành viên</p>
            <p className="mt-1 text-sm text-[var(--erg-text-muted)]">Admin có thể cập nhật thông tin định danh và thông tin vận hành lấy trực tiếp từ BE.</p>
          </div>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-2xl bg-[var(--erg-ink)] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--erg-blue)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? "Đang lưu" : "Lưu hồ sơ"}
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Họ và tên">
            <input value={draft.fullName} onChange={(event) => update("fullName", event.target.value)} className="erg-input" />
          </Field>
          <Field label="Số điện thoại">
            <input value={draft.phone} onChange={(event) => update("phone", event.target.value)} className="erg-input" />
          </Field>
          <Field label="Email đăng nhập">
            <input value={user.email} readOnly className="erg-input bg-slate-50 text-[var(--erg-text-muted)]" />
          </Field>
          <Field label="Chức danh">
            <input value={draft.jobTitle} onChange={(event) => update("jobTitle", event.target.value)} className="erg-input" placeholder="Giáo viên, quản trị viên..." />
          </Field>
          <Field label="Giới tính">
            <select value={draft.gender} onChange={(event) => update("gender", event.target.value)} className="erg-input">
              <option value="">Chưa cập nhật</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
          </Field>
          <Field label="Ngày sinh">
            <input type="date" value={draft.dateOfBirth} onChange={(event) => update("dateOfBirth", event.target.value)} className="erg-input" />
          </Field>
          <Field label="Khu vực">
            <input value={draft.region} onChange={(event) => update("region", event.target.value)} className="erg-input" />
          </Field>
          <Field label="Thành phố">
            <input value={draft.city} onChange={(event) => update("city", event.target.value)} className="erg-input" />
          </Field>
          <Field label="Quận/Huyện">
            <input value={draft.district} onChange={(event) => update("district", event.target.value)} className="erg-input" />
          </Field>
          <Field label="Avatar URL">
            <input value={draft.avatarUrl} onChange={(event) => update("avatarUrl", event.target.value)} className="erg-input" />
          </Field>
          <Field label="Địa chỉ" className="md:col-span-2">
            <input value={draft.address} onChange={(event) => update("address", event.target.value)} className="erg-input" />
          </Field>
          <Field label="Ghi chú hồ sơ" className="md:col-span-2">
            <textarea value={draft.bio} onChange={(event) => update("bio", event.target.value)} rows={3} className="erg-input min-h-[96px] resize-y" />
          </Field>
        </div>
      </div>

      <div className="rounded-[22px] border border-[var(--erg-border)] bg-white p-5 shadow-sm">
        <p className="text-base font-bold text-[var(--erg-text)]">Thông tin tài khoản</p>
        <div className="mt-4 space-y-3 text-sm">
          <InfoLine label="Trạng thái" value={statusLabel(user.status)} />
          <InfoLine label="Onboarding" value={user.isProfileCompleted ? "Đã hoàn tất" : "Cần onboarding"} />
          <InfoLine label="Provider" value={user.provider || "local"} />
          <InfoLine label="Loại tài khoản" value={user.accountType || "erg"} />
          <InfoLine label="Số lần đăng nhập" value={String(user.loginCount ?? 0)} />
          <InfoLine label="Đăng nhập cuối" value={formatDateTime(user.lastLoginAt)} />
          <InfoLine label="Ngày tạo" value={formatDateTime(user.createdAt)} />
          <InfoLine label="Cập nhật cuối" value={formatDateTime(user.updatedAt)} />
        </div>
      </div>
    </section>
  );
}
function RolesSection({
  currentRoles,
  rootAdmin,
  saving,
  onChange,
  onSave,
}: {
  currentRoles: string[];
  rootAdmin: boolean;
  saving: boolean;
  onChange: (roles: string[]) => void;
  onSave: () => void;
}) {
  const normalizedRoles = new Set(currentRoles.map((role) => role.toLowerCase()));
  function isChecked(roleId: string) {
    return roleAliases[roleId]?.some((role) => normalizedRoles.has(role.toLowerCase())) ?? normalizedRoles.has(roleId.toLowerCase());
  }

  function toggle(roleId: string) {
    if (rootAdmin && roleId === "erg_super_admin") return;
    const aliases = roleAliases[roleId] ?? [roleId];
    const exists = isChecked(roleId);
    if (exists) {
      const remove = new Set(aliases.map((role) => role.toLowerCase()));
      onChange(currentRoles.filter((item) => !remove.has(item.toLowerCase())));
      return;
    }
    const additions = roleId === "erg_super_admin" ? ["admin", ...aliases] : aliases;
    onChange(Array.from(new Set([...currentRoles, ...additions])));
  }

  return (
    <section className="rounded-2xl border border-slate-200 p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-slate-950">Vai trò đăng nhập</h4>
          <p className="mt-1 text-sm text-slate-500">Vai trò dùng cho bảo vệ route và xác định nhóm quyền mặc định.</p>
        </div>
        <SaveButton saving={saving} onClick={onSave}>
          Lưu vai trò
        </SaveButton>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {roleOptions.map((role) => {
          const checked = isChecked(role.id);
          const protectedSuper = rootAdmin && role.id === "erg_super_admin";
          return (
            <button
              key={role.id}
              className={cn(
                "min-h-[110px] rounded-2xl border p-4 text-left transition",
                checked ? "border-[var(--erg-blue)] bg-[rgb(0_0_139_/_0.07)] ring-4 ring-[rgb(0_0_139_/_0.08)]" : "border-slate-200 bg-white hover:bg-slate-50",
              )}
              onClick={() => {
                if (!protectedSuper) toggle(role.id);
              }}
            >
              <span className="flex items-start justify-between gap-3">
                <span>
                  <span className="block text-sm font-semibold text-slate-950">{role.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">{role.hint}</span>
                </span>
                {checked ? <Check className="size-4 text-[var(--erg-blue)]" /> : null}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function AccessSection({
  draft,
  effective,
  loading,
  loadingScopes,
  modules,
  policies,
  roleGroups,
  scopeOptions,
  scopeSearch,
  scopeTotal,
  assignableRoles,
  saving,
  onAddPolicy,
  onDraftChange,
  onRemovePolicy,
  onSave,
  onScopeSearchChange,
  onScopeTypeChange,
}: {
  draft: DraftPolicy;
  effective: EffectiveAccess | null;
  loading: boolean;
  loadingScopes: boolean;
  modules: AccessModule[];
  policies: UserAccessPolicy[];
  roleGroups: AccessRoleGroup[];
  scopeOptions: AccessScopeOption[];
  scopeSearch: string;
  scopeTotal: number;
  assignableRoles: AccessRoleGroup[];
  saving: boolean;
  onAddPolicy: () => void;
  onDraftChange: (draft: DraftPolicy) => void;
  onRemovePolicy: (index: number) => void;
  onSave: () => void;
  onScopeSearchChange: (value: string) => void;
  onScopeTypeChange: (scopeType: AccessScopeType) => void;
}) {
  const selectedScope = scopeOptions.find((scope) => scope.scopeId === draft.scopeId);
  const selectedRole = assignableRoles.find((role) => role.id === draft.roleGroup);
  const canAdd = Boolean(draft.scopeType && draft.scopeId && draft.roleGroup && draft.modules.length);
  const highestScope = effective?.highestScope ?? "none";
  const moduleCount = effective?.modules.length ?? 0;
  const permissionCount = effective?.permissions.length ?? 0;

  return (
    <section className="space-y-5">
      <div className="rounded-[22px] border border-[var(--erg-border)] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-lg font-bold text-[var(--erg-text)]">Cấp quyền truy cập</p>
            <p className="mt-1 text-sm text-[var(--erg-text-muted)]">Chọn phạm vi, nhóm quyền và module. Danh sách trung tâm/trường dùng tìm kiếm để không bị rối khi dữ liệu lớn.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onAddPolicy}
              disabled={!canAdd || saving}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--erg-border)] bg-white px-4 text-sm font-bold text-[var(--erg-text)] transition hover:border-[var(--erg-blue)] hover:text-[var(--erg-blue)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Thêm quyền
            </button>
            <SaveButton saving={saving} onClick={onSave}>Lưu phân quyền</SaveButton>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <SegmentedScope value={draft.scopeType} onChange={onScopeTypeChange} />
          {draft.scopeType ? (
            <SearchableScopePicker
              loading={loadingScopes}
              scopes={scopeOptions}
              search={scopeSearch}
              selectedId={draft.scopeId}
              total={scopeTotal}
              onSearch={onScopeSearchChange}
              onSelect={(scopeId) => onDraftChange({ ...draft, scopeId })}
            />
          ) : (
            <EmptyBlock label="Chọn loại phạm vi trước khi cấp quyền." />
          )}

          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <CompactRolePicker roles={assignableRoles} value={draft.roleGroup} onSelect={(roleGroup) => onDraftChange({ ...draft, roleGroup })} />
            <CompactModulePicker modules={modules} selected={draft.modules} onChange={(nextModules) => onDraftChange({ ...draft, modules: nextModules })} />
          </div>

          {selectedScope || selectedRole ? (
            <div className="rounded-2xl border border-[var(--erg-border)] bg-[var(--erg-blue-soft)] px-4 py-3 text-sm text-[var(--erg-text)]">
              {selectedScope ? <span className="font-bold text-[var(--erg-blue)]">{selectedScope.name}</span> : null}
              {selectedScope && selectedRole ? <span> · </span> : null}
              {selectedRole ? <span>{selectedRole.name}</span> : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-[22px] border border-[var(--erg-border)] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-lg font-bold text-[var(--erg-text)]">Quyền đã cấp</p>
            <p className="mt-1 text-sm text-[var(--erg-text-muted)]">Các dòng bên dưới là quyền sẽ được lưu cho thành viên.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full border border-[var(--erg-border)] bg-white px-3 py-1 text-[var(--erg-text)]">Cao nhất: {scopeLabels[highestScope]}</span>
            <span className="rounded-full border border-[var(--erg-border)] bg-white px-3 py-1 text-[var(--erg-text)]">Module: {moduleCount}</span>
            <span className="rounded-full border border-[var(--erg-border)] bg-white px-3 py-1 text-[var(--erg-text)]">Permission: {permissionCount}</span>
          </div>
        </div>

        {loading ? <LoadingBlock label="Đang tải quyền" /> : null}
        {!loading && policies.length === 0 ? <EmptyBlock label="Thành viên này chưa có quyền nào được lưu." /> : null}
        {!loading && policies.length > 0 ? (
          <div className="mt-4 space-y-3">
            {policies.map((policy, index) => (
              <PolicyRow
                key={policy.id ?? `${policy.scopeType}-${policy.scopeId}-${policy.roleGroup}-${index}`}
                modules={modules}
                policy={policy}
                role={roleGroups.find((role) => role.id === policy.roleGroup)}
                onRemove={() => onRemovePolicy(index)}
              />
            ))}
          </div>
        ) : null}

        {effective?.warnings?.length ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
            {effective.warnings.join(". ")}
          </div>
        ) : null}
      </div>
    </section>
  );
}
function blankDraft(): DraftPolicy {
  return {
    scopeType: "",
    scopeId: "",
    roleGroup: "",
    modules: [],
  };
}

function policyFromDraft(draft: DraftPolicy, scopes: AccessScopeOption[]): UserAccessPolicy | null {
  if (!draft.scopeType || !draft.scopeId || !draft.roleGroup || draft.modules.length === 0) return null;
  const scope = scopes.find((item) => item.scopeType === draft.scopeType && item.scopeId === draft.scopeId);
  return {
    scopeType: draft.scopeType,
    scopeId: draft.scopeId,
    scopeName: scope?.name,
    roleGroup: draft.roleGroup,
    modules: draft.modules,
  };
}

function mergeDraftPolicy(policies: UserAccessPolicy[], draftPolicy: UserAccessPolicy | null) {
  if (!draftPolicy) return policies;
  return [
    ...policies.filter((policy) => !(policy.scopeType === draftPolicy.scopeType && policy.scopeId === draftPolicy.scopeId)),
    draftPolicy,
  ];
}

function superAdminEffectiveAccess(modules?: AccessModule[]): EffectiveAccess {
  return {
    highestScope: "system",
    modules: modules?.map((module) => module.id) ?? ["lms", "resources", "media"],
    permissions: ["*"],
  };
}

function SegmentedScope({ value, onChange }: { value: AccessScopeType | ""; onChange: (value: AccessScopeType) => void }) {
  const values: AccessScopeType[] = ["system", "center", "school"];
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((scopeType) => {
        const Icon = scopeIcons[scopeType];
        return (
          <button
            key={scopeType}
            title={scopeHelp[scopeType]}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition",
              value === scopeType ? "border-[var(--erg-blue)] bg-[var(--erg-blue)] text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
            )}
            onClick={() => onChange(scopeType)}
          >
            <Icon className="size-4 shrink-0" />
            {scopeLabels[scopeType]}
          </button>
        );
      })}
    </div>
  );
}

function ScopePicker({ scopes, selectedId, onSelect }: { scopes: AccessScopeOption[]; selectedId: string; onSelect: (scopeId: string) => void }) {
  if (!scopes.length) {
    return <EmptyBlock label="Chọn loại phạm vi trước, sau đó chọn hệ thống/trung tâm/trường cần cấp quyền." />;
  }

  return (
    <div className="grid gap-2 lg:grid-cols-2">
      {scopes.map((scope) => {
        const Icon = scopeIcons[scope.scopeType];
        return (
          <button
            key={`${scope.scopeType}-${scope.scopeId}`}
            className={cn(
              "flex min-h-[86px] items-start gap-3 rounded-2xl border p-3 text-left transition",
              selectedId === scope.scopeId ? "border-[var(--erg-blue)] bg-[rgb(0_0_139_/_0.07)] ring-4 ring-[rgb(0_0_139_/_0.08)]" : "border-slate-200 bg-white hover:bg-slate-50",
            )}
            onClick={() => onSelect(scope.scopeId)}
          >
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-slate-700 ring-1 ring-slate-200">
              <Icon className="size-4" />
            </div>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-slate-950">{scope.name}</span>
              <span className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{scope.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

void ScopePicker;

function SearchableScopePicker({
  loading,
  scopes,
  search,
  selectedId,
  total,
  onSearch,
  onSelect,
}: {
  loading: boolean;
  scopes: AccessScopeOption[];
  search: string;
  selectedId: string;
  total: number;
  onSearch: (value: string) => void;
  onSelect: (scopeId: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <label className="relative block md:w-[360px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-[var(--erg-blue)] focus:bg-white focus:ring-4 focus:ring-[rgb(0_0_139_/_0.08)]"
            placeholder="Tìm trung tâm hoặc trường"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
          />
        </label>
        <span className="text-xs font-semibold text-slate-500">
          {loading ? "Đang tải..." : `${scopes.length}/${total} phạm vi`}
        </span>
      </div>

      {!loading && !scopes.length ? (
        <div className="mt-3">
          <EmptyBlock label="Không có phạm vi phù hợp. Hãy đổi loại phạm vi hoặc từ khóa tìm kiếm." />
        </div>
      ) : null}

      <div className="mt-3 max-h-[260px] overflow-auto rounded-xl border border-slate-200">
        {scopes.map((scope) => {
          const Icon = scopeIcons[scope.scopeType];
          const checked = selectedId === scope.scopeId;
          return (
            <button
              key={`${scope.scopeType}-${scope.scopeId}`}
              className={cn(
                "flex w-full items-start gap-3 border-b border-slate-100 px-3 py-3 text-left transition last:border-b-0",
                checked ? "bg-[rgb(0_0_139_/_0.07)]" : "bg-white hover:bg-slate-50",
              )}
              onClick={() => onSelect(scope.scopeId)}
            >
              <div
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-xl ring-1",
                  checked ? "bg-[var(--erg-blue)] text-white ring-[var(--erg-blue)]" : "bg-white text-slate-700 ring-slate-200",
                )}
              >
                <Icon className="size-4" />
              </div>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-950">{scope.name}</span>
                <span className="mt-1 line-clamp-1 text-xs text-slate-500">{scope.description}</span>
              </span>
              {checked ? <Check className="mt-1 size-4 text-[var(--erg-blue)]" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RolePicker({ roles, value, onSelect }: { roles: AccessRoleGroup[]; value: string; onSelect: (value: string) => void }) {
  if (!roles.length) {
    return <EmptyBlock label="Chọn phạm vi trước để hệ thống hiển thị nhóm quyền phù hợp." />;
  }

  return (
    <div className="grid gap-2 lg:grid-cols-2">
      {roles.map((role) => (
        <button
          key={role.id}
          className={cn(
            "rounded-2xl border p-3 text-left transition",
            value === role.id ? "border-emerald-500 bg-emerald-50 ring-4 ring-emerald-100" : "border-slate-200 bg-white hover:bg-slate-50",
          )}
          onClick={() => onSelect(role.id)}
        >
          <span className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-slate-950">{role.name}</span>
            {value === role.id ? <Check className="size-4 text-emerald-700" /> : null}
          </span>
          <span className="mt-1 block text-xs leading-5 text-slate-500">{role.description}</span>
        </button>
      ))}
    </div>
  );
}

function ModulePicker({ modules, selected, onChange }: { modules: AccessModule[]; selected: string[]; onChange: (modules: string[]) => void }) {
  function toggle(moduleId: string) {
    onChange(selected.includes(moduleId) ? selected.filter((item) => item !== moduleId) : [...selected, moduleId]);
  }

  return (
    <div className="grid gap-2 md:grid-cols-3">
      {modules.map((module) => {
        const Icon = moduleIcons[module.id] ?? Layers3;
        const checked = selected.includes(module.id);
        return (
          <button
            key={module.id}
            className={cn(
              "rounded-2xl border p-3 text-left transition",
              checked ? "border-sky-500 bg-sky-50 ring-4 ring-sky-100" : "border-slate-200 bg-white hover:bg-slate-50",
            )}
            onClick={() => toggle(module.id)}
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              <Icon className="size-4" />
              {module.name}
            </span>
            <span className="mt-1 block text-xs leading-5 text-slate-500">{module.description}</span>
          </button>
        );
      })}
    </div>
  );
}

void RolePicker;
void ModulePicker;

function CompactRolePicker({ roles, value, onSelect }: { roles: AccessRoleGroup[]; value: string; onSelect: (value: string) => void }) {
  if (!roles.length) {
    return <EmptyBlock label="Chọn phạm vi trước để hệ thống hiển thị nhóm quyền phù hợp." />;
  }

  const selectedRole = roles.find((role) => role.id === value);

  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 md:grid-cols-[150px_minmax(0,1fr)] md:items-start">
      <div>
        <p className="text-sm font-semibold text-slate-950">Nhóm quyền</p>
        <p className="mt-1 text-xs text-slate-500">Chọn một vai trò</p>
      </div>
      <div className="min-w-0">
        <select
          className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[var(--erg-blue)] focus:bg-white focus:ring-4 focus:ring-[rgb(0_0_139_/_0.08)]"
          value={value}
          onChange={(event) => onSelect(event.target.value)}
        >
          <option value="">Chọn nhóm quyền</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
        {selectedRole ? <p className="mt-2 text-xs leading-5 text-slate-500">{selectedRole.description}</p> : null}
      </div>
    </div>
  );
}

function CompactModulePicker({ modules, selected, onChange }: { modules: AccessModule[]; selected: string[]; onChange: (modules: string[]) => void }) {
  function toggle(moduleId: string) {
    onChange(selected.includes(moduleId) ? selected.filter((item) => item !== moduleId) : [...selected, moduleId]);
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 md:grid-cols-[150px_minmax(0,1fr)] md:items-start">
      <div>
        <p className="text-sm font-semibold text-slate-950">Module</p>
        <p className="mt-1 text-xs text-slate-500">Chọn khu vực truy cập</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {modules.map((module) => {
          const Icon = moduleIcons[module.id] ?? Layers3;
          const checked = selected.includes(module.id);
          return (
            <button
              key={module.id}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition",
                checked
                  ? "border-[var(--erg-blue)] bg-[rgb(0_0_139_/_0.07)] text-[var(--erg-blue)]"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white",
              )}
              title={module.description}
              onClick={() => toggle(module.id)}
            >
              <Icon className="size-4" />
              {module.name}
              {checked ? <Check className="size-3.5" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PolicyRow({
  modules,
  policy,
  role,
  onRemove,
}: {
  modules: AccessModule[];
  policy: UserAccessPolicy;
  role?: AccessRoleGroup;
  onRemove: () => void;
}) {
  const Icon = scopeIcons[policy.scopeType];
  return (
    <article className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_96px] lg:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-slate-700 ring-1 ring-slate-200">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <h5 className="truncate text-sm font-semibold text-slate-950">{policy.scopeName ?? policy.scopeId}</h5>
          <p className="mt-1 text-xs text-slate-500">{scopeLabels[policy.scopeType]}</p>
        </div>
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-950">{role?.name ?? policy.roleGroup}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {policy.modules.map((moduleId) => (
            <Badge key={moduleId} variant="outline" className="rounded-md bg-white text-xs">
              {modules.find((module) => module.id === moduleId)?.name ?? moduleId}
            </Badge>
          ))}
        </div>
      </div>
      <button
        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 text-sm font-semibold text-red-700 transition hover:bg-red-50"
        onClick={onRemove}
      >
        <Trash2 className="size-4" />
        Gỡ
      </button>
    </article>
  );
}

function Field({ children, label, className }: { children: ReactNode; label: string; className?: string }) {
  return (
    <label className={cn("grid gap-2 text-sm font-semibold text-slate-700", className)}>
      {label}
      {children}
    </label>
  );
}

function SaveButton({ children, saving, onClick }: { children: ReactNode; saving: boolean; onClick: () => void }) {
  return (
    <button
      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--erg-blue)] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[rgb(0_0_110)] disabled:cursor-not-allowed disabled:opacity-60"
      disabled={saving}
      onClick={onClick}
    >
      {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
      {children}
    </button>
  );
}

function HeaderMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[120px] px-4 py-3">
      <p className="text-xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-slate-200">
      <span className="font-medium text-slate-500">{label}</span>
      <span className="max-w-[180px] text-right font-semibold text-slate-950">{value}</span>
    </div>
  );
}

function Banner({ children, tone }: { children: ReactNode; tone: "error" | "success" }) {
  return (
    <div
      className={cn(
        "mt-4 flex items-start gap-2 rounded-xl border px-3 py-2 text-sm font-medium",
        tone === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700",
      )}
    >
      {tone === "error" ? <AlertCircle className="mt-0.5 size-4 shrink-0" /> : <Check className="mt-0.5 size-4 shrink-0" />}
      <span>{children}</span>
    </div>
  );
}

function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-5 text-sm font-medium text-slate-500">
      <Loader2 className="size-4 animate-spin" />
      {label}
    </div>
  );
}

function EmptyBlock({ label }: { label: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">{label}</div>;
}

function MiniBadge({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-semibold", active ? "bg-white/10 text-white" : "bg-slate-100 text-slate-600")}>
      {children}
    </span>
  );
}

function mergeUser(listUser?: AccessManagedUser, detail?: AdminUserDetail | null) {
  return {
    id: detail?.id ?? listUser?.id ?? "",
    email: detail?.email ?? listUser?.email ?? "",
    fullName: detail?.fullName ?? listUser?.fullName ?? "",
    avatarUrl: detail?.avatarUrl ?? detail?.avatar_url ?? listUser?.avatarUrl,
    phone: detail?.phone ?? listUser?.phone ?? "",
    status: detail?.status ?? listUser?.status ?? "",
    provider: detail?.provider ?? "local",
    accountType: detail?.accountType ?? listUser?.accountType ?? "erg",
    roles: detail?.roles ?? listUser?.roles ?? [],
    isProfileCompleted: detail?.isProfileCompleted ?? listUser?.isProfileCompleted ?? false,
    jobTitle: detail?.job_title ?? "",
    bio: detail?.bio ?? "",
    gender: detail?.gender ?? "",
    dateOfBirth: detail?.date_of_birth ?? "",
    address: detail?.address ?? "",
    city: detail?.city ?? "",
    district: detail?.district ?? "",
    region: detail?.region ?? "",
    lastLoginAt: detail?.last_login_at,
    loginCount: detail?.login_count,
    tenantId: detail?.tenant_id,
    createdAt: detail?.createdAt ?? listUser?.createdAt ?? "",
    updatedAt: detail?.updatedAt,
  };
}

function sortUsers(items: AccessManagedUser[]) {
  return [...items].sort((a, b) => {
    const superDiff = Number(isSuperAdmin(b)) - Number(isSuperAdmin(a));
    if (superDiff !== 0) return superDiff;
    const activeDiff = Number(b.status === "ACTIVE") - Number(a.status === "ACTIVE");
    if (activeDiff !== 0) return activeDiff;
    return (a.fullName || a.email).localeCompare(b.fullName || b.email, "vi");
  });
}

function isSuperAdmin(user?: Pick<AccessManagedUser, "email" | "roles"> | ReturnType<typeof mergeUser> | null) {
  const roles = user?.roles?.map((role) => role.toLowerCase()) ?? [];
  return isRootAdmin(user) || roles.some((role) => role === "super_admin" || role === "super-admin" || role === "system.super_admin" || role === "erg_super_admin");
}

function isRootAdmin(user?: Pick<AccessManagedUser, "email"> | ReturnType<typeof mergeUser> | null) {
  return user?.email?.trim().toLowerCase() === ROOT_ADMIN_EMAIL;
}

function statusLabel(status: string) {
  switch (status) {
    case "ACTIVE":
      return "Đang hoạt động";
    case "INACTIVE":
      return "Deactive/nghỉ việc";
    case "BANNED":
      return "Banned";
    case "BLOCKED":
    case "DISABLED":
      return "Đã khóa";
    case "PENDING":
      return "Chờ kích hoạt";
    default:
      return status || "Không rõ";
  }
}

function formatDateTime(value?: string) {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

function initials(value: string) {
  return value
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

