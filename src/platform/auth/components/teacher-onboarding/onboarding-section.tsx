import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

export function OnboardingSection({
  children,
  description,
  icon,
  title,
}: {
  children: React.ReactNode;
  description: string;
  icon?: React.ReactNode;
  title: string;
}) {
  return (
    <Stack spacing={2.25}>
      <Box sx={{ borderBottom: `1px solid ${ergEnterpriseTokens.color.border}`, pb: 1.5 }}>
        <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
          {icon}
          <Typography component="h2" sx={{ color: "text.primary", fontSize: 17, fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>
        <Typography sx={{ color: "text.secondary", fontSize: 13, mt: 0.5 }}>
          {description}
        </Typography>
      </Box>
      {children}
    </Stack>
  );
}
