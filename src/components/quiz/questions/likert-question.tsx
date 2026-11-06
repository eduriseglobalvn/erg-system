import { Check } from "lucide-react";

import { QuestionBodyWithImage } from "@/components/quiz/questions/shared";
import type { QuestionComponentProps } from "@/components/quiz/questions/types";
import { cn } from "@/utils/cn";

export function LikertQuestion({
  question,
  value,
  onChange,
  submitted = false,
  reviewMode = false,
}: QuestionComponentProps) {
  const rows = question.likertRows ?? [];
  const scale = question.likertScale ?? [];
  const responses = value.likertResponses ?? {};

  return (
    <QuestionBodyWithImage question={question}>
      <div className="quiz-answer-region-wide overflow-x-auto rounded-2xl bg-white shadow-[0_16px_36px_rgba(0,0,136,0.06)] ring-1 ring-[rgba(0,0,136,0.08)]">
        <table className="w-full min-w-[1040px] border-collapse text-left">
          <thead className="bg-[rgba(247,248,255,0.92)]">
            <tr>
              <th className="w-[34%] p-5 text-sm font-extrabold uppercase tracking-[0.02em] text-[#637381]">
                Tiêu chí
              </th>
              {scale.map((point) => (
                <th key={point.id} className="p-4 text-center text-sm font-bold text-[#637381]">
                  <span className="block text-2xl font-extrabold text-[#000088]">{point.value}</span>
                  <span>{point.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-[rgba(0,0,136,0.08)]">
                <td className="p-5 text-[var(--quiz-readable-size)] font-semibold text-[#1D1D1F]">{row.label}</td>
                {scale.map((point) => {
                  const active = responses[row.id] === point.id;

                  return (
                    <td key={point.id} className="p-3 text-center">
                      <button
                        type="button"
                        disabled={submitted}
                        className={cn(
                          "mx-auto flex min-h-[var(--quiz-control-height)] w-full min-w-28 items-center justify-center rounded-xl border transition focus:outline-none disabled:cursor-default",
                          active
                            ? "border-transparent bg-transparent shadow-none"
                            : "border-transparent bg-white hover:border-[rgba(0,0,136,0.18)] hover:bg-[rgba(0,0,136,0.035)]",
                        )}
                        style={{ ["--tw-ring-color" as string]: "rgba(0,0,136,0.18)" }}
                        aria-label={`${row.label}: ${point.label}`}
                        onClick={() =>
                          onChange({
                            likertResponses: {
                              ...responses,
                              [row.id]: point.id,
                            },
                          })
                        }
                      >
                        <span
                          className={cn(
                            "grid h-7 w-7 place-items-center rounded-md transition",
                            active ? "bg-[#000088] text-white shadow-[0_8px_18px_rgba(0,0,136,0.16)]" : "bg-slate-100/80 text-transparent",
                          )}
                        >
                          <Check className="h-5 w-5 stroke-[3]" />
                        </span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {reviewMode ? (
        <p className="text-sm font-semibold text-slate-500">
          Câu khảo sát đã được ghi nhận, không có đúng sai tuyệt đối.
        </p>
      ) : null}
    </QuestionBodyWithImage>
  );
}
