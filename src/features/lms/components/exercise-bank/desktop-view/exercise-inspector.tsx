import type { ReactNode } from "react";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import HelpOutlineIcon from "@mui/icons-material/HelpOutlineOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import type { QuestionBankQuestion } from "@/features/question-bank/types/question-bank-types";
import { formatDateVi } from "@/domain/formatters/format-date";
import { typeLabels } from "../exercise-bank-model";
import type { ExerciseBankController } from "../use-exercise-bank-controller";
import { DifficultyBadge, StatusIndicator } from "./exercise-badges";

const insetSx = { border: 1, borderColor: "divider", borderRadius: 1, bgcolor: "background.default" } as const;
const tagSx = { borderRadius: 0.5, typography: "caption", color: "text.primary" } as const;

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>{label}</Typography>
      {typeof children === "string" ? (
        <Typography variant="caption" sx={{ fontWeight: "fontWeightMedium", color: "text.primary" }}>{children}</Typography>
      ) : (
        children
      )}
    </Box>
  );
}

export function ExerciseInspector({
  controller,
  onAssign,
  setDetailModalOpen,
  selectedExerciseQuestions,
}: {
  controller: ExerciseBankController;
  onAssign: (exerciseTitle: string) => void;
  setDetailModalOpen: (open: boolean) => void;
  selectedExerciseQuestions: QuestionBankQuestion[];
}) {
  const exercise = controller.selectedExercise;
  return (
    <Paper component="aside" variant="outlined" sx={{ display: "flex", minHeight: 0, flexDirection: "column", overflow: "hidden", borderRadius: 1.5 }}>
      <Box sx={{ flexShrink: 0, borderBottom: 1, borderColor: "divider", px: 1.75, py: 1.25, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="caption" component="h2" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Chi tiết bài tập
        </Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => controller.openEditDialog(exercise)}
            title="Chỉnh sửa thông tin và câu hỏi bài tập"
            startIcon={<EditOutlinedIcon fontSize="inherit" />}
            sx={{ minHeight: 0, py: 0.25, px: 1, typography: "caption", fontWeight: "fontWeightBold" }}
          >
            Sửa
          </Button>
          <StatusIndicator status={exercise.status} />
        </Stack>
      </Box>

      <Stack spacing={1.75} sx={{ minHeight: 0, flex: 1, overflowY: "auto", p: 1.75 }}>
        <Box>
          <Typography variant="subtitle2" component="h3">
            {exercise.title}
          </Typography>
          {formatDateVi(exercise.updatedAt) ? (
            <Typography variant="caption" component="p" sx={{ mt: 0.25, color: "text.secondary" }}>
              Cập nhật ngày {formatDateVi(exercise.updatedAt)}
            </Typography>
          ) : null}
        </Box>

        <Stack spacing={1} sx={{ ...insetSx, p: 1.5 }}>
          <InfoRow label="Nguồn gốc">{exercise.source === "teacher" ? "Giáo viên tự tạo" : "Mẫu hệ thống ERG"}</InfoRow>
          {exercise.authorName ? <InfoRow label="Tác giả">{exercise.authorName}</InfoRow> : null}
          <InfoRow label="Môn học">{`${exercise.subject} (${exercise.level})`}</InfoRow>
          <InfoRow label="Phân loại">{typeLabels[exercise.type]}</InfoRow>
          <InfoRow label="Độ khó">
            <DifficultyBadge difficulty={exercise.difficulty} />
          </InfoRow>
          <InfoRow label="Thời lượng">{`${exercise.durationMinutes} phút • ${exercise.questionCount} câu`}</InfoRow>
          <InfoRow label="Lượt đã giao">{`${exercise.assignedCount} lần`}</InfoRow>
        </Stack>

        <Box>
          <Typography variant="caption" component="span" sx={{ mb: 0.5, display: "block", fontWeight: "fontWeightMedium" }}>Lớp / nhóm phù hợp</Typography>
          <Stack spacing={0.5}>
            {exercise.classTargets.map((target) => (
              <Box key={target} sx={{ ...tagSx, border: 1, borderColor: "divider", bgcolor: "action.hover", px: 1.25, py: 0.5 }}>
                {target}
              </Box>
            ))}
          </Stack>
        </Box>

        {exercise.tags.length > 0 ? (
          <Box>
            <Typography variant="caption" component="span" sx={{ mb: 0.5, display: "block", fontWeight: "fontWeightMedium" }}>Từ khóa</Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {exercise.tags.map((tag) => (
                <Box component="span" key={tag} sx={{ ...tagSx, bgcolor: "action.selected", px: 1, py: 0.25 }}>
                  #{tag}
                </Box>
              ))}
            </Box>
          </Box>
        ) : null}

        <Stack spacing={1} sx={{ borderTop: 1, borderColor: "divider", pt: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
              <HelpOutlineIcon fontSize="inherit" sx={{ color: "primary.main" }} />
              <Typography variant="caption" sx={{ fontWeight: "fontWeightBold" }}>
                Danh sách câu hỏi ({selectedExerciseQuestions.length} câu)
              </Typography>
            </Stack>
            <Button variant="text" size="small" onClick={() => setDetailModalOpen(true)} sx={{ minHeight: 0, py: 0, px: 0.5, typography: "caption", fontWeight: "fontWeightBold" }}>
              Xem tất cả →
            </Button>
          </Box>

          {selectedExerciseQuestions.length === 0 ? (
            <Typography variant="caption" component="div" sx={{ ...insetSx, p: 1.5, textAlign: "center", color: "text.secondary" }}>
              Chưa có câu hỏi nào trong bài tập này.
            </Typography>
          ) : (
            <Stack spacing={0.75} sx={{ ...insetSx, maxHeight: 250, overflowY: "auto", p: 1 }}>
              {selectedExerciseQuestions.map((q, idx) => (
                <ButtonBase
                  key={q.id || idx}
                  onClick={() => setDetailModalOpen(true)}
                  sx={{
                    display: "block",
                    flexShrink: 0,
                    textAlign: "left",
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 0.75,
                    bgcolor: "background.paper",
                    p: 1,
                    transition: "border-color 0.15s ease",
                    "&:hover": { borderColor: "primary.main", "& .MuiTypography-root": { color: "primary.main" } },
                  }}
                >
                  <Box sx={{ mb: 0.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: "fontWeightBold", color: "text.secondary" }}>
                      #{idx + 1}
                    </Typography>
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", minWidth: 0 }}>
                      {q.categoryLabel ? (
                        <ErgStatusChip dot={false} label={q.categoryLabel} sx={{ maxWidth: 90, borderRadius: 0.5 }} />
                      ) : null}
                      <ErgStatusChip
                        dot={false}
                        tone={q.difficulty === "challenge" ? "error" : q.difficulty === "stretch" ? "warning" : "success"}
                        label={q.difficulty === "challenge" ? "Thử thách" : q.difficulty === "stretch" ? "Nâng cao" : "Cơ bản"}
                        sx={{ borderRadius: 0.5 }}
                      />
                    </Stack>
                  </Box>
                  <Typography
                    variant="caption"
                    component="p"
                    sx={{ fontWeight: "fontWeightMedium", display: "-webkit-box", overflow: "hidden", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, transition: "color 0.15s ease" }}
                  >
                    {q.stem}
                  </Typography>
                </ButtonBase>
              ))}
            </Stack>
          )}
        </Stack>
      </Stack>

      <Stack spacing={1} sx={{ flexShrink: 0, borderTop: 1, borderColor: "divider", p: 1.5 }}>
        <Button variant="contained" fullWidth startIcon={<SendOutlinedIcon fontSize="small" />} sx={{ height: 36 }} onClick={() => onAssign(exercise.title)}>
          Giao bài tập này
        </Button>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1 }}>
          <Button variant="outlined" startIcon={<EditOutlinedIcon fontSize="small" />} onClick={() => controller.openEditDialog(exercise)} sx={{ height: 34 }}>
            Chỉnh sửa
          </Button>
          <Button variant="outlined" startIcon={<VisibilityOutlinedIcon fontSize="small" />} onClick={() => setDetailModalOpen(true)} sx={{ height: 34 }}>
            Xem câu hỏi
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}
