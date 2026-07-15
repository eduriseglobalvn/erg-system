import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

import { Link } from "@/routes/router-compat";

import { useI18n } from "@/platform/i18n";

export function NotFoundPage() {
  const { t } = useI18n();

  return (
    <Box component="main" sx={{ display: "grid", minHeight: "100vh", p: { xs: 2, sm: 3, lg: 4 }, placeItems: "center" }}>
      <Paper component="section" elevation={1} sx={{ border: "1px solid", borderColor: "divider", maxWidth: 576, p: { xs: 3, sm: 4 }, width: "100%" }}>
        <Typography component="p" sx={{ bgcolor: "rgba(204,0,34,0.06)", borderRadius: 1, color: "error.main", display: "inline-flex", fontSize: 12, fontWeight: 700, px: 1.5, py: 0.75 }}>
          404
        </Typography>
        <Typography component="h1" sx={{ color: "text.primary", fontSize: 24, fontWeight: 700, lineHeight: 1.25, mt: 2 }}>
          {t("notFound.title")}
        </Typography>
        <Typography component="p" color="text.secondary" sx={{ fontSize: 14, lineHeight: 1.5, mt: 1.5 }}>
          {t("notFound.description")}
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mt: 3 }}>
          <Button component={Link} color="error" sx={{ minHeight: 40, px: 2 }} to="/" variant="contained">
            {t("notFound.backHome")}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
