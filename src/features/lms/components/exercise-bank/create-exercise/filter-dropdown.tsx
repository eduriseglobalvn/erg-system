import type { ChangeEvent, ReactNode } from "react";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import type { SxProps, Theme } from "@mui/material/styles";

interface FilterDropdownProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  children: ReactNode;
  sx?: SxProps<Theme>;
  isFiltered?: boolean;
  icon?: ReactNode;
}

export function FilterDropdown({
  value,
  onChange,
  children,
  sx,
  isFiltered,
  icon,
}: FilterDropdownProps) {
  return (
    <TextField
      select
      size="small"
      value={value}
      onChange={onChange}
      slotProps={
        icon
          ? { input: { startAdornment: <InputAdornment position="start" sx={{ color: "primary.main", mr: 0 }}>{icon}</InputAdornment> } }
          : undefined
      }
      sx={[
        {
          "& .MuiSelect-select": {
            typography: "caption",
            fontWeight: isFiltered ? "fontWeightBold" : "fontWeightMedium",
            py: 0.75,
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </TextField>
  );
}
