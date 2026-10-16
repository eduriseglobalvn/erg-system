import { useCallback, useEffect, useMemo, useState } from "react";
import Add from "@mui/icons-material/Add";
import AutoStories from "@mui/icons-material/AutoStories";
import CalendarMonth from "@mui/icons-material/CalendarMonth";
import ChevronRight from "@mui/icons-material/ChevronRight";
import CheckCircleOutline from "@mui/icons-material/CheckCircleOutlineOutlined";
import FileQuestion from "@mui/icons-material/HelpOutlineOutlined";
import FileText from "@mui/icons-material/Article";
import Layers from "@mui/icons-material/Layers";
import PlayLesson from "@mui/icons-material/PlayLesson";
import Pencil from "@mui/icons-material/Edit";
import Presentation from "@mui/icons-material/Slideshow";
import Trash2 from "@mui/icons-material/DeleteOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import {
  deleteLearningResourceResource,
  loadLearningResourceResourceDetail,
  type LearningResourceResourceCard,
  type LearningResourceTaxonomyOption,
} from "@/features/lcms/admin-operations/api/learning-resource-authoring-api";
import { ResourceEditDialog } from "@/features/lcms/admin-operations/components/learning-resource-authoring-edit-dialogs";
import { CurriculumTeachingPlanDialog } from "@/features/lcms/admin-operations/components/curriculum-teaching-plan-dialog";
import type {
  AttachedResourceItem,
  LocalContentItem,
  StudioNode,
  StudioSubject,
  StructureSelection,
} from "@/features/lcms/admin-operations/types/learning-resource-authoring";
import { usePacedStateBatch } from "@/hooks/use-paced-state-batch";
import {
  LearningResourceExplorerShell,
  LearningResourceExplorerTopBar,
} from "@/components/learning-resources/explorer-ui";
import { COURSE_STRUCTURE_WORKSPACE_LABEL } from "@/components/learning-resources/learning-resource-workspace-labels";
import {
  EnterpriseList,
  flattenContentGroups,
  targetsEqual,
} from "@/features/lcms/admin-operations/components/learning-resource-curriculum-explorer";
import {
  buildExplorerPathUrl,
  getDisplayLink,
} from "@/features/lcms/admin-operations/components/learning-resource-authoring-utils";
import {
  buildCurriculumExplorerModel,
  buildCurriculumRoadmapStages,
  type CurriculumContentItem,
  type CurriculumFolder,
  type CurriculumRoadmapStage,
  type CurriculumTarget,
  type ResourceCommandId,
} from "@/features/lcms/admin-operations/utils/learning-resource-curriculum-view-model";
import { StatusBadge } from "@/features/lcms/admin-operations/components/learning-resource-curriculum-explorer-badges";
import type { QuizBankItem } from "@/features/lcms/quiz/question-bank/types/question-bank-types";
import { cn } from "@/lib/utils";

function SubjectRail({
  subjects,
  selectedSubjectId,
  query,
  onSelectSubject,
  onBackToSubjects,
}: {
  subjects: StudioSubject[];
  selectedSubjectId?: string;
  query: string;
  onSelectSubject: (id: string) => void;
  onBackToSubjects: () => void;
}) {
  const normalizedQuery = query.trim().toLocaleLowerCase("vi");
  const visibleSubjects = normalizedQuery
    ? subjects.filter((subject) => `${subject.label} ${subject.description ?? ""}`.toLocaleLowerCase("vi").includes(normalizedQuery))
    : subjects;

  return (
    <aside className="flex min-h-0 flex-col border-r border-[#D9E2EF] bg-white">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-[#D9E2EF] px-3">
        <span className="text-[12px] font-bold uppercase tracking-wide text-[#52606D]">Môn học</span>
        <Button size="small" variant="text" onClick={onBackToSubjects} sx={{ minWidth: 0, px: 1, fontSize: 12 }}>
          Quản lý
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2 [scrollbar-gutter:stable]">
        {visibleSubjects.map((subject) => {
          const selected = subject.id === selectedSubjectId;
          return (
            <button
              key={subject.id}
              type="button"
              className={cn(
                "mb-1 flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#75B6F2]",
                selected ? "border-[#B8D6FA] bg-[#EAF4FF]" : "border-transparent hover:bg-[#F4F7FA]",
              )}
              onClick={() => onSelectSubject(subject.id)}
            >
              <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", selected ? "bg-white text-[#0F6CBD]" : "bg-[#F1F4F7] text-[#52606D]") }>
                <AutoStories className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-bold text-[#172033]">{subject.label}</span>
                <span className="mt-0.5 block text-[11px] text-[#637381]">{subject.groupCount} level · {subject.lessonCount} bài học</span>
              </span>
            </button>
          );
        })}
        {!visibleSubjects.length ? <p className="px-3 py-6 text-center text-xs text-[#637381]">Không tìm thấy môn học.</p> : null}
      </div>
    </aside>
  );
}

function CurriculumRoadmap({
  stages,
  subjectTitle,
  query,
  selectedTarget,
  onOpenFolder,
  onOpenContent,
}: {
  stages: CurriculumRoadmapStage[];
  subjectTitle: string;
  query: string;
  selectedTarget: CurriculumTarget | null;
  onOpenFolder: (folder: CurriculumFolder) => void;
  onOpenContent: (item: CurriculumContentItem) => void;
}) {
  const stageIds = stages.map((stage) => stage.level.id).join("|");
  const [expandedLevelIds, setExpandedLevelIds] = useState<Set<string>>(
    () => new Set(stages.map((stage) => stage.level.id)),
  );

  useEffect(() => {
    setExpandedLevelIds(new Set(stageIds ? stageIds.split("|") : []));
  }, [stageIds, subjectTitle]);

  const toggleLevel = useCallback((levelId: string) => {
    setExpandedLevelIds((current) => {
      const next = new Set(current);
      if (next.has(levelId)) next.delete(levelId);
      else next.add(levelId);
      return next;
    });
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
                `${lesson.folder.title} ${lesson.folder.description ?? ""} ${lesson.content.map((item) => item.title).join(" ")}`
                  .toLocaleLowerCase("vi")
                  .includes(normalizedQuery),
              )
            : topic.lessons,
        }))
        .filter((topic) => !normalizedQuery || topic.title.toLocaleLowerCase("vi").includes(normalizedQuery) || topic.lessons.length > 0),
    }))
    .filter((stage) => !normalizedQuery || `${stage.level.title} ${stage.level.description ?? ""}`.toLocaleLowerCase("vi").includes(normalizedQuery) || stage.topics.length > 0);

  const totalTopics = visibleStages.reduce((total, stage) => total + stage.topics.length, 0);
  const totalLessons = visibleStages.reduce((total, stage) => total + stage.topics.reduce((count, topic) => count + topic.lessons.length, 0), 0);

  return (
    <Box sx={{ display: "flex", height: "100%", minHeight: 0, flexDirection: "column", bgcolor: "#F6F8FB" }}>
      <Box sx={{ display: "flex", minHeight: 64, flexShrink: 0, alignItems: "center", justifyContent: "space-between", gap: 2, borderBottom: "1px solid #D9E2EF", bgcolor: "white", px: 3, py: 1.5 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: "#0F6CBD", fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase" }}>Bản đồ chương trình</Typography>
          <Typography noWrap sx={{ mt: 0.25, color: "#172033", fontSize: 16, fontWeight: 800 }}>{subjectTitle}</Typography>
          <Typography sx={{ mt: 0.5, color: "#637381", fontSize: 11 }}>Level → Chủ đề → Bài học → Học liệu & bài tập</Typography>
        </Box>
        <Box sx={{ display: "flex", flexShrink: 0, gap: 1 }}>
          <RoadmapMetric value={visibleStages.length} label="level" />
          <RoadmapMetric value={totalTopics} label="chủ đề" />
          <RoadmapMetric value={totalLessons} label="bài học" />
        </Box>
      </Box>

      <Box sx={{ minHeight: 0, flex: 1, overflowY: "auto", px: { xs: 2, xl: 4 }, py: 3, scrollbarGutter: "stable" }}>
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
                onOpenContent={onOpenContent}
              />
            ))}
          </Box>
        ) : (
          <Box sx={{ display: "flex", minHeight: 320, alignItems: "center", justifyContent: "center", px: 4, textAlign: "center" }}>
            <Box sx={{ maxWidth: 360 }}>
              <Box sx={{ mx: "auto", display: "grid", height: 48, width: 48, placeItems: "center", borderRadius: 2, bgcolor: "#EAF4FF", color: "#0F6CBD" }}><Layers fontSize="small" /></Box>
              <Typography sx={{ mt: 2, color: "#172033", fontSize: 14, fontWeight: 800 }}>Chưa có chặng học phù hợp</Typography>
              <Typography sx={{ mt: 0.5, color: "#637381", fontSize: 13, lineHeight: 1.6 }}>Tạo level đầu tiên hoặc thay đổi từ khóa tìm kiếm để xây dựng roadmap môn học.</Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}

function RoadmapMetric({ value, label }: { value: number; label: string }) {
  return (
    <Box sx={{ minWidth: 72, border: "1px solid #D9E2EF", borderRadius: 2, bgcolor: "#F8FAFC", px: 1.5, py: 0.75, textAlign: "center" }}>
      <Typography sx={{ color: "#172033", fontSize: 15, fontWeight: 800, lineHeight: 1 }}>{value}</Typography>
      <Typography sx={{ mt: 0.5, color: "#637381", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{label}</Typography>
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
}: {
  stage: CurriculumRoadmapStage;
  index: number;
  isLast: boolean;
  expanded: boolean;
  selectedTarget: CurriculumTarget | null;
  onToggle: () => void;
  onOpenFolder: (folder: CurriculumFolder) => void;
  onOpenContent: (item: CurriculumContentItem) => void;
}) {
  const lessonCount = stage.topics.reduce((total, topic) => total + topic.lessons.length, 0);
  return (
    <Box sx={{ position: "relative", display: "grid", gridTemplateColumns: "52px minmax(0,1fr)", columnGap: 2, pb: isLast ? 0 : 3 }}>
      {!isLast ? <Box aria-hidden sx={{ position: "absolute", top: 42, bottom: -4, left: 25, width: 2, bgcolor: "#B8D6FA" }} /> : null}
      <Box sx={{ position: "relative", zIndex: 1, display: "grid", mt: 0.25, height: 52, width: 52, placeItems: "center", border: "4px solid #F6F8FB", borderRadius: "50%", bgcolor: "#0F6CBD", color: "white", boxShadow: "0 0 0 1px #B8D6FA" }}>
        <Typography sx={{ fontSize: 14, fontWeight: 900 }}>{String(index + 1).padStart(2, "0")}</Typography>
      </Box>

      <Box sx={{ overflow: "hidden", border: "1px solid #D9E2EF", borderRadius: 2.5, bgcolor: "white", boxShadow: "0 6px 18px rgba(15, 35, 58, 0.06)" }}>
        <Box sx={{ display: "flex", alignItems: "stretch", borderBottom: expanded ? "1px solid #E6EBF2" : 0 }}>
        <ButtonBase
          aria-expanded={expanded}
          aria-label={`${expanded ? "Thu gọn" : "Mở"} ${stage.level.title}`}
          onClick={onToggle}
          sx={{ display: "flex", minWidth: 0, flex: 1, alignItems: "center", justifyContent: "space-between", gap: 2, px: 2.5, py: 2, textAlign: "left" }}
        >
          <Box sx={{ display: "flex", minWidth: 0, alignItems: "center", gap: 1.5 }}>
            <Box sx={{ display: "grid", height: 38, width: 38, flexShrink: 0, placeItems: "center", borderRadius: 2, bgcolor: "#EAF4FF", color: "#0F6CBD" }}><Layers fontSize="small" /></Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ color: "#0F6CBD", fontSize: 10, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase" }}>Level {index + 1}</Typography>
              <Typography noWrap sx={{ mt: 0.25, color: "#172033", fontSize: 15, fontWeight: 800 }}>{stage.level.title}</Typography>
              <Typography noWrap sx={{ mt: 0.25, color: "#637381", fontSize: 12 }}>{stage.level.description || `${stage.topics.length} chủ đề · ${lessonCount} bài học · ${stage.level.summary.totalContent} học liệu`}</Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", flexShrink: 0, alignItems: "center", gap: 1.5 }}>
            <StatusBadge status={stage.level.status} />
            <ChevronRight sx={{ color: "#637381", fontSize: 20, transform: expanded ? "rotate(90deg)" : "none", transition: "transform 160ms ease" }} />
          </Box>
        </ButtonBase>
        <Tooltip title="Quản lý level">
          <IconButton
            aria-label={`Quản lý ${stage.level.title}`}
            onClick={() => onOpenFolder(stage.level)}
            sx={{ width: 48, borderLeft: "1px solid #E6EBF2", borderRadius: 0, color: "#52606D" }}
          >
            <Pencil sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
        </Box>

        {expanded && stage.topics.length ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, bgcolor: "#F8FAFC", p: 2 }}>
            {stage.topics.map((topic, topicIndex) => {
              return (
                <Box
                  key={topic.id}
                  sx={{ overflow: "hidden", border: "1px solid #D9E2EF", borderRadius: 2, bgcolor: "white" }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, borderBottom: topic.lessons.length ? "1px solid #E6EBF2" : 0, bgcolor: "#F4F7FA", px: 2, py: 1.25 }}>
                    <Box sx={{ display: "flex", minWidth: 0, alignItems: "center", gap: 1.25 }}>
                      <Box sx={{ display: "grid", height: 28, width: 28, flexShrink: 0, placeItems: "center", borderRadius: 1.5, bgcolor: "#EAF4FF", color: "#0F6CBD" }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 900 }}>{topicIndex + 1}</Typography>
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ color: "#52606D", fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>Chủ đề {topicIndex + 1}</Typography>
                        <Typography noWrap sx={{ color: "#172033", fontSize: 13, fontWeight: 800 }}>{topic.title}</Typography>
                      </Box>
                    </Box>
                    <Typography sx={{ flexShrink: 0, color: "#637381", fontSize: 11, fontWeight: 700 }}>{topic.lessons.length} bài học</Typography>
                  </Box>

                  <Box>
                    {topic.lessons.map((lesson, lessonIndex) => (
                      <CurriculumLessonRow
                        key={lesson.folder.id}
                        lesson={lesson}
                        index={lessonIndex}
                        selected={targetsEqual(selectedTarget, lesson.folder.target)}
                        onOpenFolder={onOpenFolder}
                        onOpenContent={onOpenContent}
                      />
                    ))}
                  </Box>
                </Box>
              );
            })}
          </Box>
        ) : expanded ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, bgcolor: "#FBFCFE", px: 2.5, py: 1.5, color: "#637381" }}>
            <PlayLesson sx={{ fontSize: 17 }} />
            <Typography sx={{ fontSize: 12 }}>Chặng này chưa có chủ đề.</Typography>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}

function CurriculumLessonRow({
  lesson,
  index,
  selected,
  onOpenFolder,
  onOpenContent,
}: {
  lesson: CurriculumRoadmapStage["topics"][number]["lessons"][number];
  index: number;
  selected: boolean;
  onOpenFolder: (folder: CurriculumFolder) => void;
  onOpenContent: (item: CurriculumContentItem) => void;
}) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0,1fr)", lg: "minmax(220px,.75fr) minmax(0,1.25fr)" }, gap: 1.5, borderTop: index ? "1px solid #EEF2F6" : 0, bgcolor: selected ? "#F5FAFF" : "white", px: 2, py: 1.5 }}>
      <ButtonBase onClick={() => onOpenFolder(lesson.folder)} sx={{ display: "flex", minWidth: 0, alignItems: "center", justifyContent: "flex-start", gap: 1.25, borderRadius: 1.5, textAlign: "left", "&:hover .lesson-title": { color: "#0F6CBD" } }}>
        <Box sx={{ display: "grid", height: 30, width: 30, flexShrink: 0, placeItems: "center", border: "1px solid #D9E2EF", borderRadius: "50%", bgcolor: selected ? "#0F6CBD" : "white", color: selected ? "white" : "#52606D" }}>
          {selected ? <CheckCircleOutline sx={{ fontSize: 17 }} /> : <Typography sx={{ fontSize: 11, fontWeight: 900 }}>{index + 1}</Typography>}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: "#637381", fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>Bài học {index + 1}</Typography>
          <Typography className="lesson-title" noWrap sx={{ mt: 0.25, color: "#172033", fontSize: 13, fontWeight: 800 }}>{lesson.folder.title}</Typography>
        </Box>
      </ButtonBase>

      <Box sx={{ display: "flex", minWidth: 0, flexWrap: "wrap", alignItems: "center", gap: 0.75 }}>
        {lesson.content.length ? lesson.content.map((item) => (
          <LessonContentPill key={item.id} item={item} onOpen={() => onOpenContent(item)} />
        )) : (
          <Typography sx={{ color: "#8A98A8", fontSize: 11, fontStyle: "italic" }}>Chưa có bài giảng, tài liệu hoặc bài tập</Typography>
        )}
      </Box>
    </Box>
  );
}

function LessonContentPill({ item, onOpen }: { item: CurriculumContentItem; onOpen: () => void }) {
  const icon = item.kind === "lecture" ? <Presentation sx={{ fontSize: 15 }} /> : item.kind === "exercise" ? <FileQuestion sx={{ fontSize: 15 }} /> : <FileText sx={{ fontSize: 15 }} />;
  const label = item.questionCount ? `${item.typeLabel} · ${item.questionCount} câu` : item.typeLabel;
  return (
    <Tooltip title={item.title}>
      <ButtonBase onClick={onOpen} sx={{ display: "flex", maxWidth: 260, alignItems: "center", gap: 0.75, border: "1px solid #D9E2EF", borderRadius: 1.5, bgcolor: item.kind === "exercise" ? "#FFF8E8" : item.kind === "lecture" ? "#EEF6FF" : "#F6F7F9", color: item.kind === "exercise" ? "#9A6700" : item.kind === "lecture" ? "#0F6CBD" : "#52606D", px: 1, py: 0.75, textAlign: "left", "&:hover": { borderColor: "#75B6F2" } }}>
        {icon}
        <Box sx={{ minWidth: 0 }}>
          <Typography noWrap sx={{ fontSize: 10, fontWeight: 800 }}>{label}</Typography>
          <Typography noWrap sx={{ color: "#52606D", fontSize: 10 }}>{item.title}</Typography>
        </Box>
      </ButtonBase>
    </Tooltip>
  );
}

function CurriculumActionBar({
  selectedKind,
  selectedLabel,
  canEdit,
  canDelete,
  onOpenSchedule,
  onCommand,
}: {
  selectedKind: "none" | "subject" | "level" | "topic";
  selectedLabel: string;
  canEdit: boolean;
  canDelete: boolean;
  onOpenSchedule: () => void;
  onCommand: (id: ResourceCommandId) => void;
}) {
  const createCommand = selectedKind === "none" ? "create-subject" : selectedKind === "subject" ? "create-level" : selectedKind === "level" ? "create-topic" : "add-lecture";
  const createLabel = selectedKind === "none" ? "Tạo môn học" : selectedKind === "subject" ? "Tạo level" : selectedKind === "level" ? "Tạo chủ đề" : "Thêm bài giảng";

  return (
    <div className="flex min-h-12 shrink-0 items-center justify-between gap-3 border-b border-[#D9E2EF] bg-white px-3 py-1.5">
      <div className="min-w-0">
        <div className="truncate text-[13px] font-bold text-[#172033]">{selectedLabel}</div>
        <div className="text-[11px] text-[#637381]">{selectedKind === "topic" ? "Nội dung học trong chủ đề" : "Sắp xếp cấu trúc theo thứ tự giảng dạy"}</div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          variant="outlined"
          size="small"
          startIcon={<CalendarMonth />}
          disabled={selectedKind === "none"}
          onClick={onOpenSchedule}
          aria-label="Mở phân phối chương trình"
          title={selectedKind === "none" ? "Chọn một môn học trước" : "Thiết lập phân phối chương trình và ngày bắt đầu dạy"}
          sx={{ textTransform: "none" }}
        >
          Phân phối chương trình
        </Button>
        <Button variant="contained" size="small" startIcon={selectedKind === "topic" ? <Presentation /> : <Add />} onClick={() => onCommand(createCommand)} sx={{ boxShadow: "none", textTransform: "none" }}>
          {createLabel}
        </Button>
        {selectedKind === "topic" ? (
          <>
            <Button variant="outlined" size="small" startIcon={<FileText />} onClick={() => onCommand("add-resource")} sx={{ textTransform: "none" }}>Gắn tài liệu</Button>
            <Button variant="outlined" size="small" startIcon={<FileQuestion />} onClick={() => onCommand("add-exercise")} sx={{ textTransform: "none" }}>Thêm bài tập</Button>
          </>
        ) : null}
        <span className="mx-1 h-6 w-px bg-[#D9E2EF]" />
        <Tooltip title="Chỉnh sửa mục đang chọn"><span><IconButton size="small" disabled={!canEdit} onClick={() => onCommand("edit")} aria-label="Chỉnh sửa mục đang chọn"><Pencil fontSize="small" /></IconButton></span></Tooltip>
        <Tooltip title="Xem tác động trước khi xóa"><span><IconButton size="small" color="error" disabled={!canDelete} onClick={() => onCommand("delete")} aria-label="Xem tác động trước khi xóa"><Trash2 fontSize="small" /></IconButton></span></Tooltip>
      </div>
    </div>
  );
}

export function StructureScreen({
  subjects,
  selectedSubject,
  selectedNode,
  selectedPath,
  onSelectSubject,
  onSelectNode,
  onCreateSubject,
  onCreateRoot,
  onCreateTopic,
  onCreateChild,
  onBackToSubjects,
  onEditSelection,
  onDeleteSelection,
  onEditNodeSelection,
  onDeleteNodeSelection,
  localContentItems,
  onEditLocalContent,
  onDeleteLocalContent,
  onRefreshData,
  quizBankItems,
  resources,
  taxonomyTopics,
}: {
  subjects: StudioSubject[];
  selectedSubject?: StudioSubject;
  selectedNode?: StudioNode;
  selectedPath: StudioNode[];
  onSelectSubject: (id: string) => void;
  onSelectNode: (id: string) => void;
  onCreateSubject: () => void;
  onCreateRoot: () => void;
  onCreateTopic: () => void;
  onCreateChild: (option?: "section" | "lecture" | "exercise" | "resource") => void;
  onBackToSubjects: () => void;
  onEditSubject: () => void;
  onDeleteSubject: () => void;
  onEditSelection: () => void;
  onDeleteSelection: () => void;
  onEditNodeSelection: (node: StudioNode) => void;
  onDeleteNodeSelection: (node: StudioNode) => void;
  localContentItems: LocalContentItem[];
  onEditLocalContent: (item: LocalContentItem) => void;
  onDeleteLocalContent: (itemId: string) => void;
  onRefreshData: () => Promise<void>;
  quizBankItems: QuizBankItem[];
  resources: LearningResourceResourceCard[];
  taxonomyTopics: LearningResourceTaxonomyOption[];
}) {
  const [treeQuery, setTreeQuery] = useState("");
  const [teachingPlanOpen, setTeachingPlanOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<AttachedResourceItem | null>(null);
  const [attachedResources, setAttachedResources] = useState<Record<string, AttachedResourceItem>>({});
  const [selection, setSelection] = useState<StructureSelection>(null);
  const paceStateUpdate = usePacedStateBatch();

  const currentChildren = useMemo(() => selectedNode?.children ?? selectedSubject?.tree ?? [], [selectedNode?.children, selectedSubject?.tree]);
  const selectedNodeOptionId = selectedNode?.optionId;

  const currentResources = useMemo(() => {
    if (!selectedSubject) return [];
    if (!selectedNode) {
      return resources.filter((resource) => resource.subjectId === selectedSubject.id && !resource.categoryId && !resource.sectionId);
    }
    return resources.filter((resource) => {
      if (resource.subjectId !== selectedSubject.id) return false;
      if (selectedNode.kind === "lesson" || selectedNode.kind === "section" || selectedNode.kind === "topic") {
        return (
          resource.sectionId === selectedNode.optionId ||
          resource.sectionId === selectedNode.location.sectionId ||
          resource.topicId === selectedNode.location.topicId
        );
      }
      if (selectedNode.kind === "group") {
        return resource.categoryId === selectedNode.optionId && !resource.sectionId;
      }
      return false;
    });
  }, [resources, selectedNode, selectedSubject]);

  const currentAttachedResources = useMemo(
    () => currentResources.map((resource) => attachedResources[resource.id] ?? resource),
    [attachedResources, currentResources],
  );
  const allAttachedResources = useMemo(
    () => resources.map((resource) => attachedResources[resource.id] ?? resource),
    [attachedResources, resources],
  );
  const currentLocalContentItems = useMemo(
    () => (selectedNodeOptionId ? localContentItems.filter((item) => item.parentOptionId === selectedNodeOptionId) : []),
    [localContentItems, selectedNodeOptionId],
  );

  const handleGoBack = useCallback(() => {
    if (!selectedNode) return;
    if (selectedPath.length > 1) {
      const parentNode = selectedPath[selectedPath.length - 2];
      onSelectNode(parentNode.id);
    } else {
      onSelectNode("");
    }
    setSelection(null);
  }, [selectedNode, selectedPath, onSelectNode]);

  const selectedChildRow = useMemo(
    () => (selection?.type === "node" ? currentChildren.find((child) => child.id === selection.id) : undefined),
    [currentChildren, selection],
  );
  const selectedLocalContent = useMemo(
    () => (selection?.type === "local-content" ? currentLocalContentItems.find((item) => item.id === selection.id) : undefined),
    [currentLocalContentItems, selection],
  );
  const selectedAttachedResource = useMemo(
    () => (selection?.type === "resource" ? currentAttachedResources.find((item) => item.id === selection.id) : undefined),
    [currentAttachedResources, selection],
  );
  const canEditSelection = Boolean(selectedChildRow || selectedLocalContent || selectedAttachedResource || selectedNode || selectedSubject);
  const canDeleteSelection = canEditSelection;

  useEffect(() => {
    if (!selection) return;
    if (selection.type === "node" && currentChildren.some((child) => child.id === selection.id)) return;
    if (selection.type === "local-content" && selectedLocalContent) return;
    if (selection.type === "resource" && selectedAttachedResource) return;
    paceStateUpdate(() => setSelection(null));
  }, [currentChildren, paceStateUpdate, selectedAttachedResource, selectedLocalContent, selection]);

  useEffect(() => {
    let cancelled = false;
    const missingDetails = currentResources.filter((resource) => !attachedResources[resource.id]);
    if (!missingDetails.length) return;

    void Promise.all(
      missingDetails.map(async (resource) => {
        try {
          const detail = await loadLearningResourceResourceDetail(resource.id);
          const asset = detail.assets[0];
          return [
            resource.id,
            {
              ...resource,
              detail,
              asset,
              linkUrl: asset?.storageUrl || asset?.upstreamUrl,
            } satisfies AttachedResourceItem,
          ] as const;
        } catch {
          return [resource.id, { ...resource, linkUrl: undefined } satisfies AttachedResourceItem] as const;
        }
      }),
    ).then((entries) => {
      if (cancelled) return;
      setAttachedResources((current) => ({
        ...current,
        ...Object.fromEntries(entries),
      }));
    });

    return () => {
      cancelled = true;
    };
  }, [attachedResources, currentResources]);


  const handleDeleteResource = useCallback(async (resource: AttachedResourceItem) => {
    await deleteLearningResourceResource(resource.id);
    setAttachedResources((current) => {
      const next = { ...current };
      delete next[resource.id];
      return next;
    });
    await onRefreshData();
  }, [onRefreshData]);

  const handleOpenResourceLink = useCallback((resource: AttachedResourceItem) => {
    const nextUrl = getDisplayLink(resource);
    if (!nextUrl || typeof window === "undefined") return;
    window.open(nextUrl, "_blank", "noopener,noreferrer");
  }, []);

  const handleEditSelection = useCallback(() => {
    if (selectedAttachedResource) {
      setEditingResource(selectedAttachedResource);
      return;
    }
    if (selectedLocalContent) {
      onEditLocalContent(selectedLocalContent);
      return;
    }
    if (selectedChildRow) {
      onEditNodeSelection(selectedChildRow);
      return;
    }
    onEditSelection();
  }, [onEditLocalContent, onEditNodeSelection, onEditSelection, selectedAttachedResource, selectedChildRow, selectedLocalContent]);

  const handleDeleteSelection = useCallback(async () => {
    if (selectedAttachedResource) {
      await handleDeleteResource(selectedAttachedResource);
      setSelection(null);
      return;
    }
    if (selectedLocalContent) {
      onDeleteLocalContent(selectedLocalContent.id);
      setSelection(null);
      return;
    }
    if (selectedChildRow) {
      onDeleteNodeSelection(selectedChildRow);
      return;
    }
    onDeleteSelection();
  }, [handleDeleteResource, onDeleteLocalContent, onDeleteNodeSelection, onDeleteSelection, selectedAttachedResource, selectedChildRow, selectedLocalContent]);

  const selectedExplorerUrl = buildExplorerPathUrl(selectedSubject, selectedPath);
  const breadcrumbItems = useMemo(() => {
    const items: { label: string; onClick: () => void }[] = [];
    if (selectedSubject) {
      items.push({
        label: selectedSubject.label,
        onClick: () => {
          onSelectSubject(selectedSubject.id);
          setSelection(null);
        },
      });
    }
    selectedPath.forEach((node) => {
      items.push({
        label: node.label,
        onClick: () => {
          onSelectNode(node.id);
          setSelection(null);
        },
      });
    });
    return items;
  }, [selectedSubject, selectedPath, onSelectSubject, onSelectNode]);
  const explorerBreadcrumbItems = useMemo(
    () => breadcrumbItems.length
      ? breadcrumbItems
      : [{
          label: COURSE_STRUCTURE_WORKSPACE_LABEL,
          onClick: () => {
            onSelectSubject("");
            onSelectNode("");
            setSelection(null);
          },
        }],
    [breadcrumbItems, onSelectNode, onSelectSubject],
  );

  const curriculumModel = useMemo(
    () =>
      buildCurriculumExplorerModel({
        subjects,
        selectedSubject,
        selectedNode,
        selectedPath,
        localContentItems,
        resources: allAttachedResources,
        quizBankItems,
      }),
    [allAttachedResources, localContentItems, quizBankItems, selectedNode, selectedPath, selectedSubject, subjects],
  );
  const roadmapStages = useMemo(
    () => selectedSubject && curriculumModel.selectedKind !== "topic"
      ? buildCurriculumRoadmapStages({
          subject: selectedSubject,
          levelNode: curriculumModel.selectedKind === "level" ? selectedNode : undefined,
          localContentItems,
          resources: allAttachedResources,
          taxonomyTopics,
          quizBankItems,
        })
      : [],
    [allAttachedResources, curriculumModel.selectedKind, localContentItems, quizBankItems, selectedNode, selectedSubject, taxonomyTopics],
  );
  const contentItems = useMemo(() => flattenContentGroups(curriculumModel.contentGroups), [curriculumModel.contentGroups]);
  const selectedTarget = useMemo<CurriculumTarget | null>(() => {
    if (selection?.type === "node") return { type: "node", id: selection.id };
    if (selection?.type === "local-content") return { type: "local-content", id: selection.id };
    if (selection?.type === "resource") return { type: "resource", id: selection.id };
    if (selectedNode) return { type: "node", id: selectedNode.id };
    if (selectedSubject) return { type: "subject", id: selectedSubject.id };
    return null;
  }, [selectedNode, selectedSubject, selection]);
  const handleSelectFolder = useCallback((folder: CurriculumFolder) => {
    if (folder.target.type === "node") {
      setSelection({ type: "node", id: folder.target.id });
      return;
    }
    if (folder.target.type === "subject") {
      onSelectSubject(folder.target.id);
      setSelection(null);
    }
  }, [onSelectSubject]);

  const handleOpenFolder = useCallback((folder: CurriculumFolder) => {
    setSelection(null);
    if (folder.target.type === "subject") {
      onSelectSubject(folder.target.id);
      return;
    }
    if (folder.target.type === "node") {
      onSelectNode(folder.target.id);
    }
  }, [onSelectNode, onSelectSubject]);

  const handleSelectContent = useCallback((item: CurriculumContentItem) => {
    if (item.target.type === "local-content") {
      setSelection({ type: "local-content", id: item.target.id });
      return;
    }
    if (item.target.type === "resource") {
      setSelection({ type: "resource", id: item.target.id });
    }
  }, []);

  const handleOpenContent = useCallback((item: CurriculumContentItem) => {
    handleSelectContent(item);
    if (item.target.type === "resource") {
      const resource = allAttachedResources.find((entry) => entry.id === item.target.id);
      if (resource) handleOpenResourceLink(resource);
      return;
    }
    if (item.target.type === "local-content") {
      const localItem = localContentItems.find((entry) => entry.id === item.target.id);
      const link = localItem ? getDisplayLink(localItem) : item.href;
      if (link && typeof window !== "undefined") {
        window.open(link, "_blank", "noopener,noreferrer");
      }
    }
  }, [allAttachedResources, handleOpenResourceLink, handleSelectContent, localContentItems]);

  const handleResourceCommand = useCallback((id: ResourceCommandId) => {
    if (id === "create-subject") {
      onCreateSubject();
      return;
    }
    if (id === "create-level") {
      onCreateRoot();
      return;
    }
    if (id === "create-topic") {
      onCreateTopic();
      return;
    }
    if (id === "add-lecture") {
      onCreateChild("lecture");
      return;
    }
    if (id === "add-resource") {
      onCreateChild("resource");
      return;
    }
    if (id === "add-exercise") {
      onCreateChild("exercise");
      return;
    }
    if (id === "edit") {
      handleEditSelection();
      return;
    }
    if (id === "delete") {
      void handleDeleteSelection();
    }
  }, [
    handleDeleteSelection,
    handleEditSelection,
    onCreateChild,
    onCreateRoot,
    onCreateSubject,
    onCreateTopic,
  ]);

  const visibleItemCount = curriculumModel.selectedKind === "topic"
    ? contentItems.length
    : roadmapStages.reduce(
        (total, stage) => total + 1 + stage.topics.length + stage.topics.reduce((count, topic) => count + topic.lessons.length, 0),
        0,
      );
  const selectedLabel = selectedNode?.label ?? selectedSubject?.label ?? COURSE_STRUCTURE_WORKSPACE_LABEL;

  return (
    <LearningResourceExplorerShell className="border-[rgba(145,158,171,0.2)] shadow-none">
      <LearningResourceExplorerTopBar
        breadcrumbItems={explorerBreadcrumbItems}
        canGoBack={Boolean(selectedNode)}
        onBack={handleGoBack}
        onRefresh={() => void onRefreshData()}
        searchLabel="Tìm trong cấu trúc môn học"
        searchPlaceholder={curriculumModel.searchPlaceholder}
        searchValue={treeQuery}
        title={selectedExplorerUrl || COURSE_STRUCTURE_WORKSPACE_LABEL}
        onSearchChange={setTreeQuery}
      />
      <CurriculumActionBar
        selectedKind={curriculumModel.selectedKind}
        selectedLabel={selectedLabel}
        canEdit={canEditSelection}
        canDelete={canDeleteSelection}
        onOpenSchedule={() => setTeachingPlanOpen(true)}
        onCommand={handleResourceCommand}
      />

      <div className="grid h-[calc(100vh-220px)] min-h-[560px] min-w-0 grid-cols-1 overflow-hidden lg:grid-cols-[260px_minmax(0,1fr)]">
        <SubjectRail
          subjects={subjects}
          selectedSubjectId={selectedSubject?.id}
          query={treeQuery}
          onSelectSubject={(subjectId) => {
            onSelectSubject(subjectId);
            onSelectNode("");
            setSelection(null);
          }}
          onBackToSubjects={onBackToSubjects}
        />

        <section
          className="min-h-0 min-w-0 overflow-hidden bg-white"
          onClick={(event) => {
            if (event.currentTarget !== event.target) return;
            onSelectSubject("");
            onSelectNode("");
            setSelection(null);
          }}
        >
          {curriculumModel.selectedKind === "none" ? (
            <div className="flex h-full items-center justify-center bg-[#F8FAFC] px-8 text-center">
              <div className="max-w-sm">
                <span className="mx-auto grid h-11 w-11 place-items-center rounded-lg bg-[#EAF4FF] text-[#0F6CBD]"><AutoStories className="h-5 w-5" /></span>
                <h3 className="mt-3 text-sm font-bold text-[#172033]">Chọn một môn học</h3>
                <p className="mt-1 text-[13px] leading-5 text-[#637381]">Chọn môn ở danh sách bên trái để xem và chỉnh sửa level, chủ đề và nội dung học.</p>
              </div>
            </div>
          ) : curriculumModel.selectedKind === "topic" ? (
            <EnterpriseList
              folders={[]}
              items={contentItems}
              selectedTarget={selectedTarget}
              onOpenContent={handleOpenContent}
              onOpenFolder={handleOpenFolder}
              onSelectContent={handleSelectContent}
              onSelectFolder={handleSelectFolder}
            />
          ) : (
            <CurriculumRoadmap
              stages={roadmapStages}
              subjectTitle={selectedSubject?.label ?? selectedLabel}
              query={treeQuery}
              selectedTarget={selectedTarget}
              onOpenFolder={handleOpenFolder}
              onOpenContent={handleOpenContent}
            />
          )}
        </section>
      </div>

      <ResourceEditDialog
        target={editingResource}
        onClose={() => setEditingResource(null)}
        onSaved={async () => {
          setEditingResource(null);
          await onRefreshData();
        }}
      />
      <CurriculumTeachingPlanDialog
        open={teachingPlanOpen}
        onClose={() => setTeachingPlanOpen(false)}
        subject={selectedSubject}
        stages={roadmapStages}
      />
      <div className="flex h-7 items-center justify-between border-t border-[rgba(145,158,171,0.2)] bg-white px-3 text-[12px] text-[#637381]">
        <span>{visibleItemCount} mục hiển thị</span>
        <span className="max-w-[60%] truncate" title={selectedExplorerUrl || COURSE_STRUCTURE_WORKSPACE_LABEL}>{selectedExplorerUrl || COURSE_STRUCTURE_WORKSPACE_LABEL}</span>
      </div>
    </LearningResourceExplorerShell>
  );
}
