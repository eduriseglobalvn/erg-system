import Add from "@mui/icons-material/Add";
import ChevronRight from "@mui/icons-material/ChevronRight";
import DeleteOutline from "@mui/icons-material/DeleteOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import Layers from "@mui/icons-material/Layers";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import { StatusBadge } from "@/features/lcms/admin-operations/components/learning-resource-curriculum-explorer-badges";
import { targetsEqual } from "@/features/lcms/admin-operations/components/learning-resource-curriculum-explorer";
import { RoadmapTopicCard } from "@/features/lcms/admin-operations/components/curriculum-roadmap/roadmap-topic-card";
import type { CurriculumRoadmapActions } from "@/features/lcms/admin-operations/components/curriculum-roadmap/roadmap-types";
import type {
  CurriculumContentItem,
  CurriculumFolder,
  CurriculumRoadmapStage,
  CurriculumTarget,
} from "@/features/lcms/admin-operations/utils/learning-resource-curriculum-view-model";

export function RoadmapStage({
  stage,
  index,
  isLast,
  expanded,
  selectedTarget,
  onToggle,
  onOpenFolder,
  onOpenContent,
  actions,
}: {
  stage: CurriculumRoadmapStage;
  index: number;
  isLast: boolean;
  expanded: boolean;
  selectedTarget: CurriculumTarget | null;
  onToggle: () => void;
  onOpenFolder: (folder: CurriculumFolder) => void;
  onOpenContent?: (item: CurriculumContentItem) => void;
  actions: CurriculumRoadmapActions;
}) {
  const lessonCount = stage.topics.reduce((total, topic) => total + topic.lessons.length, 0);
  const isLevelSelected = targetsEqual(selectedTarget, stage.level.target);

  return (
    <Box
      sx={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: "44px minmax(0,1fr)",
        columnGap: 2,
        pb: isLast ? 0 : 3,
      }}
    >
      {/* Continuous timeline vertical connector */}
      {!isLast ? (
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            top: 44,
            bottom: -6,
            left: 21,
            width: 2,
            bgcolor: "#CBD5E1",
            borderRadius: 1,
          }}
        />
      ) : null}

      {/* Stage Number Node */}
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          mt: 0.5,
          height: 44,
          width: 44,
          placeItems: "center",
          border: isLevelSelected ? "3px solid #0F6CBD" : "3px solid #FFFFFF",
          borderRadius: "50%",
          bgcolor: "#0F6CBD",
          color: "#FFFFFF",
          boxShadow: isLevelSelected
            ? "0 0 0 2px #0F6CBD, 0 4px 12px rgba(15, 108, 189, 0.3)"
            : "0 2px 6px rgba(15, 35, 58, 0.12)",
          transition: "all 150ms ease",
        }}
      >
        <Typography sx={{ fontSize: 14, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
          {String(index + 1).padStart(2, "0")}
        </Typography>
      </Box>

      {/* Stage Content Card */}
      <Box
        sx={{
          overflow: "hidden",
          border: isLevelSelected ? "2px solid #0F6CBD" : "1px solid #E2E8F0",
          borderRadius: 2.5,
          bgcolor: "#FFFFFF",
          boxShadow: "0 1px 4px rgba(15, 35, 58, 0.04)",
          transition: "all 160ms ease",
        }}
      >
        {/* Stage Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            borderBottom: expanded ? "1px solid #E2E8F0" : 0,
            bgcolor: isLevelSelected ? "#F8FBFF" : "#FFFFFF",
          }}
        >
          <ButtonBase
            aria-expanded={expanded}
            aria-label={`${expanded ? "Thu gọn" : "Mở"} ${stage.level.title}`}
            onClick={onToggle}
            sx={{
              display: "flex",
              minWidth: 0,
              flex: 1,
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              px: 2.5,
              py: 1.75,
              textAlign: "left",
              "&:hover": { bgcolor: "rgba(15, 108, 189, 0.02)" },
            }}
          >
            <Box sx={{ display: "flex", minWidth: 0, alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  display: "grid",
                  height: 38,
                  width: 38,
                  flexShrink: 0,
                  placeItems: "center",
                  borderRadius: 2,
                  bgcolor: "#EFF6FF",
                  color: "#0F6CBD",
                }}
              >
                <Layers sx={{ fontSize: 20 }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography noWrap sx={{ color: "#0F172A", fontSize: 15.5, fontWeight: 600 }}>
                  {stage.level.title}
                </Typography>
                <Typography noWrap sx={{ mt: 0.25, color: "#64748B", fontSize: 12 }}>
                  {stage.level.description || `${stage.topics.length} chủ đề · ${lessonCount} bài học`}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", flexShrink: 0, alignItems: "center", gap: 1.5 }}>
              <StatusBadge status={stage.level.status} />
              <ChevronRight
                sx={{
                  color: "#64748B",
                  fontSize: 20,
                  transform: expanded ? "rotate(90deg)" : "none",
                  transition: "transform 160ms ease",
                }}
              />
            </Box>
          </ButtonBase>

          {/* Inline Action Toolbar for Level */}
          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", borderLeft: "1px solid #E2E8F0", px: 1.5 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Add fontSize="small" />}
              onClick={() => actions.onCreateTopic(stage.level)}
              sx={{
                color: "#0F6CBD",
                borderColor: "#BFDBFE",
                bgcolor: "#EFF6FF",
                fontSize: 12,
                fontWeight: 600,
                textTransform: "none",
                borderRadius: 1.5,
                px: 1.25,
                py: 0.35,
                whiteSpace: "nowrap",
                "&:hover": { bgcolor: "#DBEAFE", borderColor: "#93C5FD" },
              }}
            >
              Chủ đề
            </Button>

            <Tooltip title="Chỉnh sửa level">
              <IconButton
                size="small"
                aria-label={`Chỉnh sửa ${stage.level.title}`}
                onClick={() => actions.onEditFolder(stage.level)}
                sx={{ color: "#64748B", "&:hover": { color: "#0F6CBD", bgcolor: "#EFF6FF" } }}
              >
                <EditOutlined sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Xóa level">
              <IconButton
                size="small"
                aria-label={`Xóa ${stage.level.title}`}
                onClick={() => actions.onDeleteFolder(stage.level)}
                sx={{ color: "#94A3B8", "&:hover": { color: "#DC2626", bgcolor: "#FEF2F2" } }}
              >
                <DeleteOutline sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        {/* Level Body: Topics & Lessons */}
        {expanded && stage.topics.length ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, bgcolor: "#F8FAFC", p: 2 }}>
            {stage.topics.map((topic, topicIndex) => (
              <RoadmapTopicCard
                key={topic.id}
                topic={topic}
                topicIndex={topicIndex}
                levelFolder={stage.level}
                selectedTarget={selectedTarget}
                onOpenFolder={onOpenFolder}
                onOpenContent={onOpenContent}
                actions={actions}
              />
            ))}

            {/* Quick add next topic inside level */}
            <Button
              variant="outlined"
              startIcon={<Add fontSize="small" />}
              onClick={() => actions.onCreateTopic(stage.level)}
              sx={{
                alignSelf: "flex-start",
                color: "#0F6CBD",
                borderColor: "#BFDBFE",
                bgcolor: "#FFFFFF",
                fontSize: 12,
                fontWeight: 600,
                textTransform: "none",
                borderRadius: 1.5,
                px: 1.75,
                py: 0.5,
                "&:hover": { bgcolor: "#EFF6FF", borderColor: "#0F6CBD" },
              }}
            >
              Thêm chủ đề vào {stage.level.title}
            </Button>
          </Box>
        ) : expanded ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1.5,
              bgcolor: "#FBFCFE",
              px: 3,
              py: 4,
              textAlign: "center",
            }}
          >
            <Typography sx={{ color: "#1E293B", fontSize: 13, fontWeight: 600 }}>
              Chặng này chưa có chủ đề học tập
            </Typography>
            <Typography sx={{ color: "#64748B", fontSize: 12, maxWidth: 360, lineHeight: 1.5 }}>
              Tạo chủ đề đầu tiên để phân bổ bài học trong chặng {stage.level.title}.
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<Add />}
              onClick={() => actions.onCreateTopic(stage.level)}
              sx={{
                bgcolor: "#0F6CBD",
                fontSize: 12,
                fontWeight: 600,
                textTransform: "none",
                mt: 0.5,
                boxShadow: "none",
                "&:hover": { bgcolor: "#0B5594" },
              }}
            >
              Thêm chủ đề đầu tiên
            </Button>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}
