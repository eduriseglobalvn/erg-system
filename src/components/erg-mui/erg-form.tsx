import SearchIcon from "@mui/icons-material/Search";
import MenuItem from "@mui/material/MenuItem";
import TextField, { type TextFieldProps } from "@mui/material/TextField";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

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
            borderRadius: 1.25,
            fontSize: "0.85rem",
            fontWeight: 550,
            transition: "all 0.15s ease",
            "& fieldset": {
              borderColor: "divider",
              borderRadius: 1.25,
            },
            "&:hover fieldset": {
              borderColor: "rgba(0, 0, 0, 0.22)",
            },
            "&.Mui-focused": {
              "& fieldset": {
                borderColor: "primary.main",
                boxShadow: ergEnterpriseTokens.shadow.focus,
              },
            },
          },
          "& .MuiInputLabel-root": {
            color: "text.secondary",
            fontSize: "0.85rem",
            fontWeight: 600,
            "&.Mui-focused": {
              color: "primary.main",
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
            borderRadius: 1.25,
            fontSize: "0.85rem",
            fontWeight: 550,
            transition: "all 0.15s ease",
            "& fieldset": {
              borderColor: "divider",
              borderRadius: 1.25,
            },
            "&:hover fieldset": {
              borderColor: "rgba(0, 0, 0, 0.22)",
            },
            "&.Mui-focused": {
              "& fieldset": {
                borderColor: "primary.main",
                boxShadow: ergEnterpriseTokens.shadow.focus,
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
          startAdornment: <SearchIcon aria-hidden="true" sx={{ color: "text.secondary", fontSize: 18, mr: 1 }} />,
        },
      }}
      sx={[
        {
          "& .MuiOutlinedInput-root": {
            bgcolor: "background.default",
            borderRadius: 1.25,
            fontSize: "0.85rem",
            "& fieldset": {
              borderColor: "divider",
            },
            "&:hover fieldset": {
              borderColor: "rgba(0, 0, 0, 0.18)",
            },
            "&.Mui-focused": {
              bgcolor: "#FFFFFF",
              "& fieldset": {
                borderColor: "primary.main",
                boxShadow: ergEnterpriseTokens.shadow.focus,
              },
            },
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  );
}
