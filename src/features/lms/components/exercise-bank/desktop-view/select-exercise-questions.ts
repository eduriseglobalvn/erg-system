import type { QuestionBankQuestion } from "@/features/question-bank/types/question-bank-types";
import type { Exercise } from "../exercise-bank-model";

export function selectExerciseQuestions(
  selected: Exercise | undefined | null,
  allQuestions: QuestionBankQuestion[],
): QuestionBankQuestion[] {
  if (!selected) return [];

    // 1. Nếu bài tập có lưu questionIds cụ thể (do giáo viên bốc từ Ngân hàng)
    if (selected.questionIds && selected.questionIds.length > 0) {
      const qMap = new Map(allQuestions.map((q) => [q.id, q]));
      const matched = selected.questionIds
        .map((id) => qMap.get(id))
        .filter((q): q is QuestionBankQuestion => Boolean(q));
      if (matched.length > 0) return matched;
    }

    // 2. Nếu là bài tập hệ thống hoặc chưa gán ID: lọc theo môn học / cấp độ
    const subjectNormalized = selected.subject.toLowerCase();
    const matchedBySubject = allQuestions.filter((q) => {
      const qSubject = (q.subjectLabel || q.categoryLabel || "").toLowerCase();
      return (
        qSubject.includes(subjectNormalized) ||
        subjectNormalized.includes(qSubject) ||
        (selected.tags && selected.tags.some((t) => qSubject.includes(t.toLowerCase())))
      );
    });

    if (matchedBySubject.length > 0) {
      return matchedBySubject.slice(0, selected.questionCount || 10);
    }

    // 3. Fallback: lấy số lượng câu hỏi tương ứng từ ngân hàng
    return allQuestions.slice(0, Math.min(selected.questionCount || 10, allQuestions.length));
}
