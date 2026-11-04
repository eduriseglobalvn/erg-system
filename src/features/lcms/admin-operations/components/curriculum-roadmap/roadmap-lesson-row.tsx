import AttachFileOutlined from "@mui/icons-material/AttachFileOutlined";
import DeleteOutline from "@mui/icons-material/DeleteOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import HelpOutlineOutlined from "@mui/icons-material/HelpOutlineOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import type { CurriculumRoadmapActions } from "@/features/lcms/admin-operations/components/curriculum-roadmap/roadmap-types";
import type {
  CurriculumContentItem,
  CurriculumFolder,
  CurriculumRoadmapLesson,
} from "@/features/lcms/admin-operations/utils/learning-resource-curriculum-view-model";

export function CurriculumLessonRow({
  lesson,
  index,
  selected,
  onOpenFolder,
  onOpenContent: _onOpenContent,
  actions,
}: {
  lesson: CurriculumRoadmapLesson;
  index: number;
  selected: boolean;
  onOpenFolder: (folder: CurriculumFolder) => void;
  onOpenContent?: (item: CurriculumContentItem) => void;
  actions: CurriculumRoadmapActions;
}) {
  const exerciseCount = lesson.content.filter((item) => item.kind === "exercise").length;
  const resourceCount = lesson.content.filter((item) => item.kind === "resource").length;

  const titleLower = lesson.folder.title.toLowerCase();
  const isReview = titleLower.includes("ôn tập");
  const isPractice = titleLower.includes("luyện thi");

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderTop: index ? "1px solid #F1F5F9" : 0,
        bgcolor: selected ? "#F0F7FF" : "#FFFFFF",
        px: 2,
        py: 0.75,
        transition: "background-color 120ms ease",
        "&:hover": {
          bgcolor: selected ? "#F0F7FF" : "#F8FAFC",
          "& .lesson-actions-group": {
            opacity: 1,
          },
        },
      }}
    >
      {/* Lesson Title & Order - Left Aligned */}
      <ButtonBase
        onClick={() => onOpenFolder(lesson.folder)}
        sx={{
          display: "flex",
          minWidth: 0,
          flex: 1,
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 1.25,
          textAlign: "left",
          py: 0.25,
          borderRadius: 1,
          "&:hover .lesson-title": { color: "#0F6CBD" },
        }}
      >
        {/* Monospaced Order Number */}
        <Box
          sx={{
            width: 26,
            height: 26,
            borderRadius: "6px",
            bgcolor: isReview ? "#EFF6FF" : isPractice ? "#FAF5FF" : "#F1F5F9",
            color: isReview ? "#1D4ED8" : isPractice ? "#7E22CE" : "#475569",
            display: "grid",
            placeItems: "center",
            fontSize: 11.5,
            fontWeight: 600,
            fontFamily: "'JetBrains Mono', monospace",
            flexShrink: 0,
            border: "1px solid",
            borderColor: isReview ? "#BFDBFE" : isPractice ? "#E9D5FF" : "#E2E8F0",
          }}
        >
          {index + 1}
        </Box>

        {/* Type Badge */}
        {isReview ? (
          <Chip
            size="small"
            label="Ôn tập"
            sx={{
              height: 20,
              fontSize: 10.5,
              fontWeight: 600,
              bgcolor: "#DBEAFE",
              color: "#1E40AF",
              flexShrink: 0,
            }}
          />
        ) : isPractice ? (
          <Chip
            size="small"
            label="Luyện thi"
            sx={{
              height: 20,
              fontSize: 10.5,
              fontWeight: 600,
              bgcolor: "#F3E8FF",
              color: "#6B21A8",
              flexShrink: 0,
            }}
          />
        ) : null}

        {/* Lesson Title */}
        <Typography
          className="lesson-title"
          noWrap
          sx={{
            color: "#0F172A",
            fontSize: 13,
            fontWeight: isReview || isPractice ? 650 : 500,
            transition: "color 120ms ease",
          }}
        >
          {lesson.folder.title}
        </Typography>
      </ButtonBase>

      {/* Lesson Actions: Badges, + Bài tập, + Tài liệu, Sửa, Xóa */}
      <Stack direction="row" spacing={1} sx={{ flexShrink: 0, alignItems: "center", ml: 2 }}>
        {/* Content Badges - Clickable to open */}
        {resourceCount > 0 ? (
          <Tooltip title={`Bài học có ${resourceCount} tài liệu. Bấm để xem chi tiết.`}>
            <Chip
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onOpenFolder(lesson.folder);
              }}
              icon={<AttachFileOutlined sx={{ fontSize: "13px !important", color: "#2563EB" }} />}
              label={`${resourceCount} tài liệu`}
              sx={{
                height: 24,
                fontSize: 11,
                fontWeight: 600,
                bgcolor: "#EFF6FF",
                color: "#1D4ED8",
                border: "1px solid #BFDBFE",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 120ms ease",
                "&:hover": {
                  bgcolor: "#DBEAFE",
                  borderColor: "#93C5FD",
                },
              }}
            />
          </Tooltip>
        ) : null}

        {exerciseCount > 0 ? (
          <Tooltip title={`Bài học có ${exerciseCount} bài tập. Bấm để xem chi tiết.`}>
            <Chip
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onOpenFolder(lesson.folder);
              }}
              icon={<HelpOutlineOutlined sx={{ fontSize: "13px !important", color: "#DC2626" }} />}
              label={`${exerciseCount} bài tập`}
              sx={{
                height: 24,
                fontSize: 11,
                fontWeight: 600,
                bgcolor: "#FEF2F2",
                color: "#B91C1C",
                border: "1px solid #FECACA",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 120ms ease",
                "&:hover": {
                  bgcolor: "#FEE2E2",
                  borderColor: "#FCA5A5",
                },
              }}
            />
          </Tooltip>
        ) : null}

        {/* Quick Actions Cluster */}
        <Stack
          className="lesson-actions-group"
          direction="row"
          spacing={0.75}
          sx={{
            alignItems: "center",
            opacity: { xs: 1, sm: 0.65 },
            transition: "opacity 140ms ease",
          }}
        >
          {/* Quick Add Exercise to Lesson */}
          {actions.onAddExercise ? (
            <Tooltip title="Gắn bài tập từ Quiz bank cho bài học này">
              <Button
                size="small"
                variant="outlined"
                startIcon={<HelpOutlineOutlined sx={{ fontSize: 13, color: "#E11D48" }} />}
                onClick={(e) => {
                  e.stopPropagation();
                  actions.onAddExercise?.(lesson.folder);
                }}
                sx={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "none",
                  color: "#475569",
                  bgcolor: "#FFFFFF",
                  border: "1px dashed #CBD5E1",
                  py: 0.2,
                  px: 1,
                  height: 24,
                  borderRadius: "6px",
                  whiteSpace: "nowrap",
                  transition: "all 120ms ease",
                  "&:hover": {
                    color: "#BE123C",
                    bgcolor: "#FFF1F2",
                    borderColor: "#FDA4AF",
                  },
                }}
              >
                + Bài tập
              </Button>
            </Tooltip>
          ) : null}

          {/* Quick Add Resource to Lesson */}
          {actions.onAddResource ? (
            <Tooltip title="Gắn tài liệu cho bài học này">
              <Button
                size="small"
                variant="outlined"
                startIcon={<AttachFileOutlined sx={{ fontSize: 13, color: "#2563EB" }} />}
                onClick={(e) => {
                  e.stopPropagation();
                  actions.onAddResource?.(lesson.folder);
                }}
                sx={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "none",
                  color: "#475569",
                  bgcolor: "#FFFFFF",
                  border: "1px dashed #CBD5E1",
                  py: 0.2,
                  px: 1,
                  height: 24,
                  borderRadius: "6px",
                  whiteSpace: "nowrap",
                  transition: "all 120ms ease",
                  "&:hover": {
                    color: "#1D4ED8",
                    bgcolor: "#EFF6FF",
                    borderColor: "#93C5FD",
                  },
                }}
              >
                + Tài liệu
              </Button>
            </Tooltip>
          ) : null}

          {/* Clean 1px Vertical Separator */}
          <Box sx={{ width: "1px", height: 16, bgcolor: "#E2E8F0", mx: 0.25, flexShrink: 0 }} />

          {/* Edit Lesson */}
          <Tooltip title="Chỉnh sửa bài học">
            <IconButton
              size="small"
              aria-label={`Chỉnh sửa ${lesson.folder.title}`}
              onClick={(e) => {
                e.stopPropagation();
                actions.onEditFolder(lesson.folder);
              }}
              sx={{
                width: 24,
                height: 24,
                borderRadius: "6px",
                color: "#64748B",
                p: 0,
                "&:hover": { color: "#0F6CBD", bgcolor: "#EFF6FF" },
              }}
            >
              <EditOutlined sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>

          {/* Delete Lesson */}
          <Tooltip title="Xóa bài học">
            <IconButton
              size="small"
              aria-label={`Xóa ${lesson.folder.title}`}
              onClick={(e) => {
                e.stopPropagation();
                actions.onDeleteFolder(lesson.folder);
              }}
              sx={{
                width: 24,
                height: 24,
                borderRadius: "6px",
                color: "#94A3B8",
                p: 0,
                "&:hover": { color: "#DC2626", bgcolor: "#FEF2F2" },
              }}
            >
              <DeleteOutline sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
    </Box>
  );
}
