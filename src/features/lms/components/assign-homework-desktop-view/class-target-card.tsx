import RefreshIcon from "@mui/icons-material/Refresh";
import Box from "@mui/material/Box";
import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgSearchField, ErgSelect } from "@/components/erg-mui/erg-form";
import {
  MobileStudentSelectionList,
  StudentSelectionTable,
} from "@/features/lms/components/assign-homework-parts";
import { TargetCardHeader, TargetCardShell } from "@/features/lms/components/assign-homework-desktop-view/target-card-layout";
import type { AssignHomeworkController } from "@/features/lms/components/use-assign-homework-controller";

export function ClassTargetCard({ model }: { model: AssignHomeworkController }) {
  const {
    classes,
    handleAssignmentClassChange,
    selectedStudentIds,
    setSelectedStudentIds,
    searchQuery,
    setSearchQuery,
    isClassLoading,
    assignmentClass,
    students,
    filteredStudents,
    allSelected,
    toggleSelectAll,
    toggleStudent,
  } = model;
  return (
    <TargetCardShell clip>
      <TargetCardHeader
        select={
          <ErgSelect
            label="Chọn lớp giao bài"
            size="small"
            value={assignmentClass?.id ?? ""}
            onChange={(event) => handleAssignmentClassChange(event.target.value)}
            options={classes.map((classroom) => ({ label: classroom.className, value: classroom.id }))}
            sx={{ minWidth: 260, width: "auto" }}
          />
        }
        selectedLabel={`${selectedStudentIds.size}/${students.length} học sinh`}
        aside={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
            <ErgSearchField
              placeholder="Tìm học sinh..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 208 }}
            />
            <ErgButton
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon fontSize="small" />}
              onClick={() => { setSearchQuery(""); setSelectedStudentIds(new Set(students.map((s) => s.id))); }}
            >
              Đặt lại
            </ErgButton>
          </Box>
        }
      />
      <MobileStudentSelectionList
        allSelected={allSelected}
        isLoading={isClassLoading}
        onToggleAll={toggleSelectAll}
        onToggleStudent={toggleStudent}
        selectedIds={selectedStudentIds}
        students={filteredStudents}
      />
      <StudentSelectionTable
        allSelected={allSelected}
        sx={{ display: { xs: "none", md: "block" } }}
        isLoading={isClassLoading}
        onToggleAll={toggleSelectAll}
        onToggleStudent={toggleStudent}
        selectedIds={selectedStudentIds}
        students={filteredStudents}
      />
    </TargetCardShell>
  );
}
