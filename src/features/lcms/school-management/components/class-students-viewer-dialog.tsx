import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";
import type { ClassImportPreviewRow } from "@/features/lcms/school-management/components/class-import-utils";
import type { StudentImportRow } from "@/features/lcms/school-management/types/school-management-types";

export function ClassStudentsViewerDialog({
  classRow,
  onClose,
  onSaveSelection,
}: {
  classRow: ClassImportPreviewRow;
  onClose: () => void;
  onSaveSelection: (updatedStudents: StudentImportRow[]) => void;
}) {
  const [filterText, setFilterText] = useState("");
  const allStudents: StudentImportRow[] = useMemo(() => classRow.students ?? [], [classRow.students]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(allStudents.map((s, idx) => s.id || `s-${idx}`))
  );

  const filteredStudents = useMemo(() => (
    allStudents.filter((s) =>
      `${s.fullName} ${s.code || ""} ${s.className || ""}`.toLowerCase().includes(filterText.toLowerCase().trim())
    )
  ), [allStudents, filterText]);

  const allFilteredSelected = filteredStudents.length > 0 && filteredStudents.every((s, idx) => selectedIds.has(s.id || `s-${idx}`));
  const someFilteredSelected = filteredStudents.some((s, idx) => selectedIds.has(s.id || `s-${idx}`)) && !allFilteredSelected;

  function handleToggleAllFiltered() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredStudents.forEach((s, idx) => next.delete(s.id || `s-${idx}`));
      } else {
        filteredStudents.forEach((s, idx) => next.add(s.id || `s-${idx}`));
      }
      return next;
    });
  }

  function handleToggleStudent(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSelectAll() {
    setSelectedIds(new Set(allStudents.map((s, idx) => s.id || `s-${idx}`)));
  }

  function handleDeselectAll() {
    setSelectedIds(new Set());
  }

  function handleSelectOnlyValid() {
    const next = new Set<string>();
    allStudents.forEach((s, idx) => {
      if (s.valid) next.add(s.id || `s-${idx}`);
    });
    setSelectedIds(next);
  }

  function handleSave() {
    const updated = allStudents.filter((s, idx) => selectedIds.has(s.id || `s-${idx}`));
    onSaveSelection(updated);
  }

  return (
    <Dialog fullWidth maxWidth="lg" onClose={onClose} open slotProps={{ paper: { sx: { maxHeight: "90dvh" } } }}>
      <DialogTitle sx={{ borderBottom: "1px solid", borderColor: "divider", pb: 1.5 }}>
        <Box sx={{ alignItems: { xs: "flex-start", sm: "center" }, display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5, justifyContent: "space-between" }}>
          <Box>
            <Typography sx={{ fontSize: 19, fontWeight: 600 }}>
              Danh sách học sinh lớp {classRow.name}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Khối {classRow.grade || "—"} · Giáo viên phụ trách: {classRow.homeroomTeacher || "Chưa gán"} · Tổng {allStudents.length} học sinh trong sheet
            </Typography>
          </Box>
          <Chip
            color="primary"
            label={`Đã chọn ${selectedIds.size} / ${allStudents.length} HS`}
            size="medium"
            sx={{ fontWeight: 600, px: 0.5 }}
          />
        </Box>
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, minHeight: 380, pt: 2.5 }}>
        <Box sx={{ alignItems: { xs: "stretch", sm: "center" }, display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5, justifyContent: "space-between" }}>
          <TextField
            label="Tìm học sinh theo tên, mã hoặc lớp..."
            onChange={(e) => setFilterText(e.target.value)}
            size="small"
            sx={{ minWidth: { sm: 320 } }}
            value={filterText}
          />
          <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1 }}>
            <Button onClick={handleSelectAll} size="small" sx={{ fontSize: 12, fontWeight: 600, textTransform: "none" }} variant="text">
              Chọn tất cả ({allStudents.length})
            </Button>
            <Button color="inherit" onClick={handleDeselectAll} size="small" sx={{ fontSize: 12, textTransform: "none" }} variant="text">
              Bỏ chọn
            </Button>
            <Button color="success" onClick={handleSelectOnlyValid} size="small" sx={{ fontSize: 12, fontWeight: 600, textTransform: "none" }} variant="outlined">
              Chỉ chọn hợp lệ
            </Button>
          </Box>
        </Box>
        <TableContainer sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, maxHeight: { xs: 400, md: "min(560px, 60vh)" } }}>
          <Table size="small" stickyHeader sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={allFilteredSelected}
                    indeterminate={someFilteredSelected}
                    onChange={handleToggleAllFiltered}
                    size="small"
                  />
                </TableCell>
                <TableCell sx={{ width: 60 }}>STT</TableCell>
                <TableCell>Họ và tên</TableCell>
                <TableCell>Khối</TableCell>
                <TableCell>Lớp</TableCell>
                <TableCell>Mã học sinh</TableCell>
                <TableCell>Điện thoại / Liên hệ</TableCell>
                <TableCell>Trạng thái</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStudents.map((student, idx) => {
                const sId = student.id || `s-${idx}`;
                const isSelected = selectedIds.has(sId);
                return (
                  <TableRow
                    hover
                    key={sId}
                    selected={isSelected}
                    sx={{
                      bgcolor: isSelected ? "action.hover" : undefined,
                      opacity: isSelected ? 1 : 0.65,
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleToggleStudent(sId)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell sx={{ fontSize: 14, fontWeight: 600 }}>{student.fullName}</TableCell>
                    <TableCell>{student.grade || classRow.grade || "—"}</TableCell>
                    <TableCell>{student.className || classRow.name}</TableCell>
                    <TableCell sx={{ color: "text.secondary", fontFamily: "var(--font-mono)", fontSize: 12 }}>
                      {student.code || "—"}
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary", fontSize: 13 }}>
                      {student.guardianPhone || "—"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={student.valid ? "success" : "warning"}
                        icon={student.valid ? <CheckCircleRoundedIcon fontSize="small" /> : undefined}
                        label={student.valid ? "Hợp lệ" : student.note}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
              {!filteredStudents.length ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ color: "text.secondary", py: 5, textAlign: "center" }}>
                    {filterText ? "Không tìm thấy học sinh nào phù hợp từ khóa tìm kiếm." : "Không có học sinh nào trong lớp này."}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions sx={{ borderTop: "1px solid", borderColor: "divider", justifyContent: "space-between", px: 3, py: 2 }}>
        <Typography color="text.secondary" variant="body2">
          Đang chọn {selectedIds.size} / {allStudents.length} học sinh để nạp vào lớp {classRow.name}
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button onClick={onClose} variant="outlined">
            Đóng
          </Button>
          <Button
            onClick={handleSave}
            startIcon={<CheckCircleRoundedIcon />}
            variant="contained"
          >
            Lưu danh sách đã chọn ({selectedIds.size} HS)
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
