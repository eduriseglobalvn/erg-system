import { useState } from "react";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgSelect } from "@/components/erg-mui/erg-form";
import { ergChipTabsSx, ergSegmentedTabsSx } from "@/components/erg-mui/erg-tabs";
import { allGroupSourcesFilterValue } from "@/features/lms/components/assign-homework-groups";
import { MobileFormSection, MobileRowText, mobileCardSx, mobileRowSx } from "@/features/lms/components/assign-homework-mobile/mobile-form-section";
import { StudentPickerSheet } from "@/features/lms/components/assign-homework-mobile/student-picker-sheet";
import { MobileAssignmentGroupList, MobileGradeClassList } from "@/features/lms/components/assign-homework-parts";
import type { AssignHomeworkController } from "@/features/lms/components/use-assign-homework-controller";

type TargetType = AssignHomeworkController["targetType"];

const TARGETS: Array<{ label: string; value: TargetType }> = [
  { label: "Theo lớp", value: "class" },
  { label: "Theo khối", value: "grade" },
  { label: "Theo nhóm", value: "group" },
];

/** N8 section 2: who receives it. The app targets a class (with a student pick), a grade or study groups. */
export function TargetSection({ model: m }: { model: AssignHomeworkController }) {
  const [classPickerOpen, setClassPickerOpen] = useState(false);

  return (
    <MobileFormSection hint={m.targetType === "group" ? "Mở “Xem” trên một nhóm để bỏ bớt học sinh." : undefined} number={2} title="Giao cho">
      <Tabs aria-label="Đối tượng giao bài" onChange={(_, value: TargetType) => m.setTargetType(value)} sx={ergSegmentedTabsSx} value={m.targetType} variant="fullWidth">
        {TARGETS.map((target) => <Tab key={target.value} label={target.label} value={target.value} />)}
      </Tabs>

      {m.targetType === "class" ? (
        <>
          <Tabs aria-label="Lớp" onChange={(_, classId: string) => m.handleAssignmentClassChange(classId)} scrollButtons={false} sx={ergChipTabsSx} value={m.assignmentClass?.id ?? false} variant="scrollable">
            {m.classes.map((classroom) => (
              <Tab key={classroom.id} label={classroom.studentCount ? `${classroom.className} · ${classroom.studentCount} HS` : classroom.className} value={classroom.id} />
            ))}
          </Tabs>
          <Box sx={{ ...mobileCardSx, ...mobileRowSx }}>
            <MobileRowText meta={`${m.selectedStudentIds.size}/${m.students.length} học sinh đã chọn`} title="Học sinh nhận bài" />
            <ErgButton onClick={() => setClassPickerOpen(true)} size="small" variant="text">Chọn</ErgButton>
          </Box>
          <StudentPickerSheet
            allSelected={m.allSelected}
            isLoading={m.isClassLoading}
            onClose={() => setClassPickerOpen(false)}
            onReset={() => {
              m.setSearchQuery("");
              m.setSelectedStudentIds(new Set(m.students.map((student) => student.id)));
            }}
            onToggleAll={m.toggleSelectAll}
            onToggleStudent={m.toggleStudent}
            search={m.searchQuery}
            selectedIds={m.selectedStudentIds}
            setSearch={m.setSearchQuery}
            students={m.filteredStudents}
            title={classPickerOpen ? (m.assignmentClass?.className ?? "Học sinh") : null}
            total={m.students.length}
          />
        </>
      ) : m.targetType === "grade" ? (
        <>
          <Tabs
            aria-label="Khối"
            onChange={(_, grade: string) => {
              m.setSelectedGradeLabel(grade);
              m.setSelectedGradeClassIds(new Set());
              m.setPreviewGradeClassId(null);
            }}
            scrollButtons={false}
            sx={ergChipTabsSx}
            value={m.gradeOptions.includes(m.selectedGradeLabel) ? m.selectedGradeLabel : false}
            variant="scrollable"
          >
            {m.gradeOptions.map((grade) => <Tab key={grade} label={grade} value={grade} />)}
          </Tabs>
          <Box sx={{ ...mobileCardSx, overflow: "hidden" }}>
            <MobileGradeClassList
              classes={m.gradeClasses}
              onOpenPreview={m.openGradeClassPreview}
              onToggleClass={m.toggleGradeClass}
              selectedClassIds={m.selectedGradeClassIds}
              selectedStudentIdsByClass={m.selectedGradeStudentIdsByClass}
              studentIdsByClass={m.gradeStudentIdsByClass}
            />
          </Box>
          <StudentPickerSheet
            allSelected={m.allPreviewStudentsSelected}
            onClose={() => m.setPreviewGradeClassId(null)}
            onReset={m.resetPreviewStudents}
            onToggleAll={m.toggleAllPreviewStudents}
            onToggleStudent={m.togglePreviewStudent}
            search={m.gradeStudentSearch}
            selectedIds={m.selectedPopupStudentIds}
            setSearch={m.setGradeStudentSearch}
            students={m.filteredPreviewGradeClassStudents}
            title={m.previewGradeClass?.className ?? null}
            total={m.previewGradeClassStudents.length}
          />
        </>
      ) : (
        <>
          <ErgSelect
            aria-label="Nguồn nhóm"
            onChange={(event) => m.setSelectedGroupSource(event.target.value)}
            options={[
              { label: "Tất cả nhóm", value: allGroupSourcesFilterValue },
              ...m.groupSourceOptions.map((source) => ({ label: source, value: source })),
            ]}
            size="small"
            value={m.selectedGroupSource}
          />
          <Box sx={{ ...mobileCardSx, overflow: "hidden" }}>
            <MobileAssignmentGroupList
              groups={m.filteredAssignmentGroups}
              onOpenPreview={m.openAssignmentGroupPreview}
              onToggleGroup={m.toggleAssignmentGroup}
              selectedGroupIds={m.selectedAssignmentGroupIds}
              selectedStudentIdsByGroup={m.selectedGroupStudentIdsByGroup}
            />
          </Box>
          <StudentPickerSheet
            allSelected={m.allGroupPopupStudentsSelected}
            onClose={() => m.setPreviewAssignmentGroupId(null)}
            onReset={m.resetGroupPreviewStudents}
            onToggleAll={m.toggleAllGroupPreviewStudents}
            onToggleStudent={m.toggleGroupPreviewStudent}
            search={m.groupStudentSearch}
            selectedIds={m.selectedGroupPopupStudentIds}
            setSearch={m.setGroupStudentSearch}
            students={m.filteredPreviewAssignmentGroupStudents}
            title={m.previewAssignmentGroup?.name ?? null}
            total={m.previewAssignmentGroupStudents.length}
          />
        </>
      )}
    </MobileFormSection>
  );
}
