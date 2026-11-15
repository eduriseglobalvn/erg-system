import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgDialog } from "@/components/erg-mui/erg-overlays";
import { pastPeriodsPayload, pastWarningIntro, type PastPeriodsPayload } from "./days-off-model";

type PastWarning = { payload: PastPeriodsPayload; confirm: () => void };

/** Holds the 409 HOLIDAY_AFFECTS_PAST_PERIODS answer of a save: `handle` returns true when it opened the warning, `confirm` re-runs the save with confirmPast. */
export function usePastConfirm() {
  const [warning, setWarning] = useState<PastWarning | null>(null);
  const handle = (error: unknown, resend: () => void) => {
    const payload = pastPeriodsPayload(error);
    if (payload) setWarning({ payload, confirm: resend });
    return payload !== null;
  };
  return { warning, handle, close: () => setWarning(null) };
}

type Props = { warning: PastWarning; loading?: boolean; onCancel: () => void };

/** AdminDaysOffWarn: a day off with «Huỷ tiết» would cancel periods already taught. Nothing is saved until the user confirms. */
export function DaysOffPastWarningDialog({ loading, onCancel, warning }: Props) {
  const { payload } = warning;
  return (
    <ErgDialog
      actions={
        <>
          <ErgButton disabled={loading} onClick={onCancel} variant="text">Huỷ</ErgButton>
          <ErgButton color="error" loading={loading} onClick={() => { warning.confirm(); onCancel(); }} variant="contained">{`Vẫn huỷ ${payload.taughtPeriods} tiết`}</ErgButton>
        </>
      }
      onClose={onCancel}
      open
      role="alertdialog"
      sx={{ "& .MuiDialog-paper": { maxWidth: 520 } }}
      title={`Huỷ ${payload.taughtPeriods} tiết đã dạy?`}
    >
      <Box sx={{ display: "grid", gap: 2 }}>
        <Typography variant="body2">{pastWarningIntro(payload)}</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Trường</TableCell>
              <TableCell align="right">Tiết đã dạy</TableCell>
              <TableCell align="right">Đã báo giảng</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payload.schools.map((school) => (
              <TableRow key={school.schoolId ?? school.schoolName}>
                <TableCell>{school.schoolName}</TableCell>
                <TableCell align="right">{school.taughtPeriods}</TableCell>
                <TableCell align="right">{school.reportedPeriods}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Box>
          <Typography component="p" variant="subtitle2">Sau khi xác nhận</Typography>
          <Box component="ul" sx={{ color: "text.secondary", m: 0, mt: 0.5, pl: 2.5, typography: "body2" }}>
            <li>{`${payload.taughtPeriods} tiết chuyển sang «Nghỉ lễ», không tính vào công tiết dạy.`}</li>
            <li>{`${payload.reportedPeriods} báo giảng đã nộp không còn được tính công.`}</li>
            <li>Giáo viên thỉnh giảng mất công của các tiết này.</li>
            <li>Giáo viên được báo về thay đổi.</li>
          </Box>
        </Box>
        <Typography color="text.secondary" variant="caption">Muốn giữ công các tiết đã dạy, chọn «Vẫn dạy» cho ngày này.</Typography>
      </Box>
    </ErgDialog>
  );
}
