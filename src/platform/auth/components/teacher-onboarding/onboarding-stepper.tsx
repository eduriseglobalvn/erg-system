import Box from "@mui/material/Box";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import Step from "@mui/material/Step";
import StepConnector, { stepConnectorClasses } from "@mui/material/StepConnector";
import type { StepIconProps } from "@mui/material/StepIcon";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import { styled } from "@mui/material/styles";

import type { TeacherOnboardingStep } from "@/platform/auth/types/account-lifecycle";
import { stepLabels } from "@/platform/auth/components/teacher-onboarding/onboarding-helpers";

// Apple-style connector between stepper nodes
const AppleStepConnector = styled(StepConnector)(() => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 18,
    left: "calc(-50% + 20px)",
    right: "calc(50% + 20px)",
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: "rgba(0, 0, 0, 0.08)",
    borderTopWidth: 2,
    borderRadius: 1,
    transition: "border-color 300ms ease",
  },
  [`&.${stepConnectorClasses.completed} .${stepConnectorClasses.line}`]: {
    borderColor: "#34C759",
  },
  [`&.${stepConnectorClasses.active} .${stepConnectorClasses.line}`]: {
    borderColor: "#0071E3",
  },
}));

function AppleStepIcon(props: StepIconProps) {
  const { active, completed, icon } = props;

  if (completed) {
    return (
      <Box
        sx={{
          alignItems: "center",
          bgcolor: "#34C759",
          borderRadius: "50%",
          color: "#FFFFFF",
          display: "flex",
          height: 36,
          justifyContent: "center",
          width: 36,
          boxShadow: "0 2px 8px rgba(52, 199, 89, 0.3)",
          zIndex: 1,
        }}
      >
        <CheckCircleRoundedIcon sx={{ fontSize: 20 }} />
      </Box>
    );
  }

  if (active) {
    return (
      <Box
        sx={{
          alignItems: "center",
          bgcolor: "#0071E3",
          borderRadius: "50%",
          color: "#FFFFFF",
          display: "flex",
          fontWeight: 700,
          fontSize: 14,
          height: 36,
          justifyContent: "center",
          width: 36,
          boxShadow: "0 0 0 4px rgba(0, 113, 227, 0.18), 0 4px 12px rgba(0, 113, 227, 0.3)",
          zIndex: 1,
        }}
      >
        {icon}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        alignItems: "center",
        bgcolor: "#F2F2F7",
        border: "1.5px solid rgba(0, 0, 0, 0.1)",
        borderRadius: "50%",
        color: "#8E8E93",
        display: "flex",
        fontWeight: 650,
        fontSize: 13,
        height: 36,
        justifyContent: "center",
        width: 36,
        zIndex: 1,
      }}
    >
      {icon}
    </Box>
  );
}

export function OnboardingStepper({ activeStep, nextSteps }: { activeStep: number; nextSteps: TeacherOnboardingStep[] }) {
  return (
    <Box
      sx={{
        bgcolor: "rgba(245, 245, 247, 0.8)",
        border: "1px solid rgba(0, 0, 0, 0.05)",
        borderRadius: "18px",
        p: { xs: 1.5, sm: 2.25 },
      }}
    >
      <Stepper
        activeStep={activeStep}
        alternativeLabel
        connector={<AppleStepConnector />}
      >
        {Object.entries(stepLabels).map(([key, label]) => (
          <Step completed={!nextSteps.includes(key as TeacherOnboardingStep)} key={key}>
            <StepLabel
              slots={{ stepIcon: AppleStepIcon }}
              sx={{
                "& .MuiStepLabel-label": {
                  color: "#6E6E73",
                  fontSize: 12,
                  fontWeight: 650,
                  mt: 1,
                  "&.Mui-active": {
                    color: "#0071E3",
                    fontWeight: 750,
                  },
                  "&.Mui-completed": {
                    color: "#1D1D1F",
                    fontWeight: 650,
                  },
                },
              }}
            >
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}
