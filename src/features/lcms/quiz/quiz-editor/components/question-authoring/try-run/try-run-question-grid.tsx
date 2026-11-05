import { useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";

export type CellState = "đúng" | "sai" | "chưa làm" | "đã làm";

type Props = {
  /** State per question; the grid shows "đang làm" for the current one. */
  states: CellState[];
  current: number;
  onSelect: (index: number) => void;
};

const fill: Partial<Record<CellState, string>> = { "đúng": "success.main", "sai": "error.main", "đã làm": "primary.main" };

export function TryRunQuestionGrid({ states, current, onSelect }: Props) {
  const n = states.length;
  const answered = states.filter((s) => s !== "chưa làm").length;
  const cols = n <= 20 ? 5 : 10;
  const size = n <= 20 ? 40 : 30;
  const currentRef = useRef<HTMLButtonElement>(null);
  useEffect(() => currentRef.current?.scrollIntoView?.({ block: "nearest" }), [current]);

  return (
    <Box component="aside" sx={{ border: 1, borderColor: "divider", borderRadius: "20px", flex: "0 1 300px", minWidth: 0, p: 2.5 }}>
      <Typography sx={{ fontWeight: "fontWeightBold" }} variant="body2">
        Danh sách câu hỏi
      </Typography>
      <Typography color="text.secondary" variant="caption">{`${answered}/${n} đã làm`}</Typography>
      <LinearProgress sx={{ borderRadius: 3, height: 6, my: 1.5 }} value={n ? (answered / n) * 100 : 0} variant="determinate" />
      <Box
        sx={{
          display: "grid",
          gap: n <= 20 ? 1 : 0.5,
          gridTemplateColumns: `repeat(${cols}, ${size}px)`,
          maxHeight: n > 100 ? 340 : undefined,
          overflowY: n > 100 ? "auto" : undefined,
          p: 0.5,
        }}
      >
        {states.map((state, i) => {
          const isCurrent = i === current;
          const solid = fill[state];
          return (
            <ButtonBase
              aria-current={isCurrent ? "step" : undefined}
              aria-label={`Câu ${i + 1}, ${isCurrent ? "đang làm" : state}`}
              key={i}
              onClick={() => onSelect(i)}
              ref={isCurrent ? currentRef : undefined}
              sx={{
                bgcolor: solid ?? "background.paper",
                border: 1.5,
                borderColor: solid ?? "divider",
                borderRadius: 1,
                color: solid ? "common.white" : "text.primary",
                height: size,
                outline: isCurrent ? "2px solid" : "none",
                outlineColor: solid ?? "primary.main",
                outlineOffset: 2,
                typography: "caption",
                width: size,
              }}
            >
              {i + 1}
            </ButtonBase>
          );
        })}
      </Box>
      <Typography color="text.secondary" component="p" sx={{ mt: 1.5 }} variant="caption">
        {states.some((s) => s === "đúng" || s === "sai") ? "Đúng · Sai · Chưa làm" : "Đã làm · Chưa làm"}
      </Typography>
    </Box>
  );
}
