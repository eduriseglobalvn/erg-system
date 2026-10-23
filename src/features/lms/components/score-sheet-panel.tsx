import type { ClassroomSnapshot, ClassroomStudent } from "@/features/lms/classroom/types/classroom-types";
import { DesktopScoreSheetPanel } from "@/features/lms/components/score/desktop-score-sheet-panel";
import { MobileScoreSheetPanel } from "@/features/lms/components/score/mobile-score-sheet-panel";
import { ScoreSheetOverlays } from "@/features/lms/components/score/score-sheet-overlays";
import { useScoreSheetController } from "@/features/lms/components/score/use-score-sheet-controller";
import { useIsMobile } from "@/hooks/use-mobile";

export type {
  Classification,
  ScoreColumn,
  StudentState,
} from "@/features/lms/components/score/score-sheet-model";

type ScoreSheetPanelProps = {
  selectedClass?: ClassroomSnapshot;
  selectedSchoolName: string;
  students: ClassroomStudent[];
};

export function ScoreSheetPanel({ selectedClass, selectedSchoolName, students }: ScoreSheetPanelProps) {
  const isMobile = useIsMobile();
  const controller = useScoreSheetController(students, selectedClass);
  const overlays = <ScoreSheetOverlays controller={controller} />;

  if (isMobile) {
    return (
      <>
        <MobileScoreSheetPanel
          addOfflineColumn={controller.addOfflineColumn}
          bonusScores={controller.bonusScores}
          onCommitScore={controller.commitScore}
          getClassification={controller.getClassification}
          getStudentState={controller.getStudentState}
          offlineColumnName={controller.offlineColumnName}
          onOfflineColumnNameChange={controller.setOfflineColumnName}
          onOpenStudentDetail={controller.openStudentDetail}
          onRequestClassificationChange={controller.requestClassificationChange}
          onSearchQueryChange={controller.setSearchQuery}
          onSelectedSubjectChange={controller.setSelectedSubject}
          onUpdateBonusScore={controller.updateBonusScore}
          onUpdateManualScore={controller.updateManualScore}
          offlinePending={controller.offlinePending}
          scoreColumns={controller.scoreColumns}
          scoreValueFor={controller.scoreValueFor}
          searchQuery={controller.searchQuery}
          selectedClass={selectedClass}
          selectedSchoolName={selectedSchoolName}
          selectedSubject={controller.selectedSubject}
          sortedStudents={controller.filteredStudents}
          studentNameFor={controller.studentNameFor}
          subjectOptions={controller.subjectOptions}
        />
        {overlays}
      </>
    );
  }

  return (
    <DesktopScoreSheetPanel
      controller={controller}
      overlays={overlays}
      selectedClass={selectedClass}
      selectedSchoolName={selectedSchoolName}
      students={students}
    />
  );
}
