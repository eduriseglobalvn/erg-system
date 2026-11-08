import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import EditDocumentIcon from "@mui/icons-material/EditDocument";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import WorkHistoryIcon from "@mui/icons-material/WorkHistory";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import Typography from "@mui/material/Typography";
import type { ComponentType } from "react";

import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import type { RequestType, RequestView } from "../../api/timekeeping-types";
import { IconTile, type TkTone } from "../punch/punch-card";
import { requestTimeText, requestTitle, STATUS_CHIP } from "./request-model";

/** Icon of each request type, shared by G06 rows, the G07 picker and the G10 header. */
export const REQUEST_ICON: Record<RequestType, ComponentType<SvgIconProps>> = {
  LEAVE: BeachAccessIcon,
  EXPLANATION: EditDocumentIcon,
  WFH: HomeWorkIcon,
  BUSINESS: WorkHistoryIcon,
};

const TILE_TONE: Record<NonNullable<RequestView["status"]>, TkTone> = { DRAFT: "neutral", PENDING: "info", APPROVED: "success", REJECTED: "error", CANCELLED: "neutral" };

/** One card of the G06 list: tinted type icon, title, time, status chip, then the note under it. */
export function RequestListItem({ request, onOpen }: { request: RequestView; onOpen: (id: string) => void }) {
  const statusKey = request.status ?? "PENDING";
  const status = STATUS_CHIP[statusKey];
  const Icon = REQUEST_ICON[request.type ?? "LEAVE"];
  return (
    <ButtonBase
      onClick={() => request.id && onOpen(request.id)}
      sx={{
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
        borderRadius: `${ergEnterpriseTokens.radius.card}px`,
        display: "grid",
        gap: 1,
        gridTemplateColumns: "minmax(0, 1fr)",
        justifyContent: "stretch",
        px: 2,
        py: 1.75,
        textAlign: "left",
        width: "100%",
        "&:hover": { bgcolor: "action.hover" },
      }}
    >
      <Box sx={{ alignItems: "center", display: "flex", gap: 1.5, minWidth: 0 }}>
        <IconTile small tone={TILE_TONE[statusKey]}><Icon /></IconTile>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography component="div" noWrap variant="subtitle2">{requestTitle(request)}</Typography>
          <Typography color="text.secondary" component="div" variant="caption">{requestTimeText(request)}</Typography>
        </Box>
        <ErgStatusChip label={status.label} tone={status.tone} />
      </Box>
      {request.note ? <Typography color="text.secondary" component="div" sx={{ overflowWrap: "anywhere", pl: 5.5 }} variant="body2">{request.note}</Typography> : null}
    </ButtonBase>
  );
}
