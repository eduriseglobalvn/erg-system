import { useI18n } from "@/platform/i18n";

export function QuizEditorWorkspaceStatusBar({
  statusText,
  quizTitle,
  questionCount,
  courseLabel,
  levelLabel,
  topicLabel,
}: {
  statusText: string;
  quizTitle: string;
  questionCount: number;
  courseLabel: string;
  levelLabel: string | null;
  topicLabel: string;
}) {
  const { t } = useI18n();

  return (
    <div className="classic-editor__status">
      <span>{statusText}</span>
      <div className="classic-editor__status-summary">
        <span>{quizTitle}</span>
        <span>{t("quiz.questionCount", { count: questionCount })}</span>
        <span>{courseLabel}</span>
        {levelLabel ? <span>{levelLabel}</span> : null}
        <span>{topicLabel}</span>
      </div>
    </div>
  );
}
