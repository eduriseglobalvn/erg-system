import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BookOpenCheck,
  Building2,
  ClipboardList,
  Database,
  FileCheck2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button, Input } from "@/components/ui/dashboard-kit";
import { logoutAccount } from "@/features/auth/api/auth-storage";
import { useAuthSession } from "@/features/auth/hooks/use-auth-session";
import { CreateEducationUnitDialog } from "@/features/admin-operations";
import { defaultClassId, defaultSchoolId } from "@/features/classroom/api/mock-classroom-data";
import { DashboardContent } from "@/features/dashboard/components/dashboard-content";
import { PortalBrandMark } from "@/features/dashboard/components/portal-brand-mark";
import type { LmsEducationUnitDTO } from "@/features/dashboard/api/lms-dashboard-api";
import type { DashboardLeaf, DashboardLeafVariant } from "@/features/dashboard/types/dashboard-types";
import type { QuestionBankQuestion } from "@/features/question-bank";
import type { ContentScope, ManagementScope } from "@/types/scope-types";
import { cn } from "@/lib/utils";

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
    id: "admin-students",
    path: "/students",
    title: "Lớp & Học sinh",
    section: "Tổ chức",
    description: "Tra cứu học sinh, lớp học và dữ liệu học tập theo phạm vi toàn hệ thống.",
    variant: "admin-students",
    icon: GraduationCap,
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
    id: "admin-hoclieu-studio",
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
    <div className="flex h-screen max-h-screen overflow-hidden bg-[#f5f7fb] text-slate-950">
      <aside className="hidden w-[292px] shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <PortalBrandMark title="LCMS ERG" />
        <div className="hidden">
          <div className="min-w-0 flex-1 rounded-xl px-2.5 py-2">
            <span className="block truncate text-sm font-black uppercase tracking-tight text-[#0b1f80]">LCMS ERG</span>
            <span className="mt-0.5 block truncate text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              Học liệu Studio
            </span>
          </div>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
          {groupLcmsNav(lcmsNavItems).map((group) => (
            <div key={group.section} className="mb-5">
              <div className="px-3 pb-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{group.section}</div>
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
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition",
                        active ? "bg-[#0b6fcf] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.title}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <Avatar className="grid h-11 w-11 place-items-center rounded-xl bg-[#0b1f80] text-xs font-black text-white">
              {getInitials(account?.fullName || "LCMS ERG")}
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-black">{account?.fullName || "LCMS ERG"}</div>
              <div className="truncate text-xs text-slate-500">{account?.email || "lcms@erg.edu.vn"}</div>
            </div>
            <button type="button" onClick={signOut} className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-rose-600" aria-label="Đăng xuất">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[76px] shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-5">
          <div className="min-w-0">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">LCMS ERG / {activeItem.section}</div>
            <h1 className="truncate text-xl font-black text-slate-950">{activeItem.title}</h1>
          </div>
          <div className="ml-auto hidden w-full max-w-[420px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 md:flex">
            <Search className="h-4 w-4 text-slate-400" />
            <Input className="border-0 bg-transparent shadow-none focus:ring-0" placeholder="Tìm kiếm toàn hệ thống" />
          </div>
          <select className="hidden h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 xl:block" defaultValue="global">
            <option value="global">Toàn ERG</option>
            <option value="center">Theo trung tâm</option>
            <option value="school">Theo trường</option>
          </select>
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
