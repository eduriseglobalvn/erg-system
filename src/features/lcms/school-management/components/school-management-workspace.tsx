import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import FileUploadRoundedIcon from "@mui/icons-material/FileUploadRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { useState, type MouseEvent } from "react";
import { SchoolFormDialog } from "@/features/lcms/school-management/components/school-form-dialog";
import { SchoolListPanel } from "@/features/lcms/school-management/components/school-list-panel";
import { SchoolOverviewPanel } from "@/features/lcms/school-management/components/school-overview-panel";
import { SchoolReviewsPanel } from "@/features/lcms/school-management/components/school-reviews-panel";
import { SchoolStructurePanel } from "@/features/lcms/school-management/components/school-structure-panel";
import { SchoolStudentsPanel } from "@/features/lcms/school-management/components/school-students-panel";
import { StudentImportDialog } from "@/features/lcms/school-management/components/student-import-dialog";
import { useSchoolManagement } from "@/features/lcms/school-management/hooks/use-school-management";
import type { SchoolDraft, StudentImportRow } from "@/features/lcms/school-management/types/school-management-types";

const statusLabel = { active: "Đang vận hành", onboarding: "Đang triển khai", paused: "Tạm dừng" } as const;
const statusColor = { active: "success", onboarding: "warning", paused: "default" } as const;

export function SchoolManagementWorkspace() {
  const model = useSchoolManagement();
  const [tab, setTab] = useState(0);
  const [formMode, setFormMode] = useState<"add" | "edit" | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const school = model.selectedSchool;

  function saveSchool(draft: SchoolDraft) { model.saveSchool(draft, formMode === "edit" ? school?.id : undefined); }
  function importStudents(rows: StudentImportRow[]) {
    model.addStudents(rows.map((row) => ({ code: row.code || `${school?.id ?? "HS"}-${Date.now()}`, fullName: row.fullName, birthDate: row.birthDate, grade: row.grade, className: row.className, guardianPhone: row.guardianPhone, subjectIds: [], status: "studying" })));
  }

  return (
    <Box sx={{ bgcolor: "background.default", display: "flex", height: "calc(100vh - 96px)", minHeight: 650, overflow: "hidden" }}>
      <SchoolListPanel onAdd={() => setFormMode("add")} onSelect={(id) => { model.setSelectedSchoolId(id); setTab(0); }} schools={model.schools} selectedId={model.selectedSchoolId} />
      {school ? <Box sx={{ display: "flex", flex: 1, flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        <Box sx={{ bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider", px: { xs: 2, md: 3 }, pt: 2.5 }}>
          <Box sx={{ alignItems: { xs: "flex-start", md: "center" }, display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2, justifyContent: "space-between" }}>
            <Box sx={{ minWidth: 0 }}><Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1 }}><Typography sx={{ fontSize: { xs: 22, md: 26 }, fontWeight: 900 }}>{school.name}</Typography><Chip color={statusColor[school.status]} label={statusLabel[school.status]} size="small" /></Box><Typography color="text.secondary" variant="body2">ID: {school.id} · {school.address} · Liên kết từ {school.joinedAt}</Typography></Box>
            <Box sx={{ display: "flex", flexShrink: 0, gap: 1 }}><Button onClick={() => setImportOpen(true)} startIcon={<FileUploadRoundedIcon />} variant="contained">Nhập học sinh</Button><IconButton aria-label="Thêm thao tác trường" onClick={(event: MouseEvent<HTMLElement>) => setMenuAnchor(event.currentTarget)} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}><MoreVertRoundedIcon /></IconButton></Box>
          </Box>
          <Tabs onChange={(_, value) => setTab(value)} sx={{ mt: 2 }} value={tab} variant="scrollable"><Tab label="Tổng quan" /><Tab label={`Học sinh (${school.students.length})`} /><Tab label="Khối, lớp & môn học" /><Tab label={`Đánh giá (${school.reviews.length})`} /></Tabs>
        </Box>
        <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: { xs: 2, md: 3 } }}>{tab === 0 ? <SchoolOverviewPanel school={school} /> : null}{tab === 1 ? <SchoolStudentsPanel onImport={() => setImportOpen(true)} school={school} /> : null}{tab === 2 ? <SchoolStructurePanel school={school} /> : null}{tab === 3 ? <SchoolReviewsPanel school={school} /> : null}</Box>
        <Menu anchorEl={menuAnchor} onClose={() => setMenuAnchor(null)} open={Boolean(menuAnchor)}><MenuItem onClick={() => { setMenuAnchor(null); setFormMode("edit"); }}><EditRoundedIcon fontSize="small" sx={{ mr: 1.25 }} />Chỉnh sửa thông tin</MenuItem><MenuItem onClick={() => { setMenuAnchor(null); setDeleteOpen(true); }} sx={{ color: "error.main" }}><DeleteOutlineRoundedIcon fontSize="small" sx={{ mr: 1.25 }} />Xóa liên kết trường</MenuItem></Menu>
        {formMode ? <SchoolFormDialog onClose={() => setFormMode(null)} onSave={saveSchool} school={formMode === "edit" ? school : null} /> : null}
        {importOpen ? <StudentImportDialog onClose={() => setImportOpen(false)} onImport={importStudents} school={school} /> : null}
        <Dialog onClose={() => setDeleteOpen(false)} open={deleteOpen}><DialogTitle>Xóa liên kết với {school.name}?</DialogTitle><DialogContent><Typography color="text.secondary" variant="body2">Trường và dữ liệu cấu hình sẽ bị gỡ khỏi danh sách quản lý. Đây là thao tác có rủi ro và cần được xác nhận.</Typography></DialogContent><DialogActions><Button onClick={() => setDeleteOpen(false)}>Hủy</Button><Button color="error" onClick={() => { model.removeSchool(school.id); setDeleteOpen(false); }} variant="contained">Xóa trường</Button></DialogActions></Dialog>
      </Box> : <Box sx={{ alignItems: "center", display: "flex", flex: 1, justifyContent: "center" }}><Typography color="text.secondary">Chưa có trường liên kết. Hãy thêm trường đầu tiên.</Typography></Box>}
      {!school && formMode === "add" ? <SchoolFormDialog onClose={() => setFormMode(null)} onSave={saveSchool} /> : null}
    </Box>
  );
}
