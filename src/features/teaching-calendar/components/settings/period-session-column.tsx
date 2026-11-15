import Box from "@mui/material/Box";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgTextField } from "@/components/erg-mui/erg-form";
import { breakBefore, MAX_ROWS, SESSION_TITLES, type PeriodRow, type PeriodSession } from "@/features/teaching-calendar/domain/period-times-model";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { scheduleTokens } from "../shared/schedule-cell-sx";

const { color, radius, type } = ergEnterpriseTokens;

type Props = {
  /** So tiet (1..n) cua tung dong theo thu tu toan bang. */
  numbers: ReadonlyMap<number, number>;
  last: boolean;
  onAdd: () => void;
  onRemove: (key: number) => void;
  onTime: (key: number, field: "end" | "start", value: string) => void;
  onToggle: (key: number) => void;
  rows: readonly PeriodRow[];
  session: PeriodSession;
  total: number;
};

const timeSx = { width: 112, "& input": { fontVariantNumeric: "tabular-nums", py: "6px" } } as const;

/** Mot cot buoi (Sang / Chieu / Toi) cua bang «Giờ tiết của trường»: gio sua duoc, cong tat tiet, ra choi tinh tu gio. */
export function PeriodSessionColumn({ last, numbers, onAdd, onRemove, onTime, onToggle, rows, session, total }: Props) {
  return (
    <Box sx={{ borderRight: { md: last ? 0 : `1px solid ${color.divider}` }, px: 2.5, py: 2 }}>
      <Typography sx={{ color: color.textMuted, letterSpacing: "0.02em", mb: 0.75, ...type.label }}>{SESSION_TITLES[session]}</Typography>
      {rows.map((row, index) => {
        const previous = rows.slice(0, index).reverse().find((item) => item.enabled);
        const gap = row.enabled ? breakBefore(previous && { endTime: previous.end }, { startTime: row.start }) : 0;
        const number = numbers.get(row.key) ?? 0;
        return (
          <Box key={row.key}>
            {gap > 0 ? <Box sx={{ borderTop: `1px dashed ${color.border}`, color: color.textMuted, height: 28, ml: "68px", pt: "2px", ...type.note }}>Ra chơi {gap} phút</Box> : null}
            <Box sx={{ alignItems: "center", borderRadius: `${radius.control}px`, color: row.enabled ? undefined : scheduleTokens.disabled, display: "flex", gap: 1.5, minHeight: 44 }}>
              <Box component="span" sx={{ width: 56, ...type.smallStrong }}>Tiết {number}</Box>
              {row.enabled ? (
                <Box sx={{ alignItems: "center", display: "flex", flex: 1, gap: 0.75 }}>
                  <ErgTextField compact onChange={(event) => onTime(row.key, "start", event.target.value)} slotProps={{ htmlInput: { "aria-label": `Tiết ${number} bắt đầu` } }} sx={timeSx} type="time" value={row.start} />
                  <span aria-hidden>–</span>
                  <ErgTextField compact onChange={(event) => onTime(row.key, "end", event.target.value)} slotProps={{ htmlInput: { "aria-label": `Tiết ${number} kết thúc` } }} sx={timeSx} type="time" value={row.end} />
                </Box>
              ) : (
                <Box component="span" sx={{ flex: 1, textDecoration: "line-through", typography: "body2" }}>
                  {row.start && row.end ? `${row.start} – ${row.end}` : "Không dùng"}
                  <ErgButton onClick={() => onRemove(row.key)} size="small" sx={{ ml: 1, minWidth: 0 }} variant="text">Bỏ dòng</ErgButton>
                </Box>
              )}
              <Switch checked={row.enabled} onChange={() => onToggle(row.key)} size="small" slotProps={{ input: { "aria-label": `Tiết ${number} đang dùng` } }} />
            </Box>
          </Box>
        );
      })}
      <ErgButton disabled={total >= MAX_ROWS} onClick={onAdd} sx={{ height: 36, ml: "-8px", px: 1 }} variant="text">+ Thêm tiết</ErgButton>
    </Box>
  );
}
