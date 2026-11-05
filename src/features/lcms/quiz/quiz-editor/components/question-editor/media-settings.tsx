import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import DeleteOutlineIcon from "@mui/icons-material/Delete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { useI18n } from "@/platform/i18n";
import type { QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

export function MuiMediaSettings({
  slide,
  onPickMedia,
  onRemoveMedia,
  onUpdateMediaAlt,
}: {
  slide: QuizEditorSlide;
  onPickMedia: () => void;
  onRemoveMedia: () => void;
  onUpdateMediaAlt: (value: string) => void;
}) {
  const { t } = useI18n();
  const media = slide.media;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {media?.src ? (
        <Box
          sx={{
            p: 2,
            borderRadius: "12px",
            bgcolor: "#FFFFFF",
            border: "1px solid #E2E8F0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#0F172A", fontSize: "13px" }}>
              {t("common.picture") || "Hình ảnh câu hỏi"}
            </Typography>
            <IconButton size="small" color="error" onClick={onRemoveMedia} title={t("common.remove")}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Box>

          <Box
            sx={{
              width: "100%",
              height: 180,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "#FAFAFC",
              borderRadius: "8px",
              border: "1px solid #E2E8F0",
              overflow: "hidden",
            }}
          >
            <img
              src={media.src}
              alt={media.alt || t("common.picture")}
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
          </Box>

          <Button
            size="small"
            variant="outlined"
            fullWidth
            startIcon={<AddPhotoAlternateIcon fontSize="small" />}
            onClick={onPickMedia}
            sx={{ borderRadius: "8px", fontWeight: 600 }}
          >
            Thay ảnh khác
          </Button>

          <TextField
            size="small"
            fullWidth
            label={t("quiz.imageAltText") || "Văn bản thay thế (Alt text)"}
            value={media.alt ?? ""}
            onChange={(event) => onUpdateMediaAlt(event.target.value)}
            placeholder={t("quiz.imageAltPlaceholder") || "Mô tả hình ảnh cho học sinh khiếm thị..."}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
                fontSize: "13px",
              },
            }}
          />
        </Box>
      ) : (
        <Box
          sx={{
            p: 3,
            borderRadius: "12px",
            bgcolor: "#FFFFFF",
            border: "1.5px dashed #CBD5E1",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            gap: 1,
            py: 4,
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              bgcolor: "#F0F7FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 0.5,
            }}
          >
            <CloudUploadOutlinedIcon sx={{ fontSize: 26, color: "#0071E3" }} />
          </Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#1E293B", fontSize: "14px" }}>
            Chưa có hình ảnh
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748B", maxWidth: 220, mb: 1 }}>
            Thêm hình ảnh minh họa để câu hỏi trực quan và sinh động hơn
          </Typography>
          <Button
            size="small"
            variant="contained"
            startIcon={<AddPhotoAlternateIcon fontSize="small" />}
            onClick={onPickMedia}
            sx={{
              borderRadius: "8px",
              fontWeight: 600,
              bgcolor: "#0071E3",
              "&:hover": { bgcolor: "#0D5CA0" },
            }}
          >
            {t("quiz.addImage") || "Tải ảnh lên"}
          </Button>
        </Box>
      )}
    </Box>
  );
}
