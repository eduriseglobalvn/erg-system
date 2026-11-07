import { useParams } from "@tanstack/react-router";

import { CampaignComposeScreen } from "@/features/notification-campaigns/components/campaign-compose-screen";

/** /admin/notifications/compose[/$campaignId] */
export function AdminNotificationComposePage() {
  const { campaignId } = useParams({ strict: false });
  return <CampaignComposeScreen campaignId={campaignId} portalKind="admin" />;
}

/** /teacher/notifications/compose[/$campaignId] */
export function TeacherNotificationComposePage() {
  const { campaignId } = useParams({ strict: false });
  return <CampaignComposeScreen campaignId={campaignId} portalKind="teacher" />;
}
