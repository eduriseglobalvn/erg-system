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

const STATUS: Record<CampaignStatus, { label: string; tone: "success" | "info" | "warning" | "error" | "neutral" }> = {
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
  if (campaign.status === "SCHEDULED") return `Hẹn ${formatDateTimeVi(campaign.scheduledAt)}`;
  return formatDateTimeVi(campaign.sentAt ?? campaign.updatedAt ?? campaign.createdAt);
}

function CampaignRow({ campaign, onEdit }: { campaign: CampaignResponse; onEdit: (id: string) => void }) {
  const status = STATUS[campaign.status ?? "DRAFT"];
  const editable = (campaign.status === "DRAFT" || campaign.status === "SCHEDULED") && campaign.id;
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
      {editable ? (
        <ListItemButton onClick={() => onEdit(campaign.id as string)} sx={{ gap: 1, px: 2, py: 1.5, minHeight: 64 }}>
          {content}
          <ChevronRightRoundedIcon aria-hidden sx={{ color: "text.secondary" }} />
        </ListItemButton>
      ) : (
        <Box sx={{ display: "flex", width: "100%", px: 2, py: 1.5 }}>{content}</Box>
      )}
    </ListItem>
  );
}

/** Own campaigns of one box; drafts and scheduled ones open the compose page. */
export function SentCampaignList({ box, onEdit }: { box: CampaignBox; onEdit: (id: string) => void }) {
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
  if (!campaigns.length) return <ErgEmptyState title={box === "DRAFT" ? "Chưa có bản nháp." : "Chưa gửi thông báo nào."} />;
  return (
    <List aria-label={box === "DRAFT" ? "Bản nháp" : "Thông báo đã gửi"} disablePadding sx={cardSx}>
      {campaigns.map((campaign) => <CampaignRow key={campaign.id} campaign={campaign} onEdit={onEdit} />)}
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
        <Typography variant="caption" component="p" sx={{ color: "text.secondary" }}>Gửi gần nhất · {formatDateVi(latest.sentAt)}</Typography>
        <Typography variant="body2" noWrap sx={{ fontWeight: "fontWeightBold" }}>{latest.title}</Typography>
        <Typography variant="caption" component="p" sx={{ color: "text.secondary" }}>
          {[audienceScopeLabel(latest.audience), `${formatCountVi(latest.recipientCount ?? 0)} người`, `đã xem ${viewedPercent(latest)}%`].filter(Boolean).join(" · ")}
        </Typography>
      </Box>
    </Box>
  );
}
