import SearchIcon from "@mui/icons-material/Search";
import MenuItem from "@mui/material/MenuItem";
import TextField, { type TextFieldProps } from "@mui/material/TextField";

type ErgTextFieldProps = TextFieldProps & {
  compact?: boolean;
};

export function ErgTextField({ compact = false, size, ...props }: ErgTextFieldProps) {
  return <TextField fullWidth size={size ?? (compact ? "small" : "medium")} variant="outlined" {...props} />;
}

export type ErgSelectOption = {
  disabled?: boolean;
  label: string;
  value: string | number;
};

type ErgSelectProps = Omit<TextFieldProps, "children" | "select"> & {
  options: ErgSelectOption[];
};

export function ErgSelect({ options, ...props }: ErgSelectProps) {
  return (
    <TextField fullWidth select variant="outlined" {...props}>
      {options.map((option) => (
        <MenuItem disabled={option.disabled} key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
}

export function ErgSearchField(props: ErgTextFieldProps) {
  const { slotProps, ...rest } = props;

  return (
    <ErgTextField
      compact
      placeholder="Tim kiem"
      {...rest}
      slotProps={{
        ...slotProps,
        input: {
          ...(slotProps?.input as object | undefined),
          startAdornment: <SearchIcon aria-hidden="true" sx={{ fontSize: 17, mr: 1 }} />,
        },
      }}
    />
  );
}
