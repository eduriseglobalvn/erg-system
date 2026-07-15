import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
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

const visuallyHiddenSx = { border: 0, clip: "rect(0 0 0 0)", height: 1, margin: -1, overflow: "hidden", p: 0, position: "absolute", whiteSpace: "nowrap", width: 1 } as const;

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
  const rowStyle = { "--choice-bg": "transparent", "--choice-border": "transparent", "--choice-shadow": "none" } as CSSProperties;
  const markerStyle: CSSProperties = isMultiple
    ? {
        background: markerChecked ? reviewAccent ?? "linear-gradient(180deg, #f2a762 0%, #e48b47 100%)" : "#ffffff",
        borderColor: reviewAccent ?? (markerChecked ? selectedAccent : "#cfd6df"),
        borderRadius: markerRadius,
        borderStyle: "solid",
        borderWidth: markerChecked ? "1px" : "1.5px",
        boxShadow: markerChecked
          ? `0 8px 18px ${reviewAccent === successColor ? "rgba(17,141,87,0.22)" : reviewAccent === dangerColor ? "rgba(232,40,40,0.20)" : "rgba(228,139,71,0.22)"}`
          : "0 1px 2px rgba(15,23,42,0.06)",
      }
    : {
        borderColor: reviewAccent ?? (markerChecked ? selectedAccent : "rgba(0,0,136,0.24)"),
        borderRadius: markerRadius,
        borderStyle: "solid",
        borderWidth: markerChecked ? "3px" : "1.5px",
      };
  const textColor = reviewMode ? showCorrect ? successColor : showWrong ? dangerColor : "#82b8cb" : selectedResting ? selectedAccent : "#172033";

  return (
    <ButtonBase
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      style={rowStyle}
      onClick={() => { if (!disabled) onClick(); }}
      sx={{
        alignItems: "center",
        bgcolor: "var(--choice-bg)",
        border: "1px solid var(--choice-border)",
        borderRadius: 1.5,
        boxShadow: "var(--choice-shadow)",
        display: "grid",
        gap: { xs: 1.5, sm: 2 },
        gridTemplateColumns: { xs: "30px 34px minmax(0,1fr)", sm: "34px 38px minmax(0,1fr)" },
        justifyContent: "stretch",
        minHeight: "calc(var(--quiz-control-height) + 18px)",
        px: { xs: 1.5, sm: 2 },
        py: 1.5,
        textAlign: "left",
        transition: "transform 160ms ease, border-color 160ms ease, background-color 160ms ease, box-shadow 160ms ease",
        width: "100%",
        "&:hover": { bgcolor: "#eef3ff", borderColor: "rgba(0,0,136,0.18)", boxShadow: "0 14px 30px rgba(0,0,136,0.075)", transform: "translateY(-2px)" },
        "&:focus-visible": { bgcolor: "#eef3ff", borderColor: "rgba(0,0,136,0.24)", outline: "none", boxShadow: "0 0 0 2px rgba(95,143,230,0.22)" },
        "&:disabled": { cursor: "default", pointerEvents: "none" },
      }}
    >
      <Box sx={{ alignItems: "center", display: "grid", height: 32, justifySelf: "start", placeItems: "center", width: 32 }}>
        {showStatus ? (
          <Box sx={{ alignItems: "center", bgcolor: showCorrect ? successColor : dangerColor, borderRadius: "999px", boxShadow: "0 8px 18px rgba(23,32,51,0.12)", color: "common.white", display: "grid", height: { xs: 28, sm: 32 }, placeItems: "center", width: { xs: 28, sm: 32 } }}>
            <Box component="span" sx={visuallyHiddenSx}>{showCorrect ? "Đúng" : "Sai"}</Box>
            {showCorrect ? <CheckIcon sx={{ fontSize: 16 }} /> : <CloseIcon sx={{ fontSize: 16 }} />}
          </Box>
        ) : null}
      </Box>

      <Box component="span" sx={{ alignItems: "center", bgcolor: "common.white", display: "inline-flex", height: { xs: 28, sm: 32 }, justifyContent: "center", justifySelf: "center", width: { xs: 28, sm: 32 }, ...markerStyle }}>
        {isMultiple && markerChecked ? <CheckIcon sx={{ color: "common.white", fontSize: { xs: 16, sm: 20 } }} /> : markerChecked ? <Box component="span" sx={{ bgcolor: accentColor, borderRadius: innerRadius, height: { xs: 8, sm: 10 }, width: { xs: 8, sm: 10 } }} /> : null}
      </Box>

      <Box component="span" sx={{ color: textColor, fontSize: "var(--quiz-readable-size-lg)", fontWeight: 600, lineHeight: 1.38, minWidth: 0 }}>{children}</Box>
    </ButtonBase>
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
    ? { background: correct ? "linear-gradient(180deg, #22C55E 0%, #118D57 100%)" : "#ffffff", borderColor: correct ? successColor : "#cfd6df", borderRadius: markerRadius, borderStyle: "solid", borderWidth: correct ? "1px" : "1.5px", boxShadow: correct ? "0 8px 18px rgba(17,141,87,0.22)" : "0 1px 2px rgba(15,23,42,0.06)" }
    : { borderColor: correct ? successColor : "rgba(0,0,136,0.24)", borderRadius: markerRadius, borderStyle: "solid", borderWidth: correct ? "3px" : "1.5px" };

  useEffect(() => {
    const element = textAreaRef.current;
    if (element) resizeTextArea(element);
  }, [label]);

  return (
    <Box className="quiz-runtime-edit-input-row" sx={{ alignItems: "start", background: correct ? "linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%)" : "transparent", border: "1px solid transparent", borderRadius: 1.5, boxShadow: correct ? "0 16px 34px rgba(17,141,87,0.10)" : "none", display: "grid", gap: 2, gridTemplateColumns: { xs: "44px minmax(0,1fr)", sm: "52px minmax(0,1fr)" }, minHeight: "calc(var(--quiz-control-height) + 18px)", px: { xs: 1.5, sm: 2 }, py: 1.5, position: "relative", width: "100%", "&:hover": { bgcolor: "#eef3ff", borderColor: "rgba(0,0,136,0.18)", boxShadow: "0 14px 30px rgba(0,0,136,0.075)" } }}>
      <ButtonBase type="button" disabled={disabled} onClick={onCorrectToggle} aria-label="Mark correct answer" sx={{ ...markerStyle, alignItems: "center", bgcolor: "common.white", display: "inline-flex", height: { xs: 28, sm: 32 }, justifyContent: "center", justifySelf: "center", mt: 1, width: { xs: 28, sm: 32 } }}>
        {isMultiple && correct ? <CheckIcon sx={{ color: "common.white", fontSize: { xs: 16, sm: 20 } }} /> : correct ? <Box component="span" sx={{ bgcolor: successColor, borderRadius: innerRadius, height: { xs: 8, sm: 10 }, width: { xs: 8, sm: 10 } }} /> : null}
      </ButtonBase>

      <Box
        component="textarea"
        ref={textAreaRef}
        className={correct ? "quiz-runtime-edit-input is-correct" : "quiz-runtime-edit-input"}
        value={label}
        disabled={disabled}
        rows={1}
        onChange={(event) => onLabelChange(event.target.value)}
        onInput={(event) => resizeTextArea(event.currentTarget)}
        sx={{ bgcolor: "common.white", border: "1px solid #f1f5f9", borderRadius: 1, color: correct ? successColor : "#172033", fontSize: "var(--quiz-readable-size-lg)", fontWeight: 700, lineHeight: 1.38, minHeight: "calc(var(--quiz-control-height) - 6px)", minWidth: 0, overflow: "hidden", overflowWrap: "anywhere", p: "8px 12px", resize: "none", width: "100%", "&:focus": { borderColor: "rgba(0,0,136,0.24)", boxShadow: "0 0 0 2px rgba(95,143,230,0.16)", outline: "none" } }}
      />

      {onRemove ? <ButtonBase type="button" className="quiz-runtime-edit-remove matching-puzzle__remove-button" onClick={onRemove} aria-label="Remove option" sx={{ minWidth: 28, minHeight: 28 }}><CloseIcon sx={{ fontSize: 14 }} /></ButtonBase> : null}
    </Box>
  );
}

function resizeTextArea(element: HTMLTextAreaElement) {
  element.style.height = "auto";
  element.style.height = `${element.scrollHeight}px`;
}
