import { useMemo, useState } from "react";

import { useQuestionBankWorkspaceQuery } from "@/features/lcms/quiz/question-bank/api/question-bank-query";
import type { QuestionBankQuestion } from "@/features/lcms/quiz/question-bank/types/question-bank-types";
import { CreateExerciseDialog } from "./create-exercise-dialog";
import { ExerciseQuestionDetailDialog } from "./exercise-question-detail-dialog";
import type { ExerciseBankController } from "./use-exercise-bank-controller";
import { ExerciseBankHeader } from "./desktop-view/exercise-bank-header";
import { ExerciseListToolbar } from "./desktop-view/exercise-list-toolbar";
import { ExerciseTable } from "./desktop-view/exercise-table";
import { ExerciseInspector } from "./desktop-view/exercise-inspector";
import { selectExerciseQuestions } from "./desktop-view/select-exercise-questions";

export function DesktopExerciseBankView({
  controller,
  onAssign,
  onBack,
  onOpenPortable,
}: {
  controller: ExerciseBankController;
  onAssign: (exerciseTitle: string) => void;
  onBack: () => void;
  onOpenPortable?: () => void;
}) {
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Lấy dữ liệu câu hỏi từ Ngân hàng câu hỏi hệ thống ERG
  const { data: qbData } = useQuestionBankWorkspaceQuery(undefined, {
    includeQuestions: true,
    size: 100,
  });

  const allQuestions: QuestionBankQuestion[] = useMemo(() => {
    return qbData?.questions ?? [];
  }, [qbData]);

  // Trích xuất danh sách câu hỏi cho bài tập được chọn
  const selectedExerciseQuestions = useMemo(
    () => selectExerciseQuestions(controller.selectedExercise, allQuestions),
    [controller.selectedExercise, allQuestions]
  );

  return (
    <div
      className="flex h-full min-h-0 flex-col gap-3 overflow-hidden p-4 xl:p-5 bg-[#F9FBFC]"
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", system-ui, sans-serif',
      }}
    >
      <ExerciseBankHeader controller={controller} onBack={onBack} onOpenPortable={onOpenPortable} />

      {/* ================================================================ */}
      {/* WORKSPACE CHÍNH: Bảng danh sách + Panel xem nhanh Inspector       */}
      {/* ================================================================ */}
      <div className="grid min-h-0 flex-1 gap-3.5 overflow-hidden xl:grid-cols-[minmax(0,1fr)_330px]">
        {/* CỘT DANH SÁCH BÀI TẬP */}
        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
          {/* THANH ĐIỀU HƯỚNG TABS & LỌC TÍCH HỢP — RÕ RÀNG, THOÁNG ĐÃNG */}
          <ExerciseListToolbar controller={controller} />

          <ExerciseTable controller={controller} onAssign={onAssign} setDetailModalOpen={setDetailModalOpen} />
        </section>

        <ExerciseInspector
          controller={controller}
          onAssign={onAssign}
          setDetailModalOpen={setDetailModalOpen}
          selectedExerciseQuestions={selectedExerciseQuestions}
        />
      </div>

      {/* MODAL TẠO & CHỈNH SỬA BÀI TẬP */}
      <CreateExerciseDialog
        open={controller.createDialogOpen}
        onClose={() => {
          controller.setCreateDialogOpen(false);
          controller.setExerciseToEdit(null);
        }}
        onSubmit={controller.addExercise}
        initialExercise={controller.exerciseToEdit}
        onUpdate={controller.updateExercise}
      />

      {/* MODAL XEM CHI TIẾT CÂU HỎI */}
      <ExerciseQuestionDetailDialog
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        exercise={controller.selectedExercise}
        questions={selectedExerciseQuestions}
        onAssign={onAssign}
        onEdit={controller.openEditDialog}
      />
    </div>
  );
}
