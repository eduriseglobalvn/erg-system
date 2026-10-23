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
import { Check, ChevronDown, ImagePlus, Link2, X } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ChangeEvent,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";

import { QuestionBodyWithImage } from "@/components/quiz/questions/shared";
import type { QuestionComponentProps } from "@/components/quiz/questions/types";
import { useIsMobile } from "@/hooks/use-mobile";
import type { MatchingPair, QuestionImage } from "@/lib/types";
import { cn } from "@/lib/utils";

type DisplayMatchingPair = MatchingPair & {
  leftText: string;
  rightText: string;
  leftIcon?: MatchingPair["promptIcon"];
  rightIcon?: MatchingPair["responseIcon"];
  leftImage?: MatchingPair["promptImage"];
  rightImage?: MatchingPair["responseImage"];
};

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
          rightText: pair.response,
          leftIcon: pair.promptIcon,
          rightIcon: pair.responseIcon,
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
                {reviewMode ? (
                  <div className={`px-3 pb-3 text-xs font-medium ${isCorrect ? "text-lime-600" : "text-rose-600"}`}>
                    {isCorrect ? "Ghép chính xác" : `Đáp án đúng: ${pair.rightText}`}
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
      <div className="matching-puzzle">
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => setActiveId(null)}>
          <div className="matching-puzzle__list">
            {displayPairs.map((pair, index) => {
              const assignedId = currentOrder[index];
              const assignedPair = assignedId ? pairMap.get(assignedId) ?? null : null;
              const assignedPairIndex = assignedId ? displayPairs.findIndex((item) => item.id === assignedId) : -1;
              const showReviewCorrect = reviewMode && assignedId === displayPairs[index]?.id;
              const showReviewWrong = reviewMode && assignedId !== displayPairs[index]?.id;
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

function createMatchingId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
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

function EditableMatchingResponseChip({
  id,
  pair,
  index,
  active,
  removable,
  onResponseChange,
  onResponseImageChange,
  onRemove,
}: {
  id: string;
  pair: DisplayMatchingPair;
  index: number;
  active: boolean;
  removable: boolean;
  onResponseChange: (response: string) => void;
  onResponseImageChange: (image: QuestionImage | undefined) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });

  return (
    <div
      ref={setNodeRef}
      className="w-full min-w-0"
      style={isDragging ? undefined : { transform: CSS.Translate.toString(transform) }}
    >
      <div
        className={cn(
          "matching-puzzle__response-card is-connected",
          active && "is-active",
          isDragging && "is-dragging",
          "matching-puzzle__response-card--editable",
        )}
      >
        <MatchingInlineMedia
          image={pair.rightImage}
          icon={pair.rightIcon}
          label={pair.rightText}
          size="lg"
          onImageResize={
            pair.rightImage
              ? (width) => onResponseImageChange({ ...pair.rightImage!, width })
              : undefined
          }
          onImageRemove={pair.rightImage ? () => onResponseImageChange(undefined) : undefined}
        />
        <AutoResizeMatchingTextarea
          className="quiz-runtime-edit-input matching-puzzle__response-text"
          value={pair.response}
          onChange={(event) => onResponseChange(event.target.value)}
          aria-label={`Response ${index + 1}`}
        />
        <MatchingImageControls
          image={pair.responseImage}
          label={`Ảnh đáp án ${index + 1}`}
          onChange={onResponseImageChange}
        />
        {removable ? (
          <button type="button" className="quiz-runtime-edit-remove matching-puzzle__remove-button" onClick={onRemove} aria-label={`Xóa cặp ${index + 1}`}>
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
        <button
          type="button"
          className="matching-puzzle__handle-button"
          aria-label={`Kéo đáp án ${index + 1} để ghép`}
          {...(attributes as ButtonHTMLAttributes<HTMLButtonElement>)}
          {...(listeners as ButtonHTMLAttributes<HTMLButtonElement>)}
        >
          <span aria-hidden="true" className="matching-puzzle__handle" />
        </button>
      </div>
    </div>
  );
}

function MatchingImageControls({
  image,
  label,
  onChange,
}: {
  image?: QuestionImage;
  label: string;
  onChange: (image: QuestionImage | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const imageUrl = await readImageAsDataUrl(file);
    onChange({ url: imageUrl, alt: file.name });
  }

  return (
    <span className="matching-puzzle__media-controls">
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept="image/*"
        aria-label={label}
        onChange={handleFileChange}
      />
      <button
        type="button"
        className="matching-puzzle__media-button"
        aria-label={image?.url ? `${label} - đổi ảnh` : `${label} - chèn ảnh`}
        onClick={() => inputRef.current?.click()}
      >
        <ImagePlus className="h-4 w-4" />
      </button>
      {image?.url ? (
        <button
          type="button"
          className="matching-puzzle__media-button matching-puzzle__media-button--danger"
          aria-label={`${label} - xóa ảnh`}
          onClick={() => onChange(undefined)}
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </span>
  );
}

function readImageAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Cannot read image file."));
    reader.readAsDataURL(file);
  });
}

function ImageResizeHandle({
  width,
  min,
  max,
  onResize,
}: {
  width: number;
  min: number;
  max: number;
  onResize: (width: number) => void;
}) {
  function handlePointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startWidth = width;
    const pointerId = event.pointerId;
    event.currentTarget.setPointerCapture(pointerId);

    function handlePointerMove(moveEvent: PointerEvent) {
      const nextWidth = Math.max(min, Math.min(max, Math.round(startWidth + moveEvent.clientX - startX)));
      onResize(nextWidth);
    }

    function handlePointerUp() {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
  }

  return (
    <button
      type="button"
      className="question-image-resize-handle"
      aria-label="Resize image"
      onPointerDown={handlePointerDown}
    />
  );
}

function AutoResizeMatchingTextarea({
  value,
  onChange,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  value: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    resizeMatchingTextarea(textareaRef.current);
  }, [value]);

  return (
    <textarea
      {...props}
      ref={textareaRef}
      value={value}
      rows={1}
      onChange={onChange}
      onInput={(event) => resizeMatchingTextarea(event.currentTarget)}
      style={{
        ...(props.style ?? {}),
        overflowWrap: "anywhere",
        whiteSpace: "pre-wrap",
      }}
    />
  );
}

function resizeMatchingTextarea(textarea: HTMLTextAreaElement | null) {
  if (!textarea) return;
  textarea.style.height = "0px";
  textarea.style.height = `${textarea.scrollHeight}px`;
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

function MatchingInlineMedia({
  image,
  icon,
  label,
  size = "sm",
  onImageResize,
  onImageRemove,
}: {
  image?: MatchingPair["promptImage"];
  icon?: string;
  label: string;
  size?: "sm" | "lg";
  onImageResize?: (width: number) => void;
  onImageRemove?: () => void;
}) {
  if (image?.url) {
    return (
      <span
        className={cn(
          "matching-inline-media grid flex-none place-items-center overflow-hidden rounded-md border border-slate-200 bg-white",
          onImageResize && "matching-inline-media--resizable",
          size === "lg" ? "matching-inline-media--lg h-10 w-10" : "h-8 w-8",
        )}
        style={image.width ? ({ "--matching-editor-image-size": `${image.width}px` } as CSSProperties) : undefined}
      >
        <img src={image.url} alt={image.alt ?? label} className="h-full w-full object-contain" />
        {onImageRemove ? (
          <button
            type="button"
            className="matching-inline-media__remove"
            aria-label={`Xóa ảnh ${label}`}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onImageRemove();
            }}
          >
            <X className="h-3 w-3" />
          </button>
        ) : null}
        {onImageResize ? (
          <ImageResizeHandle
            width={image.width ?? 76}
            onResize={onImageResize}
            min={44}
            max={150}
          />
        ) : null}
      </span>
    );
  }

  if (!icon) return null;

  return (
    <span
      className={cn(
        "matching-inline-media grid flex-none place-items-center rounded-md border font-semibold",
        size === "lg" ? "matching-inline-media--lg h-10 w-10 text-xl" : "h-8 w-8 text-base",
      )}
      style={{
        color: "var(--quiz-accent-start)",
        borderColor: "color-mix(in srgb, var(--quiz-accent-start) 28%, transparent)",
        backgroundColor: "color-mix(in srgb, var(--quiz-accent-start) 9%, transparent)",
      }}
      aria-hidden="true"
    >
      {icon}
    </span>
  );
}

function MatchingRowTarget({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="matching-puzzle__target">
      {children}
    </div>
  );
}

function MatchingPuzzleRow({
  rowId,
  className,
  children,
}: {
  rowId: string;
  className?: string;
  children: ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: `row:${rowId}` });

  return (
    <div
      ref={setNodeRef}
      className={cn("matching-puzzle__row", className, isOver && "is-over")}
    >
      {children}
    </div>
  );
}

function DraggableMatchingChip({
  id,
  rowId,
  label,
  icon,
  image,
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
  icon?: string;
  image?: MatchingPair["responseImage"];
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
      style={isDragging ? undefined : { transform: CSS.Translate.toString(transform) }}
    >
      <MatchingChip
        label={label}
        icon={icon}
        image={image}
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
  icon,
  image,
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
  icon?: string;
  image?: MatchingPair["responseImage"];
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
      className={cn(
        "matching-puzzle__response-card",
        overlay && "is-overlay",
        active && "is-active",
        correct && "is-correct",
        incorrect && "is-incorrect",
        connected && "is-connected",
        dragging && "is-dragging",
        locked ? "is-locked" : "is-draggable",
      )}
      {...dragProps}
    >
      {reviewIndex && (correct || incorrect) ? (
        <span
          className="matching-puzzle__index"
          style={{ color: correct ? "#78b816" : incorrect ? "#e65a4d" : "currentColor" }}
        >
          {reviewIndex}.
        </span>
      ) : null}
      <MatchingInlineMedia image={image} icon={icon} label={label} size="lg" />
      <span className="matching-puzzle__response-text">{label}</span>
      {!overlay ? <span aria-hidden="true" className="matching-puzzle__handle" /> : null}
    </button>
  );
}
