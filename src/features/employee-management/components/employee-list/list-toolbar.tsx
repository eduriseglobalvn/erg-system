import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { appleDesign } from "@/features/employee-management/components/apple-ui-tokens";
import { alpha } from "@mui/material/styles";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

export function EmployeeListToolbar({
  onSearchChange,
  search,
  total,
}: {
  onSearchChange: (value: string) => void;
  search: string;
  total?: number;
}) {
  return (
    <Box
      sx={{
        alignItems: { sm: "center", xs: "flex-start" },
        borderBottom: `1px solid ${appleDesign.colors.border}`,
        display: "flex",
        flexDirection: { sm: "row", xs: "column" },
        gap: 2,
        justifyContent: "space-between",
        p: { md: 2.5, xs: 2 },
      }}
    >
      <Box>
        <Typography
          variant="subtitle1"
          sx={{
            color: appleDesign.colors.textPrimary,
            fontWeight: 600,
            letterSpacing: "-0.01em",
          }}
        >
          Danh sách nhân sự
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: appleDesign.colors.textSecondary,
            display: "block",
            fontWeight: 500,
          }}
        >
          {total !== undefined ? `${total} tài khoản` : "Đang tải dữ liệu"}
        </Typography>
      </Box>

      {/* Apple Safari/Spotlight Search Input */}
      <TextField
        size="small"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Tên, mã nhân viên, email, điện thoại..."
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" sx={{ color: appleDesign.colors.textTertiary }} />
              </InputAdornment>
            ),
            sx: {
              bgcolor: "rgba(0, 0, 0, 0.03)",
              borderRadius: "11px",
              fontSize: "0.85rem",
              minWidth: { md: 320, sm: 260, xs: "100%" },
              transition: "all 0.15s ease",
              "& fieldset": {
                borderColor: appleDesign.colors.border,
              },
              "&:hover fieldset": {
                borderColor: appleDesign.colors.borderMedium,
              },
              "&.Mui-focused fieldset": {
                borderColor: appleDesign.colors.blue,
                boxShadow: `0 0 0 3px ${alpha(ergEnterpriseTokens.color.primary, 0.15)}`,
              },
            },
          },
        }}
      />
    </Box>
  );
}
