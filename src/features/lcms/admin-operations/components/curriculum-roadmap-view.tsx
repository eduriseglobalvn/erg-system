import { useCallback, useEffect, useState } from "react";
import Add from "@mui/icons-material/Add";
import CheckCircleOutlineOutlined from "@mui/icons-material/CheckCircleOutlineOutlined";
import ChevronRight from "@mui/icons-material/ChevronRight";
import DeleteOutline from "@mui/icons-material/DeleteOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import Layers from "@mui/icons-material/Layers";
import MenuBook from "@mui/icons-material/MenuBook";
import PlayLesson from "@mui/icons-material/PlayLesson";
import UnfoldLess from "@mui/icons-material/UnfoldLess";
import UnfoldMore from "@mui/icons-material/UnfoldMore";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
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
  actions,
}: CurriculumRoadmapViewProps) {
  const stageIds = stages.map((stage) => stage.level.id).join("|");
  const [expandedLevelIds, setExpandedLevelIds] = useState<Set<string>>(
    () => new Set(stages.map((stage) => stage.level.id)),
  );

  // Auto expand all when stages change or subject switches
  useEffect(() => {
    setExpandedLevelIds(new Set(stageIds ? stageIds.split("|") : []));
  }, [stageIds, subjectTitle]);

  // When a target is selected, ensure its level is expanded
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
    <Box sx={{ display: "flex", height: "100%", minHeight: 0, flexDirection: "column", bgcolor: "#F6F8FB" }}>
      {/* Top summary & metrics bar */}
      <Box
        sx={{
          display: "flex",
          minHeight: 64,
          flexShrink: 0,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
          borderBottom: "1px solid #D9E2EF",
          bgcolor: "white",
          px: 3,
          py: 1.5,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              color: "#0F6CBD",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: ".08em",
              textTransform: "uppercase",
            }}
          >
            Bản đồ cấu trúc môn học
          </Typography>
          <Typography noWrap sx={{ mt: 0.25, color: "#172033", fontSize: 16, fontWeight: 800 }}>
            {subjectTitle}
          </Typography>
          <Typography sx={{ mt: 0.5, color: "#637381", fontSize: 11 }}>
            Level (Chặng học) → Chủ đề → Bài học → Khung chương trình
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          {visibleStages.length > 0 ? (
            <Stack direction="row" spacing={0.5} sx={{ mr: 1 }}>
              <Tooltip title="Mở rộng tất cả chặng">
                <Button
                  size="small"
                  variant="text"
                  startIcon={<UnfoldMore sx={{ fontSize: 16 }} />}
                  onClick={handleExpandAll}
                  sx={{ color: "#52606D", fontSize: 12, textTransform: "none" }}
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
                  sx={{ color: "#52606D", fontSize: 12, textTransform: "none" }}
                >
                  Thu gọn
                </Button>
              </Tooltip>
            </Stack>
          ) : null}

          <RoadmapMetric value={visibleStages.length} label="level" />
          <RoadmapMetric value={totalTopics} label="chủ đề" />
          <RoadmapMetric value={totalLessons} label="bài học" />
        </Stack>
      </Box>

      {/* Main roadmap timeline canvas */}
      <Box
        sx={{
          minHeight: 0,
          flex: 1,
          overflowY: "auto",
          px: { xs: 2, xl: 4 },
          py: 3,
          scrollbarGutter: "stable",
        }}
      >
        {visibleStages.length ? (
          <Box sx={{ mx: "auto", maxWidth: 1080 }}>
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
                actions={actions}
              />
            ))}

            {/* Bottom inline add next Level */}
            <Box
              sx={{
                mt: 2,
                mb: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px dashed #D9E2EF",
                borderRadius: 2.5,
                bgcolor: "rgba(255,255,255,0.7)",
                p: 2.5,
                transition: "all 150ms ease",
                "&:hover": { borderColor: "#0F6CBD", bgcolor: "#F5FAFF" },
              }}
            >
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={actions.onCreateLevel}
                sx={{
                  borderColor: "#B8D6FA",
                  color: "#0F6CBD",
                  fontWeight: 700,
                  fontSize: 13,
                  textTransform: "none",
                }}
              >
                + Thêm chặng học (Level) tiếp theo cho {subjectTitle}
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
        minWidth: 68,
        border: "1px solid #D9E2EF",
        borderRadius: 2,
        bgcolor: "#F8FAFC",
        px: 1.25,
        py: 0.5,
        textAlign: "center",
      }}
    >
      <Typography sx={{ color: "#172033", fontSize: 14, fontWeight: 800, lineHeight: 1.1 }}>
        {value}
      </Typography>
      <Typography
        sx={{
          mt: 0.25,
          color: "#637381",
          fontSize: 9.5,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: ".04em",
        }}
      >
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
        minHeight: 420,
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
          border: "1px solid #D9E2EF",
          borderRadius: 3,
          bgcolor: "white",
          boxShadow: "0 4px 16px rgba(15, 35, 58, 0.04)",
        }}
      >
        <Box
          sx={{
            mx: "auto",
            display: "grid",
            height: 56,
            width: 56,
            placeItems: "center",
            borderRadius: "50%",
            bgcolor: "#EAF4FF",
            color: "#0F6CBD",
            boxShadow: "0 0 0 6px #F0F7FF",
          }}
        >
          <Layers sx={{ fontSize: 28 }} />
        </Box>
        <Typography sx={{ mt: 2.5, color: "#172033", fontSize: 16, fontWeight: 800 }}>
          {query ? "Không tìm thấy kết quả" : `Chưa có chặng học nào trong ${subjectTitle}`}
        </Typography>
        <Typography sx={{ mt: 1, color: "#637381", fontSize: 13, lineHeight: 1.6 }}>
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
              fontWeight: 750,
              textTransform: "none",
              px: 3,
              py: 1,
              borderRadius: 2,
            }}
          >
            + Tạo Level đầu tiên cho {subjectTitle}
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
  actions,
}: {
  stage: CurriculumRoadmapStage;
  index: number;
  isLast: boolean;
  expanded: boolean;
  selectedTarget: CurriculumTarget | null;
  onToggle: () => void;
  onOpenFolder: (folder: CurriculumFolder) => void;
  actions: CurriculumRoadmapActions;
}) {
  const lessonCount = stage.topics.reduce((total, topic) => total + topic.lessons.length, 0);
  const isLevelSelected = targetsEqual(selectedTarget, stage.level.target);

  return (
    <Box
      sx={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: "52px minmax(0,1fr)",
        columnGap: 2,
        pb: isLast ? 0 : 3.5,
      }}
    >
      {/* Continuous timeline vertical connector */}
      {!isLast ? (
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            top: 48,
            bottom: -6,
            left: 25,
            width: 2.5,
            bgcolor: "#B8D6FA",
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
          height: 52,
          width: 52,
          placeItems: "center",
          border: isLevelSelected ? "4px solid #0F6CBD" : "4px solid #F6F8FB",
          borderRadius: "50%",
          bgcolor: "#0F6CBD",
          color: "white",
          boxShadow: isLevelSelected
            ? "0 0 0 2px #0F6CBD, 0 4px 12px rgba(15, 108, 189, 0.3)"
            : "0 0 0 1px #B8D6FA, 0 2px 6px rgba(15, 35, 58, 0.08)",
          transition: "all 150ms ease",
        }}
      >
        <Typography sx={{ fontSize: 15, fontWeight: 900 }}>
          {String(index + 1).padStart(2, "0")}
        </Typography>
      </Box>

      {/* Stage Content Card */}
      <Box
        sx={{
          overflow: "hidden",
          border: isLevelSelected ? "2px solid #0F6CBD" : "1px solid #D9E2EF",
          borderRadius: 2.5,
          bgcolor: "white",
          boxShadow: isLevelSelected
            ? "0 8px 24px rgba(15, 108, 189, 0.12)"
            : "0 4px 16px rgba(15, 35, 58, 0.05)",
          transition: "all 160ms ease",
        }}
      >
        {/* Stage Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "stretch",
            borderBottom: expanded ? "1px solid #E6EBF2" : 0,
            bgcolor: isLevelSelected ? "#F8FBFF" : "white",
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
              py: 2,
              textAlign: "left",
              "&:hover": { bgcolor: "rgba(15, 108, 189, 0.03)" },
            }}
          >
            <Box sx={{ display: "flex", minWidth: 0, alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  display: "grid",
                  height: 40,
                  width: 40,
                  flexShrink: 0,
                  placeItems: "center",
                  borderRadius: 2,
                  bgcolor: "#EAF4FF",
                  color: "#0F6CBD",
                }}
              >
                <Layers fontSize="small" />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    color: "#0F6CBD",
                    fontSize: 10.5,
                    fontWeight: 800,
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                  }}
                >
                  Level {index + 1}
                </Typography>
                <Typography noWrap sx={{ mt: 0.25, color: "#172033", fontSize: 15, fontWeight: 800 }}>
                  {stage.level.title}
                </Typography>
                <Typography noWrap sx={{ mt: 0.25, color: "#637381", fontSize: 12 }}>
                  {stage.level.description || `${stage.topics.length} chủ đề · ${lessonCount} bài học`}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", flexShrink: 0, alignItems: "center", gap: 1.5 }}>
              <StatusBadge status={stage.level.status} />
              <ChevronRight
                sx={{
                  color: "#637381",
                  fontSize: 20,
                  transform: expanded ? "rotate(90deg)" : "none",
                  transition: "transform 160ms ease",
                }}
              />
            </Box>
          </ButtonBase>

          {/* Inline Action Toolbar for Level */}
          <Stack direction="row" sx={{ alignItems: "center", borderLeft: "1px solid #E6EBF2", px: 1 }}>
            <Tooltip title="Thêm chủ đề mới vào Level này">
              <Button
                size="small"
                variant="text"
                startIcon={<Add fontSize="small" />}
                onClick={() => actions.onCreateTopic(stage.level)}
                sx={{
                  color: "#0F6CBD",
                  fontSize: 12,
                  fontWeight: 750,
                  textTransform: "none",
                  px: 1.25,
                  whiteSpace: "nowrap",
                }}
              >
                + Chủ đề
              </Button>
            </Tooltip>

            <Tooltip title="Chỉnh sửa level">
              <IconButton
                size="small"
                aria-label={`Chỉnh sửa ${stage.level.title}`}
                onClick={() => actions.onEditFolder(stage.level)}
                sx={{ color: "#52606D", ml: 0.5 }}
              >
                <EditOutlined sx={{ fontSize: 17 }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Xóa level">
              <IconButton
                size="small"
                color="error"
                aria-label={`Xóa ${stage.level.title}`}
                onClick={() => actions.onDeleteFolder(stage.level)}
                sx={{ ml: 0.25 }}
              >
                <DeleteOutline sx={{ fontSize: 17 }} />
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
                actions={actions}
              />
            ))}

            {/* Quick add next topic inside level */}
            <Button
              variant="text"
              startIcon={<Add />}
              onClick={() => actions.onCreateTopic(stage.level)}
              sx={{
                alignSelf: "flex-start",
                color: "#0F6CBD",
                fontSize: 12.5,
                fontWeight: 700,
                textTransform: "none",
                mt: 0.5,
              }}
            >
              + Thêm chủ đề vào {stage.level.title}
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
            <Box
              sx={{
                display: "grid",
                height: 40,
                width: 40,
                placeItems: "center",
                borderRadius: "50%",
                bgcolor: "#EAF4FF",
                color: "#0F6CBD",
              }}
            >
              <PlayLesson sx={{ fontSize: 20 }} />
            </Box>
            <Typography sx={{ color: "#172033", fontSize: 13, fontWeight: 750 }}>
              Chặng này chưa có chủ đề học tập
            </Typography>
            <Typography sx={{ color: "#637381", fontSize: 12, maxWidth: 360, lineHeight: 1.5 }}>
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
              }}
            >
              + Thêm chủ đề đầu tiên
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
  actions,
}: {
  topic: CurriculumRoadmapTopic;
  topicIndex: number;
  levelFolder: CurriculumFolder;
  selectedTarget: CurriculumTarget | null;
  onOpenFolder: (folder: CurriculumFolder) => void;
  actions: CurriculumRoadmapActions;
}) {
  const isTopicSelected = topic.folder && targetsEqual(selectedTarget, topic.folder.target);
  const targetFolder = topic.folder ?? levelFolder;

  return (
    <Box
      sx={{
        overflow: "hidden",
        border: isTopicSelected ? "2px solid #0F6CBD" : "1px solid #D9E2EF",
        borderRadius: 2,
        bgcolor: "white",
        boxShadow: "0 2px 8px rgba(15, 35, 58, 0.04)",
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
          borderBottom: "1px solid #E6EBF2",
          bgcolor: isTopicSelected ? "#F0F7FF" : "#F4F7FA",
          px: 2,
          py: 1.25,
        }}
      >
        <Box sx={{ display: "flex", minWidth: 0, alignItems: "center", gap: 1.25 }}>
          <Box
            sx={{
              display: "grid",
              height: 28,
              width: 28,
              flexShrink: 0,
              placeItems: "center",
              borderRadius: 1.5,
              bgcolor: isTopicSelected ? "#0F6CBD" : "#EAF4FF",
              color: isTopicSelected ? "white" : "#0F6CBD",
            }}
          >
            <Typography sx={{ fontSize: 11, fontWeight: 900 }}>{topicIndex + 1}</Typography>
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: "#52606D", fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>
              Chủ đề {topicIndex + 1}
            </Typography>
            <Typography noWrap sx={{ color: "#172033", fontSize: 13, fontWeight: 800 }}>
              {topic.title}
            </Typography>
          </Box>
        </Box>

        {/* Topic Quick Actions */}
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Typography sx={{ color: "#637381", fontSize: 11, fontWeight: 700, mr: 0.5 }}>
            {topic.lessons.length} bài học
          </Typography>

          <Tooltip title="Thêm bài học mới vào chủ đề này">
            <Button
              size="small"
              variant="outlined"
              startIcon={<Add sx={{ fontSize: 14 }} />}
              onClick={() => actions.onCreateLesson(targetFolder)}
              sx={{
                fontSize: 11.5,
                fontWeight: 700,
                py: 0.35,
                px: 1.25,
                textTransform: "none",
                borderColor: "#B8D6FA",
                color: "#0F6CBD",
                bgcolor: "white",
                "&:hover": { bgcolor: "#F0F7FF" },
              }}
            >
              + Bài học
            </Button>
          </Tooltip>

          {topic.folder ? (
            <>
              <Tooltip title="Chỉnh sửa chủ đề">
                <IconButton
                  size="small"
                  aria-label={`Chỉnh sửa ${topic.title}`}
                  onClick={() => actions.onEditFolder(topic.folder!)}
                  sx={{ color: "#52606D" }}
                >
                  <EditOutlined sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>

              <Tooltip title="Xóa chủ đề">
                <IconButton
                  size="small"
                  color="error"
                  aria-label={`Xóa ${topic.title}`}
                  onClick={() => actions.onDeleteFolder(topic.folder!)}
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
                actions={actions}
              />
            ))}
            <Box sx={{ p: 1, borderTop: "1px solid #EEF2F6", bgcolor: "#FAFCFE", display: "flex", justifyContent: "flex-start" }}>
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
                }}
              >
                + Thêm bài học mới vào chủ đề
              </Button>
            </Box>
          </>
        ) : (
          <Box sx={{ p: 2.5, textAlign: "center", bgcolor: "#FCFDFF" }}>
            <Typography sx={{ color: "#8A98A8", fontSize: 12, mb: 1 }}>
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
                borderColor: "#B8D6FA",
                color: "#0F6CBD",
              }}
            >
              + Thêm bài học đầu tiên
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
  actions,
}: {
  lesson: CurriculumRoadmapLesson;
  index: number;
  selected: boolean;
  onOpenFolder: (folder: CurriculumFolder) => void;
  actions: CurriculumRoadmapActions;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.5,
        borderTop: index ? "1px solid #EEF2F6" : 0,
        bgcolor: selected ? "#F0F7FF" : "white",
        px: 2,
        py: 1.25,
        transition: "background-color 140ms ease",
        "&:hover": { bgcolor: selected ? "#F0F7FF" : "#FBFDFF" },
      }}
    >
      {/* Lesson Title & Selector */}
      <ButtonBase
        onClick={() => onOpenFolder(lesson.folder)}
        sx={{
          display: "flex",
          minWidth: 0,
          flex: 1,
          alignItems: "center",
          gap: 1.5,
          borderRadius: 1.5,
          textAlign: "left",
          "&:hover .lesson-title": { color: "#0F6CBD" },
        }}
      >
        <Box
          sx={{
            display: "grid",
            height: 28,
            width: 28,
            flexShrink: 0,
            placeItems: "center",
            border: "1px solid",
            borderColor: selected ? "#0F6CBD" : "#D9E2EF",
            borderRadius: "50%",
            bgcolor: selected ? "#0F6CBD" : "#F8FAFC",
            color: selected ? "white" : "#52606D",
          }}
        >
          {selected ? (
            <CheckCircleOutlineOutlined sx={{ fontSize: 16 }} />
          ) : (
            <MenuBook sx={{ fontSize: 14 }} />
          )}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: "#637381", fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>
            Bài {index + 1}
          </Typography>
          <Typography
            className="lesson-title"
            noWrap
            sx={{ mt: 0.25, color: "#172033", fontSize: 13, fontWeight: 700 }}
          >
            {lesson.folder.title}
          </Typography>
        </Box>
      </ButtonBase>

      {/* Lesson Actions: Sửa, Xóa */}
      <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0, alignItems: "center" }}>
        <Tooltip title="Chỉnh sửa bài học">
          <IconButton
            size="small"
            aria-label={`Chỉnh sửa ${lesson.folder.title}`}
            onClick={() => actions.onEditFolder(lesson.folder)}
            sx={{ color: "#52606D", p: 0.5 }}
          >
            <EditOutlined sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Xóa bài học">
          <IconButton
            size="small"
            color="error"
            aria-label={`Xóa ${lesson.folder.title}`}
            onClick={() => actions.onDeleteFolder(lesson.folder)}
            sx={{ p: 0.5 }}
          >
            <DeleteOutline sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
}
