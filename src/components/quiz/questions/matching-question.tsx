import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Check, ChevronDown, Link2, X } from "lucide-react";
import { useMemo, useState, type ButtonHTMLAttributes, type ReactNode } from "react";

import { QuestionBodyWithImage } from "@/components/quiz/questions/shared";
import type { QuestionComponentProps } from "@/components/quiz/questions/types";
import { useIsMobile } from "@/hooks/use-mobile";
import type { MatchingPair } from "@/lib/types";

type DisplayMatchingPair = MatchingPair & {
  leftText: string;
  rightText: string;
  leftImage?: MatchingPair["promptImage"];
  rightImage?: MatchingPair["responseImage"];
};

export function MatchingQuestion({
  question,
  value,
  submitted = false,
  reviewMode = false,
  onChange,
}: QuestionComponentProps) {
  const isMobile = useIsMobile();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activePromptId, setActivePromptId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const displayPairs = useMemo<DisplayMatchingPair[]>(
    () =>
      (question.matching ?? []).map((pair) => {
        return {
          ...pair,
          leftText: pair.prompt,
          rightText: pair.response,
          leftImage: pair.promptImage,
          rightImage: pair.responseImage,
        };
      }),
    [question.matching],
  );

  const rowIds = displayPairs.map((pair) => pair.id);
  const pairMap = useMemo(() => new Map(displayPairs.map((pair) => [pair.id, pair])), [displayPairs]);
  const currentOrder = useMemo(() => {
    if (value.matchingOrder?.length) {
      return value.matchingOrder;
    }

    if (value.matchingAssignments && Object.keys(value.matchingAssignments).length > 0) {
      return rowIds.map((rowId) => value.matchingAssignments?.[rowId] ?? rowId);
    }

    return [...rowIds].reverse();
  }, [rowIds, value.matchingAssignments, value.matchingOrder]);

  const activePair = activeId ? pairMap.get(activeId) ?? null : null;
  const connectedRows = submitted || reviewMode ? rowIds : (value.matchingConnectedRows ?? []);

  function emit(nextOrder: string[], nextConnectedRows: string[]) {
    onChange({
      matchingOrder: nextOrder,
      matchingConnectedRows: nextConnectedRows,
    });
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    const chipId = String(active.id);
    const sourceIndex = currentOrder.findIndex((id) => id === chipId);
    if (sourceIndex === -1) return;

    const sourceRowId = rowIds[sourceIndex];

    if (!over) {
      // Detach if dropped outside
      const nextConnectedRows = new Set(connectedRows);
      if (nextConnectedRows.has(sourceRowId)) {
        nextConnectedRows.delete(sourceRowId);
        emit(currentOrder, [...nextConnectedRows]);
      }
      return;
    }

    const overId = String(over.id);
    if (!overId.startsWith("row:")) return;

    const targetRowId = overId.replace("row:", "");
    const targetIndex = rowIds.findIndex((rowId) => rowId === targetRowId);
    if (targetIndex === -1) return;

    if (sourceIndex === targetIndex) {
      const nextConnectedRows = new Set(connectedRows);
      if (nextConnectedRows.has(targetRowId)) {
        nextConnectedRows.delete(targetRowId);
      } else {
        nextConnectedRows.add(targetRowId);
      }
      emit(currentOrder, [...nextConnectedRows]);
      return;
    }

    const nextOrder = [...currentOrder];
    const [moved] = nextOrder.splice(sourceIndex, 1);
    nextOrder.splice(targetIndex, 0, moved);

    const nextConnectedRows = new Set(connectedRows);
    nextConnectedRows.add(targetRowId);
    nextConnectedRows.delete(sourceRowId);

    emit(nextOrder, [...nextConnectedRows]);
  }

  if (isMobile) {
    return (
      <QuestionBodyWithImage question={question}>
        <div className="grid gap-3">
          {displayPairs.map((pair) => {
            const selectedId = value.matchingAssignments?.[pair.id] ?? "";
            const selectedOption = selectedId ? pairMap.get(selectedId) ?? null : null;
            const correctId = pair.id;
            const isCorrect = reviewMode && selectedId === correctId;
            const isWrong = reviewMode && selectedId !== correctId;

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
                    <div className="min-w-0 text-[15px] leading-6 text-slate-600">{pair.leftText}</div>
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
                      <span className="truncate text-sm text-slate-500">{selectedOption?.rightText ?? "- Select -"}</span>
                    </span>
                    <ChevronDown className="h-4 w-4 flex-none text-slate-400" />
                  </button>
                </div>
                {reviewMode ? (
                  <div className={`px-3 pb-3 text-xs font-medium ${isCorrect ? "text-lime-600" : "text-rose-600"}`}>
                    {isCorrect ? "Matched correctly" : `Correct answer: ${pair.rightText}`}
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
            options={displayPairs}
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

  return (
    <QuestionBodyWithImage question={question}>
      <div className="flex flex-col gap-4 sm:gap-5">
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => setActiveId(null)}>
          <div className="flex flex-col gap-3">
            {displayPairs.map((pair, index) => {
              const assignedId = currentOrder[index];
              const assignedPair = assignedId ? pairMap.get(assignedId) ?? null : null;
              const assignedPairIndex = assignedId ? displayPairs.findIndex((item) => item.id === assignedId) : -1;
              const showReviewCorrect = reviewMode && assignedId === displayPairs[index]?.id;
              const showReviewWrong = reviewMode && assignedId !== displayPairs[index]?.id;
              const rowConnected = connectedRows.includes(pair.id);

              return (
                <div
                  key={pair.id}
                  className={`grid items-stretch gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] ${rowConnected ? "md:gap-0" : "md:gap-8"}`}
                >
                  <div
                    className="relative flex min-h-[56px] min-w-0 items-center rounded-lg border-2 bg-white px-4 py-2 pr-8 text-lg leading-[1.35] shadow-sm sm:text-[22px]"
                    style={{
                      borderColor: showReviewCorrect ? "#8ac241" : showReviewWrong ? "#ff8178" : "var(--quiz-canvas-border)",
                      color: showReviewCorrect ? "#111827" : showReviewWrong ? "#111827" : "var(--quiz-option-text)",
                    }}
                  >
                    {reviewMode ? (
                      <span
                        className="mr-2 text-xl font-semibold"
                        style={{ color: showReviewCorrect ? "#78b816" : "#e65a4d" }}
                      >
                        {index + 1}.
                      </span>
                    ) : null}
                    <span>{pair.leftText}</span>
                    <span
                      className="pointer-events-none absolute right-[-2px] top-1/2 z-[3] h-7 w-[18px] -translate-y-1/2 rounded-l-full border-2 border-r-0 bg-white"
                      style={{ borderColor: showReviewCorrect ? "#8ac241" : showReviewWrong ? "#ff8178" : "var(--quiz-canvas-border)" }}
                    />
                  </div>

                  <MatchingRowTarget rowId={pair.id}>
                    {assignedPair ? (
                      <DraggableMatchingChip
                        id={assignedPair.id}
                        rowId={pair.id}
                        label={assignedPair.rightText}
                        disabled={submitted}
                        correct={showReviewCorrect}
                        incorrect={showReviewWrong}
                        active={activeId === assignedPair.id}
                        connected={rowConnected}
                        reviewIndex={assignedPairIndex >= 0 ? assignedPairIndex + 1 : undefined}
                      />
                    ) : null}
                  </MatchingRowTarget>
                </div>
              );
            })}
          </div>

          <DragOverlay dropAnimation={null}>{activePair ? <MatchingChip label={activePair.rightText} overlay /> : null}</DragOverlay>
        </DndContext>
      </div>
    </QuestionBodyWithImage>
  );
}

function MobileMatchingAnswerPicker({
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
          <div className="text-sm font-medium text-slate-700">Select an Answer</div>
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

function createNextMatchingAssignments(
  currentAssignments: Record<string, string>,
  rowId: string,
  optionId: string,
) {
  const nextAssignments = Object.fromEntries(
    Object.entries(currentAssignments).filter(([existingRowId, existingOptionId]) =>
      existingRowId === rowId ? false : existingOptionId !== optionId,
    ),
  );

  nextAssignments[rowId] = optionId;
  return nextAssignments;
}

function MatchingRowTarget({
  rowId,
  children,
}: {
  rowId: string;
  children: ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: `row:${rowId}` });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[56px] w-full min-w-0 items-stretch ${isOver ? "rounded-lg ring-2 ring-offset-2" : ""}`}
      style={isOver ? { backgroundColor: "var(--quiz-option-selected-bg)", ["--tw-ring-color" as string]: "rgba(59, 130, 246, 0.24)" } : undefined}
    >
      {children}
    </div>
  );
}

function DraggableMatchingChip({
  id,
  rowId,
  label,
  disabled,
  correct,
  incorrect,
  active,
  connected,
  reviewIndex,
}: {
  id: string;
  rowId: string;
  label: string;
  disabled: boolean;
  correct?: boolean;
  incorrect?: boolean;
  active: boolean;
  connected: boolean;
  reviewIndex?: number;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    disabled,
    data: {
      rowId,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className="w-full min-w-0"
      style={{
        transform: CSS.Translate.toString(transform),
      }}
    >
      <MatchingChip
        label={label}
        dragging={isDragging}
        locked={disabled}
        correct={correct}
        incorrect={incorrect}
        active={active}
        connected={connected}
        reviewIndex={reviewIndex}
        dragProps={{
          ...(attributes as ButtonHTMLAttributes<HTMLButtonElement>),
          ...(listeners as ButtonHTMLAttributes<HTMLButtonElement>),
        }}
      />
    </div>
  );
}

function MatchingChip({
  label,
  dragging = false,
  overlay = false,
  locked = false,
  correct = false,
  incorrect = false,
  active = false,
  connected = false,
  reviewIndex,
  dragProps,
}: {
  label: string;
  dragging?: boolean;
  overlay?: boolean;
  locked?: boolean;
  correct?: boolean;
  incorrect?: boolean;
  active?: boolean;
  connected?: boolean;
  reviewIndex?: number;
  dragProps?: ButtonHTMLAttributes<HTMLButtonElement>;
}) {
  return (
    <button
      type="button"
      className={`relative inline-flex min-h-[56px] w-full min-w-0 items-center justify-between gap-3 rounded-r-lg border-2 px-4 pl-7 text-left text-lg leading-[1.35] shadow-sm transition sm:text-[22px] ${
        overlay || active
          ? "border-[#c6b66a] bg-[#fff0a8] shadow-sm"
          : correct
            ? "border-[#8fb37f] bg-[#f4fff0]"
            : incorrect
              ? "border-[#ff8178] bg-[#fff7f6]"
            : "border-slate-300 bg-white"
      } ${connected ? "md:-ml-[2px] md:border-l-0" : ""} ${dragging ? "opacity-15" : ""} ${locked ? "cursor-default" : "cursor-grab"}`}
      style={!overlay && !active && !correct && !incorrect ? { borderColor: "var(--quiz-canvas-border)", backgroundColor: "var(--quiz-input-bg)", color: "var(--quiz-option-text)" } : undefined}
      {...dragProps}
    >
      <span
        className={`pointer-events-none absolute left-[-18px] top-1/2 z-[4] h-7 w-[18px] -translate-y-1/2 rounded-l-full border-2 border-r-0 ${
          overlay || active
            ? "border-[#c6b66a] bg-[#fff0a8]"
            : correct
              ? "border-[#8fb37f] bg-[#f4fff0]"
              : incorrect
                ? "border-[#ff8178] bg-[#fff7f6]"
                : "border-slate-300 bg-white"
        }`}
        style={!overlay && !active && !correct && !incorrect ? { borderColor: "var(--quiz-canvas-border)", backgroundColor: "var(--quiz-input-bg)" } : undefined}
      />
      {reviewIndex ? (
        <span
          className="font-semibold"
          style={{ color: correct ? "#78b816" : incorrect ? "#e65a4d" : "currentColor" }}
        >
          {reviewIndex}.
        </span>
      ) : null}
      <span className="min-w-0 flex-1 whitespace-normal break-words">{label}</span>
      {!overlay ? <span aria-hidden="true" className="text-xl text-slate-500">⋮⋮</span> : null}
    </button>
  );
}
