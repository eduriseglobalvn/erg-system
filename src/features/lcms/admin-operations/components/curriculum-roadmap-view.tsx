import { useCallback, useEffect, useState } from "react";
import Add from "@mui/icons-material/Add";
import AttachFileOutlined from "@mui/icons-material/AttachFileOutlined";
import ChevronRight from "@mui/icons-material/ChevronRight";
import DeleteOutline from "@mui/icons-material/DeleteOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import HelpOutlineOutlined from "@mui/icons-material/HelpOutlineOutlined";
import Layers from "@mui/icons-material/Layers";
import UnfoldLess from "@mui/icons-material/UnfoldLess";
import UnfoldMore from "@mui/icons-material/UnfoldMore";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import { StatusBadge } from "@/features/lcms/admin-operations/components/learning-resource-curriculum-explorer-badges";
import { targetsEqual } from "@/features/lcms/admin-operations/components/learning-resource-curriculum-explorer";
import type {
  CurriculumContentItem,
  CurriculumFolder,
  CurriculumRoadmapLesson,
  CurriculumRoadmapStage,
  CurriculumRoadmapTopic,
  CurriculumTarget,
} from "@/features/lcms/admin-operations/utils/learning-resource-curriculum-view-model";

export type CurriculumRoadmapActions = {
  onCreateLevel: () => void;
  onCreateTopic: (levelFolder: CurriculumFolder) => void;
  onCreateLesson: (topicFolder: CurriculumFolder) => void;
  onAddExercise?: (lessonFolder: CurriculumFolder) => void;
  onAddResource?: (lessonFolder: CurriculumFolder) => void;
  onEditFolder: (folder: CurriculumFolder) => void;
  onDeleteFolder: (folder: CurriculumFolder) => void;
};

export type CurriculumRoadmapViewProps = {
  stages: CurriculumRoadmapStage[];
  subjectTitle: string;
  query: string;
  selectedTarget: CurriculumTarget | null;
  onOpenFolder: (folder: CurriculumFolder) => void;
  onOpenContent?: (item: CurriculumContentItem) => void;
  actions: CurriculumRoadmapActions;
};

export function CurriculumRoadmapView({
  stages,
  subjectTitle,
  query,
  selectedTarget,
  onOpenFolder,
  onOpenContent,
  actions,
}: CurriculumRoadmapViewProps) {
  const stageIds = stages.map((stage) => stage.level.id).join("|");
  const [expandedLevelIds, setExpandedLevelIds] = useState<Set<string>>(
    () => new Set(stages.map((stage) => stage.level.id)),
  );

  useEffect(() => {
    setExpandedLevelIds(new Set(stageIds ? stageIds.split("|") : []));
  }, [stageIds, subjectTitle]);

  useEffect(() => {
    if (!selectedTarget) return;
    for (const stage of stages) {
      const matchInLevel = targetsEqual(selectedTarget, stage.level.target);
      const matchInTopic = stage.topics.some(
        (t) =>
          (t.folder && targetsEqual(selectedTarget, t.folder.target)) ||
          t.lessons.some((l) => targetsEqual(selectedTarget, l.folder.target)),
      );
      if (matchInLevel || matchInTopic) {
        setExpandedLevelIds((current) => {
          if (current.has(stage.level.id)) return current;
          const next = new Set(current);
          next.add(stage.level.id);
          return next;
        });
        break;
      }
    }
  }, [selectedTarget, stages]);

  const toggleLevel = useCallback((levelId: string) => {
    setExpandedLevelIds((current) => {
      const next = new Set(current);
      if (next.has(levelId)) next.delete(levelId);
      else next.add(levelId);
      return next;
    });
  }, []);

  const handleExpandAll = useCallback(() => {
    setExpandedLevelIds(new Set(stages.map((s) => s.level.id)));
  }, [stages]);

  const handleCollapseAll = useCallback(() => {
    setExpandedLevelIds(new Set());
  }, []);

  const normalizedQuery = query.trim().toLocaleLowerCase("vi");
  const visibleStages = stages
    .map((stage) => ({
      ...stage,
      topics: stage.topics
        .map((topic) => ({
          ...topic,
          lessons: normalizedQuery
            ? topic.lessons.filter((lesson) =>
                `${lesson.folder.title} ${lesson.folder.description ?? ""}`
                  .toLocaleLowerCase("vi")
                  .includes(normalizedQuery),
              )
            : topic.lessons,
        }))
        .filter(
          (topic) =>
            !normalizedQuery ||
            topic.title.toLocaleLowerCase("vi").includes(normalizedQuery) ||
            topic.lessons.length > 0,
        ),
    }))
    .filter(
      (stage) =>
        !normalizedQuery ||
        `${stage.level.title} ${stage.level.description ?? ""}`.toLocaleLowerCase("vi").includes(normalizedQuery) ||
        stage.topics.length > 0,
    );

  const totalTopics = visibleStages.reduce((total, stage) => total + stage.topics.length, 0);
  const totalLessons = visibleStages.reduce(
    (total, stage) => total + stage.topics.reduce((count, topic) => count + topic.lessons.length, 0),
    0,
  );

  return (
    <Box sx={{ display: "flex", height: "100%", minHeight: 0, flexDirection: "column", bgcolor: "#F8FAFC" }}>
      {/* Top summary & metrics bar */}
      <Box
        sx={{
          display: "flex",
          minHeight: 60,
          flexShrink: 0,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
          borderBottom: "1px solid #E2E8F0",
          bgcolor: "#FFFFFF",
          px: 3,
          py: 1.25,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              sx={{
                color: "#0F6CBD",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: ".06em",
                textTransform: "uppercase",
              }}
            >
              Bản đồ cấu trúc môn học
            </Typography>
            <Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: "#CBD5E1" }} />
            <Typography sx={{ color: "#64748B", fontSize: 12, fontWeight: 500 }}>
              Level (Chặng học) → Chủ đề → Bài học
            </Typography>
          </Box>
          <Typography noWrap sx={{ mt: 0.25, color: "#0F172A", fontSize: 17, fontWeight: 800 }}>
            {subjectTitle}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          {visibleStages.length > 0 ? (
            <Stack direction="row" spacing={0.5} sx={{ mr: 0.5 }}>
              <Tooltip title="Mở rộng tất cả chặng">
                <Button
                  size="small"
                  variant="text"
                  startIcon={<UnfoldMore sx={{ fontSize: 16 }} />}
                  onClick={handleExpandAll}
                  sx={{ color: "#64748B", fontSize: 12, fontWeight: 600, textTransform: "none" }}
                >
                  Mở tất cả
                </Button>
              </Tooltip>
              <Tooltip title="Thu gọn tất cả chặng">
                <Button
                  size="small"
                  variant="text"
                  startIcon={<UnfoldLess sx={{ fontSize: 16 }} />}
                  onClick={handleCollapseAll}
                  sx={{ color: "#64748B", fontSize: 12, fontWeight: 600, textTransform: "none" }}
                >
                  Thu gọn
                </Button>
              </Tooltip>
            </Stack>
          ) : null}

          <RoadmapMetric value={visibleStages.length} label="Level" />
          <RoadmapMetric value={totalTopics} label="Chủ đề" />
          <RoadmapMetric value={totalLessons} label="Bài học" />
        </Stack>
      </Box>

      {/* Main roadmap timeline canvas */}
      <Box
        sx={{
          minHeight: 0,
          flex: 1,
          overflowY: "auto",
          px: { xs: 2, lg: 3.5 },
          py: 3,
          scrollbarGutter: "stable",
        }}
      >
        {visibleStages.length ? (
          <Box sx={{ mx: "auto", maxWidth: 1140 }}>
            {visibleStages.map((stage, index) => (
              <RoadmapStage
                key={stage.level.id}
                stage={stage}
                index={index}
                isLast={index === visibleStages.length - 1}
                expanded={Boolean(normalizedQuery) || expandedLevelIds.has(stage.level.id)}
                selectedTarget={selectedTarget}
                onToggle={() => toggleLevel(stage.level.id)}
                onOpenFolder={onOpenFolder}
                onOpenContent={onOpenContent}
                actions={actions}
              />
            ))}

            {/* Bottom inline add next Level */}
            <Box
              sx={{
                mt: 2.5,
                mb: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px dashed #CBD5E1",
                borderRadius: 2.5,
                bgcolor: "#FFFFFF",
                p: 2.5,
                transition: "all 150ms ease",
                "&:hover": { borderColor: "#0F6CBD", bgcolor: "#F0F7FF" },
              }}
            >
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={actions.onCreateLevel}
                sx={{
                  borderColor: "#93C5FD",
                  bgcolor: "#FFFFFF",
                  color: "#0F6CBD",
                  fontWeight: 700,
                  fontSize: 13,
                  textTransform: "none",
                  borderRadius: 2,
                  px: 2.5,
                  py: 0.75,
                  boxShadow: "0 1px 3px rgba(15, 108, 189, 0.08)",
                  "&:hover": { bgcolor: "#EFF6FF", borderColor: "#0F6CBD" },
                }}
              >
                Thêm chặng học (Level) tiếp theo cho {subjectTitle}
              </Button>
            </Box>
          </Box>
        ) : (
          <EmptyRoadmapState
            subjectTitle={subjectTitle}
            query={normalizedQuery}
            onCreateLevel={actions.onCreateLevel}
          />
        )}
      </Box>
    </Box>
  );
}

function RoadmapMetric({ value, label }: { value: number; label: string }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        border: "1px solid #E2E8F0",
        borderRadius: 2,
        bgcolor: "#FFFFFF",
        px: 1.5,
        py: 0.5,
        boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
      }}
    >
      <Typography sx={{ color: "#0F172A", fontSize: 14, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>
        {value}
      </Typography>
      <Typography sx={{ color: "#64748B", fontSize: 11, fontWeight: 600 }}>
        {label}
      </Typography>
    </Box>
  );
}

function EmptyRoadmapState({
  subjectTitle,
  query,
  onCreateLevel,
}: {
  subjectTitle: string;
  query: string;
  onCreateLevel: () => void;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        minHeight: 400,
        alignItems: "center",
        justifyContent: "center",
        px: 4,
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          maxWidth: 440,
          p: 4,
          border: "1px solid #E2E8F0",
          borderRadius: 3,
          bgcolor: "#FFFFFF",
          boxShadow: "0 4px 16px rgba(15, 35, 58, 0.04)",
        }}
      >
        <Box
          sx={{
            mx: "auto",
            display: "grid",
            height: 52,
            width: 52,
            placeItems: "center",
            borderRadius: "50%",
            bgcolor: "#EFF6FF",
            color: "#0F6CBD",
            boxShadow: "0 0 0 6px #F0F7FF",
          }}
        >
          <Layers sx={{ fontSize: 26 }} />
        </Box>
        <Typography sx={{ mt: 2.5, color: "#0F172A", fontSize: 16, fontWeight: 800 }}>
          {query ? "Không tìm thấy kết quả" : `Chưa có chặng học nào trong ${subjectTitle}`}
        </Typography>
        <Typography sx={{ mt: 1, color: "#64748B", fontSize: 13, lineHeight: 1.6 }}>
          {query
            ? `Không có level, chủ đề hoặc bài học nào khớp với từ khóa "${query}".`
            : "Bắt đầu xây dựng lộ trình học tập theo chuẩn roadmap bằng cách tạo Level (Chặng học) đầu tiên."}
        </Typography>
        {!query ? (
          <Button
            variant="contained"
            size="medium"
            startIcon={<Add />}
            onClick={onCreateLevel}
            sx={{
              mt: 3,
              bgcolor: "#0F6CBD",
              boxShadow: "0 2px 8px rgba(15, 108, 189, 0.25)",
              fontSize: 13,
              fontWeight: 700,
              textTransform: "none",
              px: 3,
              py: 1,
              borderRadius: 2,
              "&:hover": { bgcolor: "#0B5594" },
            }}
          >
            Tạo Level đầu tiên cho {subjectTitle}
          </Button>
        ) : null}
      </Box>
    </Box>
  );
}

function RoadmapStage({
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
        <Typography sx={{ fontSize: 14, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace" }}>
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
                <Typography noWrap sx={{ color: "#0F172A", fontSize: 15.5, fontWeight: 800 }}>
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
                fontWeight: 700,
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
                fontWeight: 700,
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
            <Typography sx={{ color: "#1E293B", fontSize: 13, fontWeight: 700 }}>
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
                fontWeight: 700,
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

function RoadmapTopicCard({
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
        border: isTopicSelected ? "2px solid #0F6CBD" : "1px solid #E2E8F0",
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
          bgcolor: isTopicSelected ? "#F0F7FF" : "#F8FAFC",
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
              fontWeight: 800,
              bgcolor: isTopicSelected ? "#0F6CBD" : "#EFF6FF",
              color: isTopicSelected ? "#FFFFFF" : "#1D4ED8",
              borderRadius: 1,
            }}
          />
          <Typography noWrap sx={{ color: "#0F172A", fontSize: 13.5, fontWeight: 750 }}>
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
                fontWeight: 700,
                py: 0.35,
                px: 1.25,
                textTransform: "none",
                bgcolor: "#0F6CBD",
                color: "#FFFFFF",
                borderRadius: 1.25,
                boxShadow: "none",
                "&:hover": { bgcolor: "#0B5594" },
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
                  sx={{ color: "#64748B", "&:hover": { color: "#0F6CBD", bgcolor: "#EFF6FF" } }}
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
                  color: "#0F6CBD",
                  fontSize: 11.5,
                  fontWeight: 700,
                  textTransform: "none",
                  py: 0.25,
                  "&:hover": { bgcolor: "rgba(15, 108, 189, 0.06)" },
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
                fontWeight: 700,
                textTransform: "none",
                borderColor: "#BFDBFE",
                color: "#0F6CBD",
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

function CurriculumLessonRow({
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
            fontWeight: 700,
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
              fontWeight: 700,
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
              fontWeight: 700,
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
