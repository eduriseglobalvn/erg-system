import { useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Checkbox from "@mui/material/Checkbox";
import Link from "@mui/material/Link";
import { alpha } from "@mui/material/styles";
import CheckIcon from "@mui/icons-material/Check";

import { ErgSearchField } from "@/components/erg-mui/erg-form";
import { todayInput } from "@/domain/formatters/format-date";
import { addDaysToDate, weekStartOf } from "@/features/teaching-calendar/domain/schedule-copy";
import { adminPath } from "@/platform/workspaces/workspace-paths";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { scheduleTokens } from "../shared/schedule-cell-sx";

const color = ergEnterpriseTokens.color;
const HEAD = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const small = { fontSize: "0.75rem" } as const;

type Option = { color?: string; id: string; label: string; meta?: string };

type Props = {
  anchor: string;
  children?: ReactNode;
  onPickDay: (day: string) => void;
  onToggleSchool: (id: string) => void;
  onToggleTeacher: (id: string) => void;
  schoolIds: readonly string[];
  schools: readonly Option[];
  teacherIds: readonly string[];
  teachers: readonly Option[];
};

/** Mini month (board 6.1): o 26px, tuan dang xem nen nhat, hom nay nen primary. */
function MiniMonth({ anchor, onPickDay }: { anchor: string; onPickDay: (day: string) => void }) {
  const month = anchor.slice(0, 7);
  const monthFirst = `${month}-01`;
  const first = weekStartOf(monthFirst);
  const weeks = Math.ceil(((new Date(`${monthFirst}T00:00:00Z`).getUTCDay() + 6) % 7 + new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)), 0)).getUTCDate()) / 7);
  const weekStart = weekStartOf(anchor);
  const today = todayInput();
  return (
    <Box aria-label={`Tháng ${Number(month.slice(5))}, ${month.slice(0, 4)}`} component="section">
      <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", pb: "6px", px: "4px", typography: "subtitle2", fontSize: "0.8125rem" }}>
        Tháng {Number(month.slice(5))}, {month.slice(0, 4)}
        <Box component="span" sx={{ color: color.textMuted, display: "inline-flex", gap: 0.5 }}>
          <ButtonBase aria-label="Tháng trước" onClick={() => onPickDay(addDaysToDate(monthFirst, -1))} sx={{ borderRadius: 1, px: 0.5 }}>‹</ButtonBase>
          <ButtonBase aria-label="Tháng sau" onClick={() => onPickDay(addDaysToDate(monthFirst, 31))} sx={{ borderRadius: 1, px: 0.5 }}>›</ButtonBase>
        </Box>
      </Box>
      <Box sx={{ ...small, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", rowGap: "2px", textAlign: "center" }}>
        {HEAD.map((label) => <Box component="span" key={label} sx={{ color: color.textMuted, height: 24, lineHeight: "24px" }}>{label}</Box>)}
        {Array.from({ length: weeks * 7 }, (_, index) => addDaysToDate(first, index)).map((day) => {
          const inMonth = day.startsWith(month);
          const inWeek = inMonth && day >= weekStart && day <= addDaysToDate(weekStart, 6);
          const isToday = day === today;
          return (
            <ButtonBase
              key={day} onClick={() => onPickDay(day)}
              sx={[{ bgcolor: isToday ? "primary.main" : inWeek ? color.primarySofter : undefined, borderRadius: "999px", color: isToday ? "primary.contrastText" : inWeek ? scheduleTokens.published.text : inMonth ? undefined : scheduleTokens.disabled, height: 26, ...(isToday ? { typography: "subtitle2" } : {}) }, small]}
            >
              {Number(day.slice(8))}
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );
}

/** O vuong 16px bo 4 (board): chon = nen mau + dau ✓ trang; khong chon = chi vien. */
function Square({ checked, tint }: { checked: boolean; tint: string }) {
  return (
    <Box aria-hidden sx={{ alignItems: "center", bgcolor: checked ? tint : "transparent", border: `1px solid ${checked ? tint : color.borderStrong}`, borderRadius: "4px", boxSizing: "border-box", color: "primary.contrastText", display: "flex", height: 16, justifyContent: "center", width: 16 }}>
      {checked ? <CheckIcon sx={{ fontSize: "0.75rem" }} /> : null}
    </Box>
  );
}

function Checklist({ onToggle, options, search, selected, title, periodsLink }: { onToggle: (id: string) => void; options: readonly Option[]; periodsLink?: boolean; search?: boolean; selected: readonly string[]; title: string }) {
  const [query, setQuery] = useState("");
  const visible = options.filter((option) => option.label.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi")));
  return (
    <Box aria-label={title} component="section">
      <Box component="h2" sx={{ typography: "subtitle2", fontSize: "0.8125rem", m: "0 0 6px" }}>{title}</Box>
      {search ? <ErgSearchField onChange={(event) => setQuery(event.target.value)} placeholder={`Tìm ${title.toLocaleLowerCase("vi")}…`} value={query} /> : null}
      <Box sx={{ maxHeight: 200, overflowY: "auto" }}>
        {visible.map((option) => {
          const checked = !selected.length || selected.includes(option.id);
          return (
            <Box component="label" key={option.id} sx={{ alignItems: "center", cursor: "pointer", display: "flex", gap: 1, height: 30 }}>
              <Checkbox checked={checked} checkedIcon={<Square checked tint={option.color ?? color.textSecondary} />} disableRipple icon={<Square checked={false} tint={option.color ?? color.textSecondary} />} slotProps={{ input: { "aria-label": option.label } }} onChange={() => onToggle(option.id)} sx={{ p: 0 }} />
              <Box component="span" sx={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{option.label}</Box>
              {periodsLink ? <Link href={`${adminPath("/calendar/settings/periods")}?schoolId=${encodeURIComponent(option.id)}`} onClick={(event) => event.stopPropagation()} sx={small} underline="none">Giờ tiết</Link> : null}
              {option.meta ? <Box component="span" sx={{ color: color.textMuted }}>{option.meta}</Box> : null}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

const swatch = { display: "inline-block", height: 10, mr: 0.75, verticalAlign: "middle", width: 14 } as const;

/** Chu thich 4 muc cua board (khung gio tiet chi hien khi keo). */
function Legend() {
  const t = scheduleTokens;
  return (
    <Box aria-label="Chú thích" component="ul" sx={{ ...small, color: color.textMuted, display: "flex", flexDirection: "column", gap: "4px", listStyle: "none", m: 0, mt: "auto", p: 0 }}>
      <li><Box component="span" sx={{ ...swatch, bgcolor: t.published.bg, borderLeft: `3px solid ${t.draft.edge}` }} />Đã áp dụng</li>
      <li><Box component="span" sx={{ ...swatch, border: `1px dashed ${t.draft.edge}`, boxSizing: "border-box" }} />Nháp (giáo viên chưa thấy)</li>
      <li><Box component="span" sx={{ ...swatch, border: `2px solid ${t.clash.edge}`, boxSizing: "border-box" }} />Trùng lịch</li>
      <li><Box component="span" sx={{ ...swatch, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06), borderTop: `1px dashed ${t.guide.edge}` }} />Khung giờ tiết của trường (khi kéo)</li>
    </Box>
  );
}

/** Panel trai 232px (6.1): mini month, Truong, Giao vien, the nhap (children), chu thich 4 muc. */
export function MainSidePanel({ anchor, children, onPickDay, onToggleSchool, onToggleTeacher, schoolIds, schools, teacherIds, teachers }: Props) {
  return (
    <Box component="aside" sx={{ display: "flex", flex: "0 0 232px", flexDirection: "column", fontSize: "0.8125rem", gap: 2, width: 232 }}>
      <MiniMonth anchor={anchor} onPickDay={onPickDay} />
      <Checklist onToggle={onToggleSchool} options={schools} periodsLink search={schools.length > 8} selected={schoolIds} title="Trường" />
      <Checklist onToggle={onToggleTeacher} options={teachers} selected={teacherIds} title="Giáo viên" />
      {children}
      <Legend />
    </Box>
  );
}
