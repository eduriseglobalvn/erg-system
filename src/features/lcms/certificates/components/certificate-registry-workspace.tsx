import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import {
  useLearnerOutcomeQueries,
  useRevokeCertificate,
  type LearningOutcomeScope,
} from "@/features/lms/learning-paths/api/learning-outcomes-query";
import type { CertificateRecord } from "@/features/lms/learning-paths/api/learning-outcomes-api";
import {
  CertificateTable,
  OutcomeEmptyState,
  OutcomeErrorState,
  OutcomeLoadingState,
} from "@/features/lms/learning-paths/components/learning-outcomes-presentation";
import { newIdempotencyKey } from "@/features/lms/learning-paths/components/learning-outcomes-admin-dialogs";

export function CertificateRegistryWorkspace({ pathTitleById, scope }: { pathTitleById?: Map<string, string>; scope: LearningOutcomeScope }) {
  const [learnerInput, setLearnerInput] = useState("");
  const [learnerId, setLearnerId] = useState("");
  const [revokeTarget, setRevokeTarget] = useState<CertificateRecord>();
  const [reason, setReason] = useState("");
  const queries = useLearnerOutcomeQueries(scope, learnerId);
  const revokeMutation = useRevokeCertificate(scope);
  const certificates = queries.certificates.data ?? [];

  async function revoke() {
    if (!revokeTarget || !reason.trim()) return;
    await revokeMutation.mutateAsync({ certificateId: revokeTarget.id, input: { expectedVersion: revokeTarget.recordVersion, reason: reason.trim() }, idempotencyKey: newIdempotencyKey(`revoke-${revokeTarget.id}`) });
    setRevokeTarget(undefined);
    setReason("");
  }

  return <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 3, p: { xs: 1.5, md: 2 } }}><Typography sx={{ fontWeight: 850 }} variant="h6">Tra cứu chứng chỉ</Typography><Typography color="text.secondary" sx={{ mb: 2 }} variant="body2">Nhập learner ID để xem chứng chỉ thuộc đúng tenant và yêu cầu thu hồi có kiểm soát phiên bản.</Typography><Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}><TextField fullWidth label="Learner ID" onChange={(event) => setLearnerInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") setLearnerId(learnerInput.trim()); }} value={learnerInput} /><Button disabled={!learnerInput.trim()} onClick={() => setLearnerId(learnerInput.trim())} startIcon={<SearchRoundedIcon />} variant="contained">Tra cứu</Button></Stack>{!learnerId ? <OutcomeEmptyState description="Không tải dữ liệu khi chưa có learner ID để tránh đọc nhầm phạm vi." title="Chưa chọn người học" /> : queries.certificates.isLoading ? <OutcomeLoadingState /> : queries.certificates.error ? <OutcomeErrorState message={queries.certificates.error instanceof Error ? queries.certificates.error.message : undefined} /> : certificates.length ? <CertificateTable certificates={certificates} onRevoke={setRevokeTarget} pathTitleById={pathTitleById} /> : <OutcomeEmptyState description="Máy chủ không trả về chứng chỉ nào cho learner ID này." title="Chưa có chứng chỉ" />}<Dialog fullWidth maxWidth="sm" onClose={() => setRevokeTarget(undefined)} open={Boolean(revokeTarget)}><DialogTitle>Thu hồi chứng chỉ?</DialogTitle><DialogContent><Typography color="text.secondary" sx={{ mb: 2 }} variant="body2">{revokeTarget?.certificateNumber} sẽ chuyển sang trạng thái thu hồi và không được coi là chứng nhận hợp lệ nữa.</Typography><TextField autoFocus fullWidth label="Lý do thu hồi" multiline minRows={3} onChange={(event) => setReason(event.target.value)} required value={reason} /></DialogContent><DialogActions><Button onClick={() => setRevokeTarget(undefined)}>Huỷ</Button><Button color="error" disabled={revokeMutation.isPending || !reason.trim()} onClick={() => void revoke()} variant="contained">{revokeMutation.isPending ? "Đang thu hồi…" : "Xác nhận thu hồi"}</Button></DialogActions></Dialog></Box>;
}
