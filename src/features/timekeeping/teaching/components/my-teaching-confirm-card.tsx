import { useState } from "react";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import { toast } from "sonner";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgConfirmDialog } from "@/components/erg-mui/erg-confirm-dialog";
import { ErgTextField } from "@/components/erg-mui/erg-form";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";
import type { MyTeachingMonth } from "../../api/timekeeping-teaching-api";
import { useMyTeachingActions } from "../api/teaching-hours-query";
import { dayMonthVi, teachingErrorText, type MyMonthState } from "../domain/teaching-model";

const ACTIVE_STEP: Record<MyMonthState, number> = { COLLECTING: 0, AWAITING: 1, ISSUE: 1, CONFIRMED: 2, CLOSED: 3 };

type Props = { data: MyTeachingMonth; mobile: boolean; month: string; state: MyMonthState };

const dot = { alignItems: "center", borderRadius: "50%", boxSizing: "border-box", display: "inline-flex", flex: "none", fontSize: t.type.micro.fontSize, height: 20, justifyContent: "center", width: 20 } as const;

/** Stepper of 6.3, three steps, no approval step: done = solid primary ✓, current = tinted ring, pending = hairline ring. */
function Steps({ active, deadline }: { active: number; deadline: string | undefined }) {
  const labels = ["Hệ thống tính", `Bạn xác nhận · hạn ${dayMonthVi(deadline)}`, "HR chốt, gửi tính lương"];
  return (
    <Box component="ol" sx={{ ...t.type.small, display: "flex", flexDirection: "column", gap: 1, listStyle: "none", m: 0, p: 0 }}>
      {labels.map((label, i) => {
        const done = i < active;
        const current = i === active;
        return (
          <Box component="li" key={label} sx={{ alignItems: "center", display: "flex", gap: 1, ...(current ? { color: t.statusTint.info.color, fontWeight: t.type.label.fontWeight } : done ? null : { color: "text.secondary" }) }}>
            <Box component="span" sx={{ ...dot, ...(done ? { bgcolor: t.color.primary, color: t.color.surface } : current ? { bgcolor: t.color.primarySofter, border: `2px solid ${t.color.primary}` } : { border: `1px solid ${t.color.border}` }) }}>{done ? "✓" : i + 1}</Box>
            {label}
          </Box>
        );
      })}
    </Box>
  );
}

/** «Xác nhận bảng công»: steps (desktop only), the confirmation sentence and «Báo sai sót» + «Xác nhận bảng công» side by side. Phone 6.4 drops the card frame and the steps, buttons 48 high. */
export function MyTeachingConfirmCard({ data, mobile, month, state }: Props) {
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
  const height = mobile ? 48 : t.size.controlMd;

  const closeIssue = () => {
    setIssueOpen(false);
    setNote("");
  };
  const sendIssue = () => issue.mutate(note.trim(), { onError, onSuccess: () => { closeIssue(); toast.success("Đã gửi báo sai sót"); } });
  const sentence = mobile ? `Tôi xác nhận ${amount} tháng ${label} đúng thực tế.` : `Tôi xác nhận số tiết tháng ${label} là ${amount}, đúng với thực tế giảng dạy.`;
  const frame = mobile ? null : { bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: `${t.radius.card}px`, flex: 1, p: 2 };

  return (
    <Box component="section" sx={{ display: "flex", flexDirection: "column", gap: mobile ? "10px" : 1.5, ...frame }}>
      {mobile ? null : <Box component="h2" sx={{ fontSize: "inherit", fontWeight: t.type.label.fontWeight, m: 0 }}>Xác nhận bảng công</Box>}
      {mobile ? null : <Steps active={ACTIVE_STEP[state]} deadline={data.deadline} />}
      {open ? (
        <>
          <FormControlLabel
            control={<Checkbox checked={agreed} onChange={(event) => setAgreed(event.target.checked)} size="small" sx={{ p: 0, "& .MuiSvgIcon-root": { fontSize: t.size.iconMd } }} />}
            label={sentence}
            slotProps={{ typography: { sx: { ...t.type.small, color: t.color.textSecondary } } }}
            sx={{ alignItems: "flex-start", gap: 1, m: 0, mt: "auto" }}
          />
          <Box sx={{ display: "flex", gap: 1 }}>
            <ErgButton onClick={() => setIssueOpen(true)} sx={{ borderColor: "divider", flex: mobile ? "none" : 1, fontWeight: "fontWeightMedium", height, px: mobile ? 2 : 1.5, whiteSpace: "nowrap" }} variant="outlined">Báo sai sót</ErgButton>
            <ErgButton
              disabled={!agreed}
              loading={confirm.isPending}
              onClick={() => confirm.mutate({ total, assistantTotal: assistant, expectedVersion: data.confirmation?.version ?? 0 }, { onError, onSuccess: () => toast.success("Đã xác nhận bảng công") })}
              sx={{ flex: 1, height, px: 1.5, whiteSpace: "nowrap" }}
              variant="contained"
            >
              Xác nhận bảng công
            </ErgButton>
          </Box>
        </>
      ) : (
        <Box component="p" sx={{ ...t.type.small, color: "text.secondary", m: 0 }}>
          {state === "COLLECTING" ? "Bạn xác nhận được sau khi tháng kết thúc." : state === "CONFIRMED" ? `Bạn đã xác nhận ${amount}.` : "Tháng đã chốt, không sửa được."}
        </Box>
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
