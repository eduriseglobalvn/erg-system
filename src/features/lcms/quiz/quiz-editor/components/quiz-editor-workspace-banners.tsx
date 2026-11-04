import { useI18n } from "@/platform/i18n";

type RecentServerDraft = { id: string; title: string; questionCount?: number | null };

export function QuizEditorWorkspaceBanners({
  importNoticeCount,
  openedQuizId,
  openedQuizTitle,
  openedQuestionCount,
  recentServerDraft,
  onCreateNewQuiz,
  onOpenRecentDraft,
}: {
  importNoticeCount: number;
  openedQuizId: string;
  openedQuizTitle: string;
  openedQuestionCount: number;
  recentServerDraft: RecentServerDraft | null;
  onCreateNewQuiz: () => void;
  onOpenRecentDraft: (quizId: string) => void;
}) {
  const { t } = useI18n();

  return (
    <>
      {importNoticeCount > 0 ? (
        <div className="border-b border-[#d7e0eb] bg-[#fff8ee] px-6 py-3 text-sm text-[#8d4a12]">
          {t("sidebar.questionBank")}: {importNoticeCount} {t("common.questions").toLowerCase()} đã được đưa vào đề nháp hiện tại.
        </div>
      ) : null}

      {openedQuizId ? (
        <div className="flex items-center justify-between border-b border-[#bae6fd] bg-[#f0f9ff] px-6 py-2 text-xs text-[#0369a1]">
          <div className="flex items-center gap-2">
            <span className="font-semibold">💡 Bản nháp máy chủ đang mở:</span>
            <span>"{openedQuizTitle}" ({openedQuestionCount} câu hỏi)</span>
          </div>
          <button
            type="button"
            onClick={onCreateNewQuiz}
            className="rounded border border-[#0284c7] bg-white px-2.5 py-1 font-semibold text-[#0284c7] shadow-sm transition hover:bg-[#e0f2fe]"
          >
            + Tạo bài kiểm tra mới
          </button>
        </div>
      ) : recentServerDraft ? (
        <div className="flex items-center justify-between border-b border-[#bae6fd] bg-[#f0f9ff] px-6 py-2 text-xs text-[#0369a1]">
          <div className="flex items-center gap-2">
            <span className="font-semibold">💡 Bản nháp gần nhất trên máy chủ:</span>
            <span>"{recentServerDraft.title}" ({recentServerDraft.questionCount || 0} câu hỏi)</span>
          </div>
          <button
            type="button"
            onClick={() => onOpenRecentDraft(recentServerDraft.id)}
            className="rounded bg-[#0284c7] px-3 py-1 font-semibold text-white shadow-sm transition hover:bg-[#0369a1]"
          >
            Mở bản nháp này
          </button>
        </div>
      ) : null}
    </>
  );
}
