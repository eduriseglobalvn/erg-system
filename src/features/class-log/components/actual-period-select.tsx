import { useMemo } from "react";

import { ErgSelect } from "@/components/erg-mui/erg-form";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

import { selectSx } from "./class-log-toolbar";

type Props = { actual: number; ppct: number; curriculumPeriodCount?: number | null; label: string; lagging: boolean; onChange: (value: number) => void };

// Without a KCT (curriculumPeriodCount null) there is no real limit, so the list runs to PPCT + 10.
const EXTRA_PERIODS = 10;

export function ActualPeriodSelect({ actual, ppct, curriculumPeriodCount, label, lagging, onChange }: Props) {
  const options = useMemo(
    () => Array.from({ length: Math.max(actual, curriculumPeriodCount ?? ppct + EXTRA_PERIODS) }, (_, i) => ({ value: i + 1, label: String(i + 1) })),
    [actual, ppct, curriculumPeriodCount],
  );
  return (
    <ErgSelect
      onChange={(event) => onChange(Number(event.target.value))}
      options={options}
      size="small"
      slotProps={{ htmlInput: { "aria-label": label } }}
      sx={{ ...selectSx, "& .MuiOutlinedInput-root": { ...selectSx["& .MuiOutlinedInput-root"], borderRadius: `${t.radius.sm}px`, height: 30, fontWeight: t.type.label.fontWeight }, "& .MuiOutlinedInput-root fieldset": lagging ? { borderColor: t.classLog.late.edge } : {}, width: "100%" }}
      value={actual}
    />
  );
}
