import { Check, X } from "lucide-react";

import type { DisplayMatchingPair } from "@/components/quiz/questions/matching-question/matching-helpers";
import { MatchingInlineMedia } from "@/components/quiz/questions/matching-question/matching-media";

export function MobileMatchingAnswerPicker({
  activePromptId,
  assignments,
  optionMap,
  options,
  onClose,
  onSelect,
}: {
  activePromptId: string;
  assignments: Record<string, string>;
  optionMap: Map<string, DisplayMatchingPair>;
  options: DisplayMatchingPair[];
  onClose: () => void;
  onSelect: (rowId: string, optionId: string) => void;
}) {
  const selectedId = assignments[activePromptId];
  const activePrompt = optionMap.get(activePromptId);
  const assignedRowByOptionId = Object.fromEntries(
    Object.entries(assignments).map(([rowId, optionId]) => [optionId, rowId]),
  ) as Record<string, string>;

  return (
    <div className="fixed inset-0 z-[280] bg-slate-950/55 px-4 py-12">
      <div className="mx-auto mt-10 flex max-h-[78vh] w-full max-w-md flex-col overflow-hidden rounded-lg bg-white shadow-sm">
        <div className="relative border-b px-4 py-3 text-center" style={{ borderColor: "rgba(148,163,184,0.22)" }}>
          <div className="text-sm font-medium text-slate-700">Chọn đáp án</div>
          <button
            type="button"
            className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-[var(--erg-blue)]"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {activePrompt ? (
          <div className="border-b px-4 py-3 text-xs font-semibold leading-5 text-slate-500" style={{ borderColor: "rgba(148,163,184,0.16)" }}>
            {activePrompt.leftText}
          </div>
        ) : null}
        <div className="overflow-auto">
          {options.map((option) => {
            const isSelectedInCurrentRow = selectedId === option.id;
            const assignedRowId = assignedRowByOptionId[option.id];
            const isAssignedAnywhere = Boolean(assignedRowId);

            return (
              <button
                key={option.id}
                type="button"
                className={`flex min-h-[72px] w-full items-center gap-3 border-b px-4 text-left text-sm text-slate-700 ${
                  isSelectedInCurrentRow ? "bg-emerald-50/60" : ""
                }`}
                style={{ borderColor: "rgba(148,163,184,0.16)" }}
                onClick={() => onSelect(activePromptId, option.id)}
              >
                {option.rightImage ? (
                  <span className="grid h-12 w-12 flex-none place-items-center overflow-hidden rounded-md border border-slate-200 bg-white">
                    <img src={option.rightImage.url} alt={option.rightImage.alt ?? option.rightText} className="h-full w-full object-contain" />
                  </span>
                ) : null}
                <MatchingInlineMedia icon={option.rightIcon} label={option.rightText} />
                <span className="min-w-0 flex-1 py-4">{option.rightText}</span>
                {isAssignedAnywhere ? (
                  <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-emerald-500 text-white">
                    <Check className="h-4 w-4" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
