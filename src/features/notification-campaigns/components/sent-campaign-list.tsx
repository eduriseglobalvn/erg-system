import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import Typography from "@mui/material/Typography";

import { ErgButton, ErgEmptyState, ErgErrorState, ErgStatusChip } from "@/components/erg-mui";
import { formatDateTimeVi, formatDateVi } from "@/domain/formatters/format-date";
import { ContentPendingSkeleton } from "@/routes/route-feedback";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

import { useCampaigns } from "../api/campaign-query";
import type { CampaignAudience, CampaignBox, CampaignResponse, CampaignStatus } from "../api/campaign-types";
import { ROLE_LABELS, type AudienceRole } from "../model/audience-draft";
import { formatCountVi } from "../model/campaign-form-schema";

export const CAMPAIGN_STATUS: Record<CampaignStatus, { label: string; tone: "success" | "info" | "warning" | "error" | "neutral" }> = {
  DRAFT: { label: "Nháp", tone: "neutral" },
  SCHEDULED: { label: "Đã hẹn giờ", tone: "info" },
  SENDING: { label: "Đang gửi", tone: "info" },
  SENT: { label: "Đã gửi", tone: "success" },
  CANCELLED: { label: "Đã huỷ", tone: "neutral" },
  FAILED: { label: "Gửi lỗi", tone: "error" },
};

const cardSx = { border: 1, borderColor: "divider", borderRadius: `${ergEnterpriseTokens.radius.card}px`, bgcolor: "background.paper", overflow: "hidden" } as const;

/** "Toàn hệ thống", or the picked scopes joined: "2 trường · Khối 7, 8 · 12 người chọn riêng". */
export function audienceScopeLabel(audience: CampaignAudience | undefined) {
  if (!audience) return "";
  if (audience.wholeTenant) return "Toàn hệ thống";
  const parts = [
    audience.schoolIds?.length ? `${audience.schoolIds.length} trường` : "",
    audience.gradeIds?.length ? `Khối ${audience.gradeIds.join(", ")}` : "",
    audience.classIds?.length ? `${audience.classIds.length} lớp` : "",
    audience.groupIds?.length ? `${audience.groupIds.length} nhóm` : "",
    (audience.roles ?? []).map((role) => ROLE_LABELS[role as AudienceRole] ?? role).join(", "),
    audience.userIds?.length ? `${audience.userIds.length} người chọn riêng` : "",
  ];
  return parts.filter(Boolean).join(" · ");
}

export const viewedPercent = (campaign: CampaignResponse) =>
  campaign.recipientCount ? Math.round(((campaign.viewedCount ?? 0) / campaign.recipientCount) * 100) : 0;

function campaignStats(campaign: CampaignResponse) {
  if (campaign.status === "DRAFT" || campaign.status === "SCHEDULED") {
    return campaign.estimatedCount ? `Ước tính ${formatCountVi(campaign.estimatedCount)} người` : "";
  }
  const stats = [`${formatCountVi(campaign.recipientCount ?? 0)} người`, `đã xem ${viewedPercent(campaign)}%`];
  if (campaign.requireReadAck) stats.push(`chưa xác nhận ${formatCountVi(Math.max(0, (campaign.recipientCount ?? 0) - (campaign.ackedCount ?? 0)))}`);
  return stats.join(" · ");
}

function campaignTime(campaign: CampaignResponse) {
  if (campaign.status === "SCHEDULED") return campaign.scheduledAt && formatDateTimeVi(campaign.scheduledAt) ? `Hẹn ${formatDateTimeVi(campaign.scheduledAt)}` : "";
  return formatDateTimeVi(campaign.sentAt ?? campaign.updatedAt ?? campaign.createdAt);
}

const BOX_COPY: Record<CampaignBox, { label: string; empty: string }> = {
  SENT: { label: "Thông báo đã gửi", empty: "Chưa gửi thông báo nào." },
  SCHEDULED: { label: "Thông báo đã hẹn giờ", empty: "Chưa hẹn giờ thông báo nào." },
  DRAFT: { label: "Bản nháp", empty: "Chưa có bản nháp." },
};

type RowActions = { onEdit: (id: string) => void; onOpen: (id: string) => void };

function CampaignRow({ campaign, onEdit, onOpen }: RowActions & { campaign: CampaignResponse }) {
  const status = CAMPAIGN_STATUS[campaign.status ?? "DRAFT"];
  const editable = campaign.status === "DRAFT" || campaign.status === "SCHEDULED";
  const content = (
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0, fontWeight: "fontWeightBold" }}>{campaign.title || "(Chưa có tiêu đề)"}</Typography>
        <ErgStatusChip label={status.label} tone={status.tone} />
      </Box>
      <Typography variant="caption" component="p" sx={{ mt: 0.25, color: "text.secondary" }}>{audienceScopeLabel(campaign.audience)}</Typography>
      <Typography variant="caption" component="p" sx={{ color: "text.secondary" }}>
        {[campaignStats(campaign), campaignTime(campaign)].filter(Boolean).join(" · ")}
      </Typography>
    </Box>
  );
  return (
    <ListItem disablePadding divider>
      {campaign.id ? (
        <ListItemButton onClick={() => (editable ? onEdit : onOpen)(campaign.id as string)} sx={{ gap: 1, px: 2, py: 1.5, minHeight: 64 }}>
          {content}
          <ChevronRightRoundedIcon aria-hidden sx={{ color: "text.secondary" }} />
        </ListItemButton>
      ) : (
        <Box sx={{ display: "flex", width: "100%", px: 2, py: 1.5 }}>{content}</Box>
      )}
    </ListItem>
  );
}

/** Own campaigns of one box; drafts and scheduled ones open the compose page, the others their detail. */
export function SentCampaignList({ box, onEdit, onOpen }: RowActions & { box: CampaignBox }) {
  const query = useCampaigns(box, true);
  const campaigns = query.data?.items ?? [];

  if (query.isPending) return <ContentPendingSkeleton />;
  if (query.isError) {
    return (
      <ErgErrorState
        title="Không tải được danh sách"
        description="Kiểm tra kết nối rồi thử lại."
        action={<ErgButton variant="outlined" onClick={() => void query.refetch()}>Thử lại</ErgButton>}
      />
    );
  }
  if (!campaigns.length) return <ErgEmptyState title={BOX_COPY[box].empty} />;
  return (
    <List aria-label={BOX_COPY[box].label} disablePadding sx={cardSx}>
      {campaigns.map((campaign) => <CampaignRow key={campaign.id} campaign={campaign} onEdit={onEdit} onOpen={onOpen} />)}
    </List>
  );
}

/** N15 "Gửi gần nhất": the newest of the sender's sent campaigns (same cache as the Đã gửi box). */
export function LatestSentCard() {
  const latest = useCampaigns("SENT", true).data?.items?.[0];
  if (!latest) return null;
  return (
    <Box component="section" aria-label="Gửi gần nhất" sx={{ ...cardSx, display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.5 }}>
      <Box aria-hidden sx={{ display: "grid", placeItems: "center", width: 36, height: 36, flexShrink: 0, borderRadius: "50%", bgcolor: "success.main", color: "common.white" }}>
        <CampaignRoundedIcon fontSize="small" />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" component="p" sx={{ color: "text.secondary" }}>{["Gửi gần nhất", formatDateVi(latest.sentAt)].filter(Boolean).join(" · ")}</Typography>
        <Typography variant="body2" noWrap sx={{ fontWeight: "fontWeightBold" }}>{latest.title}</Typography>
        <Typography variant="caption" component="p" sx={{ color: "text.secondary" }}>
          {[audienceScopeLabel(latest.audience), `${formatCountVi(latest.recipientCount ?? 0)} người`, `đã xem ${viewedPercent(latest)}%`].filter(Boolean).join(" · ")}
        </Typography>
      </Box>
    </Box>
  );
}
