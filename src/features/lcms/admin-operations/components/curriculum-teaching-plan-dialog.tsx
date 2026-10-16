import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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

import { useCurriculumTeachingPlanQuery, useSaveCurriculumTeachingPlanMutation } from "@/features/lms/api/curriculum-teaching-plan-query";
import { useCurriculumProgramQuery, useSaveCurriculumProgramMutation } from "@/features/lcms/admin-operations/api/curriculum-program-query";
import type { CurriculumProgramRow } from "@/features/lcms/admin-operations/api/curriculum-program-api";
import { getSchoolDirectory, schoolManagementQueryKeys } from "@/features/lcms/school-management/api/school-management-api";
import { buildEditableCurriculumProgramRows } from "@/features/lcms/admin-operations/utils/curriculum-schedule-model";
import type { CurriculumRoadmapStage } from "@/features/lcms/admin-operations/utils/learning-resource-curriculum-view-model";
import type { StudioSubject } from "@/features/lcms/admin-operations/types/learning-resource-authoring";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { getCurrentAccount } from "@/platform/auth/api/auth-storage";

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

export function CurriculumTeachingPlanDialog({ open, onClose, subject, stages }: { open: boolean; onClose: () => void; subject?: StudioSubject; stages: CurriculumRoadmapStage[] }) {
  const tenantId = getDefaultTenantId();
  const accountId = getCurrentAccount()?.id ?? "anonymous";
  const schoolsQuery = useQuery({ queryKey: schoolManagementQueryKeys.directory(tenantId, accountId), queryFn: ({ signal }) => getSchoolDirectory("", signal), enabled: open });
  const schools = useMemo(() => schoolsQuery.data?.items ?? [], [schoolsQuery.data?.items]);
  const [schoolId, setSchoolId] = useState("");
  const [levelId, setLevelId] = useState("");
  const selectedSchool = schools.find((school) => school.id === schoolId);
  const [academicYear, setAcademicYear] = useState("2026-2027");
  const [startDate, setStartDate] = useState("2026-09-01");
  const [sessionsPerDay, setSessionsPerDay] = useState(1);
  const scope = { schoolId, subjectId: subject?.id, academicYear };
  const planQuery = useCurriculumTeachingPlanQuery(scope);
  const saveMutation = useSaveCurriculumTeachingPlanMutation(scope);
  const programScope = { subjectId: subject?.id, levelId, academicYear };
  const programQuery = useCurriculumProgramQuery(programScope);
  const saveProgramMutation = useSaveCurriculumProgramMutation(programScope);
  const [rows, setRows] = useState<CurriculumProgramRow[]>([]);

  useEffect(() => {
    if (!schoolId && schools[0]) setSchoolId(schools[0].id);
  }, [schoolId, schools]);
  useEffect(() => {
    if (selectedSchool?.academicYear) setAcademicYear(selectedSchool.academicYear.replace("–", "-"));
  }, [selectedSchool?.academicYear]);
  useEffect(() => {
    if (!planQuery.data) return;
    setStartDate(planQuery.data.startDate);
    setSessionsPerDay(planQuery.data.sessionsPerDay);
  }, [planQuery.data]);
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
  const canSave = Boolean(schoolId && subject?.id && levelId && academicYear && startDate && sessionsPerDay > 0 && rows.length);

  function updateRow(index: number, patch: Partial<CurriculumProgramRow>) {
    setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  }

  function updateTopicGroup(index: number, topic: string) {
    const group = topicGroups.find((candidate) => index >= candidate.start && index < candidate.end);
    if (!group) return updateRow(index, { topic });
    setRows((current) => current.map((row, rowIndex) => rowIndex >= group.start && rowIndex < group.end ? { ...row, topic } : row));
  }

  function addRow() {
    setRows((current) => [...current, { topic: "Chưa phân chủ đề", period: current.length + 1, title: "Bài học mới", sessions: 1 }]);
  }

  function removeRow(index: number) {
    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index).map((row, rowIndex) => ({ ...row, period: rowIndex + 1 })));
  }

  async function save() {
    if (!canSave) return;
    await saveMutation.mutateAsync({ startDate, teachingDays: EVERY_DAY, sessionsPerDay, timezone: "Asia/Ho_Chi_Minh", status: "active", expectedVersion: planQuery.data?.recordVersion });
    await saveProgramMutation.mutateAsync({ name: `PPCT ${subject?.label ?? "môn học"} · ${selectedStage?.level.title ?? "level"}`, status: "published", expectedVersion: programQuery.data?.recordVersion, rows });
    toast.success("Đã lưu phân phối chương trình và lịch dạy.");
  }

  return <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
    <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}><CalendarMonth color="primary" /> Phân phối chương trình · {subject?.label ?? "Chưa chọn môn"}</DialogTitle>
    <DialogContent dividers sx={{ display: "grid", gap: 2 }}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.2fr 1fr 1fr 1fr" }, gap: 1.5 }}>
        <FormControl size="small"><InputLabel>Trường</InputLabel><Select label="Trường" value={schoolId} onChange={(event) => setSchoolId(event.target.value)}>{schools.map((school) => <MenuItem key={school.id} value={school.id}>{school.name}</MenuItem>)}</Select></FormControl>
        <FormControl size="small"><InputLabel>Level</InputLabel><Select label="Level" value={levelId} onChange={(event) => setLevelId(event.target.value)}>{stages.map((stage) => <MenuItem key={stage.level.target.id} value={stage.level.target.id}>{stage.level.title}</MenuItem>)}</Select></FormControl>
        <TextField size="small" label="Năm học" value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} />
        <TextField size="small" label="Ngày bắt đầu" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField size="small" label="Số tiết mỗi ngày" type="number" value={sessionsPerDay} onChange={(event) => setSessionsPerDay(Math.max(1, Math.min(8, Number(event.target.value))))} slotProps={{ htmlInput: { min: 1, max: 8 } }} />
      </Box>
      {schoolsQuery.isLoading || planQuery.isLoading || programQuery.isLoading ? <Skeleton height={180} variant="rounded" /> : null}
      {!schoolsQuery.isLoading && !schools.length ? <Alert severity="warning">Không tải được danh sách trường. Tài khoản cần quyền quản lý curriculum.</Alert> : null}
      {!programQuery.isLoading && levelId && !programQuery.data ? <Alert severity="info">Level này chưa có PPCT. Bạn có thể chỉnh các dòng mẫu rồi lưu.</Alert> : null}
      <Box sx={{ border: "1px solid", borderColor: "#D9E2EF", borderRadius: 2, overflow: "auto", maxHeight: 390, bgcolor: "white" }}>
        <Box component="table" sx={{ width: "100%", minWidth: 920, borderCollapse: "collapse", color: "#1C252E", "th,td": { border: "1px solid #D9E2EF", px: 0.75, py: 0.5, textAlign: "left", fontSize: 12 }, thead: { position: "sticky", top: 0, zIndex: 2 }, "thead tr:first-of-type th": { bgcolor: "#FFFFFF", color: "#1C252E", fontSize: 15, fontWeight: 800, lineHeight: "22px", py: 0.75, textAlign: "center" }, "thead tr:nth-of-type(2) th": { bgcolor: "#FFFFFF", color: "#1C252E", fontSize: 14, fontWeight: 800, py: 0.5, textAlign: "center" }, "thead tr:last-of-type th": { bgcolor: "#F4F6F8", color: "#52616F", fontWeight: 700, py: 0.5, textAlign: "center" } }}>
          <thead>
            <tr><th colSpan={5}>KHUNG CHƯƠNG TRÌNH TIN HỌC QUỐC TẾ</th></tr>
            <tr><th colSpan={5}>{subject?.label ?? "Chưa chọn môn"} · {selectedStage?.level.title ?? "Chưa chọn level"}</th></tr>
            <tr><th style={{ width: "25%" }}>Chủ đề</th><th style={{ width: 64 }}>Tiết</th><th>Tên bài học</th><th style={{ width: 84 }}>Số tiết</th><th style={{ width: 64 }}>Xóa</th></tr>
          </thead>
          <tbody>{rows.map((row, index) => {
            const group = topicGroups.find((candidate) => index === candidate.start);
            const isGroupStart = Boolean(group);
            return <tr key={row.id ?? `new-${index}`} style={{ backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#FBFCFF" }}>
              {isGroupStart ? <td rowSpan={group?.count} style={{ verticalAlign: "middle", backgroundColor: "#FBFCFF" }}><TextField size="small" value={row.topic} onChange={(event) => updateTopicGroup(index, event.target.value)} fullWidth multiline minRows={2} /></td> : null}
              <td style={{ textAlign: "center" }}><TextField size="small" type="number" value={row.period} onChange={(event) => updateRow(index, { period: Math.max(1, Number(event.target.value)) })} sx={{ width: 62 }} /></td>
              <td><TextField size="small" value={row.title} onChange={(event) => updateRow(index, { title: event.target.value })} fullWidth /></td>
              <td style={{ textAlign: "center" }}><TextField size="small" type="number" value={row.sessions} onChange={(event) => updateRow(index, { sessions: Math.max(1, Number(event.target.value)) })} sx={{ width: 72 }} /></td>
              <td style={{ textAlign: "center" }}><Button color="error" size="small" onClick={() => removeRow(index)} sx={{ minWidth: 52, textTransform: "none" }}>Xóa</Button></td>
            </tr>;
          })}</tbody>
        </Box>
        {!rows.length ? <Typography color="text.secondary" sx={{ p: 3, textAlign: "center" }}>Level chưa có dòng PPCT. Bấm “Thêm dòng” để bắt đầu.</Typography> : null}
      </Box>
      <Button onClick={addRow} sx={{ justifySelf: "start", textTransform: "none" }}>+ Thêm dòng PPCT</Button>
      {saveMutation.error ? <Alert severity="error">{saveMutation.error instanceof Error ? saveMutation.error.message : "Không thể lưu lịch dạy."}</Alert> : null}
    </DialogContent>
    <DialogActions><Button onClick={onClose}>Đóng</Button><Button variant="contained" disabled={!canSave || saveMutation.isPending || saveProgramMutation.isPending} onClick={() => void save()}>{saveMutation.isPending || saveProgramMutation.isPending ? "Đang lưu…" : "Lưu PPCT"}</Button></DialogActions>
  </Dialog>;
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
