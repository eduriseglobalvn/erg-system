import { useState } from "react";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import { useLocation, useNavigate } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import TablePagination from "@mui/material/TablePagination";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { Theme } from "@mui/material/styles";

import { ErgButton, ErgEmptyState, ErgErrorState, ErgTableToolbar, ergSegmentedTabsSx } from "@/components/erg-mui";
import { ergMobileDockClearance } from "@/components/portal/erg-mobile-dock";
import { inboxTabsFor } from "@/features/notifications/components/inbox-filters";
import { InboxList } from "@/features/notifications/components/inbox-list";
import { MarkAllReadButton } from "@/features/notifications/components/mark-all-read-button";
import { ADMIN_NOTIFICATION_PORTAL } from "@/platform/workspaces/workspace-notification-portal";
import { adminPath } from "@/platform/workspaces/workspace-paths";
import { ContentPendingSkeleton } from "@/routes/route-feedback";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

import { useCampaigns, useCampaignSummary } from "../api/campaign-query";
import type { CampaignBox } from "../api/campaign-types";
import { canSendCampaigns } from "../model/can-send-campaigns";
import { campaignDetailPath, notificationComposePath } from "../model/campaign-paths";
import { CampaignKpiRow } from "./campaign-kpi-row";
import { SentCampaignTable } from "./sent-campaign-table";
import { LatestSentCard, SentCampaignList } from "./sent-campaign-list";

const PAGE_SIZE = 20; // the server's default page size for campaign lists
const SCOPES = [
  { mine: false, label: "Tất cả phạm vi" },
  { mine: true, label: "Chỉ của tôi" },
];

/** W1 (md and up): KPIs and the Đã gửi table with a scope filter and server pages. */
function SentCampaignsDesktop({ onOpen }: { onOpen: (id: string) => void }) {
  const [mine, setMine] = useState(false);
  const [page, setPage] = useState(0);
  const summary = useCampaignSummary();
  const query = useCampaigns("SENT", mine, page);
  const campaigns = query.data?.items ?? [];

  const scopeFilter = (
    <Stack aria-label="Phạm vi" direction="row" role="group" sx={{ gap: 1 }}>
      {SCOPES.map((scope) => (
        <Chip
          key={scope.label}
          aria-pressed={mine === scope.mine}
          clickable
          color={mine === scope.mine ? "primary" : "default"}
          label={scope.label}
          onClick={() => {
            setMine(scope.mine);
            setPage(0);
          }}
          variant={mine === scope.mine ? "filled" : "outlined"}
        />
      ))}
    </Stack>
  );

  let body;
  if (query.isPending) body = <ContentPendingSkeleton />;
  else if (query.isError) {
    body = (
      <ErgErrorState
        title="Không tải được danh sách"
        description="Kiểm tra kết nối rồi thử lại."
        action={<ErgButton variant="outlined" onClick={() => void query.refetch()}>Thử lại</ErgButton>}
      />
    );
  } else if (!campaigns.length) body = <ErgEmptyState title="Chưa gửi thông báo nào." />;
  else {
    body = (
      <SentCampaignTable
        campaigns={campaigns}
        onOpen={onOpen}
        toolbar={<ErgTableToolbar title="Thông báo đã gửi" actions={scopeFilter} />}
        footer={(query.data?.totalItems ?? 0) > PAGE_SIZE ? (
          <TablePagination
            component="div"
            count={query.data?.totalItems ?? 0}
            page={page}
            rowsPerPage={PAGE_SIZE}
            rowsPerPageOptions={[]}
            onPageChange={(_, next: number) => setPage(next)}
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`}
          />
        ) : undefined}
      />
    );
  }

  return (
    <>
      <CampaignKpiRow summary={summary.data} />
      {campaigns.length || query.isPending ? null : scopeFilter}
      {body}
    </>
  );
}

/** Admin Hộp thư (N15 / W1): Nhận, plus Đã gửi / Lên lịch / Nháp for senders; the tab lives in `?tab=` so a send lands on Đã gửi. */
export function AdminInboxScreen() {
  const navigate = useNavigate();
  const searchStr = useLocation({ select: (location) => location.searchStr });
  const desktop = useMediaQuery((theme: Theme) => theme.breakpoints.up("md"), { noSsr: true });
  const canSend = canSendCampaigns(ADMIN_NOTIFICATION_PORTAL);
  const tabs = inboxTabsFor("ADMIN").filter((tab) => canSend || tab.id === "INBOX");
  const requested = new URLSearchParams(searchStr).get("tab");
  const tab = tabs.find((candidate) => candidate.id === requested)?.id ?? "INBOX";
  const compose = () => void navigate({ href: notificationComposePath("admin") });
  const edit = (id: string) => void navigate({ href: notificationComposePath("admin", id) });
  const open = (id: string) => void navigate({ href: campaignDetailPath("admin", id) });
  const table = tab === "SENT" && desktop;

  return (
    // Phones: room under the last row for the floating "Gửi thông báo" button.
    <Box sx={{ display: "grid", gap: 1.5, maxWidth: table ? 1120 : 860, mx: "auto", px: { xs: 2, sm: 3 }, pt: 3, pb: canSend && !desktop ? 10 : 3, width: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Typography variant="h1" sx={{ flex: 1 }}>Hộp thư</Typography>
        <MarkAllReadButton portal={ADMIN_NOTIFICATION_PORTAL} />
        {canSend && desktop ? <ErgButton variant="contained" startIcon={<CampaignRoundedIcon />} onClick={compose}>Gửi thông báo</ErgButton> : null}
      </Box>
      {tabs.length > 1 ? (
        <Tabs
          aria-label="Hộp thư"
          value={tab}
          variant="fullWidth"
          onChange={(_, value: string) => void navigate({ href: value === "INBOX" ? adminPath("/notifications") : `${adminPath("/notifications")}?tab=${value}`, replace: true })}
          sx={ergSegmentedTabsSx}
        >
          {tabs.map((item) => <Tab key={item.id} value={item.id} label={item.label} />)}
        </Tabs>
      ) : null}
      {tab === "INBOX" ? (
        <>
          <InboxList portal={ADMIN_NOTIFICATION_PORTAL} workspace="ADMIN" onOpen={(item) => void navigate({ href: `${adminPath("/notifications")}/${encodeURIComponent(item.id)}` })} />
          {canSend ? <LatestSentCard /> : null}
        </>
      ) : table ? (
        <SentCampaignsDesktop onOpen={open} />
      ) : (
        <SentCampaignList box={tab as CampaignBox} onEdit={edit} onOpen={open} />
      )}
      {canSend && !desktop ? (
        // Canvas N15: the send action floats as a pill above the dock instead of crowding the header.
        <ErgButton
          variant="contained"
          startIcon={<CampaignRoundedIcon />}
          onClick={compose}
          sx={{ position: "fixed", right: 16, bottom: ergMobileDockClearance(12), zIndex: "speedDial", height: 52, px: 2.5, borderRadius: `${t.radius.chip}px`, boxShadow: t.shadow.float }}
        >
          Gửi thông báo
        </ErgButton>
      ) : null}
    </Box>
  );
}
