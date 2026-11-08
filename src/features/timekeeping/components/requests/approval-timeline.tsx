import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import type { RequestView } from "../../api/timekeeping-types";
import { timelineSteps, type TimelineStep } from "./request-model";

const STATE_TEXT: Record<TimelineStep["state"], string> = { done: "Đã xong", current: "Đang chờ", todo: "Chưa tới", rejected: "Bị từ chối" };
const { statusTint, size } = ergEnterpriseTokens;
// Canvas `.tdot`: 28px tinted circle with an icon per state.
const DOT: Record<TimelineStep["state"], { tint: (typeof statusTint)[keyof typeof statusTint]; icon: ReactNode }> = {
  done: { tint: statusTint.success, icon: <CheckIcon /> },
  current: { tint: statusTint.info, icon: <HourglassTopIcon /> },
  todo: { tint: statusTint.neutral, icon: <MoreHorizIcon /> },
  rejected: { tint: statusTint.error, icon: <CloseIcon /> },
};

/** "Luồng duyệt": an ordered list, each step with its state spelled out for screen readers. */
export function ApprovalTimeline({ request }: { request: RequestView }) {
  const steps = timelineSteps(request);
  return (
    <Box aria-label="Luồng duyệt" component="ol" sx={{ listStyle: "none", m: 0, p: 0 }}>
      {steps.map((step, index) => {
        const dot = DOT[step.state];
        const last = index === steps.length - 1;
        return (
          <Box component="li" data-state={step.state} key={index} sx={{ display: "flex", gap: 1.5, pb: last ? 0 : 2.25, position: "relative" }}>
            {last ? null : <Box aria-hidden sx={{ bgcolor: "divider", bottom: 0, left: 13, position: "absolute", top: 28, width: 2 }} />}
            <Box aria-hidden sx={{ alignItems: "center", bgcolor: dot.tint.bg, borderRadius: "50%", color: dot.tint.dot, display: "flex", flexShrink: 0, height: 28, justifyContent: "center", width: 28, zIndex: 1, "& svg": { fontSize: size.iconSm } }}>
              {dot.icon}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography color={step.state === "todo" ? "text.secondary" : "text.primary"} component="div" variant="subtitle2">
                {step.title}
                <Box component="span" sx={{ clipPath: "inset(50%)", height: "1px", overflow: "hidden", position: "absolute", whiteSpace: "nowrap", width: "1px" }}>{` (${STATE_TEXT[step.state]})`}</Box>
              </Typography>
              {step.meta ? <Typography color="text.secondary" component="div" variant="caption">{step.meta}</Typography> : null}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
