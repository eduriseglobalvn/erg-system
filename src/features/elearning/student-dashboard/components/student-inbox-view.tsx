import { useState } from "react";

import { InboxList } from "@/features/notifications/components/inbox-list";
import { NotificationDetail } from "@/features/notifications/components/notification-detail";

/** Hộp thư tab (N14): the student's notification inbox, a message opens in place (the student page has no detail route). */
export function StudentInboxView({ portal }: { portal: "elearning" | "lms" }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return openId ? (
    <NotificationDetail portal={portal} notificationId={openId} onBack={() => setOpenId(null)} />
  ) : (
    <InboxList portal={portal} workspace="STUDENT" title="Hộp thư" onOpen={(item) => setOpenId(item.id)} />
  );
}
