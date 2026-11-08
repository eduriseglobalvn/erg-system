import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";

import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import type { MonthDayView } from "../../api/timekeeping-types";
import { dayCodeFor, type DayCodeTone } from "../../model/day-codes";
import { dayMonth, monthGridCells } from "./timesheet-summary";

const HEADERS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const LEGEND: Array<{ tone: DayCodeTone; label: string }> = [
  { tone: "success", label: "Đủ công" },
  { tone: "warning", label: "Muộn / về sớm" },
  { tone: "info", label: "Nghỉ phép" },
  { tone: "error", label: "Thiếu chấm" },
];

type MonthCalendarGridProps = { period: string; days: readonly MonthDayView[]; onSelect: (date: string) => void };

/** G04 calendar: Monday-first, one button per day (name e.g. "14/10, Thiếu chấm"), coloured by status. */
export function MonthCalendarGrid({ period, days, onSelect }: MonthCalendarGridProps) {
  const byDate = new Map(days.map((day) => [day.date, day]));
  return (
    <Box>
      <Box sx={{ display: "grid", gap: 0.75, gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
        {HEADERS.map((header) => (
          <Typography color="text.secondary" key={header} sx={{ textAlign: "center" }} variant="caption">{header}</Typography>
        ))}
        {monthGridCells(period, days).map((cell, index) => {
          if (!cell.date) return <Box key={`pad-${index}`} />;
          const day = byDate.get(cell.date);
          const code = cell.status ? dayCodeFor(cell.status, day?.leaveKind) : null;
          const tint = ergEnterpriseTokens.statusTint[code?.tone ?? "neutral"];
          const name = `${dayMonth(cell.date)}${code?.label ? `, ${code.label}` : ""}`;
          // Canvas `.cd`: white cell with a status bar; red cells are tinted; days off fade into the ground.
          const off = code?.tone === "neutral";
          const error = code?.tone === "error";
          return (
            <ButtonBase
              aria-current={cell.today ? "date" : undefined}
              aria-label={name}
              key={cell.date}
              onClick={() => onSelect(cell.date as string)}
              sx={{
                alignItems: "center",
                bgcolor: off ? "transparent" : error ? tint.bg : "background.paper",
                border: 1,
                borderColor: cell.today ? "primary.main" : off ? "transparent" : "divider",
                borderRadius: `${ergEnterpriseTokens.radius.control}px`,
                color: cell.today ? "primary.main" : off ? "text.secondary" : error ? tint.color : "text.primary",
                flexDirection: "column",
                gap: 0.625,
                justifyContent: "center",
                minHeight: 50,
              }}
            >
              <Typography component="span" sx={{ fontVariantNumeric: "tabular-nums" }} variant="subtitle2">{Number(cell.date.slice(8))}</Typography>
              {code && !off ? <Box aria-hidden sx={{ bgcolor: tint.dot, borderRadius: 0.25, height: 4, width: 18 }} /> : null}
            </ButtonBase>
          );
        })}
      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", mt: 1.5 }}>
        {LEGEND.map(({ tone, label }) => (
          <Box key={label} sx={{ alignItems: "center", display: "flex", gap: 0.5 }}>
            <Box aria-hidden sx={{ bgcolor: ergEnterpriseTokens.statusTint[tone].dot, borderRadius: 0.25, height: 4, width: 14 }} />
            <Typography color="text.secondary" variant="caption">{label}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
