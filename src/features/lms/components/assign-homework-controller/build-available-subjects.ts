import type { useQuestionBankWorkspaceQuery } from "@/features/lcms/quiz/question-bank/api/question-bank-query";
import { assignmentSubjects } from "@/features/lms/classroom/components/class-students-workspace.constants";

type QuestionBankQuizzes = NonNullable<ReturnType<typeof useQuestionBankWorkspaceQuery>["data"]>["quizzes"];

export function buildAvailableSubjects(qbQuizzes: QuestionBankQuizzes | undefined) {
  if (qbQuizzes && qbQuizzes.length > 0) {
    const bySubject = new Map<string, typeof qbQuizzes>();
    for (const q of qbQuizzes) {
      const sub = q.subjectLabel || "Bài tập chung";
      if (!bySubject.has(sub)) bySubject.set(sub, []);
      bySubject.get(sub)!.push(q);
    }
    return Array.from(bySubject.entries()).map(([subLabel, quizzes]) => {
      const subId = quizzes[0]?.subjectId || `sub-${subLabel}`;
      const byLevel = new Map<string, typeof quizzes>();
      for (const q of quizzes) {
        const lvl = q.levelLabel || "Cơ bản";
        if (!byLevel.has(lvl)) byLevel.set(lvl, []);
        byLevel.get(lvl)!.push(q);
      }
      return {
        id: subId,
        label: subLabel,
        levels: Array.from(byLevel.entries()).map(([lvlLabel, lvlQuizzes]) => {
          const lvlId = lvlQuizzes[0]?.levelId || `lvl-${lvlLabel}`;
          const byTopic = new Map<string, typeof lvlQuizzes>();
          for (const q of lvlQuizzes) {
            const top = (q.topicLabels && q.topicLabels[0]) || "Chủ đề học tập";
            if (!byTopic.has(top)) byTopic.set(top, []);
            byTopic.get(top)!.push(q);
          }
          return {
            id: lvlId,
            label: lvlLabel,
            description: `${lvlQuizzes.length} bài tập`,
            topics: Array.from(byTopic.entries()).map(([topLabel, topQuizzes], topIdx) => ({
              id: `${lvlId}-topic-${topIdx}`,
              label: topLabel,
              items: topQuizzes.map((q) => ({
                id: q.id,
                title: q.title,
                activityLabel: q.scopeLabel || "Bài luyện tập",
                subjectLabel: subLabel,
                targetLevel: lvlLabel,
                activeClasses: 1,
                completionRate: 0,
                submittedCount: 0,
                inProgressCount: 0,
                needsReviewCount: 0,
                dueLabel: "Theo lịch giáo viên",
                durationLabel: q.durationLabel || "30 phút",
                kind: q.kind === "test" ? ("test" as const) : ("train" as const),
                levelId: lvlId,
                levelLabel: lvlLabel,
                programLabel: subLabel,
                questionCount: q.questionCount || q.questionIds?.length || 10,
                subjectId: subId,
                topicId: `${lvlId}-topic-${topIdx}`,
                topicLabel: topLabel,
              })),
            })),
          };
        }),
      };
    });
  }
  return assignmentSubjects;
}
