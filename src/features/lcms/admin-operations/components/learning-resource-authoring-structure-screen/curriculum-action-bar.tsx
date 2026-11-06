import Add from "@mui/icons-material/Add";
import CalendarMonth from "@mui/icons-material/CalendarMonth";
import Pencil from "@mui/icons-material/Edit";
import Trash2 from "@mui/icons-material/DeleteOutlined";
import Refresh from "@mui/icons-material/Refresh";
import Search from "@mui/icons-material/Search";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";

import type { ResourceCommandId } from "@/features/lcms/admin-operations/utils/learning-resource-curriculum-view-model";

export function CurriculumActionBar({
  selectedKind,
  selectedLabel,
  canEdit,
  canDelete,
  onOpenSchedule,
  onCommand,
  searchValue,
  onSearchChange,
  onRefresh,
}: {
  selectedKind: "none" | "subject" | "level" | "topic";
  selectedLabel: string;
  canEdit: boolean;
  canDelete: boolean;
  onOpenSchedule: () => void;
  onCommand: (id: ResourceCommandId) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
}) {
  const createCommand = selectedKind === "none" ? "create-subject" : selectedKind === "subject" ? "create-level" : selectedKind === "level" ? "create-topic" : "create-lesson";
  const createLabel = selectedKind === "none" ? "Tạo môn học" : selectedKind === "subject" ? "Thêm Level (Chặng học)" : selectedKind === "level" ? "Thêm chủ đề" : "Thêm bài học";

  return (
    <div className="flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#D9E2EF] bg-white px-4 py-2">
      <div className="min-w-0">
        <div className="truncate text-sm font-bold text-[#1D1D1F]">{selectedLabel}</div>
        <div className="text-[11.5px] text-[#637381]">
          {selectedKind === "topic"
            ? "Danh sách bài học trong chủ đề"
            : "Cấu trúc môn học: Level (tùy chọn) → Chủ đề (tùy chọn) → Bài học"}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <TextField
          size="small"
          placeholder="Tìm môn học, level, chủ đề…"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 16, color: "#94A3B8" }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            width: { xs: 170, sm: 220, md: 250 },
            "& .MuiOutlinedInput-root": {
              height: 32,
              fontSize: 12,
              bgcolor: "#FAFAFC",
              borderRadius: 1.5,
              "& fieldset": { borderColor: "#E2E8F0" },
              "&:hover fieldset": { borderColor: "#CBD5E1" },
              "&.Mui-focused fieldset": { borderColor: "#0071E3" },
            },
          }}
        />
        <Tooltip title="Làm mới dữ liệu">
          <IconButton size="small" onClick={onRefresh} sx={{ color: "#64748B", p: 0.6, "&:hover": { color: "#0071E3", bgcolor: "#EFF6FF" } }}>
            <Refresh sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
        <Button
          variant="outlined"
          size="small"
          startIcon={<CalendarMonth sx={{ fontSize: 16 }} />}
          disabled={selectedKind === "none"}
          onClick={onOpenSchedule}
          aria-label="Mở khung chương trình môn học"
          title={selectedKind === "none" ? "Chọn một môn học trước" : "Thiết lập khung chương trình và phân bổ số tiết môn học"}
          sx={{
            height: 32,
            fontSize: 12,
            fontWeight: 600,
            textTransform: "none",
            borderRadius: 1.5,
            borderColor: "#E2E8F0",
            color: "#1E293B",
            "&:hover": { borderColor: "#0071E3", bgcolor: "#EFF6FF" },
          }}
        >
          Khung chương trình
        </Button>
        <Button
          variant="contained"
          size="small"
          startIcon={<Add sx={{ fontSize: 16 }} />}
          onClick={() => onCommand(createCommand)}
          sx={{
            height: 32,
            fontSize: 12,
            fontWeight: 600,
            bgcolor: "#0071E3",
            boxShadow: "none",
            textTransform: "none",
            borderRadius: 1.5,
            "&:hover": { bgcolor: "#0058B0" },
          }}
        >
          {createLabel}
        </Button>
        <span className="mx-0.5 h-5 w-px bg-[#D9E2EF]" />
        <Tooltip title="Chỉnh sửa mục đang chọn">
          <span>
            <IconButton
              size="small"
              disabled={!canEdit}
              onClick={() => onCommand("edit")}
              aria-label="Chỉnh sửa mục đang chọn"
              sx={{ p: 0.6, color: "#64748B", "&:hover": { color: "#0071E3", bgcolor: "#EFF6FF" } }}
            >
              <Pencil sx={{ fontSize: 16 }} />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Xem tác động trước khi xóa">
          <span>
            <IconButton
              size="small"
              color="error"
              disabled={!canDelete}
              onClick={() => onCommand("delete")}
              aria-label="Xem tác động trước khi xóa"
              sx={{ p: 0.6, "&:hover": { bgcolor: "#FEF2F2" } }}
            >
              <Trash2 sx={{ fontSize: 16 }} />
            </IconButton>
          </span>
        </Tooltip>
      </div>
    </div>
  );
}
