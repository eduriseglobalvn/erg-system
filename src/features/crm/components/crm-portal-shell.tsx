import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Building2, Calculator, ClipboardList, Handshake, LayoutDashboard, LogOut, PhoneCall, Search, TrendingUp } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button, Input } from "@/components/ui/dashboard-kit";
import { logoutAccount } from "@/features/auth/api/auth-storage";
import { useAuthSession } from "@/features/auth/hooks/use-auth-session";
import { defaultClassId, defaultSchoolId } from "@/features/classroom/api/mock-classroom-data";
import { DashboardContent } from "@/features/dashboard/components/dashboard-content";
import { PortalBrandMark } from "@/features/dashboard/components/portal-brand-mark";
import type { DashboardLeaf, DashboardLeafVariant } from "@/features/dashboard/types/dashboard-types";
import type { ContentScope, ManagementScope } from "@/types/scope-types";
import { cn } from "@/lib/utils";

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
    title: "Tá»•ng quan CRM",
    section: "CRM & P&L",
    description: "Theo dÃµi pipeline trÆ°á»ng tÆ° váº¥n, doanh thu dá»± kiáº¿n, margin vÃ  viá»‡c cáº§n xá»­ lÃ½ trÆ°á»›c khi chá»‘t.",
    variant: "seo-overview",
    icon: TrendingUp,
  },
  {
    id: "seo-schools",
    path: "/seo/schools",
    title: "TrÆ°á»ng Ä‘Ã£ tÆ° váº¥n",
    section: "CRM & P&L",
    description: "Láº­p danh sÃ¡ch trÆ°á»ng, cáº­p nháº­t tÃ¬nh tráº¡ng tÆ° váº¥n, chá» chá»‘t, Ä‘Ã m phÃ¡n, chá» triá»ƒn khai hoáº·c active.",
    variant: "seo-schools",
    icon: Building2,
  },
  {
    id: "seo-opportunities",
    path: "/seo/opportunities",
    title: "Opportunity",
    section: "CRM & P&L",
    description: "Quáº£n lÃ½ cÆ¡ há»™i theo trÆ°á»ng, chÆ°Æ¡ng trÃ¬nh, nÄƒm há»c, xÃ¡c suáº¥t chá»‘t vÃ  tráº¡ng thÃ¡i thÆ°Æ¡ng lÆ°á»£ng.",
    variant: "seo-opportunities",
    icon: Handshake,
  },
  {
    id: "seo-pnl",
    path: "/seo/pnl",
    title: "P&L chá»‘t trÆ°á»ng",
    section: "CRM & P&L",
    description: "Dá»± trÃ¹ doanh thu, chi phÃ­, lá»£i nhuáº­n, margin vÃ  Ä‘iá»ƒm hÃ²a vá»‘n trÆ°á»›c khi chuyá»ƒn trÆ°á»ng sang váº­n hÃ nh.",
    variant: "seo-pnl",
    icon: Calculator,
  },
  {
    id: "seo-followups",
    path: "/seo/follow-ups",
    title: "Lá»‹ch follow-up",
    section: "CRM & P&L",
    description: "Theo dÃµi cÃ¡c viá»‡c CRM cáº§n lÃ m: gá»i láº¡i, gáº·p trÆ°á»ng, gá»­i proposal, xá»­ lÃ½ há»£p Ä‘á»“ng vÃ  bÃ n giao.",
    variant: "seo-followups",
    icon: PhoneCall,
  },
  {
    id: "seo-handover",
    path: "/seo/handover",
    title: "BÃ n giao triá»ƒn khai",
    section: "CRM & P&L",
    description: "Deal Ä‘Ã£ chá»‘t Ä‘Æ°á»£c kiá»ƒm tra Ä‘iá»u kiá»‡n trÆ°á»›c khi quáº£n lÃ½ trung tÃ¢m active vÃ  cáº¥u hÃ¬nh giÃ¡o viÃªn, lá»›p, há»c sinh.",
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
    <div className="flex h-screen max-h-screen overflow-hidden bg-[#f5f7fb] text-slate-950">
      <aside className="hidden w-[292px] shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <PortalBrandMark title="CRM ERG" />

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
          {groupCrmNav(crmNavItems).map((group) => (
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
              {getInitials(account?.fullName || "CRM ERG")}
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-black">{account?.fullName || "CRM ERG"}</div>
              <div className="truncate text-xs text-slate-500">{account?.email || "crm@erg.edu.vn"}</div>
            </div>
            <button type="button" onClick={signOut} className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-rose-600" aria-label="ÄÄƒng xuáº¥t">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[76px] shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-5">
          <div className="min-w-0">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">CRM ERG / {activeItem.section}</div>
            <h1 className="truncate text-xl font-black text-slate-950">{activeItem.title}</h1>
          </div>
          <div className="ml-auto hidden w-full max-w-[420px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 md:flex">
            <Search className="h-4 w-4 text-slate-400" />
            <Input className="border-0 bg-transparent shadow-none focus:ring-0" placeholder="TÃ¬m kiáº¿m toÃ n há»‡ thá»‘ng" />
          </div>
          <select className="hidden h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 xl:block" defaultValue="global">
            <option value="global">ToÃ n ERG</option>
            <option value="center">Theo trung tÃ¢m</option>
            <option value="school">Theo trÆ°á»ng</option>
          </select>
          <Button variant="outline" onClick={() => navigate("/seo/schools")}>Danh sÃ¡ch trÆ°á»ng</Button>
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
