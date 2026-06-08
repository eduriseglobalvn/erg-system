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
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="w-[36%] p-4 text-sm font-semibold text-slate-500">
                Tiêu chí
              </th>
              {scale.map((point) => (
                <th key={point.id} className="p-4 text-center text-sm font-semibold text-slate-500">
                  <span className="block text-lg text-[var(--quiz-option-text)]">{point.value}</span>
                  <span>{point.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="p-4 text-lg font-medium text-slate-800">{row.label}</td>
                {scale.map((point) => {
                  const active = responses[row.id] === point.id;

                  return (
                    <td key={point.id} className="p-4 text-center">
                      <button
                        type="button"
                        disabled={submitted}
                        className={cn(
                          "mx-auto grid h-9 w-9 place-items-center rounded-full border transition focus:outline-none focus:ring-2 disabled:cursor-default",
                          active
                            ? "border-[var(--quiz-accent-start)] bg-[var(--quiz-accent-start)]"
                            : "border-slate-300 bg-white hover:border-[var(--quiz-accent-start)]",
                        )}
                        style={{ ["--tw-ring-color" as string]: "rgba(0,0,139,0.14)" }}
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
                        {active ? <span className="h-3 w-3 rounded-full bg-white" /> : null}
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
