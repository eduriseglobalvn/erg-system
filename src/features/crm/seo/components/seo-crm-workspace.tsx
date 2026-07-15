import { useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  DollarSign,
  Handshake,
  LineChart,
  PhoneCall,
  Search,
  TrendingUp,
  UsersRound,
} from "lucide-react";

import {
  DashboardMetricCard,
  DashboardPageShell,
  DashboardSectionCard,
  DashboardSegmentedControl,
} from "@/components/dashboard/dashboard-page-shell";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import TextField from "@mui/material/TextField";
import {
  calculateSeoPnlSummary,
  costTotal,
  revenueNet,
  seoFollowUps,
  seoHandoverRequests,
  seoOpportunities,
  seoSchoolLeads,
} from "@/features/crm/seo/api/seo-crm-api";
import type { SeoLeadStatus, SeoOpportunity, SeoSchoolLead } from "@/features/crm/seo/types/seo-crm-types";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
import { cn } from "@/lib/utils";
import { AppSelect } from "@/components/ui/app-select";

type SeoCrmWorkspaceProps = {
  activeLeaf: DashboardLeaf;
  onOpenLeaf: (leafId: string) => void;
};

type BadgeTone = "primary" | "secondary" | "success" | "warning" | "danger" | "outline";

function toChipProps(tone: BadgeTone) {
  if (tone === "outline") {
    return { variant: "outlined" as const, color: "default" as const };
  }
  const colorMap: Record<Exclude<BadgeTone, "outline">, "primary" | "secondary" | "success" | "warning" | "error"> = {
    primary: "primary",
    secondary: "secondary",
    success: "success",
    warning: "warning",
    danger: "error",
  };
  return { variant: "filled" as const, color: colorMap[tone] };
}

const pipelineStatuses: SeoLeadStatus[] = [
  "new_lead",
  "consulted",
  "waiting_decision",
  "negotiating",
  "won_pending_setup",
  "active",
];

const statusLabelMap: Record<SeoLeadStatus, string> = {
  new_lead: "Lead mới",
  consulted: "Đã tư vấn",
  waiting_decision: "Chờ chốt",
  negotiating: "Đàm phán",
  won_pending_setup: "Chờ triển khai",
  active: "Active",
  paused: "Tạm dừng",
  lost: "Rớt deal",
};

const statusToneMap: Record<SeoLeadStatus, "primary" | "secondary" | "success" | "warning" | "danger" | "outline"> = {
  new_lead: "outline",
  consulted: "secondary",
  waiting_decision: "warning",
  negotiating: "primary",
  won_pending_setup: "warning",
  active: "success",
  paused: "outline",
  lost: "danger",
};

export function SeoCrmWorkspace({ activeLeaf, onOpenLeaf }: SeoCrmWorkspaceProps) {
  const [leads, setLeads] = useState(seoSchoolLeads);
  const [selectedLeadId, setSelectedLeadId] = useState(seoSchoolLeads[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const debouncedQuery = useDebouncedValue(query);
  const selectedLead = leads.find((lead) => lead.id === selectedLeadId) ?? leads[0];
  const selectedOpportunity = seoOpportunities.find((opportunity) => opportunity.leadId === selectedLead?.id) ?? seoOpportunities[0];
  const filteredLeads = useMemo(
    () =>
      leads.filter((lead) => {
        const keyword = debouncedQuery.trim().toLowerCase();
        const matchesQuery =
          !keyword ||
          lead.schoolName.toLowerCase().includes(keyword) ||
          lead.district.toLowerCase().includes(keyword) ||
          lead.contactName.toLowerCase().includes(keyword);
        const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
        return matchesQuery && matchesStatus;
      }),
    [debouncedQuery, leads, statusFilter],
  );

  function updateLeadStatus(leadId: string, status: SeoLeadStatus) {
    setLeads((current) => current.map((lead) => (lead.id === leadId ? { ...lead, status } : lead)));
  }

  return (
    <DashboardPageShell
      badge="SEO CRM"
      title={activeLeaf.title}
      description={activeLeaf.description}
      breadcrumbs={activeLeaf.breadcrumb}
      actions={<SeoActions activeVariant={activeLeaf.variant} onOpenLeaf={onOpenLeaf} />}
      headerContent={<SeoScopeSummary leads={leads} />}
    >
      {activeLeaf.variant === "seo-overview" ? (
        <SeoOverview leads={leads} onOpenLeaf={onOpenLeaf} onSelectLead={setSelectedLeadId} />
      ) : null}
      {activeLeaf.variant === "seo-schools" ? (
        <SeoSchoolPipeline
          filteredLeads={filteredLeads}
          query={query}
          selectedLead={selectedLead}
          statusFilter={statusFilter}
          onQueryChange={setQuery}
          onSelectLead={setSelectedLeadId}
          onStatusFilterChange={setStatusFilter}
          onUpdateLeadStatus={updateLeadStatus}
        />
      ) : null}
      {activeLeaf.variant === "seo-opportunities" || activeLeaf.variant === "seo-pnl" ? (
        <SeoPnlWorkspace lead={selectedLead} opportunity={selectedOpportunity} onUpdateLeadStatus={updateLeadStatus} />
      ) : null}
      {activeLeaf.variant === "seo-followups" ? <SeoFollowUpWorkspace leads={leads} onSelectLead={setSelectedLeadId} /> : null}
      {activeLeaf.variant === "seo-handover" ? (
        <SeoHandoverWorkspace leads={leads} onOpenLeaf={onOpenLeaf} onUpdateLeadStatus={updateLeadStatus} />
      ) : null}
    </DashboardPageShell>
  );
}

function SeoActions({ activeVariant, onOpenLeaf }: { activeVariant: DashboardLeaf["variant"]; onOpenLeaf: (leafId: string) => void }) {
  if (activeVariant === "seo-handover") {
    return <Button variant="contained" onClick={() => onOpenLeaf("admin-centers")}>Sang quản lý cơ sở</Button>;
  }

  if (activeVariant === "seo-pnl" || activeVariant === "seo-opportunities") {
    return <Button variant="contained" onClick={() => onOpenLeaf("seo-handover")}>Xem bàn giao</Button>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outlined" onClick={() => onOpenLeaf("seo-pnl")}>Mở P&L</Button>
      <Button variant="contained" onClick={() => onOpenLeaf("seo-schools")}>Danh sách trường</Button>
    </div>
  );
}

function SeoScopeSummary({ leads }: { leads: SeoSchoolLead[] }) {
  const activeCount = leads.filter((lead) => lead.status === "active").length;
  const pendingSetupCount = leads.filter((lead) => lead.status === "won_pending_setup").length;

  return (
    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <div>
        <p className="text-xs font-semibold text-slate-400">Luồng dữ liệu</p>
        <p className="mt-1 text-sm font-semibold text-slate-950">
          SEO tạo lead và P&L trước, quản lý trung tâm chỉ nhận quyền vận hành khi trường chuyển Active.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Chip label={`${pendingSetupCount} chờ triển khai`} size="small" {...toChipProps("warning")} />
        <Chip label={`${activeCount} active`} size="small" {...toChipProps("success")} />
      </div>
    </div>
  );
}

function SeoOverview({
  leads,
  onOpenLeaf,
  onSelectLead,
}: {
  leads: SeoSchoolLead[];
  onOpenLeaf: (leafId: string) => void;
  onSelectLead: (leadId: string) => void;
}) {
  const opportunities = seoOpportunities.map((opportunity) => ({
    opportunity,
    lead: leads.find((lead) => lead.id === opportunity.leadId),
    pnl: calculateSeoPnlSummary(opportunity),
  }));
  const pipelineValue = opportunities.reduce((sum, item) => sum + item.pnl.netRevenue * ((item.lead?.probability ?? 0) / 100), 0);
  const avgMargin = opportunities.reduce((sum, item) => sum + item.pnl.marginRate, 0) / Math.max(1, opportunities.length);
  const closingSoon = leads.filter((lead) => ["waiting_decision", "negotiating", "won_pending_setup"].includes(lead.status)).length;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard label="Trường pipeline" value={String(leads.length)} detail="lead SEO đang theo dõi" tone="blue" icon={<UsersRound className="size-5" />} />
        <DashboardMetricCard label="Weighted P&L" value={formatCurrencyCompact(pipelineValue)} detail="doanh thu theo xác suất chốt" tone="emerald" icon={<TrendingUp className="size-5" />} />
        <DashboardMetricCard label="Margin TB" value={formatPercent(avgMargin)} detail="theo P&L hiện tại" tone={avgMargin >= 0.28 ? "emerald" : "amber"} icon={<LineChart className="size-5" />} />
        <DashboardMetricCard label="Cần chốt" value={String(closingSoon)} detail="đang chờ quyết định/đàm phán" tone="amber" icon={<Handshake className="size-5" />} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
        <DashboardSectionCard title="Pipeline chốt trường" description="Theo dõi trạng thái từ tư vấn đến active. Cột Active là dữ liệu đã bàn giao cho vận hành.">
          <div className="grid gap-3 lg:grid-cols-6">
            {pipelineStatuses.map((status) => {
              const statusLeads = leads.filter((lead) => lead.status === status);
              return (
                <section key={status} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-500">{statusLabelMap[status]}</span>
                    <Chip label={statusLeads.length} size="small" {...toChipProps(statusToneMap[status])} />
                  </div>
                  <div className="mt-3 space-y-2">
                    {statusLeads.map((lead) => (
                      <button
                        key={lead.id}
                        type="button"
                        onClick={() => {
                          onSelectLead(lead.id);
                          onOpenLeaf("seo-schools");
                        }}
                        className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-[#b8d6fa] hover:bg-[var(--erg-blue-light)]"
                      >
                        <div className="font-semibold text-slate-950">{lead.schoolName}</div>
                        <div className="mt-1 text-xs text-slate-500">{lead.expectedClasses} lớp · {lead.probability}% chốt</div>
                      </button>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard title="Việc SEO cần xử lý" description="Các điểm chặn trước khi chuyển sang vận hành.">
          <div className="space-y-3">
            {seoFollowUps.slice(0, 4).map((followUp) => {
              const lead = leads.find((item) => item.id === followUp.leadId);
              return (
                <button
                  key={followUp.id}
                  type="button"
                  onClick={() => lead ? onSelectLead(lead.id) : undefined}
                  className="w-full rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:border-[#b8d6fa] hover:bg-[var(--erg-blue-light)]"
                >
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[var(--erg-blue-light)] text-[var(--erg-blue)]">
                      <CalendarClock className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-slate-950">{followUp.title}</span>
                      <span className="mt-1 block text-sm text-slate-500">{lead?.schoolName ?? "Trường"} · {formatDate(followUp.dueAt)}</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </DashboardSectionCard>
      </div>
    </div>
  );
}

function SeoSchoolPipeline({
  filteredLeads,
  query,
  selectedLead,
  statusFilter,
  onQueryChange,
  onSelectLead,
  onStatusFilterChange,
  onUpdateLeadStatus,
}: {
  filteredLeads: SeoSchoolLead[];
  query: string;
  selectedLead?: SeoSchoolLead;
  statusFilter: string;
  onQueryChange: (value: string) => void;
  onSelectLead: (leadId: string) => void;
  onStatusFilterChange: (value: string) => void;
  onUpdateLeadStatus: (leadId: string, status: SeoLeadStatus) => void;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
      <DashboardSectionCard title="Danh sách trường đã tư vấn" description="SEO lọc theo tình trạng để biết trường nào cần gọi lại, trường nào chờ chốt, trường nào đã sang vận hành.">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_210px]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <TextField
              size="small"
              fullWidth
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Tìm trường, quận, người liên hệ..."
              sx={{ "& .MuiInputBase-input": { pl: "1.5rem" } }}
            />
          </label>
          <AppSelect
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value)}
            className="h-11 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:border-[#b8d6fa] focus:ring-4 focus:ring-[var(--erg-blue-ring)]"
          >
            <option value="all">Tất cả tình trạng</option>
            {([...pipelineStatuses, "paused", "lost"] as SeoLeadStatus[]).map((status) => (
              <option key={status} value={status}>{statusLabelMap[status]}</option>
            ))}
          </AppSelect>
        </div>
        <div className="mt-4 max-h-[650px] space-y-3 overflow-y-auto pr-1">
          {filteredLeads.map((lead) => (
            <button
              key={lead.id}
              type="button"
              onClick={() => onSelectLead(lead.id)}
              className={cn(
                "w-full rounded-lg border bg-white p-4 text-left transition hover:border-[#b8d6fa] hover:bg-[var(--erg-blue-light)]",
                selectedLead?.id === lead.id ? "border-[#b8d6fa] ring-4 ring-[var(--erg-blue-ring)]" : "border-slate-200",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-950">{lead.schoolName}</h3>
                  <p className="mt-1 text-sm text-slate-500">{lead.district}, {lead.province} · {lead.segment}</p>
                </div>
                <Chip label={statusLabelMap[lead.status]} size="small" {...toChipProps(statusToneMap[lead.status])} />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <MiniValue label="Xác suất" value={`${lead.probability}%`} />
                <MiniValue label="Lớp" value={String(lead.expectedClasses)} />
                <MiniValue label="Follow-up" value={formatDate(lead.nextFollowUpAt)} />
              </div>
            </button>
          ))}
        </div>
      </DashboardSectionCard>

      {selectedLead ? (
        <SchoolLeadDetail lead={selectedLead} onUpdateLeadStatus={onUpdateLeadStatus} />
      ) : null}
    </div>
  );
}

function SchoolLeadDetail({
  lead,
  onUpdateLeadStatus,
}: {
  lead: SeoSchoolLead;
  onUpdateLeadStatus: (leadId: string, status: SeoLeadStatus) => void;
}) {
  return (
    <DashboardSectionCard
      title={lead.schoolName}
      description="Hồ sơ SEO của trường trước khi chuyển sang vận hành LMS."
      action={<Chip label={statusLabelMap[lead.status]} size="small" {...toChipProps(statusToneMap[lead.status])} />}
    >
      <div className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-2">
          <InfoLine label="Người liên hệ" value={`${lead.contactName} · ${lead.contactRole}`} />
          <InfoLine label="Số điện thoại" value={lead.phone} />
          <InfoLine label="Nguồn lead" value={lead.source} />
          <InfoLine label="SEO phụ trách" value={lead.ownerName} />
          <InfoLine label="Quy mô dự kiến" value={`${lead.expectedClasses} lớp · ${lead.expectedStudents} học sinh`} />
          <InfoLine label="Lần chăm sóc gần nhất" value={formatDate(lead.lastTouchAt)} />
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-semibold text-slate-950">Xác suất chốt</span>
            <span className="text-sm font-semibold text-slate-950">{lead.probability}%</span>
          </div>
          <LinearProgress
            variant="determinate"
            value={Math.max(0, Math.min(100, lead.probability))}
            className="mt-3"
            sx={{ height: 8, borderRadius: 9999, "& .MuiLinearProgress-bar": { bgcolor: "var(--erg-blue)" } }}
          />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-950">Ghi chú tư vấn</h3>
          <p className="mt-2 rounded-lg border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">{lead.notes}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-950">Rủi ro cần xử lý</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {lead.risks.map((risk) => <Chip key={risk} label={risk} size="small" {...toChipProps("warning")} />)}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-slate-400">Cập nhật tình trạng</span>
            <AppSelect
              value={lead.status}
              onChange={(event) => onUpdateLeadStatus(lead.id, event.target.value as SeoLeadStatus)}
              className="h-11 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:border-[#b8d6fa] focus:ring-4 focus:ring-[var(--erg-blue-ring)]"
            >
              {([...pipelineStatuses, "paused", "lost"] as SeoLeadStatus[]).map((status) => (
                <option key={status} value={status}>{statusLabelMap[status]}</option>
              ))}
            </AppSelect>
          </label>
        </div>
      </div>
    </DashboardSectionCard>
  );
}

function SeoPnlWorkspace({
  lead,
  opportunity,
  onUpdateLeadStatus,
}: {
  lead?: SeoSchoolLead;
  opportunity?: SeoOpportunity;
  onUpdateLeadStatus: (leadId: string, status: SeoLeadStatus) => void;
}) {
  if (!lead || !opportunity) return null;
  const summary = calculateSeoPnlSummary(opportunity);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard label="Doanh thu net" value={formatCurrencyCompact(summary.netRevenue)} detail={`Sau miễn giảm ${formatCurrencyCompact(summary.totalDiscount)}`} tone="emerald" icon={<DollarSign className="size-5" />} />
        <DashboardMetricCard label="Tổng chi phí" value={formatCurrencyCompact(summary.totalCost)} detail="nhân sự, thiết bị, vận hành" tone="amber" icon={<ClipboardCheck className="size-5" />} />
        <DashboardMetricCard label="Lợi nhuận" value={formatCurrencyCompact(summary.grossProfit)} detail={`Margin ${formatPercent(summary.marginRate)}`} tone={summary.marginRate >= 0.28 ? "emerald" : "rose"} icon={<LineChart className="size-5" />} />
        <DashboardMetricCard label="Hòa vốn" value={`${summary.breakEvenStudents} HS`} detail="ước tính theo giá net TB" tone="blue" icon={<UsersRound className="size-5" />} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <DashboardSectionCard title={`P&L ${opportunity.code}`} description={`${lead.schoolName} · năm học ${opportunity.academicYear} · bắt đầu ${opportunity.startMonth}`}>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <div className="grid grid-cols-[1.4fr_0.8fr_0.6fr_0.6fr_0.8fr_0.6fr_0.9fr] gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-400">
                <span>Chương trình</span>
                <span>Gói</span>
                <span>Lớp</span>
                <span>HS/lớp</span>
                <span>Đơn giá</span>
                <span>Giảm</span>
                <span className="text-right">Doanh thu</span>
              </div>
              <div className="divide-y divide-slate-200 bg-white">
                {opportunity.revenueLines.map((line) => (
                  <div key={line.id} className="grid grid-cols-[1.4fr_0.8fr_0.6fr_0.6fr_0.8fr_0.6fr_0.9fr] gap-3 px-4 py-4 text-sm">
                    <span className="font-semibold text-slate-950">{line.program}</span>
                    <span className="text-slate-600">{line.packageName}</span>
                    <span>{line.classCount}</span>
                    <span>{line.studentsPerClass}</span>
                    <span>{formatCurrency(line.pricePerStudent)}</span>
                    <span>{formatPercent(line.discountRate)}</span>
                    <span className="text-right font-semibold">{formatCurrency(revenueNet(line))}</span>
                  </div>
                ))}
              </div>
            </div>
          </DashboardSectionCard>

          <DashboardSectionCard title="Dự trù chi phí" description="Các dòng bắt buộc sẽ đi kèm checklist bàn giao để trung tâm chuẩn bị vận hành.">
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <div className="grid grid-cols-[0.8fr_1.5fr_0.5fr_0.8fr_0.7fr_0.9fr] gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-400">
                <span>Loại</span>
                <span>Diễn giải</span>
                <span>SL</span>
                <span>Đơn giá</span>
                <span>Tháng</span>
                <span className="text-right">Thành tiền</span>
              </div>
              <div className="divide-y divide-slate-200 bg-white">
                {opportunity.costLines.map((line) => (
                  <div key={line.id} className="grid grid-cols-[0.8fr_1.5fr_0.5fr_0.8fr_0.7fr_0.9fr] gap-3 px-4 py-4 text-sm">
                    <span className="font-semibold text-slate-950">{line.category}</span>
                    <span className="text-slate-600">{line.description}</span>
                    <span>{line.quantity}</span>
                    <span>{formatCurrency(line.unitCost)}</span>
                    <span>{line.durationMonths}</span>
                    <span className="text-right font-semibold">{formatCurrency(costTotal(line))}</span>
                  </div>
                ))}
              </div>
            </div>
          </DashboardSectionCard>
        </div>

        <DashboardSectionCard title="Quyết định chốt" description="SEO chỉ chuyển sang bàn giao, không tự cấp lớp/giáo viên/học sinh.">
          <div className="space-y-3">
            <DecisionLine label="Điều kiện margin" ok={summary.marginRate >= 0.28} value={formatPercent(summary.marginRate)} />
            <DecisionLine label="Có trường phụ trách" ok value={lead.ownerName} />
            <DecisionLine label="Có lịch follow-up" ok value={formatDate(lead.nextFollowUpAt)} />
            <DecisionLine label="Trạng thái hiện tại" ok={lead.status !== "lost"} value={statusLabelMap[lead.status]} />
          </div>
          <Button
            variant="contained"
            fullWidth
            className="mt-4"
            endIcon={<ArrowRight className="size-4" />}
            disabled={summary.marginRate < 0.2 || lead.status === "lost"}
            onClick={() => onUpdateLeadStatus(lead.id, "won_pending_setup")}
          >
            Chốt và chuyển chờ triển khai
          </Button>
        </DashboardSectionCard>
      </div>
    </div>
  );
}

function SeoFollowUpWorkspace({ leads, onSelectLead }: { leads: SeoSchoolLead[]; onSelectLead: (leadId: string) => void }) {
  const [mode, setMode] = useState("open");
  const visibleFollowUps = seoFollowUps.filter((item) => (mode === "open" ? !item.done : true));

  return (
    <DashboardSectionCard
      title="Lịch follow-up SEO"
      description="Một nơi để đội SEO biết hôm nay cần gọi, gặp, gửi proposal hoặc đẩy hợp đồng nào."
      action={<DashboardSegmentedControl value={mode} onChange={setMode} options={[{ value: "open", label: "Cần làm" }, { value: "all", label: "Tất cả" }]} />}
    >
      <div className="grid gap-3 lg:grid-cols-2">
        {visibleFollowUps.map((followUp) => {
          const lead = leads.find((item) => item.id === followUp.leadId);
          return (
            <article key={followUp.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-[var(--erg-blue-light)] text-[var(--erg-blue)]">
                    {followUp.type === "call" ? <PhoneCall className="size-5" /> : <CalendarClock className="size-5" />}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-950">{followUp.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">{lead?.schoolName ?? "Không rõ trường"} · {followUp.ownerName}</p>
                  </div>
                </div>
                <Chip label={formatDate(followUp.dueAt)} size="small" {...toChipProps("warning")} />
              </div>
              <div className="mt-4 flex justify-end">
                <Button variant="outlined" size="small" onClick={() => lead ? onSelectLead(lead.id) : undefined}>Mở hồ sơ</Button>
              </div>
            </article>
          );
        })}
      </div>
    </DashboardSectionCard>
  );
}

function SeoHandoverWorkspace({
  leads,
  onOpenLeaf,
  onUpdateLeadStatus,
}: {
  leads: SeoSchoolLead[];
  onOpenLeaf: (leafId: string) => void;
  onUpdateLeadStatus: (leadId: string, status: SeoLeadStatus) => void;
}) {
  const handoverLeads = leads.filter((lead) => lead.status === "won_pending_setup" || lead.status === "active");
  const requests = handoverLeads.map((lead) => {
    const request = seoHandoverRequests.find((item) => item.leadId === lead.id);
    const opportunity = seoOpportunities.find((item) => item.leadId === lead.id);
    return { lead, request, opportunity };
  });

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <DashboardSectionCard title="Bàn giao triển khai" description="Deal đã chốt sẽ nằm ở đây trước khi quản lý trung tâm tạo lớp, cấp giáo viên và import học sinh.">
        <div className="space-y-3">
          {requests.map(({ lead, opportunity, request }) => {
            const checklist = request?.checklist ?? [
              { id: "contract", label: "Có xác nhận chốt/hợp đồng nguyên tắc", done: lead.probability >= 90 },
              { id: "pnl", label: "P&L đạt margin tối thiểu", done: opportunity ? calculateSeoPnlSummary(opportunity).marginRate >= 0.28 : false },
              { id: "scope", label: "Xác định trung tâm phụ trách", done: true },
              { id: "classes", label: "Có danh sách lớp dự kiến", done: false },
            ];
            const doneCount = checklist.filter((item) => item.done).length;
            const ready = doneCount >= checklist.length - 1;

            return (
              <article key={lead.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-950">{lead.schoolName}</h3>
                    <p className="mt-1 text-sm text-slate-500">{opportunity?.code ?? "Chưa có P&L"} · {lead.expectedClasses} lớp dự kiến</p>
                  </div>
                  <Chip
                    size="small"
                    label={lead.status === "active" ? "Active" : ready ? "Sẵn sàng" : "Thiếu dữ liệu"}
                    {...toChipProps(lead.status === "active" ? "success" : ready ? "warning" : "outline")}
                  />
                </div>
                <div className="mt-4 grid gap-2">
                  {checklist.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className={cn("size-4", item.done ? "text-emerald-600" : "text-slate-300")} />
                      <span className={item.done ? "text-slate-700" : "text-slate-500"}>{item.label}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <Button variant="outlined" size="small" onClick={() => onOpenLeaf("seo-pnl")}>Xem P&L</Button>
                  <Button variant="contained" size="small" disabled={!ready || lead.status === "active"} onClick={() => onUpdateLeadStatus(lead.id, "active")}>
                    Duyệt active
                  </Button>
                </div>
              </article>
            );
          })}
          {!requests.length ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              Chưa có trường nào ở trạng thái chờ triển khai.
            </div>
          ) : null}
        </div>
      </DashboardSectionCard>

      <DashboardSectionCard title="Sau khi Active" description="Các thao tác vận hành được mở ở module quản lý trung tâm, không nằm trong quyền SEO.">
        <div className="space-y-3">
          <HandoverPermission label="Cấp quyền giáo viên" />
          <HandoverPermission label="Tạo lớp theo năm học" />
          <HandoverPermission label="Import học sinh" />
          <HandoverPermission label="Gán học liệu và quiz" />
        </div>
        <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={() => onOpenLeaf("admin-centers")}>Mở quản lý cơ sở</Button>
      </DashboardSectionCard>
    </div>
  );
}

function HandoverPermission({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
      <span className="grid size-9 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
        <CheckCircle2 className="size-4" />
      </span>
      <span className="text-sm font-semibold text-slate-800">{label}</span>
    </div>
  );
}

function DecisionLine({ label, ok, value }: { label: string; ok: boolean; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-3">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <span className={cn("text-sm font-semibold", ok ? "text-emerald-700" : "text-rose-700")}>{value}</span>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="text-xs font-semibold text-slate-400">{label}</div>
      <div className="mt-2 text-sm font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function MiniValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value);
}

function formatCurrencyCompact(value: number) {
  if (Math.abs(value) >= 1_000_000_000) return `${formatCurrency(value / 1_000_000_000)} tỷ`;
  if (Math.abs(value) >= 1_000_000) return `${formatCurrency(value / 1_000_000)} triệu`;
  return formatCurrency(value);
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(date);
}
