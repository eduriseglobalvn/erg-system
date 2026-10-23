import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import TextField from "@mui/material/TextField";
import { Search } from "lucide-react";

import { DashboardSectionCard } from "@/components/dashboard/dashboard-page-shell";
import { AppSelect } from "@/components/ui/app-select";
import type { SeoLeadStatus, SeoSchoolLead } from "@/features/crm/seo/types/seo-crm-types";
import {
  formatDate, InfoLine, MiniValue, pipelineStatuses, statusLabelMap, statusToneMap, toChipProps,
} from "@/features/crm/seo/components/seo-crm-workspace-shared";
import { cn } from "@/lib/utils";

export function SeoSchoolPipeline({ filteredLeads, query, selectedLead, statusFilter, onQueryChange, onSelectLead, onStatusFilterChange, onUpdateLeadStatus }: {
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
            <TextField size="small" fullWidth value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Tìm trường, quận, người liên hệ..." sx={{ "& .MuiInputBase-input": { pl: "1.5rem" } }} />
          </label>
          <AppSelect value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value)} className="h-11 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:border-[#b8d6fa] focus:ring-4 focus:ring-[var(--erg-blue-ring)]">
            <option value="all">Tất cả tình trạng</option>
            {([...pipelineStatuses, "paused", "lost"] as SeoLeadStatus[]).map((status) => <option key={status} value={status}>{statusLabelMap[status]}</option>)}
          </AppSelect>
        </div>
        <div className="mt-4 max-h-[650px] space-y-3 overflow-y-auto pr-1">
          {filteredLeads.map((lead) => (
            <button key={lead.id} type="button" onClick={() => onSelectLead(lead.id)} className={cn("w-full rounded-lg border bg-white p-4 text-left transition hover:border-[#b8d6fa] hover:bg-[var(--erg-blue-light)]", selectedLead?.id === lead.id ? "border-[#b8d6fa] ring-4 ring-[var(--erg-blue-ring)]" : "border-slate-200")}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0"><h3 className="font-semibold text-slate-950">{lead.schoolName}</h3><p className="mt-1 text-sm text-slate-500">{lead.district}, {lead.province} · {lead.segment}</p></div>
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
      {selectedLead ? <SchoolLeadDetail lead={selectedLead} onUpdateLeadStatus={onUpdateLeadStatus} /> : null}
    </div>
  );
}

function SchoolLeadDetail({ lead, onUpdateLeadStatus }: { lead: SeoSchoolLead; onUpdateLeadStatus: (leadId: string, status: SeoLeadStatus) => void }) {
  return (
    <DashboardSectionCard title={lead.schoolName} description="Hồ sơ SEO của trường trước khi chuyển sang vận hành LMS." action={<Chip label={statusLabelMap[lead.status]} size="small" {...toChipProps(statusToneMap[lead.status])} />}>
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
          <div className="flex items-center justify-between gap-4"><span className="text-sm font-semibold text-slate-950">Xác suất chốt</span><span className="text-sm font-semibold text-slate-950">{lead.probability}%</span></div>
          <LinearProgress variant="determinate" value={Math.max(0, Math.min(100, lead.probability))} className="mt-3" sx={{ height: 8, borderRadius: 9999, "& .MuiLinearProgress-bar": { bgcolor: "var(--erg-blue)" } }} />
        </div>
        <div><h3 className="text-sm font-semibold text-slate-950">Ghi chú tư vấn</h3><p className="mt-2 rounded-lg border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">{lead.notes}</p></div>
        <div><h3 className="text-sm font-semibold text-slate-950">Rủi ro cần xử lý</h3><div className="mt-2 flex flex-wrap gap-2">{lead.risks.map((risk) => <Chip key={risk} label={risk} size="small" {...toChipProps("warning")} />)}</div></div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <label className="grid gap-1.5"><span className="text-xs font-semibold text-slate-400">Cập nhật tình trạng</span>
            <AppSelect value={lead.status} onChange={(event) => onUpdateLeadStatus(lead.id, event.target.value as SeoLeadStatus)} className="h-11 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:border-[#b8d6fa] focus:ring-4 focus:ring-[var(--erg-blue-ring)]">
              {([...pipelineStatuses, "paused", "lost"] as SeoLeadStatus[]).map((status) => <option key={status} value={status}>{statusLabelMap[status]}</option>)}
            </AppSelect>
          </label>
        </div>
      </div>
    </DashboardSectionCard>
  );
}
