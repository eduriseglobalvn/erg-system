import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { useCreateCampaign } from "@/features/notification-campaigns/api/campaign-query";
import { canSendCampaigns } from "@/features/notification-campaigns/model/can-send-campaigns";
import { notificationComposePath } from "@/features/notification-campaigns/model/campaign-paths";

/**
 * "Nhắc": saves a campaign DRAFT addressed to the students who have not submitted, then opens it in the
 * compose screen so the teacher reviews and sends it there (nothing is sent from this page).
 */
export function useRemindPending(pending: ReadonlyArray<{ userId?: string }>, assignmentTitle: string) {
  const navigate = useNavigate();
  const create = useCreateCampaign();
  const userIds = pending.flatMap((row) => (row.userId ? [row.userId] : []));

  const disabledReason = !canSendCampaigns("lms")
    ? "Tài khoản chưa có quyền gửi thông báo."
    : userIds.length < pending.length
      ? "Chưa có tài khoản của một số học sinh nên chưa nhắc được."
      : "";

  const remind = () =>
    create.mutate(
      {
        audience: { userIds },
        title: `Nhắc nộp bài: ${assignmentTitle}`,
        body: `Em chưa nộp bài "${assignmentTitle}". Em vào mục Học tập để hoàn thành trước hạn nhé.`,
      },
      {
        onError: () => toast.error("Không tạo được thông báo nhắc. Thử lại sau."),
        onSuccess: (campaign) => {
          if (campaign.id) void navigate({ href: notificationComposePath("teacher", campaign.id) });
        },
      },
    );

  return { disabledReason, isPending: create.isPending, remind };
}
