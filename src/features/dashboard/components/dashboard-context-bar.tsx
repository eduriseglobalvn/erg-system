import { useEffect, useState } from "react";
import {
  Plus as PlusIcon,
  Bell as BellIcon,
  BookOpen as BookOpenIcon,
  Shield as ShieldIcon,
  LayoutGrid as LayoutGridIcon,
  ChevronDown as ChevronDownIcon,  LogOut as LogOutIcon,
  User as UserIcon,
  Settings as SettingsIcon
} from "lucide-react";
import { Link } from "react-router-dom";

import { Avatar } from "@/components/ui/avatar";
import { AUTH_ACCOUNT_CHANGED_EVENT, getCurrentAccount } from "@/features/auth/api/auth-storage";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ClassroomSchool, ClassroomSnapshot } from "@/features/classroom/types/classroom-types";
import type { LmsEducationUnitDTO } from "@/features/dashboard/api/lms-dashboard-api";
import type { DashboardLeaf } from "@/features/dashboard/types/dashboard-types";
import { cn } from "@/lib/utils";
import type { ManagementScope } from "@/types/scope-types";

interface DashboardContextBarProps {
  activePortal: "lms" | "hoclieu";
  canAccessGlobalErg: boolean;
  classes: ClassroomSnapshot[];
  managementScope: ManagementScope;
  onOpenLeaf: (leafId: DashboardLeaf["id"]) => void;
  onSelectClass: (classId: string) => void;
  onSelectScopeRoot: (schoolId: string | "global" | "hoclieu-studio") => void;
  onLogout: () => void;
  schools: ClassroomSchool[];
  systemUnits: LmsEducationUnitDTO[];
  selectedClassId?: string;
  selectedSchoolId?: string;
}

export function DashboardContextBar({
  activePortal,
  canAccessGlobalErg,
  classes,
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
  const isHocLieuPortal = activePortal === "hoclieu";
  const ergSystemUnit = systemUnits.find((unit) => unit.code === "ERG-SYSTEM");
  const hoclieuStudioUnit = systemUnits.find((unit) => unit.code === "HOCLIEU-STUDIO");
  const canOpenHocLieuStudio = canAccessGlobalErg || isHocLieuPortal || Boolean(hoclieuStudioUnit);
  const selectedSchool = schools.find((s) => s.id === selectedSchoolId);
  const selectedClass = classes.find((c) => c.id === selectedClassId);

  const canSelectClass = activePortal === "lms" && !isGlobalScope && classes.length > 0;
  const [account, setAccount] = useState(() => getCurrentAccount());

  useEffect(() => {
    const syncAccount = () => setAccount(getCurrentAccount());
    window.addEventListener(AUTH_ACCOUNT_CHANGED_EVENT, syncAccount);
    return () => window.removeEventListener(AUTH_ACCOUNT_CHANGED_EVENT, syncAccount);
  }, []);
  const accountName = account?.fullName || "Giáo viên ERG";
  const accountEmail = account?.email || "teacher@erg.edu.vn";
  const accountAvatar = account?.avatarUrl || "/assets/images/mock-teacher-avatar.png";

  const copy = {
    classLabel: "Chọn lớp học",
    contextLabel: "Phạm vi quản lý",
    createEducationUnit: "Tạo cơ sở giáo dục",
    createQuiz: "Tạo bài tập/quiz",
    notifications: "Thông báo",
    questionBank: "Ngân hàng câu hỏi",
    schoolScope: "Cơ sở giáo dục",
    schoolScopeDescription: "Quản lý dữ liệu cấp trường",
    students: "Học sinh",
    hoclieuStudio: "Hoclieu Studio",
    hoclieuStudioDescription: "Quản trị kho học liệu",
    systemScope: "Hệ thống ERG",
    systemScopeDescription: "Toàn quyền quản trị hệ thống",
    logout: "Đăng xuất",
    profile: "Hồ sơ cá nhân",
    settings: "Cài đặt"
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-[0_1px_0_rgba(15,23,42,0.02)] backdrop-blur">
      <div className="flex min-h-16 w-full items-center justify-between gap-3 px-6 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "inline-flex h-12 max-w-full items-center gap-3 rounded-2xl border border-transparent px-2 text-left text-slate-950 outline-none transition",
                  "hover:bg-slate-50 focus-visible:ring-4 focus-visible:ring-blue-100",
                )}
              >
                <div className="relative">
                  <Avatar className="size-10 rounded-xl border border-slate-200 shadow-sm ring-2 ring-white overflow-hidden">
                    <img 
                      src={isHocLieuPortal || isGlobalScope ? "/assets/images/erg-logo-circle.png" : selectedSchool?.logoURL ?? "/assets/images/school-placeholder.png"} 
                      alt="Logo" 
                      className="aspect-square h-full w-full object-cover"
                    />
                  </Avatar>
                </div>
                <div className="flex flex-col min-w-0 pr-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[15px] font-extrabold tracking-tight text-slate-900 uppercase">
                      {isHocLieuPortal ? (hoclieuStudioUnit?.name || "Hoclieu Studio") : isGlobalScope ? (ergSystemUnit?.name || "Hệ thống ERG") : (selectedSchool?.name || "Chọn cơ sở")}
                    </span>
                    <ChevronDownIcon className="size-3.5 text-slate-400 shrink-0" />
                  </div>
                  <span className="truncate text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-80">
                    {isHocLieuPortal ? (hoclieuStudioUnit?.address || "Hệ thống học liệu") : isGlobalScope ? (ergSystemUnit?.address || copy.systemScope) : copy.schoolScope}
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80 rounded-2xl p-2 shadow-2xl ring-1 ring-slate-200">
              <DropdownMenuLabel className="px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Phạm vi quản lý
              </DropdownMenuLabel>
              {canAccessGlobalErg && (
                <DropdownMenuItem 
                  onClick={() => onSelectScopeRoot("global")}
                  className={cn(
                    "flex items-center gap-3 rounded-xl p-3 transition cursor-pointer",
                    activePortal === "lms" && isGlobalScope ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50"
                  )}
                >
                  <div className="grid size-9 place-items-center rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-100">
                    <ShieldIcon className="size-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">{ergSystemUnit?.name || copy.systemScope}</span>
                    <span className="text-[10px] opacity-70 uppercase font-bold tracking-tight">{ergSystemUnit?.address || copy.systemScopeDescription}</span>
                  </div>
                </DropdownMenuItem>
              )}
              {canOpenHocLieuStudio && (
                <DropdownMenuItem 
                  onClick={() => onSelectScopeRoot("hoclieu-studio")}
                  className={cn(
                    "flex items-center gap-3 rounded-xl p-3 transition cursor-pointer",
                    isHocLieuPortal ? "bg-indigo-50 text-[var(--erg-blue)]" : "hover:bg-slate-50"
                  )}
                >
                  <div className="grid size-9 place-items-center rounded-lg bg-[var(--erg-blue)] text-white shadow-lg shadow-blue-100">
                    <BookOpenIcon className="size-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">{hoclieuStudioUnit?.name || copy.hoclieuStudio}</span>
                    <span className="text-[10px] opacity-70 uppercase font-bold tracking-tight">{hoclieuStudioUnit?.address || copy.hoclieuStudioDescription}</span>
                  </div>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="my-2" />
              <div className="max-h-60 overflow-y-auto">
                {schools.map((school) => (
                  <DropdownMenuItem
                    key={school.id}
                    onClick={() => onSelectScopeRoot(school.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl p-3 transition cursor-pointer mb-1",
                      activePortal === "lms" && !isGlobalScope && selectedSchool?.id === school.id ? "bg-slate-100 text-slate-900" : "hover:bg-slate-50"
                    )}
                  >
                    <Avatar className="size-9 rounded-lg border border-slate-200 overflow-hidden">
                      <img src={school.logoURL ?? "/assets/images/school-placeholder.png"} alt={school.name} className="object-cover" />
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="truncate text-sm font-bold text-slate-800">{school.name}</span>
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Cơ sở giáo dục</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
              
              {canAccessGlobalErg && (
                <>
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuItem
                    className="flex items-center gap-3 rounded-xl p-3 text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                    onClick={() => onOpenLeaf("admin-create-unit")}
                  >
                    <div className="grid size-9 place-items-center rounded-lg bg-emerald-100 text-emerald-600">
                      <PlusIcon className="size-5" />
                    </div>
                    <span className="text-sm font-bold">{copy.createEducationUnit}</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {activePortal === "lms" && !isGlobalScope && (
            <>
              <div className="h-8 w-px bg-slate-200" />

              {canSelectClass && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-50 px-4 text-left transition hover:bg-slate-100 focus-visible:ring-4 focus-visible:ring-blue-100",
                        "border border-slate-200/60 shadow-sm"
                      )}
                    >
                      <div className="grid size-7 place-items-center rounded-lg bg-white text-blue-600 shadow-sm ring-1 ring-slate-200">
                        <LayoutGridIcon className="size-4" />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <span className="text-[13px] font-bold text-slate-800 leading-tight">
                            {selectedClass?.className || copy.classLabel}
                          </span>
                          <ChevronDownIcon className="size-3 text-slate-400" />
                        </div>
                        {selectedClass && (
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                            {selectedClass.studentCount} {copy.students}
                          </span>
                        )}
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64 rounded-2xl p-2 shadow-2xl ring-1 ring-slate-200">
                    <DropdownMenuLabel className="px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      Lớp học đang quản lý
                    </DropdownMenuLabel>
                    {classes.map((cls) => (
                      <DropdownMenuItem
                        key={cls.id}
                        onClick={() => onSelectClass(cls.id)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl p-3 transition cursor-pointer mb-1",
                          selectedClassId === cls.id ? "bg-blue-50 text-blue-700 font-bold" : "hover:bg-slate-50"
                        )}
                      >
                        <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-bold uppercase text-slate-600">
                          {cls.className.substring(0, 2)}
                        </div>
                        <span className="text-sm">{cls.className}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="ghost" size="icon" className="size-10 rounded-xl text-slate-500 hover:bg-slate-100" aria-label={copy.notifications}>
            <BellIcon className="size-5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative size-10 rounded-full p-0 hover:bg-slate-100 focus-visible:ring-4 focus-visible:ring-blue-100">
                <Avatar className="size-8 overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
                  <img src={accountAvatar} alt={accountName} className="h-full w-full object-cover" />
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-white bg-emerald-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={10} className="w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
              <DropdownMenuLabel className="px-2 py-2">
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                  <Avatar className="size-12 overflow-hidden rounded-xl border border-white shadow-sm">
                    <img src={accountAvatar} alt={accountName} className="h-full w-full object-cover" />
                  </Avatar>
                  <div className="min-w-0">
                    <span className="block truncate text-sm font-extrabold text-slate-950">{accountName}</span>
                    <span className="mt-0.5 block truncate text-xs font-medium text-slate-500">{accountEmail}</span>
                    <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">Online</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuItem asChild className="flex items-center gap-3 rounded-xl p-2.5 cursor-pointer hover:bg-slate-50">
                <Link to="/profile">
                  <UserIcon className="size-4 text-slate-500" />
                  <span className="text-sm">{copy.profile}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-3 rounded-xl p-2.5 cursor-pointer hover:bg-slate-50">
                <SettingsIcon className="size-4 text-slate-500" />
                <span className="text-sm">{copy.settings}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuItem 
                className="flex items-center gap-3 rounded-xl p-2.5 cursor-pointer text-red-600 hover:bg-red-50"
                onClick={onLogout}
              >
                <LogOutIcon className="size-4" />
                <span className="text-sm font-bold">{copy.logout}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
