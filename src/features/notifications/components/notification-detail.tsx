import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { ErgButton, ErgErrorState, ErgStatusChip } from "@/components/erg-mui";
import { formatDateTimeVi, formatDateVi, formatTimeVi } from "@/domain/formatters/format-date";
import { useAckNotification } from "@/features/notification-campaigns/api/campaign-query";
import { QUERY_POLICIES } from "@/lib/query-policy";
import { ContentPendingSkeleton } from "@/routes/route-feedback";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

import { fetchNotificationDetail, markNotificationRead, notificationQueryKeys, resolveNotificationQueryScope } from "../api/notification-api";
import type { NotificationPortal } from "../api/notification-types";
import { inboxSourceLabel, needsAck, priorityLabel } from "./inbox-filters";

type NotificationDetailProps = { portal: NotificationPortal; notificationId: string; onBack: () => void };

/** One inbox message; opening it marks it read, and a campaign that asks for it gets the "Đã nắm thông tin" ack. */
export function NotificationDetail({ portal, notificationId, onBack }: NotificationDetailProps) {
  const queryClient = useQueryClient();
  const scope = resolveNotificationQueryScope(portal);
  const query = useQuery({
    queryKey: notificationQueryKeys.detail(portal, notificationId, scope),
    queryFn: ({ signal }) => fetchNotificationDetail(notificationId, portal, signal),
    enabled: Boolean(notificationId),
    staleTime: QUERY_POLICIES.realtime.staleTime,
    gcTime: QUERY_POLICIES.realtime.gcTime,
  });
  const { mutate: markRead } = useMutation({
    mutationFn: (id: string) => markNotificationRead(id, portal),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.root(portal, scope) }),
    meta: { silent: true },
  });
  const ack = useAckNotification(portal);
  const [ackedNow, setAckedNow] = useState<string | null>(null);
  const markedRef = useRef<string | null>(null);
  const item = query.data;

  useEffect(() => {
    if (!item?.unread || markedRef.current === item.id) return;
    markedRef.current = item.id;
    markRead(item.id);
  }, [item?.id, item?.unread, markRead]);

  const back = (
    <ErgButton variant="text" startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ justifySelf: "start", minHeight: 44 }}>
      Quay lại
    </ErgButton>
  );

  if (query.isPending && query.fetchStatus !== "idle") return <ContentPendingSkeleton />;
  if (!item) {
    return (
      <Box sx={{ display: "grid", gap: 1.5 }}>
        {back}
        <ErgErrorState title="Không tìm thấy thông báo" description="Thông báo này có thể đã bị xóa hoặc đường dẫn không còn hợp lệ." />
      </Box>
    );
  }

  const priority = priorityLabel(item);
  const ackedAt = item.ackedAt ?? ackedNow;

  return (
    <Box sx={{ display: "grid", gap: 1.5, maxWidth: 760 }}>
      {back}
      <Box component="article" sx={{ border: 1, borderColor: "divider", borderRadius: `${ergEnterpriseTokens.radius.card}px`, bgcolor: "background.paper", p: { xs: 2, md: 3 } }}>
        {priority ? <ErgStatusChip label={priority} tone={priority === "Khẩn" ? "error" : "warning"} sx={{ mb: 1 }} /> : null}
        <Typography variant="h5" component="h1" sx={{ fontWeight: "fontWeightBold" }}>{item.title}</Typography>
        <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary" }}>
          {inboxSourceLabel(item)} · {formatDateTimeVi(item.createdAt)}
        </Typography>
        <Typography variant="body1" sx={{ mt: 2, whiteSpace: "pre-line", overflowWrap: "anywhere" }}>{item.body || item.description}</Typography>
        {needsAck(item) && !ackedNow ? (
          <ErgButton
            variant="contained"
            loading={ack.isPending}
            onClick={() => ack.mutate(item.id, { onSuccess: () => setAckedNow(new Date().toISOString()) })}
            sx={{ mt: 3, minHeight: 44, width: { xs: "100%", sm: "auto" } }}
          >
            Đã nắm thông tin
          </ErgButton>
        ) : null}
        {ackedAt ? (
          <Typography role="status" variant="body2" sx={{ mt: 3, display: "flex", alignItems: "center", gap: 1, color: "success.main", fontWeight: "fontWeightMedium" }}>
            <CheckCircleRoundedIcon fontSize="small" aria-hidden />
            {`Đã xác nhận lúc ${formatTimeVi(ackedAt)} ${formatDateVi(ackedAt)}`}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}
