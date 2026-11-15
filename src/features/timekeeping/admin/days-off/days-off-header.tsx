import AddIcon from "@mui/icons-material/Add";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { useNavigate } from "@tanstack/react-router";

import { ErgButton, ErgIconButton } from "@/components/erg-mui/erg-actions";
import { adminPath } from "@/platform/workspaces/workspace-paths";
import { monthTitle } from "./days-off-model";
import type { DaysOffState } from "./use-days-off";

/** «← Lịch giảng dạy» + h1 + month switch; the two actions are desktop only (the phone has a FAB and a link at the end). */
export function DaysOffHeader({ actions, state }: { actions: boolean; state: DaysOffState }) {
  const navigate = useNavigate();
  return (
    <Box component="header" sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1.25 }}>
      <Link component="button" onClick={() => void navigate({ href: adminPath("/calendar") })} type="button" underline="hover" variant="body2">← Lịch giảng dạy</Link>
      <Typography component="h1" sx={{ mx: 1, width: { xs: "100%", md: "auto" } }} variant="h5">Ngày nghỉ &amp; thứ 7</Typography>
      <Box sx={{ alignItems: "center", display: "flex", gap: 0.5 }}>
        <ErgIconButton label="Tháng trước" onClick={state.prev}><ChevronLeftIcon /></ErgIconButton>
        <ErgIconButton label="Tháng sau" onClick={state.next}><ChevronRightIcon /></ErgIconButton>
        <Typography component="span" variant="h6">{monthTitle(state.month)}</Typography>
      </Box>
      {actions ? (
        <Box sx={{ display: "flex", gap: 1, ml: "auto" }}>
          <ErgButton disabled={state.failed} onClick={state.openImport} variant="outlined">{`Nhập lịch nghỉ lễ năm ${state.importYear}`}</ErgButton>
          <ErgButton disabled={state.failed} onClick={() => state.openAdd(state.today.startsWith(state.month) ? state.today : `${state.month}-01`)} startIcon={<AddIcon />} variant="contained">Thêm ngày nghỉ</ErgButton>
        </Box>
      ) : null}
    </Box>
  );
}
