import { useMemo, useState } from "react";
import Alert from "@mui/material/Alert";

import { DashboardPageShell, DashboardSectionCard } from "@/components/dashboard/dashboard-page-shell";
import { SeoFollowUpWorkspace, SeoHandoverWorkspace } from "@/features/crm/seo/components/seo-crm-followup-handover";
import { SeoOverview } from "@/features/crm/seo/components/seo-crm-overview";
import { SeoSchoolPipeline } from "@/features/crm/seo/components/seo-crm-pipeline";
import { SeoPnlWorkspace } from "@/features/crm/seo/components/seo-crm-pnl-workspace";
import {
  SeoActions,
  SeoCrmLoading,
  SeoScopeSummary,
} from "@/features/crm/seo/components/seo-crm-workspace-shared";
import { useSeoCrmWorkspace } from "@/features/crm/seo/hooks/use-seo-crm-workspace";
import type { SeoLeadStatus } from "@/features/crm/seo/types/seo-crm-types";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";

type SeoCrmWorkspaceProps = {
  activeLeaf: DashboardLeaf;
  onOpenLeaf: (leafId: string) => void;
};

export function SeoCrmWorkspace({ activeLeaf, onOpenLeaf }: SeoCrmWorkspaceProps) {
  const { account, session } = useAuthSession("crm");
  const crm = useSeoCrmWorkspace({
    tenantId: session?.tenantId ?? "default",
    accountId: account?.id ?? "anonymous",
  });
  const { leads, opportunities, followUps, handovers } = crm.workspace;
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const debouncedQuery = useDebouncedValue(query);
  const selectedLead = leads.find((lead) => lead.id === selectedLeadId) ?? leads[0];
  const selectedOpportunity = opportunities.find((opportunity) => opportunity.leadId === selectedLead?.id) ?? opportunities[0];
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
    crm.updateLeadStatus({ leadId, status });
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
      {crm.isLoading ? <SeoCrmLoading /> : null}
      {crm.error ? <Alert severity="error">Không thể tải dữ liệu CRM. Vui lòng thử lại.</Alert> : null}
      {!crm.isLoading && !crm.error && leads.length === 0 ? (
        <DashboardSectionCard title="CRM chưa có dữ liệu" description="Dữ liệu lead sẽ hiển thị sau khi trường học được tạo trong CRM.">
          <div />
        </DashboardSectionCard>
      ) : null}
      {!crm.isLoading && !crm.error && leads.length > 0 ? (
        <>
          {activeLeaf.variant === "seo-overview" ? (
            <SeoOverview leads={leads} opportunities={opportunities} followUps={followUps} onOpenLeaf={onOpenLeaf} onSelectLead={setSelectedLeadId} />
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
          {(activeLeaf.variant === "seo-opportunities" || activeLeaf.variant === "seo-pnl") && selectedLead && selectedOpportunity ? (
            <SeoPnlWorkspace lead={selectedLead} opportunity={selectedOpportunity} onUpdateLeadStatus={updateLeadStatus} />
          ) : null}
          {activeLeaf.variant === "seo-followups" ? <SeoFollowUpWorkspace leads={leads} followUps={followUps} onSelectLead={setSelectedLeadId} /> : null}
          {activeLeaf.variant === "seo-handover" ? (
            <SeoHandoverWorkspace leads={leads} opportunities={opportunities} handovers={handovers} onOpenLeaf={onOpenLeaf} onUpdateLeadStatus={updateLeadStatus} />
          ) : null}
        </>
      ) : null}
    </DashboardPageShell>
  );
}
