import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Checkbox from "@mui/material/Checkbox";
import Popover from "@mui/material/Popover";

import { ErgButton } from "@/components/erg-mui";
import { ErgSearchField } from "@/components/erg-mui/erg-form";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { TeachingOverviewSchoolPage } from "@/features/teaching-calendar/api/teaching-calendar-overview-api";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { schoolBadge } from "./overview-school-grid";
import { ink, tone, type, weight } from "./overview-styles";

type Row = TeachingOverviewSchoolPage["items"][number];
type Props = {
  hasMore: boolean;
  loadMore: () => void;
  onSearch: (value: string) => void;
  /** Replaces the whole selection: «Chọn tất cả» / «Đặt lại» — empty means the default first schools (BUG-B-023). */
  onSelect: (ids: string[]) => void;
  onToggle: (id: string) => void;
  rows: readonly Row[];
  search: string;
  selected: readonly string[];
  selectedRows: readonly Pick<Row, "conflictCount" | "schoolId" | "schoolName">[];
  total: number;
};

/** «Thu gon» ten truong tren chip: bo tien to THCS / TH nhu board. */
const chipName = (name: string) => name.replace(/^(THCS|TH) /, "");

/** Hang chon truong cua board 6.6: nut «Trường: n / tổng ▾» mo danh sach tick (khong gioi han) + chip tung truong da chon, co «⚠ n». */
export function OverviewSchoolPicker({ hasMore, loadMore, onSearch, onSelect, onToggle, rows, search, selected, selectedRows, total }: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [text, setText] = useState(search);
  const debounced = useDebouncedValue(text, 300);
  useEffect(() => { if (debounced !== search) onSearch(debounced); }, [debounced, onSearch, search]);
  const sentinel = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const element = sentinel.current;
    if (!anchor || !element || !hasMore || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) loadMore(); });
    observer.observe(element);
    return () => observer.disconnect();
  }, [anchor, hasMore, loadMore, rows.length]);
  return (
    <Box className="erg-print-hide" sx={{ ...type(13), alignItems: "center", color: ink.textSecondary, display: "flex", flexWrap: "wrap", gap: 1 }}>
      <ButtonBase
        aria-haspopup="listbox" onClick={(event) => setAnchor(event.currentTarget)}
        sx={{ ...type(13, 500), alignItems: "center", bgcolor: ink.surface, border: `1px solid ${ink.border}`, borderRadius: `${ergEnterpriseTokens.radius.control}px`, color: ink.text, display: "inline-flex", gap: "6px", height: 32, px: "10px" }}
      >
        Trường: {selected.length} / {total} <Box component="span" sx={{ color: ink.textMuted }}>▾</Box>
      </ButtonBase>
      {selectedRows.map((row) => (
        <Box component="span" key={row.schoolId} sx={{ ...type(12, 500), alignItems: "center", bgcolor: ink.primarySofter, borderRadius: `${ergEnterpriseTokens.radius.chip}px`, color: tone.published.text, display: "inline-flex", gap: "4px", height: 28, pl: "10px", pr: "4px" }}>
          {chipName(row.schoolName)}
          {row.conflictCount > 0 ? <Box component="span" sx={{ color: ink.danger, ...weight(600) }}>⚠ {row.conflictCount}</Box> : null}
          <ButtonBase aria-label="Bỏ trường" onClick={() => onToggle(row.schoolId)} sx={{ ...type(14), borderRadius: `${ergEnterpriseTokens.radius.chip}px`, color: tone.published.text, height: 22, width: 22 }}>×</ButtonBase>
        </Box>
      ))}
      <Popover
        anchorEl={anchor} onClose={() => setAnchor(null)} open={Boolean(anchor)}
        slotProps={{ paper: { sx: { borderRadius: `${ergEnterpriseTokens.radius.card}px`, boxShadow: ergEnterpriseTokens.shadow.float, mt: 0.5, width: 320 } } }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, p: 1.5 }}>
          <ErgSearchField onChange={(event) => setText(event.target.value)} placeholder="Tìm trường…" value={text} />
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <ErgButton onClick={() => onSelect([...new Set([...selected, ...rows.map((row) => row.schoolId)])])} size="small" variant="text">Chọn tất cả</ErgButton>
            <ErgButton onClick={() => onSelect([])} size="small" variant="text">Đặt lại</ErgButton>
          </Box>
          <Box component="ul" role="listbox" sx={{ listStyle: "none", m: 0, maxHeight: 320, overflowY: "auto", p: 0 }}>
            {rows.map((row) => {
              const on = selected.includes(row.schoolId);
              const badge = schoolBadge(row);
              return (
                <Box component="li" key={row.schoolId} sx={{ ...type(13), alignItems: "center", display: "flex", gap: 0.5 }}>
                    <Checkbox checked={on} onChange={() => onToggle(row.schoolId)} size="small" slotProps={{ input: { "aria-label": row.schoolName } }} />
                    <Box component="span" sx={{ flex: 1, minWidth: 0 }}>{row.schoolName}</Box>
                    {badge ? <Box component="span" sx={{ ...type(11, 600), bgcolor: badge.bg, borderRadius: `${ergEnterpriseTokens.radius.chip}px`, color: badge.color, px: "7px" }}>{badge.label}</Box> : null}
                </Box>
              );
            })}
            <div ref={sentinel} />
          </Box>
        </Box>
      </Popover>
    </Box>
  );
}
