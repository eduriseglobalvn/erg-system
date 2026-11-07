import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import HomeWorkOutlinedIcon from "@mui/icons-material/HomeWorkOutlined";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import type { ReactElement } from "react";

import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import type { RequestType, RequestView } from "../../api/timekeeping-types";
import { requestTimeText, requestTitle, STATUS_CHIP } from "./request-model";

const ICON: Record<RequestType, ReactElement> = {
  LEAVE: <EventBusyOutlinedIcon />,
  EXPLANATION: <FactCheckOutlinedIcon />,
  WFH: <HomeWorkOutlinedIcon />,
  BUSINESS: <BusinessCenterOutlinedIcon />,
};

/** One row of the G06 list: type icon, title, time, status chip and the note. */
export function RequestListItem({ request, onOpen }: { request: RequestView; onOpen: (id: string) => void }) {
  const status = STATUS_CHIP[request.status ?? "PENDING"];
  return (
    <ButtonBase
      onClick={() => request.id && onOpen(request.id)}
      sx={{
        alignItems: "flex-start",
        border: 1,
        borderColor: "divider",
        borderRadius: `${ergEnterpriseTokens.radius.card}px`,
        display: "flex",
        gap: 1.5,
        p: 2,
        textAlign: "left",
        width: "100%",
        "&:hover": { bgcolor: "action.hover" },
      }}
    >
      <Box sx={{ color: "primary.main", display: "flex", pt: 0.25 }}>{ICON[request.type ?? "LEAVE"]}</Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography component="div" variant="subtitle2">{requestTitle(request)}</Typography>
        <Typography color="text.secondary" component="div" variant="body2">{requestTimeText(request)}</Typography>
        {request.note ? <Typography color="text.secondary" component="div" noWrap variant="caption">{request.note}</Typography> : null}
      </Box>
      <ErgStatusChip label={status.label} tone={status.tone} />
    </ButtonBase>
  );
}
