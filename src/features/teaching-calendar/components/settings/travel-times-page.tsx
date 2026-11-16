import { useState } from "react";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import AddIcon from "@mui/icons-material/Add";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgConfirmDialog } from "@/components/erg-mui/erg-confirm-dialog";
import { ErgEmptyState, ErgErrorState } from "@/components/erg-mui/erg-feedback";
import { ErgPageHeader } from "@/components/erg-mui/erg-page-header";
import { ErgDataTableShell, ErgTable } from "@/components/erg-mui/erg-table";
import { formatDateTimeVi } from "@/domain/formatters/format-date";
import type { SchoolTravelTime } from "@/features/teaching-calendar/api/teaching-calendar-travel-api";
import { teachingScheduleErrorCode } from "@/features/teaching-calendar/api/teaching-calendar-document";
import { adminPath } from "@/platform/workspaces/workspace-paths";
import { ContentPendingSkeleton } from "@/routes/route-feedback";
import { LoadThresholdCard } from "./load-threshold-card";
import { TravelPairDialog, type TravelPair } from "./travel-pair-dialog";
import { useTravelSettings } from "./use-travel-settings";

/** Cài đặt › Di chuyển giữa trường (6.12): thời gian tối thiểu theo cặp trường + ngưỡng tải tuần. Quyền `lms.schedule.manage`. */
export function TravelTimesPage() {
  const settings = useTravelSettings();
  const [dialog, setDialog] = useState<{ initial?: TravelPair } | null>(null);
  const [removing, setRemoving] = useState<SchoolTravelTime | null>(null);
  const rows = settings.travel.data ?? [];
  const schools = settings.schools.map((school) => ({ schoolId: school.schoolId, schoolName: school.schoolName }));

  return (
    <Stack spacing={2} sx={{ px: { xs: 2, md: 3 }, py: 2 }}>
      <Link href={adminPath("/calendar")} sx={{ typography: "body2" }} underline="hover">← Lịch giảng dạy</Link>
      <ErgPageHeader
        description="Thời gian tối thiểu giữa hai tiết liền nhau của cùng giáo viên ở hai trường khác nhau. Mặc định 50′."
        primaryAction={<ErgButton onClick={() => setDialog({})} startIcon={<AddIcon />} variant="contained">Thêm cặp trường</ErgButton>}
        title="Di chuyển giữa trường"
      />
      {settings.travel.isPending ? <ContentPendingSkeleton /> : settings.travel.isError ? (
        <ErgErrorState action={<ErgButton onClick={() => void settings.travel.refetch()} variant="outlined">Thử lại</ErgButton>} description="Kiểm tra kết nối rồi thử lại." title="Không tải được lịch." />
      ) : !rows.length ? <ErgEmptyState description="Chưa có cặp trường nào: dùng mức mặc định 50′." title="Chưa có cặp trường" /> : (
        <ErgDataTableShell scrollLabel="Thời gian di chuyển giữa các cặp trường">
          <ErgTable>
            <TableHead>
              <TableRow>
                <TableCell>Trường A</TableCell><TableCell>Trường B</TableCell><TableCell align="right">Thời gian tối thiểu</TableCell><TableCell>Cập nhật</TableCell><TableCell align="right"><span aria-hidden> </span></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={`${row.schoolA.schoolId}-${row.schoolB.schoolId}`}>
                  <TableCell>{row.schoolA.schoolName}</TableCell>
                  <TableCell>{row.schoolB.schoolName}</TableCell>
                  <TableCell align="right">{row.minutes}′</TableCell>
                  <TableCell>{formatDateTimeVi(row.updatedAt)}</TableCell>
                  <TableCell align="right">
                    <ErgButton onClick={() => setDialog({ initial: { minutes: row.minutes, schoolAId: row.schoolA.schoolId, schoolBId: row.schoolB.schoolId } })} variant="text">Sửa</ErgButton>
                    <ErgButton color="error" onClick={() => setRemoving(row)} variant="text">Xoá</ErgButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </ErgTable>
        </ErgDataTableShell>
      )}
      {settings.load.data ? (
        <LoadThresholdCard
          key={`${settings.load.data.loadWarn}-${settings.load.data.loadMax}`}
          loadMax={settings.load.data.loadMax} loadWarn={settings.load.data.loadWarn} onSave={(values) => settings.saveLoad.mutate(values)}
          pending={settings.saveLoad.isPending} serverError={Boolean(settings.saveLoad.error) && teachingScheduleErrorCode(settings.saveLoad.error) !== undefined}
        />
      ) : null}
      {dialog ? (
        <TravelPairDialog
          initial={dialog.initial} onClose={() => setDialog(null)} pending={settings.upsert.isPending} schools={schools}
          onSave={(pair) => settings.upsert.mutate(pair, { onSuccess: () => setDialog(null) })}
        />
      ) : null}
      <ErgConfirmDialog
        confirmLabel="Xoá" description="Cặp trường này sẽ dùng lại mức mặc định 50′." destructive loading={settings.remove.isPending}
        onCancel={() => setRemoving(null)} open={Boolean(removing)} title={removing ? `Xoá cặp ${removing.schoolA.schoolName} ↔ ${removing.schoolB.schoolName}?` : ""}
        onConfirm={() => removing && settings.remove.mutate({ schoolAId: removing.schoolA.schoolId, schoolBId: removing.schoolB.schoolId }, { onSettled: () => setRemoving(null) })}
      />
    </Stack>
  );
}
