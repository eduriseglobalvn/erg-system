import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import WifiOffRoundedIcon from "@mui/icons-material/WifiOffRounded";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

const { radius, size } = ergEnterpriseTokens;

/** "Lớp 7A" → "7A": the short class code shown in the scope avatar. */
function classCode(className: string) {
  return className.replace(/^lớp\s+/i, "").trim().slice(0, 3) || "Lớp";
}

/** Design N1: one full-width scope pill; the account lives in the dock, so no logo tile or avatar here. */
export function LmsMobileTopBar({
  canInstall, selectedClassName, installed, online, schoolName,
  updateAvailable, onInstall, onScopeOpen, onUpdate,
}: {
  activeLabel: string; canInstall: boolean; selectedClassName: string; installed: boolean;
  online: boolean; schoolName: string;
  updateAvailable: boolean; onInstall: () => void;
  onScopeOpen: () => void; onUpdate: () => void;
}) {
  const iconButtonSx = { bgcolor: "background.paper", border: "1px solid", borderColor: "divider", height: 44, width: 44 };

  return (
    <Box component="header" data-testid="lms-mobile-header" sx={{ bgcolor: "background.default", display: { xs: "block", xl: "none" }, flexShrink: 0, pb: 1, pt: "calc(env(safe-area-inset-top, 0px) + 8px)", px: 2, position: "sticky", top: 0, zIndex: (theme) => theme.zIndex.appBar }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <ButtonBase aria-label={`Chọn lớp, đang chọn ${selectedClassName || "Lớp học"}`} onClick={onScopeOpen} sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: `${radius.chip}px`, flex: 1, gap: 1.25, height: 48, justifyContent: "flex-start", minWidth: 0, pl: 0.75, pr: 1.5, textAlign: "left" }}>
          <Box sx={{ alignItems: "center", bgcolor: "primary.main", borderRadius: "50%", color: "primary.contrastText", display: "flex", flexShrink: 0, height: 36, justifyContent: "center", typography: "caption", fontWeight: "fontWeightBold", width: 36 }}>
            {classCode(selectedClassName)}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography noWrap variant="subtitle2">{selectedClassName || "Lớp học"}</Typography>
            <Typography color="text.secondary" noWrap variant="caption" component="div">{schoolName}</Typography>
          </Box>
          <ExpandMoreRoundedIcon sx={{ color: "text.secondary", flexShrink: 0, fontSize: size.iconMd }} />
        </ButtonBase>

        {updateAvailable ? <IconButton aria-label="Cập nhật ứng dụng" onClick={onUpdate} sx={iconButtonSx}><RefreshRoundedIcon sx={{ fontSize: size.iconMd }} /></IconButton> : null}
        {canInstall && !installed ? <IconButton aria-label="Cài LMS PWA" onClick={onInstall} sx={iconButtonSx}><DownloadRoundedIcon sx={{ fontSize: size.iconMd }} /></IconButton> : null}
        {!online ? <Box aria-label="Đang offline" role="img" sx={{ alignItems: "center", bgcolor: "warning.light", borderRadius: "50%", color: "warning.dark", display: "flex", flexShrink: 0, height: 40, justifyContent: "center", width: 40 }}><WifiOffRoundedIcon sx={{ fontSize: size.iconMd }} /></Box> : null}
      </Stack>
    </Box>
  );
}
