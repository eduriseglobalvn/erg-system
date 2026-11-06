import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import { CheckCircle2 } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import type { SeoLeadStatus, SeoSchoolLead } from "@/features/crm/seo/types/seo-crm-types";
import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
import { cn } from "@/lib/utils";

type BadgeTone = "primary" | "secondary" | "success" | "warning" | "danger" | "outline";

const ERG_TONE = { primary: "info", secondary: "neutral", success: "success", warning: "warning", danger: "error", outline: "neutral" } as const;

export function toErgTone(tone: BadgeTone): ComponentProps<typeof ErgStatusChip>["tone"] {
  return ERG_TONE[tone];
}

export function SeoBadge({ tone, label }: { tone: BadgeTone; label: ReactNode }) {
  return <ErgStatusChip tone={toErgTone(tone)} label={label} />;
}

export const pipelineStatuses: SeoLeadStatus[] = [
  "new_lead", "consulted", "waiting_decision", "negotiating", "won_pending_setup", "active",
];

export const statusLabelMap: Record<SeoLeadStatus, string> = {
  new_lead: "Lead mới",
  consulted: "Đã tư vấn",
  waiting_decision: "Chờ chốt",
  negotiating: "Đàm phán",
  won_pending_setup: "Chờ triển khai",
  active: "Active",
  paused: "Tạm dừng",
  lost: "Rớt deal",
};

export const statusToneMap: Record<SeoLeadStatus, BadgeTone> = {
  new_lead: "outline", consulted: "secondary", waiting_decision: "warning", negotiating: "primary",
  won_pending_setup: "warning", active: "success", paused: "outline", lost: "danger",
};

export function SeoCrmLoading() {
  return <div className="space-y-4"><Skeleton variant="rounded" height={112} /><Skeleton variant="rounded" height={280} /></div>;
}

export function SeoActions({ activeVariant, onOpenLeaf }: { activeVariant: DashboardLeaf["variant"]; onOpenLeaf: (leafId: string) => void }) {
  if (activeVariant === "seo-handover") {
    return <Button variant="contained" onClick={() => onOpenLeaf("admin-centers")}>Sang quản lý cơ sở</Button>;
  }
  if (activeVariant === "seo-pnl" || activeVariant === "seo-opportunities") {
    return <Button variant="contained" onClick={() => onOpenLeaf("seo-handover")}>Xem bàn giao</Button>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outlined" onClick={() => onOpenLeaf("seo-pnl")}>Mở P&amp;L</Button>
      <Button variant="contained" onClick={() => onOpenLeaf("seo-schools")}>Danh sách trường</Button>
    </div>
  );
}

export function SeoScopeSummary({ leads }: { leads: SeoSchoolLead[] }) {
  const activeCount = leads.filter((lead) => lead.status === "active").length;
  const pendingSetupCount = leads.filter((lead) => lead.status === "won_pending_setup").length;
  return (
    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <div>
        <p className="text-xs font-semibold text-slate-400">Luồng dữ liệu</p>
        <p className="mt-1 text-sm font-semibold text-slate-950">
          SEO tạo lead và P&amp;L trước, quản lý trung tâm chỉ nhận quyền vận hành khi trường chuyển Active.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <SeoBadge tone="warning" label={`${pendingSetupCount} chờ triển khai`} />
        <SeoBadge tone="success" label={`${activeCount} active`} />
      </div>
    </div>
  );
}

export function HandoverPermission({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
      <span className="grid size-9 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><CheckCircle2 className="size-4" /></span>
      <span className="text-sm font-semibold text-slate-800">{label}</span>
    </div>
  );
}

export function DecisionLine({ label, ok, value }: { label: string; ok: boolean; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-3">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <span className={cn("text-sm font-semibold", ok ? "text-emerald-700" : "text-rose-700")}>{value}</span>
    </div>
  );
}

export function InfoLine({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-4"><div className="text-xs font-semibold text-slate-400">{label}</div><div className="mt-2 text-sm font-semibold text-slate-950">{value}</div></div>;
}

export function MiniValue({ label, value }: { label: string; value: string }) {
  return <div><div className="text-[11px] font-semibold text-slate-400">{label}</div><div className="mt-1 text-sm font-semibold text-slate-950">{value}</div></div>;
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value);
}

export function formatCurrencyCompact(value: number) {
  if (Math.abs(value) >= 1_000_000_000) return `${formatCurrency(value / 1_000_000_000)} tỷ`;
  if (Math.abs(value) >= 1_000_000) return `${formatCurrency(value / 1_000_000)} triệu`;
  return formatCurrency(value);
}

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(date);
}
