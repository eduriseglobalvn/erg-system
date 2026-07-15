import { SparkleIcon } from "@/platform/auth/components/auth-icons";
import { useI18n } from "@/platform/i18n";

export function AuthHeroPanel() {
  const { t } = useI18n();

  const authHighlights = [
    t("auth.highlight1"),
    t("auth.highlight2"),
    t("auth.highlight3"),
  ];

  return (
    <Box sx={{ bgcolor: "primary.main", color: "primary.contrastText", overflow: "hidden", p: { xs: 3, sm: 3.5, lg: 4 }, position: "relative" }}>
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
        <Box component="span" sx={{ alignItems: "center", bgcolor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 1, boxShadow: 1, color: "rgba(255,255,255,0.9)", display: "inline-flex", fontSize: 12, fontWeight: 700, gap: 1, px: 1.5, py: 1, width: "fit-content" }}>
          <SparkleIcon />
          {t("auth.heroBadge")}
        </Box>

        <Box sx={{ maxWidth: 520, mt: 3.5 }}>
          <Box component="h1" sx={{ fontSize: 20, fontWeight: 700, lineHeight: 1.25, m: 0 }}>
            {t("auth.heroTitle")}
          </Box>
          <Box component="p" sx={{ color: "rgba(255,255,255,0.8)", fontSize: 14, lineHeight: 1.5, m: 0, maxWidth: 480, mt: 1.5 }}>
            {t("auth.heroSubtitle")}
          </Box>
        </Box>

        <Box sx={{ display: "grid", gap: 1.25, mt: 3.5 }}>
          {authHighlights.map((item) => (
            <Box
              key={item}
              sx={{ alignItems: "flex-start", bgcolor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 1, boxShadow: 1, display: "flex", gap: 1.5, px: 1.75, py: 1.25 }}
            >
              <Box component="span" sx={{ bgcolor: "rgba(255,255,255,0.95)", borderRadius: "50%", boxShadow: 1, height: 10, mt: 0.5, width: 10 }} />
              <Box component="p" sx={{ color: "rgba(255,255,255,0.88)", fontSize: 14, lineHeight: 1.5, m: 0 }}>{item}</Box>
            </Box>
          ))}
        </Box>

      </Box>
    </Box>
  );
}
import Box from "@mui/material/Box";
