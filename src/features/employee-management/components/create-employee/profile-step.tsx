import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";

import { appleCleanInputSx, appleDesign, AppleFormField } from "@/features/employee-management/components/apple-ui-tokens";
import type { EmployeeForm, SetEmployeeField } from "@/features/employee-management/components/create-employee/constants";
import { FormGrid } from "@/features/employee-management/components/create-employee/form-grid";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

export function ProfileStep({ form, set }: { form: EmployeeForm; set: SetEmployeeField }) {
  return (
    <FormGrid>
      <AppleFormField label="Mã nhân viên" required>
        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField
            value={form.employeeCode}
            onChange={(event) => set("employeeCode", event.target.value)}
            placeholder="NV-001"
            sx={{ ...appleCleanInputSx, flex: 1 }}
          />
          <Button
            variant="outlined"
            onClick={() => set("employeeCode", `NV-${Math.floor(1000 + Math.random() * 9000)}`)}
            sx={{
              borderColor: appleDesign.colors.borderMedium,
              borderRadius: `${ergEnterpriseTokens.radius.md}px`,
              color: appleDesign.colors.textSecondary,
              fontSize: "0.76rem",
              fontWeight: 600,
              px: 1.5,
              textTransform: "none",
              whiteSpace: "nowrap",
              "&:hover": {
                borderColor: appleDesign.colors.blue,
                color: appleDesign.colors.blue,
              },
            }}
          >
            Tạo mã tự động
          </Button>
        </Box>
      </AppleFormField>
      <AppleFormField label="Chức danh" required>
        <TextField
          value={form.jobTitle}
          onChange={(event) => set("jobTitle", event.target.value)}
          placeholder="Giảng viên chuyên trách..."
          sx={appleCleanInputSx}
        />
      </AppleFormField>
      <AppleFormField label="Phòng ban">
        <TextField
          value={form.departmentId}
          onChange={(event) => set("departmentId", event.target.value)}
          placeholder="Học thuật, Đào tạo..."
          sx={appleCleanInputSx}
        />
      </AppleFormField>
      <AppleFormField label="Loại hợp đồng">
        <TextField
          select
          value={form.employmentType}
          onChange={(event) => set("employmentType", event.target.value)}
          sx={appleCleanInputSx}
        >
          <MenuItem value="FULL_TIME">Toàn thời gian</MenuItem>
          <MenuItem value="PART_TIME">Bán thời gian</MenuItem>
          <MenuItem value="CONTRACTOR">Cộng tác viên</MenuItem>
        </TextField>
      </AppleFormField>
      <AppleFormField label="Ngày vào làm">
        <TextField
          type="date"
          value={form.joinedAt}
          onChange={(event) => set("joinedAt", event.target.value)}
          sx={appleCleanInputSx}
        />
      </AppleFormField>
      <AppleFormField label="Số năm kinh nghiệm">
        <TextField
          type="number"
          value={form.experienceYears}
          onChange={(event) => set("experienceYears", event.target.value)}
          placeholder="0"
          sx={appleCleanInputSx}
        />
      </AppleFormField>
      <AppleFormField label="Nơi làm việc">
        <TextField
          value={form.workLocation}
          onChange={(event) => set("workLocation", event.target.value)}
          placeholder="Cơ sở chính"
          sx={appleCleanInputSx}
        />
      </AppleFormField>
      <AppleFormField label="Quản lý trực tiếp">
        <TextField
          value={form.managerId}
          onChange={(event) => set("managerId", event.target.value)}
          placeholder="Mã quản lý..."
          sx={appleCleanInputSx}
        />
      </AppleFormField>
      <AppleFormField label="Người liên hệ khẩn cấp">
        <TextField
          value={form.emergencyName}
          onChange={(event) => set("emergencyName", event.target.value)}
          placeholder="Họ tên người thân..."
          sx={appleCleanInputSx}
        />
      </AppleFormField>
      <AppleFormField label="SĐT khẩn cấp">
        <TextField
          value={form.emergencyPhone}
          onChange={(event) => set("emergencyPhone", event.target.value)}
          placeholder="0987654321"
          sx={appleCleanInputSx}
        />
      </AppleFormField>
      <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
        <AppleFormField label="Tóm tắt kinh nghiệm">
          <TextField
            value={form.experienceSummary}
            onChange={(event) => set("experienceSummary", event.target.value)}
            placeholder="Tóm tắt kinh nghiệm giảng dạy, chứng chỉ chuyên môn..."
            multiline
            minRows={2.5}
            sx={appleCleanInputSx}
          />
        </AppleFormField>
      </Box>
    </FormGrid>
  );
}
