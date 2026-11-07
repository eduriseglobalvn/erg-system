import { useLocation, useNavigate } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui";
import { inboxTabsFor } from "@/features/notifications/components/inbox-filters";
import { InboxList } from "@/features/notifications/components/inbox-list";
import { ADMIN_NOTIFICATION_PORTAL } from "@/platform/workspaces/workspace-notification-portal";
import { adminPath } from "@/platform/workspaces/workspace-paths";

import { canSendCampaigns } from "../model/can-send-campaigns";
import { notificationComposePath } from "../model/campaign-paths";
import { LatestSentCard, SentCampaignList } from "./sent-campaign-list";

/** Admin Hộp thư (N15): Nhận, plus Đã gửi / Nháp for senders; the tab lives in `?tab=` so a send lands on Đã gửi. */
export function AdminInboxScreen() {
  const navigate = useNavigate();
  const searchStr = useLocation({ select: (location) => location.searchStr });
  const canSend = canSendCampaigns(ADMIN_NOTIFICATION_PORTAL);
  const tabs = inboxTabsFor("ADMIN").filter((tab) => canSend || tab.id === "INBOX");
  const requested = new URLSearchParams(searchStr).get("tab");
  const tab = tabs.find((candidate) => candidate.id === requested)?.id ?? "INBOX";
  const compose = () => void navigate({ href: notificationComposePath("admin") });

  return (
    <Box sx={{ display: "grid", gap: 1.5, maxWidth: 860, mx: "auto", px: { xs: 2, sm: 3 }, py: 3, width: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Typography variant="h5" component="h1" sx={{ flex: 1, fontWeight: "fontWeightBold" }}>Hộp thư</Typography>
        {canSend ? <ErgButton variant="contained" onClick={compose}>Gửi thông báo</ErgButton> : null}
      </Box>
      {tabs.length > 1 ? (
        <Tabs
          aria-label="Hộp thư"
          value={tab}
          onChange={(_, value: string) => void navigate({ href: value === "INBOX" ? adminPath("/notifications") : `${adminPath("/notifications")}?tab=${value}`, replace: true })}
          sx={{ minHeight: 44, "& .MuiTab-root": { minHeight: 44 } }}
        >
          {tabs.map((item) => <Tab key={item.id} value={item.id} label={item.label} />)}
        </Tabs>
      ) : null}
      {tab === "INBOX" ? (
        <>
          <InboxList portal={ADMIN_NOTIFICATION_PORTAL} workspace="ADMIN" onOpen={(item) => void navigate({ href: `${adminPath("/notifications")}/${encodeURIComponent(item.id)}` })} />
          {canSend ? <LatestSentCard /> : null}
        </>
      ) : (
        <SentCampaignList box={tab === "DRAFT" ? "DRAFT" : "SENT"} onEdit={(id) => void navigate({ href: notificationComposePath("admin", id) })} />
      )}
    </Box>
  );
}
