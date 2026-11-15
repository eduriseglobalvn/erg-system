import { useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import type { TeachingOverviewSchoolPage } from "@/features/teaching-calendar/api/teaching-calendar-overview-api";
import { MAX_COMPARED_SCHOOLS } from "@/features/teaching-calendar/domain/overview-model";
import { scheduleTokens } from "../shared/schedule-cell-sx";

type Row = TeachingOverviewSchoolPage["items"][number];

type Props = {
  hasMore: boolean;
  loadMore: () => void;
  onToggle: (id: string) => void;
  schools: readonly Row[];
  selected: readonly string[];
  total: number;
};

const badge = (row: Row) => {
  if (row.conflictCount > 0) return { bg: scheduleTokens.clash.bg, color: scheduleTokens.clash.text, label: `⚠ ${row.conflictCount}` };
  if (row.hasDraft) return { bg: scheduleTokens.published.bg, color: scheduleTokens.published.text, label: "Nháp" };
  if (row.periodCount === 0) return { bg: scheduleTokens.warn.bg, color: scheduleTokens.warn.text, label: "Chưa có lịch" };
  return { bg: scheduleTokens.neutral.bg, color: scheduleTokens.neutral.text, label: `${row.periodCount} tiết` };
};

/** Aside 280px (6.6): danh sach phang, tick toi da 3 truong, cuon vo han (trang 50). */
export function OverviewSchoolAside({ hasMore, loadMore, onToggle, schools, selected, total }: Props) {
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = sentinel.current;
    if (!element || !hasMore || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) loadMore(); });
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasMore, loadMore, schools.length]);
  const full = selected.length >= MAX_COMPARED_SCHOOLS;
  return (
    <Stack aria-label="Trường" className="erg-print-hide" component="aside" spacing={1} sx={{ flexShrink: 0, width: 280 }}>
      <Stack direction="row" sx={{ alignItems: "baseline", justifyContent: "space-between" }}>
        <Typography sx={{ typography: "subtitle1" }}>Trường</Typography>
        <Typography sx={{ color: "text.secondary", typography: "caption" }}>{total} trường · xung đột lên đầu</Typography>
      </Stack>
      <Typography sx={{ typography: "body2" }}>Đang xem cạnh nhau <strong>{selected.length}/{MAX_COMPARED_SCHOOLS}</strong> trường · tick để thêm</Typography>
      <Box component="ul" sx={{ listStyle: "none", m: 0, maxHeight: "70vh", overflowY: "auto", p: 0 }}>
        {schools.map((row) => {
          const on = selected.includes(row.schoolId);
          const tag = badge(row);
          return (
            <Tooltip disableHoverListener={on || !full} key={row.schoolId} title="Tối đa 3 trường cạnh nhau">
              <Box component="li" sx={{ alignItems: "center", display: "flex", gap: 0.5 }}>
                <Checkbox checked={on} onChange={() => onToggle(row.schoolId)} size="small" slotProps={{ input: { "aria-label": row.schoolName } }} />
                <Typography sx={{ flex: 1, minWidth: 0, typography: "body2" }}>{row.schoolName}</Typography>
                <Chip label={tag.label} size="small" sx={{ bgcolor: tag.bg, color: tag.color }} />
              </Box>
            </Tooltip>
          );
        })}
        <div ref={sentinel} />
      </Box>
    </Stack>
  );
}
