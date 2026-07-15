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
import { Link } from "@/routes/router-compat";

import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { AUTH_ACCOUNT_CHANGED_EVENT, getCurrentAccount } from "@/platform/auth/api/auth-storage";
import type { ClassroomSchool, ClassroomSnapshot } from "@/features/lms/classroom/types/classroom-types";
import type { LmsEducationUnitDTO } from "@/features/lms/infrastructure/lms-dashboard-api";
import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
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
      <div className={cn(baseClassName, "bg-[#696CFF] text-white")}>
        <ShieldIcon className="size-5" />
      </div>
    );
  }

  return (
    <div className={cn(baseClassName, "bg-[rgba(145,158,171,0.12)] text-[#637381]")}>
      <span className="text-[11px] font-semibold">{getInitials(label) || <SchoolIcon className="size-4" />}</span>
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
  const [scopeAnchor, setScopeAnchor] = useState<null | HTMLElement>(null);
  const [classAnchor, setClassAnchor] = useState<null | HTMLElement>(null);
  const [accountAnchor, setAccountAnchor] = useState<null | HTMLElement>(null);

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
    <header className="sticky top-0 z-30 border-b border-[rgba(145,158,171,0.12)] bg-white shadow-none">
      <div className="flex min-h-14 w-full items-center justify-between gap-3 px-6 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <button
            type="button"
            onClick={(event) => setScopeAnchor(event.currentTarget)}
            className={cn(
              "inline-flex h-10 max-w-full items-center gap-3 rounded-lg border border-[rgba(145,158,171,0.2)] bg-white px-3 text-left text-slate-950 outline-none transition",
              "hover:border-[#696CFF] hover:bg-[rgba(105,108,255,0.02)] focus-visible:ring-2 focus-visible:ring-[#696CFF]",
            )}
          >
            <ScopeAvatar kind={isGlobalScope ? "system" : "school"} label={scopeTitle} className="size-8 rounded-md" />
            <div className="min-w-0 pr-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-semibold text-slate-900">{scopeTitle}</span>
                <ChevronDownIcon className="size-3.5 shrink-0 text-slate-400" />
              </div>
              <span className="truncate text-[11px] font-medium text-slate-500 opacity-90">{scopeSubtitle}</span>
            </div>
          </button>

          <Menu
            anchorEl={scopeAnchor}
            open={Boolean(scopeAnchor)}
            onClose={() => setScopeAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
            slotProps={{ paper: { sx: { width: 320, p: 1, borderRadius: 2 } } }}
          >
            <div className="px-3 py-2 text-[11px] font-semibold text-slate-500">Phạm vi quản lý</div>

            {canAccessGlobalErg ? (
              <MenuItem
                onClick={() => { onSelectScopeRoot("global"); setScopeAnchor(null); }}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-md p-3",
                  activePortal === "lms" && isGlobalScope ? "bg-[rgba(105,108,255,0.08)] font-semibold text-[#696CFF] shadow-[inset_3px_0_0_#696CFF]" : "hover:bg-slate-50",
                )}
              >
                <ScopeAvatar kind="system" label={ergSystemUnit?.name || "Hệ thống ERG"} className="size-9 rounded-lg" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{ergSystemUnit?.name || "Hệ thống ERG"}</span>
                  <span className="text-[11px] font-medium opacity-70">
                    {ergSystemUnit?.address || "Toàn quyền quản trị hệ thống"}
                  </span>
                </div>
              </MenuItem>
            ) : null}

            {scopeUnits.length ? <Divider sx={{ my: 1 }} /> : null}

            <div className="max-h-60 overflow-y-auto">
              {scopeUnits.map((unit) => (
                <MenuItem
                  key={unit.id}
                  onClick={() => { onSelectScopeRoot(unit.id); setScopeAnchor(null); }}
                  className={cn(
                    "mb-1 flex cursor-pointer items-center gap-3 rounded-md p-3",
                    activePortal === "lms" && !isGlobalScope && selectedSchoolId === unit.id ? "bg-[rgba(105,108,255,0.08)] font-semibold text-[#696CFF] shadow-[inset_3px_0_0_#696CFF]" : "hover:bg-slate-50",
                  )}
                >
                  <ScopeAvatar kind="school" label={unit.name} className="size-8 rounded-md" />
                  <div className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-800">{unit.name}</span>
                    <span className="text-[11px] font-medium text-slate-500">
                      {unit.type === "center" ? "Trung tâm" : "Cơ sở giáo dục"}
                    </span>
                  </div>
                </MenuItem>
              ))}
            </div>

            {canAccessGlobalErg ? (
              <>
                <Divider sx={{ my: 1 }} />
                <MenuItem
                  className="flex cursor-pointer items-center gap-3 rounded-md p-3 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => { onOpenLeaf("admin-create-unit"); setScopeAnchor(null); }}
                >
                  <div className="grid size-9 place-items-center rounded-lg bg-emerald-100 text-emerald-600">
                    <PlusIcon className="size-5" />
                  </div>
                  <span className="text-sm font-medium">Tạo cơ sở giáo dục</span>
                </MenuItem>
              </>
            ) : null}
          </Menu>

          {activePortal === "lms" && !isGlobalScope ? (
            <>
              <div className="h-8 w-px bg-[rgba(145,158,171,0.12)]" />

              {canSelectClass ? (
                <>
                  <button
                    type="button"
                    onClick={(event) => setClassAnchor(event.currentTarget)}
                    className={cn(
                      "inline-flex h-9 items-center gap-2 rounded-lg border border-[rgba(145,158,171,0.2)] bg-white px-3 text-left transition hover:border-[#696CFF] hover:bg-[rgba(105,108,255,0.02)]",
                      "focus-visible:ring-2 focus-visible:ring-[#696CFF]",
                    )}
                  >
                    <div className="grid size-6 place-items-center rounded-md bg-[rgba(105,108,255,0.08)] text-[#696CFF] ring-1 ring-[rgba(105,108,255,0.16)]">
                      <LayoutGridIcon className="size-4" />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1">
                        <span className="text-[13px] font-semibold leading-tight text-slate-800">
                          {selectedClass?.className || "Chọn lớp học"}
                        </span>
                        <ChevronDownIcon className="size-3 text-slate-400" />
                      </div>
                      {selectedClass ? (
                        <span className="text-[11px] font-medium text-slate-500">
                          {selectedClass.studentCount} học sinh
                        </span>
                      ) : null}
                    </div>
                  </button>
                  <Menu
                    anchorEl={classAnchor}
                    open={Boolean(classAnchor)}
                    onClose={() => setClassAnchor(null)}
                    anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                    transformOrigin={{ vertical: "top", horizontal: "left" }}
                    slotProps={{ paper: { sx: { width: 256, p: 1, borderRadius: 2 } } }}
                  >
                    <div className="px-3 py-2 text-[11px] font-semibold text-slate-500">Lớp học đang quản lý</div>
                    {classes.map((classroom) => (
                      <MenuItem
                        key={classroom.id}
                        onClick={() => { onSelectClass(classroom.id); setClassAnchor(null); }}
                        className={cn(
                          "mb-1 flex cursor-pointer items-center gap-3 rounded-md p-3",
                          selectedClassId === classroom.id ? "bg-[rgba(105,108,255,0.08)] font-semibold text-[#696CFF] shadow-[inset_3px_0_0_#696CFF]" : "hover:bg-slate-50",
                        )}
                      >
                        <div className="flex size-8 items-center justify-center rounded-md bg-slate-100 text-[11px] font-semibold text-slate-600">
                          {classroom.className.substring(0, 2)}
                        </div>
                        <span className="text-sm">{classroom.className}</span>
                      </MenuItem>
                    ))}
                  </Menu>
                </>
              ) : null}
            </>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <IconButton className="size-10 rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Thông báo">
            <BellIcon className="size-5" />
          </IconButton>

          <IconButton
            onClick={(event) => setAccountAnchor(event.currentTarget)}
            className="relative size-10 rounded-full p-0 hover:bg-slate-50"
          >
            <Avatar src={accountAvatar || undefined} className="size-8 border border-slate-200 bg-white shadow-sm" sx={{ bgcolor: "#696CFF", fontSize: 11, fontWeight: 600, color: "#fff" }}>
              {getInitials(accountName)}
            </Avatar>
            <span className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-white bg-emerald-500" />
          </IconButton>
          <Menu
            anchorEl={accountAnchor}
            open={Boolean(accountAnchor)}
            onClose={() => setAccountAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            slotProps={{ paper: { sx: { width: 288, p: 1, borderRadius: 2, mt: 1 } } }}
          >
            <div className="px-2 py-2">
              <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                <Avatar src={accountAvatar || undefined} variant="rounded" className="size-12 border border-white shadow-sm" sx={{ bgcolor: "#696CFF", fontSize: 14, fontWeight: 600, color: "#fff" }}>
                  {getInitials(accountName)}
                </Avatar>
                <div className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-slate-950">{accountName}</span>
                  <span className="mt-0.5 block truncate text-xs font-medium text-slate-500">{accountEmail}</span>
                  <span className="mt-2 inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                    Online
                  </span>
                </div>
              </div>
            </div>
            <Divider sx={{ my: 1 }} />
            <MenuItem component={Link} to="/profile" onClick={() => setAccountAnchor(null)} className="flex cursor-pointer items-center gap-3 rounded-lg p-2.5 hover:bg-slate-50">
              <UserIcon className="size-4 text-slate-500" />
              <span className="text-sm">Hồ sơ cá nhân</span>
            </MenuItem>
            <MenuItem onClick={() => setAccountAnchor(null)} className="flex cursor-pointer items-center gap-3 rounded-lg p-2.5 hover:bg-slate-50">
              <SettingsIcon className="size-4 text-slate-500" />
              <span className="text-sm">Cài đặt</span>
            </MenuItem>
            <Divider sx={{ my: 1 }} />
            <MenuItem className="flex cursor-pointer items-center gap-3 rounded-lg p-2.5 text-red-600 hover:bg-red-50" onClick={() => { onLogout(); setAccountAnchor(null); }}>
              <LogOutIcon className="size-4" />
              <span className="text-sm font-medium">Đăng xuất</span>
            </MenuItem>
          </Menu>
        </div>
      </div>
    </header>
  );
}
