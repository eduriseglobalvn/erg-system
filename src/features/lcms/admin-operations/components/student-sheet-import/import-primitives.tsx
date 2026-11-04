import type { ChangeEvent, ReactNode } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

export function ImportField({ children, label }: { children: ReactNode; label: string }) {
  return (
    <Box component="label" sx={{ display: "grid", gap: 1, color: "text.secondary", fontSize: 12, fontWeight: 700 }}>
      {label}
      {children}
    </Box>
  );
}

export function EditableCell({
  bold = false,
  mono = false,
  onChange,
  placeholder,
  value,
}: {
  bold?: boolean;
  mono?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <TextField
      fullWidth
      variant="standard"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      slotProps={{ input: { disableUnderline: true } }}
      sx={{
        "& .MuiInputBase-root": {
          borderBottom: 1,
          borderColor: "transparent",
          fontFamily: mono ? "JetBrains Mono, monospace" : "inherit",
          fontSize: 12,
          fontWeight: bold ? 700 : 500,
          "&:hover": { borderColor: "divider" },
          "&.Mui-focused": { borderColor: "primary.main" },
        },
      }}
    />
  );
}

export function RuleLine({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start", justifyContent: "space-between", borderRadius: 1, bgcolor: "action.hover", px: 1.5, py: 1 }}>
      <Typography sx={{ color: "text.primary", fontSize: 12, fontWeight: 600 }}>{label}</Typography>
      <Typography sx={{ color: "text.secondary", fontSize: 12, fontWeight: 700, textAlign: "right" }}>{value}</Typography>
    </Stack>
  );
}
