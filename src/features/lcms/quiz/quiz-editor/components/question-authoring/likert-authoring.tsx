import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import RemoveIcon from "@mui/icons-material/Remove";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import { useId } from "react";

import type { LikertRow, Question } from "@/domain/quiz/types";
import { detectLikertPreset, LIKERT_PRESETS, type LikertPresetId, resizeLikertScale } from "./likert-presets";

const MIN = 2;
const MAX = 7;
const cellSx = { px: 1.5, py: 0.5, borderBottom: 1, borderColor: "divider", textAlign: "center" } as const;

function nextRowId(rows: LikertRow[]) {
  let n = rows.length + 1;
  while (rows.some((r) => r.id === `row-${n}`)) n += 1;
  return `row-${n}`;
}

export function LikertAuthoring({ question, onChange }: { question: Question; onChange: (next: Question) => void }) {
  const scale = question.likertScale ?? [];
  const rows = question.likertRows ?? [];
  const preset = detectLikertPreset(scale);
  const labelId = useId();
  const count = scale.length;
  const setScale = (next: typeof scale) => onChange({ ...question, likertScale: next });
  const setRows = (next: LikertRow[]) => onChange({ ...question, likertRows: next });
  const addRow = () => setRows([...rows, { id: nextRowId(rows), label: "" }]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Typography variant="body2">Số mức</Typography>
          <IconButton aria-label="Bớt một mức" disabled={count <= MIN} onClick={() => setScale(resizeLikertScale(scale, count - 1, preset))} size="small"><RemoveIcon fontSize="small" /></IconButton>
          <Typography aria-live="polite" variant="body2">{count}</Typography>
          <IconButton aria-label="Thêm một mức" disabled={count >= MAX} onClick={() => setScale(resizeLikertScale(scale, count + 1, preset))} size="small"><AddIcon fontSize="small" /></IconButton>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography id={labelId} variant="body2">Mẫu nhãn</Typography>
          <Select
            inputProps={{ "aria-labelledby": labelId }}
            onChange={(e) => {
              setScale(resizeLikertScale(scale, count, e.target.value as LikertPresetId));
            }}
            size="small"
            SelectDisplayProps={{ "aria-labelledby": labelId }}
            value={preset}
          >
            {LIKERT_PRESETS.map((p) => <MenuItem key={p.id} value={p.id}>{p.label}</MenuItem>)}
          </Select>
        </Box>
      </Box>
      <Box sx={{ overflowX: "auto", maxWidth: "100%" }}>
        <Box component="table" sx={{ borderCollapse: "collapse", width: "100%", minWidth: "max-content" }}>
          <thead>
            <tr>
              <Box component="th" sx={{ ...cellSx, textAlign: "left" }}>Nhận định</Box>
              {scale.map((point) => (
                <Box component="th" key={point.id} sx={cellSx}>
                  <InputBase
                    inputProps={{ "aria-label": `Nhãn mức ${point.value}`, style: { textAlign: "center" } }}
                    onChange={(e) => setScale(scale.map((p) => (p.id === point.id ? { ...p, label: e.target.value } : p)))}
                    placeholder={`Mức ${point.value}`}
                    value={point.label}
                  />
                </Box>
              ))}
              <Box component="th" sx={cellSx} />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id}>
                <Box component="td" sx={{ ...cellSx, textAlign: "left" }}>
                  <InputBase
                    fullWidth
                    inputProps={{ "aria-label": `Nhận định ${index + 1}` }}
                    onChange={(e) => setRows(rows.map((r) => (r.id === row.id ? { ...r, label: e.target.value } : r)))}
                    onKeyDown={(e) => {
                      if (e.nativeEvent.isComposing || e.keyCode === 229 || e.key !== "Enter" || index !== rows.length - 1 || !row.label.trim()) return;
                      e.preventDefault();
                      addRow();
                    }}
                    placeholder="Nhập nhận định"
                    value={row.label}
                  />
                </Box>
                {scale.map((p) => <Box component="td" key={p.id} sx={cellSx}><Box aria-hidden sx={{ width: 14, height: 14, border: 1, borderColor: "divider", borderRadius: "50%", mx: "auto" }} /></Box>)}
                <Box component="td" sx={cellSx}>
                  <IconButton aria-label={`Xóa nhận định ${index + 1}`} disabled={rows.length <= 1} onClick={() => setRows(rows.filter((r) => r.id !== row.id))} size="small"><DeleteOutlineIcon fontSize="small" /></IconButton>
                </Box>
              </tr>
            ))}
          </tbody>
        </Box>
      </Box>
      <Button onClick={addRow} sx={{ alignSelf: "flex-start" }} variant="text">+ Thêm nhận định</Button>
    </Box>
  );
}
