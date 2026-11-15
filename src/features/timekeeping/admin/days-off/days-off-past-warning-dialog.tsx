import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { DaysOffDialog } from "./days-off-dialog";
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

const t = ergEnterpriseTokens;
const head = { bgcolor: t.color.surfaceMuted, color: t.color.textSecondary, fontSize: "0.75rem", py: 1 } as const;
const cell = { fontSize: "0.8125rem", fontVariantNumeric: "tabular-nums", py: 1 } as const;

/** AdminDaysOffWarn: a day off with «Huỷ tiết» would cancel periods already taught. Nothing is saved until the user confirms. */
export function DaysOffPastWarningDialog({ loading, onCancel, warning }: Props) {
  const { payload } = warning;
  return (
    <DaysOffDialog
      actions={
        <>
          <ErgButton disabled={loading} onClick={onCancel} variant="text">Huỷ</ErgButton>
          <ErgButton color="error" loading={loading} onClick={() => { warning.confirm(); onCancel(); }} variant="contained">{`Vẫn huỷ ${payload.taughtPeriods} tiết`}</ErgButton>
        </>
      }
      description={pastWarningIntro(payload)}
      icon={<ReportProblemOutlinedIcon />}
      onClose={onCancel}
      role="alertdialog"
      title={`Huỷ ${payload.taughtPeriods} tiết đã dạy?`}
      width={520}
    >
      <>
        <Box aria-label="Tiết bị ảnh hưởng" component="section" sx={{ border: `1px solid ${t.color.border}`, borderRadius: `${t.radius.card}px`, overflow: "hidden" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...head, px: 2 }}>Trường</TableCell>
                <TableCell sx={{ ...head, width: 90 }}>Tiết đã dạy</TableCell>
                <TableCell sx={{ ...head, width: 110 }}>Đã báo giảng</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payload.schools.map((school) => (
                <TableRow key={school.schoolId ?? school.schoolName}>
                  <TableCell sx={{ ...cell, px: 2 }}>{school.schoolName}</TableCell>
                  <TableCell sx={cell}>{school.taughtPeriods}</TableCell>
                  <TableCell sx={cell}>{school.reportedPeriods}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
        <Box sx={{ display: "grid", gap: 0.75 }}>
          <Typography component="strong" sx={{ fontSize: "0.8125rem" }} variant="subtitle2">Sau khi xác nhận</Typography>
          <Box component="ul" sx={{ color: t.color.textSecondary, display: "grid", fontSize: "0.8125rem", gap: 0.5, m: 0, pl: 2.25 }}>
            <li>{`${payload.taughtPeriods} tiết chuyển sang «Nghỉ lễ», không tính vào công tiết dạy.`}</li>
            <li>{`${payload.reportedPeriods} báo giảng đã nộp không còn được tính công.`}</li>
            <li>Giáo viên thỉnh giảng mất công của các tiết này.</li>
            <li>Giáo viên được báo về thay đổi.</li>
          </Box>
          <Typography sx={{ color: t.color.textMuted }} variant="caption">Muốn giữ công các tiết đã dạy, chọn «Vẫn dạy» cho ngày này.</Typography>
        </Box>
      </>
    </DaysOffDialog>
  );
}
