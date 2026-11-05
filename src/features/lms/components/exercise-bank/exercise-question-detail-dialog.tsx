import { useState, useMemo, type ComponentProps } from "react";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import HelpOutlineIcon from "@mui/icons-material/HelpOutlined";
import SendIcon from "@mui/icons-material/Send";

import { ErgButton, ErgIconButton } from "@/components/erg-mui/erg-actions";
import { ErgEmptyState, ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { ErgSearchField } from "@/components/erg-mui/erg-form";
import type { QuestionBankQuestion } from "@/features/question-bank/types/question-bank-types";
import {
  difficultyLabels,
  typeLabels,
  type Exercise,
} from "./exercise-bank-model";

type ChipTone = ComponentProps<typeof ErgStatusChip>["tone"];

const questionTypeConfig: Record<string, { label: string; tone: ChipTone }> = {
  "multiple-choice": { label: "Trắc nghiệm 1 đáp án", tone: "info" },
  "multiple-response": { label: "Trắc nghiệm nhiều đáp án", tone: "info" },
  "true-false": { label: "Đúng / Sai", tone: "info" },
  "fill-in-the-blanks": { label: "Điền vào chỗ trống", tone: "warning" },
  "drag-the-words": { label: "Kéo thả từ", tone: "warning" },
  "matching": { label: "Nối cột / Ghép thẻ", tone: "success" },
  "sequence": { label: "Sắp xếp thứ tự", tone: "success" },
  "short-answer": { label: "Trả lời ngắn", tone: "neutral" },
  "numeric": { label: "Điền đáp số", tone: "success" },
  "essay": { label: "Tự luận", tone: "warning" },
  "code": { label: "Lập trình / Code", tone: "neutral" },
  "hotspot": { label: "Tương tác hình ảnh", tone: "info" },
  "drag-and-drop": { label: "Kéo thả đối tượng", tone: "info" },
};

function getQuestionTypeConfig(type?: string) {
  if (!type) return { label: "Trắc nghiệm", tone: "info" as ChipTone };
  return questionTypeConfig[type] ?? { label: type, tone: "neutral" as ChipTone };
}

function getStructureHint(q: QuestionBankQuestion): { label: string; tone: ChipTone } {
  if (q.type === "matching") return { label: "Ghép nối các cặp thông tin tương ứng", tone: "success" };
  if (q.type === "fill-in-the-blanks" || q.type === "drag-the-words") return { label: "Điền từ hoặc cụm từ vào vị trí còn khuyết", tone: "warning" };
  if (q.type === "sequence") return { label: "Sắp xếp các bước theo đúng thứ tự logic", tone: "success" };
  if (q.type === "essay") return { label: "Học sinh trình bày câu trả lời dạng tự luận", tone: "warning" };
  if (q.type === "short-answer" || q.type === "numeric") return { label: "Nhập câu trả lời ngắn / đáp số", tone: "neutral" };
  return { label: q.choices && q.choices.length > 0 ? `${q.choices.length} phương án lựa chọn` : "Trắc nghiệm tiêu chuẩn", tone: "info" };
}

interface ExerciseQuestionDetailDialogProps {
  open: boolean;
  onClose: () => void;
  exercise: Exercise | null;
  questions: QuestionBankQuestion[];
  onAssign: (exerciseTitle: string) => void;
  onEdit?: (exercise: Exercise) => void;
}

export function ExerciseQuestionDetailDialog({
  open,
  onClose,
  exercise,
  questions,
  onAssign,
  onEdit,
}: ExerciseQuestionDetailDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredQuestions = useMemo(() => {
    if (!searchTerm.trim()) return questions;
    const term = searchTerm.toLowerCase();
    return questions.filter((q) => {
      const typeLabel = getQuestionTypeConfig(q.type).label.toLowerCase();
      return (
        q.stem.toLowerCase().includes(term) ||
        q.categoryLabel.toLowerCase().includes(term) ||
        (q.objective && q.objective.toLowerCase().includes(term)) ||
        typeLabel.includes(term) ||
        q.tags?.some((t) => t.toLowerCase().includes(term))
      );
    });
  }, [questions, searchTerm]);

  if (!exercise) return null;

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason === "backdropClick") return;
        onClose();
      }}
      maxWidth="md"
      fullWidth
      sx={{
        zIndex: 1400,
      }}
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: "blur(2px)",
          },
        },
        paper: {
          sx: {
            borderRadius: { xs: 1.5, sm: 2 },
            boxShadow: 24,
            height: { xs: "92vh", sm: "88vh" },
            maxHeight: 820,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            bgcolor: "background.paper",
          },
        },
      }}
    >
      {/* HEADER */}
      <DialogTitle
        sx={{
          m: 0,
          px: { xs: 2, sm: 3 },
          py: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
          gap: 1.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
          <Box sx={{ display: "grid", placeItems: "center", width: 34, height: 34, flexShrink: 0, borderRadius: 1, border: 1, borderColor: "divider", bgcolor: "background.default", color: "primary.main" }}>
            <AutoAwesomeIcon fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Typography variant="subtitle1" component="h2" noWrap sx={{ fontWeight: "fontWeightBold" }}>
                {exercise.title}
              </Typography>
              <ErgStatusChip dot={false} label={`${exercise.subject} • ${exercise.level}`} tone="info" />
            </Box>
            <Typography variant="caption" component="p" sx={{ color: "text.secondary", mt: 0.25 }}>
              {typeLabels[exercise.type]} • {difficultyLabels[exercise.difficulty]} • {exercise.durationMinutes} phút • {questions.length} câu hỏi
            </Typography>
          </Box>
        </Box>

        <ErgIconButton label="Đóng" size="small" onClick={onClose} sx={{ flexShrink: 0 }}>
          <CloseIcon fontSize="small" />
        </ErgIconButton>
      </DialogTitle>

      {/* TOOLBAR TÌM KIẾM CÂU HỎI */}
      <Box sx={{ flexShrink: 0, borderBottom: 1, borderColor: "divider", bgcolor: "background.default", px: { xs: 1.5, sm: 3 }, py: 1.25, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
        <ErgSearchField
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm kiếm câu hỏi theo nội dung, chủ đề, dạng câu..."
          slotProps={{
            input: {
              endAdornment: searchTerm ? (
                <ErgIconButton label="Xóa tìm kiếm" size="small" onClick={() => setSearchTerm("")}>
                  <CloseIcon fontSize="inherit" />
                </ErgIconButton>
              ) : undefined,
            },
          }}
          sx={{ flex: 1, maxWidth: 448 }}
        />

        <Typography variant="caption" sx={{ flexShrink: 0, color: "text.secondary", fontWeight: "fontWeightMedium" }}>
          Hiển thị <Box component="strong" sx={{ color: "text.primary" }}>{filteredQuestions.length}</Box> / {questions.length} câu hỏi
        </Typography>
      </Box>

      {/* DANH SÁCH CÂU HỎI (CHỈ HIỂN THỊ CÂU HỎI & ĐỊNH DẠNG, KHÔNG HIỆN ĐÁP ÁN) */}
      <DialogContent
        sx={{
          p: { xs: 2, sm: 3 },
          flex: 1,
          overflowY: "auto",
          bgcolor: "background.default",
        }}
      >
        {filteredQuestions.length > 0 ? (
          <Stack spacing={1.5}>
            {filteredQuestions.map((q, index) => {
              const typeConf = getQuestionTypeConfig(q.type);
              const hint = getStructureHint(q);
              return (
                <Box
                  key={q.id || index}
                  sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, bgcolor: "background.paper", p: { xs: 1.75, sm: 2 }, display: "flex", flexDirection: "column", gap: 1.25 }}
                >
                  {/* Meta câu hỏi: Số thứ tự, Dạng câu hỏi, Chủ đề, Độ khó */}
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                      <Typography variant="caption" sx={{ display: "grid", placeItems: "center", minWidth: 24, height: 24, borderRadius: 0.75, bgcolor: "background.default", color: "primary.main", fontWeight: "fontWeightBold" }}>
                        #{index + 1}
                      </Typography>

                      <ErgStatusChip dot={false} label={typeConf.label} tone={typeConf.tone} />

                      {q.categoryLabel && <ErgStatusChip dot={false} label={q.categoryLabel} />}

                      <ErgStatusChip
                        dot={false}
                        label={q.difficulty === "core" ? "Cơ bản" : q.difficulty === "stretch" ? "Nâng cao" : "Thử thách"}
                        tone={q.difficulty === "core" ? "success" : q.difficulty === "stretch" ? "warning" : "error"}
                      />
                    </Box>

                    {q.levelLabel && (
                      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: "fontWeightMedium" }}>
                        {q.levelLabel}
                      </Typography>
                    )}
                  </Box>

                  {/* Nội dung câu hỏi (Stem) */}
                  <Typography variant="subtitle2" component="p" sx={{ pt: 0.25 }}>
                    {q.stem}
                  </Typography>

                  {/* Quy cách và cấu trúc câu hỏi (KHÔNG hiển thị đáp án đúng / sai) */}
                  <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, pt: 0.5, borderTop: 1, borderColor: "divider" }}>
                    <ErgStatusChip dot={false} label={hint.label} tone={hint.tone} />

                    {q.objective && (
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        • Mục tiêu: <Box component="span" sx={{ color: "text.primary", fontWeight: "fontWeightMedium" }}>{q.objective}</Box>
                      </Typography>
                    )}
                  </Box>

                  {/* Tags nếu có */}
                  {q.tags && q.tags.length > 0 && (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, pt: 0.25 }}>
                      {q.tags.map((tag) => (
                        <ErgStatusChip key={tag} dot={false} label={`#${tag}`} />
                      ))}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Stack>
        ) : (
          <ErgEmptyState icon={<HelpOutlineIcon />} title="Không tìm thấy câu hỏi phù hợp với từ khóa." />
        )}
      </DialogContent>

      {/* FOOTER */}
      <DialogActions
        sx={{
          px: { xs: 2, sm: 3 },
          py: 1.5,
          borderTop: 1,
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: "fontWeightMedium" }}>
          Tổng cộng: <Box component="strong" sx={{ color: "text.primary" }}>{questions.length} câu hỏi</Box> • Ước lượng ~{Math.max(15, Math.round(questions.length * 2))} phút
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {onEdit && (
            <ErgButton
              type="button"
              variant="outlined"
              onClick={() => {
                onClose();
                onEdit(exercise);
              }}
              startIcon={<EditIcon fontSize="small" />}
            >
              Chỉnh sửa bài này
            </ErgButton>
          )}

          <ErgButton type="button" variant="text" onClick={onClose}>
            Đóng
          </ErgButton>

          <ErgButton
            type="button"
            variant="contained"
            onClick={() => {
              onAssign(exercise.title);
              onClose();
            }}
            startIcon={<SendIcon fontSize="small" />}
          >
            Giao bài tập này
          </ErgButton>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
