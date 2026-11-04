import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { ChevronDown, Link2 } from "lucide-react";
import { useMemo, useState } from "react";

import {
  EditableMatchingResponseChip,
  DraggableMatchingChip,
  MatchingChip,
  MatchingPuzzleRow,
  MatchingRowTarget,
} from "@/components/quiz/questions/matching-question/matching-chips";
import {
  createMatchingId,
  createNextMatchingAssignments,
  type DisplayMatchingPair,
} from "@/components/quiz/questions/matching-question/matching-helpers";
import {
  AutoResizeMatchingTextarea,
  MatchingImageControls,
  MatchingInlineMedia,
} from "@/components/quiz/questions/matching-question/matching-media";
import { MobileMatchingAnswerPicker } from "@/components/quiz/questions/matching-question/mobile-matching-answer-picker";
import { QuestionBodyWithImage } from "@/components/quiz/questions/shared";
import type { QuestionComponentProps } from "@/components/quiz/questions/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { getMatchingKey } from "@/domain/quiz/quiz";
import type { MatchingPair } from "@/domain/quiz/types";
import { cn } from "@/lib/utils";

export function MatchingQuestion({
  question,
  value,
  submitted = false,
  reviewMode = false,
  onChange,
  editable = false,
  onQuestionChange,
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
  const matchingKey = getMatchingKey(question);
  const hasNewShape = Boolean(question.matchingResponses);

  const rowIds = displayPairs.map((pair) => pair.id);
  const pairMap = useMemo(() => new Map(displayPairs.map((pair) => [pair.id, pair])), [displayPairs]);
  const currentOrder = useMemo(() => {
    if (value.matchingOrder?.length) {
      return value.matchingOrder;
    }

    if (value.matchingAssignments && Object.keys(value.matchingAssignments).length > 0) {
      return rowIds.map((rowId) => value.matchingAssignments?.[rowId] ?? (hasNewShape ? "" : rowId));
    }

    return hasNewShape ? responseOptions.map((option) => option.id) : [...rowIds].reverse();
  }, [hasNewShape, responseOptions, rowIds, value.matchingAssignments, value.matchingOrder]);

  const activePair = activeId ? responseMap.get(activeId) ?? null : null;
  const connectedRows = submitted || reviewMode ? rowIds : (value.matchingConnectedRows ?? []);

  function emitPairs(nextPairs: MatchingPair[]) {
    onQuestionChange?.({ ...question, matching: nextPairs });
  }

  function updatePair(pairId: string, patch: Partial<MatchingPair>) {
    emitPairs(displayPairs.map((pair) => (pair.id === pairId ? { ...pair, ...patch } : pair)));
  }

  function removePair(pairId: string) {
    emitPairs(displayPairs.filter((pair) => pair.id !== pairId));
  }

  function addPair() {
    emitPairs([
      ...displayPairs,
      {
        id: createMatchingId("match"),
        prompt: `Prompt ${displayPairs.length + 1}`,
        response: "Response",
      },
    ]);
  }

  function emit(nextOrder: string[], nextConnectedRows: string[]) {
    onChange({
      matchingOrder: nextOrder,
      matchingConnectedRows: nextConnectedRows,
    });
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleEditableDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const draggedResponseId = String(active.id);
    const overId = String(over.id);
    if (!overId.startsWith("row:")) return;

    const targetRowId = overId.replace("row:", "");
    const sourceIndex = displayPairs.findIndex((pair) => pair.id === draggedResponseId);
    const targetIndex = displayPairs.findIndex((pair) => pair.id === targetRowId);
    if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return;

    const responses = displayPairs.map((pair) => ({
      response: pair.response,
      responseIcon: pair.responseIcon,
      responseImage: pair.responseImage,
    }));
    const [movedResponse] = responses.splice(sourceIndex, 1);
    responses.splice(targetIndex, 0, movedResponse);

    emitPairs(
      displayPairs.map((pair, index) => ({
        ...pair,
        response: responses[index]?.response ?? pair.response,
        responseIcon: responses[index]?.responseIcon,
        responseImage: responses[index]?.responseImage,
      })),
    );
  }

  if (editable && onQuestionChange) {
    return (
      <QuestionBodyWithImage question={question}>
        <div className="matching-puzzle">
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleEditableDragEnd} onDragCancel={() => setActiveId(null)}>
            <div className="matching-puzzle__list">
              {displayPairs.map((pair, index) => (
                <MatchingPuzzleRow key={pair.id} rowId={pair.id} className="is-connected">
                  <div className="matching-puzzle__prompt-card">
                    <span className="matching-puzzle__review-index">{index + 1}.</span>
                    <MatchingInlineMedia
                      image={pair.leftImage}
                      icon={pair.leftIcon}
                      label={pair.leftText}
                      size="lg"
                      onImageResize={
                        pair.leftImage
                          ? (width) => updatePair(pair.id, { promptImage: { ...pair.leftImage!, width } })
                          : undefined
                      }
                      onImageRemove={pair.leftImage ? () => updatePair(pair.id, { promptImage: undefined }) : undefined}
                    />
                    <AutoResizeMatchingTextarea
                      className="quiz-runtime-edit-input matching-puzzle__prompt-text"
                      value={pair.prompt}
                      onChange={(event) => updatePair(pair.id, { prompt: event.target.value })}
                      aria-label={`Prompt ${index + 1}`}
                    />
                    <MatchingImageControls
                      image={pair.promptImage}
                      label={`Ảnh prompt ${index + 1}`}
                      onChange={(promptImage) => updatePair(pair.id, { promptImage })}
                    />
                  </div>

                  <MatchingRowTarget>
                    <EditableMatchingResponseChip
                      id={pair.id}
                      pair={pair}
                      index={index}
                      active={activeId === pair.id}
                      onResponseChange={(response) => updatePair(pair.id, { response })}
                      onResponseImageChange={(responseImage) => updatePair(pair.id, { responseImage })}
                      onRemove={() => removePair(pair.id)}
                      removable={displayPairs.length > 2}
                    />
                  </MatchingRowTarget>
                </MatchingPuzzleRow>
              ))}
            </div>

            <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }}>
              {activePair ? (
                <MatchingChip
                  label={activePair.rightText}
                  icon={activePair.rightIcon}
                  image={activePair.rightImage}
                  overlay
                />
              ) : null}
            </DragOverlay>
          </DndContext>
          <button type="button" className="quiz-runtime-edit-add" onClick={addPair}>
            Add pair
          </button>
        </div>
      </QuestionBodyWithImage>
    );
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

  return (
    <QuestionBodyWithImage question={question}>
      <div className="matching-puzzle">
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => setActiveId(null)}>
          <div className="matching-puzzle__list">
            {displayPairs.map((pair, index) => {
              const assignedId = currentOrder[index];
              const assignedPair = assignedId ? responseMap.get(assignedId) ?? null : null;
              const assignedPairIndex = assignedId ? displayPairs.findIndex((item) => matchingKey?.[item.id] === assignedId) : -1;
              const correctResponseId = matchingKey?.[pair.id];
              const showReviewCorrect = reviewMode && Boolean(correctResponseId) && assignedId === correctResponseId;
              const showReviewWrong = reviewMode && Boolean(correctResponseId) && assignedId !== correctResponseId;
              const rowConnected = connectedRows.includes(pair.id);

              return (
                <MatchingPuzzleRow
                  key={pair.id}
                  rowId={pair.id}
                  className={cn(
                    rowConnected && "is-connected",
                    showReviewCorrect && "is-correct",
                    showReviewWrong && "is-incorrect",
                  )}
                >
                  <div className="matching-puzzle__prompt-card">
                    {reviewMode ? (
                      <span
                        className="matching-puzzle__review-index"
                        style={{ color: showReviewCorrect ? "#78b816" : "#e65a4d" }}
                      >
                        {index + 1}.
                      </span>
                    ) : null}
                    <MatchingInlineMedia image={pair.leftImage} icon={pair.leftIcon} label={pair.leftText} size="lg" />
                    <span className="matching-puzzle__prompt-text">{pair.leftText}</span>
                  </div>

                  <MatchingRowTarget>
                    {assignedPair ? (
                      <DraggableMatchingChip
                        id={assignedPair.id}
                        rowId={pair.id}
                        label={assignedPair.rightText}
                        icon={assignedPair.rightIcon}
                        image={assignedPair.rightImage}
                        disabled={submitted}
                        correct={showReviewCorrect}
                        incorrect={showReviewWrong}
                        active={activeId === assignedPair.id}
                        connected={rowConnected}
                        reviewIndex={assignedPairIndex >= 0 ? assignedPairIndex + 1 : undefined}
                      />
                    ) : null}
                  </MatchingRowTarget>
                </MatchingPuzzleRow>
              );
            })}
          </div>

          <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }}>
            {activePair ? (
              <MatchingChip
                label={activePair.rightText}
                icon={activePair.rightIcon}
                image={activePair.rightImage}
                overlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </QuestionBodyWithImage>
  );
}

