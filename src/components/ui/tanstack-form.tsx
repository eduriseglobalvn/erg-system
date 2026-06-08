import * as React from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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
  ...props
}: React.ComponentProps<"form">) {
  return <form className={cn("space-y-4", className)} {...props} />;
}

function TsFormItem({
  className,
  invalid,
  ...props
}: React.ComponentProps<"div"> & {
  invalid?: boolean;
}) {
  return (
    <div
      data-slot="ts-form-item"
      data-invalid={invalid ? "true" : undefined}
      className={cn("grid gap-2", className)}
      {...props}
    />
  );
}

function TsFormLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="ts-form-label"
      className={cn("data-[invalid=true]:text-destructive", className)}
      {...props}
    />
  );
}

function TsFormMessage({
  className,
  children,
  ...props
}: React.ComponentProps<"p">) {
  if (!children) {
    return null;
  }

  return (
    <p
      data-slot="ts-form-message"
      className={cn("text-sm text-destructive", className)}
      {...props}
    >
      {children}
    </p>
  );
}

function TsTextField<TValue extends string = string>({
  field,
  label,
  className,
  inputClassName,
  id,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "name" | "value" | "onBlur" | "onChange"> & {
  field: FieldLike<TValue>;
  label: React.ReactNode;
  inputClassName?: string;
}) {
  const generatedId = React.useId();
  const inputId = id ?? `${field.name}-${generatedId}`;
  const error = getErrorMessage(field.state.meta?.errors);
  const invalid = Boolean(error);

  return (
    <TsFormItem className={className} invalid={invalid}>
      <TsFormLabel htmlFor={inputId} data-invalid={invalid ? "true" : undefined}>
        {label}
      </TsFormLabel>
      <Input
        id={inputId}
        name={field.name}
        value={(field.state.value ?? "") as TValue}
        aria-invalid={invalid}
        aria-describedby={invalid ? `${inputId}-message` : undefined}
        className={inputClassName}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value as TValue)}
        {...props}
      />
      <TsFormMessage id={`${inputId}-message`}>{error}</TsFormMessage>
    </TsFormItem>
  );
}

export { TsForm, TsFormItem, TsFormLabel, TsFormMessage, TsTextField };
export type { FieldLike as TsFieldLike };
