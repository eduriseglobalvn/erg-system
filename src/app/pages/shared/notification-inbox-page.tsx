import { useNavigate, useParams } from "@tanstack/react-router";
import Box from "@mui/material/Box";

import { AdminInboxScreen } from "@/features/notification-campaigns/components/admin-inbox-screen";
import { CampaignDetailPage } from "@/features/notification-campaigns/components/campaign-detail-page";
import { TeacherInboxScreen } from "@/features/notification-campaigns/components/teacher-inbox-screen";
import { type ComposePortalKind, notificationComposePath, notificationsBoxPath } from "@/features/notification-campaigns/model/campaign-paths";
import { NotificationDetail } from "@/features/notifications/components/notification-detail";
import { ADMIN_NOTIFICATION_PORTAL, TEACHER_NOTIFICATION_PORTAL } from "@/platform/workspaces/workspace-notification-portal";
import { adminPath, teacherPath } from "@/platform/workspaces/workspace-paths";

const pageSx = { maxWidth: 860, mx: "auto", px: { xs: 2, sm: 3 }, py: 3, width: "100%" } as const;

/** /admin/notifications */
export function AdminNotificationsPage() {
  return <AdminInboxScreen />;
}

/** /admin/notifications/$notificationId (the admin session is the lcms one) */
export function AdminNotificationDetailPage() {
  const navigate = useNavigate();
  const { notificationId = "" } = useParams({ strict: false });
  return (
    <Box sx={pageSx}>
      <NotificationDetail portal={ADMIN_NOTIFICATION_PORTAL} notificationId={notificationId} onBack={() => void navigate({ href: adminPath("/notifications") })} />
    </Box>
  );
}

/** <workspace>/notifications/sent/$campaignId: KPIs and recipients of one campaign; back returns to its box. */
function CampaignDetailRoutePage({ kind }: { kind: ComposePortalKind }) {
  const navigate = useNavigate();
  const { campaignId = "" } = useParams({ strict: false });
  return (
    <CampaignDetailPage
      campaignId={campaignId}
      onBack={(box) => void navigate({ href: notificationsBoxPath(kind, box) })}
      onEdit={(id) => void navigate({ href: notificationComposePath(kind, id) })}
    />
  );
}

export const AdminCampaignDetailPage = () => <CampaignDetailRoutePage kind="admin" />;
export const TeacherCampaignDetailPage = () => <CampaignDetailRoutePage kind="teacher" />;

/** /teacher/notifications (N12), plus the sender's own campaigns */
export function TeacherNotificationsPage() {
  return (
    <Box sx={pageSx}>
      <TeacherInboxScreen />
    </Box>
  );
}

/** /teacher/notifications/$notificationId */
export function TeacherNotificationDetailPage() {
  const navigate = useNavigate();
  const { notificationId = "" } = useParams({ strict: false });
  return (
    <Box sx={pageSx}>
      <NotificationDetail portal={TEACHER_NOTIFICATION_PORTAL} notificationId={notificationId} onBack={() => void navigate({ href: teacherPath("/notifications") })} />
    </Box>
  );
}
