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
      <AppleFormField label="Điện thoại">
        <TextField
          value={form.phone}
          onChange={(event) => set("phone", event.target.value)}
          placeholder="0901234567"
          sx={appleCleanInputSx}
        />
      </AppleFormField>
      <AppleFormField label="Email khôi phục">
        <TextField
          type="email"
          value={form.recoveryEmail}
          onChange={(event) => set("recoveryEmail", event.target.value)}
          placeholder="recovery@gmail.com"
          sx={appleCleanInputSx}
        />
      </AppleFormField>
    </FormGrid>
  );
}
