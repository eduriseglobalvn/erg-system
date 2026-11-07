import { useState } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ErgButton, ErgErrorState } from "@/components/erg-mui";
import { formatDateTimeVi } from "@/domain/formatters/format-date";
import { ContentPendingSkeleton } from "@/routes/route-feedback";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

import { useCampaignRecipients } from "../api/campaign-query";
import type { CampaignRecipient, CampaignRecipientFilter } from "../api/campaign-types";

const FILTERS: Array<{ id: CampaignRecipientFilter; label: string }> = [
  { id: "ALL", label: "Tất cả" },
  { id: "UNREAD", label: "Chưa xem" },
  { id: "UNACKED", label: "Chưa xác nhận" },
];

function stamp(done: string, at: string | undefined, pending: string) {
  const time = formatDateTimeVi(at);
  return at ? [done, time].filter(Boolean).join(" ") : pending;
}

function RecipientRow({ recipient, requireAck }: { recipient: CampaignRecipient; requireAck: boolean }) {
  const states = [stamp("Đã xem", recipient.readAt, "Chưa xem")];
  if (requireAck) states.push(stamp("Đã xác nhận", recipient.ackedAt, "Chưa xác nhận"));
  return (
    <ListItem divider sx={{ display: "block", px: 2, py: 1.25 }}>
      <Typography variant="body2" sx={{ fontWeight: "fontWeightMedium" }}>{recipient.displayName || "(Không rõ tên)"}</Typography>
      <Typography variant="caption" component="p" sx={{ color: "text.secondary" }}>{states.join(" · ")}</Typography>
    </ListItem>
  );
}

/** Recipients of a delivered campaign, filtered on the server; "Chưa xác nhận" only when the campaign asks for an ack. */
export function CampaignRecipientList({ campaignId, requireAck }: { campaignId: string; requireAck: boolean }) {
  const [filter, setFilter] = useState<CampaignRecipientFilter>("ALL");
  const query = useCampaignRecipients(campaignId, filter);
  const recipients = query.data?.pages.flatMap((page) => page.items ?? []) ?? [];

  let content;
  if (query.isPending) content = <ContentPendingSkeleton />;
  else if (query.isError) {
    content = (
      <ErgErrorState
        title="Không tải được danh sách người nhận"
        description="Kiểm tra kết nối rồi thử lại."
        action={<ErgButton variant="outlined" onClick={() => void query.refetch()}>Thử lại</ErgButton>}
      />
    );
  } else if (!recipients.length) content = <Typography variant="body2" sx={{ color: "text.secondary" }}>Không có người nhận nào.</Typography>;
  else {
    content = (
      <List aria-label="Người nhận" disablePadding sx={{ border: 1, borderColor: "divider", borderRadius: `${ergEnterpriseTokens.radius.card}px`, overflow: "hidden" }}>
        {recipients.map((recipient, index) => <RecipientRow key={recipient.userId ?? index} recipient={recipient} requireAck={requireAck} />)}
      </List>
    );
  }

  return (
    <Box component="section" aria-labelledby="campaign-recipients-heading" sx={{ display: "grid", gap: 1.5 }}>
      <Typography id="campaign-recipients-heading" variant="h6" component="h2">Người nhận</Typography>
      <Stack aria-label="Lọc người nhận" direction="row" role="group" sx={{ flexWrap: "wrap", gap: 1 }}>
        {FILTERS.filter((item) => requireAck || item.id !== "UNACKED").map((item) => (
          <Chip
            key={item.id}
            aria-pressed={filter === item.id}
            clickable
            color={filter === item.id ? "primary" : "default"}
            label={item.label}
            onClick={() => setFilter(item.id)}
            variant={filter === item.id ? "filled" : "outlined"}
          />
        ))}
      </Stack>
      {content}
      {query.hasNextPage ? (
        <Box>
          <ErgButton variant="outlined" loading={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>Xem thêm</ErgButton>
        </Box>
      ) : null}
    </Box>
  );
}
