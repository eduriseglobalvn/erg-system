import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import type { ContentScope } from "@/types/scope-types";

type BadgeTone = "primary" | "secondary" | "success" | "warning" | "danger" | "outline";

export const QUESTION_BANK_SELECT_MENU_PROPS = {
  disableScrollLock: true,
  keepMounted: true,
  slotProps: {
    paper: {
      sx: {
        border: `1px solid ${alpha("#0f172a", 0.08)}`,
        borderRadius: 2,
        boxShadow: "0 18px 40px rgba(15,23,42,0.12)",
        maxHeight: 340,
        mt: 0.5,
      },
    },
  },
  transitionDuration: 90,
};

export const ERG_SHEET_COLORS = {
  frame: "#f8fafc",
  header: "#f1f5f9",
  rowOdd: "#ffffff",
  rowEven: "#fbfdff",
  hover: "#f0f7ff",
  hoverBorder: "#e11d48",
  selected: "#eef6ff",
  selectedHover: "#e6f2ff",
};

export function toChipProps(tone: BadgeTone) {
  if (tone === "outline") {
    return { variant: "outlined" as const, color: "default" as const };
  }
  const colorMap: Record<Exclude<BadgeTone, "outline">, "primary" | "secondary" | "success" | "warning" | "error"> = {
    primary: "primary",
    secondary: "secondary",
    success: "success",
    warning: "warning",
    danger: "error",
  };
  return { variant: "filled" as const, color: colorMap[tone] };
}

export function Badge({ tone, className, children }: { tone: BadgeTone; className?: string; children: ReactNode }) {
  return <Chip size="small" label={children} className={className} {...toChipProps(tone)} />;
}

export function SelectControl({
  hideDescription = false,
  label,
  onChange,
  options,
  value,
}: {
  hideDescription?: boolean;
  label: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; description?: string }>;
  value: string;
}) {
  const selectedOption = options.find((option) => option.value === value);

  return (
    <Box>
      <FormControl fullWidth size="small">
        <InputLabel id={`${label}-select-label`}>{label}</InputLabel>
        <Select
          labelId={`${label}-select-label`}
          label={label}
          value={value}
          MenuProps={QUESTION_BANK_SELECT_MENU_PROPS}
          onChange={(event) => onChange(String(event.target.value))}
          sx={{
            borderRadius: 2,
            bgcolor: "#fff",
            fontSize: 14,
            fontWeight: 750,
            boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: alpha("#64748b", 0.22) },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: alpha("#0f6cbd", 0.45) },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#0f6cbd" },
          }}
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              <Stack spacing={0.25}>
                <Typography sx={{ fontSize: 14, fontWeight: 750 }}>{option.label}</Typography>
                {!hideDescription && option.description ? (
                  <Typography sx={{ color: "#64748b", fontSize: 12 }}>{option.description}</Typography>
                ) : null}
              </Stack>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {!hideDescription && selectedOption?.description ? (
        <Typography sx={{ mt: 0.75, color: "#64748b", fontSize: 11.5, fontWeight: 600 }} noWrap>
          {selectedOption.description}
        </Typography>
      ) : null}
    </Box>
  );
}

export function getScopeTone(itemScope: ContentScope, activeScope: ContentScope) {
  if (itemScope.type === "global") {
    return "primary";
  }

  return itemScope.type === activeScope.type && itemScope.centerId === activeScope.centerId ? "secondary" : "outline";
}

export function normalizeAutoCount(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(100, Math.max(1, Math.round(value)));
}

