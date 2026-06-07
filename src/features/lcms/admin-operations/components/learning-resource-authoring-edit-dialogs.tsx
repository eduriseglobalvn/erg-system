import { useEffect, useState, type FormEvent } from "react";

import { TsForm } from "@/components/ui/tanstack-form";
import { Button, Input } from "@/components/ui/dashboard-kit";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  deleteLearningResourceTaxonomy,
  updateLearningResourceAsset,
  updateLearningResourceResource,
  updateLearningResourceTaxonomy,
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

  return (
    <Dialog open={Boolean(target)} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : undefined)}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Sửa {target?.kind === "subject" ? "môn học" : "nội dung học liệu"}</DialogTitle>
          <DialogDescription>Cập nhật tên, mô tả và trạng thái để LMS hiển thị rõ ràng hơn.</DialogDescription>
        </DialogHeader>
        <TsForm onSubmit={handleSubmit} className="space-y-4">
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
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="font-semibold text-slate-950">Thông tin hiển thị trên LMS</div>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Cấu trúc lưu phần mô tả và ảnh đại diện. Tài liệu thật sẽ được gắn bằng link Google Drive/Google Slides ở phần Nội dung hoặc màn Gắn link.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Field label="Ảnh bìa / thumbnail URL">
                <Input value={coverImageUrl} onChange={(event) => setCoverImageUrl(event.target.value)} placeholder="https://.../cover.webp" />
              </Field>
              {showPresentationField ? (
                <Field label="Link bài giảng PPT/Slides">
                  <Input value={presentationUrl} onChange={(event) => setPresentationUrl(event.target.value)} placeholder="https://docs.google.com/presentation/..." />
                </Field>
              ) : null}
              <Field label="Link PDF">
                <Input value={pdfUrl} onChange={(event) => setPdfUrl(event.target.value)} placeholder="https://.../file.pdf" />
              </Field>
              <Field label="Link ngoài">
                <Input value={externalUrl} onChange={(event) => setExternalUrl(event.target.value)} placeholder="https://..." />
              </Field>
            </div>
          </div>
          {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Hủy</Button>
            <Button type="submit" disabled={saving || !label.trim()} className="bg-[var(--erg-blue)] hover:bg-[var(--erg-blue-hover)]">
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </TsForm>
      </DialogContent>
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
    <Dialog open={Boolean(target)} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : undefined)}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Sửa tài liệu</DialogTitle>
          <DialogDescription>Cập nhật tên, link và trạng thái hiển thị của tài liệu.</DialogDescription>
        </DialogHeader>
        <TsForm onSubmit={handleSubmit} className="space-y-4">
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Hủy</Button>
            <Button type="submit" disabled={saving || !title.trim()} className="bg-[var(--erg-blue)] hover:bg-[var(--erg-blue-hover)]">
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </TsForm>
      </DialogContent>
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
    <Dialog open={Boolean(target)} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : undefined)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Sửa {target?.kind === "exercise" ? "bài tập" : "bài giảng"}</DialogTitle>
          <DialogDescription>Cập nhật nội dung hiển thị và trạng thái trong màn biên soạn.</DialogDescription>
        </DialogHeader>
        <TsForm onSubmit={handleSubmit} className="space-y-4">
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
            <Button type="submit" disabled={!title.trim()} className="bg-[var(--erg-blue)] hover:bg-[var(--erg-blue-hover)]">Lưu thay đổi</Button>
          </DialogFooter>
        </TsForm>
      </DialogContent>
    </Dialog>
  );
}

export function TaxonomyDeleteDialog({
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
    <Dialog open={Boolean(target)} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : undefined)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Xóa {target?.label}</DialogTitle>
          <DialogDescription>Thao tác này xóa nội dung khỏi DB. Nếu mục có cấp dưới hoặc tài liệu liên quan, bạn nên chuyển dữ liệu trước khi xóa.</DialogDescription>
        </DialogHeader>
        {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div> : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={deleting}>Hủy</Button>
          <Button type="button" variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Đang xóa..." : "Xóa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
