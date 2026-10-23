import { useState } from "react";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import { CalendarClock, CheckCircle2, PhoneCall } from "lucide-react";

import { DashboardSectionCard, DashboardSegmentedControl } from "@/components/dashboard/dashboard-page-shell";
import { calculateSeoPnlSummary } from "@/features/crm/seo/api/seo-crm-pnl";
import type { SeoFollowUp, SeoHandoverRequest, SeoLeadStatus, SeoOpportunity, SeoSchoolLead } from "@/features/crm/seo/types/seo-crm-types";
import { formatDate, HandoverPermission, toChipProps } from "@/features/crm/seo/components/seo-crm-workspace-shared";
import { cn } from "@/lib/utils";

export function SeoFollowUpWorkspace({ leads, followUps, onSelectLead }: { leads: SeoSchoolLead[]; followUps: SeoFollowUp[]; onSelectLead: (leadId: string) => void }) {
  const [mode, setMode] = useState("open");
  const visibleFollowUps = followUps.filter((item) => (mode === "open" ? !item.done : true));
  return (
    <DashboardSectionCard title="Lịch follow-up SEO" description="Một nơi để đội SEO biết hôm nay cần gọi, gặp, gửi proposal hoặc đẩy hợp đồng nào." action={<DashboardSegmentedControl value={mode} onChange={setMode} options={[{ value: "open", label: "Cần làm" }, { value: "all", label: "Tất cả" }]} />}>
      <div className="grid gap-3 lg:grid-cols-2">
        {visibleFollowUps.map((followUp) => {
          const lead = leads.find((item) => item.id === followUp.leadId);
          return (
            <article key={followUp.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-[var(--erg-blue-light)] text-[var(--erg-blue)]">{followUp.type === "call" ? <PhoneCall className="size-5" /> : <CalendarClock className="size-5" />}</span>
                  <div className="min-w-0"><h3 className="font-semibold text-slate-950">{followUp.title}</h3><p className="mt-1 text-sm text-slate-500">{lead?.schoolName ?? "Không rõ trường"} · {followUp.ownerName}</p></div>
                </div>
                <Chip label={formatDate(followUp.dueAt)} size="small" {...toChipProps("warning")} />
              </div>
              <div className="mt-4 flex justify-end"><Button variant="outlined" size="small" onClick={() => lead ? onSelectLead(lead.id) : undefined}>Mở hồ sơ</Button></div>
            </article>
          );
        })}
      </div>
    </DashboardSectionCard>
  );
}

export function SeoHandoverWorkspace({ leads, opportunities, handovers, onOpenLeaf, onUpdateLeadStatus }: {
  leads: SeoSchoolLead[];
  opportunities: SeoOpportunity[];
  handovers: SeoHandoverRequest[];
  onOpenLeaf: (leafId: string) => void;
  onUpdateLeadStatus: (leadId: string, status: SeoLeadStatus) => void;
}) {
  const handoverLeads = leads.filter((lead) => lead.status === "won_pending_setup" || lead.status === "active");
  const requests = handoverLeads.map((lead) => ({
    lead,
    request: handovers.find((item) => item.leadId === lead.id),
    opportunity: opportunities.find((item) => item.leadId === lead.id),
  }));
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
                  <div><h3 className="font-semibold text-slate-950">{lead.schoolName}</h3><p className="mt-1 text-sm text-slate-500">{opportunity?.code ?? "Chưa có P&L"} · {lead.expectedClasses} lớp dự kiến</p></div>
                  <Chip size="small" label={lead.status === "active" ? "Active" : ready ? "Sẵn sàng" : "Thiếu dữ liệu"} {...toChipProps(lead.status === "active" ? "success" : ready ? "warning" : "outline")} />
                </div>
                <div className="mt-4 grid gap-2">{checklist.map((item) => <div key={item.id} className="flex items-center gap-2 text-sm"><CheckCircle2 className={cn("size-4", item.done ? "text-emerald-600" : "text-slate-300")} /><span className={item.done ? "text-slate-700" : "text-slate-500"}>{item.label}</span></div>)}</div>
                <div className="mt-4 flex flex-wrap justify-end gap-2"><Button variant="outlined" size="small" onClick={() => onOpenLeaf("seo-pnl")}>Xem P&amp;L</Button><Button variant="contained" size="small" disabled={!ready || lead.status === "active"} onClick={() => onUpdateLeadStatus(lead.id, "active")}>Duyệt active</Button></div>
              </article>
            );
          })}
          {!requests.length ? <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">Chưa có trường nào ở trạng thái chờ triển khai.</div> : null}
        </div>
      </DashboardSectionCard>
      <DashboardSectionCard title="Sau khi Active" description="Các thao tác vận hành được mở ở module quản lý trung tâm, không nằm trong quyền SEO.">
        <div className="space-y-3"><HandoverPermission label="Cấp quyền giáo viên" /><HandoverPermission label="Tạo lớp theo năm học" /><HandoverPermission label="Import học sinh" /><HandoverPermission label="Gán học liệu và quiz" /></div>
        <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={() => onOpenLeaf("admin-centers")}>Mở quản lý cơ sở</Button>
      </DashboardSectionCard>
    </div>
  );
}
