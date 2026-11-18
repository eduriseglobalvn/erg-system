import TextField from "@mui/material/TextField";

import { appleCleanInputSx, AppleFormField } from "@/features/employee-management/components/apple-ui-tokens";
import type { EmployeeForm, SetEmployeeField } from "@/features/employee-management/components/create-employee/constants";
import { FormGrid } from "@/features/employee-management/components/create-employee/form-grid";

export function IdentityStep({ form, set }: { form: EmployeeForm; set: SetEmployeeField }) {
  return (
    <FormGrid>
      <AppleFormField label="Họ và tên" required>
        <TextField
          value={form.fullName}
          onChange={(event) => set("fullName", event.target.value)}
          placeholder="Nguyễn Văn A"
          sx={appleCleanInputSx}
        />
      </AppleFormField>
      <AppleFormField label="Email công việc" required>
        <TextField
          type="email"
          value={form.email}
          onChange={(event) => set("email", event.target.value)}
          placeholder="name@erg.edu.vn"
          sx={appleCleanInputSx}
        />
      </AppleFormField>
    </FormGrid>
  );
}
