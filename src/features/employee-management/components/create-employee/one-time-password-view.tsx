import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { toast } from "sonner";

import { appleDesign } from "@/features/employee-management/components/apple-ui-tokens";

export function OneTimePasswordView({ email, oneTimePassword }: { email: string; oneTimePassword: string }) {
  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <Alert
        severity="success"
        sx={{
          bgcolor: "rgba(52, 199, 89, 0.08)",
          border: "1px solid rgba(52, 199, 89, 0.25)",
          borderRadius: "12px",
          color: appleDesign.colors.greenText,
          fontSize: "0.825rem",
          fontWeight: 650,
        }}
      >
        Tạo tài khoản nhân sự thành công! Mật khẩu tạm thời đã được tạo và đồng thời gửi đến email <b>{email}</b>.
      </Alert>
      <Alert
        severity="warning"
        sx={{
          bgcolor: "rgba(255, 149, 0, 0.08)",
          border: "1px solid rgba(255, 149, 0, 0.25)",
          borderRadius: "12px",
          color: appleDesign.colors.amberText,
        }}
      >
        Bạn có thể sao chép mật khẩu dưới đây để bàn giao trực tiếp. Nhân sự bắt buộc đổi mật khẩu ở lần đăng nhập đầu tiên.
      </Alert>
      <Box
        sx={{
          alignItems: "center",
          bgcolor: appleDesign.colors.surfaceSubtle,
          border: `1px solid ${appleDesign.colors.borderMedium}`,
          borderRadius: "14px",
          display: "flex",
          gap: 1.5,
          p: 2.25,
        }}
      >
        <Typography
          sx={{
            color: appleDesign.colors.textPrimary,
            flex: 1,
            fontFamily: '"SF Mono", "JetBrains Mono", Menlo, Consolas, monospace',
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: "0.06em",
          }}
        >
          {oneTimePassword}
        </Typography>
        <Button variant="contained"
          startIcon={<ContentCopyRoundedIcon />}
          onClick={() => {
            void navigator.clipboard?.writeText(oneTimePassword);
            toast.success("Đã sao chép mật khẩu vào bộ nhớ tạm");
          }}
          sx={{
            bgcolor: appleDesign.colors.blueSoft,
            borderRadius: "8px",
            color: appleDesign.colors.blue,
            fontWeight: 650,
            textTransform: "none",
            "&:hover": {
              bgcolor: "rgba(0, 113, 227, 0.16)",
            },
          }}
        >
          Sao chép
        </Button>
      </Box>
    </Box>
  );
}
