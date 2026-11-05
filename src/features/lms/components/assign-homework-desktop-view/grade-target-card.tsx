import RefreshIcon from "@mui/icons-material/Refresh";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgSearchField, ErgSelect } from "@/components/erg-mui/erg-form";
import { ErgTable } from "@/components/erg-mui/erg-table";
import {
  AssignmentCheckbox,
  MobileGradeClassList,
  StudentSelectionTable,
} from "@/features/lms/components/assign-homework-parts";
import {
  TargetCardHeader,
  TargetCardShell,
  TargetPreviewPanel,
} from "@/features/lms/components/assign-homework-desktop-view/target-card-layout";
import type { AssignHomeworkController } from "@/features/lms/components/use-assign-homework-controller";

export function GradeTargetCard({ model }: { model: AssignHomeworkController }) {
  const {
    selectedGradeLabel,
    setSelectedGradeLabel,
    selectedGradeClassIds,
    setSelectedGradeClassIds,
    setPreviewGradeClassId,
    gradeStudentSearch,
    setGradeStudentSearch,
    selectedGradeStudentIdsByClass,
    gradeOptions,
    gradeClasses,
    getGradeStudentsForClassId,
    gradeStudentIdsByClass,
    previewGradeClass,
    previewGradeClassStudents,
    selectedPopupStudentIds,
    filteredPreviewGradeClassStudents,
    allGradeClassesSelected,
    allPreviewStudentsSelected,
    toggleGradeClass,
    toggleAllGradeClasses,
    openGradeClassPreview,
    togglePreviewStudent,
    toggleAllPreviewStudents,
    resetPreviewStudents,
  } = model;
  return (
    <TargetCardShell>
      <TargetCardHeader
        select={
          <ErgSelect
            label="Chọn khối giao bài"
            size="small"
            value={selectedGradeLabel}
            onChange={(event) => {
              setSelectedGradeLabel(event.target.value);
              setSelectedGradeClassIds(new Set());
              setPreviewGradeClassId(null);
            }}
            options={gradeOptions.map((grade) => ({ label: grade, value: grade }))}
            sx={{ minWidth: 260, width: "auto" }}
          />
        }
        selectedLabel={`${selectedGradeClassIds.size}/${gradeClasses.length} lớp`}
        aside={
          <Typography variant="body2" sx={{ maxWidth: 448, color: "text.secondary", fontWeight: "fontWeightMedium" }}>
            Chọn các lớp cần giao trong khối. Click vào tên lớp để xem và tinh chỉnh danh sách học sinh của lớp đó.
          </Typography>
        }
      />

      <Box sx={{ position: "relative", minHeight: 0, flex: 1, overflowY: "auto" }}>
        <MobileGradeClassList
          classes={gradeClasses}
          onOpenPreview={openGradeClassPreview}
          onToggleClass={toggleGradeClass}
          selectedClassIds={selectedGradeClassIds}
          studentIdsByClass={gradeStudentIdsByClass}
          selectedStudentIdsByClass={selectedGradeStudentIdsByClass}
        />
        <ErgTable sx={{ display: { xs: "none", md: "table" }, width: "100%" }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ px: 2.5, width: 48 }}>
                <AssignmentCheckbox checked={allGradeClassesSelected} onChange={toggleAllGradeClasses} label="Chọn tất cả lớp trong khối" />
              </TableCell>
              <TableCell align="center" sx={{ width: 56 }}>STT</TableCell>
              <TableCell>Lớp</TableCell>
              <TableCell sx={{ width: 192 }}>Trường</TableCell>
              <TableCell sx={{ width: 128 }}>Sỉ số</TableCell>
              <TableCell sx={{ width: 128 }}>Đã chọn</TableCell>
              <TableCell sx={{ width: 144 }}>Bài đang mở</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {gradeClasses.map((classroom, index) => {
              const isChecked = selectedGradeClassIds.has(classroom.id);
              const classStudents = getGradeStudentsForClassId(classroom.id);
              const selectedStudentCount = selectedGradeStudentIdsByClass[classroom.id]?.length ?? classStudents.length;
              return (
                <TableRow
                  key={classroom.id}
                  onClick={() => toggleGradeClass(classroom.id)}
                  sx={{ cursor: "pointer", userSelect: "none", bgcolor: isChecked ? "info.light" : "background.paper" }}
                >
                  <TableCell align="center" sx={{ px: 2.5 }}>
                    <AssignmentCheckbox checked={isChecked} onChange={() => toggleGradeClass(classroom.id)} label={`Chọn lớp ${classroom.className}`} />
                  </TableCell>
                  <TableCell align="center" sx={{ color: "text.secondary", fontWeight: "fontWeightMedium" }}>{index + 1}</TableCell>
                  <TableCell>
                    <ButtonBase
                      onClick={(event) => {
                        event.stopPropagation();
                        openGradeClassPreview(classroom.id);
                      }}
                      sx={{ typography: "body2", fontWeight: "fontWeightMedium", color: "primary.main", "&:hover": { textDecoration: "underline" } }}
                    >
                      {classroom.className}
                    </ButtonBase>
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary", fontWeight: "fontWeightMedium" }}>{classroom.schoolName}</TableCell>
                  <TableCell sx={{ fontWeight: "fontWeightMedium" }}>{classroom.studentCount} học sinh</TableCell>
                  <TableCell>
                    <Typography component="span" variant="body2" sx={{ display: "inline-flex", borderRadius: 1, bgcolor: "info.light", px: 1.25, py: 0.5, fontWeight: "fontWeightBold", color: "primary.main" }}>
                      {selectedStudentCount}/{classStudents.length} HS
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontWeight: "fontWeightMedium" }}>{classroom.activeAssignments} bài</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </ErgTable>

        {previewGradeClass ? (
          <TargetPreviewPanel
            title={previewGradeClass.className}
            meta={`${selectedPopupStudentIds.size}/${previewGradeClassStudents.length} học sinh đang chọn`}
            actions={
              <>
                <ErgButton variant="outlined" size="small" startIcon={<RefreshIcon fontSize="small" />} onClick={resetPreviewStudents}>
                  Đặt lại
                </ErgButton>
                <ErgButton variant="outlined" size="small" onClick={() => setPreviewGradeClassId(null)}>
                  Đóng
                </ErgButton>
              </>
            }
            search={
              <ErgSearchField
                placeholder="Tìm học sinh trong lớp..."
                value={gradeStudentSearch}
                onChange={(event) => setGradeStudentSearch(event.target.value)}
              />
            }
          >
            <StudentSelectionTable
              allSelected={allPreviewStudentsSelected}
              sx={{ borderTop: 1, borderColor: "divider" }}
              onToggleAll={toggleAllPreviewStudents}
              onToggleStudent={togglePreviewStudent}
              selectedIds={selectedPopupStudentIds}
              students={filteredPreviewGradeClassStudents}
            />
          </TargetPreviewPanel>
        ) : null}
      </Box>
    </TargetCardShell>
  );
}
