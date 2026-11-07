import { useNavigate, useParams } from "@tanstack/react-router";
import Box from "@mui/material/Box";

import { AdminInboxScreen } from "@/features/notification-campaigns/components/admin-inbox-screen";
import { canSendCampaigns } from "@/features/notification-campaigns/model/can-send-campaigns";
import { notificationComposePath } from "@/features/notification-campaigns/model/campaign-paths";
import { InboxList } from "@/features/notifications/components/inbox-list";
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

/** /teacher/notifications (N12) */
export function TeacherNotificationsPage() {
  const navigate = useNavigate();
  return (
    <Box sx={pageSx}>
      <InboxList
        portal={TEACHER_NOTIFICATION_PORTAL}
        workspace="TEACHER"
        title="Hộp thư"
        onOpen={(item) => void navigate({ href: `${teacherPath("/notifications")}/${encodeURIComponent(item.id)}` })}
        onCompose={canSendCampaigns(TEACHER_NOTIFICATION_PORTAL) ? () => void navigate({ href: notificationComposePath("teacher") }) : undefined}
      />
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
