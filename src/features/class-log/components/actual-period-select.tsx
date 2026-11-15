import { useMemo } from "react";

import { ErgSelect } from "@/components/erg-mui/erg-form";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

type Props = { actual: number; ppct: number; label: string; lagging: boolean; onChange: (value: number) => void };

// shortcut: the week query has no curriculum size, so the list runs to PPCT + 10; the server rejects a value past the
// framework (ACTUAL_PERIOD_OUT_OF_RANGE) and the row falls back. Upgrade when the period exposes the framework size.
const EXTRA_PERIODS = 10;

export function ActualPeriodSelect({ actual, ppct, label, lagging, onChange }: Props) {
  const options = useMemo(
    () => Array.from({ length: Math.max(ppct, actual) + EXTRA_PERIODS }, (_, i) => ({ value: i + 1, label: String(i + 1) })),
    [actual, ppct],
  );
  return (
    <ErgSelect
      onChange={(event) => onChange(Number(event.target.value))}
      options={options}
      size="small"
      slotProps={{ htmlInput: { "aria-label": label } }}
      sx={{ "& .MuiOutlinedInput-root fieldset": lagging ? { borderColor: t.color.warning } : {}, width: 88 }}
      value={actual}
    />
  );
}
