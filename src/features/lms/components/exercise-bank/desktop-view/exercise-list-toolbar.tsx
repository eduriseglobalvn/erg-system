import CloseIcon from "@mui/icons-material/Close";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";

import { ErgSearchField } from "@/components/erg-mui/erg-form";
import {
  allExerciseFilter,
  difficultyLabels,
  type ExerciseSource,
  type ExerciseStatus,
  typeLabels,
  uniqueExerciseValues,
} from "../exercise-bank-model";
import type { ExerciseBankController } from "../use-exercise-bank-controller";
import { FilterSelect } from "./filter-select";

export function ExerciseListToolbar({ controller }: { controller: ExerciseBankController }) {
  const hasActiveFilters =
    controller.searchTerm.trim() !== "" ||
    controller.subjectFilter !== allExerciseFilter ||
    controller.levelFilter !== allExerciseFilter ||
    controller.difficultyFilter !== allExerciseFilter ||
    controller.typeFilter !== allExerciseFilter ||
    controller.sourceFilter !== "all";

  const statusTabs: Array<{
    id: ExerciseStatus | typeof allExerciseFilter;
    label: string;
    count: number;
  }> = [
    { id: allExerciseFilter, label: "Tất cả", count: controller.totals.all },
    { id: "published", label: "Đã xuất bản", count: controller.totals.published },
    { id: "draft", label: "Bản nháp", count: controller.totals.draft },
    { id: "archived", label: "Lưu trữ", count: controller.totals.archived },
  ];

  return (
    <Box sx={{ flexShrink: 0, borderBottom: 1, borderColor: "divider", px: 2.5, py: 1.75, bgcolor: "background.paper", display: "grid", gap: 1.5 }}>
      {/* Hàng 1: Tabs trạng thái & Ô tìm kiếm */}
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, borderRadius: 1.5, bgcolor: "action.hover", p: 0.5, border: 1, borderColor: "divider" }}>
          {statusTabs.map((tab) => {
            const isActive = controller.statusFilter === tab.id;
            return (
              <ButtonBase
                key={tab.id}
                onClick={() => controller.setStatusFilter(tab.id as ExerciseStatus | typeof allExerciseFilter)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  borderRadius: 1,
                  px: 1.75,
                  py: 0.75,
                  typography: "caption",
                  fontWeight: isActive ? "fontWeightBold" : "fontWeightMedium",
                  color: isActive ? "primary.main" : "text.secondary",
                  bgcolor: isActive ? "background.paper" : "transparent",
                  border: 1,
                  borderColor: isActive ? "divider" : "transparent",
                  boxShadow: isActive ? 1 : 0,
                  transition: "background-color 0.15s ease, color 0.15s ease",
                  "&:hover": isActive ? undefined : { color: "text.primary", bgcolor: "background.paper" },
                }}
              >
                <span>{tab.label}</span>
                <Box
                  component="span"
                  sx={{
                    borderRadius: 999,
                    px: 1,
                    py: 0.25,
                    lineHeight: 1,
                    fontWeight: "fontWeightBold",
                    bgcolor: isActive ? "info.light" : "action.selected",
                    color: isActive ? "primary.main" : "text.secondary",
                  }}
                >
                  {tab.count}
                </Box>
              </ButtonBase>
            );
          })}
        </Box>

        <ErgSearchField
          value={controller.searchTerm}
          onChange={(event) => controller.setSearchTerm(event.target.value)}
          placeholder="Tìm kiếm bài tập..."
          sx={{ width: 256 }}
          slotProps={{
            input: {
              endAdornment: controller.searchTerm ? (
                <IconButton size="small" aria-label="Xóa từ khóa" onClick={() => controller.setSearchTerm("")} sx={{ mr: -0.5 }}>
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              ) : undefined,
            },
          }}
        />
      </Box>

      {/* Hàng 2: Bộ lọc phân loại */}
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.25, pt: 1, borderTop: 1, borderColor: "divider" }}>
        <FilterSelect
          value={controller.sourceFilter}
          onChange={(val) => controller.setSourceFilter(val as "all" | ExerciseSource)}
          label="Nguồn: Tất cả"
          values={["system", "teacher"]}
          labels={{ system: "Mẫu hệ thống", teacher: "Giáo viên tạo" }}
        />
        <FilterSelect
          value={controller.subjectFilter}
          onChange={controller.setSubjectFilter}
          label="Môn học: Tất cả"
          values={uniqueExerciseValues("subject")}
        />
        <FilterSelect
          value={controller.levelFilter}
          onChange={controller.setLevelFilter}
          label="Cấp độ: Tất cả"
          values={uniqueExerciseValues("level")}
        />
        <FilterSelect
          value={controller.typeFilter}
          onChange={controller.setTypeFilter}
          label="Phân loại: Tất cả"
          values={["quiz", "practice", "project", "exam"]}
          labels={typeLabels}
        />
        <FilterSelect
          value={controller.difficultyFilter}
          onChange={controller.setDifficultyFilter}
          label="Độ khó: Tất cả"
          values={["easy", "medium", "hard"]}
          labels={difficultyLabels}
        />
        {hasActiveFilters ? (
          <Button
            variant="text"
            color="error"
            size="small"
            onClick={controller.clearFilters}
            title="Đặt lại các bộ lọc"
            startIcon={<RestartAltIcon fontSize="inherit" />}
            sx={{ typography: "caption", fontWeight: "fontWeightBold", px: 1 }}
          >
            Đặt lại
          </Button>
        ) : null}
      </Box>
    </Box>
  );
}
