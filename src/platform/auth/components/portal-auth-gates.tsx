import Alert from "@mui/material/Alert";

import type { PortalKey } from "@/platform/auth/components/portal-login-copy";

export function NoPermissionNotice({ accountEmail, portal }: { accountEmail: string; portal: PortalKey }) {
  return (
    <Alert
      severity="warning"
      sx={{
        mb: 2.5,
        borderRadius: 1.5,
        fontSize: 14,
        bgcolor: "rgba(255,171,0,0.1)",
        border: "1px solid rgba(255,171,0,0.2)",
        color: "#B76E00",
        "& .MuiAlert-icon": { color: "#B76E00" },
      }}
    >
      Tài khoản {accountEmail} chưa có quyền truy cập {portal}. Vui lòng đăng nhập bằng tài khoản được cấp quyền.
    </Alert>
  );
}
