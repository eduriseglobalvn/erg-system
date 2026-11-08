import CheckIcon from "@mui/icons-material/Check";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { useId } from "react";

import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

type ChipChoiceProps<T extends string> = {
  label: string;
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  /** Visually hide the label (it stays the group's accessible name). */
  hideLabel?: boolean;
  /** Tick on the chosen chip (form fields); filters leave it off. */
  checkmark?: boolean;
  /** Equal-width segmented control instead of chips (canvas `.seg`). */
  segmented?: boolean;
};

const { color, radius, shadow, statusTint } = ergEnterpriseTokens;

/** One-of-N chips exposed as a radio group: the group has a name, each chip says whether it is checked. */
export function ChipChoice<T extends string>({ label, options, value, onChange, disabled, hideLabel, checkmark, segmented }: ChipChoiceProps<T>) {
  const labelId = useId();
  return (
    <Box>
      <Typography
        color="text.secondary"
        id={labelId}
        sx={hideLabel ? { clipPath: "inset(50%)", height: "1px", overflow: "hidden", position: "absolute", whiteSpace: "nowrap", width: "1px" } : { mb: 0.75 }}
        variant="subtitle2"
      >
        {label}
      </Typography>
      {segmented ? (
        <Box aria-labelledby={labelId} role="radiogroup" sx={{ bgcolor: color.divider, borderRadius: `${radius.control}px`, display: "flex", gap: 0.25, p: "3px" }}>
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <ButtonBase
                aria-checked={selected}
                disabled={disabled}
                key={option.value}
                onClick={() => onChange(option.value)}
                role="radio"
                sx={{ bgcolor: selected ? "background.paper" : "transparent", borderRadius: `${radius.sm}px`, boxShadow: selected ? shadow.xs : "none", color: selected ? "text.primary" : "text.secondary", flex: 1, height: 36, px: 1.25, typography: "subtitle2" }}
              >
                {option.label}
              </ButtonBase>
            );
          })}
        </Box>
      ) : (
        <Box aria-labelledby={labelId} role="radiogroup" sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <Chip
                aria-checked={selected}
                clickable={!disabled}
                disabled={disabled}
                icon={selected && checkmark ? <CheckIcon /> : undefined}
                key={option.value}
                label={option.label}
                onClick={() => onChange(option.value)}
                role="radio"
                sx={{
                  bgcolor: selected ? statusTint.info.bg : "background.paper",
                  borderColor: selected ? "primary.main" : "divider",
                  color: selected ? statusTint.info.color : "text.secondary",
                  height: 36,
                  "& .MuiChip-label": { px: 1.5 },
                  typography: selected ? "subtitle2" : "body2",
                  "& .MuiChip-icon": { color: "inherit" },
                  "&&:hover": { bgcolor: selected ? statusTint.info.bg : "action.hover" },
                }}
                variant="outlined"
              />
            );
          })}
        </Box>
      )}
    </Box>
  );
}
