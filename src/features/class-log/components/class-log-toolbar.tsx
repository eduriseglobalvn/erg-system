import Box from "@mui/material/Box";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import { ErgButton, ErgIconButton } from "@/components/erg-mui/erg-actions";
import { ErgSelect } from "@/components/erg-mui/erg-form";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

import { classLogText, confirmLabel, sessionOptions, statusOptions } from "../domain/class-log-copy";

type Props = {
  weekNo?: number;
  rangeLabel: string;
  onWeekStep: (direction: -1 | 1) => void;
  session: string;
  status: string;
  onSession: (value: string) => void;
  onStatus: (value: string) => void;
  onOpenCurriculum: () => void;
  pending: number;
  confirming: boolean;
  onConfirm: () => void;
};

// Board toolbar controls are 36px tall (stepper, selects, buttons), 13px text.
export const selectSx = { "& .MuiOutlinedInput-root": { borderRadius: `${t.radius.control}px`, fontSize: t.type.small.fontSize, height: 36, minHeight: 36 } } as const;
const buttonSx = { borderColor: t.color.border, fontSize: t.type.small.fontSize, height: 36, minHeight: 36, px: 1.75 } as const;

/** Week stepper, session/status filters, «Khung chương trình» and the single contained «Xác nhận N tiết». */
export function ClassLogToolbar(p: Props) {
  return (
    <Box sx={{ alignItems: "center", borderBottom: `1px solid ${t.color.divider}`, display: "flex", flexWrap: "wrap", gap: 1, px: 2, py: 1.75 }}>
      <WeekStepper onStep={p.onWeekStep} rangeLabel={p.rangeLabel} weekNo={p.weekNo} />
      <ErgSelect onChange={(e) => p.onSession(e.target.value)} options={sessionOptions.map((o) => ({ ...o }))} size="small" slotProps={{ htmlInput: { "aria-label": "Buổi" } }} sx={{ ...selectSx, width: 140 }} value={p.session} />
      <ErgSelect onChange={(e) => p.onStatus(e.target.value)} options={statusOptions.map((o) => ({ ...o }))} size="small" slotProps={{ htmlInput: { "aria-label": "Trạng thái" } }} sx={{ ...selectSx, width: 180 }} value={p.status} />
      <Box sx={{ flex: 1 }} />
      <ErgButton onClick={p.onOpenCurriculum} sx={{ ...buttonSx, color: t.color.text }} variant="outlined">{classLogText.curriculumButton}</ErgButton>
      <ErgButton disabled={p.pending === 0} loading={p.confirming} onClick={p.onConfirm} sx={{ ...buttonSx, px: 2 }} variant="contained">{confirmLabel(p.pending)}</ErgButton>
    </Box>
  );
}

export function WeekStepper({ weekNo, rangeLabel, onStep }: { weekNo?: number; rangeLabel: string; onStep: (direction: -1 | 1) => void }) {
  return (
    <Box sx={{ alignItems: "center", border: `1px solid ${t.color.border}`, borderRadius: `${t.radius.control}px`, display: "flex", height: 36, overflow: "hidden" }}>
      <ErgIconButton label="Tuần trước" onClick={() => onStep(-1)} size="small" sx={{ height: 36, width: 36 }}><ChevronLeftIcon /></ErgIconButton>
      <Box sx={{ alignItems: "center", borderInline: `1px solid ${t.color.border}`, display: "flex", fontSize: t.type.small.fontSize, gap: 1, height: "100%", px: 1.5 }}>
        {weekNo ? <Box component="strong" sx={{ fontWeight: t.type.label.fontWeight }}>{`Tuần ${weekNo}`}</Box> : null}
        <Box component="span" sx={{ color: t.color.textMuted }}>{rangeLabel}</Box>
      </Box>
      <ErgIconButton label="Tuần sau" onClick={() => onStep(1)} size="small" sx={{ height: 36, width: 36 }}><ChevronRightIcon /></ErgIconButton>
    </Box>
  );
}
