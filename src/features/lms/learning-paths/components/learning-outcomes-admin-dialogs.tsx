import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useState } from "react";
import type {
  AddPathNodeInput,
  CreateCompetencyInput,
  CreateLearningPathInput,
} from "@/features/lms/learning-paths/api/learning-outcomes-api";

export function newIdempotencyKey(prefix: string) {
  const suffix = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}:${suffix}`;
}

export function CreateLearningPathDialog({ error, onClose, onSubmit, open, pending }: { error: unknown; onClose: () => void; onSubmit: (input: CreateLearningPathInput) => Promise<void>; open: boolean; pending: boolean }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [educationUnitId, setEducationUnitId] = useState("");
  const [classId, setClassId] = useState("");
  const submit = async () => {
    if (!title.trim()) return;
    await onSubmit({ title: title.trim(), description: description.trim() || undefined, educationUnitId: educationUnitId.trim() || undefined, classId: classId.trim() || undefined });
    setTitle(""); setDescription(""); setEducationUnitId(""); setClassId("");
  };
  return <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}><DialogTitle>Tạo lộ trình học tập</DialogTitle><DialogContent><Stack spacing={1.75} sx={{ pt: 1 }}><ErrorMessage error={error} /><TextField autoFocus fullWidth label="Tên lộ trình" onChange={(event) => setTitle(event.target.value)} required value={title} /><TextField fullWidth label="Mô tả" multiline minRows={3} onChange={(event) => setDescription(event.target.value)} value={description} /><TextField fullWidth label="Education unit ID (tuỳ chọn)" onChange={(event) => setEducationUnitId(event.target.value)} value={educationUnitId} /><TextField fullWidth label="Class ID (tuỳ chọn)" onChange={(event) => setClassId(event.target.value)} value={classId} /></Stack></DialogContent><DialogActions><Button onClick={onClose}>Huỷ</Button><Button disabled={pending || !title.trim()} onClick={() => void submit()} variant="contained">{pending ? "Đang tạo…" : "Tạo lộ trình"}</Button></DialogActions></Dialog>;
}

export function CreateCompetencyDialog({ error, onClose, onSubmit, open, pending }: { error: unknown; onClose: () => void; onSubmit: (input: CreateCompetencyInput) => Promise<void>; open: boolean; pending: boolean }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [educationUnitId, setEducationUnitId] = useState("");
  const submit = async () => {
    if (!code.trim() || !name.trim()) return;
    await onSubmit({ code: code.trim(), name: name.trim(), description: description.trim() || undefined, educationUnitId: educationUnitId.trim() || undefined });
    setCode(""); setName(""); setDescription(""); setEducationUnitId("");
  };
  return <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}><DialogTitle>Thêm năng lực</DialogTitle><DialogContent><Stack spacing={1.75} sx={{ pt: 1 }}><ErrorMessage error={error} /><TextField autoFocus fullWidth label="Mã năng lực" onChange={(event) => setCode(event.target.value)} required value={code} /><TextField fullWidth label="Tên năng lực" onChange={(event) => setName(event.target.value)} required value={name} /><TextField fullWidth label="Mô tả" multiline minRows={2} onChange={(event) => setDescription(event.target.value)} value={description} /><TextField fullWidth label="Education unit ID (tuỳ chọn)" onChange={(event) => setEducationUnitId(event.target.value)} value={educationUnitId} /></Stack></DialogContent><DialogActions><Button onClick={onClose}>Huỷ</Button><Button disabled={pending || !code.trim() || !name.trim()} onClick={() => void submit()} variant="contained">{pending ? "Đang lưu…" : "Lưu năng lực"}</Button></DialogActions></Dialog>;
}

export function AddPathNodeDialog({ error, expectedPathVersion, onClose, onSubmit, open, pending }: { error: unknown; expectedPathVersion: number; onClose: () => void; onSubmit: (input: AddPathNodeInput) => Promise<void>; open: boolean; pending: boolean }) {
  const [contentKind, setContentKind] = useState("CONTENT");
  const [contentRefId, setContentRefId] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [required, setRequired] = useState(true);
  const submit = async () => {
    if (!contentRefId.trim()) return;
    await onSubmit({ contentKind: contentKind.trim() || "CONTENT", contentRefId: contentRefId.trim(), expectedPathVersion, sortOrder: Math.max(0, Number(sortOrder) || 0), required });
    setContentRefId(""); setSortOrder("0"); setRequired(true);
  };
  return <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}><DialogTitle>Thêm nội dung vào lộ trình</DialogTitle><DialogContent><Stack spacing={1.75} sx={{ pt: 1 }}><ErrorMessage error={error} /><TextField autoFocus fullWidth label="Loại nội dung" onChange={(event) => setContentKind(event.target.value)} value={contentKind} /><TextField fullWidth label="Content reference ID" onChange={(event) => setContentRefId(event.target.value)} required value={contentRefId} /><TextField fullWidth label="Thứ tự" onChange={(event) => setSortOrder(event.target.value)} type="number" slotProps={{ htmlInput: { min: 0 } }} value={sortOrder} /><Button onClick={() => setRequired((current) => !current)} variant={required ? "contained" : "outlined"}>{required ? "Bắt buộc" : "Tuỳ chọn"}</Button></Stack></DialogContent><DialogActions><Button onClick={onClose}>Huỷ</Button><Button disabled={pending || !contentRefId.trim()} onClick={() => void submit()} variant="contained">{pending ? "Đang thêm…" : "Thêm nội dung"}</Button></DialogActions></Dialog>;
}

function ErrorMessage({ error }: { error: unknown }) {
  if (!error) return null;
  return <Alert severity="error">{error instanceof Error ? error.message : "Thao tác không thành công. Vui lòng thử lại."}</Alert>;
}
