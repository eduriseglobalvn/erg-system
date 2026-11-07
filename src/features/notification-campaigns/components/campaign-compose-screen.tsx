import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import { useNavigate } from "@tanstack/react-router";

import { ErgButton, ErgErrorState, ErgPageHeader } from "@/components/erg-mui";
import { ContentPendingSkeleton } from "@/routes/route-feedback";

import { useCampaign } from "../api/campaign-query";
import { fromCampaign } from "../model/campaign-form-schema";
import { type ComposePortalKind, notificationsHomePath } from "../model/campaign-paths";
import { CampaignComposeForm } from "./campaign-compose-form";

type Props = { campaignId?: string; portalKind: ComposePortalKind };

const EDITABLE = new Set(["DRAFT", "SCHEDULED"]);

/** Page body for .../notifications/compose[/$campaignId]: new message, or a saved draft / scheduled one. */
export function CampaignComposeScreen({ campaignId, portalKind }: Props) {
  const navigate = useNavigate();
  const campaign = useCampaign(campaignId);
  const back = (
    <ErgButton onClick={() => void navigate({ href: notificationsHomePath(portalKind) })} variant="text">Về trang Thông báo</ErgButton>
  );

  let body;
  if (!campaignId) body = <CampaignComposeForm portalKind={portalKind} />;
  else if (campaign.error) body = <ErgErrorState action={back} description={campaign.error instanceof Error ? campaign.error.message : ""} title="Không tải được thông báo" />;
  else if (!campaign.data) body = <ContentPendingSkeleton />;
  else if (!EDITABLE.has(campaign.data.status ?? "")) {
    body = (
      <Alert action={back} role="status" severity="info">
        Thông báo này đã gửi hoặc đã huỷ nên không sửa được.
      </Alert>
    );
  } else body = <CampaignComposeForm campaignId={campaignId} initial={fromCampaign(campaign.data)} key={campaignId} portalKind={portalKind} />;

  return (
    <Box sx={{ maxWidth: 760, mx: "auto", px: { xs: 2, sm: 3 }, py: 3, width: "100%" }}>
      <ErgPageHeader title={campaignId ? "Sửa thông báo" : "Soạn thông báo"} />
      {body}
    </Box>
  );
}
