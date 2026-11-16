import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { scheduleCellSx, type ScheduleCellKind } from "./schedule-cell-sx";

export type ScheduleLegendItem = "published" | "draft" | "clash" | "travel" | "off" | "assistant";

const LABELS: Record<ScheduleLegendItem, string> = {
  assistant: "Trợ giảng (TG)",
  clash: "Trùng",
  draft: "Nháp",
  off: "Nghỉ",
  published: "Đã áp dụng",
  travel: "Không kịp di chuyển (< 50′)",
};

const DEFAULT_ITEMS: ScheduleLegendItem[] = ["published", "draft", "clash", "travel", "off"];

type Props = {
  /** Chu thich dai cua tung muc, vi du Main: "Nháp (giáo viên chưa thấy)". */
  items?: ScheduleLegendItem[];
  labels?: Partial<Record<ScheduleLegendItem, string>>;
};

/** Chu thich dung chung (4.4): o mau + chu, cung thu tu o moi noi. */
export function ScheduleLegend({ items = DEFAULT_ITEMS, labels }: Props) {
  return (
    <Stack aria-label="Chú thích" component="ul" direction="row" spacing={2} sx={{ flexWrap: "wrap", listStyle: "none", m: 0, p: 0, rowGap: 0.5 }}>
      {items.map((item) => (
        <Stack component="li" direction="row" key={item} spacing={0.75} sx={{ alignItems: "center" }}>
          <Box aria-hidden sx={[{ borderRadius: 0.5, height: 12, width: 18 }, scheduleCellSx(item as ScheduleCellKind)] as never} />
          <Typography sx={{ color: "text.secondary", typography: "caption" }}>{labels?.[item] ?? LABELS[item]}</Typography>
        </Stack>
      ))}
    </Stack>
  );
}
