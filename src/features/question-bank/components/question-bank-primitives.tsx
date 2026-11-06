import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";

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
            fontWeight: 600,
            boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: alpha("#64748b", 0.22) },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: alpha("#0071E3", 0.45) },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#0071E3" },
          }}
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              <Stack spacing={0.25}>
                <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{option.label}</Typography>
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

export function normalizeAutoCount(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(100, Math.max(1, Math.round(value)));
}

