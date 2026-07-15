import { useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ErgCalendarPermissions } from "@/components/shared/erg-calendar-workspace";
import {
  cancelTeachingScheduleBatch,
  loadTeachingScheduleBatchDetail,
  loadTeachingScheduleBatches,
  publishTeachingScheduleBatch,
  teachingCalendarQueryKeys,
  type TeachingScheduleStatus,
} from "@/features/teaching-calendar/api/teaching-calendar-api";

type Props = {
  permissions?: ErgCalendarPermissions;
  tenantId: string;
};

export function TeachingScheduleBatchPanel({ permissions, tenantId }: Props) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState<TeachingScheduleStatus | "">("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const input = { page, size: 20, status: status || undefined, tenantId };
  const query = useQuery({
    enabled: Boolean(tenantId),
    queryFn: () => loadTeachingScheduleBatches(input),
    queryKey: teachingCalendarQueryKeys.batches("lcms", input),
  });
  const detailQuery = useQuery({
    enabled: Boolean(tenantId && selectedBatchId),
    queryFn: () => loadTeachingScheduleBatchDetail({ batchId: selectedBatchId, tenantId }),
    queryKey: teachingCalendarQueryKeys.batchDetail("lcms", tenantId, selectedBatchId),
  });
  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: teachingCalendarQueryKeys.portalRoot("lcms", tenantId) });
  };
  const publishMutation = useMutation({
    mutationFn: (batchId: string) => publishTeachingScheduleBatch(batchId, tenantId),
    onSuccess: invalidate,
  });
  const cancelMutation = useMutation({
    mutationFn: (batchId: string) => cancelTeachingScheduleBatch(batchId, tenantId),
    onSuccess: invalidate,
  });
  const pendingBatchId = publishMutation.variables ?? cancelMutation.variables;

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, boxShadow: "none", overflow: "hidden" }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between", p: 2 }}>
        <div>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Đợt lịch giảng dạy</Typography>
          <Typography variant="body2" color="text.secondary">Xuất bản bản nháp để giáo viên nhận lịch trên LMS.</Typography>
        </div>
        <Stack direction="row" spacing={1}>
          <TextField
            label="Trạng thái"
            onChange={(event) => { setStatus(event.target.value as TeachingScheduleStatus | ""); setPage(0); }}
            select
            size="small"
            sx={{ minWidth: 150 }}
            value={status}
          >
            <MenuItem value="">Tất cả</MenuItem>
            <MenuItem value="DRAFT">Bản nháp</MenuItem>
            <MenuItem value="PUBLISHED">Đã xuất bản</MenuItem>
            <MenuItem value="CANCELLED">Đã hủy</MenuItem>
          </TextField>
          <Button size="small" onClick={() => void query.refetch()} disabled={query.isFetching}>Tải lại</Button>
        </Stack>
      </Stack>
      {query.error instanceof Error ? <Alert severity="error" action={<Button onClick={() => void query.refetch()}>Thử lại</Button>}>{query.error.message}</Alert> : null}
      {query.isPending ? <Stack spacing={1} sx={{ p: 2, pt: 0 }}><Skeleton height={38} /><Skeleton height={38} /></Stack> : null}
      {!query.isPending && !query.data?.items.length ? <Alert severity="info">Chưa có đợt lịch nào.</Alert> : null}
      {query.data?.items.length ? (
        <TableContainer>
          <Table size="small" aria-label="Danh sách đợt lịch giảng dạy">
            <TableHead><TableRow><TableCell>Mã đợt</TableCell><TableCell>Ngày áp dụng</TableCell><TableCell>Tuần</TableCell><TableCell>Trạng thái</TableCell><TableCell align="right">Thao tác</TableCell></TableRow></TableHead>
            <TableBody>
              {query.data.items.map((batch) => (
                <TableRow key={batch.id} hover>
                  <TableCell>
                    <Button aria-label={`Xem đợt ${batch.id}`} onClick={() => setSelectedBatchId(batch.id)} size="small" sx={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, textTransform: "none" }}>
                      {batch.id}
                    </Button>
                  </TableCell>
                  <TableCell>{batch.applyFrom}</TableCell>
                  <TableCell>{batch.repeatWeeks}</TableCell>
                  <TableCell><BatchStatus status={batch.status} /></TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                      {batch.status === "DRAFT" && permissions?.canPublish ? <Button size="small" variant="contained" disabled={Boolean(pendingBatchId)} onClick={() => window.confirm("Xuất bản đợt lịch này cho giáo viên?") && publishMutation.mutate(batch.id)}>Xuất bản</Button> : null}
                      {batch.status !== "CANCELLED" && permissions?.canDelete ? <Button size="small" color="error" disabled={Boolean(pendingBatchId)} onClick={() => window.confirm("Hủy toàn bộ đợt lịch này?") && cancelMutation.mutate(batch.id)}>Hủy</Button> : null}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}
      {query.data && query.data.totalPages > 1 ? (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "flex-end", p: 2 }}>
          <Button disabled={!query.data.hasPrevious || query.isFetching} onClick={() => setPage((current) => Math.max(0, current - 1))} size="small">Trang trước</Button>
          <Typography variant="body2">Trang {query.data.page + 1}/{query.data.totalPages}</Typography>
          <Button disabled={!query.data.hasNext || query.isFetching} onClick={() => setPage((current) => current + 1)} size="small">Trang sau</Button>
        </Stack>
      ) : null}
      <Dialog fullWidth maxWidth="sm" onClose={() => setSelectedBatchId("")} open={Boolean(selectedBatchId)}>
        <DialogTitle>Chi tiết đợt lịch</DialogTitle>
        <DialogContent>
          {detailQuery.isPending ? <Stack spacing={1}><Skeleton height={36} /><Skeleton height={36} /></Stack> : null}
          {detailQuery.error instanceof Error ? <Alert severity="error">{detailQuery.error.message}</Alert> : null}
          {detailQuery.data ? (
            <Stack spacing={1}>
              <Typography sx={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13 }}>{detailQuery.data.id}</Typography>
              <BatchStatus status={detailQuery.data.status} />
              <Typography>{detailQuery.data.eventCount} sự kiện</Typography>
              <Typography variant="body2" color="text.secondary">Áp dụng từ {detailQuery.data.applyFrom ?? "—"} trong {detailQuery.data.repeatWeeks} tuần.</Typography>
              {detailQuery.data.note ? <Typography variant="body2">{detailQuery.data.note}</Typography> : null}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions><Button onClick={() => setSelectedBatchId("")}>Đóng</Button></DialogActions>
      </Dialog>
    </Paper>
  );
}

function BatchStatus({ status }: { status: TeachingScheduleStatus }) {
  const color = status === "PUBLISHED" ? "success" : status === "CANCELLED" ? "error" : "warning";
  const label = status === "PUBLISHED" ? "Đã xuất bản" : status === "CANCELLED" ? "Đã hủy" : "Bản nháp";
  return <Chip color={color} label={label} size="small" />;
}
