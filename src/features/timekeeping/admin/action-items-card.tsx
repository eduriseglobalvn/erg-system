import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { toast } from "sonner";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { useRemind } from "../api/timekeeping-admin-query";
import type { ActionItem } from "../api/timekeeping-types";
import { PunchCard } from "../components/punch/punch-card";

/** Kinds the backend sends today. Anything else (e.g. uncovered periods, D15) is not shown. */
const KNOWN_KINDS = ["NOT_PUNCHED_PERIOD_SOON", "PUNCH_REVIEW", "REQUEST_OVERDUE"];

type ActionItemsCardProps = {
  items: readonly ActionItem[];
  /** Opens the person's sheet (A02) for "Xem". */
  onView: (item: ActionItem) => void;
  /** Opens the request (A03) for "Mở". */
  onOpen: (item: ActionItem) => void;
};

/** "Cần xử lý ngay": Nhắc sends a punch reminder to the item's user; Xem / Mở navigate. */
export function ActionItemsCard({ items, onOpen, onView }: ActionItemsCardProps) {
  const remind = useRemind();
  const shown = items.filter((item) => KNOWN_KINDS.includes(item.kind ?? ""));
  const sendReminder = (item: ActionItem) =>
    remind.mutate([item.userId as string], {
      onSuccess: (result) => toast.success(`Đã nhắc ${result.sent ?? 0} người${result.skipped ? `, bỏ qua ${result.skipped}` : ""}`),
    });
  return (
    <PunchCard sx={{ p: 3 }}>
      <Typography component="h2" variant="subtitle1">Cần xử lý ngay</Typography>
      {shown.length === 0 ? (
        <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">Không có việc cần xử lý.</Typography>
      ) : (
        <Box component="ul" sx={{ listStyle: "none", m: 0, mt: 1, p: 0 }}>
          {shown.map((item) => (
            <Box component="li" key={`${item.kind}-${item.targetId}`} sx={{ alignItems: "center", borderTop: 1, borderColor: "divider", display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "space-between", py: 1 }}>
              <Typography sx={{ flex: 1, minWidth: 180 }} variant="body2">{item.label}</Typography>
              <Box sx={{ display: "flex", gap: 0.5 }}>
                {item.kind === "NOT_PUNCHED_PERIOD_SOON" && item.userId ? (
                  <ErgButton aria-label={`Nhắc ${item.userName ?? ""}`.trim()} disabled={remind.isPending} onClick={() => sendReminder(item)} size="small" variant="text">Nhắc</ErgButton>
                ) : null}
                <ErgButton aria-label={`Xem ${item.userName ?? ""}`.trim()} onClick={() => onView(item)} size="small" variant="text">Xem</ErgButton>
                {item.kind === "REQUEST_OVERDUE" ? (
                  <ErgButton aria-label={`Mở đơn của ${item.userName ?? ""}`.trim()} onClick={() => onOpen(item)} size="small" variant="text">Mở</ErgButton>
                ) : null}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </PunchCard>
  );
}
