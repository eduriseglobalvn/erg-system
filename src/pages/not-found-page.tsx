import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

import { Link } from "@tanstack/react-router";

import { useI18n } from "@/platform/i18n";

export function NotFoundPage() {
  const { t } = useI18n();

  return (
    <Box component="main" sx={{ display: "grid", minHeight: "100vh", p: { xs: 2, sm: 3, lg: 4 }, placeItems: "center" }}>
      <Paper component="section" elevation={0} sx={{ border: "1px solid", borderColor: "divider", maxWidth: 576, p: { xs: 3, sm: 4 }, width: "100%" }}>
        <Typography component="p" color="text.secondary" variant="caption">
          404
        </Typography>
        <Typography component="h1" sx={{ mt: 1 }} variant="h1">
          {t("notFound.title")}
        </Typography>
        <Typography component="p" color="text.secondary" sx={{ mt: 1.5 }} variant="body1">
          {t("notFound.description")}
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mt: 3 }}>
          <Button component={Link} sx={{ minHeight: 40, px: 2 }} to="/" variant="contained">
            {t("notFound.backHome")}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
