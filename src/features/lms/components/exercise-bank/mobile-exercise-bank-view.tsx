import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

import { ErgEmptyState } from "@/components/erg-mui/erg-feedback";
import { ErgSearchField } from "@/components/erg-mui/erg-form";
import { formatDateVi } from "@/domain/formatters/format-date";
import {
  allExerciseFilter,
  chipPropsForTone,
  difficultyLabels,
  statusLabels,
  statusTones,
  type ExerciseStatus,
  typeLabels,
} from "./exercise-bank-model";
import type { ExerciseBankController } from "./use-exercise-bank-controller";
import { ergMobileDockClearance } from "@/components/portal/erg-mobile-dock";

export function MobileExerciseBankView({
  controller,
  onAssign,
  onOpenPortable,
}: {
  controller: ExerciseBankController;
  onAssign: (exerciseTitle: string) => void;
  onOpenPortable?: () => void;
}) {
  const statusTabs: Array<{ id: ExerciseStatus | typeof allExerciseFilter; label: string }> = [
    { id: "published", label: "Xuất bản" },
    { id: allExerciseFilter, label: "Tất cả" },
    { id: "draft", label: "Nháp" },
    { id: "archived", label: "Lưu trữ" },
  ];

  return (
    <Box sx={{ minHeight: "100%", bgcolor: "background.default", px: 1.5, pb: 2, pt: 1.5, color: "text.primary" }}>
      <Paper component="section" variant="outlined" sx={{ ...cardSx, p: 2 }}>
        <Typography variant="body2" sx={{ color: "primary.main", fontWeight: "fontWeightBold" }}>Kho bài tập</Typography>
        <Typography variant="h3" component="h1" sx={{ mt: 0.5 }}>Chọn bài và giao nhanh</Typography>
        <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary", fontWeight: "fontWeightMedium" }}>{controller.filteredExercises.length} kết quả phù hợp bộ lọc hiện tại</Typography>
        <ErgSearchField
          value={controller.searchTerm}
          onChange={(event) => controller.setSearchTerm(event.target.value)}
          placeholder="Tìm bài, môn, tag"
          sx={{ mt: 2, "& .MuiOutlinedInput-root": { height: 48 } }}
        />
        <Box sx={{ mt: 1.5, display: "flex", gap: 1, overflowX: "auto", pb: 0.5, scrollbarWidth: "none" }}>
          {statusTabs.map((tab) => {
            const active = controller.statusFilter === tab.id;
            return (
              <Button
                key={tab.id}
                variant="outlined"
                onClick={() => controller.setStatusFilter(tab.id)}
                sx={{
                  height: 40,
                  flexShrink: 0,
                  borderRadius: 999,
                  px: 2,
                  borderColor: active ? "primary.main" : "divider",
                  bgcolor: active ? "info.light" : "background.paper",
                  color: active ? "primary.main" : "text.secondary",
                  fontWeight: "fontWeightBold",
                }}
              >
                {tab.label}
              </Button>
            );
          })}
        </Box>
        {onOpenPortable ? (
          <Button variant="outlined" onClick={onOpenPortable} sx={{ mt: 1.5, height: 40, borderRadius: 999, px: 2, borderColor: "divider", color: "text.primary", fontWeight: "fontWeightBold" }}>
            Gói offline
          </Button>
        ) : null}
      </Paper>

      <Box sx={{ mt: 1.5, display: "grid", gap: 1.5 }}>
        {controller.filteredExercises.map((exercise) => (
          <Paper component="article" key={exercise.id} variant="outlined" sx={{ ...cardSx, p: 2 }}>
            <ButtonBase onClick={() => controller.setSelectedExerciseId(exercise.id)} sx={{ display: "block", width: "100%", textAlign: "left" }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h5" component="h2" sx={lineClamp2Sx}>{exercise.title}</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary", fontWeight: "fontWeightBold" }}>{exercise.subject} · {exercise.level}</Typography>
                </Box>
                <Chip label={statusLabels[exercise.status]} size="small" {...chipPropsForTone(statusTones[exercise.status])} sx={{ flexShrink: 0, textTransform: "none", letterSpacing: "normal" }} />
              </Box>
              <Typography variant="caption" component="p" sx={{ mt: 1.5, color: "text.secondary", fontWeight: "fontWeightBold" }}>
                {[typeLabels[exercise.type], difficultyLabels[exercise.difficulty], `${exercise.durationMinutes} phút`, `${exercise.questionCount} câu`, formatDateVi(exercise.updatedAt) && `Cập nhật ${formatDateVi(exercise.updatedAt)}`].filter(Boolean).join(" · ")}
              </Typography>
            </ButtonBase>
            <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
              <Button variant="outlined" startIcon={<VisibilityOutlinedIcon fontSize="small" />} onClick={() => controller.setSelectedExerciseId(exercise.id)} sx={{ ...cardActionSx, borderColor: "divider", color: "text.primary" }}>
                Xem
              </Button>
              <Button variant="outlined" color="primary" startIcon={<SendOutlinedIcon fontSize="small" />} onClick={() => onAssign(exercise.title)} sx={cardActionSx}>
                Giao nhanh
              </Button>
            </Box>
          </Paper>
        ))}

        {controller.filteredExercises.length === 0 ? (
          <ErgEmptyState
            title="Không có bài phù hợp"
            description="Thử đổi từ khoá hoặc xoá bộ lọc để xem lại kho bài."
            action={<Button variant="outlined" onClick={controller.clearFilters} sx={{ height: 44, px: 2.5 }}>Xoá lọc</Button>}
          />
        ) : null}
      </Box>

      {controller.selectedExerciseId && controller.selectedExercise ? (
        <Box sx={{ position: "fixed", insetInline: 0, bottom: ergMobileDockClearance(), zIndex: 50, px: 1.5 }}>
          <Paper variant="outlined" sx={{ ...cardSx, p: 2, boxShadow: 8 }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" sx={lineClamp2Sx}>{controller.selectedExercise.title}</Typography>
                <Typography variant="caption" component="div" sx={{ mt: 0.5, color: "text.secondary", fontWeight: "fontWeightBold" }}>
                  {controller.selectedExercise.subject} · {controller.selectedExercise.durationMinutes} phút · {controller.selectedExercise.questionCount} câu
                </Typography>
              </Box>
              <Button variant="text" size="small" onClick={() => controller.setSelectedExerciseId("")} sx={{ height: 36, borderRadius: 999, px: 1.5, bgcolor: "action.hover", color: "text.secondary" }}>
                Đóng
              </Button>
            </Box>
            <Button variant="contained" fullWidth startIcon={<SendOutlinedIcon fontSize="small" />} onClick={() => onAssign(controller.selectedExercise.title)} sx={{ mt: 1.5, height: 44, borderRadius: 2 }}>
              Giao bài tập này
            </Button>
          </Paper>
        </Box>
      ) : null}
    </Box>
  );
}

const cardSx = { borderRadius: 3, bgcolor: "background.paper", boxShadow: 2 } as const;
const cardActionSx = { height: 44, minWidth: 0, flex: 1, borderRadius: 2, px: 1, fontWeight: "fontWeightBold" } as const;
const lineClamp2Sx = { display: "-webkit-box", overflow: "hidden", WebkitBoxOrient: "vertical", WebkitLineClamp: 2 } as const;
