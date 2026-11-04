import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import DialogActions from "@mui/material/DialogActions";

import { appleDesign } from "@/features/employee-management/components/apple-ui-tokens";
import { steps } from "@/features/employee-management/components/create-employee/constants";

export function WizardActions({
  isPending,
  onClose,
  onSubmit,
  oneTimePassword,
  setStep,
  step,
  valid,
}: {
  isPending: boolean;
  onClose: () => void;
  onSubmit: () => void;
  oneTimePassword: string | undefined;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  step: number;
  valid: boolean;
}) {
  return (
    <DialogActions
      sx={{
        borderTop: `1px solid ${appleDesign.colors.border}`,
        px: { sm: 3, xs: 2.5 },
        py: 2,
      }}
    >
      {oneTimePassword ? (
        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            bgcolor: `${appleDesign.colors.blue} !important`,
            borderRadius: "10px",
            boxShadow: appleDesign.shadows.button,
            fontWeight: 650,
            textTransform: "none",
            "&:hover": { bgcolor: `${appleDesign.colors.blueHover} !important` },
          }}
        >
          Đã lưu credential an toàn
        </Button>
      ) : (
        <>
          <Button
            variant="text"
            onClick={() => setStep((value) => Math.max(0, value - 1))}
            disabled={step === 0}
            sx={{
              borderRadius: "10px",
              color: `${appleDesign.colors.textSecondary} !important`,
              fontWeight: 650,
              px: 2,
              textTransform: "none",
              "&:hover": {
                bgcolor: "rgba(0, 0, 0, 0.04) !important",
                color: `${appleDesign.colors.textPrimary} !important`,
              },
              "&.Mui-disabled": {
                color: "rgba(0, 0, 0, 0.25) !important",
              },
            }}
          >
            Quay lại
          </Button>
          {step < steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={() => setStep((value) => value + 1)}
              disabled={!valid}
              sx={{
                bgcolor: `${appleDesign.colors.blue} !important`,
                borderRadius: "10px",
                boxShadow: appleDesign.shadows.button,
                color: "#FFFFFF !important",
                fontWeight: 650,
                px: 2.5,
                textTransform: "none",
                "&:hover": { bgcolor: `${appleDesign.colors.blueHover} !important` },
                "&.Mui-disabled": {
                  bgcolor: "rgba(0, 0, 0, 0.12) !important",
                  boxShadow: "none",
                  color: "rgba(0, 0, 0, 0.35) !important",
                },
              }}
            >
              Tiếp tục
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={() => onSubmit()}
              disabled={isPending || !valid}
              startIcon={isPending ? <CircularProgress size={16} sx={{ color: "#FFFFFF" }} /> : undefined}
              sx={{
                bgcolor: `${appleDesign.colors.blue} !important`,
                borderRadius: "10px",
                boxShadow: appleDesign.shadows.button,
                color: "#FFFFFF !important",
                fontWeight: 650,
                px: 2.5,
                textTransform: "none",
                "&:hover": { bgcolor: `${appleDesign.colors.blueHover} !important` },
                "&.Mui-disabled": {
                  bgcolor: "rgba(0, 0, 0, 0.12) !important",
                  boxShadow: "none",
                  color: "rgba(0, 0, 0, 0.35) !important",
                },
              }}
            >
              {isPending ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
            </Button>
          )}
        </>
      )}
    </DialogActions>
  );
}
