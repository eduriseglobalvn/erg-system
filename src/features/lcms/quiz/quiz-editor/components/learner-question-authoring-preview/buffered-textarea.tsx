import { useEffect, useRef, useState, type CSSProperties } from "react";

type BufferedTextProps = {
  value: string;
  onCommit: (value: string) => void;
  className?: string;
  style?: CSSProperties;
  rows?: number;
  maxLength?: number;
  placeholder?: string;
  mediaTarget?: {
    kind: "choice" | "drag-item";
    id: string;
    field?: "label" | "target";
  };
  onFocusTarget?: () => void;
  autoSelectOnFocus?: boolean;
  "aria-label"?: string;
};

export function BufferedTextarea({
  value,
  onCommit,
  className,
  style,
  rows,
  placeholder,
  mediaTarget,
  onFocusTarget,
  autoSelectOnFocus,
  "aria-label": ariaLabel,
}: BufferedTextProps) {
  const { draft, handleBlur, handleChange, handleFocus } = useBufferedText(value, onCommit);
  const textAreaRef = useAutoResizeTextarea(draft);

  return (
    <textarea
      ref={textAreaRef}
      className={className}
      value={draft}
      rows={rows}
      style={style}
      data-media-target-kind={mediaTarget?.kind}
      data-media-target-id={mediaTarget?.id}
      data-media-target-field={mediaTarget?.field}
      placeholder={placeholder}
      onFocus={(event) => {
        onFocusTarget?.();
        handleFocus();
        if (autoSelectOnFocus) {
          const val = event.currentTarget.value.trim();
          if (val === "Tiêu đề câu hỏi" || val === "Câu hỏi mới" || val.startsWith("Tiêu đề")) {
            event.currentTarget.select();
          }
        }
      }}
      onDoubleClick={(event) => {
        event.currentTarget.select();
      }}
      onClick={(event) => {
        if (autoSelectOnFocus) {
          const val = event.currentTarget.value.trim();
          if (val === "Tiêu đề câu hỏi" || val === "Câu hỏi mới" || val.startsWith("Tiêu đề")) {
            event.currentTarget.select();
          }
        }
      }}
      onBlur={handleBlur}
      onChange={(event) => handleChange(event.target.value)}
      aria-label={ariaLabel}
    />
  );
}

function useAutoResizeTextarea(value: string) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, [value]);

  return ref;
}

function useBufferedText(value: string, onCommit: (value: string) => void) {
  const [draft, setDraft] = useState(value);
  const commitRef = useRef(onCommit);
  const focusedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    commitRef.current = onCommit;
  }, [onCommit]);

  useEffect(() => {
    if (!focusedRef.current) {
      setDraft(value);
    }
  }, [value]);

  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    },
    [],
  );

  function commit(nextValue: string) {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    commitRef.current(nextValue);
  }

  function handleChange(nextValue: string) {
    setDraft(nextValue);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => commitRef.current(nextValue), 90);
  }

  function handleFocus() {
    focusedRef.current = true;
  }

  function handleBlur() {
    focusedRef.current = false;
    commit(draft);
  }

  return { draft, handleBlur, handleChange, handleFocus };
}
