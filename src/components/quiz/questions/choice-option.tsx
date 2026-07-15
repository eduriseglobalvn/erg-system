import { Check, X } from "lucide-react";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

type ChoiceOptionProps = {
  children: ReactNode;
  disabled?: boolean;
  mode: "single" | "multiple";
  onClick: () => void;
  reviewMode?: boolean;
  selected: boolean;
  showCorrect?: boolean;
  showWrong?: boolean;
};

type EditableChoiceOptionProps = {
  correct: boolean;
  disabled?: boolean;
  label: string;
  mode: "single" | "multiple";
  onCorrectToggle: () => void;
  onLabelChange: (value: string) => void;
  onRemove?: () => void;
};

export function ChoiceOption({
  children,
  disabled = false,
  mode,
  onClick,
  reviewMode = false,
  selected,
  showCorrect = false,
  showWrong = false,
}: ChoiceOptionProps) {
  const showStatus = reviewMode && (showCorrect || showWrong);
  const isMultiple = mode === "multiple";
  const selectedAccent = "#e48b47";
  const successColor = "#118D57";
  const dangerColor = "#e82828";
  const reviewAccent = showCorrect ? successColor : showWrong ? dangerColor : null;
  const accentColor = reviewAccent ?? (selected ? selectedAccent : "#000088");
  const markerRadius = mode === "single" ? "999px" : "6px";
  const innerRadius = mode === "single" ? "999px" : "3px";
  const selectedResting = selected && !reviewMode;
  const markerChecked = reviewMode ? selected || showCorrect || showWrong : selected;
  const rowStyle = {
    "--choice-bg": "transparent",
    "--choice-border": "transparent",
    "--choice-shadow": "none",
  } as CSSProperties;
  const markerStyle: CSSProperties = isMultiple
    ? {
        background: markerChecked
          ? reviewAccent ?? "linear-gradient(180deg, #f2a762 0%, #e48b47 100%)"
          : "#ffffff",
        borderColor: reviewAccent ?? (markerChecked ? selectedAccent : "#cfd6df"),
        borderRadius: markerRadius,
        borderWidth: markerChecked ? "1px" : "1.5px",
        boxShadow: markerChecked
          ? `0 8px 18px ${reviewAccent === successColor ? "rgba(17,141,87,0.22)" : reviewAccent === dangerColor ? "rgba(232,40,40,0.20)" : "rgba(228,139,71,0.22)"}`
          : "0 1px 2px rgba(15,23,42,0.06)",
      }
    : {
        borderColor: reviewAccent ?? (markerChecked ? selectedAccent : "rgba(0,0,136,0.24)"),
        borderRadius: markerRadius,
        borderWidth: markerChecked ? "3px" : "1.5px",
      };
  const textColor = reviewMode
    ? showCorrect
      ? successColor
      : showWrong
        ? dangerColor
        : "#82b8cb"
    : selectedResting && isMultiple
        ? selectedAccent
        : selectedResting
          ? selectedAccent
          : "#172033";
  const gridClass = "grid-cols-[30px_34px_minmax(0,1fr)] gap-3 sm:grid-cols-[34px_38px_minmax(0,1fr)] sm:gap-4";

  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      className={`grid min-h-[calc(var(--quiz-control-height)+18px)] w-full ${gridClass} items-center rounded-xl border border-[var(--choice-border)] bg-[var(--choice-bg)] px-3 py-3 text-left shadow-[var(--choice-shadow)] transition hover:-translate-y-0.5 hover:border-[rgba(0,0,136,0.18)] hover:bg-[#eef3ff] hover:shadow-[0_14px_30px_rgba(0,0,136,0.075)] focus-visible:border-[rgba(0,0,136,0.24)] focus-visible:bg-[#eef3ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(95,143,230,0.22)] disabled:pointer-events-none disabled:cursor-default disabled:hover:translate-y-0 sm:px-4`}
      style={rowStyle}
      onClick={() => {
        if (disabled) return;
        onClick();
      }}
    >
      <span className="grid h-8 w-8 place-items-center justify-self-start">
        {showStatus ? (
          <span
            className="grid h-7 w-7 place-items-center rounded-full text-white shadow-[0_8px_18px_rgba(23,32,51,0.12)] sm:h-8 sm:w-8"
            style={{ backgroundColor: showCorrect ? successColor : dangerColor }}
          >
            <span className="sr-only">{showCorrect ? "Dung" : "Sai"}</span>
            {showCorrect ? <Check className="h-4 w-4 stroke-[3.4]" /> : <X className="h-4 w-4 stroke-[3.4]" />}
          </span>
        ) : null}
      </span>

      <span
        className="inline-flex h-7 w-7 items-center justify-center justify-self-center border bg-white shadow-sm sm:h-8 sm:w-8"
        style={markerStyle}
      >
        {isMultiple && markerChecked ? (
          <Check className="h-4 w-4 stroke-[3.4] text-white sm:h-5 sm:w-5" />
        ) : markerChecked ? (
          <span
            className="h-2 w-2 sm:h-2.5 sm:w-2.5"
            style={{
              backgroundColor: accentColor,
              borderRadius: innerRadius,
            }}
          />
        ) : null}
      </span>

      <span
        className="min-w-0 text-[var(--quiz-readable-size-lg)] font-semibold leading-[1.38]"
        style={{ color: textColor }}
      >
        {children}
      </span>
    </button>
  );
}

export function EditableChoiceOption({
  correct,
  disabled = false,
  label,
  mode,
  onCorrectToggle,
  onLabelChange,
  onRemove,
}: EditableChoiceOptionProps) {
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const isMultiple = mode === "multiple";
  const successColor = "#118D57";
  const markerRadius = mode === "single" ? "999px" : "6px";
  const innerRadius = mode === "single" ? "999px" : "3px";
  const markerStyle: CSSProperties = isMultiple
    ? {
        background: correct ? "linear-gradient(180deg, #22C55E 0%, #118D57 100%)" : "#ffffff",
        borderColor: correct ? successColor : "#cfd6df",
        borderRadius: markerRadius,
        borderWidth: correct ? "1px" : "1.5px",
        boxShadow: correct ? "0 8px 18px rgba(17,141,87,0.22)" : "0 1px 2px rgba(15,23,42,0.06)",
      }
    : {
        borderColor: correct ? successColor : "rgba(0,0,136,0.24)",
        borderRadius: markerRadius,
        borderWidth: correct ? "3px" : "1.5px",
      };
  const rowStyle = {
    "--choice-bg": correct ? "linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%)" : "transparent",
    "--choice-border": "transparent",
    "--choice-shadow": correct ? "0 16px 34px rgba(17,141,87,0.10)" : "none",
  } as CSSProperties;

  useEffect(() => {
    const element = textAreaRef.current;
    if (!element) return;

    resizeTextArea(element);
  }, [label]);

  return (
    <div
      className="relative grid min-h-[calc(var(--quiz-control-height)+18px)] w-full grid-cols-[44px_minmax(0,1fr)] items-start gap-4 rounded-xl border border-[var(--choice-border)] bg-[var(--choice-bg)] px-3 py-3 text-left shadow-[var(--choice-shadow)] transition hover:border-[rgba(0,0,136,0.18)] hover:bg-[#eef3ff] hover:shadow-[0_14px_30px_rgba(0,0,136,0.075)] sm:grid-cols-[52px_minmax(0,1fr)] sm:px-4"
      style={rowStyle}
    >
      <button
        type="button"
        disabled={disabled}
        className="mt-2 inline-flex h-7 w-7 items-center justify-center justify-self-center border bg-white shadow-sm disabled:cursor-default sm:h-8 sm:w-8"
        style={markerStyle}
        onClick={onCorrectToggle}
        aria-label="Mark correct answer"
      >
        {isMultiple && correct ? (
          <Check className="h-4 w-4 stroke-[3.4] text-white sm:h-5 sm:w-5" />
        ) : correct ? (
          <span
            className="h-2 w-2 sm:h-2.5 sm:w-2.5"
            style={{
              backgroundColor: successColor,
              borderRadius: innerRadius,
            }}
          />
        ) : null}
      </button>

      <textarea
        ref={textAreaRef}
        className={`quiz-runtime-edit-input min-h-[calc(var(--quiz-control-height)-6px)] min-w-0 resize-none overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm px-3 py-2 text-[var(--quiz-readable-size-lg)] font-bold leading-[1.38] outline-none transition focus:border-[rgba(0,0,136,0.24)] focus:ring-2 focus:ring-[rgba(95,143,230,0.16)] ${correct ? "is-correct" : ""}`}
        style={{ color: correct ? successColor : "#172033", overflowWrap: "anywhere", whiteSpace: "pre-wrap" }}
        value={label}
        disabled={disabled}
        rows={1}
        onChange={(event) => onLabelChange(event.target.value)}
        onInput={(event) => resizeTextArea(event.currentTarget)}
      />

      {onRemove ? (
        <button
          type="button"
          className="quiz-runtime-edit-remove matching-puzzle__remove-button"
          onClick={onRemove}
          aria-label="Remove option"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

function resizeTextArea(element: HTMLTextAreaElement) {
  element.style.height = "auto";
  element.style.height = `${element.scrollHeight}px`;
}
