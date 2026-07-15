import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import Box from "@mui/material/Box";

type SchoolFlowStepIconProps = {
  active: boolean;
  completed: boolean;
  stepNumber: number;
};

export function SchoolFlowStepIcon({ active, completed, stepNumber }: SchoolFlowStepIconProps) {
  return (
    <Box
      aria-hidden="true"
      sx={{
        alignItems: "center",
        bgcolor: active ? "primary.main" : completed ? "success.main" : "background.paper",
        border: "1px solid",
        borderColor: active ? "primary.main" : completed ? "success.main" : "divider",
        borderRadius: "50%",
        color: active ? "primary.contrastText" : completed ? "success.contrastText" : "text.secondary",
        display: "flex",
        flex: "0 0 auto",
        fontSize: 11,
        fontWeight: 900,
        height: 22,
        justifyContent: "center",
        transition: (theme) => theme.transitions.create(["background-color", "border-color", "color"]),
        width: 22,
      }}
    >
      {completed && !active ? <CheckRoundedIcon sx={{ fontSize: 15 }} /> : stepNumber}
    </Box>
  );
}
