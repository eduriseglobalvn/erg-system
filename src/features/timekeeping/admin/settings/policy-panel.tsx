import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { ErgTextField } from "@/components/erg-mui/erg-form";
import { POLICY_NUMBERS, type PolicyErrors, type PolicyForm, type PolicyNumberKey } from "./settings-model";

type PolicyPanelProps = {
  value: PolicyForm;
  errors: PolicyErrors;
  onChange: (patch: Partial<Record<PolicyNumberKey, number>>) => void;
  /** `policySummaryLines` of the policy in force today (not the draft). */
  summary: readonly string[];
};

/** Late tolerance, explanations, annual leave and lock day. Applies from the first day of the next period. */
export function PolicyPanel({ errors, onChange, summary, value }: PolicyPanelProps) {
  return (
    <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", md: "3fr 2fr" } }}>
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, alignContent: "start" }}>
        {POLICY_NUMBERS.map(({ key, label, max, min, unit }) => (
          <ErgTextField
            error={Boolean(errors[key])}
            helperText={errors[key] ?? (unit ? `Đơn vị: ${unit}` : `${min}–${max}`)}
            key={key}
            label={label}
            onChange={(event) => onChange({ [key]: event.target.value === "" ? Number.NaN : Number(event.target.value) })}
            slotProps={{ htmlInput: { inputMode: "numeric", max, min } }}
            type="number"
            value={Number.isNaN(value[key]) ? "" : value[key]}
          />
        ))}
      </Box>
      <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 2 }}>
        <Typography component="h3" variant="subtitle2">Tóm tắt chính sách đang áp dụng</Typography>
        <Box component="ul" sx={{ m: 0, mt: 1, pl: 2.5 }}>
          {summary.map((line) => (
            <Typography component="li" key={line} variant="body2">{line}</Typography>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
