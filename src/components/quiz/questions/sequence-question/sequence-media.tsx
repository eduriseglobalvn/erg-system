import { ImagePlus, X } from "lucide-react";
import { useCallback, useRef, type ChangeEvent, type PointerEvent as ReactPointerEvent } from "react";

import type { QuestionImage } from "@/lib/types";

export function SequenceInlineImage({
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

export function SequenceImageControls({
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
