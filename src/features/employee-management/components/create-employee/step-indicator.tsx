import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { appleDesign } from "@/features/employee-management/components/apple-ui-tokens";
import { steps } from "@/features/employee-management/components/create-employee/constants";

export function StepIndicator({ setStep, step }: { setStep: (step: number) => void; step: number }) {
  return (
    <Box
      sx={{
        bgcolor: "rgba(0, 0, 0, 0.03)",
        borderRadius: "12px",
        display: "flex",
        gap: 0.5,
        mb: 3,
        overflowX: "auto",
        p: 0.6,
      }}
    >
      {steps.map((label, idx) => {
        const isActive = idx === step;
        const isCompleted = idx < step;
        return (
          <Box
            key={label}
            onClick={() => {
              if (idx < step) setStep(idx);
            }}
            sx={{
              alignItems: "center",
              bgcolor: isActive ? "#FFFFFF" : "transparent",
              borderRadius: "8px",
              boxShadow: isActive ? "0 2px 8px rgba(0, 0, 0, 0.06)" : "none",
              cursor: isCompleted ? "pointer" : "default",
              display: "flex",
              flex: 1,
              gap: 0.75,
              justifyContent: "center",
              minWidth: 0,
              px: 1,
              py: 0.85,
              transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <Box
              sx={{
                alignItems: "center",
                bgcolor: isActive
                  ? appleDesign.colors.blue
                  : isCompleted
                    ? appleDesign.colors.green
                    : "rgba(0, 0, 0, 0.08)",
                borderRadius: "50%",
                color: isActive || isCompleted ? "#FFFFFF" : appleDesign.colors.textTertiary,
                display: "flex",
                flexShrink: 0,
                fontSize: "0.7rem",
                fontWeight: 600,
                height: 20,
                justifyContent: "center",
                width: 20,
              }}
            >
              {isCompleted ? "✓" : idx + 1}
            </Box>
            <Typography
              sx={{
                color: isActive
                  ? appleDesign.colors.textPrimary
                  : isCompleted
                    ? appleDesign.colors.greenText
                    : appleDesign.colors.textTertiary,
                display: { sm: "block", xs: isActive ? "block" : "none" },
                fontSize: "0.76rem",
                fontWeight: isActive ? 700 : 550,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
