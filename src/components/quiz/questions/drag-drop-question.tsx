import { QuestionBodyWithImage } from "@/components/quiz/questions/shared";
import type { QuestionComponentProps } from "@/components/quiz/questions/types";
import type { DragDropItem, DropTarget } from "@/lib/types";
import { cn } from "@/utils/cn";

export function DragDropQuestion({
  question,
  value,
  onChange,
  submitted = false,
  reviewMode = false,
  result,
  editable = false,
  onQuestionChange,
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

  function emitTargetsAndItems(nextTargets: DropTarget[], nextItems: DragDropItem[] = items) {
    onQuestionChange?.({ ...question, dropTargets: nextTargets, dragDropItems: nextItems });
  }

  function emitItems(nextItems: DragDropItem[]) {
    onQuestionChange?.({ ...question, dragDropItems: nextItems });
  }

  function updateTarget(targetId: string, patch: Partial<DropTarget>) {
    emitTargetsAndItems(targets.map((target) => (target.id === targetId ? { ...target, ...patch } : target)));
  }

  function addTarget() {
    const nextTarget = {
      id: createRuntimeId("target"),
      label: `Drop target ${targets.length + 1}`,
    };

    emitTargetsAndItems([...targets, nextTarget]);
  }

  function removeTarget(targetId: string) {
    if (targets.length <= 1) return;

    const nextTargets = targets.filter((target) => target.id !== targetId);
    const fallbackTargetId = nextTargets[0]?.id ?? "";
    const nextItems = items.map((item) =>
      item.correctTargetId === targetId ? { ...item, correctTargetId: fallbackTargetId } : item,
    );

    emitTargetsAndItems(nextTargets, nextItems);
  }

  function updateItem(itemId: string, patch: Partial<DragDropItem>) {
    emitItems(items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)));
  }

  function addItem() {
    emitItems([
      ...items,
      {
        id: createRuntimeId("item"),
        label: `Item ${items.length + 1}`,
        correctTargetId: targets[0]?.id ?? "",
      },
    ]);
  }

  function removeItem(itemId: string) {
    emitItems(items.filter((item) => item.id !== itemId));
  }

  if (editable && onQuestionChange) {
    return (
      <QuestionBodyWithImage question={question}>
        <div className="quiz-answer-region-wide grid gap-7 xl:gap-8">
          <div className="grid gap-5 lg:grid-cols-2">
            {targets.map((target) => {
              const assignedItems = items.filter((item) => item.correctTargetId === target.id);

              return (
                <div key={target.id} className="min-h-48 rounded-[20px] border border-dashed border-[rgba(0,0,136,0.20)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,248,255,0.84))] p-6 shadow-[0_14px_30px_rgba(0,0,136,0.06)] sm:p-7">
                  <div className="flex items-center justify-between gap-3">
                    <input
                      className="quiz-runtime-edit-input text-sm font-extrabold uppercase tracking-[0.02em] text-[#000088]"
                      value={target.label}
                      onChange={(event) => updateTarget(target.id, { label: event.target.value })}
                      aria-label={target.label}
                    />
                    <span className="rounded-full border border-[rgba(0,0,136,0.12)] bg-white px-3 py-1 text-xs font-extrabold text-[#637381]">
                      {assignedItems.length}
                    </span>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3.5">
                    {assignedItems.length ? (
                      assignedItems.map((item) => (
                        <span key={item.id} className="rounded-xl border border-[rgba(0,0,136,0.12)] bg-white px-5 py-3 text-[var(--quiz-readable-size)] font-bold text-[#000088] shadow-sm">
                          {item.label}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-xl border border-dashed border-[rgba(0,0,136,0.14)] bg-white/72 px-4 py-3 text-[var(--quiz-readable-size)] font-semibold text-slate-400">No items yet</span>
                    )}
                  </div>
                  {targets.length > 1 ? (
                    <button type="button" className="quiz-runtime-edit-remove mt-5" onClick={() => removeTarget(target.id)}>
                      Remove target
                    </button>
                  ) : null}
                </div>
              );
            })}
            <button type="button" className="quiz-runtime-edit-add self-start" onClick={addTarget}>
              Add target
            </button>
          </div>

          <div className="grid gap-5 rounded-[20px] border border-[rgba(0,0,136,0.12)] bg-[linear-gradient(135deg,rgba(0,0,136,0.055),rgba(255,255,255,0.94)_48%,rgba(232,40,40,0.045))] p-5 shadow-[0_18px_40px_rgba(0,0,136,0.07)] sm:p-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-[rgba(0,0,136,0.12)] bg-white p-6 shadow-[0_12px_28px_rgba(0,0,136,0.06)] transition sm:p-7"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <input
                    className="quiz-runtime-edit-input text-[var(--quiz-readable-size-lg)] font-bold text-[#172033]"
                    value={item.label}
                    onChange={(event) => updateItem(item.id, { label: event.target.value })}
                    aria-label={item.label}
                  />
                  {items.length > 1 ? (
                    <button type="button" className="quiz-runtime-edit-remove" onClick={() => removeItem(item.id)}>
                      Remove
                    </button>
                  ) : null}
                </div>
                <div className="mt-6 flex flex-wrap gap-4">
                  {targets.map((target) => {
                    const selected = item.correctTargetId === target.id;

                    return (
                      <button
                        key={target.id}
                        type="button"
                        className={cn(
                          "inline-flex min-h-[var(--quiz-control-height)] min-w-32 items-center justify-center rounded-xl border px-8 text-center text-[var(--quiz-control-text-size)] font-extrabold shadow-sm transition hover:-translate-y-0.5 sm:min-w-40 sm:px-10",
                          selected
                            ? "border-[#000088] bg-[rgba(0,0,136,0.07)]"
                            : "border-[rgba(0,0,136,0.14)] bg-white",
                        )}
                        style={{ color: selected ? "#000088" : "#174f91" }}
                        onClick={() => updateItem(item.id, { correctTargetId: target.id })}
                      >
                        {target.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <button type="button" className="quiz-runtime-edit-add" onClick={addItem}>
              Add item
            </button>
          </div>
        </div>
      </QuestionBodyWithImage>
    );
  }

  return (
    <QuestionBodyWithImage question={question}>
      <div className="quiz-answer-region-wide grid gap-7 xl:gap-8">
        <div className="grid gap-5 lg:grid-cols-2">
          {targets.map((target) => {
            const assignedItems = items.filter((item) => placements[item.id] === target.id);

            return (
              <div key={target.id} className="min-h-48 rounded-[20px] border border-dashed border-[rgba(0,0,136,0.20)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,248,255,0.84))] p-6 shadow-[0_14px_30px_rgba(0,0,136,0.06)] sm:p-7">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-extrabold uppercase tracking-[0.02em] text-[#000088]">
                    {target.label}
                  </div>
                  <span className="rounded-full border border-[rgba(0,0,136,0.12)] bg-white px-3 py-1 text-xs font-extrabold text-[#637381]">
                    {assignedItems.length}
                  </span>
                </div>
                <div className="mt-5 flex flex-wrap gap-3.5">
                  {assignedItems.length ? (
                    assignedItems.map((item) => (
                      <span key={item.id} className="rounded-xl border border-[rgba(0,0,136,0.12)] bg-white px-5 py-3 text-[var(--quiz-readable-size)] font-bold text-[#000088] shadow-sm">
                        {item.label}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-xl border border-dashed border-[rgba(0,0,136,0.14)] bg-white/72 px-4 py-3 text-[var(--quiz-readable-size)] font-semibold text-slate-400">Chưa có thẻ nào</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-5 rounded-[20px] border border-[rgba(0,0,136,0.12)] bg-[linear-gradient(135deg,rgba(0,0,136,0.055),rgba(255,255,255,0.94)_48%,rgba(232,40,40,0.045))] p-5 shadow-[0_18px_40px_rgba(0,0,136,0.07)] sm:p-6">
          {items.map((item) => {
            const selectedTargetId = placements[item.id] ?? "";
            const correctTargetId = result?.correctDragDropPlacements?.[item.id] ?? item.correctTargetId;
            const isCorrect = reviewMode && selectedTargetId === correctTargetId;
            const correctTarget = targets.find((target) => target.id === correctTargetId);

            return (
              <div
                key={item.id}
                className={cn(
                  "rounded-2xl border bg-white p-6 transition shadow-[0_12px_28px_rgba(0,0,136,0.06)] sm:p-7",
                  reviewMode
                    ? isCorrect
                      ? "border-emerald-300"
                      : "border-red-300"
                    : "border-[rgba(0,0,136,0.12)]",
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[var(--quiz-readable-size-lg)] font-bold text-[#172033]">{item.label}</span>
                  {reviewMode && !isCorrect ? (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Đúng: {correctTarget?.label}
                    </span>
                  ) : null}
                </div>
                <div className="mt-6 flex flex-wrap gap-4">
                  {targets.map((target) => (
                    <button
                      key={target.id}
                      type="button"
                      disabled={submitted}
                      className={cn(
                        "inline-flex min-h-[var(--quiz-control-height)] min-w-32 items-center justify-center rounded-xl border px-8 text-center text-[var(--quiz-control-text-size)] font-extrabold shadow-sm transition hover:-translate-y-0.5 disabled:cursor-default disabled:hover:translate-y-0 sm:min-w-40 sm:px-10",
                        selectedTargetId === target.id
                          ? "border-[#000088] bg-[rgba(0,0,136,0.07)]"
                          : "border-[rgba(0,0,136,0.14)] bg-white",
                      )}
                      style={{ color: selectedTargetId === target.id ? "#000088" : "#174f91" }}
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

function createRuntimeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
}
