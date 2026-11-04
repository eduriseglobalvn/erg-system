import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { appleDesign } from "@/features/employee-management/components/apple-ui-tokens";

export function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        bgcolor: appleDesign.colors.surfaceSubtle,
        border: `1px solid ${appleDesign.colors.border}`,
        borderRadius: "12px",
        p: 1.75,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: appleDesign.colors.textTertiary,
          fontWeight: 650,
          letterSpacing: "0.02em",
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: appleDesign.colors.textPrimary,
          fontWeight: 750,
          mt: 0.25,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}
