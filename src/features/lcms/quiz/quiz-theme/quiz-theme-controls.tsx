import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

type ChoiceGroupProps<V extends string> = {
  label: string;
  value: V;
  options: Record<V, string>;
  adornment?: (key: V) => ReactNode;
  onChange(next: V): void;
};

export function ChoiceGroup<V extends string>({ label, value, options, adornment, onChange }: ChoiceGroupProps<V>) {
  return (
    <Stack sx={{ gap: 0.75 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <ToggleButtonGroup
        exclusive
        fullWidth
        size="small"
        aria-label={label}
        value={value}
        onChange={(_, next: V | null) => {
          if (next) onChange(next);
        }}
      >
        {(Object.keys(options) as V[]).map((key) => (
          <ToggleButton key={key} value={key} sx={{ flexDirection: "column", gap: 0.5, textTransform: "none" }}>
            {adornment?.(key)}
            {options[key]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Stack>
  );
}

const dot = (selected: boolean) => ({
  border: `2px solid ${t.color.surface}`,
  borderRadius: "50%",
  boxShadow: `0 0 0 ${selected ? 2 : 1}px ${selected ? t.color.text : t.color.border}`,
  cursor: "pointer",
  flex: "none",
  height: 24,
  p: 0,
  width: 24,
});

type SwatchPickerProps = {
  label: string;
  otherLabel: string;
  value: string;
  swatches: { color: string; name: string }[];
  onChange(next: string): void;
};

/** Preset swatches plus a native color input for any other #rrggbb value. */
export function SwatchPicker({ label, otherLabel, value, swatches, onChange }: SwatchPickerProps) {
  const isPreset = swatches.some((swatch) => swatch.color.toLowerCase() === value.toLowerCase());

  return (
    <Stack sx={{ gap: 0.75 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Stack direction="row" role="group" aria-label={label} sx={{ flexWrap: "wrap", gap: 0.75 }}>
        {swatches.map((swatch) => {
          const selected = swatch.color.toLowerCase() === value.toLowerCase();
          return (
            <Box
              key={swatch.color}
              component="button"
              type="button"
              aria-label={swatch.name}
              aria-pressed={selected}
              title={swatch.name}
              onClick={() => onChange(swatch.color)}
              sx={{ ...dot(selected), bgcolor: swatch.color }}
            />
          );
        })}
        <Box
          component="input"
          type="color"
          aria-label={otherLabel}
          title={otherLabel}
          value={value}
          onChange={(event) => onChange((event.target as HTMLInputElement).value)}
          sx={{ ...dot(!isPreset), "&::-webkit-color-swatch": { border: 0, borderRadius: "50%" }, "&::-moz-color-swatch": { border: 0, borderRadius: "50%" }, "&::-webkit-color-swatch-wrapper": { p: 0 }, bgcolor: "transparent", overflow: "hidden" }}
        />
      </Stack>
    </Stack>
  );
}
