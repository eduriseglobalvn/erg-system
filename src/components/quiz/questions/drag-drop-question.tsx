import { QuestionBodyWithImage } from "@/components/quiz/questions/shared";
import type { QuestionComponentProps } from "@/components/quiz/questions/types";
import { cn } from "@/utils/cn";

export function DragDropQuestion({
  question,
  value,
  onChange,
  submitted = false,
  reviewMode = false,
  result,
}: QuestionComponentProps) {
  const targets = question.dropTargets ?? [];
  const items = question.dragDropItems ?? [];
  const placements = value.dragDropPlacements ?? {};

  function placeItem(itemId: string, targetId: string) {
    if (submitted) return;

    onChange({
      dragDropPlacements: {
        ...placements,
        [itemId]: targetId,
      },
    });
  }

  return (
    <QuestionBodyWithImage question={question}>
      <div className="grid gap-5">
        <div className="grid gap-4 lg:grid-cols-2">
          {targets.map((target) => {
            const assignedItems = items.filter((item) => placements[item.id] === target.id);

            return (
              <div key={target.id} className="min-h-40 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-500">
                  {target.label}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {assignedItems.length ? (
                    assignedItems.map((item) => (
                      <span key={item.id} className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                        {item.label}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm font-semibold text-slate-400">Chưa có thẻ nào</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-3">
          {items.map((item) => {
            const selectedTargetId = placements[item.id] ?? "";
            const correctTargetId = result?.correctDragDropPlacements?.[item.id] ?? item.correctTargetId;
            const isCorrect = reviewMode && selectedTargetId === correctTargetId;
            const correctTarget = targets.find((target) => target.id === correctTargetId);

            return (
              <div
                key={item.id}
                className={cn(
                  "rounded-lg border-2 bg-white p-4 transition",
                  reviewMode
                    ? isCorrect
                      ? "border-emerald-300"
                      : "border-red-300"
                    : "border-slate-200",
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-lg font-semibold text-slate-900">{item.label}</span>
                  {reviewMode && !isCorrect ? (
                    <span className="rounded-md bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Đúng: {correctTarget?.label}
                    </span>
                  ) : null}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {targets.map((target) => (
                    <button
                      key={target.id}
                      type="button"
                      disabled={submitted}
                      className={cn(
                        "min-h-10 rounded-lg border px-3 text-sm font-semibold transition  disabled:cursor-default",
                        selectedTargetId === target.id
                          ? "border-[var(--quiz-accent-start)] bg-[var(--quiz-option-selected-bg)]"
                          : "border-slate-200 bg-slate-50",
                      )}
                      style={{ color: "var(--quiz-option-text)" }}
                      onClick={() => placeItem(item.id, target.id)}
                    >
                      {target.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </QuestionBodyWithImage>
  );
}
