import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import Typography from "@mui/material/Typography";

import type { Timesheet } from "../api/timekeeping-types";
import { dayMonth } from "../components/my-timesheet/timesheet-summary";

type Stage = NonNullable<Timesheet["stage"]>;

// "Gửi tính lương" has no automatic step: it is the Excel export, available once the period is locked (API HRM is hidden).
const STEPS = ["Thu thập", "Rà soát", "Chốt & khoá", "Gửi tính lương"];
const ACTIVE: Record<Stage, number> = { COLLECT: 0, REVIEW: 1, LOCKED: 3 };

type PeriodStageStepperProps = {
  stage: Stage;
  reviewUntil?: string;
  issues?: Timesheet["issues"];
};

/** Period workflow. The text under "Rà soát" carries the open issues, so progress never relies on colour alone. */
export function PeriodStageStepper({ issues, reviewUntil, stage }: PeriodStageStepperProps) {
  const active = ACTIVE[stage];
  const review = [
    reviewUntil ? `đến ${dayMonth(reviewUntil)}` : "",
    stage === "LOCKED" ? "" : `${issues?.missingDays ?? 0} ngày thiếu chấm · ${issues?.pendingRequests ?? 0} đơn chưa duyệt`,
  ].filter(Boolean).join(" · ");
  const optional = [undefined, review, stage === "LOCKED" ? "Đã khoá" : undefined, "Excel"];
  return (
    <Stepper activeStep={active} alternativeLabel aria-label="Tiến trình chốt công" sx={{ py: 1 }}>
      {STEPS.map((label, index) => (
        <Step completed={index < active} key={label}>
          <StepLabel optional={optional[index] ? <Typography color="text.secondary" variant="caption">{optional[index]}</Typography> : undefined}>{label}</StepLabel>
        </Step>
      ))}
    </Stepper>
  );
}
