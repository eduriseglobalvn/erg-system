import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { useNavigate } from "@tanstack/react-router";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { adminPath } from "@/platform/workspaces/workspace-paths";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { monthTitle } from "./days-off-model";
import type { DaysOffState } from "./use-days-off";

const t = ergEnterpriseTokens;
const arrowSx = { borderRadius: `${t.radius.chip}px`, color: t.color.textSecondary, height: 36, width: 36 } as const;
const buttonSx = { height: 36, minHeight: 36 } as const;

/** Board header: «← Lịch giảng dạy», h1 24/600, 36 px month arrows, month 18/500 and the two actions (desktop). The phone variant is the 20/600 title between the arrows. */
export function DaysOffHeader({ actions, mobile = false, state }: { actions: boolean; mobile?: boolean; state: DaysOffState }) {
  const navigate = useNavigate();
  const back = (
    <Link component="button" onClick={() => void navigate({ href: adminPath("/calendar") })} sx={{ fontSize: "0.8125rem" }} type="button" underline="none">← Lịch giảng dạy</Link>
  );
  const prev = <ButtonBase aria-label="Tháng trước" onClick={state.prev} sx={arrowSx}><ChevronLeftIcon /></ButtonBase>;
  const next = <ButtonBase aria-label="Tháng sau" onClick={state.next} sx={arrowSx}><ChevronRightIcon /></ButtonBase>;
  if (mobile) {
    return (
      <Box component="header" sx={{ display: "grid", gap: 1.5 }}>
        {back}
        <Box sx={{ alignItems: "center", display: "flex", gap: 0.5 }}>
          <Typography component="h1" sx={{ flex: 1, fontSize: "1.25rem" }} variant="h1">Ngày nghỉ &amp; thứ 7</Typography>
          {prev}
          <Typography component="span" sx={{ fontWeight: "fontWeightMedium", whiteSpace: "nowrap" }} variant="body2">{monthTitle(state.month)}</Typography>
          {next}
        </Box>
      </Box>
    );
  }
  return (
    <Box component="header" sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: "10px" }}>
      {back}
      <Typography component="h1" sx={{ mx: 1 }} variant="h1">Ngày nghỉ &amp; thứ 7</Typography>
      {prev}
      {next}
      <Typography component="span" sx={{ fontSize: "1.125rem", fontWeight: "fontWeightMedium" }}>{monthTitle(state.month)}</Typography>
      {actions ? (
        <Box sx={{ display: "flex", gap: 1, ml: "auto" }}>
          <ErgButton disabled={state.failed} onClick={state.openImport} sx={{ ...buttonSx, bgcolor: t.color.surface, fontWeight: "fontWeightRegular", px: "14px" }} variant="outlined">{`Nhập lịch nghỉ lễ năm ${state.importYear}`}</ErgButton>
          <ErgButton aria-label="Thêm ngày nghỉ" disabled={state.failed} onClick={() => state.openAdd(state.today.startsWith(state.month) ? state.today : `${state.month}-01`)} sx={{ ...buttonSx, px: 2 }} variant="contained">+ Thêm ngày nghỉ</ErgButton>
        </Box>
      ) : null}
    </Box>
  );
}
