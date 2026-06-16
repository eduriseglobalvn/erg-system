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
  Mail,
  User,
  Compass,
  KeyRound,
  ShieldAlert
} from "@/components/mui-icon-shim";

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
  { id: "erg_super_admin", label: "Super Admin", hint: "Toàn quyền cấu hình và vận hành hệ thống" },
  { id: "admin", label: "Quản trị viên", hint: "Quản trị nghiệp vụ nội dung & nhân sự" },
  { id: "center_admin", label: "Quản trị trung tâm", hint: "Quản lý trường, lớp thuộc cụm trung tâm" },
  { id: "school_admin", label: "Quản trị trường", hint: "Theo dõi, quản lý lớp & học sinh trực thuộc" },
  { id: "teacher", label: "Giáo viên", hint: "Giao bài, chấm điểm và báo cáo tiến độ lớp học" },
  { id: "media_manager", label: "Media Manager", hint: "Quản lý tài nguyên media, video học liệu" },
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
        "mb-2.5 flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200",
        active
          ? "border-blue-200 bg-blue-50/50 shadow-sm ring-1 ring-blue-100"
          : "border-slate-200/80 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50/40"
      )}
      onClick={onClick}
    >
      <Avatar className="size-10 rounded-lg shadow-sm border border-slate-100 shrink-0">
        <AvatarImage src={user.avatarUrl} alt={user.fullName} />
        <AvatarFallback className="rounded-lg bg-blue-50 text-xs font-bold text-[var(--erg-blue)] shadow-inner">
          {initials(user.fullName || user.email)}
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-xs font-bold text-slate-800">{user.fullName || user.email}</span>
          {superAdmin && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800 uppercase tracking-wider">SUPER</span>
          )}
        </span>
        <span className="mt-1 block truncate text-[10px] font-medium text-slate-400 flex items-center gap-1"><Mail className="h-3 w-3 shrink-0" /> {user.email}</span>
        <span className="mt-0.5 block truncate text-[10px] font-medium text-slate-400 flex items-center gap-1"><Phone className="h-3 w-3 shrink-0" /> {user.phone || "Không có SĐT"}</span>
        <span className="mt-3 flex flex-wrap gap-1">
          <MiniBadge active={active}>{statusLabel(user.status)}</MiniBadge>
          <MiniBadge active={active}>{scopeLabels[user.accessSummary.highestScope]}</MiniBadge>
        </span>
      </span>
      <ChevronRight className="mt-1.5 size-4 shrink-0 text-slate-400" />
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
  const statusColor = 
    user.status === "ACTIVE" 
      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
      : user.status === "BLOCKED" 
      ? "bg-orange-50 text-orange-700 border-orange-200" 
      : user.status === "BANNED" 
      ? "bg-rose-50 text-rose-700 border-rose-200" 
      : "bg-slate-50 text-slate-600 border-slate-200";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <Avatar className="size-14 rounded-xl shadow border border-slate-100 shrink-0">
            <AvatarImage src={user.avatarUrl} alt={user.fullName} />
            <AvatarFallback className="rounded-xl bg-blue-50 text-base font-bold text-[var(--erg-blue)]">
              {initials(user.fullName || user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-bold text-slate-800">{user.fullName || user.email}</h3>
              {superAdmin && <Badge className="rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-100 text-[10px] font-bold">Super Admin</Badge>}
              <span className={cn("rounded-lg border px-2.5 py-0.5 text-[10px] font-bold shadow-inner", statusColor)}>
                {statusLabel(user.status)}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400 font-semibold">{user.email}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold text-slate-500">
              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 border border-slate-150 px-2.5 py-1">
                <Phone className="size-3 text-slate-400" />
                {user.phone || "Chưa cập nhật SĐT"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 border border-slate-150 px-2.5 py-1">
                <Compass className="size-3 text-slate-400" />
                {user.isProfileCompleted ? "Đã onboarding" : "Chưa hoàn tất onboarding"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 border border-slate-150 px-2.5 py-1">
                <KeyRound className="size-3 text-slate-400" />
                {loading ? <Skeleton className="h-3 w-16" aria-label="Đang tính quyền" /> : `Quyền: ${scopeLabels[effective?.highestScope ?? "none"]}`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 border-t border-slate-100 pt-4 xl:border-t-0 xl:pt-0 shrink-0">
          <button
            className="h-8 rounded-lg border border-emerald-200 bg-white px-3.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition disabled:opacity-40"
            disabled={rootAdmin || user.status === "ACTIVE"}
            onClick={onActivate}
          >
            Kích hoạt
          </button>
          <button
            className="h-8 rounded-lg border border-orange-200 bg-white px-3.5 text-xs font-bold text-orange-700 hover:bg-orange-50 transition disabled:opacity-40"
            disabled={rootAdmin || user.status === "BLOCKED"}
            onClick={onBlock}
          >
            Khóa tạm thời
          </button>
          <button
            className="h-8 rounded-lg border border-rose-200 bg-white px-3.5 text-xs font-bold text-rose-700 hover:bg-rose-50 transition disabled:opacity-40"
            disabled={rootAdmin || user.status === "BANNED"}
            onClick={onBan}
          >
            Chặn truy cập
          </button>
          <button
            className="h-8 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition disabled:opacity-40"
            disabled={rootAdmin || user.status === "INACTIVE"}
            onClick={onDeactivate}
          >
            Ngừng hoạt động
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
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5"><User className="h-4 w-4 text-[var(--erg-blue)]" /> Thông tin hồ sơ</h4>
            <p className="mt-0.5 text-xs text-slate-400">Xem và hiệu chỉnh các thông tin cá nhân của thành viên.</p>
          </div>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--erg-blue)] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[var(--erg-blue-hover)] disabled:opacity-50 transition duration-150"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Đang xử lý..." : "Lưu hồ sơ"}
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Họ và tên">
            <input value={draft.fullName} onChange={(event) => update("fullName", event.target.value)} className="w-full h-9 rounded-lg border border-slate-250 bg-white px-3 text-xs font-medium text-slate-800 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
          </Field>
          <Field label="Số điện thoại">
            <input value={draft.phone} onChange={(event) => update("phone", event.target.value)} className="w-full h-9 rounded-lg border border-slate-250 bg-white px-3 text-xs font-medium text-slate-800 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
          </Field>
          <Field label="Email đăng nhập">
            <input value={user.email} readOnly className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-400 outline-none cursor-not-allowed" />
          </Field>
          <Field label="Chức danh">
            <input value={draft.jobTitle} onChange={(event) => update("jobTitle", event.target.value)} className="w-full h-9 rounded-lg border border-slate-250 bg-white px-3 text-xs font-medium text-slate-800 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Ví dụ: Giáo viên chính môn Toán" />
          </Field>
          <Field label="Giới tính">
            <AppSelect value={draft.gender} onChange={(event) => update("gender", event.target.value)} className="w-full h-9 rounded-lg border border-slate-250 bg-white px-3 text-xs font-bold text-slate-700 outline-none">
              <option value="">Chưa thiết lập</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </AppSelect>
          </Field>
          <Field label="Ngày sinh">
            <input type="date" value={draft.dateOfBirth} onChange={(event) => update("dateOfBirth", event.target.value)} className="w-full h-9 rounded-lg border border-slate-250 bg-white px-3 text-xs font-medium text-slate-800 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
          </Field>
          <Field label="Khu vực / Tỉnh">
            <input value={draft.region} onChange={(event) => update("region", event.target.value)} className="w-full h-9 rounded-lg border border-slate-250 bg-white px-3 text-xs font-medium text-slate-800 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
          </Field>
          <Field label="Thành phố">
            <input value={draft.city} onChange={(event) => update("city", event.target.value)} className="w-full h-9 rounded-lg border border-slate-250 bg-white px-3 text-xs font-medium text-slate-800 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
          </Field>
          <Field label="Quận / Huyện">
            <input value={draft.district} onChange={(event) => update("district", event.target.value)} className="w-full h-9 rounded-lg border border-slate-250 bg-white px-3 text-xs font-medium text-slate-800 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
          </Field>
          <Field label="Đường dẫn Avatar">
            <input value={draft.avatarUrl} onChange={(event) => update("avatarUrl", event.target.value)} className="w-full h-9 rounded-lg border border-slate-250 bg-white px-3 text-xs font-medium text-slate-800 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="https://..." />
          </Field>
          <Field label="Địa chỉ liên hệ" className="md:col-span-2">
            <input value={draft.address} onChange={(event) => update("address", event.target.value)} className="w-full h-9 rounded-lg border border-slate-250 bg-white px-3 text-xs font-medium text-slate-800 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Số nhà, ngõ ngách, tên đường..." />
          </Field>
          <Field label="Ghi chú & Tóm tắt tiểu sử" className="md:col-span-2">
            <textarea value={draft.bio} onChange={(event) => update("bio", event.target.value)} rows={3} className="w-full rounded-lg border border-slate-250 bg-white p-3 text-xs font-medium text-slate-800 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none min-h-[84px] resize-y" placeholder="Thông tin bổ sung về chuyên môn giảng dạy..." />
          </Field>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Thông tin tài khoản</h4>
        <div className="space-y-3 text-xs">
          <InfoLine label="Trạng thái" value={statusLabel(user.status)} />
          <InfoLine label="Onboarding" value={user.isProfileCompleted ? "Đã hoàn tất" : "Chưa hoàn tất"} />
          <InfoLine label="Nhà cung cấp" value={user.provider || "local"} />
          <InfoLine label="Loại tài khoản" value={user.accountType || "erg"} />
          <InfoLine label="Số lần đăng nhập" value={String(user.loginCount ?? 0)} />
          <InfoLine label="Truy cập gần nhất" value={formatDateTime(user.lastLoginAt)} />
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
    <section className="rounded-2xl border border-slate-200 p-5 space-y-5 bg-white shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
        <div>
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5"><KeyRound className="h-4 w-4 text-[var(--erg-blue)]" /> Vai trò hệ thống</h4>
          <p className="mt-0.5 text-xs text-slate-400">Xác định nhóm phân quyền mặc định và phân quyền truy cập chức năng cấp cao.</p>
        </div>
        <SaveButton saving={saving} onClick={onSave}>
          Cập nhật vai trò
        </SaveButton>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roleOptions.map((role) => {
          const checked = isChecked(role.id);
          const protectedSuper = rootAdmin && role.id === "erg_super_admin";
          return (
            <button
              key={role.id}
              type="button"
              className={cn(
                "min-h-[110px] rounded-xl border p-4 text-left transition duration-200 flex flex-col justify-between",
                checked 
                  ? "border-[var(--erg-blue)] bg-blue-50/45 shadow-sm ring-1 ring-blue-100" 
                  : "border-slate-200 bg-white hover:bg-slate-50/40"
              )}
              onClick={() => {
                if (!protectedSuper) toggle(role.id);
              }}
            >
              <div className="w-full flex items-start justify-between gap-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold text-slate-800">{role.label}</span>
                  <span className="mt-2 block text-[10px] leading-relaxed text-slate-400 font-medium">{role.hint}</span>
                </span>
                {checked && (
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-[var(--erg-blue)] text-white shadow">
                    <Check className="size-3" />
                  </span>
                )}
              </div>
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
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5"><ShieldAlert className="h-4 w-4 text-[var(--erg-blue)]" /> Phân quyền chi tiết</h4>
            <p className="mt-0.5 text-xs text-slate-400">Chọn cấp độ phạm vi (Scope), vai trò thực thi (Role) và phân hệ thụ hưởng (Module).</p>
          </div>
          <div className="flex flex-wrap gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onAddPolicy}
              disabled={!canAdd || saving}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-250 bg-white px-4 text-xs font-bold text-slate-700 transition hover:border-[var(--erg-blue)] hover:text-[var(--erg-blue)] disabled:opacity-40"
            >
              Thêm vào nháp
            </button>
            <SaveButton saving={saving} onClick={onSave}>Lưu phân quyền</SaveButton>
          </div>
        </div>

        <div className="space-y-4">
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
            <EmptyBlock label="Chọn loại phạm vi (Hệ thống / Trung tâm / Trường học) phía trên để cấu hình." />
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <CompactRolePicker roles={assignableRoles} value={draft.roleGroup} onSelect={(roleGroup) => onDraftChange({ ...draft, roleGroup })} />
            <CompactModulePicker modules={modules} selected={draft.modules} onChange={(nextModules) => onDraftChange({ ...draft, modules: nextModules })} />
          </div>

          {(selectedScope || selectedRole) && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/30 px-4 py-3 text-xs text-slate-700 flex items-center gap-2">
              <span className="font-bold">Đang cấu hình:</span>
              {selectedScope && <span className="font-bold text-[var(--erg-blue)]">{selectedScope.name}</span>}
              {selectedScope && selectedRole && <span> · </span>}
              {selectedRole && <span className="font-semibold">{selectedRole.name}</span>}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-sm font-bold text-slate-800">Quyền truy cập đã xác nhận</h4>
            <p className="mt-0.5 text-xs text-slate-400">Danh sách các chính sách phân quyền hiện tại đang được áp dụng.</p>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">Phạm vi cao nhất: {scopeLabels[highestScope]}</span>
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">Số module: {moduleCount}</span>
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">Permissions: {permissionCount}</span>
          </div>
        </div>

        {loading ? <LoadingBlock label="Đang đồng bộ cấu hình quyền..." /> : null}
        {!loading && policies.length === 0 ? <EmptyBlock label="Thành viên này hiện chưa được gán bất kỳ quyền truy cập nào." /> : null}
        {!loading && policies.length > 0 ? (
          <div className="space-y-3">
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
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-700 leading-relaxed shadow-sm">
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
        const active = value === scopeType;
        return (
          <button
            key={scopeType}
            type="button"
            title={scopeHelp[scopeType]}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-bold transition duration-200",
              active 
                ? "border-[var(--erg-blue)] bg-[var(--erg-blue)] text-white shadow" 
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
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
    <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 space-y-3 shadow-inner">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block sm:w-[320px]">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <input
            className="h-9 w-full rounded-lg border border-[#d7e0ec] bg-white pl-9 pr-3 text-xs outline-none transition focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue-ring)] placeholder:text-slate-400"
            placeholder="Tìm nhanh trường học hoặc trung tâm..."
            value={search}
            onChange={(event) => onSearch(event.target.value)}
          />
        </label>
        <span className="text-[10px] font-bold text-slate-400">
          {loading ? <Skeleton className="h-4.5 w-16" aria-label="Đang đồng bộ phạm vi..." /> : `Đã tải ${scopes.length}/${total} phạm vi`}
        </span>
      </div>

      {!loading && scopes.length === 0 && (
        <EmptyBlock label="Không tìm thấy cơ sở khớp với bộ lọc." />
      )}

      {scopes.length > 0 && (
        <div className="max-h-[220px] overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-sm scrollbar-thin">
          {scopes.map((scope) => {
            const Icon = scopeIcons[scope.scopeType];
            const checked = selectedId === scope.scopeId;
            return (
              <button
                key={`${scope.scopeType}-${scope.scopeId}`}
                type="button"
                className={cn(
                  "flex w-full items-start gap-3 border-b border-slate-100 px-3 py-2.5 text-left transition last:border-b-0",
                  checked ? "bg-blue-50/50" : "bg-white hover:bg-slate-50/50"
                )}
                onClick={() => onSelect(scope.scopeId)}
              >
                <div
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-lg ring-1 transition",
                    checked 
                      ? "bg-[var(--erg-blue)] text-white ring-[var(--erg-blue)] shadow" 
                      : "bg-slate-50 text-slate-400 ring-slate-200"
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold text-slate-800">{scope.name}</span>
                  <span className="mt-0.5 line-clamp-1 text-[10px] text-slate-400 font-semibold">{scope.description}</span>
                </span>
                {checked && <Check className="mt-1 size-4 text-[var(--erg-blue)] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CompactRolePicker({ roles, value, onSelect }: { roles: AccessRoleGroup[]; value: string; onSelect: (value: string) => void }) {
  if (!roles.length) {
    return <EmptyBlock label="Chọn cấp phạm vi bên trên để xem các vai trò được phép gán." />;
  }

  const selectedRole = roles.find((role) => role.id === value);

  return (
    <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/20 p-4 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-start">
      <div>
        <p className="text-xs font-bold text-slate-700">Nhóm vai trò</p>
        <p className="mt-0.5 text-[10px] text-slate-400">Chọn 1 vai trò</p>
      </div>
      <div className="min-w-0">
        <AppSelect
          className="h-9 w-full rounded-lg border border-[#d7e0ec] bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
          value={value}
          onChange={(event) => onSelect(event.target.value)}
        >
          <option value="">Chọn nhóm phân quyền</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </AppSelect>
        {selectedRole && <p className="mt-2 text-[10px] leading-relaxed text-slate-400 font-semibold">{selectedRole.description}</p>}
      </div>
    </div>
  );
}

function CompactModulePicker({ modules, selected, onChange }: { modules: AccessModule[]; selected: string[]; onChange: (modules: string[]) => void }) {
  function toggle(moduleId: string) {
    onChange(selected.includes(moduleId) ? selected.filter((item) => item !== moduleId) : [...selected, moduleId]);
  }

  return (
    <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/20 p-4 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-start">
      <div>
        <p className="text-xs font-bold text-slate-700">Phân hệ</p>
        <p className="mt-0.5 text-[10px] text-slate-400">Chọn các phân hệ</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {modules.map((module) => {
          const Icon = moduleIcons[module.id] ?? Layers3;
          const checked = selected.includes(module.id);
          return (
            <button
              key={module.id}
              type="button"
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-bold transition duration-200",
                checked
                  ? "border-[var(--erg-blue)] bg-blue-50/60 text-[var(--erg-blue)] shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              )}
              title={module.description}
              onClick={() => toggle(module.id)}
            >
              <Icon className="size-3.5" />
              {module.name}
              {checked && <Check className="size-3 text-[var(--erg-blue)]" />}
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
    <article className="grid gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_84px] sm:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200 shadow-sm">
          <Icon className="size-4.5" />
        </div>
        <div className="min-w-0">
          <h5 className="truncate text-xs font-bold text-slate-800">{policy.scopeName ?? policy.scopeId}</h5>
          <p className="mt-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{scopeLabels[policy.scopeType]}</p>
        </div>
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-bold text-slate-800">{role?.name ?? policy.roleGroup}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {policy.modules.map((moduleId) => (
            <Badge key={moduleId} variant="outline" className="rounded bg-white text-[9px] font-bold py-0.5 border-slate-200">
              {modules.find((module) => module.id === moduleId)?.name ?? moduleId}
            </Badge>
          ))}
        </div>
      </div>
      <button
        type="button"
        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 text-xs font-bold text-rose-700 hover:bg-rose-50 transition shrink-0 shadow-sm"
        onClick={onRemove}
      >
        <Trash2 className="size-3.5" />
        Gỡ bỏ
      </button>
    </article>
  );
}

function Field({ children, label, className }: { children: ReactNode; label: string; className?: string }) {
  return (
    <label className={cn("grid gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider", className)}>
      {label}
      {children}
    </label>
  );
}

function SaveButton({ children, saving, onClick }: { children: ReactNode; saving: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[var(--erg-blue)] px-4 text-xs font-bold text-white shadow hover:bg-[var(--erg-blue-hover)] disabled:opacity-50 transition duration-150 shrink-0"
      disabled={saving}
      onClick={onClick}
    >
      {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
      {children}
    </button>
  );
}

export function HeaderMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[100px] px-3.5 py-3">
      <p className="text-base font-bold text-slate-800">{value}</p>
      <p className="mt-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50/50 border border-slate-200/60 px-3.5 py-2.5">
      <span className="font-bold text-slate-500">{label}</span>
      <span className="max-w-[160px] text-right font-bold text-slate-800 truncate">{value}</span>
    </div>
  );
}

export function Banner({ children, tone }: { children: ReactNode; tone: "error" | "success" }) {
  return (
    <div
      className={cn(
        "mt-4 flex items-start gap-2 rounded-xl border px-4 py-3 text-xs font-semibold shadow-sm leading-relaxed",
        tone === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700",
      )}
    >
      {tone === "error" ? <AlertCircle className="mt-0.5 size-4 shrink-0" /> : <Check className="mt-0.5 size-4 shrink-0" />}
      <span>{children}</span>
    </div>
  );
}

export function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-5" aria-label={label}>
      <Skeleton className="h-4 w-44" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

export function EmptyBlock({ label }: { label: string }) {
  return <div className="rounded-xl border border-dashed border-slate-350 bg-slate-50 p-6 text-center text-xs font-semibold text-slate-400 leading-relaxed">{label}</div>;
}

function MiniBadge({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <span className={cn(
      "rounded-lg px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider", 
      active ? "bg-white/20 text-white" : "bg-slate-150 text-slate-500 border border-slate-200/40"
    )}>
      {children}
    </span>
  );
}
