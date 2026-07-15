import { Check, FileText, Flag, Search } from "lucide-react";
import type { CSSProperties } from "react";

import { questionLabel } from "@/components/quiz/player-shell-utils";
import type { Question } from "@/lib/types";

type QuestionNavigatorProps = {
  answeredQuestionIds: string[];
  className?: string;
  currentIndex: number;
  flaggedQuestionIds: string[];
  introSubtitle?: string;
  onIntroClick?: () => void;
  onJumpToQuestion: (index: number) => void;
  onQueryChange?: (query: string) => void;
  query?: string;
  questions: Question[];
  showIntro?: boolean;
  started: boolean;
  style?: CSSProperties;
};

export function QuestionNavigator({
  answeredQuestionIds,
  className = "",
  currentIndex,
  flaggedQuestionIds,
  introSubtitle,
  onIntroClick,
  onJumpToQuestion,
  onQueryChange,
  query = "",
  questions,
  showIntro = false,
  started,
  style,
}: QuestionNavigatorProps) {
  const answeredSet = new Set(answeredQuestionIds);
  const flaggedSet = new Set(flaggedQuestionIds);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredQuestions = normalizedQuery
    ? questions.filter((question, index) => `${index + 1}. ${question.title}`.toLowerCase().includes(normalizedQuery))
    : questions;

  return (
    <aside
      className={`flex min-h-[380px] min-w-0 flex-col overflow-hidden rounded-lg border border-[rgba(145,158,171,0.16)] bg-white shadow-[0_18px_45px_rgba(28,37,46,0.08)] ${className}`}
      style={style}
    >
      <div className="border-b border-[rgba(0,0,136,0.08)] bg-white/74 px-2 pt-2">
        <div className="grid grid-cols-1">
          <div className="rounded-t-lg bg-[#000088] px-3 py-1.5 text-center text-xs font-bold text-white">
            MỤC LỤC
          </div>
        </div>
      </div>

      {onQueryChange ? (
        <div className="border-b border-[rgba(0,0,136,0.08)] bg-[rgba(247,248,255,0.76)] px-2 py-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#919EAB]" />
            <input
              type="search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Tìm kiếm"
              className="h-8 w-full rounded-lg border border-[rgba(0,0,136,0.12)] bg-white/82 px-8 text-xs font-medium text-[#1C252E] outline-none transition placeholder:text-[#919EAB] focus:border-[#000088] focus:ring-2 focus:ring-[rgba(0,0,136,0.14)]"
            />
          </div>
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-1.5 overflow-auto bg-[rgba(247,248,255,0.76)] px-2 py-2">
        {showIntro ? (
          <button
            type="button"
            className="group relative flex min-h-[56px] items-center gap-2 rounded-lg border py-2 pl-3 pr-2 text-left transition hover:shadow-sm"
            style={{
              backgroundColor: "#ffffff",
              borderColor: "rgba(0,0,136,0.10)",
              padding: "8px 8px 8px 12px",
            }}
            onClick={onIntroClick}
          >
            <span className="grid h-8 w-8 flex-none place-items-center rounded-xl border border-[rgba(0,0,136,0.10)] bg-white text-[#919EAB] shadow-[0_4px_10px_rgba(0,0,136,0.04)]">
              <FileText className="h-4 w-4" />
            </span>
            <span className="flex min-w-0 flex-col justify-center gap-1">
              <strong className="line-clamp-2 text-[11px] font-bold leading-4 text-[#1C252E]">Trang giới thiệu</strong>
              {introSubtitle ? <small className="line-clamp-1 text-[10px] font-medium text-[#637381]">{introSubtitle}</small> : null}
            </span>
          </button>
        ) : null}

        {filteredQuestions.map((question) => {
          const index = questions.findIndex((item) => item.id === question.id);
          const active = started && currentIndex === index;
          const answered = answeredSet.has(question.id);
          const flagged = flaggedSet.has(question.id);

          return (
            <button
              key={question.id}
              type="button"
              className="group relative flex min-h-[60px] items-center gap-2 rounded-lg border py-2 pl-3 pr-2 text-left transition hover:shadow-sm"
              style={{
                backgroundColor: active ? "#000088" : "#ffffff",
                borderColor: active ? "transparent" : "rgba(0,0,136,0.10)",
                boxShadow: active ? "0 8px 18px rgba(0,0,136,0.22)" : undefined,
                color: active ? "#ffffff" : "#1C252E",
                padding: "8px 8px 8px 12px",
              }}
              onClick={() => onJumpToQuestion(index)}
            >
              {flagged ? (
                <span
                  className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-md bg-[rgba(255,86,48,0.12)] text-[#FF5630]"
                  aria-label="Đã đánh dấu"
                  title="Đã đánh dấu"
                >
                  <Flag className="h-3 w-3 fill-current" />
                </span>
              ) : null}

              <span
                className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-xl text-xs font-bold shadow-[0_4px_10px_rgba(0,0,136,0.04)]"
                style={{
                  backgroundColor: active
                    ? answered
                      ? "rgba(255,255,255,0.18)"
                      : "rgba(255,255,255,0.14)"
                    : answered
                      ? "rgba(34,197,94,0.12)"
                      : "rgba(0,0,136,0.06)",
                  color: active ? "#ffffff" : answered ? "#118D57" : "#000088",
                }}
              >
                {answered ? <Check className="h-4 w-4 stroke-[3]" /> : index + 1}
              </span>

              <span className="flex min-w-0 flex-col justify-center gap-0.5 overflow-hidden pr-4">
                <strong className={`line-clamp-2 text-[11px] font-bold leading-4 ${active ? "text-white" : "text-[#1C252E]"}`}>
                  {question.title}
                </strong>
                <small className={`line-clamp-1 text-[10px] font-medium ${active ? "text-white/78" : "text-[#919EAB]"}`}>
                  {questionLabel(question)}
                </small>
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
