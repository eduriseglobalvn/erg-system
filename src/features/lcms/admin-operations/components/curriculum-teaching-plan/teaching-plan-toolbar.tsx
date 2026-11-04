import CreateNewFolder from "@mui/icons-material/CreateNewFolder";
import FormatListNumbered from "@mui/icons-material/FormatListNumbered";
import PlaylistAdd from "@mui/icons-material/PlaylistAdd";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";

import type { EditableCurriculumRow } from "./types";

export function TeachingPlanToolbar({
  rows,
  uniqueTopics,
  selectedTopic,
  setSelectedTopic,
  isSaving,
  isSyncing,
  addNewTopic,
  addRowToSelectedTopic,
  renumberPeriods,
}: {
  rows: EditableCurriculumRow[];
  uniqueTopics: string[];
  selectedTopic: string;
  setSelectedTopic: (topic: string) => void;
  isSaving: boolean;
  isSyncing: boolean;
  addNewTopic: () => void;
  addRowToSelectedTopic: (type: "lesson" | "review" | "practice") => void;
  renumberPeriods: () => void;
}) {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
        <Button
          variant="contained"
          size="small"
          startIcon={<CreateNewFolder fontSize="small" />}
          onClick={() => addNewTopic()}
          disabled={isSaving || isSyncing}
          sx={{
            textTransform: "none",
            fontSize: 12.5,
            fontWeight: 700,
            bgcolor: "#0F6CBD",
            color: "#FFFFFF",
            borderRadius: 1.5,
            px: 1.5,
            boxShadow: "0 1px 3px rgba(15, 108, 189, 0.2)",
            "&:hover": { bgcolor: "#0B5594" },
          }}
        >
          + Thêm chủ đề mới
        </Button>

        {uniqueTopics.length > 0 ? (
          <>
            <Box sx={{ width: "1px", height: 24, bgcolor: "#CBD5E1", mx: 0.5 }} />

            <FormControl size="small" sx={{ minWidth: 200, maxWidth: 260 }}>
              <InputLabel sx={{ fontSize: 12 }}>Chủ đề để thêm</InputLabel>
              <Select
                size="small"
                label="Chủ đề để thêm"
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                sx={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  bgcolor: "#FFFFFF",
                  "& .MuiSelect-select": { py: 0.6 },
                }}
              >
                {uniqueTopics.map((topicName, idx) => (
                  <MenuItem key={`${topicName}-${idx}`} value={topicName} sx={{ fontSize: 12.5 }}>
                    {topicName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              size="small"
              startIcon={<PlaylistAdd fontSize="small" />}
              onClick={() => addRowToSelectedTopic("lesson")}
              disabled={!selectedTopic || isSaving || isSyncing}
              sx={{
                textTransform: "none",
                fontSize: 12,
                fontWeight: 600,
                bgcolor: "#FFFFFF",
                color: "#1E293B",
                borderColor: "#CBD5E1",
                borderRadius: 1.5,
                "&:hover": { bgcolor: "#F1F5F9", borderColor: "#94A3B8" },
              }}
            >
              Thêm bài học
            </Button>

            <Button
              variant="outlined"
              size="small"
              onClick={() => addRowToSelectedTopic("review")}
              disabled={!selectedTopic || isSaving || isSyncing}
              sx={{
                textTransform: "none",
                fontSize: 12,
                fontWeight: 600,
                bgcolor: "#EFF6FF",
                color: "#1E40AF",
                borderColor: "#BFDBFE",
                borderRadius: 1.5,
                "&:hover": { bgcolor: "#DBEAFE", borderColor: "#93C5FD" },
              }}
            >
              + Tiết Ôn tập
            </Button>

            <Button
              variant="outlined"
              size="small"
              onClick={() => addRowToSelectedTopic("practice")}
              disabled={!selectedTopic || isSaving || isSyncing}
              sx={{
                textTransform: "none",
                fontSize: 12,
                fontWeight: 600,
                bgcolor: "#FAF5FF",
                color: "#6B21A8",
                borderColor: "#E9D5FF",
                borderRadius: 1.5,
                "&:hover": { bgcolor: "#F3E8FF", borderColor: "#D8B4FE" },
              }}
            >
              + Tiết Luyện thi
            </Button>
          </>
        ) : null}
      </Box>

      {rows.length > 0 ? (
        <Button
          variant="outlined"
          size="small"
          startIcon={<FormatListNumbered sx={{ color: "#0F6CBD", fontSize: 18 }} />}
          onClick={renumberPeriods}
          disabled={isSaving || isSyncing}
          sx={{
            textTransform: "none",
            fontSize: 12.5,
            fontWeight: 700,
            color: "#0F6CBD",
            bgcolor: "#EFF6FF",
            borderColor: "#BFDBFE",
            borderRadius: 1.5,
            px: 1.5,
            py: 0.5,
            boxShadow: "0 1px 2px rgba(15, 108, 189, 0.08)",
            "&:hover": {
              bgcolor: "#DBEAFE",
              borderColor: "#93C5FD",
              color: "#0C5A9E",
            },
          }}
        >
          Đánh lại số tiết (1 → {rows.length})
        </Button>
      ) : null}
    </Box>
  );
}
