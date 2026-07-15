import { useEffect, useState, type FormEvent } from "react";

import { TsForm } from "@/components/ui/tanstack-form";
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
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ErgButton } from "@/components/erg-mui/erg-actions";
import {
  archiveLearningResourceTaxonomy,
  deleteLearningResourceTaxonomy,
  loadLearningResourceTaxonomyImpact,
  updateLearningResourceAsset,
  updateLearningResourceResource,
  updateLearningResourceTaxonomy,
  type CurriculumTaxonomyImpact,
} from "@/features/lcms/admin-operations/api/learning-resource-authoring-api";
import {
  ContentLinkField,
  ContentTextFields,
  Field,
  StatusSelectField,
} from "@/features/lcms/admin-operations/components/learning-resource-authoring-fields";
import { usePacedStateBatch } from "@/hooks/use-paced-state-batch";
import type {
  AttachedResourceItem,
  LocalContentEditTarget,
  LocalContentItem,
  TaxonomyDeleteTarget,
  TaxonomyEditTarget,
} from "@/features/lcms/admin-operations/types/learning-resource-authoring";
import { apiKindForEditTarget } from "@/features/lcms/admin-operations/utils/learning-resource-authoring-taxonomy";
import { normalizeGoogleViewerUrl } from "@/features/lcms/admin-operations/utils/learning-resource-content-dialog";

const RESOURCE_DIALOG_PAPER_SX = {
  borderRadius: 1,
  boxShadow: "0 24px 72px rgba(28,37,46,.18)",
  overflow: "hidden",
};

const RESOURCE_DIALOG_TITLE_SX = {
  px: 3,
  pt: 2.5,
  pb: 1,
  fontSize: 18,
  fontWeight: 800,
  color: "#172033",
};

const RESOURCE_DIALOG_CONTENT_SX = {
  px: 3,
  pt: 1.5,
  pb: 3,
};

const RESOURCE_DIALOG_ACTIONS_SX = {
  px: 3,
  py: 2,
  gap: 1,
  borderTop: "1px solid #d9e2ef",
  bgcolor: "background.default",
  flexWrap: "wrap",
  "& .MuiButton-root": {
    minHeight: 36,
    minWidth: 92,
    fontWeight: 700,
  },
};

export function TaxonomyEditDialog({
  target,
  onClose,
  onSaved,
}: {
  target: TaxonomyEditTarget | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [presentationUrl, setPresentationUrl] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const showPresentationField = Boolean(target && target.kind === "section");
  const paceStateUpdate = usePacedStateBatch();

  useEffect(() => {
    if (!target) return;
    paceStateUpdate(() => {
      setLabel(target.label);
      setDescription(target.description || "");
      setStatus(target.status || "active");
      setCoverImageUrl(target.metadata?.coverImageUrl || "");
      setPresentationUrl(target.metadata?.presentationUrl || "");
      setPdfUrl(target.metadata?.pdfUrl || "");
      setExternalUrl(target.metadata?.externalUrl || "");
      setError("");
      setSaving(false);
    });
  }, [paceStateUpdate, target]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!target) return;
    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
      setError("Vui lòng nhập tên.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await updateLearningResourceTaxonomy(apiKindForEditTarget(target.kind), target.id, {
        label: trimmedLabel,
        description: description.trim(),
        status,
        metadata: {
          ...(target.metadata ?? {}),
          coverImageUrl,
          ...(showPresentationField ? { presentationUrl } : { presentationUrl: "" }),
          pdfUrl,
          externalUrl,
        },
      });
      await onSaved();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Không thể cập nhật. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRestore() {
    if (!target) return;
    setSaving(true);
    setError("");
    try {
      await updateLearningResourceTaxonomy(apiKindForEditTarget(target.kind), target.id, {
        label: label.trim(),
        description: description.trim(),
        status: "active",
      });
      await onSaved();
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : "Không thể khôi phục mục này.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={Boolean(target)} onClose={onClose} fullWidth slotProps={{ paper: { sx: { ...RESOURCE_DIALOG_PAPER_SX, maxWidth: 576 } } }}>
      <DialogTitle sx={RESOURCE_DIALOG_TITLE_SX}>Sửa {target?.kind === "subject" ? "môn học" : "nội dung học liệu"}</DialogTitle>
      <TsForm onSubmit={handleSubmit}>
        <DialogContent className="space-y-4" sx={RESOURCE_DIALOG_CONTENT_SX}>
          <p className="text-sm leading-5 text-slate-500">Cập nhật tên, mô tả và trạng thái để LMS hiển thị rõ ràng hơn.</p>
          <ContentTextFields
            titleLabel="Tên hiển thị"
            titleValue={label}
            onTitleChange={setLabel}
            descriptionLabel="Mô tả cho giáo viên/học sinh"
            descriptionValue={description}
            onDescriptionChange={setDescription}
            autoFocus
          />
          <StatusSelectField value={status} onChange={setStatus} taxonomy />
          {false && <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="font-semibold text-slate-950">Thông tin hiển thị trên LMS</div>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Cấu trúc lưu phần mô tả và ảnh đại diện. Tài liệu thật sẽ được gắn bằng link Google Drive/Google Slides ở phần Nội dung hoặc màn Gắn link.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Field label="Ảnh bìa / thumbnail URL">
                <TextField size="small" fullWidth value={coverImageUrl} onChange={(event) => setCoverImageUrl(event.target.value)} placeholder="https://.../cover.webp" />
              </Field>
              {showPresentationField ? (
                <Field label="Link bài giảng PPT/Slides">
                  <TextField size="small" fullWidth value={presentationUrl} onChange={(event) => setPresentationUrl(event.target.value)} placeholder="https://docs.google.com/presentation/..." />
                </Field>
              ) : null}
              <Field label="Link PDF">
                <TextField size="small" fullWidth value={pdfUrl} onChange={(event) => setPdfUrl(event.target.value)} placeholder="https://.../file.pdf" />
              </Field>
              <Field label="Link ngoài">
                <TextField size="small" fullWidth value={externalUrl} onChange={(event) => setExternalUrl(event.target.value)} placeholder="https://..." />
              </Field>
            </div>
          </div>}
          {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div> : null}
        </DialogContent>
        <DialogActions sx={RESOURCE_DIALOG_ACTIONS_SX}>
          <Button type="button" variant="outlined" onClick={onClose} disabled={saving}>Hủy</Button>
          {target?.status?.toLowerCase() === "archived" ? (
            <ErgButton type="button" variant="outlined" onClick={handleRestore} loading={saving}>
              Khôi phục
            </ErgButton>
          ) : null}
          <ErgButton
            type="submit"
            variant="contained"
            loading={saving}
            disabled={!label.trim()}
            sx={{ minWidth: 132 }}
          >
            Lưu thay đổi
          </ErgButton>
        </DialogActions>
      </TsForm>
    </Dialog>
  );
}

export function ResourceEditDialog({
  target,
  onClose,
  onSaved,
}: {
  target: AttachedResourceItem | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [status, setStatus] = useState("published");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const paceStateUpdate = usePacedStateBatch();

  useEffect(() => {
    if (!target) return;
    paceStateUpdate(() => {
      setTitle(target.title);
      setDescription(target.detail?.description || "");
      setLinkUrl(target.linkUrl || "");
      setStatus(target.asset?.status || target.status || "published");
      setSaving(false);
      setError("");
    });
  }, [paceStateUpdate, target]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!target) return;
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Vui lòng nhập tên hiển thị.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const normalizedUrl = linkUrl.trim() ? normalizeGoogleViewerUrl(linkUrl) || linkUrl.trim() : undefined;
      await updateLearningResourceResource(target.id, {
        title: trimmedTitle,
        description: description.trim(),
        status,
        visibility: status === "hidden" ? "private" : "public",
      });
      if (target.asset?.id) {
        await updateLearningResourceAsset(target.asset.id, {
          title: trimmedTitle,
          storageUrl: normalizedUrl,
          upstreamUrl: normalizedUrl,
          status,
        });
      }
      await onSaved();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Không thể cập nhật tài liệu.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={Boolean(target)} onClose={onClose} fullWidth slotProps={{ paper: { sx: { ...RESOURCE_DIALOG_PAPER_SX, maxWidth: 576 } } }}>
      <DialogTitle sx={RESOURCE_DIALOG_TITLE_SX}>Sửa tài liệu</DialogTitle>
      <TsForm onSubmit={handleSubmit}>
        <DialogContent className="space-y-4" sx={RESOURCE_DIALOG_CONTENT_SX}>
          <p className="text-sm leading-5 text-slate-500">Cập nhật tên, link và trạng thái hiển thị của tài liệu.</p>
          <ContentTextFields
            titleLabel="Tên hiển thị"
            titleValue={title}
            onTitleChange={setTitle}
            descriptionLabel="Mô tả"
            descriptionValue={description}
            onDescriptionChange={setDescription}
            autoFocus
          />
          <ContentLinkField
            label="Link tài liệu"
            value={linkUrl}
            onChange={setLinkUrl}
            placeholder="https://docs.google.com/... hoặc link PDF"
          />
          <StatusSelectField value={status} onChange={setStatus} />
          {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div> : null}
        </DialogContent>
        <DialogActions sx={RESOURCE_DIALOG_ACTIONS_SX}>
          <Button type="button" variant="outlined" onClick={onClose} disabled={saving}>Hủy</Button>
          <ErgButton type="submit" variant="contained" loading={saving} disabled={!title.trim()}>Lưu thay đổi</ErgButton>
        </DialogActions>
      </TsForm>
    </Dialog>
  );
}

export function LocalContentEditDialog({
  target,
  onClose,
  onSaved,
}: {
  target: LocalContentEditTarget;
  onClose: () => void;
  onSaved: (patch: Partial<LocalContentItem>) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [status, setStatus] = useState("published");
  const paceStateUpdate = usePacedStateBatch();

  useEffect(() => {
    if (!target) return;
    paceStateUpdate(() => {
      setTitle(target.title);
      setDescription(target.description || "");
      setResourceUrl(target.slidesUrl || target.resourceUrl || "");
      setStatus(target.status || "published");
    });
  }, [paceStateUpdate, target]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    onSaved({
      title: trimmedTitle,
      description: description.trim(),
      slidesUrl: target?.kind === "lecture" ? resourceUrl.trim() : undefined,
      resourceUrl: target?.kind === "exercise" ? resourceUrl.trim() : undefined,
      status,
    });
  }

  return (
    <Dialog open={Boolean(target)} onClose={onClose} fullWidth slotProps={{ paper: { sx: { ...RESOURCE_DIALOG_PAPER_SX, maxWidth: 512 } } }}>
      <DialogTitle sx={RESOURCE_DIALOG_TITLE_SX}>Sửa {target?.kind === "exercise" ? "bài tập" : "bài giảng"}</DialogTitle>
      <TsForm onSubmit={handleSubmit}>
        <DialogContent className="space-y-4" sx={RESOURCE_DIALOG_CONTENT_SX}>
          <p className="text-sm leading-5 text-slate-500">Cập nhật nội dung hiển thị và trạng thái trong màn biên soạn.</p>
          <ContentTextFields
            titleLabel="Tên hiển thị"
            titleValue={title}
            onTitleChange={setTitle}
            descriptionLabel="Mô tả"
            descriptionValue={description}
            onDescriptionChange={setDescription}
            autoFocus
          />
          <ContentLinkField
            label={target?.kind === "exercise" ? "Link tham chiếu" : "Link bài giảng"}
            value={resourceUrl}
            onChange={setResourceUrl}
            placeholder="https://..."
          />
          <StatusSelectField value={status} onChange={setStatus} />
        </DialogContent>
        <DialogActions sx={RESOURCE_DIALOG_ACTIONS_SX}>
          <Button type="button" variant="outlined" onClick={onClose}>Hủy</Button>
          <ErgButton type="submit" variant="contained" disabled={!title.trim()}>Lưu thay đổi</ErgButton>
        </DialogActions>
      </TsForm>
    </Dialog>
  );
}

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

void LegacyTaxonomyDeleteDialog;

function LegacyTaxonomyDeleteDialog({
  target,
  onClose,
  onDeleted,
}: {
  target: TaxonomyDeleteTarget | null;
  onClose: () => void;
  onDeleted: () => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const paceStateUpdate = usePacedStateBatch();

  useEffect(() => {
    if (!target) return;
    paceStateUpdate(() => {
      setDeleting(false);
      setError("");
    });
  }, [paceStateUpdate, target]);

  async function handleDelete() {
    if (!target) return;
    setDeleting(true);
    setError("");
    try {
      await deleteLearningResourceTaxonomy(apiKindForEditTarget(target.kind), target.id);
      await onDeleted();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Không thể xóa. Vui lòng thử lại.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={Boolean(target)} onClose={onClose} fullWidth slotProps={{ paper: { sx: { ...RESOURCE_DIALOG_PAPER_SX, maxWidth: 512 } } }}>
      <DialogTitle sx={RESOURCE_DIALOG_TITLE_SX}>Xóa {target?.label}</DialogTitle>
      <DialogContent className="space-y-4" sx={RESOURCE_DIALOG_CONTENT_SX}>
        <p className="text-sm leading-5 text-slate-500">Thao tác này xóa nội dung khỏi DB. Nếu mục có cấp dưới hoặc tài liệu liên quan, bạn nên chuyển dữ liệu trước khi xóa.</p>
        {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div> : null}
      </DialogContent>
      <DialogActions sx={RESOURCE_DIALOG_ACTIONS_SX}>
        <Button type="button" variant="outlined" onClick={onClose} disabled={deleting}>Hủy</Button>
        <Button type="button" variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
          {deleting ? "Đang xóa..." : "Xóa"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
