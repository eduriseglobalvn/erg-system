import { useMemo } from "react";
import { useLocation, useNavigate } from "@/routes/router-compat";
import { Building2, Calculator, ClipboardList, Handshake, LayoutDashboard, LogOut, PhoneCall, Search, TrendingUp } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button, Input } from "@/components/ui/dashboard-kit";
import { logoutAccount } from "@/platform/auth/api/auth-storage";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import { defaultClassId, defaultSchoolId } from "@/features/lms/classroom/api/mock-classroom-data";
import { DashboardContent } from "@/layouts/dashboard/components/dashboard-content";
import { PortalBrandMark } from "@/layouts/dashboard/components/portal-brand-mark";
import type { DashboardLeaf, DashboardLeafVariant } from "@/layouts/dashboard/types/dashboard-types";
import type { ContentScope, ManagementScope } from "@/types/scope-types";
import { cn } from "@/lib/utils";
import { AppSelect } from "@/components/ui/app-select";

type CrmNavItem = {
  id: string;
  path: string;
  title: string;
  section: string;
  description: string;
  variant: DashboardLeafVariant;
  icon: typeof LayoutDashboard;
};

const crmNavItems: CrmNavItem[] = [
  {
    id: "seo-overview",
    path: "/",
    title: "Tổng quan CRM",
    section: "CRM & P&L",
    description: "Theo dõi pipeline trường tư vấn, doanh thu dự kiến, margin và việc cần xử lý trước khi chốt.",
    variant: "seo-overview",
    icon: TrendingUp,
  },
  {
    id: "seo-schools",
    path: "/seo/schools",
    title: "Trường đã tư vấn",
    section: "CRM & P&L",
    description: "Lập danh sách trường, cập nhật tình trạng tư vấn, chờ chốt, đàm phán, chờ triển khai hoặc active.",
    variant: "seo-schools",
    icon: Building2,
  },
  {
    id: "seo-opportunities",
    path: "/seo/opportunities",
    title: "Opportunity",
    section: "CRM & P&L",
    description: "Quản lý cơ hội theo trường, chương trình, năm học, xác suất chốt và trạng thái thương lượng.",
    variant: "seo-opportunities",
    icon: Handshake,
  },
  {
    id: "seo-pnl",
    path: "/seo/pnl",
    title: "P&L chốt trường",
    section: "CRM & P&L",
    description: "Dự trù doanh thu, chi phí, lợi nhuận, margin và điểm hòa vốn trước khi chuyển trường sang vận hành.",
    variant: "seo-pnl",
    icon: Calculator,
  },
  {
    id: "seo-followups",
    path: "/seo/follow-ups",
    title: "Lịch follow-up",
    section: "CRM & P&L",
    description: "Theo dõi các việc CRM cần làm: gọi lại, gặp trường, gửi proposal, xử lý hợp đồng và bàn giao.",
    variant: "seo-followups",
    icon: PhoneCall,
  },
  {
    id: "seo-handover",
    path: "/seo/handover",
    title: "Bàn giao triển khai",
    section: "CRM & P&L",
    description: "Deal đã chốt được kiểm tra điều kiện trước khi quản lý trung tâm active và cấu hình giáo viên, lớp, học sinh.",
    variant: "seo-handover",
    icon: ClipboardList,
  },
];

const crmScope: ManagementScope = { level: "global" };
const globalContentScope: ContentScope = { type: "global" };

export function CrmPortalShell() {
  const { actions, account } = useAuthSession("crm");
  const navigate = useNavigate();
  const location = useLocation();
  const activeItem = resolveCrmItem(location.pathname);
  const activeLeaf = useMemo<DashboardLeaf>(() => toDashboardLeaf(activeItem), [activeItem]);

  function openLeaf(leafId: string) {
    const target = crmNavItems.find((item) => item.id === leafId || item.variant === leafId);
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
        <PortalBrandMark title="CRM ERG" />

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
          {groupCrmNav(crmNavItems).map((group) => (
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
            <Avatar className="size-10 rounded-lg">
              <AvatarFallback className="rounded-lg bg-[var(--erg-blue)] text-xs font-semibold text-white">
                {getInitials(account?.fullName || "CRM ERG")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{account?.fullName || "CRM ERG"}</div>
              <div className="truncate text-xs text-slate-500">{account?.email || "crm@erg.edu.vn"}</div>
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
            <div className="text-xs font-medium text-slate-500">CRM ERG / {activeItem.section}</div>
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
          <Button variant="outline" onClick={() => navigate("/seo/schools")}>Danh sách trường</Button>
        </header>

        <div className="min-h-0 flex-1 overflow-hidden">
          <DashboardContent
            activeLeaf={activeLeaf}
            canAccessGlobalErg
            contentScope={globalContentScope}
            managementScope={crmScope}
            onOpenLeaf={openLeaf}
            pendingQuestionImports={[]}
            selectedClassId={defaultClassId}
            selectedSchoolId={defaultSchoolId}
            onQuestionImportsHandled={() => undefined}
            onCreateQuizFromBank={() => undefined}
          />
        </div>
      </div>
    </div>
  );
}

function resolveCrmItem(pathname: string) {
  const normalized = pathname === "" ? "/" : pathname;
  if (normalized === "/seo") return crmNavItems[0]!;
  return (
    [...crmNavItems]
      .filter((item) => item.path !== "/" && normalized.startsWith(item.path))
      .sort((left, right) => right.path.length - left.path.length)[0] ?? crmNavItems[0]!
  );
}

function toDashboardLeaf(item: CrmNavItem): DashboardLeaf {
  return {
    id: item.id,
    title: item.title,
    breadcrumb: ["CRM ERG", item.section, item.title],
    description: item.description,
    variant: item.variant,
  };
}

function groupCrmNav(items: CrmNavItem[]) {
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
