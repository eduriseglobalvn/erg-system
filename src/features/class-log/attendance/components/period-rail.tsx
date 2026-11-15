import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";

import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

import { attendanceCopy } from "../attendance-copy";
import { periodRangeLabel, ppctLag, type RailGroup } from "../attendance-model";

type Props = { dirty: boolean; groups: RailGroup[]; onSelect: (key: string) => void; selectedKey: string | null };

/** Left rail on desktop, horizontal scroller on the phone ("Tiết hôm nay theo TKB"). */
export function PeriodRail({ dirty, groups, onSelect, selectedKey }: Props) {
  const { color, radius } = ergEnterpriseTokens;
  return (
    <Box component="nav" aria-label="Tiết hôm nay theo TKB" sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography color="text.secondary" sx={{ display: { md: "block", xs: "none" } }} variant="caption">
        Tiết hôm nay theo TKB
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: { md: "column", xs: "row" },
          gap: 1,
          overflowX: { md: "visible", xs: "auto" },
          WebkitOverflowScrolling: "touch",
        }}
      >
        {groups.map((group) => {
          const selected = group.key === selectedKey;
          const lag = Math.max(...group.periods.map(ppctLag));
          const first = group.periods[0];
          const last = group.periods[group.periods.length - 1];
          const ppct = first.ppctPeriod === last.ppctPeriod ? `PPCT tiết ${first.ppctPeriod}` : `PPCT tiết ${first.ppctPeriod}–${last.ppctPeriod}`;
          const upcoming = group.periods.every((item) => !item.happened);
          const info = selected && dirty ? `Chưa lưu · ${ppct}` : lag > 0 ? `Lệch PPCT ${lag} tiết` : ppct;
          return (
            <ButtonBase
              aria-current={selected ? "true" : undefined}
              key={group.key}
              onClick={() => onSelect(group.key)}
              sx={{
                alignItems: "stretch",
                bgcolor: color.surface,
                border: `${selected ? 2 : 1}px solid ${selected ? color.primary : color.border}`,
                borderRadius: `${radius.card}px`,
                display: "flex",
                flex: { md: "none", xs: "0 0 auto" },
                flexDirection: "column",
                gap: 0.5,
                minHeight: 44,
                minWidth: { md: 0, xs: 180 },
                p: 1.5,
                textAlign: "left",
              }}
            >
              <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
                <Typography variant="subtitle2">{group.className}</Typography>
                <Typography color="text.secondary" variant="caption">{periodRangeLabel(group.periods)}</Typography>
                <Box sx={{ ml: "auto" }}>
                  <ErgStatusChip label={selected ? "Đang điểm danh" : upcoming ? "Sắp tới" : "Đã dạy"} tone={selected ? "info" : upcoming ? "neutral" : "success"} />
                </Box>
              </Box>
              <Typography color="text.secondary" variant="caption">{group.subjectName}</Typography>
              <Typography color={!selected && lag > 0 ? "warning.main" : "text.secondary"} variant="caption">{info}</Typography>
            </ButtonBase>
          );
        })}
      </Box>
      <Typography
        color="text.secondary"
        sx={{ border: `1px dashed ${color.border}`, borderRadius: `${radius.card}px`, display: { md: "block", xs: "none" }, p: 1.5 }}
        variant="caption"
      >
        {attendanceCopy.railNote} Dạy thay → tiết của lớp được nhận sẽ tự xuất hiện ở đây.
      </Typography>
    </Box>
  );
}
