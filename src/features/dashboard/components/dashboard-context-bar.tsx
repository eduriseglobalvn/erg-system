import { useEffect, useState } from "react";
import {
  Bell as BellIcon,
  ChevronDown as ChevronDownIcon,
  LayoutGrid as LayoutGridIcon,
  LogOut as LogOutIcon,
  Plus as PlusIcon,
  School as SchoolIcon,
  Settings as SettingsIcon,
  Shield as ShieldIcon,
  User as UserIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AUTH_ACCOUNT_CHANGED_EVENT, getCurrentAccount } from "@/features/auth/api/auth-storage";
import type { ClassroomSchool, ClassroomSnapshot } from "@/features/classroom/types/classroom-types";
import type { LmsEducationUnitDTO } from "@/features/lms/infrastructure/lms-dashboard-api";
import type { DashboardLeaf } from "@/features/dashboard/types/dashboard-types";
import { cn } from "@/lib/utils";
import type { ManagementScope } from "@/types/scope-types";

interface DashboardContextBarProps {
  activePortal: "lms";
  canAccessGlobalErg: boolean;
  classes: ClassroomSnapshot[];
  manageableUnits: LmsEducationUnitDTO[];
  managementScope: ManagementScope;
  onOpenLeaf: (leafId: DashboardLeaf["id"]) => void;
  onSelectClass: (classId: string) => void;
  onSelectScopeRoot: (schoolId: string | "global") => void;
  onLogout: () => void;
  schools: ClassroomSchool[];
  systemUnits: LmsEducationUnitDTO[];
  selectedClassId?: string;
  selectedSchoolId?: string;
}

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function ScopeAvatar({
  kind,
  label,
  className,
}: {
  kind: "system" | "school";
  label: string;
  className?: string;
}) {
  const baseClassName = cn("grid shrink-0 place-items-center", className);

  if (kind === "system") {
    return (
      <div className={cn(baseClassName, "bg-blue-600 text-white")}>
        <ShieldIcon className="size-5" />
      </div>
    );
  }

  return (
    <div className={cn(baseClassName, "bg-slate-100 text-slate-700 ring-1 ring-slate-200")}>
      <span className="text-[11px] font-black tracking-tight">{getInitials(label) || <SchoolIcon className="size-4" />}</span>
    </div>
  );
}

export function DashboardContextBar({
  activePortal,
  canAccessGlobalErg,
  classes,
  manageableUnits,
  managementScope,
  onOpenLeaf,
  onSelectClass,
  onSelectScopeRoot,
  onLogout,
  schools,
  systemUnits,
  selectedClassId,
  selectedSchoolId,
}: DashboardContextBarProps) {
  const isGlobalScope = managementScope.level === "global";
  const ergSystemUnit = systemUnits.find((unit) => unit.code === "ERG-SYSTEM");
  const selectedSchool = schools.find((school) => school.id === selectedSchoolId);
  const selectedClass = classes.find((classroom) => classroom.id === selectedClassId);
  const scopeUnits = manageableUnits.filter((unit) => unit.type !== "system" && unit.code !== "HOCLIEU-STUDIO");
  const canSelectClass = activePortal === "lms" && !isGlobalScope && classes.length > 0;
  const [account, setAccount] = useState(() => getCurrentAccount());

  useEffect(() => {
    const syncAccount = () => setAccount(getCurrentAccount());
    window.addEventListener(AUTH_ACCOUNT_CHANGED_EVENT, syncAccount);
    return () => window.removeEventListener(AUTH_ACCOUNT_CHANGED_EVENT, syncAccount);
  }, []);

  const accountName = account?.fullName || "Giáo viên ERG";
  const accountEmail = account?.email || "teacher@erg.edu.vn";
  const accountAvatar = account?.avatarUrl || "";
  const scopeTitle = isGlobalScope
    ? ergSystemUnit?.name || "He thong ERG"
    : selectedSchool?.name || "Chon co so";
  const scopeSubtitle = isGlobalScope
    ? ergSystemUnit?.address || "He thong ERG"
    : "Co so giao duc";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="flex min-h-16 w-full items-center justify-between gap-3 px-6 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "inline-flex h-12 max-w-full items-center gap-3 rounded-xl border border-transparent px-2 text-left text-slate-950 outline-none",
                  "hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-100",
                )}
              >
                <ScopeAvatar kind={isGlobalScope ? "system" : "school"} label={scopeTitle} className="size-10 rounded-xl" />
                <div className="min-w-0 pr-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[15px] font-extrabold uppercase tracking-tight text-slate-900">{scopeTitle}</span>
                    <ChevronDownIcon className="size-3.5 shrink-0 text-slate-400" />
                  </div>
                  <span className="truncate text-[10px] font-bold uppercase tracking-widest text-slate-500 opacity-80">{scopeSubtitle}</span>
                </div>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-sm data-open:animate-none data-closed:animate-none">
              <DropdownMenuLabel className="px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Phạm vi quản lý
              </DropdownMenuLabel>

              {canAccessGlobalErg ? (
                <DropdownMenuItem
                  onClick={() => onSelectScopeRoot("global")}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl p-3",
                    activePortal === "lms" && isGlobalScope ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50",
                  )}
                >
                  <ScopeAvatar kind="system" label={ergSystemUnit?.name || "Hệ thống ERG"} className="size-9 rounded-lg" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">{ergSystemUnit?.name || "Hệ thống ERG"}</span>
                    <span className="text-[10px] font-bold uppercase tracking-tight opacity-70">
                      {ergSystemUnit?.address || "Toàn quyền quản trị hệ thống"}
                    </span>
                  </div>
                </DropdownMenuItem>
              ) : null}


              {scopeUnits.length ? <DropdownMenuSeparator className="my-2" /> : null}

              <div className="max-h-60 overflow-y-auto">
                {scopeUnits.map((unit) => (
                  <DropdownMenuItem
                    key={unit.id}
                    onClick={() => onSelectScopeRoot(unit.id)}
                    className={cn(
                      "mb-1 flex cursor-pointer items-center gap-3 rounded-xl p-3",
                      activePortal === "lms" && !isGlobalScope && selectedSchoolId === unit.id ? "bg-slate-100 text-slate-900" : "hover:bg-slate-50",
                    )}
                  >
                    <ScopeAvatar kind="school" label={unit.name} className="size-9 rounded-lg" />
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-bold text-slate-800">{unit.name}</span>
                      <span className="text-[10px] font-bold uppercase tracking-tight text-slate-500">
                        {unit.type === "center" ? "Trung tâm" : "Cơ sở giáo dục"}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>

              {canAccessGlobalErg ? (
                <>
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuItem
                    className="flex cursor-pointer items-center gap-3 rounded-xl p-3 text-emerald-700 hover:bg-emerald-50"
                    onClick={() => onOpenLeaf("admin-create-unit")}
                  >
                    <div className="grid size-9 place-items-center rounded-lg bg-emerald-100 text-emerald-600">
                      <PlusIcon className="size-5" />
                    </div>
                    <span className="text-sm font-bold">Tạo cơ sở giáo dục</span>
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>

          {activePortal === "lms" && !isGlobalScope ? (
            <>
              <div className="h-8 w-px bg-slate-200" />

              {canSelectClass ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200/60 bg-slate-50 px-4 text-left hover:bg-slate-100",
                        "focus-visible:ring-2 focus-visible:ring-blue-100",
                      )}
                    >
                      <div className="grid size-7 place-items-center rounded-lg bg-white text-blue-600 shadow-sm ring-1 ring-slate-200">
                        <LayoutGridIcon className="size-4" />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <span className="text-[13px] font-bold leading-tight text-slate-800">
                            {selectedClass?.className || "Chọn lớp học"}
                          </span>
                          <ChevronDownIcon className="size-3 text-slate-400" />
                        </div>
                        {selectedClass ? (
                          <span className="text-[9px] font-bold uppercase tracking-tighter text-slate-500">
                            {selectedClass.studentCount} học sinh
                          </span>
                        ) : null}
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64 rounded-2xl p-2 shadow-sm ring-1 ring-slate-200">
                    <DropdownMenuLabel className="px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      Lớp học đang quản lý
                    </DropdownMenuLabel>
                    {classes.map((classroom) => (
                      <DropdownMenuItem
                        key={classroom.id}
                        onClick={() => onSelectClass(classroom.id)}
                        className={cn(
                          "mb-1 flex cursor-pointer items-center gap-3 rounded-xl p-3",
                          selectedClassId === classroom.id ? "bg-blue-50 font-bold text-blue-700" : "hover:bg-slate-50",
                        )}
                      >
                        <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-bold uppercase text-slate-600">
                          {classroom.className.substring(0, 2)}
                        </div>
                        <span className="text-sm">{classroom.className}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="ghost" size="icon" className="size-10 rounded-xl text-slate-500 hover:bg-slate-100" aria-label="Thông báo">
            <BellIcon className="size-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative size-10 rounded-full p-0 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-100">
                <Avatar className="size-8 overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
                  {accountAvatar ? (
                    <img src={accountAvatar} alt={accountName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-full w-full place-items-center bg-[var(--erg-blue)] text-[11px] font-black text-white">
                      {getInitials(accountName)}
                    </span>
                  )}
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-white bg-emerald-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={10} className="w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
              <DropdownMenuLabel className="px-2 py-2">
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                  <Avatar className="size-12 overflow-hidden rounded-xl border border-white shadow-sm">
                    {accountAvatar ? (
                      <img src={accountAvatar} alt={accountName} className="h-full w-full object-cover" />
                    ) : (
                      <span className="grid h-full w-full place-items-center bg-[var(--erg-blue)] text-sm font-black text-white">
                        {getInitials(accountName)}
                      </span>
                    )}
                  </Avatar>
                  <div className="min-w-0">
                    <span className="block truncate text-sm font-extrabold text-slate-950">{accountName}</span>
                    <span className="mt-0.5 block truncate text-xs font-medium text-slate-500">{accountEmail}</span>
                    <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">
                      Online
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuItem asChild className="flex cursor-pointer items-center gap-3 rounded-xl p-2.5 hover:bg-slate-50">
                <Link to="/profile">
                  <UserIcon className="size-4 text-slate-500" />
                  <span className="text-sm">Hồ sơ cá nhân</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex cursor-pointer items-center gap-3 rounded-xl p-2.5 hover:bg-slate-50">
                <SettingsIcon className="size-4 text-slate-500" />
                <span className="text-sm">Cài đặt</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuItem className="flex cursor-pointer items-center gap-3 rounded-xl p-2.5 text-red-600 hover:bg-red-50" onClick={onLogout}>
                <LogOutIcon className="size-4" />
                <span className="text-sm font-bold">Đăng xuất</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
