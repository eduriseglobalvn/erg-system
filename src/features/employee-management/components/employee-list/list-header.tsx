import AddRoundedIcon from "@mui/icons-material/AddRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { appleDesign } from "@/features/employee-management/components/apple-ui-tokens";

export function EmployeeListHeader({ onCreate }: { onCreate: () => void }) {
  return (
    <Box
      sx={{
        alignItems: { sm: "center", xs: "flex-start" },
        display: "flex",
        flexDirection: { sm: "row", xs: "column" },
        gap: 2,
        justifyContent: "space-between",
        mb: 3,
      }}
    >
      <Box>
        <Box
          sx={{
            alignItems: "center",
            display: "inline-flex",
            gap: 0.6,
            mb: 0.5,
          }}
        >
          <Typography
            variant="overline"
            sx={{
              color: appleDesign.colors.blue,
              fontSize: "0.725rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
            }}
          >
            Quản lý
          </Typography>
        </Box>
        <Typography
          variant="h4"
          sx={{
            color: appleDesign.colors.textPrimary,
            fontWeight: 750,
            letterSpacing: "-0.03em",
            lineHeight: 1.2,
          }}
        >
          Tài khoản nhân sự
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: appleDesign.colors.textSecondary,
            lineHeight: 1.5,
            maxWidth: 720,
            mt: 0.5,
          }}
        >
          Quản lý hồ sơ, nhóm quyền, scope, trạng thái, credential, rủi ro và session trong một workspace.
        </Typography>
      </Box>

      <Button
        variant="contained"
        startIcon={<AddRoundedIcon />}
        onClick={() => onCreate()}
        sx={{
          bgcolor: appleDesign.colors.blue,
          borderRadius: "12px",
          boxShadow: appleDesign.shadows.button,
          flexShrink: 0,
          fontSize: "0.875rem",
          fontWeight: 650,
          px: 2.5,
          py: 1.1,
          textTransform: "none",
          transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
          "&:hover": {
            bgcolor: appleDesign.colors.blueHover,
            boxShadow: appleDesign.shadows.buttonHover,
            transform: "translateY(-1px)",
          },
        }}
      >
        Tạo tài khoản
      </Button>
    </Box>
  );
}
