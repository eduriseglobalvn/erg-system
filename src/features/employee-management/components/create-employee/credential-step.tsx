import KeyRoundedIcon from "@mui/icons-material/KeyRounded";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { appleDesign } from "@/features/employee-management/components/apple-ui-tokens";
import type { EmployeeForm, SetEmployeeField } from "@/features/employee-management/components/create-employee/constants";
import { alpha } from "@mui/material/styles";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

export function CredentialStep({ form, set }: { form: EmployeeForm; set: SetEmployeeField }) {
  return (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      <Typography
        sx={{
          color: appleDesign.colors.textPrimary,
          fontSize: "0.85rem",
          fontWeight: 600,
          mb: 0.5,
        }}
      >
        Chọn phương thức cấp thông tin đăng nhập
      </Typography>
      <Box
        onClick={() => set("credentialDelivery", "EMAIL_INVITE")}
        sx={{
          alignItems: "center",
          bgcolor: form.credentialDelivery === "EMAIL_INVITE" ? alpha(ergEnterpriseTokens.color.primary, 0.04) : "#FFFFFF",
          border: `1.5px solid ${
            form.credentialDelivery === "EMAIL_INVITE" ? appleDesign.colors.blue : appleDesign.colors.borderMedium
          }`,
          borderRadius: "14px",
          cursor: "pointer",
          display: "flex",
          gap: 1.5,
          p: 2,
          transition: "all 0.15s ease",
          "&:hover": {
            borderColor: appleDesign.colors.blue,
          },
        }}
      >
        <Box
          sx={{
            alignItems: "center",
            bgcolor: form.credentialDelivery === "EMAIL_INVITE" ? appleDesign.colors.blueSoft : "rgba(0, 0, 0, 0.04)",
            borderRadius: `${ergEnterpriseTokens.radius.md}px`,
            color: form.credentialDelivery === "EMAIL_INVITE" ? appleDesign.colors.blue : appleDesign.colors.textSecondary,
            display: "flex",
            height: 40,
            justifyContent: "center",
            width: 40,
          }}
        >
          <MailOutlineRoundedIcon fontSize="small" />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ color: appleDesign.colors.textPrimary, fontSize: "0.875rem", fontWeight: 600 }}>
            Gửi thư mời qua Email
          </Typography>
          <Typography sx={{ color: appleDesign.colors.textSecondary, fontSize: "0.78rem", mt: 0.25 }}>
            Hệ thống tự động gửi thư mời và thông tin tài khoản đăng nhập trực tiếp tới email nhân sự.
          </Typography>
        </Box>
      </Box>

      <Box
        onClick={() => set("credentialDelivery", "ONE_TIME_PASSWORD")}
        sx={{
          alignItems: "center",
          bgcolor: form.credentialDelivery === "ONE_TIME_PASSWORD" ? alpha(ergEnterpriseTokens.color.primary, 0.04) : "#FFFFFF",
          border: `1.5px solid ${
            form.credentialDelivery === "ONE_TIME_PASSWORD" ? appleDesign.colors.blue : appleDesign.colors.borderMedium
          }`,
          borderRadius: "14px",
          cursor: "pointer",
          display: "flex",
          gap: 1.5,
          p: 2,
          transition: "all 0.15s ease",
          "&:hover": {
            borderColor: appleDesign.colors.blue,
          },
        }}
      >
        <Box
          sx={{
            alignItems: "center",
            bgcolor: form.credentialDelivery === "ONE_TIME_PASSWORD" ? appleDesign.colors.blueSoft : "rgba(0, 0, 0, 0.04)",
            borderRadius: `${ergEnterpriseTokens.radius.md}px`,
            color: form.credentialDelivery === "ONE_TIME_PASSWORD" ? appleDesign.colors.blue : appleDesign.colors.textSecondary,
            display: "flex",
            height: 40,
            justifyContent: "center",
            width: 40,
          }}
        >
          <KeyRoundedIcon fontSize="small" />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ color: appleDesign.colors.textPrimary, fontSize: "0.875rem", fontWeight: 600 }}>
            Tạo mật khẩu tạm thời
          </Typography>
          <Typography sx={{ color: appleDesign.colors.textSecondary, fontSize: "0.78rem", mt: 0.25 }}>
            Hiển thị mật khẩu trên màn hình để bàn giao ngay, đồng thời hệ thống gửi thông tin đăng nhập qua email.
          </Typography>
        </Box>
      </Box>

      <Alert
        severity="info"
        sx={{
          bgcolor: alpha(ergEnterpriseTokens.color.primary, 0.04),
          border: `1px solid ${alpha(ergEnterpriseTokens.color.primary, 0.15)}`,
          borderRadius: `${ergEnterpriseTokens.radius.md}px`,
          color: appleDesign.colors.blue,
          mt: 1,
        }}
      >
        Dù chọn phương thức nào, hệ thống đều gửi email chứa thông tin tài khoản và hướng dẫn đăng nhập đến email nhân sự.
      </Alert>
    </Box>
  );
}
