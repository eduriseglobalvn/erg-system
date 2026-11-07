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
      <Box sx={{ display: "grid", gap: 0.5, gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
        {HEADERS.map((header) => (
          <Typography color="text.secondary" key={header} sx={{ textAlign: "center" }} variant="caption">{header}</Typography>
        ))}
        {monthGridCells(period, days).map((cell, index) => {
          if (!cell.date) return <Box key={`pad-${index}`} />;
          const day = byDate.get(cell.date);
          const code = cell.status ? dayCodeFor(cell.status, day?.leaveKind) : null;
          const tint = ergEnterpriseTokens.statusTint[code?.tone ?? "neutral"];
          const name = `${dayMonth(cell.date)}${code?.label ? `, ${code.label}` : ""}`;
          return (
            <ButtonBase
              aria-current={cell.today ? "date" : undefined}
              aria-label={name}
              key={cell.date}
              onClick={() => onSelect(cell.date as string)}
              sx={{
                alignItems: "center",
                bgcolor: code ? tint.bg : "transparent",
                border: 1,
                borderColor: cell.today ? "primary.main" : "divider",
                borderRadius: `${ergEnterpriseTokens.radius.control}px`,
                color: code ? tint.color : "text.primary",
                flexDirection: "column",
                justifyContent: "center",
                minHeight: 52,
              }}
            >
              <Typography component="span" sx={{ fontVariantNumeric: "tabular-nums" }} variant="body2">{Number(cell.date.slice(8))}</Typography>
              <Typography aria-hidden component="span" variant="caption">{code?.code ?? ""}</Typography>
            </ButtonBase>
          );
        })}
      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 1.5 }}>
        {LEGEND.map(({ tone, label }) => (
          <Box key={label} sx={{ alignItems: "center", display: "flex", gap: 0.75 }}>
            <Box aria-hidden sx={{ bgcolor: ergEnterpriseTokens.statusTint[tone].dot, borderRadius: "50%", height: 8, width: 8 }} />
            <Typography color="text.secondary" variant="caption">{label}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
