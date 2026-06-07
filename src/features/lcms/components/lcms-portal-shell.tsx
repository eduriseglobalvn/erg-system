import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "@/routes/router-compat";
import {
  BookOpenCheck,
  Building2,
  ClipboardList,
  Database,
  FileCheck2,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button, Input } from "@/components/ui/dashboard-kit";
import { logoutAccount } from "@/platform/auth/api/auth-storage";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import { CreateEducationUnitDialog } from "@/features/lcms/admin-operations";
import { defaultClassId, defaultSchoolId } from "@/features/lms/classroom/api/mock-classroom-data";
import { DashboardContent } from "@/layouts/dashboard/components/dashboard-content";
import { PortalBrandMark } from "@/layouts/dashboard/components/portal-brand-mark";
import type { LmsEducationUnitDTO } from "@/features/lms/infrastructure/lms-dashboard-api";
import type { DashboardLeaf, DashboardLeafVariant } from "@/layouts/dashboard/types/dashboard-types";
import type { QuestionBankQuestion } from "@/features/lcms/quiz/question-bank";
import type { ContentScope, ManagementScope } from "@/types/scope-types";
import { cn } from "@/lib/utils";
import { AppSelect } from "@/components/ui/app-select";

type LcmsNavItem = {
  id: string;
  path: string;
  title: string;
  section: string;
  description: string;
  variant: DashboardLeafVariant;
  icon: typeof LayoutDashboard;
};

const lcmsNavItems: LcmsNavItem[] = [
  {
    id: "admin-overview",
    path: "/",
    title: "Tổng quan",
    section: "Điều hành",
    description: "Theo dõi nhanh dữ liệu hệ thống, trường/trung tâm, lớp, học sinh và các việc LCMS cần xử lý.",
    variant: "admin-overview",
    icon: LayoutDashboard,
  },
  {
    id: "admin-centers",
    path: "/schools",
    title: "Trường & Trung tâm",
    section: "Tổ chức",
    description: "Tạo, sửa và theo dõi trạng thái vận hành của trường, trung tâm và cơ sở giáo dục.",
    variant: "admin-centers",
    icon: Building2,
  },
  {
    id: "admin-sheet-import",
    path: "/import",
    title: "Import dữ liệu",
    section: "Tổ chức",
    description: "Kiểm tra sheet, map cột, tạo tài khoản học sinh và trả kết quả import cho vận hành.",
    variant: "admin-sheet-import",
    icon: ClipboardList,
  },
  {
    id: "admin-members",
    path: "/users",
    title: "Thành viên & Phân quyền",
    section: "Truy cập",
    description: "Quản lý giáo viên, quản trị viên và quyền truy cập theo vai trò/phạm vi.",
    variant: "admin-members",
    icon: UsersRound,
  },
  {
    id: "question-bank",
    path: "/questions",
    title: "Ngân hàng câu hỏi",
    section: "Nội dung nguồn",
    description: "Quản lý câu hỏi nguồn dùng chung toàn ERG và câu hỏi theo phạm vi được cấp.",
    variant: "question-bank",
    icon: Database,
  },
  {
    id: "quiz-bank",
    path: "/quiz-bank",
    title: "Quiz bank",
    section: "Nội dung nguồn",
    description: "Quản lý quiz Train/Test đã đóng gói để giáo viên giao lại trong LMS.",
    variant: "quiz-bank",
    icon: BookOpenCheck,
  },
  {
    id: "course-modules",
    path: "/quiz-editor",
    title: "Tạo quiz",
    section: "Nội dung nguồn",
    description: "Tạo hoặc chỉnh sửa quiz nguồn từ câu hỏi, slide và cấu hình player.",
    variant: "quiz-editor",
    icon: FileCheck2,
  },
  {
    id: "admin-learning-resources",
    path: "/resources",
    title: "Quản trị học liệu",
    section: "Nội dung nguồn",
    description: "Tạo taxonomy, upload tài liệu, chỉnh metadata và publish học liệu sang LMS.",
    variant: "admin-internal-docs",
    icon: BookOpenCheck,
  },
  {
    id: "admin-public-disclosure",
    path: "/legal",
    title: "Công khai pháp lý",
    section: "Cấu hình",
    description: "Quản lý PDF công khai, metadata, vị trí public và watermark trước khi xuất bản.",
    variant: "admin-public-disclosure",
    icon: ShieldCheck,
  },
  {
    id: "general-settings",
    path: "/settings",
    title: "Cấu hình",
    section: "Cấu hình",
    description: "Các thiết lập hệ thống dùng chung cho LCMS, LMS và Elearning.",
    variant: "placeholder",
    icon: Settings,
  },
];

const lcmsScope: ManagementScope = { level: "global" };
const globalContentScope: ContentScope = { type: "global" };

export function LcmsPortalShell() {
  const { actions, account } = useAuthSession("lcms");
  const navigate = useNavigate();
  const location = useLocation();
  const [createEducationUnitOpen, setCreateEducationUnitOpen] = useState(false);
  const [pendingQuestionImports, setPendingQuestionImports] = useState<QuestionBankQuestion[]>([]);
  const activeItem = resolveLcmsItem(location.pathname);
  const activeLeaf = useMemo<DashboardLeaf>(() => toDashboardLeaf(activeItem), [activeItem]);

  function openLeaf(leafId: string) {
    if (leafId === "admin-create-unit") {
      setCreateEducationUnitOpen(true);
      return;
    }

    const target = lcmsNavItems.find((item) => item.id === leafId || item.variant === leafId);
    navigate(target?.path ?? "/");
  }

  function signOut() {
    actions.signOut();
    logoutAccount();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex h-screen max-h-screen overflow-hidden bg-[#f7f8fa] text-slate-950">
      <aside className="hidden w-[292px] shrink-0 flex-col border-r border-[#cfd7e3] bg-[#f6f8fb] shadow-[1px_0_0_rgba(15,23,42,0.04)] lg:flex">
        <PortalBrandMark title="LCMS ERG" />
        <div className="hidden">
          <div className="min-w-0 flex-1 rounded-lg px-2.5 py-2">
            <span className="block truncate text-sm font-semibold text-[#0f5ea8]">LCMS ERG</span>
            <span className="mt-0.5 block truncate text-[10px] font-semibold text-slate-500">
              Học liệu Studio
            </span>
          </div>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
          {groupLcmsNav(lcmsNavItems).map((group) => (
            <div key={group.section} className="mb-5">
              <div className="px-3 pb-2 text-[11px] font-semibold text-slate-500">{group.section}</div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = item.id === activeItem.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate(item.path)}
                      className={cn(
                        "relative flex w-full items-center gap-3 rounded-md border border-transparent px-3 py-2 text-left text-sm font-semibold transition hover:border-[#dbe2ea] hover:bg-white hover:text-slate-950 hover:shadow-sm",
                        active ? "border-[#b8d6fa] bg-white text-[var(--erg-blue)] shadow-sm before:absolute before:left-0 before:top-1.5 before:h-6 before:w-1 before:rounded-r-full before:bg-[var(--erg-blue)]" : "text-slate-600",
                      )}
                    >
                      <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-md bg-white text-slate-500 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.24)]", active && "bg-[var(--erg-blue-light)] text-[var(--erg-blue)]")}> 
                        <Icon className="h-4 w-4" />
                      </span>
                      {item.title}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-[#dbe2ea] p-4">
          <div className="flex items-center gap-3 rounded-lg border border-[#d1d9e6] bg-white p-3 shadow-sm">
            <Avatar className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--erg-blue)] text-xs font-semibold text-white">
              {getInitials(account?.fullName || "LCMS ERG")}
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{account?.fullName || "LCMS ERG"}</div>
              <div className="truncate text-xs text-slate-500">{account?.email || "lcms@erg.edu.vn"}</div>
            </div>
            <button type="button" onClick={signOut} className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-rose-600" aria-label="Đăng xuất">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[68px] shrink-0 items-center gap-3 border-b border-[#cfd7e3] bg-white px-5 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
          <div className="min-w-0">
            <div className="text-xs font-medium text-slate-500">LCMS ERG / {activeItem.section}</div>
            <h1 className="truncate text-lg font-semibold text-slate-950">{activeItem.title}</h1>
          </div>
          <div className="relative ml-auto hidden w-full max-w-[420px] md:flex">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="h-9 border-0 bg-transparent shadow-none focus:ring-0" placeholder="Tìm kiếm toàn hệ thống" />
          </div>
          <AppSelect className="hidden h-9 rounded-md border border-[#d1d1d1] bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue-ring)] xl:block" defaultValue="global">
            <option value="global">Toàn ERG</option>
            <option value="center">Theo trung tâm</option>
            <option value="school">Theo trường</option>
          </AppSelect>
          <Button variant="outline" onClick={() => navigate("/resources")}>Quản lý học liệu</Button>
          <Button onClick={() => setCreateEducationUnitOpen(true)}>Tạo cơ sở</Button>
        </header>

        <div className="min-h-0 flex-1 overflow-hidden">
          <DashboardContent
            activeLeaf={activeLeaf}
            canAccessGlobalErg
            contentScope={globalContentScope}
            managementScope={lcmsScope}
            onOpenLeaf={openLeaf}
            pendingQuestionImports={pendingQuestionImports}
            selectedClassId={defaultClassId}
            selectedSchoolId={defaultSchoolId}
            onQuestionImportsHandled={() => setPendingQuestionImports([])}
            onCreateQuizFromBank={(questions) => {
              setPendingQuestionImports(questions);
              navigate("/quiz-editor");
            }}
          />
        </div>
      </div>

      <CreateEducationUnitDialog
        open={createEducationUnitOpen}
        onOpenChange={setCreateEducationUnitOpen}
        onCreated={(unit: LmsEducationUnitDTO) => {
          void unit;
          setCreateEducationUnitOpen(false);
        }}
      />
    </div>
  );
}

function resolveLcmsItem(pathname: string) {
  const normalized = pathname === "" ? "/" : pathname;
  return (
    [...lcmsNavItems]
      .filter((item) => item.path !== "/" && normalized.startsWith(item.path))
      .sort((left, right) => right.path.length - left.path.length)[0] ?? lcmsNavItems[0]!
  );
}

function toDashboardLeaf(item: LcmsNavItem): DashboardLeaf {
  return {
    id: item.id,
    title: item.title,
    breadcrumb: ["LCMS ERG", item.section, item.title],
    description: item.description,
    variant: item.variant,
  };
}

function groupLcmsNav(items: LcmsNavItem[]) {
  const sections = Array.from(new Set(items.map((item) => item.section)));
  return sections.map((section) => ({
    section,
    items: items.filter((item) => item.section === section),
  }));
}

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
