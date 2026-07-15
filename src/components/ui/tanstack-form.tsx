import * as React from "react";
import Box from "@mui/material/Box";
import FormLabel from "@mui/material/FormLabel";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

type FieldError = string | { message?: string } | null | undefined;

type FieldLike<TValue = unknown> = {
  name: string;
  state: {
    value: TValue;
    meta?: {
      errors?: FieldError[];
    };
  };
  handleBlur?: () => void;
  handleChange: (value: TValue) => void;
};

function getErrorMessage(errors?: FieldError[]) {
  const firstError = errors?.find(Boolean);

  if (!firstError) {
    return undefined;
  }

  return typeof firstError === "string" ? firstError : firstError.message;
}

function TsForm({
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"form">) {
  return (
    <Box
      component="form"
      className={className}
      style={style}
      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      {...props}
    >
      {children}
    </Box>
  );
}

function TsFormItem({
  className,
  style,
  invalid,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  invalid?: boolean;
}) {
  return (
    <Box
      data-slot="ts-form-item"
      data-invalid={invalid ? "true" : undefined}
      className={className}
      style={style}
      sx={{ display: "grid", gap: 1 }}
      {...props}
    >
      {children}
    </Box>
  );
}

function TsFormLabel({
  className,
  style,
  invalid,
  children,
  htmlFor,
  color: _color,
  ...props
}: React.ComponentProps<"label"> & { invalid?: boolean }) {
  return (
    <FormLabel
      component="label"
      htmlFor={htmlFor}
      data-slot="ts-form-label"
      error={invalid}
      className={className}
      style={style}
      sx={{ fontSize: 14, fontWeight: 600, color: "text.primary", "&.Mui-error": { color: "error.main" } }}
      {...props}
    >
      {children}
    </FormLabel>
  );
}

function TsFormMessage({
  className,
  style,
  children,
  id,
}: {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  id?: string;
}) {
  if (!children) {
    return null;
  }

  return (
    <Typography
      data-slot="ts-form-message"
      id={id}
      variant="caption"
      className={className}
      style={style}
      sx={{ color: "error.main" }}
    >
      {children}
    </Typography>
  );
}

function TsTextField<TValue extends string = string>({
  field,
  label,
  id,
  type,
  placeholder,
  disabled,
  autoComplete,
  className,
}: {
  field: FieldLike<TValue>;
  label: React.ReactNode;
  id?: string;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;
  inputClassName?: string;
  className?: string;
}) {
  const generatedId = React.useId();
  const inputId = id ?? `${field.name}-${generatedId}`;
  const error = getErrorMessage(field.state.meta?.errors);
  const invalid = Boolean(error);

  return (
    <TextField
      id={inputId}
      name={field.name}
      label={label}
      type={type}
      placeholder={placeholder}
      disabled={disabled}
      autoComplete={autoComplete}
      value={(field.state.value ?? "") as TValue}
      error={invalid}
      helperText={error}
      size="small"
      fullWidth
      className={className}
      slotProps={{ htmlInput: { "aria-invalid": invalid } }}
      onBlur={field.handleBlur}
      onChange={(event) => field.handleChange(event.target.value as TValue)}
    />
  );
}

export { TsForm, TsFormItem, TsFormLabel, TsFormMessage, TsTextField };
export type { FieldLike as TsFieldLike };
