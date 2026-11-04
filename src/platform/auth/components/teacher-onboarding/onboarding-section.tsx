import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

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
      <Box sx={{ borderBottom: "1px solid rgba(0, 0, 0, 0.06)", pb: 1.5 }}>
        <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
          {icon}
          <Typography component="h2" sx={{ color: "#1D1D1F", fontSize: 17, fontWeight: 750 }}>
            {title}
          </Typography>
        </Box>
        <Typography sx={{ color: "#6E6E73", fontSize: 13, mt: 0.5 }}>
          {description}
        </Typography>
      </Box>
      {children}
    </Stack>
  );
}
