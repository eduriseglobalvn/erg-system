import Search from "@mui/icons-material/Search";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import Button from "@mui/material/Button";

import { AppSelect } from "@/components/erg-mui/app-select";
import {
  Banner,
  EmptyBlock,
  HeaderMetric,
  LoadingBlock,
  MemberRow,
} from "@/features/lcms/admin-operations/components/user-access-control-sections";
import { sectionLabels } from "@/features/lcms/admin-operations/constants/user-access-control";
import type { AccessManagedUser } from "@/features/lcms/admin-operations/api/access-management-api";
import type { WorkspaceSection } from "@/features/lcms/admin-operations/types/user-access-control";
import { cn } from "@/lib/utils";

export function UserAccessHeader({
  canCreateTeacher,
  error,
  notice,
  onCreateTeacher,
  scopeDescription,
  users,
}: {
  canCreateTeacher: boolean;
  error: string;
  notice: string;
  onCreateTeacher: () => void;
  scopeDescription?: string;
  users: AccessManagedUser[];
}) {
  return (
    <header className="border-b border-slate-200 px-6 py-5 bg-slate-50/40">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="max-w-3xl">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--erg-blue)]">ERG Identity & Access Management</p>
          <h2 className="mt-1.5 text-base font-bold text-slate-800">Quản lý tài khoản & phân quyền hệ thống</h2>
          <p className="mt-1 text-xs text-slate-400">
            Tập trung vào tài khoản nhân sự: chỉnh hồ sơ đăng nhập, active/deactive, gán vai trò và cấp quyền truy cập LMS/Content theo phạm vi hệ thống.
          </p>
          {scopeDescription ? <p className="mt-2 text-[10px] font-bold text-[var(--erg-blue)]">Cơ sở thụ hưởng: {scopeDescription}</p> : null}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button disabled={!canCreateTeacher} startIcon={<PersonAddIcon />} variant="contained" onClick={onCreateTeacher}>
            Tạo tài khoản giáo viên
          </Button>
          <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-slate-200 bg-white text-center divide-x divide-slate-200 shadow-sm shrink-0">
            <HeaderMetric label="Tổng tài khoản" value={String(users.length)} />
            <HeaderMetric label="Đang active" value={String(users.filter((user) => user.status === "ACTIVE").length)} />
            <HeaderMetric label="Chưa onboarding" value={String(users.filter((user) => !user.isProfileCompleted).length)} />
          </div>
        </div>
      </div>
      {error ? <Banner tone="error">{error}</Banner> : null}
      {notice ? <Banner tone="success">{notice}</Banner> : null}
    </header>
  );
}

export function UserAccessMemberList({
  hasLoadError,
  loadingUsers,
  onQueryChange,
  onSelect,
  onStatusChange,
  query,
  selectedUserId,
  status,
  users,
}: {
  hasLoadError: boolean;
  loadingUsers: boolean;
  onQueryChange: (value: string) => void;
  onSelect: (userId: string) => void;
  onStatusChange: (value: string) => void;
  query: string;
  selectedUserId: string;
  status: string;
  users: AccessManagedUser[];
}) {
  return (
    <aside className="border-b border-slate-200 bg-slate-50/20 lg:border-b-0 lg:border-r">
      <div className="space-y-2.5 border-b border-slate-200 p-4 bg-white">
        <label className="relative block">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <input
            className="h-9 w-full rounded-lg border border-[#d7e0ec] bg-slate-50/50 pl-9 pr-3 text-xs outline-none transition focus:border-[var(--erg-blue)] focus:bg-white focus:ring-2 focus:ring-[var(--erg-blue)]/15 placeholder:text-slate-400 font-medium"
            placeholder="Tìm tên, email, điện thoại..."
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </label>
        <AppSelect
          className="h-9 w-full rounded-lg border border-[#d7e0ec] bg-white px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue)]/15"
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
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
          <MemberRow key={user.id} user={user} active={user.id === selectedUserId} onClick={() => onSelect(user.id)} />
        ))}
      </div>
    </aside>
  );
}

export function UserAccessSectionTabs({
  active,
  onChange,
}: {
  active: WorkspaceSection;
  onChange: (section: WorkspaceSection) => void;
}) {
  return (
    <div className="flex border-b border-slate-200 mt-2 bg-slate-50/50 p-1 rounded-xl">
      {(Object.keys(sectionLabels) as WorkspaceSection[]).map((section) => (
        <button
          key={section}
          type="button"
          className={cn(
            "flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-150",
            active === section
              ? "bg-white text-slate-800 shadow border border-slate-200/60"
              : "text-slate-400 hover:text-slate-700"
          )}
          onClick={() => onChange(section)}
        >
          {sectionLabels[section]}
        </button>
      ))}
    </div>
  );
}
