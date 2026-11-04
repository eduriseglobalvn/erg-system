import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Skeleton from "@mui/material/Skeleton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { useSchoolManagementContext } from "@/features/lcms/school-management/components/school-management-context";
import { schoolTypeMeta } from "@/features/lcms/school-management/types/school-type-config";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { alpha } from "@mui/material/styles";

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
  const { error, isLoading, refetch, schools, selectedSchool, selectSchool } = useSchoolManagementContext();

  return (
    <Box sx={{ bgcolor: ergEnterpriseTokens.color.surfaceMuted, minHeight: "calc(100vh - 80px)" }}>
      {/* Apple Translucent Window Toolbar */}
      <Box
        sx={{
          backdropFilter: "blur(20px)",
          bgcolor: "rgba(255, 255, 255, 0.88)",
          borderBottom: `1px solid ${ergEnterpriseTokens.color.border}`,
          position: "sticky",
          top: 0,
          zIndex: 4,
        }}
      >
        <Box
          sx={{
            alignItems: { xs: "flex-start", md: "center" },
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 1.5,
            justifyContent: "space-between",
            px: { xs: 2.5, md: 3.5 },
            py: { xs: 1.5, md: 1.75 },
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                color: ergEnterpriseTokens.color.text,
                fontSize: { xs: "1.25rem", md: "1.45rem" },
                fontWeight: 600,
                letterSpacing: "-0.025em",
                lineHeight: 1.2,
              }}
            >
              {title}
            </Typography>
            {description ? (
              <Typography
                sx={{
                  color: ergEnterpriseTokens.color.textMuted,
                  fontSize: "0.825rem",
                  fontWeight: 500,
                  mt: 0.35,
                }}
              >
                {description}
              </Typography>
            ) : null}
          </Box>

          <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1.25, justifyContent: "flex-end" }}>
            {!unscoped && selectedSchool ? (
              <>
                <TextField
                  select
                  size="small"
                  value={selectedSchool.id}
                  onChange={(event) => selectSchool(event.target.value)}
                  slotProps={{ select: { IconComponent: ExpandMoreRoundedIcon } }}
                  sx={{
                    minWidth: 240,
                    "& .MuiOutlinedInput-root": {
                      bgcolor: "#FFFFFF",
                      borderRadius: "10px",
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      "& fieldset": { borderColor: "rgba(0, 0, 0, 0.12)" },
                      "&:hover fieldset": { borderColor: "rgba(0, 0, 0, 0.22)" },
                      "&.Mui-focused fieldset": {
                        borderColor: ergEnterpriseTokens.color.primary,
                        boxShadow: `0 0 0 3px ${alpha(ergEnterpriseTokens.color.primary, 0.15)}`,
                      },
                    },
                  }}
                >
                  {schools.map((school) => (
                    <MenuItem key={school.id} value={school.id} sx={{ fontSize: "0.85rem", fontWeight: 600 }}>
                      {school.name}
                    </MenuItem>
                  ))}
                </TextField>

                <Box
                  sx={{
                    alignItems: "center",
                    bgcolor: alpha(ergEnterpriseTokens.color.success, 0.1),
                    border: `1px solid ${alpha(ergEnterpriseTokens.color.success, 0.22)}`,
                    borderRadius: "9999px",
                    color: "#15803D",
                    display: "inline-flex",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    gap: 0.65,
                    px: 1.25,
                    py: 0.5,
                  }}
                >
                  <CheckCircleRoundedIcon sx={{ fontSize: 15 }} />
                  Đồng bộ 10 phút trước
                </Box>
              </>
            ) : null}
            {action}
          </Box>
        </Box>

        {/* Info Stripe */}
        {!unscoped && selectedSchool ? (
          <Box
            sx={{
              alignItems: "center",
              bgcolor: alpha(ergEnterpriseTokens.color.primary, 0.025),
              borderTop: "1px solid rgba(0, 0, 0, 0.05)",
              display: "flex",
              flexWrap: "wrap",
              gap: 1.5,
              px: { xs: 2.5, md: 3.5 },
              py: 0.85,
            }}
          >
            <Box
              sx={{
                bgcolor: alpha(ergEnterpriseTokens.color.primary, 0.08),
                border: `1px solid ${alpha(ergEnterpriseTokens.color.primary, 0.18)}`,
                borderRadius: "6px",
                color: ergEnterpriseTokens.color.primary,
                fontSize: "0.72rem",
                fontWeight: 600,
                px: 1,
                py: 0.25,
              }}
            >
              {schoolTypeMeta[selectedSchool.schoolType].shortLabel}
            </Box>

            <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.78rem", fontWeight: 550 }}>
              Năm học {selectedSchool.academicYear}
            </Typography>

            {selectedSchool.address ? (
              <>
                <Typography sx={{ color: "#C7C7CC", fontSize: "0.78rem" }}>·</Typography>
                <Typography noWrap sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.78rem", fontWeight: 500 }}>
                  {selectedSchool.address}
                </Typography>
              </>
            ) : null}
          </Box>
        ) : null}
      </Box>

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
