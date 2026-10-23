import { useEffect, useMemo, useState } from "react";
import { useForm } from "@tanstack/react-form";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";

import { AppSelect } from "@/components/ui/app-select";
import { inputClassName } from "@/components/ui/input";
import { TsForm } from "@/components/ui/tanstack-form";
import { uploadLearningResourceResource } from "@/features/lcms/admin-operations/api/learning-resource-authoring-api";
import {
  AuthoringCardDescription,
  AuthoringCardHeader,
  AuthoringCardTitle,
  ChecklistItem,
  Field,
  InfoRow,
} from "@/features/lcms/admin-operations/components/learning-resource-authoring-fields";
import { buildLearningResourceUploadCommand } from "@/features/lcms/admin-operations/components/learning-resource-authoring-screen-model";
import { getNodeKindLabel } from "@/features/lcms/admin-operations/components/learning-resource-authoring-tree";
import {
  buildResourceLocation,
  findPath,
  flattenNodes,
  pathLabel,
} from "@/features/lcms/admin-operations/components/learning-resource-authoring-utils";
import type { StudioNode, StudioSubject } from "@/features/lcms/admin-operations/types/learning-resource-authoring";
import { usePacedStateBatch } from "@/hooks/use-paced-state-batch";

export function UploadScreen({
  subjects,
  selectedSubject,
  allNodes,
}: {
  subjects: StudioSubject[];
  selectedSubject?: StudioSubject;
  allNodes: StudioNode[];
}) {
  const [subjectId, setSubjectId] = useState(selectedSubject?.id ?? "");
  const subject = subjects.find((item) => item.id === subjectId) ?? selectedSubject ?? subjects[0];
  const subjectNodes = useMemo(() => (subject ? flattenNodes(subject.tree) : allNodes), [allNodes, subject]);
  const [nodeId, setNodeId] = useState(subjectNodes[0]?.id ?? "");
  const node = subjectNodes.find((item) => item.id === nodeId) ?? subjectNodes[0];
  const path = subject && node ? findPath(subject.tree, node.id) : [];
  const location = buildResourceLocation(path);
  const [title, setTitle] = useState("");
  const [fileType, setFileType] = useState("PDF");
  const [resourceUrl, setResourceUrl] = useState("");
  const [totalSlides, setTotalSlides] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const paceStateUpdate = usePacedStateBatch();
  const form = useForm({
    defaultValues: { title, fileType, resourceUrl, totalSlides },
    onSubmit: () => handleUpload(),
  });

  useEffect(() => {
    if (!subjectId && selectedSubject?.id) paceStateUpdate(() => setSubjectId(selectedSubject.id));
  }, [paceStateUpdate, selectedSubject?.id, subjectId]);

  useEffect(() => {
    paceStateUpdate(() => setNodeId(subjectNodes[0]?.id ?? ""));
  }, [paceStateUpdate, subject?.id, subjectNodes]);

  async function handleUpload() {
    const command = buildLearningResourceUploadCommand({
      fileType,
      location,
      resourceUrl,
      subjectId: subject?.id,
      title,
      totalSlides,
    });
    if (!command.ok) {
      setMessage(command.message);
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      await uploadLearningResourceResource(command.payload);
      setMessage("Đã lưu link và gắn tài liệu vào đúng vị trí trong cây học liệu.");
      setTitle("");
      setResourceUrl("");
      setTotalSlides("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không lưu được link tài liệu.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <AuthoringCardHeader>
          <AuthoringCardTitle>Gắn tài liệu bằng link</AuthoringCardTitle>
          <AuthoringCardDescription>Chọn môn, vị trí trong cấu trúc và dán link Google Drive/Google Slides để giáo viên mở trực tiếp.</AuthoringCardDescription>
        </AuthoringCardHeader>
        <CardContent>
          <TsForm className="grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); event.stopPropagation(); void form.handleSubmit(); }}>
            <Field label="Môn học">
              <AppSelect className={inputClassName} value={subject?.id ?? ""} onChange={(event) => setSubjectId(event.target.value)}>
                {subjects.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </AppSelect>
            </Field>
            <Field label="Gắn vào vị trí">
              <AppSelect className={inputClassName} value={node?.id ?? ""} onChange={(event) => setNodeId(event.target.value)}>
                {subjectNodes.map((item) => <option key={item.id} value={item.id}>{pathLabel(subject?.label ?? "", findPath(subject?.tree ?? [], item.id))}</option>)}
              </AppSelect>
            </Field>
            <Field label="Tên hiển thị"><TextField size="small" fullWidth value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ví dụ: Bài giảng Unit 1" /></Field>
            <Field label="Loại tài liệu">
              <AppSelect className={inputClassName} value={fileType} onChange={(event) => setFileType(event.target.value)}>
                <option value="PPTX">Bài giảng điện tử</option><option value="PDF">PDF / Giáo trình</option><option value="AUDIO">Audio</option><option value="VIDEO">Video</option><option value="ZIP">Gói học liệu ZIP</option><option value="HTML5">HTML5</option>
              </AppSelect>
            </Field>
            <div className="md:col-span-2">
              <Field label="Link Google Drive / Google Slides">
                <TextField size="small" fullWidth value={resourceUrl} onChange={(event) => setResourceUrl(event.target.value)} placeholder="Dán link share, preview hoặc embed từ Google Drive" />
                <p className="text-xs leading-5 text-slate-500">FE sẽ lưu link vào asset, không upload file thật. Link Google Drive dạng `/file/d/.../view` sẽ được chuẩn hóa về `/preview`.</p>
              </Field>
            </div>
            {fileType === "PPTX" ? (
              <div className="md:col-span-2">
                <Field label="Tổng số slide">
                  <TextField size="small" fullWidth value={totalSlides} onChange={(event) => setTotalSlides(event.target.value.replace(/[^\d]/g, ""))} slotProps={{ htmlInput: { inputMode: "numeric" } }} placeholder="Ví dụ: 20" />
                  <p className="text-xs leading-5 text-slate-500">Dùng cho popup xác nhận khi giáo viên back hoặc tắt bài trình chiếu.</p>
                </Field>
              </div>
            ) : null}
            {message ? <div className="md:col-span-2 rounded-lg border border-[#b8d6fa] bg-[var(--erg-blue-light)] px-4 py-3 text-sm font-semibold text-[var(--erg-blue)]">{message}</div> : null}
            <div className="md:col-span-2 flex justify-end"><Button type="submit" variant="contained" disabled={saving || !resourceUrl.trim() || !subject || !location.categoryId} className="bg-[var(--erg-blue)] hover:bg-[var(--erg-blue-hover)]">{saving ? "Đang lưu..." : "Lưu link và gắn tài liệu"}</Button></div>
          </TsForm>
        </CardContent>
      </Card>

      <Card>
        <AuthoringCardHeader><AuthoringCardTitle>Thông tin vị trí</AuthoringCardTitle><AuthoringCardDescription>Giúp giáo viên kiểm tra link sẽ được gắn vào đâu trước khi lưu.</AuthoringCardDescription></AuthoringCardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="Môn" value={subject?.label ?? "Chưa chọn"} />
          <InfoRow label="Vị trí" value={pathLabel(subject?.label ?? "", path) || "Chưa chọn"} />
          <InfoRow label="Loại" value={node ? getNodeKindLabel(node.kind) : "Chưa chọn"} />
          <ChecklistItem label={location.categoryId ? "Đã xác định level" : "Cần chọn một level"} />
          <ChecklistItem label={resourceUrl.trim() ? "Đã nhập link tài liệu" : "Chưa nhập link tài liệu"} />
        </CardContent>
      </Card>
    </div>
  );
}
