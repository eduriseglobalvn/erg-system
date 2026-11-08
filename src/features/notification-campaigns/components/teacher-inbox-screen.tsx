import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import { useLocation, useNavigate } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";

import { ErgButton, ergSegmentedTabsSx } from "@/components/erg-mui";
import { InboxList } from "@/features/notifications/components/inbox-list";
import { MarkAllReadButton } from "@/features/notifications/components/mark-all-read-button";
import { TEACHER_NOTIFICATION_PORTAL } from "@/platform/workspaces/workspace-notification-portal";
import { teacherPath } from "@/platform/workspaces/workspace-paths";

import type { CampaignBox } from "../api/campaign-types";
import { canSendCampaigns } from "../model/can-send-campaigns";
import { campaignDetailPath, notificationComposePath } from "../model/campaign-paths";
import { SentCampaignList } from "./sent-campaign-list";

const VIEWS = [
  { id: "INBOX", label: "Nhận" },
  { id: "SENT", label: "Đã gửi" },
  { id: "SCHEDULED", label: "Lên lịch" },
  { id: "DRAFT", label: "Nháp" },
] as const;

/** Teacher Hộp thư (N12) plus, for senders only, their own campaigns: Đã gửi / Lên lịch / Nháp (`?tab=`). */
export function TeacherInboxScreen() {
  const navigate = useNavigate();
  const searchStr = useLocation({ select: (location) => location.searchStr });
  const inboxHref = teacherPath("/notifications");
  const openMessage = (item: { id: string }) => void navigate({ href: `${inboxHref}/${encodeURIComponent(item.id)}` });

  // Fail closed: without the send permission the page is the plain inbox, as before.
  if (!canSendCampaigns(TEACHER_NOTIFICATION_PORTAL)) {
    return <InboxList portal={TEACHER_NOTIFICATION_PORTAL} workspace="TEACHER" title="Hộp thư" onOpen={openMessage} />;
  }

  const requested = new URLSearchParams(searchStr).get("tab");
  const view = VIEWS.find((candidate) => candidate.id === requested)?.id ?? "INBOX";

  return (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Typography variant="h1" sx={{ flex: 1 }}>Hộp thư</Typography>
        <MarkAllReadButton portal={TEACHER_NOTIFICATION_PORTAL} />
        <ErgButton variant="contained" size="small" startIcon={<CampaignRoundedIcon />} onClick={() => void navigate({ href: notificationComposePath("teacher") })}>Gửi lớp</ErgButton>
      </Box>
      <Tabs
        aria-label="Hộp thư và thông báo của tôi"
        value={view}
        variant="fullWidth"
        onChange={(_, value: string) => void navigate({ href: value === "INBOX" ? inboxHref : `${inboxHref}?tab=${value}`, replace: true })}
        sx={ergSegmentedTabsSx}
      >
        {VIEWS.map((item) => <Tab key={item.id} value={item.id} label={item.label} />)}
      </Tabs>
      {view === "INBOX" ? (
        <InboxList portal={TEACHER_NOTIFICATION_PORTAL} workspace="TEACHER" onOpen={openMessage} />
      ) : (
        <SentCampaignList
          box={view as CampaignBox}
          onEdit={(id) => void navigate({ href: notificationComposePath("teacher", id) })}
          onOpen={(id) => void navigate({ href: campaignDetailPath("teacher", id) })}
        />
      )}
    </Box>
  );
}
