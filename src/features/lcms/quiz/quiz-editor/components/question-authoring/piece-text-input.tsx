import Box from "@mui/material/Box";
import type { ChangeEvent, KeyboardEvent } from "react";

/** A text box whose width follows its text and wraps inside the piece (spec 7.1 `contenteditable`): a hidden copy sizes the grid cell. */
export function PieceTextInput({ value, onChange, label, placeholder, onEnter, inputId }: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
  onEnter?: () => void;
  inputId?: string;
}) {
  return (
    <Box
      data-value={value || placeholder}
      sx={{
        display: "inline-grid", minWidth: 0, maxWidth: "100%", typography: "body1",
        "&::after": { content: 'attr(data-value) " "', whiteSpace: "pre-wrap", overflowWrap: "anywhere", visibility: "hidden", gridArea: "1 / 1" },
      }}
    >
      <Box
        aria-label={label}
        // cols={1} drops the default 20-column width, so the hidden copy alone sizes the cell
        cols={1}
        component="textarea"
        data-input-id={inputId}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value.replace(/\r?\n/g, " "))}
        onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
          if (e.key !== "Enter" || e.nativeEvent.isComposing || e.keyCode === 229) return;
          e.preventDefault();
          onEnter?.();
        }}
        placeholder={placeholder}
        rows={1}
        sx={{
          gridArea: "1 / 1", width: "100%", minWidth: 0, resize: "none", overflow: "hidden", border: 0, p: 0, m: 0, bgcolor: "transparent", font: "inherit", color: "inherit",
          "&::placeholder": { color: "text.secondary", opacity: 1 },
        }}
        value={value}
      />
    </Box>
  );
}
