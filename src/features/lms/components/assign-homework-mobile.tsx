import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SendIcon from "@mui/icons-material/Send";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { ErgButton, ErgIconButton } from "@/components/erg-mui/erg-actions";
import { ergMobileDockAnchor } from "@/components/portal/erg-mobile-dock";
import { countAssignRecipients } from "@/features/lms/components/assign-homework-mobile/count-assign-recipients";
import { ResourceSection } from "@/features/lms/components/assign-homework-mobile/resource-section";
import { OptionsSection, ScheduleSection } from "@/features/lms/components/assign-homework-mobile/schedule-options-sections";
import { TargetSection } from "@/features/lms/components/assign-homework-mobile/target-section";
import type { AssignHomeworkController } from "@/features/lms/components/use-assign-homework-controller";

/** Footer bar: 12px + 52px button + 12px, plus one caption line for the reason it is disabled. */
const FOOTER_RESERVE = 112;

/** Phone "Giao bài" (canvas N8): one scrolling form on the wizard's controller, sticky send bar above the dock. */
export function AssignHomeworkMobile({ model }: { model: AssignHomeworkController }) {
  const recipientCount = countAssignRecipients(model);
  const message = model.validationError || model.formError;

  return (
    <Box sx={{ bgcolor: "background.default", color: "text.primary", minWidth: 0, overflowX: "hidden" }}>
      <Box sx={{ alignItems: "center", display: "flex", gap: 1, minHeight: 60, pb: 1, pt: 1.5, px: 1 }}>
        <ErgIconButton label="Quay lại" onClick={model.onBack}><ArrowBackIcon /></ErgIconButton>
        <Typography component="h1" noWrap sx={{ flex: 1, minWidth: 0 }} variant="h4">Giao bài tập</Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pb: `${FOOTER_RESERVE}px`, pt: 0.5, px: 2 }}>
        <ResourceSection model={model} />
        <TargetSection model={model} />
        <ScheduleSection model={model} />
        <OptionsSection model={model} />
      </Box>

      <Box
        sx={{
          bgcolor: "background.paper",
          borderColor: "divider",
          borderTop: 1,
          bottom: ergMobileDockAnchor(8),
          left: 0,
          position: "fixed",
          pb: 1.5,
          pt: 1.5,
          px: 2,
          right: 0,
          zIndex: (theme) => theme.zIndex.appBar + 1,
        }}
      >
        {message ? (
          <Typography
            color={model.validationError ? "error" : "text.secondary"}
            component="p"
            id="assign-mobile-footer-reason"
            role={model.validationError ? "alert" : undefined}
            sx={{ mb: 1 }}
            variant="caption"
          >
            {message}
          </Typography>
        ) : null}
        <ErgButton
          aria-describedby={message ? "assign-mobile-footer-reason" : undefined}
          disabled={Boolean(model.formError)}
          fullWidth
          loading={model.isSubmitting}
          onClick={() => void model.handleFinish()}
          size="large"
          startIcon={<SendIcon />}
          variant="contained"
        >
          {`Giao cho ${recipientCount} học sinh`}
        </ErgButton>
      </Box>
    </Box>
  );
}
