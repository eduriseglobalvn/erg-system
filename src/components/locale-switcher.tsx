import Box from "@mui/material/Box";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { useI18n, type Locale } from "@/platform/i18n";

const locales: Array<{
  value: Locale;
  labelKey: "locale.vietnamese" | "locale.english";
  ariaKey: "locale.switchToVietnamese" | "locale.switchToEnglish";
}> = [
  { value: "vi", labelKey: "locale.vietnamese", ariaKey: "locale.switchToVietnamese" },
  { value: "en", labelKey: "locale.english", ariaKey: "locale.switchToEnglish" },
];

export function LocaleSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, bgcolor: "background.paper", p: 1.5 }}>
      <Typography component="div" variant="caption" sx={{ color: "text.secondary", mb: 1 }}>
        {t("locale.language")}
      </Typography>
      <ToggleButtonGroup
        exclusive
        fullWidth
        size="small"
        value={locale}
        onChange={(_event, next: Locale | null) => {
          if (next) setLocale(next);
        }}
      >
        {locales.map((item) => (
          <ToggleButton key={item.value} value={item.value} aria-label={t(item.ariaKey)} sx={{ textTransform: "none" }}>
            {t(item.labelKey)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}
