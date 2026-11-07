import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import type { RequestView } from "../../api/timekeeping-types";
import { timelineSteps, type TimelineStep } from "./request-model";

const STATE_TEXT: Record<TimelineStep["state"], string> = { done: "Đã xong", current: "Đang chờ", todo: "Chưa tới", rejected: "Bị từ chối" };
const DOT: Record<TimelineStep["state"], string> = {
  done: ergEnterpriseTokens.statusTint.success.dot,
  current: ergEnterpriseTokens.statusTint.warning.dot,
  todo: ergEnterpriseTokens.statusTint.neutral.dot,
  rejected: ergEnterpriseTokens.statusTint.error.dot,
};

/** "Luồng duyệt": an ordered list, each step with its state spelled out for screen readers. */
export function ApprovalTimeline({ request }: { request: RequestView }) {
  const steps = timelineSteps(request);
  return (
    <Box aria-label="Luồng duyệt" component="ol" sx={{ listStyle: "none", m: 0, p: 0 }}>
      {steps.map((step, index) => (
        <Box component="li" data-state={step.state} key={index} sx={{ display: "flex", gap: 1.5, pb: index === steps.length - 1 ? 0 : 2 }}>
          <Box aria-hidden sx={{ alignItems: "center", display: "flex", flexDirection: "column" }}>
            <Box sx={{ bgcolor: DOT[step.state], borderRadius: "50%", flexShrink: 0, height: 10, mt: 0.75, width: 10 }} />
            {index === steps.length - 1 ? null : <Box sx={{ bgcolor: "divider", flex: 1, mt: 0.5, width: "1px" }} />}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography component="div" variant="subtitle2">
              {step.title}
              <Box component="span" sx={{ clipPath: "inset(50%)", height: 1, overflow: "hidden", position: "absolute", width: 1 }}>{` (${STATE_TEXT[step.state]})`}</Box>
            </Typography>
            {step.meta ? <Typography color="text.secondary" component="div" variant="caption">{step.meta}</Typography> : null}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
