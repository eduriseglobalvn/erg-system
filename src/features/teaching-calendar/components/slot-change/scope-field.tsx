import { useState } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Radio from "@mui/material/Radio";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgTextField } from "@/components/erg-mui/erg-form";
import { formatDateVi } from "@/domain/formatters/format-date";
import type { ScopeKind, ScopeState } from "@/features/teaching-calendar/domain/slot-change-model";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { scheduleTokens } from "../shared/schedule-cell-sx";

const { color, radius, type } = ergEnterpriseTokens;

export type ScopeOption = { kind: ScopeKind; sub: string; title: string };

type Props = { onChange: (scope: ScopeState) => void; options: readonly ScopeOption[]; scope: ScopeState };

/** «Áp dụng cho» (boards AdminSlotEdit / AdminTeacherSwap): ba the chon; «Chọn ngày» them ngay bang o date. */
export function ScopeField({ onChange, options, scope }: Props) {
  const [draft, setDraft] = useState("");
  const add = () => {
    if (draft && !scope.dates.includes(draft)) onChange({ ...scope, dates: [...scope.dates, draft].sort() });
    setDraft("");
  };
  return (
    <Stack aria-label="Áp dụng cho" role="radiogroup" spacing={0.75}>
      <Typography sx={{ color: color.textSecondary, ...type.noteMedium }}>Áp dụng cho</Typography>
      {options.map((option) => {
        const on = scope.kind === option.kind;
        return (
          <Box
            component="label" key={option.kind}
            sx={{ alignItems: "flex-start", bgcolor: on ? color.primarySofter : "transparent", border: `1px solid ${on ? color.primary : color.border}`, borderRadius: `${radius.control}px`, cursor: "pointer", display: "flex", gap: 1.25, px: 1.25, py: 1 }}
          >
            <Radio checked={on} onChange={() => onChange({ ...scope, kind: option.kind })} size="small" slotProps={{ input: { "aria-label": option.title } }} sx={{ mt: "-1px", p: 0 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box component="span" sx={{ display: "block", ...type.smallStrong }}>{option.title}</Box>
              <Box component="span" sx={{ color: color.textMuted, display: "block", ...type.note }}>{option.sub}</Box>
            </Box>
          </Box>
        );
      })}
      {scope.kind === "SELECTED_DATES" ? (
        <Stack spacing={0.75}>
          <Stack direction="row" spacing={1}>
            <ErgTextField compact onChange={(event) => setDraft(event.target.value)} slotProps={{ htmlInput: { "aria-label": "Ngày áp dụng" } }} type="date" value={draft} />
            <ErgButton disabled={!draft} onClick={add} sx={{ flexShrink: 0 }} variant="outlined">Thêm ngày</ErgButton>
          </Stack>
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75 }}>
            {scope.dates.map((date) => (
              <Chip key={date} label={formatDateVi(date)} onDelete={() => onChange({ ...scope, dates: scope.dates.filter((item) => item !== date) })} size="small" sx={{ bgcolor: scheduleTokens.published.bg, color: scheduleTokens.published.text }} />
            ))}
          </Stack>
        </Stack>
      ) : null}
    </Stack>
  );
}
