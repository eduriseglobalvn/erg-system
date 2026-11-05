import Add from "@mui/icons-material/Add";
import DeleteOutline from "@mui/icons-material/DeleteOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import { targetsEqual } from "@/features/lcms/admin-operations/components/learning-resource-curriculum-explorer";
import { CurriculumLessonRow } from "@/features/lcms/admin-operations/components/curriculum-roadmap/roadmap-lesson-row";
import type { CurriculumRoadmapActions } from "@/features/lcms/admin-operations/components/curriculum-roadmap/roadmap-types";
import type {
  CurriculumContentItem,
  CurriculumFolder,
  CurriculumRoadmapTopic,
  CurriculumTarget,
} from "@/features/lcms/admin-operations/utils/learning-resource-curriculum-view-model";

export function RoadmapTopicCard({
  topic,
  topicIndex,
  levelFolder,
  selectedTarget,
  onOpenFolder,
  onOpenContent,
  actions,
}: {
  topic: CurriculumRoadmapTopic;
  topicIndex: number;
  levelFolder: CurriculumFolder;
  selectedTarget: CurriculumTarget | null;
  onOpenFolder: (folder: CurriculumFolder) => void;
  onOpenContent?: (item: CurriculumContentItem) => void;
  actions: CurriculumRoadmapActions;
}) {
  const isTopicSelected = topic.folder && targetsEqual(selectedTarget, topic.folder.target);
  const targetFolder = topic.folder ?? levelFolder;

  return (
    <Box
      sx={{
        overflow: "hidden",
        border: isTopicSelected ? "2px solid #0071E3" : "1px solid #E2E8F0",
        borderRadius: 2,
        bgcolor: "#FFFFFF",
        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
      }}
    >
      {/* Topic Header Bar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1.5,
          borderBottom: "1px solid #E2E8F0",
          bgcolor: isTopicSelected ? "#F0F7FF" : "#FAFAFC",
          px: 2,
          py: 1,
        }}
      >
        <Box sx={{ display: "flex", minWidth: 0, alignItems: "center", gap: 1 }}>
          <Chip
            size="small"
            label={`Chủ đề ${topicIndex + 1}`}
            sx={{
              height: 22,
              fontSize: 11,
              fontWeight: 600,
              bgcolor: isTopicSelected ? "#0071E3" : "#EFF6FF",
              color: isTopicSelected ? "#FFFFFF" : "#0058B0",
              borderRadius: 1,
            }}
          />
          <Typography noWrap sx={{ color: "#0F172A", fontSize: 13.5, fontWeight: 600 }}>
            {topic.title}
          </Typography>
          <Typography sx={{ color: "#64748B", fontSize: 11.5, fontWeight: 500, ml: 0.5 }}>
            • {topic.lessons.length} bài học
          </Typography>
        </Box>

        {/* Topic Quick Actions */}
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
          <Tooltip title="Thêm bài học mới vào chủ đề này">
            <Button
              size="small"
              variant="contained"
              startIcon={<Add sx={{ fontSize: 14 }} />}
              onClick={() => actions.onCreateLesson(targetFolder)}
              sx={{
                fontSize: 11.5,
                fontWeight: 600,
                py: 0.35,
                px: 1.25,
                textTransform: "none",
                bgcolor: "#0071E3",
                color: "#FFFFFF",
                borderRadius: 1.25,
                boxShadow: "none",
                "&:hover": { bgcolor: "#0058B0" },
              }}
            >
              Bài học
            </Button>
          </Tooltip>

          {topic.folder ? (
            <>
              <Tooltip title="Chỉnh sửa chủ đề">
                <IconButton
                  size="small"
                  aria-label={`Chỉnh sửa ${topic.title}`}
                  onClick={() => actions.onEditFolder(topic.folder!)}
                  sx={{ color: "#64748B", "&:hover": { color: "#0071E3", bgcolor: "#EFF6FF" } }}
                >
                  <EditOutlined sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>

              <Tooltip title="Xóa chủ đề">
                <IconButton
                  size="small"
                  aria-label={`Xóa ${topic.title}`}
                  onClick={() => actions.onDeleteFolder(topic.folder!)}
                  sx={{ color: "#94A3B8", "&:hover": { color: "#DC2626", bgcolor: "#FEF2F2" } }}
                >
                  <DeleteOutline sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </>
          ) : null}
        </Stack>
      </Box>

      {/* Topic Body: Lessons */}
      <Box>
        {topic.lessons.length ? (
          <>
            {topic.lessons.map((lesson, lessonIndex) => (
              <CurriculumLessonRow
                key={lesson.folder.id}
                lesson={lesson}
                index={lessonIndex}
                selected={targetsEqual(selectedTarget, lesson.folder.target)}
                onOpenFolder={onOpenFolder}
                onOpenContent={onOpenContent}
                actions={actions}
              />
            ))}
            <Box sx={{ p: 0.75, px: 2, borderTop: "1px dashed #E2E8F0", bgcolor: "#FAFCFF", display: "flex", justifyContent: "flex-start" }}>
              <Button
                size="small"
                variant="text"
                startIcon={<Add fontSize="small" />}
                onClick={() => actions.onCreateLesson(targetFolder)}
                sx={{
                  color: "#0071E3",
                  fontSize: 11.5,
                  fontWeight: 600,
                  textTransform: "none",
                  py: 0.25,
                  "&:hover": { bgcolor: "rgba(0, 113, 227, 0.06)" },
                }}
              >
                Thêm bài học mới vào chủ đề
              </Button>
            </Box>
          </>
        ) : (
          <Box sx={{ p: 2, textAlign: "center", bgcolor: "#FCFDFF" }}>
            <Typography sx={{ color: "#94A3B8", fontSize: 12, mb: 1 }}>
              Chưa có bài học nào trong chủ đề này.
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Add sx={{ fontSize: 14 }} />}
              onClick={() => actions.onCreateLesson(targetFolder)}
              sx={{
                fontSize: 11.5,
                fontWeight: 600,
                textTransform: "none",
                borderColor: "#BFDBFE",
                color: "#0071E3",
                borderRadius: 1.25,
                "&:hover": { bgcolor: "#EFF6FF" },
              }}
            >
              Thêm bài học đầu tiên
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}
