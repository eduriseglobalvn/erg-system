import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ImagePlus, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";

import { QuestionBodyWithImage } from "@/components/quiz/questions/shared";
import type { QuestionComponentProps } from "@/components/quiz/questions/types";
import { useIsMobile } from "@/hooks/use-mobile";
import type { QuestionImage, SequenceItem } from "@/lib/types";

export function SequenceQuestion({
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
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 6 },
    }),
  );

  const items = useMemo(() => question.sequenceItems ?? [], [question.sequenceItems]);
  const itemIds = useMemo(() => items.map((item) => item.id), [items]);
  const itemMap = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const currentOrder = useMemo(() => {
    if (value.sequenceOrder?.length) {
      return value.sequenceOrder;
    }

    return [...itemIds].reverse();
  }, [itemIds, value.sequenceOrder]);
  const activeItem = activeId ? itemMap.get(activeId) ?? null : null;

  function emitItems(nextItems: SequenceItem[]) {
    onQuestionChange?.({ ...question, sequenceItems: nextItems });
  }

  function updateItem(itemId: string, patch: Partial<SequenceItem>) {
    emitItems(items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)));
  }

  function removeItem(itemId: string) {
    emitItems(items.filter((item) => item.id !== itemId));
  }

  function addItem() {
    emitItems([
      ...items,
      {
        id: createSequenceId("sequence"),
        label: `Step ${items.length + 1}`,
      },
    ]);
  }

  function emit(nextOrder: string[]) {
    onChange({ sequenceOrder: nextOrder });
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const draggedId = String(active.id);
    const overId = String(over.id);
    if (!overId.startsWith("sequence-row:")) return;

    const sourceIndex = currentOrder.findIndex((itemId) => itemId === draggedId);
    const targetIndex = currentOrder.findIndex((itemId) => itemId === overId.replace("sequence-row:", ""));
    if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return;

    const nextOrder = [...currentOrder];
    const [moved] = nextOrder.splice(sourceIndex, 1);
    nextOrder.splice(targetIndex, 0, moved);
    emit(nextOrder);
  }

  function handleEditableDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const draggedId = String(active.id);
    const overId = String(over.id);
    if (!overId.startsWith("sequence-row:")) return;

    const targetId = overId.replace("sequence-row:", "");
    const sourceIndex = items.findIndex((item) => item.id === draggedId);
    const targetIndex = items.findIndex((item) => item.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return;

    const nextItems = [...items];
    const [moved] = nextItems.splice(sourceIndex, 1);
    nextItems.splice(targetIndex, 0, moved);
    emitItems(nextItems);
  }

  if (editable && onQuestionChange) {
    return (
      <QuestionBodyWithImage question={question}>
        <div className={`quiz-answer-region flex flex-col ${isMobile ? "gap-2.5" : "gap-4"}`}>
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleEditableDragEnd} onDragCancel={() => setActiveId(null)}>
            <div className={`flex flex-col ${isMobile ? "gap-2.5" : "gap-5"}`}>
              {items.map((item, index) => (
                <SequenceRowTarget key={item.id} rowId={item.id}>
                  <DraggableEditableSequenceItem
                    item={item}
                    index={index}
                    compact={isMobile}
                    active={activeId === item.id}
                    totalItems={items.length}
                    onLabelChange={(label) => updateItem(item.id, { label })}
                    onImageChange={(image) => updateItem(item.id, { image })}
                    onRemove={() => removeItem(item.id)}
                  />
                </SequenceRowTarget>
              ))}
            </div>
            <DragOverlay dropAnimation={null}>
              {activeItem ? (
                <div className={`flex items-stretch ${isMobile ? "gap-2" : "gap-3 sm:gap-4"}`}>
                  <span
                    className={
                      isMobile
                        ? "flex w-7 flex-none items-center justify-center text-[18px] font-bold"
                        : "flex w-12 flex-none items-center justify-center text-[var(--quiz-readable-size-lg)] font-extrabold sm:w-16"
                    }
                    style={{ color: "#174f91" }}
                  >
                    {Math.max(1, items.findIndex((item) => item.id === activeItem.id) + 1)}.
                  </span>
                  <SequenceCard item={activeItem} overlay compact={isMobile} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
          <button type="button" className="quiz-runtime-edit-add" onClick={addItem}>
            Add step
          </button>
        </div>
      </QuestionBodyWithImage>
    );
  }

  return (
    <QuestionBodyWithImage question={question}>
      <div className={`quiz-answer-region flex flex-col ${isMobile ? "gap-2.5" : "gap-4"}`}>
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => setActiveId(null)}>
          <div className={`flex flex-col ${isMobile ? "gap-2.5" : "gap-5"}`}>
            {currentOrder.map((itemId, index) => {
              const item = itemMap.get(itemId);
              if (!item) return null;

              const originalIndex = itemIds.findIndex((candidateId) => candidateId === itemId);
              const correctPosition = reviewMode && itemId === itemIds[index];

              return (
                <SequenceRowTarget key={item.id} rowId={item.id}>
                  <div className={`flex items-stretch ${isMobile ? "gap-2" : "gap-3 sm:gap-4"}`}>
                    <span
                      className={isMobile ? "flex w-7 flex-none items-center justify-center text-[18px] font-bold" : "flex w-12 flex-none items-center justify-center text-[var(--quiz-readable-size-lg)] font-extrabold sm:w-16"}
                      style={{ color: "#174f91" }}
                    >
                      {index + 1}.
                    </span>
                    <DraggableSequenceItem
                      item={item}
                      disabled={submitted}
                      active={activeId === item.id}
                      compact={isMobile}
                      correct={correctPosition}
                      incorrect={reviewMode && !correctPosition}
                      reviewIndex={reviewMode && originalIndex >= 0 ? originalIndex + 1 : undefined}
                    />
                  </div>
                </SequenceRowTarget>
              );
            })}
          </div>

          <DragOverlay dropAnimation={null}>{activeItem ? <SequenceCard item={activeItem} overlay compact={isMobile} /> : null}</DragOverlay>
        </DndContext>
      </div>
    </QuestionBodyWithImage>
  );
}

function DraggableEditableSequenceItem({
  item,
  index,
  compact,
  active,
  totalItems,
  onLabelChange,
  onImageChange,
  onRemove,
}: {
  item: SequenceItem;
  index: number;
  compact: boolean;
  active: boolean;
  totalItems: number;
  onLabelChange: (label: string) => void;
  onImageChange: (image: QuestionImage | undefined) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      className={`flex items-stretch ${compact ? "gap-2" : "gap-3 sm:gap-4"}`}
      style={{ transform: CSS.Translate.toString(transform) }}
    >
      <span
        className={
          compact
            ? "flex w-7 flex-none items-center justify-center text-[18px] font-bold"
            : "flex w-12 flex-none items-center justify-center text-[var(--quiz-readable-size-lg)] font-extrabold sm:w-16"
        }
        style={{ color: "#174f91" }}
      >
        {index + 1}.
      </span>
      <div className={`min-w-0 flex-1 ${isDragging ? "opacity-15" : ""}`}>
        <div
          className={`relative flex min-h-[calc(var(--quiz-control-height)+12px)] w-full items-start gap-2 rounded-[10px] border border-[#d1d5db] bg-white text-left text-[var(--quiz-readable-size-lg)] font-semibold leading-[1.35] text-[#174f91] shadow-[0_8px_18px_rgba(15,23,42,0.06)] transition ${
            active ? "border-[#c6b66a] bg-[#fffdf0] shadow-[0_16px_30px_rgba(15,23,42,0.12)]" : "hover:border-[#b8bec8] hover:shadow-[0_12px_24px_rgba(15,23,42,0.09)]"
          } ${compact ? "px-4 py-2.5" : "px-7 py-4"}`}
        >
          <SequenceInlineImage
            image={item.image}
            label={item.label}
            onResize={(width) => item.image ? onImageChange({ ...item.image, width }) : undefined}
          />
          <AutoResizeSequenceTextarea
            className="quiz-runtime-edit-input min-w-0 flex-1 resize-none overflow-hidden"
            value={item.label}
            onChange={(event) => onLabelChange(event.target.value)}
            aria-label={`Step ${index + 1}`}
          />
          <SequenceImageControls
            image={item.image}
            label={`Ảnh bước ${index + 1}`}
            onChange={onImageChange}
          />

          {totalItems > 2 ? (
            <button
              type="button"
              className="quiz-runtime-edit-remove matching-puzzle__remove-button"
              onClick={onRemove}
              aria-label={`Xóa bước ${index + 1}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
          <button
            type="button"
            className={compact ? "mt-1 grid h-8 w-7 flex-none touch-none place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600" : "mt-1 grid h-10 w-8 flex-none touch-none place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"}
            aria-label={`Kéo bước ${index + 1} để sắp xếp`}
            {...(attributes as ButtonHTMLAttributes<HTMLButtonElement>)}
            {...(listeners as ButtonHTMLAttributes<HTMLButtonElement>)}
          >
            <SequenceHandle />
          </button>
        </div>
      </div>
    </div>
  );
}

function SequenceInlineImage({
  image,
  label,
  onResize,
}: {
  image?: QuestionImage;
  label: string;
  onResize?: (width: number) => void;
}) {
  if (!image?.url) return null;

  return (
    <span
      className="sequence-question-image"
      style={image.width ? { width: image.width, height: image.width } : undefined}
    >
      <img src={image.url} alt={image.alt ?? label} className="h-full w-full object-contain" />
      {onResize ? (
        <ImageResizeHandle
          width={image.width ?? 72}
          min={44}
          max={150}
          onResize={onResize}
        />
      ) : null}
    </span>
  );
}

function SequenceImageControls({
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
    onChange({ url: imageUrl, alt: file.name, width: image?.width ?? 72 });
  }

  return (
    <span className="sequence-question-media-controls">
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
        className="sequence-question-media-button"
        aria-label={image?.url ? `${label} - đổi ảnh` : `${label} - chèn ảnh`}
        onClick={() => inputRef.current?.click()}
      >
        <ImagePlus className="h-4 w-4" />
      </button>
      {image?.url ? (
        <button
          type="button"
          className="sequence-question-media-button sequence-question-media-button--danger"
          aria-label={`${label} - xóa ảnh`}
          onClick={() => onChange(undefined)}
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </span>
  );
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
  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startWidth = width;

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
  }, [max, min, onResize, width]);

  return (
    <button
      type="button"
      className="question-image-resize-handle"
      aria-label="Resize image"
      onPointerDown={handlePointerDown}
    />
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

function AutoResizeSequenceTextarea({
  value,
  onChange,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  value: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    resizeTextarea(textareaRef.current);
  }, [value]);

  return (
    <textarea
      {...props}
      ref={textareaRef}
      value={value}
      rows={1}
      onChange={onChange}
      onInput={(event) => resizeTextarea(event.currentTarget)}
      style={{
        ...(props.style ?? {}),
        overflowWrap: "anywhere",
        whiteSpace: "pre-wrap",
      }}
    />
  );
}

function resizeTextarea(textarea: HTMLTextAreaElement | null) {
  if (!textarea) return;
  textarea.style.height = "0px";
  textarea.style.height = `${textarea.scrollHeight}px`;
}

function SequenceRowTarget({
  rowId,
  children,
}: {
  rowId: string;
  children: ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: `sequence-row:${rowId}` });

  return (
    <div
      ref={setNodeRef}
      className="rounded-xl transition"
      style={isOver ? { backgroundColor: "rgba(0,0,136,0.06)", outline: "2px dashed rgba(0,0,136,0.18)", outlineOffset: 2 } : undefined}
    >
      {children}
    </div>
  );
}

function DraggableSequenceItem({
  item,
  disabled,
  active,
  compact,
  correct,
  incorrect,
  reviewIndex,
}: {
  item: SequenceItem;
  disabled: boolean;
  active: boolean;
  compact: boolean;
  correct?: boolean;
  incorrect?: boolean;
  reviewIndex?: number;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      className="min-w-0 flex-1"
      style={{
        transform: CSS.Translate.toString(transform),
      }}
    >
      <SequenceCard
        item={item}
        dragging={isDragging}
        active={active}
        compact={compact}
        locked={disabled}
        correct={correct}
        incorrect={incorrect}
        reviewIndex={reviewIndex}
        dragProps={{
          ...(attributes as ButtonHTMLAttributes<HTMLButtonElement>),
          ...(listeners as ButtonHTMLAttributes<HTMLButtonElement>),
        }}
      />
    </div>
  );
}

function SequenceCard({
  item,
  dragging = false,
  overlay = false,
  locked = false,
  active = false,
  compact = false,
  correct = false,
  incorrect = false,
  reviewIndex,
  dragProps,
}: {
  item: SequenceItem;
  dragging?: boolean;
  overlay?: boolean;
  locked?: boolean;
  active?: boolean;
  compact?: boolean;
  correct?: boolean;
  incorrect?: boolean;
  reviewIndex?: number;
  dragProps?: ButtonHTMLAttributes<HTMLButtonElement>;
}) {
  const stateClass =
    overlay || active
      ? "border-[#c6b66a] bg-[#fff0a8] shadow-[0_16px_30px_rgba(15,23,42,0.12)]"
      : correct
        ? "border-[#8fb37f] bg-[#f4fff0]"
        : incorrect
          ? "border-[#e1a6a0] bg-[#fff5f4]"
          : "border-[#d1d5db] bg-white shadow-[0_8px_18px_rgba(15,23,42,0.06)] hover:border-[#b8bec8] hover:shadow-[0_12px_24px_rgba(15,23,42,0.09)]";

  return (
    <button
      type="button"
      className={`touch-none flex w-full items-center justify-between gap-2 border text-left text-slate-900 shadow-sm transition ${
        compact
          ? "min-h-[48px] rounded-lg px-4 py-2.5 text-[16px] font-semibold leading-6"
          : "min-h-[calc(var(--quiz-control-height)+12px)] rounded-[10px] px-7 py-4 text-[var(--quiz-readable-size-lg)] font-semibold leading-[1.35]"
      } ${stateClass} ${dragging ? "opacity-15" : ""} ${locked ? "cursor-default" : "cursor-grab"}`}
      style={
        !overlay && !active && !correct && !incorrect
          ? {
              background: "linear-gradient(180deg, #ffffff, #fbfbfc)",
              color: "#174f91",
              paddingLeft: compact ? undefined : "34px",
            }
          : { paddingLeft: compact ? undefined : "34px" }
      }
      {...dragProps}
    >
      {reviewIndex ? (
        <span
          className="shrink-0 font-semibold"
          style={{ color: correct ? "#78b816" : incorrect ? "#e65a4d" : "currentColor" }}
        >
          {reviewIndex}.
        </span>
      ) : null}
      <SequenceInlineImage image={item.image} label={item.label} />
      <span className="min-w-0 flex-1 break-words">{item.label}</span>
      {!overlay ? (
        <span aria-hidden="true" className={compact ? "grid h-8 w-7 place-items-center text-slate-400" : "grid h-10 w-8 place-items-center text-slate-400"}>
          {compact ? <GripVertical className="h-4 w-4" /> : <SequenceHandle />}
        </span>
      ) : null}
    </button>
  );
}

function createSequenceId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
}

function SequenceHandle() {
  return (
    <span className="grid h-[22px] w-3.5 grid-cols-2 grid-rows-3 place-items-center" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <span key={index} className="h-1 w-1 rounded-full bg-[#7b7f86]" />
      ))}
    </span>
  );
}
