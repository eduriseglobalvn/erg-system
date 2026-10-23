import { useEffect, useMemo, useState } from "react";
import CalendarMonth from "@mui/icons-material/CalendarMonth";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Skeleton from "@mui/material/Skeleton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { toast } from "sonner";

import { useCurriculumProgramQuery, useSaveCurriculumProgramMutation } from "@/features/lcms/admin-operations/api/curriculum-program-query";
import type { CurriculumProgramRow } from "@/features/lcms/admin-operations/api/curriculum-program-api";
import { buildEditableCurriculumProgramRows } from "@/features/lcms/admin-operations/utils/curriculum-schedule-model";
import type { CurriculumRoadmapStage } from "@/features/lcms/admin-operations/utils/learning-resource-curriculum-view-model";
import type { StudioSubject } from "@/features/lcms/admin-operations/types/learning-resource-authoring";

export function CurriculumTeachingPlanDialog({
  open,
  onClose,
  subject,
  stages,
}: {
  open: boolean;
  onClose: () => void;
  subject?: StudioSubject;
  stages: CurriculumRoadmapStage[];
}) {
  const [levelId, setLevelId] = useState("");
  const [academicYear, setAcademicYear] = useState("2026-2027");
  const programScope = { subjectId: subject?.id, levelId, academicYear };
  const programQuery = useCurriculumProgramQuery(programScope);
  const saveProgramMutation = useSaveCurriculumProgramMutation(programScope);
  const [rows, setRows] = useState<CurriculumProgramRow[]>([]);

  useEffect(() => {
    if (!levelId && stages[0]) setLevelId(stages[0].level.target.id);
  }, [levelId, stages]);

  useEffect(() => {
    const stage = stages.find((candidate) => candidate.level.target.id === levelId);
    if (programQuery.data) {
      setRows(programQuery.data.rows);
    } else if (stage) {
      setRows(buildEditableCurriculumProgramRows(stage));
    } else {
      setRows([]);
    }
  }, [levelId, programQuery.data, stages]);

  const selectedStage = stages.find((candidate) => candidate.level.target.id === levelId);
  const topicGroups = useMemo(() => buildTopicGroups(rows), [rows]);
  const totalSessions = useMemo(() => rows.reduce((sum, r) => sum + (Number(r.sessions) || 0), 0), [rows]);
  const canSave = Boolean(subject?.id && levelId && academicYear && rows.length);

  function updateRow(index: number, patch: Partial<CurriculumProgramRow>) {
    setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  }

  function updateTopicGroup(index: number, topic: string) {
    const group = topicGroups.find((candidate) => index >= candidate.start && index < candidate.end);
    if (!group) return updateRow(index, { topic });
    setRows((current) => current.map((row, rowIndex) => (rowIndex >= group.start && rowIndex < group.end ? { ...row, topic } : row)));
  }

  function addRow() {
    setRows((current) => [...current, { topic: "Chưa phân chủ đề", period: current.length + 1, title: "Bài học mới", sessions: 1 }]);
  }

  function removeRow(index: number) {
    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index).map((row, rowIndex) => ({ ...row, period: rowIndex + 1 })));
  }

  async function save() {
    if (!canSave) return;
    await saveProgramMutation.mutateAsync({
      name: `Khung chương trình ${subject?.label ?? "môn học"} · ${selectedStage?.level.title ?? "Level"}`,
      status: "published",
      expectedVersion: programQuery.data?.recordVersion,
      rows,
    });
    toast.success("Đã lưu khung chương trình môn học.");
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <CalendarMonth color="primary" /> Khung chương trình môn học · {subject?.label ?? "Chưa chọn môn"}
      </DialogTitle>
      <DialogContent dividers sx={{ display: "grid", gap: 2 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.2fr 1fr 1.5fr" }, gap: 1.5, alignItems: "center" }}>
          <FormControl size="small">
            <InputLabel>Level (Chặng học)</InputLabel>
            <Select label="Level (Chặng học)" value={levelId} onChange={(event) => setLevelId(event.target.value)}>
              {stages.map((stage) => (
                <MenuItem key={stage.level.target.id} value={stage.level.target.id}>
                  {stage.level.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField size="small" label="Năm học" value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} />
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 1.5,
              px: 2,
              py: 1,
              borderRadius: 1.5,
              bgcolor: "#F4F7FB",
              border: "1px solid #D9E2EF",
            }}
          >
            <Typography sx={{ fontSize: 13, color: "#52606D" }}>
              Số bài: <strong style={{ color: "#172033" }}>{rows.length}</strong> bài
            </Typography>
            <Box sx={{ width: 1, height: 16, bgcolor: "#D9E2EF" }} />
            <Typography sx={{ fontSize: 13, color: "#52606D" }}>
              Tổng thời lượng: <strong style={{ color: "#0F6CBD" }}>{totalSessions} tiết</strong>
            </Typography>
          </Box>
        </Box>

        {programQuery.isLoading ? <Skeleton height={180} variant="rounded" /> : null}
        {!programQuery.isLoading && levelId && !programQuery.data ? (
          <Alert severity="info">
            Level này chưa có khung chương trình riêng. Cấu trúc bài học mẫu được tự động lấy từ danh sách bài học, bạn có thể phân bổ số tiết rồi bấm &quot;Lưu khung chương trình&quot;.
          </Alert>
        ) : null}

        <Box sx={{ border: "1px solid", borderColor: "#D9E2EF", borderRadius: 2, overflow: "auto", maxHeight: 420, bgcolor: "white" }}>
          <Box
            component="table"
            sx={{
              width: "100%",
              minWidth: 860,
              borderCollapse: "collapse",
              color: "#1C252E",
              "th,td": { border: "1px solid #D9E2EF", px: 0.75, py: 0.5, textAlign: "left", fontSize: 12 },
              thead: { position: "sticky", top: 0, zIndex: 2 },
              "thead tr:first-of-type th": {
                bgcolor: "#FFFFFF",
                color: "#1C252E",
                fontSize: 15,
                fontWeight: 800,
                lineHeight: "22px",
                py: 0.75,
                textAlign: "center",
              },
              "thead tr:nth-of-type(2) th": { bgcolor: "#FFFFFF", color: "#1C252E", fontSize: 14, fontWeight: 800, py: 0.5, textAlign: "center" },
              "thead tr:last-of-type th": { bgcolor: "#F4F6F8", color: "#52616F", fontWeight: 700, py: 0.5, textAlign: "center" },
            }}
          >
            <thead>
              <tr>
                <th colSpan={5}>KHUNG CHƯƠNG TRÌNH MÔN HỌC</th>
              </tr>
              <tr>
                <th colSpan={5}>
                  {subject?.label ?? "Chưa chọn môn"} · {selectedStage?.level.title ?? "Chưa chọn level"} · Năm học {academicYear}
                </th>
              </tr>
              <tr>
                <th style={{ width: "25%" }}>Chủ đề</th>
                <th style={{ width: 64 }}>Tiết</th>
                <th>Tên bài học</th>
                <th style={{ width: 84 }}>Số tiết</th>
                <th style={{ width: 64 }}>Xóa</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const group = topicGroups.find((candidate) => index === candidate.start);
                const isGroupStart = Boolean(group);
                return (
                  <tr key={row.id ?? `new-${index}`} style={{ backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#FBFCFF" }}>
                    {isGroupStart ? (
                      <td rowSpan={group?.count} style={{ verticalAlign: "middle", backgroundColor: "#FBFCFF" }}>
                        <TextField size="small" value={row.topic} onChange={(event) => updateTopicGroup(index, event.target.value)} fullWidth multiline minRows={2} />
                      </td>
                    ) : null}
                    <td style={{ textAlign: "center" }}>
                      <TextField size="small" type="number" value={row.period} onChange={(event) => updateRow(index, { period: Math.max(1, Number(event.target.value)) })} sx={{ width: 62 }} />
                    </td>
                    <td>
                      <TextField size="small" value={row.title} onChange={(event) => updateRow(index, { title: event.target.value })} fullWidth />
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <TextField size="small" type="number" value={row.sessions} onChange={(event) => updateRow(index, { sessions: Math.max(1, Number(event.target.value)) })} sx={{ width: 72 }} />
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <Button color="error" size="small" onClick={() => removeRow(index)} sx={{ minWidth: 52, textTransform: "none" }}>
                        Xóa
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Box>
          {!rows.length ? <Typography color="text.secondary" sx={{ p: 3, textAlign: "center" }}>Level chưa có dòng khung chương trình. Bấm “+ Thêm dòng bài học” để bắt đầu.</Typography> : null}
        </Box>
        <Button onClick={addRow} sx={{ justifySelf: "start", textTransform: "none" }}>
          + Thêm dòng bài học
        </Button>
        {saveProgramMutation.error ? (
          <Alert severity="error">{saveProgramMutation.error instanceof Error ? saveProgramMutation.error.message : "Không thể lưu khung chương trình."}</Alert>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Đóng</Button>
        <Button variant="contained" disabled={!canSave || saveProgramMutation.isPending} onClick={() => void save()}>
          {saveProgramMutation.isPending ? "Đang lưu…" : "Lưu khung chương trình"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function buildTopicGroups(rows: CurriculumProgramRow[]) {
  const groups: Array<{ start: number; end: number; count: number }> = [];
  rows.forEach((row, index) => {
    if (index === 0 || row.topic !== rows[index - 1]?.topic) groups.push({ start: index, end: index + 1, count: 1 });
    else {
      const current = groups[groups.length - 1];
      current.end = index + 1;
      current.count += 1;
    }
  });
  return groups;
}
