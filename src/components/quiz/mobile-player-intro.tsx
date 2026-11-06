import type { CSSProperties } from "react";

import { IntroStat } from "@/components/quiz/mobile-player-question-sheet";
import type { Question, Quiz } from "@/domain/quiz/types";

type Props = {
  modeBadgeStyle: CSSProperties;
  playerCardStyle: CSSProperties;
  questions: Question[];
  quiz: Quiz;
  onStart: () => void;
};

export function MobilePlayerIntro({ modeBadgeStyle, playerCardStyle, questions, quiz, onStart }: Props) {
  return (
    <div className="md:hidden">
      <section
        className="min-h-[100svh] bg-[#f4f5f7]"
        style={{ ...playerCardStyle, borderColor: "transparent" }}
      >
        <div className="border-b border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700">
          {quiz.title}
        </div>
        <div className="px-4 py-5">
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-5 shadow-sm">
            <div className="inline-flex rounded-md px-3 py-1 text-[11px] font-semibold" style={modeBadgeStyle}>
              {quiz.settings.mode === "training" ? "Chế độ luyện tập" : "Chế độ kiểm tra"}
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Bài làm trên mobile hiển thị theo dạng tối giản để dễ thao tác trên Android.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3 text-center">
              <IntroStat label="Số câu" value={String(questions.length)} />
              <IntroStat label="Chế độ" value={quiz.settings.mode === "training" ? "Luyện tập" : "Kiểm tra"} />
              {quiz.settings.timeLimitMinutes ? (
                <IntroStat label="Thời lượng" value={`${quiz.settings.timeLimitMinutes} phút`} />
              ) : null}
            </div>
            <button
              type="button"
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-[var(--erg-blue)] px-4 text-sm font-semibold text-white shadow-sm"
              onClick={onStart}
            >
              Bắt đầu làm bài
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
