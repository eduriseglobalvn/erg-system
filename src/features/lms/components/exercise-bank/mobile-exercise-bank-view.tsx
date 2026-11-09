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
import { ergMobileDockAnchor } from "@/components/portal/erg-mobile-dock";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

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
      {/* Design N9: plain title, search and one scrolling chip row; no hero card. */}
      <Box component="section">
        <Typography variant="h1">Kho luyện tập</Typography>
        <Typography variant="caption" component="p" sx={{ mt: 0.25, color: "text.secondary" }}>{controller.filteredExercises.length} bài phù hợp bộ lọc</Typography>
        <ErgSearchField
          value={controller.searchTerm}
          onChange={(event) => controller.setSearchTerm(event.target.value)}
          placeholder="Tìm theo bài, môn, tag"
          sx={{ mt: 1.5, "& .MuiOutlinedInput-root": { bgcolor: "background.paper", height: 46 } }}
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
                  height: 36,
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
          {onOpenPortable ? (
            <Button variant="outlined" onClick={onOpenPortable} sx={{ flexShrink: 0, height: 36, borderRadius: 999, px: 2, borderColor: "divider", color: "text.secondary", fontWeight: "fontWeightBold" }}>
              Gói offline
            </Button>
          ) : null}
        </Box>
      </Box>

      <Box sx={{ mt: 1.5, display: "grid", gap: 1.5 }}>
        {controller.filteredExercises.map((exercise) => (
          <Paper component="article" key={exercise.id} variant="outlined" sx={{ ...cardSx, p: 2 }}>
            <ButtonBase onClick={() => controller.setSelectedExerciseId(exercise.id)} sx={{ display: "block", width: "100%", textAlign: "left" }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle1" component="h2" sx={lineClamp2Sx}>{exercise.title}</Typography>
                  <Typography variant="caption" component="p" sx={{ mt: 0.25, color: "text.secondary" }}>{exercise.subject} · {exercise.level}</Typography>
                </Box>
                <Chip label={statusLabels[exercise.status]} size="small" {...chipPropsForTone(statusTones[exercise.status])} sx={{ flexShrink: 0, textTransform: "none", letterSpacing: "normal" }} />
              </Box>
              <Typography variant="caption" component="p" sx={{ mt: 1, color: "text.secondary" }}>
                {[typeLabels[exercise.type], difficultyLabels[exercise.difficulty], `${exercise.durationMinutes} phút`, `${exercise.questionCount} câu`, formatDateVi(exercise.updatedAt) && `Cập nhật ${formatDateVi(exercise.updatedAt)}`].filter(Boolean).join(" · ")}
              </Typography>
            </ButtonBase>
            <Box sx={{ mt: 1.5, display: "flex", gap: 0.5, justifyContent: "flex-end" }}>
              <Button variant="text" size="small" startIcon={<VisibilityOutlinedIcon fontSize="small" />} onClick={() => controller.setSelectedExerciseId(exercise.id)} sx={{ color: "primary.main", minHeight: 36 }}>
                Xem trước
              </Button>
              <Button variant="outlined" size="small" startIcon={<SendOutlinedIcon fontSize="small" />} onClick={() => onAssign(exercise.title)} sx={{ minHeight: 36 }}>
                Giao
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
        <Box sx={{ position: "fixed", insetInline: 0, bottom: ergMobileDockAnchor(), zIndex: 50, px: 1.5 }}>
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

// Cards are border-only (CLAUDE.md); radius.card = 14.
const cardSx = { borderRadius: `${ergEnterpriseTokens.radius.card}px`, bgcolor: "background.paper", boxShadow: "none" } as const;
const lineClamp2Sx = { display: "-webkit-box", overflow: "hidden", WebkitBoxOrient: "vertical", WebkitLineClamp: 2 } as const;
