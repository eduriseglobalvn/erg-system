import SearchIcon from "@mui/icons-material/Search";
import MenuItem from "@mui/material/MenuItem";
import TextField, { type TextFieldProps } from "@mui/material/TextField";

type ErgTextFieldProps = TextFieldProps & {
  compact?: boolean;
};

export function ErgTextField({ compact = false, size, sx, ...props }: ErgTextFieldProps) {
  return (
    <TextField
      fullWidth
      size={size ?? (compact ? "small" : "medium")}
      sx={[
        {
          "& .MuiOutlinedInput-root": {
            bgcolor: "#FFFFFF",
            borderRadius: "10px",
            fontSize: "0.85rem",
            fontWeight: 550,
            transition: "all 0.15s ease",
            "& fieldset": {
              borderColor: "rgba(0, 0, 0, 0.12)",
              borderRadius: "10px",
            },
            "&:hover fieldset": {
              borderColor: "rgba(0, 0, 0, 0.22)",
            },
            "&.Mui-focused": {
              "& fieldset": {
                borderColor: "#0071E3",
                boxShadow: "0 0 0 3px rgba(0, 113, 227, 0.15)",
              },
            },
          },
          "& .MuiInputLabel-root": {
            color: "#6E6E73",
            fontSize: "0.85rem",
            fontWeight: 650,
            "&.Mui-focused": {
              color: "#0071E3",
            },
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      variant="outlined"
      {...props}
    />
  );
}

export type ErgSelectOption = {
  disabled?: boolean;
  label: string;
  value: string | number;
};

type ErgSelectProps = Omit<TextFieldProps, "children" | "select"> & {
  options: ErgSelectOption[];
};

export function ErgSelect({ options, sx, ...props }: ErgSelectProps) {
  return (
    <TextField
      fullWidth
      select
      sx={[
        {
          "& .MuiOutlinedInput-root": {
            bgcolor: "#FFFFFF",
            borderRadius: "10px",
            fontSize: "0.85rem",
            fontWeight: 550,
            transition: "all 0.15s ease",
            "& fieldset": {
              borderColor: "rgba(0, 0, 0, 0.12)",
              borderRadius: "10px",
            },
            "&:hover fieldset": {
              borderColor: "rgba(0, 0, 0, 0.22)",
            },
            "&.Mui-focused": {
              "& fieldset": {
                borderColor: "#0071E3",
                boxShadow: "0 0 0 3px rgba(0, 113, 227, 0.15)",
              },
            },
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      variant="outlined"
      {...props}
    >
      {options.map((option) => (
        <MenuItem disabled={option.disabled} key={option.value} value={option.value} sx={{ fontSize: "0.85rem", fontWeight: 550 }}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
}

export function ErgSearchField(props: ErgTextFieldProps) {
  const { slotProps, sx, ...rest } = props;

  return (
    <ErgTextField
      compact
      placeholder="Tìm kiếm..."
      {...rest}
      slotProps={{
        ...slotProps,
        input: {
          ...(slotProps?.input as object | undefined),
          startAdornment: <SearchIcon aria-hidden="true" sx={{ color: "#86868B", fontSize: 18, mr: 1 }} />,
        },
      }}
      sx={[
        {
          "& .MuiOutlinedInput-root": {
            bgcolor: "#F5F5F7",
            borderRadius: "10px",
            fontSize: "0.85rem",
            "& fieldset": {
              borderColor: "rgba(0, 0, 0, 0.08)",
            },
            "&:hover fieldset": {
              borderColor: "rgba(0, 0, 0, 0.18)",
            },
            "&.Mui-focused": {
              bgcolor: "#FFFFFF",
              "& fieldset": {
                borderColor: "#0071E3",
                boxShadow: "0 0 0 3px rgba(0, 113, 227, 0.15)",
              },
            },
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  );
}
