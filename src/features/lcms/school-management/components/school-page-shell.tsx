import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { useSchoolManagementContext } from "@/features/lcms/school-management/components/school-management-context";
import { SchoolPageToolbar } from "@/features/lcms/school-management/components/school-page-toolbar";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

export function SchoolPageShell({
  action,
  children,
  description,
  title,
  unscoped = false,
}: {
  action?: ReactNode;
  children: ReactNode;
  description?: string;
  title: string;
  unscoped?: boolean;
}) {
  const { error, isLoading, refetch } = useSchoolManagementContext();

  return (
    <Box sx={{ bgcolor: ergEnterpriseTokens.color.surfaceMuted, minHeight: "calc(100vh - 80px)" }}>
      <SchoolPageToolbar action={action} description={description} title={title} unscoped={unscoped} />

      {/* Main Content Area */}
      <Box sx={{ p: { xs: 2, md: 3.5 } }}>
        {!unscoped && isLoading ? (
          <Box sx={{ display: "grid", gap: 2 }}>
            <Skeleton height={120} sx={{ borderRadius: "16px" }} variant="rounded" />
            <Skeleton height={360} sx={{ borderRadius: "16px" }} variant="rounded" />
          </Box>
        ) : !unscoped && error ? (
          <Alert
            action={
              <Typography
                component="button"
                onClick={() => void refetch()}
                sx={{
                  bgcolor: "transparent",
                  border: 0,
                  color: "inherit",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Thử lại
              </Typography>
            }
            severity="error"
            sx={{ borderRadius: "12px" }}
          >
            Không thể tải dữ liệu trường: {error instanceof Error ? error.message : "Lỗi không xác định"}
          </Alert>
        ) : (
          children
        )}
      </Box>
    </Box>
  );
}