import { useState } from "react";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Box from "@mui/material/Box";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import Typography from "@mui/material/Typography";
import { toast } from "sonner";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgConfirmDialog } from "@/components/erg-mui/erg-confirm-dialog";
import { ErgTextField } from "@/components/erg-mui/erg-form";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";
import type { MyTeachingMonth } from "../../api/timekeeping-teaching-api";
import { useMyTeachingActions } from "../api/teaching-hours-query";
import { dayMonthVi, teachingErrorText, type MyMonthState } from "../domain/teaching-model";

const ACTIVE_STEP: Record<MyMonthState, number> = { COLLECTING: 0, AWAITING: 1, ISSUE: 1, CONFIRMED: 2, CLOSED: 3 };

type Props = { data: MyTeachingMonth; month: string; state: MyMonthState };

/** «Xác nhận bảng công»: three steps (no approval step), the confirmation sentence and the two actions. */
export function MyTeachingConfirmCard({ data, month, state }: Props) {
  const { confirm, issue } = useMyTeachingActions(month);
  const [issueOpen, setIssueOpen] = useState(false);
  const [note, setNote] = useState("");
  const [agreed, setAgreed] = useState(false);
  const total = data.total ?? 0;
  const assistant = data.assistantTotal ?? 0;
  const label = `${month.slice(5)}/${month.slice(0, 4)}`;
  const amount = assistant > 0 ? `${total} tiết giáo viên và ${assistant} tiết trợ giảng` : `${total} tiết`;
  const open = state === "AWAITING" || state === "ISSUE";
  const onError = (error: unknown) => toast.error(teachingErrorText(error));

  const closeIssue = () => {
    setIssueOpen(false);
    setNote("");
  };
  const sendIssue = () => issue.mutate(note.trim(), { onError, onSuccess: () => { closeIssue(); toast.success("Đã gửi báo sai sót"); } });

  return (
    <Box component="section" sx={{ border: 1, borderColor: "divider", borderRadius: `${t.radius.card}px`, display: "grid", gap: 2, p: 2 }}>
      <Typography component="h2" variant="subtitle1">Xác nhận bảng công</Typography>
      <Stepper activeStep={ACTIVE_STEP[state]} orientation="vertical" sx={{ display: { xs: "none", md: "flex" } }}>
        <Step><StepLabel>Hệ thống tính</StepLabel></Step>
        <Step><StepLabel>Bạn xác nhận · hạn {dayMonthVi(data.deadline)}</StepLabel></Step>
        <Step><StepLabel>HR chốt, gửi tính lương</StepLabel></Step>
      </Stepper>
      {open ? (
        <>
          <FormControlLabel control={<Checkbox checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />} label={`Tôi xác nhận số tiết tháng ${label} là ${amount}, đúng với thực tế giảng dạy.`} />
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            <ErgButton
              disabled={!agreed}
              loading={confirm.isPending}
              onClick={() => confirm.mutate({ total, assistantTotal: assistant, expectedVersion: data.confirmation?.version ?? 0 }, { onError, onSuccess: () => toast.success("Đã xác nhận bảng công") })}
              variant="contained"
            >
              Xác nhận bảng công
            </ErgButton>
            <ErgButton onClick={() => setIssueOpen(true)} variant="outlined">Báo sai sót</ErgButton>
          </Box>
        </>
      ) : (
        <Typography color="text.secondary" variant="body2">
          {state === "COLLECTING" ? "Bạn xác nhận được sau khi tháng kết thúc." : state === "CONFIRMED" ? `Bạn đã xác nhận ${amount}.` : "Tháng đã chốt, không sửa được."}
        </Typography>
      )}
      <ErgConfirmDialog
        confirmDisabled={!note.trim()}
        confirmLabel="Gửi báo sai sót"
        description="Trưởng phòng đào tạo sẽ sửa lịch nếu số tiết sai. Bạn không sửa số tay."
        loading={issue.isPending}
        onCancel={closeIssue}
        onConfirm={sendIssue}
        open={issueOpen}
        title="Báo sai sót"
      >
        <ErgTextField fullWidth label="Ghi chú (bắt buộc)" minRows={3} multiline onChange={(event) => setNote(event.target.value)} required slotProps={{ htmlInput: { maxLength: 1000 } }} sx={{ mt: 2 }} value={note} />
      </ErgConfirmDialog>
    </Box>
  );
}
