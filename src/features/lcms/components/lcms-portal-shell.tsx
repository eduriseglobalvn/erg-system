import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "@/routes/router-compat";
import {
  BarChart3,
  BookOpenCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Database,
  FileCheck2,
  FileText,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/dashboard-kit";
import { Button } from "@/components/ui/button";
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
  lmsTarget?: string;
  status?: "ready" | "setup";
};

const lcmsNavItems: LcmsNavItem[] = [
  {
    id: "admin-overview",
    path: "/",
    title: "Tổng quan",
    section: "Tổng quan",
    description: "Theo dõi nhanh dữ liệu hệ thống, trường/trung tâm, lớp, học sinh và các việc LCMS cần xử lý.",
    variant: "admin-overview",
    icon: LayoutDashboard,
    lmsTarget: "Bản đồ LCMS -> LMS",
  },
  {
    id: "admin-centers",
    path: "/schools",
    title: "Trường & Trung tâm",
    section: "Tổ chức",
    description: "Tạo trường/trung tâm, mở chi tiết từng trường và import danh sách lớp trong đúng phạm vi trường đó.",
    variant: "admin-centers",
    icon: Building2,
    lmsTarget: "Trường, lớp, học sinh",
  },
  {
    id: "admin-members",
    path: "/users",
    title: "Thành viên",
    section: "Tổ chức",
    description: "Quản lý giáo viên, quản trị viên và quyền truy cập theo vai trò/phạm vi.",
    variant: "admin-members",
    icon: UsersRound,
    lmsTarget: "Phân quyền",
  },
  {
    id: "question-bank",
    path: "/questions",
    title: "Ngân hàng câu hỏi",
    section: "Nội dung",
    description: "Quản lý câu hỏi nguồn dùng chung toàn ERG và câu hỏi theo phạm vi được cấp.",
    variant: "question-bank",
    icon: Database,
    lmsTarget: "Bài tập, kiểm tra",
  },
  {
    id: "quiz-bank",
    path: "/quiz-bank",
    title: "Quiz bank",
    section: "Nội dung",
    description: "Quản lý quiz Train/Test đã đóng gói để giáo viên giao lại trong LMS.",
    variant: "quiz-bank",
    icon: BookOpenCheck,
    lmsTarget: "Homework",
  },
  {
    id: "course-modules",
    path: "/quiz-editor",
    title: "Tạo quiz",
    section: "Nội dung",
    description: "Tạo hoặc chỉnh sửa quiz nguồn từ câu hỏi, slide và cấu hình player.",
    variant: "quiz-editor",
    icon: FileCheck2,
    lmsTarget: "Quiz runtime",
  },
  {
    id: "admin-learning-resources",
    path: "/resources",
    title: "Quản trị học liệu",
    section: "Nội dung",
    description: "Tạo taxonomy, upload tài liệu, chỉnh metadata và publish học liệu sang LMS.",
    variant: "admin-internal-docs",
    icon: BookOpenCheck,
    lmsTarget: "Resources",
  },
  {
    id: "assignment-templates",
    path: "/assignments",
    title: "Gói giao bài",
    section: "Thiết lập LMS",
    description: "Chuẩn hóa mẫu giao homework, điều kiện mở bài, hạn nộp và quy tắc chấm để giáo viên dùng nhanh trong LMS.",
    variant: "lcms-template",
    icon: ClipboardList,
    lmsTarget: "Homework",
    status: "setup",
  },
  {
    id: "rubric-templates",
    path: "/rubrics",
    title: "Thang điểm",
    section: "Thiết lập LMS",
    description: "Quản lý rubric, nhãn đánh giá và quy tắc phân loại kết quả để đồng bộ sang bảng điểm LMS.",
    variant: "lcms-template",
    icon: BarChart3,
    lmsTarget: "Score",
    status: "setup",
  },
  {
    id: "session-templates",
    path: "/session-templates",
    title: "Mẫu buổi học",
    section: "Thiết lập LMS",
    description: "Thiết lập mẫu buổi học, lịch dạy, ghi chú lớp và cấu trúc điểm danh trước khi vận hành trên LMS.",
    variant: "lcms-template",
    icon: CalendarDays,
    lmsTarget: "Attendance, Calendar",
    status: "setup",
  },
  {
    id: "report-templates",
    path: "/report-templates",
    title: "Mẫu báo cáo",
    section: "Thiết lập LMS",
    description: "Tạo cấu trúc báo cáo, nhãn cảnh báo và chỉ số tổng hợp để giáo viên xem trong Reports.",
    variant: "lcms-template",
    icon: FileText,
    lmsTarget: "Reports",
    status: "setup",
  },
  {
    id: "publishing-policy",
    path: "/legal",
    title: "Duyệt xuất bản",
    section: "Xuất bản",
    description: "Kiểm soát quy trình duyệt, pháp lý nội dung và nhật ký xuất bản trước khi học liệu đi sang LMS.",
    variant: "lcms-template",
    icon: ShieldCheck,
    lmsTarget: "Publish flow",
    status: "setup",
  },
  {
    id: "general-settings",
    path: "/settings",
    title: "Cấu hình",
    section: "Xuất bản",
    description: "Các thiết lập hệ thống dùng chung cho LCMS, LMS và Elearning.",
    variant: "lcms-template",
    icon: Settings,
    lmsTarget: "System",
    status: "setup",
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
    <div className="flex h-[100dvh] min-h-[100dvh] overflow-hidden bg-[var(--background)] text-slate-900 antialiased">
      <aside className="hidden w-[292px] shrink-0 flex-col border-r border-[#d9e2ef] bg-white shadow-[6px_0_28px_-24px_rgba(15,23,42,0.35)] lg:flex">
        <div className="border-b border-[#e3ebf5]">
          <PortalBrandMark title="LCMS ERG" />
          <div className="px-4 pb-3">
            <div className="rounded-xl border border-[#d9e2ef] bg-[#f8fbff] px-3 py-2.5">
              <div className="flex items-center gap-2 text-[11px] font-bold text-[var(--erg-blue)]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Nguồn cho LMS
              </div>
              <p className="mt-1 text-[11px] leading-4 text-slate-600">Tạo bài, điểm, lịch, học liệu và báo cáo.</p>
            </div>
          </div>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-3 scrollbar-thin">
          {groupLcmsNav(lcmsNavItems).map((group) => (
            <div key={group.section} className="mb-3.5">
              <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{group.section}</div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = item.id === activeItem.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate(item.path)}
                      className={cn(
                        "relative flex w-full items-center gap-2.5 rounded-[10px] border px-2 py-2 text-left transition-all duration-150",
                        active
                          ? "border-[#b8d6fa] bg-[#eef6ff] text-[var(--erg-blue)] shadow-[var(--shadow-xs)]"
                          : "border-transparent text-slate-600 hover:border-[#d9e2ef] hover:bg-[#f8fbff] hover:text-slate-950",
                      )}
                    >
                      <span className={cn(
                        "grid h-7 w-7 shrink-0 place-items-center rounded-[8px] border border-[#d9e2ef] bg-white text-slate-500 transition-colors",
                        active && "border-[#b8d6fa] bg-white text-[var(--erg-blue)]"
                      )}> 
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="block truncate text-[13px] font-bold">{item.title}</span>
                          {item.status === "setup" ? (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" aria-label="Đang thiết lập" />
                          ) : null}
                        </span>
                        {item.lmsTarget ? (
                          <span className={cn("mt-0.5 block truncate text-[10px] font-semibold", active ? "text-blue-700/70" : "text-slate-400")}>
                            {item.lmsTarget}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Teacher profile at bottom-left */}
        <div className="shrink-0 border-t border-[#e3ebf5] bg-[#f8fbff] p-3">
          <div className="flex items-center gap-3 rounded-xl border border-[#d9e2ef] bg-white p-2.5 shadow-[var(--shadow-xs)] transition duration-150 hover:border-[#b8c8db]">
            <Avatar className="h-9 w-9 border border-slate-100 shadow-inner rounded-full flex items-center justify-center">
              <AvatarFallback className="bg-[var(--erg-blue)] text-xs font-semibold text-white">
                {getInitials(account?.email ?? "EA")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-slate-800" title={account?.email ?? "Admin ERG"}>
                {account?.email?.split("@")[0] ?? "Admin ERG"}
              </div>
              <div className="truncate text-[11px] font-semibold text-slate-500">Teacher workspace</div>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="grid h-8 w-8 place-items-center rounded-[9px] border border-[#d9e2ef] text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
              aria-label="Đăng xuất"
              title="Đăng xuất"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-[72px] shrink-0 items-center gap-3 border-b border-[#d9e2ef] bg-white px-4 shadow-[0_1px_0_rgba(15,23,42,0.04)] sm:px-5">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="truncate">LCMS ERG</span>
              <span className="text-slate-300">/</span>
              <span className="truncate">{activeItem.section}</span>
            </div>
            <h1 className="truncate text-lg font-semibold text-slate-950">{activeItem.title}</h1>
          </div>
          <div className="relative ml-auto hidden w-full max-w-[360px] md:flex">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="h-10 bg-[#f8fbff] pl-9 shadow-none" placeholder="Tìm nội dung, quiz, học liệu" />
          </div>
          <AppSelect className="hidden h-9 rounded-md border border-[#d7e0ec] bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue-ring)] xl:block" defaultValue="global">
            <option value="global">Toàn ERG</option>
            <option value="center">Theo trung tâm</option>
            <option value="school">Theo trường</option>
          </AppSelect>
          <Button variant="secondary" size="sm" className="hidden text-[var(--erg-blue)] sm:inline-flex" onClick={() => navigate("/resources")}>Học liệu</Button>
          {activeItem.id !== "admin-centers" ? (
            <Button
              size="sm"
              className="shrink-0"
              onClick={() => setCreateEducationUnitOpen(true)}
            >
              Tạo đơn vị
            </Button>
          ) : null}
        </header>

        <div className="border-b border-[#d9e2ef] bg-white px-3 py-2 lg:hidden">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {lcmsNavItems.filter((item) => ["admin-overview", "admin-centers", "question-bank", "quiz-bank", "admin-learning-resources", "assignment-templates", "publishing-policy"].includes(item.id)).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.path)}
                className={cn(
                  "min-h-9 shrink-0 rounded-[10px] border px-3 text-sm font-bold",
                  item.id === activeItem.id
                    ? "border-[#b8d6fa] bg-[#eef6ff] text-[var(--erg-blue)]"
                    : "border-[#d9e2ef] bg-white text-slate-600",
                )}
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>

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
