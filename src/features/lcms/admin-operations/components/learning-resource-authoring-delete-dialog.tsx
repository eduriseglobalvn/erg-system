import { useEffect, useState } from "react";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import {
  archiveLearningResourceTaxonomy,
  deleteLearningResourceTaxonomy,
  loadLearningResourceTaxonomyImpact,
  type CurriculumTaxonomyImpact,
} from "@/features/lcms/admin-operations/api/learning-resource-authoring-api";
import {
  RESOURCE_DIALOG_ACTIONS_SX,
  RESOURCE_DIALOG_CONTENT_SX,
  RESOURCE_DIALOG_PAPER_SX,
  RESOURCE_DIALOG_TITLE_SX,
} from "@/features/lcms/admin-operations/components/learning-resource-authoring-dialog-styles";
import { usePacedStateBatch } from "@/hooks/use-paced-state-batch";
import type { TaxonomyDeleteTarget } from "@/features/lcms/admin-operations/types/learning-resource-authoring";
import { apiKindForEditTarget } from "@/features/lcms/admin-operations/utils/learning-resource-authoring-taxonomy";

export function TaxonomyDeleteDialog({
  estimatedImpact,
  target,
  onClose,
  onDeleted,
}: {
  estimatedImpact?: CurriculumTaxonomyImpact | null;
  target: TaxonomyDeleteTarget | null;
  onClose: () => void;
  onDeleted: () => Promise<void>;
}) {
  const [submittingAction, setSubmittingAction] = useState<"archive" | "hard-delete" | "merge" | "reassign" | null>(null);
  const [loadingImpact, setLoadingImpact] = useState(false);
  const [impact, setImpact] = useState<CurriculumTaxonomyImpact | null>(null);
  const [error, setError] = useState("");
  const paceStateUpdate = usePacedStateBatch();

  useEffect(() => {
    if (!target) return;
    paceStateUpdate(() => {
      setSubmittingAction(null);
      setLoadingImpact(true);
      setImpact(estimatedImpact ?? null);
      setError("");
    });

    let cancelled = false;
    void loadLearningResourceTaxonomyImpact(apiKindForEditTarget(target.kind), target.id)
      .then((nextImpact) => {
        if (cancelled) return;
        setImpact({ ...nextImpact, source: "api" });
      })
      .catch(() => {
        if (cancelled) return;
        setImpact(estimatedImpact ?? buildEmptyImpact(target));
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingImpact(false);
      });

    return () => {
      cancelled = true;
    };
  }, [estimatedImpact, paceStateUpdate, target]);

  async function handleArchive() {
    if (!target) return;
    setSubmittingAction("archive");
    setError("");
    try {
      await archiveLearningResourceTaxonomy(apiKindForEditTarget(target.kind), target.id);
      await onDeleted();
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : "Không thể archive. Vui lòng thử lại.");
    } finally {
      setSubmittingAction(null);
    }
  }

  async function handleHardDelete() {
    if (!target) return;
    setSubmittingAction("hard-delete");
    setError("");
    try {
      await deleteLearningResourceTaxonomy(apiKindForEditTarget(target.kind), target.id);
      await onDeleted();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Không thể xóa vĩnh viễn. Vui lòng thử lại.");
    } finally {
      setSubmittingAction(null);
    }
  }

  const resolvedImpact = impact ?? estimatedImpact ?? (target ? buildEmptyImpact(target) : null);
  const hasDependencies = resolvedImpact ? totalImpactCount(resolvedImpact) > 0 : false;
  const canHardDelete = Boolean(resolvedImpact) && !hasDependencies;
  const canArchive = Boolean(resolvedImpact?.canArchive);
  const submitting = Boolean(submittingAction);
  const targetRoleLabel = target ? taxonomyTargetLabel(target.kind) : "mục";

  return (
    <Dialog open={Boolean(target)} onClose={submitting ? undefined : onClose} fullWidth slotProps={{ paper: { sx: { ...RESOURCE_DIALOG_PAPER_SX, maxWidth: 680 } } }}>
      <DialogTitle sx={RESOURCE_DIALOG_TITLE_SX}>Tác động khi lưu trữ {targetRoleLabel}</DialogTitle>
      {loadingImpact ? <LinearProgress /> : null}
      <DialogContent sx={RESOURCE_DIALOG_CONTENT_SX}>
        <Stack spacing={2.5}>
          <Typography variant="body2" color="text.secondary">
            {target?.label ? `"${target.label}"` : "Mục này"} là node taxonomy dùng chung cho curriculum/content. Không xóa trực tiếp nếu đang có học liệu, quiz, assignment hoặc lịch sử học tập tham chiếu.
          </Typography>

          {resolvedImpact?.source === "estimated" ? (
            <Alert severity="info">
              BE impact API chưa khả dụng hoặc chưa trả dữ liệu. Số liệu dưới đây là ước tính từ dữ liệu FE hiện có; cần xác nhận lại ở BE trước khi thao tác lớn.
            </Alert>
          ) : null}

          {hasDependencies ? (
            <Alert severity="warning">
              Đang có dữ liệu liên quan. Không thể xóa trực tiếp; hãy lưu trữ, chuyển dữ liệu hoặc gộp node để giữ lịch sử học tập an toàn.
            </Alert>
          ) : (
            <Alert severity={canHardDelete ? "success" : "info"}>
              Chưa phát hiện dữ liệu liên quan. Node rỗng có thể được xóa vĩnh viễn.
            </Alert>
          )}

          {resolvedImpact ? <ImpactTable impact={resolvedImpact} /> : null}

          <Divider />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button variant="outlined" disabled={submitting} onClick={() => setSubmittingAction("reassign")}>
              Chuyển nội dung/câu hỏi
            </Button>
            <Button variant="outlined" disabled={submitting} onClick={() => setSubmittingAction("merge")}>
              Merge vào node khác
            </Button>
            <Button variant="outlined" disabled>
              Tải báo cáo tác động
            </Button>
          </Stack>

          {submittingAction === "reassign" || submittingAction === "merge" ? (
            <Alert severity="info">
              Chức năng này sẽ được kết nối khi BE hỗ trợ đầy đủ thao tác tương ứng. Hiện tại hãy dùng Lưu trữ để ẩn node khỏi cây mặc định mà không mất lịch sử.
            </Alert>
          ) : null}

          {error ? <Alert severity="error">{error}</Alert> : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={RESOURCE_DIALOG_ACTIONS_SX}>
        <Button type="button" variant="outlined" onClick={onClose} disabled={submitting}>Hủy</Button>
        {canHardDelete ? (
          <Button type="button" variant="outlined" color="error" onClick={handleHardDelete} disabled={submitting}>
            {submittingAction === "hard-delete" ? "Đang xóa..." : "Xóa vĩnh viễn node rỗng"}
          </Button>
        ) : null}
        <Button type="button" variant="contained" color="warning" onClick={handleArchive} disabled={submitting || !canArchive}>
          {submittingAction === "archive" ? "Đang lưu trữ..." : "Lưu trữ"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ImpactTable({ impact }: { impact: CurriculumTaxonomyImpact }) {
  const rows = [
    ["Questions", impact.impact.questions],
    ["Quizzes", impact.impact.quizzes],
    ["Published quiz versions", impact.impact.publishedQuizVersions],
    ["Content items", impact.impact.contentItems],
    ["Assignments", impact.impact.assignments],
    ["Student attempts", impact.impact.studentAttempts],
  ];

  return (
    <TableContainer sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
      <Table size="small" aria-label="Curriculum taxonomy impact">
        <TableBody>
          {rows.map(([label, value]) => (
            <TableRow key={label}>
              <TableCell sx={{ fontWeight: 600 }}>{label}</TableCell>
              <TableCell align="right">{value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function buildEmptyImpact(target: TaxonomyDeleteTarget): CurriculumTaxonomyImpact {
  return {
    nodeId: target.id,
    nodeType: taxonomyNodeType(target.kind),
    canHardDelete: true,
    canArchive: true,
    impact: {
      questions: 0,
      quizzes: 0,
      publishedQuizVersions: 0,
      contentItems: 0,
      assignments: 0,
      studentAttempts: 0,
    },
    recommendedActions: ["HARD_DELETE", "ARCHIVE"],
    source: "estimated",
  };
}

function totalImpactCount(impact: CurriculumTaxonomyImpact) {
  return Object.values(impact.impact).reduce((total, value) => total + value, 0);
}

function taxonomyNodeType(kind: TaxonomyDeleteTarget["kind"]): CurriculumTaxonomyImpact["nodeType"] {
  if (kind === "subject") return "subject";
  if (kind === "group" || kind === "category") return "level";
  return "topic";
}

function taxonomyTargetLabel(kind: TaxonomyDeleteTarget["kind"]) {
  const nodeType = taxonomyNodeType(kind);
  if (nodeType === "subject") return "môn học";
  if (nodeType === "level") return "level";
  return "chủ đề";
}
