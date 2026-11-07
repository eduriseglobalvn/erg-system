import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { useId } from "react";

type ChipChoiceProps<T extends string> = {
  label: string;
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  /** Visually hide the label (it stays the group's accessible name). */
  hideLabel?: boolean;
};

/** One-of-N chips exposed as a radio group: the group has a name, each chip says whether it is checked. */
export function ChipChoice<T extends string>({ label, options, value, onChange, disabled, hideLabel }: ChipChoiceProps<T>) {
  const labelId = useId();
  return (
    <Box>
      <Typography
        id={labelId}
        sx={hideLabel ? { clipPath: "inset(50%)", height: 1, overflow: "hidden", position: "absolute", width: 1 } : { mb: 0.75 }}
        variant="subtitle2"
      >
        {label}
      </Typography>
      <Box aria-labelledby={labelId} role="radiogroup" sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Chip
              aria-checked={selected}
              clickable={!disabled}
              color={selected ? "primary" : "default"}
              disabled={disabled}
              key={option.value}
              label={option.label}
              onClick={() => onChange(option.value)}
              role="radio"
              variant={selected ? "filled" : "outlined"}
            />
          );
        })}
      </Box>
    </Box>
  );
}
