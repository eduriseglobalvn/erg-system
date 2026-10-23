import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import { getCurrentAccount } from "@/platform/auth";
import { useI18n } from "@/platform/i18n";

export function DashboardAccountCard() {
  const { t } = useI18n();
  const account = getCurrentAccount();

  const displayName = account?.fullName ?? "Nguyen Ngoc Anh";
  const displayEmail = account?.email ?? "ngocanh@erg.vn";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((item) => item[0])
    .join("")
    .toUpperCase();

  return (
    <Box sx={{ pb: 2, pt: 1.5, px: 2 }}>
      <Stack spacing={0.5} sx={{ pb: 2 }}>
        {[
          { label: t("common.settings"), icon: <SettingsRoundedIcon /> },
          { label: t("dashboard.getHelp"), icon: <HelpOutlineRoundedIcon /> },
          { label: t("common.search"), icon: <SearchRoundedIcon /> },
        ].map((item) => (
          <ButtonBase
            key={item.label}
            type="button"
            sx={{
              borderRadius: 2,
              color: "text.primary",
              display: "flex",
              fontSize: 15,
              fontWeight: 600,
              gap: 1.5,
              justifyContent: "flex-start",
              minHeight: 40,
              px: 1.5,
              textAlign: "left",
              width: "100%",
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            <Box sx={{ color: "text.secondary", display: "flex", "& .MuiSvgIcon-root": { fontSize: 19 } }}>
              {item.icon}
            </Box>
            <span>{item.label}</span>
          </ButtonBase>
        ))}
      </Stack>

      <Box
        aria-label={`Tài khoản của ${displayName}`}
        sx={{
          alignItems: "center",
          borderRadius: 2,
          display: "flex",
          gap: 1.5,
          px: 1.5,
          py: 1.5,
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        <Avatar
          src={account?.avatarUrl}
          alt={displayName}
          variant="rounded"
          sx={{ width: 44, height: 44, bgcolor: "primary.main", fontSize: 12, fontWeight: 700, color: "primary.contrastText" }}
        >
          {initials}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography noWrap sx={{ fontSize: 15, fontWeight: 700 }}>
            {displayName}
          </Typography>
          <Typography color="text.secondary" noWrap variant="body2">
            {displayEmail}
          </Typography>
        </Box>
        <MoreHorizRoundedIcon aria-hidden="true" sx={{ color: "text.secondary", fontSize: 20 }} />
      </Box>
    </Box>
  );
}
