import { ChevronDown, Link2 } from "lucide-react";
import { useMemo, useState } from "react";

import {
  createNextMatchingAssignments,
  type DisplayMatchingPair,
} from "@/components/quiz/questions/matching-question/matching-helpers";
import { MatchingInlineMedia } from "@/components/quiz/questions/matching-question/matching-media";
import { MobileMatchingAnswerPicker } from "@/components/quiz/questions/matching-question/mobile-matching-answer-picker";
import { QuestionBodyWithImage } from "@/components/quiz/questions/shared";
import type { QuestionComponentProps } from "@/components/quiz/questions/types";
import { getMatchingKey } from "@/domain/quiz/quiz";

/** Phones keep the select UI (spec 7.1 "Điện thoại giữ ô chọn"): each row opens a picker of responses. */
export function MatchingMobile({
  question,
  value,
  submitted = false,
  reviewMode = false,
  onChange,
}: Pick<QuestionComponentProps, "question" | "value" | "submitted" | "reviewMode" | "onChange">) {
  const [activePromptId, setActivePromptId] = useState<string | null>(null);

  const displayPairs = useMemo<DisplayMatchingPair[]>(
    () =>
      (question.matching ?? []).map((pair) => {
        return {
          ...pair,
          leftText: pair.prompt,
          rightText: pair.response ?? "",
          leftIcon: pair.promptIcon,
          rightIcon: pair.responseIcon,
          leftImage: pair.promptImage,
          rightImage: pair.responseImage,
        };
      }),
    [question.matching],
  );

  // New shape: response cards come from matchingResponses (opaque ids). Old shape: rows double as responses (id == response id).
  const responseOptions = useMemo<DisplayMatchingPair[]>(
    () =>
      question.matchingResponses
        ? question.matchingResponses.map((item) => ({
            id: item.id,
            prompt: "",
            leftText: "",
            rightText: item.response,
            rightIcon: item.responseIcon,
            rightImage: item.responseImage,
          }))
        : displayPairs,
    [question.matchingResponses, displayPairs],
  );
  const responseMap = useMemo(() => new Map(responseOptions.map((option) => [option.id, option])), [responseOptions]);
  const pairMap = useMemo(() => new Map(displayPairs.map((pair) => [pair.id, pair])), [displayPairs]);
  const matchingKey = getMatchingKey(question);

  return (
    <QuestionBodyWithImage question={question}>
      <div className="grid gap-3">
        {displayPairs.map((pair) => {
          const selectedId = value.matchingAssignments?.[pair.id] ?? "";
          const selectedOption = selectedId ? responseMap.get(selectedId) ?? null : null;
          const correctId = matchingKey?.[pair.id];
          const isCorrect = reviewMode && Boolean(correctId) && selectedId === correctId;
          const isWrong = reviewMode && Boolean(correctId) && selectedId !== correctId;

          return (
            <div
              key={pair.id}
              className="overflow-hidden rounded-md border bg-white shadow-sm"
              style={{
                borderColor: isCorrect ? "#78b816" : isWrong ? "#ef6b5f" : "var(--quiz-canvas-border)",
              }}
            >
              <div className="grid grid-cols-[22px_minmax(0,1fr)]">
                <div className="flex items-center justify-center bg-slate-100 text-slate-300">
                  <Link2 className="h-4 w-4" />
                </div>
                <div className="border-b px-4 py-3" style={{ borderColor: "rgba(148,163,184,0.18)" }}>
                  <div className="flex min-w-0 items-center gap-2 text-[15px] leading-6 text-slate-600">
                    <MatchingInlineMedia image={pair.leftImage} icon={pair.leftIcon} label={pair.leftText} />
                    <span className="min-w-0 flex-1">{pair.leftText}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-[22px_minmax(0,1fr)]">
                <div className="bg-slate-100" />
                <button
                  type="button"
                  aria-label={pair.leftText}
                  disabled={submitted}
                  className="flex min-h-[52px] items-center justify-between gap-3 px-4 py-2.5 text-left"
                  onClick={() => setActivePromptId(pair.id)}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {selectedOption?.rightImage ? (
                      <span className="grid h-9 w-9 flex-none place-items-center overflow-hidden rounded-md border border-slate-200 bg-white">
                        <img src={selectedOption.rightImage.url} alt={selectedOption.rightImage.alt ?? selectedOption.rightText} className="h-full w-full object-contain" />
                      </span>
                    ) : null}
                    <MatchingInlineMedia icon={selectedOption?.rightIcon} label={selectedOption?.rightText ?? ""} />
                    <span className="truncate text-sm text-slate-500">{selectedOption?.rightText ?? "- Chọn -"}</span>
                  </span>
                  <ChevronDown className="h-4 w-4 flex-none text-slate-400" />
                </button>
              </div>
              {reviewMode && correctId ? (
                <div className={`px-3 pb-3 text-xs font-medium ${isCorrect ? "text-lime-600" : "text-rose-600"}`}>
                  {isCorrect ? "Ghép chính xác" : `Đáp án đúng: ${correctId ? (responseMap.get(correctId)?.rightText ?? "") : ""}`}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      {activePromptId ? (
        <MobileMatchingAnswerPicker
          activePromptId={activePromptId}
          assignments={value.matchingAssignments ?? {}}
          optionMap={pairMap}
          options={responseOptions}
          onClose={() => setActivePromptId(null)}
          onSelect={(rowId, optionId) => {
            onChange({
              matchingAssignments: createNextMatchingAssignments(value.matchingAssignments ?? {}, rowId, optionId),
            });
            setActivePromptId(null);
          }}
        />
      ) : null}
    </QuestionBodyWithImage>
  );
}
