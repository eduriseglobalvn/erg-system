import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { X } from "lucide-react";
import { useEffect, useRef, type ButtonHTMLAttributes, type TextareaHTMLAttributes } from "react";

import type { QuestionImage, SequenceItem } from "@/domain/quiz/types";

import { SequenceHandle } from "./sequence-card";
import { SequenceImageControls, SequenceInlineImage } from "./sequence-media";

export function DraggableEditableSequenceItem({
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
