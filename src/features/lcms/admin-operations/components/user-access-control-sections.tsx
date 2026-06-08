import { type ReactNode } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import type {
  AccessManagedUser,
  AccessModule,
  AccessRoleGroup,
  AccessScopeOption,
  AccessScopeType,
  EffectiveAccess,
  UserAccessPolicy,
} from "@/features/lcms/admin-operations/api/access-management-api";
import type { DraftPolicy, ProfileDraft } from "@/features/lcms/admin-operations/types/user-access-control";
import { formatDateTime, initials, isSuperAdmin, mergeUser, statusLabel } from "@/features/lcms/admin-operations/utils/user-access-control-utils";
import { cn } from "@/lib/utils";
import { AppSelect } from "@/components/ui/app-select";

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
export function MemberRow({ active, user, onClick }: { active: boolean; user: AccessManagedUser; onClick: () => void }) {
  const superAdmin = isSuperAdmin(user);
  return (
    <button
      className={cn(
        "mb-2 flex w-full items-start gap-3 rounded-lg border p-3 text-left transition",
        active
          ? "border-[#b8d6fa] bg-[#ebf3fc] text-[#0f5ea8]"
          : "border-[#e0e4ea] bg-white text-slate-950 hover:border-[#b8d6fa] hover:bg-[#f7f8fa]",
      )}
      onClick={onClick}
    >
      <Avatar className="size-10 rounded-lg">
        <AvatarImage src={user.avatarUrl} alt={user.fullName} />
        <AvatarFallback className="rounded-lg bg-[#ebf3fc] text-xs font-semibold text-[var(--erg-blue)]">
          {initials(user.fullName || user.email)}
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold">{user.fullName || user.email}</span>
          {superAdmin ? <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">SUPER</span> : null}
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

export function MemberDetailHeader({
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
    <section className="rounded-lg border border-[#e0e4ea] bg-white p-5">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <Avatar className="size-14 rounded-lg">
            <AvatarImage src={user.avatarUrl} alt={user.fullName} />
            <AvatarFallback className="rounded-lg bg-[#ebf3fc] text-base font-semibold text-[var(--erg-blue)]">
              {initials(user.fullName || user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-xl font-semibold text-slate-950">{user.fullName || user.email}</h3>
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
                {loading ? <Skeleton className="h-4 w-32" aria-label="Dang tinh quyen" /> : `Quyền cao nhất: ${scopeLabels[effective?.highestScope ?? "none"]}`}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="h-9 rounded-md border border-emerald-200 bg-white px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={rootAdmin || user.status === "ACTIVE"}
            onClick={onActivate}
          >
            Active
          </button>
          <button
            className="h-9 rounded-md border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={rootAdmin || user.status !== "ACTIVE"}
            onClick={onDeactivate}
          >
            Deactive
          </button>
          <button
            className="h-9 rounded-md border border-orange-200 bg-white px-4 text-sm font-semibold text-orange-700 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={rootAdmin || user.status === "BLOCKED"}
            onClick={onBlock}
          >
            Block
          </button>
          <button
            className="h-9 rounded-md border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
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

export function ProfileSection({
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
      <div className="rounded-lg border border-[#e0e4ea] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-lg font-medium text-[var(--erg-text)]">Hồ sơ thành viên</p>
            <p className="mt-1 text-sm text-[var(--erg-text-muted)]">Admin có thể cập nhật thông tin định danh và thông tin vận hành lấy trực tiếp từ BE.</p>
          </div>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-[var(--erg-blue)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--erg-blue-hover)] disabled:cursor-not-allowed disabled:opacity-60"
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
            <AppSelect value={draft.gender} onChange={(event) => update("gender", event.target.value)} className="erg-input">
              <option value="">Chưa cập nhật</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </AppSelect>
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

      <div className="rounded-lg border border-[#e0e4ea] bg-white p-5 shadow-sm">
        <p className="text-base font-medium text-[var(--erg-text)]">Thông tin tài khoản</p>
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
export function RolesSection({
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
    <section className="rounded-lg border border-[#e0e4ea] p-5">
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
                "min-h-[110px] rounded-lg border p-4 text-left transition",
                checked ? "border-[#b8d6fa] bg-[#ebf3fc] ring-2 ring-[var(--erg-blue)]/15" : "border-[#e0e4ea] bg-white hover:bg-[#f7f8fa]",
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

export function AccessSection({
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
      <div className="rounded-lg border border-[#e0e4ea] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-lg font-medium text-[var(--erg-text)]">Cấp quyền truy cập</p>
            <p className="mt-1 text-sm text-[var(--erg-text-muted)]">Chọn phạm vi, nhóm quyền và module. Danh sách trung tâm/trường dùng tìm kiếm để không bị rối khi dữ liệu lớn.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onAddPolicy}
              disabled={!canAdd || saving}
              className="inline-flex h-9 items-center justify-center rounded-md border border-[#d7e0ec] bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-[var(--erg-blue)] hover:text-[var(--erg-blue)] disabled:cursor-not-allowed disabled:opacity-50"
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
            <div className="rounded-lg border border-[#b8d6fa] bg-[#ebf3fc] px-4 py-3 text-sm text-slate-800">
              {selectedScope ? <span className="font-medium text-[var(--erg-blue)]">{selectedScope.name}</span> : null}
              {selectedScope && selectedRole ? <span> · </span> : null}
              {selectedRole ? <span>{selectedRole.name}</span> : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border border-[#e0e4ea] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-lg font-medium text-[var(--erg-text)]">Quyền đã cấp</p>
            <p className="mt-1 text-sm text-[var(--erg-text-muted)]">Các dòng bên dưới là quyền sẽ được lưu cho thành viên.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            <span className="rounded-md border border-[var(--erg-border)] bg-white px-3 py-1 text-[var(--erg-text)]">Cao nhất: {scopeLabels[highestScope]}</span>
            <span className="rounded-md border border-[var(--erg-border)] bg-white px-3 py-1 text-[var(--erg-text)]">Module: {moduleCount}</span>
            <span className="rounded-md border border-[var(--erg-border)] bg-white px-3 py-1 text-[var(--erg-text)]">Permission: {permissionCount}</span>
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
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
            {effective.warnings.join(". ")}
          </div>
        ) : null}
      </div>
    </section>
  );
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
              "inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition",
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
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <label className="relative block md:w-[360px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            className="h-10 w-full rounded-md border border-[#d7e0ec] bg-[#f6f8fb] pl-9 pr-3 text-sm outline-none transition focus:border-[var(--erg-blue)] focus:bg-white focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
            placeholder="Tìm trung tâm hoặc trường"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
          />
        </label>
        <span className="text-xs font-semibold text-slate-500">
          {loading ? <Skeleton className="h-4 w-20" aria-label="Dang tai pham vi" /> : `${scopes.length}/${total} phạm vi`}
        </span>
      </div>

      {!loading && !scopes.length ? (
        <div className="mt-3">
          <EmptyBlock label="Không có phạm vi phù hợp. Hãy đổi loại phạm vi hoặc từ khóa tìm kiếm." />
        </div>
      ) : null}

      <div className="mt-3 max-h-[260px] overflow-auto rounded-lg border border-slate-200">
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
                  "grid size-9 shrink-0 place-items-center rounded-lg ring-1",
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

function CompactRolePicker({ roles, value, onSelect }: { roles: AccessRoleGroup[]; value: string; onSelect: (value: string) => void }) {
  if (!roles.length) {
    return <EmptyBlock label="Chọn phạm vi trước để hệ thống hiển thị nhóm quyền phù hợp." />;
  }

  const selectedRole = roles.find((role) => role.id === value);

  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-[150px_minmax(0,1fr)] md:items-start">
      <div>
        <p className="text-sm font-semibold text-slate-950">Nhóm quyền</p>
        <p className="mt-1 text-xs text-slate-500">Chọn một vai trò</p>
      </div>
      <div className="min-w-0">
        <AppSelect
          className="h-10 w-full rounded-md border border-[#d7e0ec] bg-[#f6f8fb] px-3 text-sm font-semibold text-[#242424] outline-none transition focus:border-[var(--erg-blue)] focus:bg-white focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
          value={value}
          onChange={(event) => onSelect(event.target.value)}
        >
          <option value="">Chọn nhóm quyền</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </AppSelect>
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
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-[150px_minmax(0,1fr)] md:items-start">
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
                "inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition",
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
    <article className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_96px] lg:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-white text-slate-700 ring-1 ring-slate-200">
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
        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-sm font-semibold text-red-700 transition hover:bg-red-50"
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
      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--erg-blue)] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[rgb(0_0_110)] disabled:cursor-not-allowed disabled:opacity-60"
      disabled={saving}
      onClick={onClick}
    >
      {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
      {children}
    </button>
  );
}

export function HeaderMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[120px] px-4 py-3">
      <p className="text-xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200">
      <span className="font-medium text-slate-500">{label}</span>
      <span className="max-w-[180px] text-right font-semibold text-slate-950">{value}</span>
    </div>
  );
}

export function Banner({ children, tone }: { children: ReactNode; tone: "error" | "success" }) {
  return (
    <div
      className={cn(
        "mt-4 flex items-start gap-2 rounded-lg border px-3 py-2 text-sm font-medium",
        tone === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700",
      )}
    >
      {tone === "error" ? <AlertCircle className="mt-0.5 size-4 shrink-0" /> : <Check className="mt-0.5 size-4 shrink-0" />}
      <span>{children}</span>
    </div>
  );
}

export function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-5" aria-label={label}>
      <Skeleton className="h-4 w-44" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

export function EmptyBlock({ label }: { label: string }) {
  return <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">{label}</div>;
}

function MiniBadge({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-semibold", active ? "bg-white/10 text-white" : "bg-slate-100 text-slate-600")}>
      {children}
    </span>
  );
}

