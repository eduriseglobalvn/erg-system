import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { ErgButton, ErgErrorState, ErgMetricStrip, ErgStatusChip, type ErgMetricItem } from "@/components/erg-mui";
import { formatDateTimeVi } from "@/domain/formatters/format-date";
import { ContentPendingSkeleton } from "@/routes/route-feedback";

import { useCampaign } from "../api/campaign-query";
import type { CampaignBox, CampaignResponse } from "../api/campaign-types";
import { formatCountVi } from "../model/campaign-form-schema";
import { CampaignRecipientList } from "./campaign-recipient-list";
import { CancelScheduleButton } from "./cancel-schedule-button";
import { audienceScopeLabel, CAMPAIGN_STATUS, viewedPercent } from "./sent-campaign-list";

const SENDER: Record<string, string> = { ADMIN: "Quản trị viên", TEACHER: "Giáo viên" };

const percent = (part: number | undefined, total: number | undefined) => (total ? Math.round(((part ?? 0) / total) * 100) : 0);

function timeLabel(campaign: CampaignResponse) {
  if (campaign.status === "SCHEDULED") return campaign.scheduledAt ? `Hẹn gửi ${formatDateTimeVi(campaign.scheduledAt)}` : "";
  if (campaign.sentAt) return `Gửi lúc ${formatDateTimeVi(campaign.sentAt)}`;
  return campaign.updatedAt ? `Cập nhật ${formatDateTimeVi(campaign.updatedAt)}` : "";
}

function kpis(campaign: CampaignResponse): ErgMetricItem[] {
  const total = formatCountVi(campaign.recipientCount ?? 0);
  const items: ErgMetricItem[] = [
    { label: "Đã xem", value: `${viewedPercent(campaign)}%`, hint: `${formatCountVi(campaign.viewedCount ?? 0)}/${total} người` },
  ];
  if (campaign.requireReadAck) {
    items.push({ label: "Đã xác nhận", value: `${percent(campaign.ackedCount, campaign.recipientCount)}%`, hint: `${formatCountVi(campaign.ackedCount ?? 0)}/${total} người` });
  }
  return items;
}

/** The box the campaign is listed in, and the back link that returns there. */
function boxOf(campaign: CampaignResponse | undefined): { box: CampaignBox; label: string } {
  if (campaign?.status === "SCHEDULED") return { box: "SCHEDULED", label: "Lên lịch" };
  if (campaign?.status === "DRAFT") return { box: "DRAFT", label: "Nháp" };
  return { box: "SENT", label: campaign ? "Thông báo đã gửi" : "Quay lại" };
}

type Props = { campaignId: string; onBack: (box: CampaignBox) => void; onEdit: (id: string) => void };

/** One campaign the admin sent: who it reached, who has seen / acknowledged it. Drafts and scheduled ones can be edited. */
export function CampaignDetailPage({ campaignId, onBack, onEdit }: Props) {
  const query = useCampaign(campaignId);

  const back = boxOf(query.data);
  const errorStatus = (query.error as { status?: number } | null)?.status;

  let content;
  if (query.isPending) content = <ContentPendingSkeleton />;
  else if (errorStatus === 403 || errorStatus === 404) {
    // Retrying cannot help: another sender's campaign, or it no longer exists.
    content = (
      <ErgErrorState
        title="Bạn không có quyền xem hoặc thông báo không tồn tại"
        description="Thông báo có thể đã bị xoá, hoặc chỉ người gửi xem được."
        action={<ErgButton variant="outlined" onClick={() => onBack(back.box)}>Quay lại</ErgButton>}
      />
    );
  } else if (query.isError || !query.data) {
    content = (
      <ErgErrorState
        title="Không tải được thông báo"
        description="Kiểm tra kết nối rồi thử lại."
        action={<ErgButton variant="outlined" onClick={() => void query.refetch()}>Thử lại</ErgButton>}
      />
    );
  } else {
    const campaign = query.data;
    const status = CAMPAIGN_STATUS[campaign.status ?? "DRAFT"];
    const editable = campaign.status === "DRAFT" || campaign.status === "SCHEDULED";
    // Recipient rows exist once the campaign went out (also when it failed half-way).
    const delivered = campaign.status === "SENT" || campaign.status === "SENDING" || campaign.status === "FAILED";
    const reach = delivered ? `${formatCountVi(campaign.recipientCount ?? 0)} người` : campaign.estimatedCount ? `Ước tính ${formatCountVi(campaign.estimatedCount)} người` : "";
    content = (
      <>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, flexWrap: "wrap" }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h5" component="h1" sx={{ fontWeight: "fontWeightBold", overflowWrap: "anywhere" }}>{campaign.title || "(Chưa có tiêu đề)"}</Typography>
            <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary" }}>
              {[campaign.senderRole ? `Người gửi: ${SENDER[campaign.senderRole] ?? campaign.senderRole}` : "", timeLabel(campaign)].filter(Boolean).join(" · ")}
            </Typography>
          </Box>
          <ErgStatusChip label={status.label} tone={status.tone} />
          {campaign.status === "SCHEDULED" ? <CancelScheduleButton campaignId={campaignId} /> : null}
          {editable ? <ErgButton variant="contained" onClick={() => onEdit(campaignId)}>Sửa</ErgButton> : null}
        </Box>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {["Gửi đến", [audienceScopeLabel(campaign.audience), reach].filter(Boolean).join(" · ")].join(": ")}
        </Typography>
        {campaign.body ? <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{campaign.body}</Typography> : null}
        {delivered ? (
          <>
            <ErgMetricStrip items={kpis(campaign)} />
            <CampaignRecipientList campaignId={campaignId} requireAck={Boolean(campaign.requireReadAck)} />
          </>
        ) : null}
      </>
    );
  }

  return (
    <Box component="article" sx={{ display: "grid", gap: 2, maxWidth: 960, mx: "auto", px: { xs: 2, sm: 3 }, py: 3, width: "100%" }}>
      <Box>
        <ErgButton variant="text" startIcon={<ArrowBackRoundedIcon />} onClick={() => onBack(back.box)}>{back.label}</ErgButton>
      </Box>
      {content}
    </Box>
  );
}
