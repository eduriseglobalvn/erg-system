import FileUploadRoundedIcon from "@mui/icons-material/FileUploadRounded";
import Button from "@mui/material/Button";
import { SchoolOverviewPanel } from "@/features/lcms/school-management/components/school-overview-panel";
import { SchoolPageShell } from "@/features/lcms/school-management/components/school-page-shell";
import { useSchoolManagementContext } from "@/features/lcms/school-management/components/school-management-context";
import { useNavigate } from "@tanstack/react-router";
import { adminPath } from "@/platform/workspaces/workspace-paths";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { alpha } from "@mui/material/styles";

export default function SchoolOverviewScreen() {
  const { selectedSchool } = useSchoolManagementContext();
  const navigate = useNavigate();

  if (!selectedSchool) return null;

  return (
    <SchoolPageShell
      title="Tổng quan vận hành"
      description="Tình trạng học sinh, lớp học, môn đăng ký và các việc cần xử lý của trường."
      action={
        <Button
          onClick={() => void navigate({ href: `${adminPath("/schools/imports")}?schoolId=${selectedSchool.id}` })}
          startIcon={<FileUploadRoundedIcon sx={{ fontSize: 18 }} />}
          variant="contained"
          sx={{
            bgcolor: ergEnterpriseTokens.color.primary,
            borderRadius: "10px",
            boxShadow: `0 2px 8px ${alpha(ergEnterpriseTokens.color.primary, 0.28)}`,
            color: "#FFFFFF",
            fontSize: "0.85rem",
            fontWeight: 600,
            letterSpacing: "-0.01em",
            px: 2,
            py: 0.85,
            textTransform: "none",
            transition: "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
            "&:hover": {
              bgcolor: ergEnterpriseTokens.color.primaryHover,
              boxShadow: `0 4px 14px ${alpha(ergEnterpriseTokens.color.primary, 0.38)}`,
            },
            "&:active": {
              bgcolor: ergEnterpriseTokens.color.primaryHover,
              transform: "scale(0.985)",
            },
          }}
        >
          Nhập dữ liệu
        </Button>
      }
    >
      <SchoolOverviewPanel school={selectedSchool} />
    </SchoolPageShell>
  );
}
