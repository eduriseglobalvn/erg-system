import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgSelect, ErgTextField } from "@/components/erg-mui/erg-form";
import { todayInput } from "@/domain/formatters/format-date";
import type { SchoolPeriodAssignment } from "@/features/teaching-calendar/api/teaching-calendar-period-times-api";
import type { TeachingPeriodTemplate } from "@/features/teaching-calendar/api/teaching-calendar-schedule-api";
import {
  addRow, assignmentKey, assignmentLabel, MAX_TIMED, periodIssueMessage, periodLength, removeRow, rowsFromSlots, SESSION_ORDER, setRowTime, timedCount, toggleRow, validateRows,
  type PeriodRow, type PeriodSession,
} from "@/features/teaching-calendar/domain/period-times-model";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { PeriodSessionColumn } from "./period-session-column";
import type { SchoolEntry } from "./use-school-periods";
import { useSaveSchoolPeriods } from "./use-school-periods";

const { color, radius, type } = ergEnterpriseTokens;

type Props = {
  /** Bang dang xem (null = truong chua co bang gio). */
  assignment: SchoolPeriodAssignment | null;
  onPickAssignment: (key: string) => void;
  school: SchoolEntry;
  /** Truong khac da co bang gio, de «Sao chép từ trường khác». */
  sources: ReadonlyArray<{ rows: PeriodRow[]; schoolName: string }>;
  templates: readonly TeachingPeriodTemplate[];
};

/** Khung sua gio tiet cua mot truong (board AdminSchoolPeriods). Mount lai (key) khi doi truong/bang de nap lai dong. */
export function SchoolPeriodsEditor({ assignment, onPickAssignment, school, sources, templates }: Props) {
  const initial = useMemo(() => rowsFromSlots(templates.find((item) => item.id === assignment?.templateId)?.slots ?? []), [assignment?.templateId, templates]);
  const [rows, setRows] = useState<PeriodRow[]>(initial);
  const [effectiveFrom, setEffectiveFrom] = useState(todayInput());
  const [menu, setMenu] = useState<{ anchor: HTMLElement; kind: "copy" | "template" } | null>(null);
  const saver = useSaveSchoolPeriods(school);
  const issue = validateRows(rows);
  const used = timedCount(rows);
  const length = periodLength(rows.filter((row) => row.enabled).map((row) => ({ endTime: row.end, startTime: row.start })));
  const numbers = new Map(rows.map((row, index) => [row.key, index + 1]));
  const fill = (next: PeriodRow[]) => { setRows(next); setMenu(null); saver.reset(); };
  const change = (next: PeriodRow[]) => { setRows(next); saver.reset(); };
  const error = saver.error ?? (issue ? periodIssueMessage(issue.code) : !effectiveFrom ? periodIssueMessage("INVALID_DATE") : undefined);

  return (
    <Box aria-label={`Giờ tiết ${school.schoolName}`} component="section" sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: `${radius.card}px`, flex: 1, minWidth: 0, width: "100%" }}>
      <Box sx={{ alignItems: "center", borderBottom: `1px solid ${color.divider}`, display: "flex", flexWrap: "wrap", gap: 1.5, px: 2.5, py: 2 }}>
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography sx={{ typography: "subtitle1" }}>{school.schoolName}</Typography>
          <Typography sx={{ color: color.textMuted, mt: 0.25, ...type.small }}>{used} tiết đang dùng (tối đa {MAX_TIMED}){length ? ` · ${length} phút/tiết` : ""}</Typography>
        </Box>
        {school.assignments.length ? (
          <ErgSelect
            label="Bảng giờ" onChange={(event) => onPickAssignment(String(event.target.value))} size="small" sx={{ maxWidth: 280, width: 240 }}
            options={school.assignments.map((item) => ({ label: `${assignmentLabel(item)}${item.current ? " · đang dùng" : ""}`, value: assignmentKey(item) }))}
            value={assignment ? assignmentKey(assignment) : ""}
          />
        ) : null}
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { md: "repeat(3, 1fr)", xs: "1fr" } }}>
        {SESSION_ORDER.map((session: PeriodSession, index) => (
          <PeriodSessionColumn
            key={session} last={index === SESSION_ORDER.length - 1} numbers={numbers} onAdd={() => change(addRow(rows, session))} onRemove={(key) => change(removeRow(rows, key))}
            onTime={(key, field, value) => change(setRowTime(rows, key, field, value))} onToggle={(key) => change(toggleRow(rows, key))}
            rows={rows.filter((row) => row.session === session)} session={session} total={rows.length}
          />
        ))}
      </Box>
      {error ? <Typography color="error" role="alert" sx={{ borderTop: `1px solid ${color.divider}`, px: 2.5, py: 1, ...type.small }}>{error}</Typography> : null}
      <Box sx={{ alignItems: "center", borderTop: `1px solid ${color.divider}`, display: "flex", flexWrap: "wrap", gap: 1, px: 2.5, py: 1.75 }}>
        <ErgButton onClick={(event) => setMenu({ anchor: event.currentTarget, kind: "template" })} sx={{ height: 36 }} variant="text">Tự điền theo mẫu…</ErgButton>
        <ErgButton color="inherit" disabled={!sources.length} onClick={(event) => setMenu({ anchor: event.currentTarget, kind: "copy" })} sx={{ color: color.textSecondary, height: 36 }} variant="text">Sao chép từ trường khác</ErgButton>
        <Box sx={{ flex: 1 }} />
        <ErgTextField compact label="Áp dụng từ" onChange={(event) => setEffectiveFrom(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 170 }} type="date" value={effectiveFrom} />
        <ErgButton disabled={Boolean(issue) || !effectiveFrom} loading={saver.pending} onClick={() => saver.save({ effectiveFrom, rows })} sx={{ height: 40, px: 2.5 }} variant="contained">Lưu giờ tiết</ErgButton>
      </Box>
      <Menu anchorEl={menu?.anchor} onClose={() => setMenu(null)} open={Boolean(menu)}>
        {menu?.kind === "template" ? templates.map((template) => <MenuItem key={template.id} onClick={() => fill(rowsFromSlots(template.slots))}>{template.name}</MenuItem>) : null}
        {menu?.kind === "copy" ? sources.map((source) => <MenuItem key={source.schoolName} onClick={() => fill(source.rows.map((row) => ({ ...row })))}>{source.schoolName}</MenuItem>) : null}
      </Menu>
    </Box>
  );
}
