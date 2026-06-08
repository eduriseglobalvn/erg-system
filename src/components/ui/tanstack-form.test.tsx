import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { TsFormItem, TsFormLabel, TsFormMessage, TsTextField } from "@/components/ui/tanstack-form";

test("TsTextField renders label, value, and validation state from a TanStack field-like object", () => {
  const handleChange = vi.fn();

  render(
    <TsTextField
      field={{
        name: "email",
        state: {
          value: "teacher@erg.edu.vn",
          meta: {
            errors: ["Email không hợp lệ"],
          },
        },
        handleBlur: vi.fn(),
        handleChange,
      }}
      label="Email"
      type="email"
    />,
  );

  const input = screen.getByLabelText("Email");
  expect(input).toHaveValue("teacher@erg.edu.vn");
  expect(input).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByText("Email không hợp lệ")).toBeInTheDocument();

  fireEvent.change(input, { target: { value: "admin@erg.edu.vn" } });
  expect(handleChange).toHaveBeenCalledWith("admin@erg.edu.vn");
});

test("form primitives compose accessible field markup", () => {
  render(
    <TsFormItem data-testid="item" invalid>
      <TsFormLabel htmlFor="name">Tên</TsFormLabel>
      <TsFormMessage>Vui lòng nhập tên.</TsFormMessage>
    </TsFormItem>,
  );

  expect(screen.getByTestId("item")).toHaveAttribute("data-invalid", "true");
  expect(screen.getByText("Tên")).toHaveAttribute("for", "name");
  expect(screen.getByText("Vui lòng nhập tên.")).toHaveAttribute("data-slot", "ts-form-message");
});
