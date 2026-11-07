import { ErgTextField } from "@/components/erg-mui/erg-form";

type RequestFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "date" | "time";
  multiline?: boolean;
  error?: string;
  helper?: string;
  disabled?: boolean;
};

/** Labelled input; the error (or the hint) is the helperText, which MUI links with aria-describedby. */
export function RequestField({ label, value, onChange, type, multiline, error, helper, disabled }: RequestFieldProps) {
  return (
    <ErgTextField
      disabled={disabled}
      error={Boolean(error)}
      helperText={error ?? helper}
      label={label}
      minRows={multiline ? 3 : undefined}
      multiline={multiline}
      onChange={(event) => onChange(event.target.value)}
      slotProps={type ? { inputLabel: { shrink: true } } : undefined}
      type={type}
      value={value}
    />
  );
}
