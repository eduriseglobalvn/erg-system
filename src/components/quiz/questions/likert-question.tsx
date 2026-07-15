import { Check } from "lucide-react";

import { QuestionBodyWithImage } from "@/components/quiz/questions/shared";
import type { QuestionComponentProps } from "@/components/quiz/questions/types";
import type { LikertRow, LikertScalePoint } from "@/lib/types";
import { cn } from "@/utils/cn";

export function LikertQuestion({
  question,
  value,
  onChange,
  submitted = false,
  reviewMode = false,
  editable = false,
  onQuestionChange,
}: QuestionComponentProps) {
  const rows = question.likertRows ?? [];
  const scale = question.likertScale ?? [];
  const responses = value.likertResponses ?? {};

  function emitRowsAndScale(nextRows: LikertRow[] = rows, nextScale: LikertScalePoint[] = scale) {
    onQuestionChange?.({ ...question, likertRows: nextRows, likertScale: nextScale });
  }

  function updateRow(rowId: string, patch: Partial<LikertRow>) {
    emitRowsAndScale(rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row)));
  }

  function addRow() {
    emitRowsAndScale([
      ...rows,
      {
        id: createRuntimeId("likert-row"),
        label: `Criteria ${rows.length + 1}`,
      },
    ]);
  }

  function removeRow(rowId: string) {
    emitRowsAndScale(rows.filter((row) => row.id !== rowId));
  }

  function updateScalePoint(pointId: string, patch: Partial<LikertScalePoint>) {
    emitRowsAndScale(
      rows,
      scale.map((point) => (point.id === pointId ? { ...point, ...patch } : point)),
    );
  }

  function addScalePoint() {
    emitRowsAndScale(rows, [
      ...scale,
      {
        id: createRuntimeId("likert-scale"),
        label: `Level ${scale.length + 1}`,
        value: scale.length + 1,
      },
    ]);
  }

  function removeScalePoint(pointId: string) {
    emitRowsAndScale(rows, scale.filter((point) => point.id !== pointId));
  }

  if (editable && onQuestionChange) {
    return (
      <QuestionBodyWithImage question={question}>
        <div className="quiz-answer-region-wide overflow-x-auto rounded-2xl bg-white shadow-[0_16px_36px_rgba(0,0,136,0.06)] ring-1 ring-[rgba(0,0,136,0.08)]">
          <table className="w-full min-w-[1040px] border-collapse text-left">
            <thead className="bg-[rgba(247,248,255,0.92)]">
              <tr>
                <th className="w-[34%] p-5 text-sm font-extrabold uppercase tracking-[0.02em] text-[#637381]">
                  Criteria
                </th>
                {scale.map((point) => (
                  <th key={point.id} className="p-4 text-center text-sm font-bold text-[#637381]">
                    <input
                      type="number"
                      className="quiz-runtime-edit-input mx-auto block max-w-20 text-center text-2xl font-extrabold text-[#000088]"
                      value={point.value}
                      onChange={(event) => updateScalePoint(point.id, { value: Number(event.target.value) })}
                      aria-label={`Scale value ${point.value}`}
                    />
                    <input
                      className="quiz-runtime-edit-input mt-1 text-center text-sm font-bold text-[#637381]"
                      value={point.label}
                      onChange={(event) => updateScalePoint(point.id, { label: event.target.value })}
                      aria-label={point.label}
                    />
                    {scale.length > 2 ? (
                      <button type="button" className="quiz-runtime-edit-remove mt-2" onClick={() => removeScalePoint(point.id)}>
                        Remove
                      </button>
                    ) : null}
                  </th>
                ))}
                <th className="p-4 text-center">
                  <button type="button" className="quiz-runtime-edit-add min-h-9 px-3 text-xs" onClick={addScalePoint}>
                    Add scale
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-[rgba(0,0,136,0.08)]">
                  <td className="p-5 text-[var(--quiz-readable-size)] font-semibold text-[#172033]">
                    <div className="flex items-center gap-2">
                      <input
                        className="quiz-runtime-edit-input text-[var(--quiz-readable-size)] font-semibold text-[#172033]"
                        value={row.label}
                        onChange={(event) => updateRow(row.id, { label: event.target.value })}
                        aria-label={row.label}
                      />
                      {rows.length > 1 ? (
                        <button type="button" className="quiz-runtime-edit-remove" onClick={() => removeRow(row.id)}>
                          Remove
                        </button>
                      ) : null}
                    </div>
                  </td>
                  {scale.map((point) => (
                    <td key={point.id} className="p-3 text-center">
                      <div className="mx-auto flex min-h-[var(--quiz-control-height)] w-full min-w-28 items-center justify-center rounded-xl border border-transparent bg-white">
                        <span className="grid h-7 w-7 place-items-center rounded-md bg-slate-100/80 text-transparent">
                          <Check className="h-5 w-5 stroke-[3]" />
                        </span>
                      </div>
                    </td>
                  ))}
                  <td className="p-3" />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" className="quiz-runtime-edit-add" onClick={addRow}>
          Add criteria
        </button>
      </QuestionBodyWithImage>
    );
  }

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
                <td className="p-5 text-[var(--quiz-readable-size)] font-semibold text-[#172033]">{row.label}</td>
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

function createRuntimeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
}
