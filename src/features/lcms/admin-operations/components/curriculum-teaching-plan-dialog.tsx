import { useEffect, useMemo, useState } from "react";
import ArrowDownward from "@mui/icons-material/ArrowDownward";
import ArrowUpward from "@mui/icons-material/ArrowUpward";
import CalendarMonth from "@mui/icons-material/CalendarMonth";
import ContentPaste from "@mui/icons-material/ContentPaste";
import CreateNewFolder from "@mui/icons-material/CreateNewFolder";
import Delete from "@mui/icons-material/Delete";
import FormatListNumbered from "@mui/icons-material/FormatListNumbered";
import PlaylistAdd from "@mui/icons-material/PlaylistAdd";
import Sync from "@mui/icons-material/Sync";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Select from "@mui/material/Select";
import Skeleton from "@mui/material/Skeleton";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { toast } from "sonner";

import { useCurriculumProgramQuery, useSaveCurriculumProgramMutation } from "@/features/lcms/admin-operations/api/curriculum-program-query";
import type { CurriculumProgramRow } from "@/features/lcms/admin-operations/api/curriculum-program-api";
import { buildEditableCurriculumProgramRows } from "@/features/lcms/admin-operations/utils/curriculum-schedule-model";
import type { CurriculumRoadmapStage } from "@/features/lcms/admin-operations/utils/learning-resource-curriculum-view-model";
import type { StudioSubject } from "@/features/lcms/admin-operations/types/learning-resource-authoring";
import { CurriculumExcelImportDialog } from "@/features/lcms/admin-operations/components/curriculum-excel-import-dialog";
import type { ParsedCurriculumItem } from "@/features/lcms/admin-operations/utils/curriculum-import-parser";
import { planCurriculumSync } from "@/features/lcms/admin-operations/utils/curriculum-structure-sync";
import {
  createLearningResourceTaxonomy,
  deleteLearningResourceTaxonomy,
  updateLearningResourceTaxonomy,
} from "@/features/lcms/admin-operations/api/learning-resource-authoring-taxonomy-command-api";
import { createLearningResourceResource } from "@/features/lcms/admin-operations/api/learning-resource-authoring-resource-command-api";

type EditableCurriculumRow = CurriculumProgramRow & {
  isNew?: boolean;
};

export function CurriculumTeachingPlanDialog({
  open,
  onClose,
  subject,
  stages,
  onRefreshStructure,
}: {
  open: boolean;
  onClose: () => void;
  subject?: StudioSubject;
  stages: CurriculumRoadmapStage[];
  onRefreshStructure?: () => Promise<void>;
}) {
  const [selectedStageTargetId, setSelectedStageTargetId] = useState("");
  const [academicYear, setAcademicYear] = useState("2026-2027");

  useEffect(() => {
    if (!selectedStageTargetId && stages[0]) {
      setSelectedStageTargetId(stages[0].level.target.id);
    }
  }, [selectedStageTargetId, stages]);

  const selectedStage = stages.find((candidate) => candidate.level.target.id === selectedStageTargetId) || stages[0];

  const canonicalLevelId = useMemo(() => {
    if (!selectedStage) return "";
    const rawId = selectedStage.level.target.id;
    const node = subject?.tree.find((n) => n.id === rawId || n.optionId === rawId);
    if (node?.optionId) return node.optionId;
    return rawId.replace(/^(category|level)-/, "");
  }, [selectedStage, subject]);

  const programScope = { subjectId: subject?.id, levelId: canonicalLevelId, academicYear };
  const programQuery = useCurriculumProgramQuery(programScope);
  const saveProgramMutation = useSaveCurriculumProgramMutation(programScope);
  const [rows, setRows] = useState<EditableCurriculumRow[]>([]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState("");
  const [syncConfirmOpen, setSyncConfirmOpen] = useState(false);
  const [syncMode, setSyncMode] = useState<"append" | "overwrite">("append");

  useEffect(() => {
    if (programQuery.data) {
      setRows(programQuery.data.rows);
    } else if (selectedStage) {
      setRows(buildEditableCurriculumProgramRows(selectedStage));
    } else {
      setRows([]);
    }
  }, [canonicalLevelId, programQuery.data, selectedStage]);

  const topicGroups = useMemo(() => buildTopicGroups(rows), [rows]);
  const uniqueTopics = useMemo(() => topicGroups.map((g) => g.topic), [topicGroups]);
  const [selectedTopic, setSelectedTopic] = useState<string>("");

  useEffect(() => {
    if (!selectedTopic && uniqueTopics.length > 0) {
      setSelectedTopic(uniqueTopics[uniqueTopics.length - 1]);
    } else if (selectedTopic && !uniqueTopics.includes(selectedTopic) && uniqueTopics.length > 0) {
      setSelectedTopic(uniqueTopics[uniqueTopics.length - 1]);
    }
  }, [uniqueTopics, selectedTopic]);

  const totalSessions = useMemo(() => rows.reduce((sum, r) => sum + (Number(r.sessions) || 0), 0), [rows]);
  const canSave = Boolean(subject?.id && canonicalLevelId && academicYear && rows.length);

  const savedRows = programQuery.data?.rows;
  const isDirty = useMemo(() => {
    if (rows.some((r) => r.isNew)) return true;
    if (!savedRows) return rows.length > 0;
    if (rows.length !== savedRows.length) return true;
    return rows.some((row, i) => {
      const sr = savedRows[i];
      if (!sr) return true;
      return (
        row.topic.trim() !== sr.topic.trim() ||
        row.title.trim() !== sr.title.trim() ||
        Number(row.period) !== Number(sr.period) ||
        Number(row.sessions) !== Number(sr.sessions)
      );
    });
  }, [rows, savedRows]);

  const existingTopics = useMemo(() => {
    return (selectedStage?.topics || []).map((t) => ({
      id: cleanTaxonomyId(t.id),
      rawId: t.id,
      title: t.title,
      lessons: t.lessons.map((l) => ({ id: cleanTaxonomyId(l.folder.id), title: l.folder.title })),
    }));
  }, [selectedStage]);

  const syncPlan = useMemo(() => {
    return planCurriculumSync(rows, existingTopics);
  }, [rows, existingTopics]);

  const hasStructureDiff = useMemo(() => {
    return syncPlan.topicsToCreate.length > 0 || syncPlan.lessonsToCreate.length > 0;
  }, [syncPlan]);

  const canSaveProgram = canSave && isDirty;
  const canSyncStructure = canSave && (isDirty || hasStructureDiff);

  function updateRow(index: number, patch: Partial<EditableCurriculumRow>) {
    setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  }

  function updateTopicGroup(index: number, topic: string) {
    const group = topicGroups.find((candidate) => index >= candidate.start && index < candidate.end);
    if (!group) return updateRow(index, { topic });
    const oldTopic = group.topic;
    if (selectedTopic === oldTopic) {
      setSelectedTopic(topic);
    }
    setRows((current) => current.map((row, rowIndex) => (rowIndex >= group.start && rowIndex < group.end ? { ...row, topic } : row)));
  }

  function addNewTopic(customTopicName?: string, customFirstLesson?: string) {
    const nextIndex = topicGroups.length + 1;
    const topic = customTopicName || `Chủ đề ${nextIndex}: Tên chủ đề mới`;
    const title = customFirstLesson || "Bài 1: Tên bài học";
    setRows((current) => [
      ...current,
      {
        topic,
        period: current.length + 1,
        title,
        sessions: 1,
        isNew: true,
      },
    ]);
    setSelectedTopic(topic);
    toast.success(`Đã thêm "${topic}"`);
  }

  function addRowToTopic(
    topicName: string,
    insertIndex: number,
    type: "lesson" | "review" | "practice",
  ) {
    setRows((current) => {
      const next = [...current];
      let title = "Bài học mới";

      if (type === "review") {
        const allReviews = current.filter((r) => r.title.toLowerCase().includes("ôn tập"));
        title = `Ôn tập ${allReviews.length + 1}`;
      } else if (type === "practice") {
        const allPractice = current.filter((r) => r.title.toLowerCase().includes("luyện thi"));
        title = `Luyện thi ${allPractice.length + 1}`;
      } else {
        const topicLessons = current.filter(
          (r) =>
            r.topic === topicName &&
            !r.title.toLowerCase().includes("ôn tập") &&
            !r.title.toLowerCase().includes("luyện thi"),
        );
        title = `Bài ${topicLessons.length + 1}: Tên bài học`;
      }

      const newRow: EditableCurriculumRow = {
        topic: topicName,
        period: insertIndex + 1,
        title,
        sessions: 1,
        isNew: true,
      };

      next.splice(insertIndex, 0, newRow);
      return next.map((r, idx) => ({ ...r, period: idx + 1 }));
    });

    const typeLabel =
      type === "review"
        ? "tiết ôn tập"
        : type === "practice"
          ? "tiết luyện thi"
          : "bài học";
    toast.success(`Đã thêm ${typeLabel} vào "${topicName}"`);
  }

  function addRowToSelectedTopic(type: "lesson" | "review" | "practice") {
    const targetTopic = selectedTopic || uniqueTopics[uniqueTopics.length - 1];
    if (!targetTopic) {
      addNewTopic();
      return;
    }

    const group = topicGroups.find((g) => g.topic === targetTopic);
    const insertIndex = group ? group.end : rows.length;
    addRowToTopic(targetTopic, insertIndex, type);
  }

  function removeTopicGroup(topicName: string, count: number) {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa toàn bộ chủ đề "${topicName}" (${count} tiết học)?`,
      )
    ) {
      return;
    }
    setRows((current) =>
      current
        .filter((r) => r.topic !== topicName)
        .map((r, i) => ({ ...r, period: i + 1 })),
    );
    toast.success(`Đã xóa chủ đề "${topicName}". Các tiết đã được đánh số lại.`);
  }

  function addRow(defaultTitle = "Bài học mới", defaultTopic?: string) {
    setRows((current) => {
      const lastRow = current[current.length - 1];
      const targetTopic = defaultTopic || lastRow?.topic || "Chủ đề mới";
      return [
        ...current,
        {
          topic: targetTopic,
          period: current.length + 1,
          title: defaultTitle,
          sessions: 1,
          isNew: true,
        },
      ];
    });
  }

  function _addReviewPeriod() {
    const reviewRows = rows.filter((r) => r.title.toLowerCase().includes("ôn tập"));
    const reviewNumber = reviewRows.length + 1;
    const lastRow = rows[rows.length - 1];
    addRow(`Ôn tập ${reviewNumber}`, lastRow?.topic || "Ôn tập");
  }

  function _addPracticePeriod() {
    addNewTopic("Tăng cường / Luyện thi", "Luyện thi 1");
  }
  void _addReviewPeriod;
  void _addPracticePeriod;

  function renumberPeriods() {
    setRows((current) =>
      current.map((row, index) => ({
        ...row,
        period: index + 1,
      })),
    );
    toast.success("Đã tự động đánh số lại các tiết từ 1 đến " + rows.length);
  }

  function moveRow(index: number, direction: "up" | "down") {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === rows.length - 1) return;

    setRows((current) => {
      const next = [...current];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next.map((r, i) => ({ ...r, period: i + 1 }));
    });
  }

  function removeRow(index: number) {
    setRows((current) =>
      current
        .filter((_, rowIndex) => rowIndex !== index)
        .map((row, rowIndex) => ({ ...row, period: rowIndex + 1 })),
    );
  }

  function handleApplyImportedRows(importedRows: ParsedCurriculumItem[]) {
    const converted: EditableCurriculumRow[] = importedRows.map((r, idx) => ({
      topic: r.topic,
      period: r.period || idx + 1,
      title: r.title,
      sessions: r.sessions || 1,
      isNew: true,
    }));
    setRows(converted);
    toast.success(`Đã áp dụng ${converted.length} dòng từ Excel vào khung chương trình.`);
  }

  async function save() {
    if (!canSaveProgram || !canonicalLevelId || isSaving || isSyncing) return;
    try {
      setIsSaving(true);
      await saveProgramMutation.mutateAsync({
        name: `Khung chương trình ${subject?.label ?? "môn học"} · ${selectedStage?.level.title ?? "Level"}`,
        status: "published",
        expectedVersion: programQuery.data?.recordVersion,
        rows: rows.map(({ isNew: _ignored, ...r }) => r),
      });
      setRows((current) => current.map((r) => ({ ...r, isNew: false })));
      await programQuery.refetch();
      toast.success("Đã lưu khung chương trình môn học thành công!");
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể lưu khung chương trình.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleSyncClick() {
    if (!canSyncStructure || !subject?.id || !canonicalLevelId || isSaving || isSyncing) return;
    if (existingTopics.length > 0) {
      setSyncMode("append");
      setSyncConfirmOpen(true);
    } else {
      void executeSync("append");
    }
  }

  async function executeSync(mode: "append" | "overwrite") {
    if (!subject?.id || !canonicalLevelId) return;

    try {
      setIsSyncing(true);
      setSyncStatusText("Đang lưu khung chương trình…");
      await saveProgramMutation.mutateAsync({
        name: `Khung chương trình ${subject.label ?? "môn học"} · ${selectedStage?.level.title ?? "Level"}`,
        status: "published",
        expectedVersion: programQuery.data?.recordVersion,
        rows: rows.map(({ isNew: _ignored, ...r }) => r),
      });
      setRows((current) => current.map((r) => ({ ...r, isNew: false })));

      const createdTopicMap = new Map<string, string>();

      if (mode === "overwrite") {
        for (let i = 0; i < existingTopics.length; i++) {
          const et = existingTopics[i];
          const cleanId = cleanTaxonomyId(et.id);
          setSyncStatusText(`Đang xóa cấu trúc cũ (${i + 1}/${existingTopics.length}): ${et.title}…`);
          try {
            await deleteLearningResourceTaxonomy("topics", cleanId);
          } catch {
            // Ignore if already deleted
          }
        }

        const uniqueTopicLabels: string[] = [];
        rows.forEach((r) => {
          const trimmed = r.topic.trim();
          if (trimmed && !uniqueTopicLabels.includes(trimmed)) {
            uniqueTopicLabels.push(trimmed);
          }
        });

        for (let i = 0; i < uniqueTopicLabels.length; i++) {
          const topicLabel = uniqueTopicLabels[i];
          setSyncStatusText(`Đang tạo chủ đề (${i + 1}/${uniqueTopicLabels.length}): ${topicLabel}…`);
          try {
            const created = await createLearningResourceTaxonomy("topics", {
              code: generateTopicCode(topicLabel),
              label: topicLabel,
              subjectId: subject.id,
              categoryId: canonicalLevelId,
              status: "active",
              sortOrder: i + 1,
              metadata: { taxonomyRole: "topic" },
            });
            if (created?.id) {
              createdTopicMap.set(topicLabel.toLowerCase(), cleanTaxonomyId(created.id));
            }
          } catch {
            // continue
          }
        }

        for (let i = 0; i < rows.length; i += 5) {
          const chunk = rows.slice(i, i + 5);
          setSyncStatusText(`Đang tạo bài học (${Math.min(i + 5, rows.length)}/${rows.length})…`);
          await Promise.all(
            chunk.map(async (row) => {
              const targetTopicId = createdTopicMap.get(row.topic.trim().toLowerCase());
              if (!targetTopicId) return;
              try {
                await createLearningResourceResource({
                  title: row.title,
                  subjectId: subject.id,
                  programSlug: subject.id,
                  categoryId: canonicalLevelId,
                  topicId: cleanTaxonomyId(targetTopicId),
                  selectedFileType: "PDF",
                  status: "published",
                  items: [{ sortOrder: row.period, unitTitle: row.title }],
                });
              } catch {
                // Ignore single creation error
              }
            }),
          );
        }
      } else {
        // Mode === "append"
        setSyncStatusText("Đang đối soát cấu trúc môn học…");
        const plan = planCurriculumSync(rows, existingTopics);

        if (!plan.topicsToCreate.length && !plan.lessonsToCreate.length) {
          toast.success("Đã lưu khung chương trình. Cấu trúc môn học đã khớp đầy đủ!");
          await programQuery.refetch();
          setIsSyncing(false);
          setSyncStatusText("");
          setTimeout(() => onClose(), 500);
          return;
        }

        for (let k = 0; k < existingTopics.length; k++) {
          const et = existingTopics[k];
          const cleanId = cleanTaxonomyId(et.id);
          createdTopicMap.set(et.title.trim().toLowerCase(), cleanId);
          try {
            await updateLearningResourceTaxonomy("topics", cleanId, { sortOrder: k + 1 });
          } catch {
            // continue
          }
        }

        for (let i = 0; i < plan.topicsToCreate.length; i++) {
          const topicLabel = plan.topicsToCreate[i];
          setSyncStatusText(`Đang tạo chủ đề (${i + 1}/${plan.topicsToCreate.length}): ${topicLabel}…`);
          try {
            const createdTopic = await createLearningResourceTaxonomy("topics", {
              code: generateTopicCode(topicLabel),
              label: topicLabel,
              subjectId: subject.id,
              categoryId: canonicalLevelId,
              status: "active",
              sortOrder: existingTopics.length + i + 1,
              metadata: { taxonomyRole: "topic" },
            });
            if (createdTopic?.id) {
              createdTopicMap.set(topicLabel.trim().toLowerCase(), cleanTaxonomyId(createdTopic.id));
            }
          } catch {
            // continue
          }
        }

        for (let j = 0; j < plan.lessonsToCreate.length; j += 5) {
          const chunk = plan.lessonsToCreate.slice(j, j + 5);
          setSyncStatusText(`Đang tạo bài học (${Math.min(j + 5, plan.lessonsToCreate.length)}/${plan.lessonsToCreate.length})…`);
          await Promise.all(
            chunk.map(async (lessonItem) => {
              const targetTopicId = createdTopicMap.get(lessonItem.topic.trim().toLowerCase());
              if (!targetTopicId) return;
              const matchingRow = rows.find(
                (r) =>
                  r.topic.trim().toLowerCase() === lessonItem.topic.trim().toLowerCase() &&
                  r.title.trim().toLowerCase() === lessonItem.title.trim().toLowerCase(),
              );
              try {
                await createLearningResourceResource({
                  title: lessonItem.title,
                  subjectId: subject.id,
                  programSlug: subject.id,
                  categoryId: canonicalLevelId,
                  topicId: cleanTaxonomyId(targetTopicId),
                  selectedFileType: "PDF",
                  status: "published",
                  items: [{ sortOrder: matchingRow?.period || 1, unitTitle: lessonItem.title }],
                });
              } catch {
                // Ignore single creation error
              }
            }),
          );
        }
      }

      setSyncStatusText("Đang cập nhật bản đồ cấu trúc môn học…");
      if (onRefreshStructure) {
        await onRefreshStructure();
      }
      await programQuery.refetch();

      toast.success(
        mode === "overwrite"
          ? "Đã làm mới cấu trúc theo khung chương trình thành công!"
          : "Đã đồng bộ thành công sang Cấu trúc môn học!",
      );
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Có lỗi khi đồng bộ cấu trúc.");
    } finally {
      setIsSyncing(false);
      setSyncStatusText("");
    }
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
        <DialogTitle sx={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1.5 }}>
          {(isSaving || isSyncing) ? (
            <LinearProgress sx={{ height: 3, position: "absolute", top: 0, left: 0, right: 0 }} />
          ) : null}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CalendarMonth color="primary" />
            <Typography variant="h6" sx={{ fontSize: 18, fontWeight: 700 }}>
              Khung chương trình môn học · {subject?.label ?? "Chưa chọn môn"}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              color="primary"
              startIcon={<ContentPaste fontSize="small" />}
              onClick={() => setImportDialogOpen(true)}
              disabled={isSaving || isSyncing}
              sx={{ textTransform: "none", fontWeight: 600, borderRadius: 1.5 }}
            >
              Nhập nhanh từ Excel
            </Button>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ display: "grid", gap: 2 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.2fr 1fr 1.5fr" }, gap: 1.5, alignItems: "center" }}>
            <FormControl size="small">
              <InputLabel>Level (Chặng học)</InputLabel>
              <Select label="Level (Chặng học)" value={selectedStageTargetId} onChange={(event) => setSelectedStageTargetId(event.target.value)}>
                {stages.map((stage) => (
                  <MenuItem key={stage.level.target.id} value={stage.level.target.id}>
                    {stage.level.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField size="small" label="Năm học" value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} />
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 1.5,
                px: 2,
                py: 1,
                borderRadius: 1.5,
                bgcolor: "#F4F7FB",
                border: "1px solid #D9E2EF",
              }}
            >
              {rows.some((r) => r.isNew) ? (
                <Chip
                  size="small"
                  label={`${rows.filter((r) => r.isNew).length} tiết mới chưa lưu`}
                  sx={{
                    height: 22,
                    fontSize: 11,
                    fontWeight: 700,
                    bgcolor: "#FEF2F2",
                    color: "#B91C1C",
                    border: "1px solid #FECACA",
                  }}
                />
              ) : null}
              <Typography sx={{ fontSize: 13, color: "#52606D" }}>
                Số bài: <strong style={{ color: "#172033" }}>{rows.length}</strong> bài
              </Typography>
              <Box sx={{ width: 1, height: 16, bgcolor: "#D9E2EF" }} />
              <Typography sx={{ fontSize: 13, color: "#52606D" }}>
                Tổng thời lượng: <strong style={{ color: "#0F6CBD" }}>{totalSessions} tiết</strong>
              </Typography>
            </Box>
          </Box>

          {programQuery.isLoading ? <Skeleton height={180} variant="rounded" /> : null}
          {!programQuery.isLoading && canonicalLevelId && !programQuery.data ? (
            <Alert severity="info" sx={{ fontSize: 13, py: 0.5 }}>
              Level này chưa có khung chương trình riêng. Bạn có thể bấm <strong>&quot;Nhập nhanh từ Excel&quot;</strong> để dán toàn bộ khung chương trình hoặc nhập trực tiếp bên dưới.
            </Alert>
          ) : null}

          {/* Table Container */}
          <Box sx={{ border: "1px solid", borderColor: "#D9E2EF", borderRadius: 2, overflow: "auto", maxHeight: 460, bgcolor: "white" }}>
            <Box
              component="table"
              sx={{
                width: "100%",
                minWidth: 860,
                borderCollapse: "collapse",
                color: "#1C252E",
                "th,td": { border: "1px solid #D9E2EF", px: 0.75, py: 0.5, textAlign: "left", fontSize: 12 },
                thead: { position: "sticky", top: 0, zIndex: 2 },
                "thead tr:first-of-type th": {
                  bgcolor: "#FFFFFF",
                  color: "#1C252E",
                  fontSize: 15,
                  fontWeight: 800,
                  lineHeight: "22px",
                  py: 0.75,
                  textAlign: "center",
                },
                "thead tr:nth-of-type(2) th": { bgcolor: "#FFFFFF", color: "#1C252E", fontSize: 14, fontWeight: 800, py: 0.5, textAlign: "center" },
                "thead tr:last-of-type th": { bgcolor: "#F4F6F8", color: "#52616F", fontWeight: 700, py: 0.75, textAlign: "center" },
              }}
            >
              <thead>
                <tr>
                  <th colSpan={6}>KHUNG CHƯƠNG TRÌNH MÔN HỌC</th>
                </tr>
                <tr>
                  <th colSpan={6}>
                    {subject?.label ?? "Chưa chọn môn"} · {selectedStage?.level.title ?? "Chưa chọn level"} · Năm học {academicYear}
                  </th>
                </tr>
                <tr>
                  <th style={{ width: "24%" }}>Chủ đề</th>
                  <th style={{ width: 62 }}>Tiết</th>
                  <th>Tên bài học</th>
                  <th style={{ width: 72 }}>Số tiết</th>
                  <th style={{ width: 80 }}>Thứ tự</th>
                  <th style={{ width: 56 }}>Xóa</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const group = topicGroups.find((candidate) => index === candidate.start);
                  const isGroupStart = Boolean(group);
                  const isReview = row.title.toLowerCase().includes("ôn tập");
                  const isPractice = row.title.toLowerCase().includes("luyện thi");
                  const isNewlyAdded = Boolean(row.isNew);

                  let rowBg = index % 2 === 0 ? "#FFFFFF" : "#FBFCFF";
                  if (isNewlyAdded) {
                    rowBg = "#FEF2F2";
                  } else if (isReview) {
                    rowBg = "#EBF3FC";
                  } else if (isPractice) {
                    rowBg = "#F5F3FF";
                  }

                  return (
                    <tr
                      key={row.id ?? `new-${index}`}
                      style={{
                        backgroundColor: rowBg,
                        boxShadow: isNewlyAdded ? "inset 3px 0 0 #EF4444" : undefined,
                      }}
                    >
                      {isGroupStart ? (
                        <td
                          rowSpan={group?.count}
                          style={{
                            verticalAlign: "middle",
                            backgroundColor: selectedTopic === row.topic ? "#F0F7FF" : "#F8FAFC",
                            borderLeft: selectedTopic === row.topic ? "3px solid #0F6CBD" : "1px solid #D9E2EF",
                            padding: "8px 8px",
                            cursor: "pointer",
                            transition: "background-color 0.15s ease",
                          }}
                          onClick={() => setSelectedTopic(row.topic)}
                        >
                          <Box sx={{ display: "grid", gap: 0.75 }}>
                            <TextField
                              size="small"
                              placeholder="Tên chủ đề..."
                              value={row.topic}
                              onChange={(event) => updateTopicGroup(index, event.target.value)}
                              fullWidth
                              multiline
                              minRows={1}
                              maxRows={3}
                              sx={{
                                "& .MuiInputBase-root": { bgcolor: "#FFFFFF", borderRadius: 1 },
                                "& .MuiInputBase-input": { fontSize: 12.5, fontWeight: 700, color: "#1E293B" },
                              }}
                            />
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 0.25 }}>
                              <Chip
                                size="small"
                                label={`${group?.count || 1} tiết`}
                                sx={{
                                  height: 20,
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  bgcolor: selectedTopic === row.topic ? "#BFDBFE" : "#E2E8F0",
                                  color: selectedTopic === row.topic ? "#1E40AF" : "#334155",
                                }}
                              />
                              <Tooltip title={`Xóa toàn bộ chủ đề "${row.topic}" (${group?.count} tiết)`}>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeTopicGroup(row.topic, group?.count || 1);
                                  }}
                                  sx={{ p: 0.25 }}
                                >
                                  <Delete sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        </td>
                      ) : null}
                      <td style={{ textAlign: "center" }}>
                        <TextField
                          size="small"
                          type="number"
                          value={row.period}
                          onChange={(event) => updateRow(index, { period: Math.max(1, Number(event.target.value)) })}
                          sx={{ width: 58, "& input": { textAlign: "center", fontSize: 12 } }}
                        />
                      </td>
                      <td>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          {isNewlyAdded ? (
                            <Chip
                              size="small"
                              label="Chưa lưu"
                              sx={{
                                height: 20,
                                fontSize: 10,
                                fontWeight: 700,
                                bgcolor: "#FEE2E2",
                                color: "#B91C1C",
                                border: "1px solid #FECACA",
                              }}
                            />
                          ) : null}
                          {isReview ? (
                            <Chip size="small" label="Ôn tập" sx={{ height: 20, fontSize: 10, bgcolor: "#BFDBFE", color: "#1E40AF" }} />
                          ) : isPractice ? (
                            <Chip size="small" label="Luyện thi" sx={{ height: 20, fontSize: 10, bgcolor: "#DDD6FE", color: "#5B21B6" }} />
                          ) : null}
                          <TextField
                            size="small"
                            value={row.title}
                            onChange={(event) => updateRow(index, { title: event.target.value })}
                            fullWidth
                            sx={{
                              "& .MuiInputBase-root": {
                                bgcolor: isNewlyAdded ? "#FFF5F5" : "transparent",
                              },
                              "& input": {
                                fontSize: 12.5,
                                fontWeight: isReview || isPractice || isNewlyAdded ? 600 : 400,
                                color: isNewlyAdded ? "#991B1B" : "#1C252E",
                              },
                            }}
                          />
                        </Box>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <TextField
                          size="small"
                          type="number"
                          value={row.sessions}
                          onChange={(event) => updateRow(index, { sessions: Math.max(1, Number(event.target.value)) })}
                          sx={{ width: 62, "& input": { textAlign: "center", fontSize: 12 } }}
                        />
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <Box sx={{ display: "flex", justifyContent: "center", gap: 0.25 }}>
                          <Tooltip title="Chuyển lên">
                            <span>
                              <IconButton size="small" disabled={index === 0} onClick={() => moveRow(index, "up")} sx={{ p: 0.25 }}>
                                <ArrowUpward fontSize="inherit" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Chuyển xuống">
                            <span>
                              <IconButton size="small" disabled={index === rows.length - 1} onClick={() => moveRow(index, "down")} sx={{ p: 0.25 }}>
                                <ArrowDownward fontSize="inherit" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <Tooltip title="Xóa dòng">
                          <IconButton size="small" color="error" onClick={() => removeRow(index)} sx={{ p: 0.5 }}>
                            <Delete fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Box>
            {!rows.length ? (
              <Box sx={{ p: 4, textAlign: "center", display: "grid", gap: 1.5, placeItems: "center" }}>
                <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                  Level chưa có dòng khung chương trình. Bấm <strong>“Thêm chủ đề mới”</strong> hoặc <strong>“Nhập nhanh từ Excel”</strong> để bắt đầu.
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<CreateNewFolder />}
                    onClick={() => addNewTopic()}
                    sx={{ textTransform: "none", bgcolor: "#0F6CBD", fontWeight: 600 }}
                  >
                    Thêm chủ đề đầu tiên
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ContentPaste />}
                    onClick={() => setImportDialogOpen(true)}
                    sx={{ textTransform: "none", fontWeight: 600 }}
                  >
                    Nhập nhanh từ Excel
                  </Button>
                </Box>
              </Box>
            ) : null}
          </Box>

          {/* Quick Action Toolbar */}
          <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<CreateNewFolder fontSize="small" />}
                onClick={() => addNewTopic()}
                disabled={isSaving || isSyncing}
                sx={{
                  textTransform: "none",
                  fontSize: 12.5,
                  fontWeight: 700,
                  bgcolor: "#0F6CBD",
                  color: "#FFFFFF",
                  borderRadius: 1.5,
                  px: 1.5,
                  boxShadow: "0 1px 3px rgba(15, 108, 189, 0.2)",
                  "&:hover": { bgcolor: "#0B5594" },
                }}
              >
                + Thêm chủ đề mới
              </Button>

              {uniqueTopics.length > 0 ? (
                <>
                  <Box sx={{ width: "1px", height: 24, bgcolor: "#CBD5E1", mx: 0.5 }} />

                  <FormControl size="small" sx={{ minWidth: 200, maxWidth: 260 }}>
                    <InputLabel sx={{ fontSize: 12 }}>Chủ đề để thêm</InputLabel>
                    <Select
                      size="small"
                      label="Chủ đề để thêm"
                      value={selectedTopic}
                      onChange={(e) => setSelectedTopic(e.target.value)}
                      sx={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        bgcolor: "#FFFFFF",
                        "& .MuiSelect-select": { py: 0.6 },
                      }}
                    >
                      {uniqueTopics.map((topicName, idx) => (
                        <MenuItem key={`${topicName}-${idx}`} value={topicName} sx={{ fontSize: 12.5 }}>
                          {topicName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<PlaylistAdd fontSize="small" />}
                    onClick={() => addRowToSelectedTopic("lesson")}
                    disabled={!selectedTopic || isSaving || isSyncing}
                    sx={{
                      textTransform: "none",
                      fontSize: 12,
                      fontWeight: 600,
                      bgcolor: "#FFFFFF",
                      color: "#1E293B",
                      borderColor: "#CBD5E1",
                      borderRadius: 1.5,
                      "&:hover": { bgcolor: "#F1F5F9", borderColor: "#94A3B8" },
                    }}
                  >
                    Thêm bài học
                  </Button>

                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => addRowToSelectedTopic("review")}
                    disabled={!selectedTopic || isSaving || isSyncing}
                    sx={{
                      textTransform: "none",
                      fontSize: 12,
                      fontWeight: 600,
                      bgcolor: "#EFF6FF",
                      color: "#1E40AF",
                      borderColor: "#BFDBFE",
                      borderRadius: 1.5,
                      "&:hover": { bgcolor: "#DBEAFE", borderColor: "#93C5FD" },
                    }}
                  >
                    + Tiết Ôn tập
                  </Button>

                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => addRowToSelectedTopic("practice")}
                    disabled={!selectedTopic || isSaving || isSyncing}
                    sx={{
                      textTransform: "none",
                      fontSize: 12,
                      fontWeight: 600,
                      bgcolor: "#FAF5FF",
                      color: "#6B21A8",
                      borderColor: "#E9D5FF",
                      borderRadius: 1.5,
                      "&:hover": { bgcolor: "#F3E8FF", borderColor: "#D8B4FE" },
                    }}
                  >
                    + Tiết Luyện thi
                  </Button>
                </>
              ) : null}
            </Box>

            {rows.length > 0 ? (
              <Button
                variant="outlined"
                size="small"
                startIcon={<FormatListNumbered sx={{ color: "#0F6CBD", fontSize: 18 }} />}
                onClick={renumberPeriods}
                disabled={isSaving || isSyncing}
                sx={{
                  textTransform: "none",
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: "#0F6CBD",
                  bgcolor: "#EFF6FF",
                  borderColor: "#BFDBFE",
                  borderRadius: 1.5,
                  px: 1.5,
                  py: 0.5,
                  boxShadow: "0 1px 2px rgba(15, 108, 189, 0.08)",
                  "&:hover": {
                    bgcolor: "#DBEAFE",
                    borderColor: "#93C5FD",
                    color: "#0C5A9E",
                  },
                }}
              >
                Đánh lại số tiết (1 → {rows.length})
              </Button>
            ) : null}
          </Box>

          {saveProgramMutation.error ? (
            <Alert severity="error">{saveProgramMutation.error instanceof Error ? saveProgramMutation.error.message : "Không thể lưu khung chương trình."}</Alert>
          ) : null}
        </DialogContent>

        <DialogActions sx={{ px: 2.5, py: 1.5, justifyContent: "space-between" }}>
          <Button onClick={onClose} disabled={isSaving || isSyncing} sx={{ textTransform: "none" }}>
            Đóng
          </Button>

          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button
              variant="contained"
              disabled={!canSyncStructure || isSaving || isSyncing}
              startIcon={isSyncing ? <CircularProgress size={16} sx={{ color: "white" }} /> : <Sync />}
              onClick={handleSyncClick}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                px: 2.2,
                bgcolor: "#059669",
                color: "#FFFFFF",
                borderRadius: 1.5,
                boxShadow: "0 2px 4px rgba(5, 150, 105, 0.25)",
                "&:hover": { bgcolor: "#047857" },
                "&.Mui-disabled": {
                  bgcolor: "#D1D5DB",
                  color: "#9CA3AF",
                },
              }}
            >
              {isSyncing ? (syncStatusText || "Đang đồng bộ…") : "Lưu & Đồng bộ sang Cấu trúc"}
            </Button>

            <Button
              variant="contained"
              disabled={!canSaveProgram || isSaving || isSyncing}
              startIcon={isSaving ? <CircularProgress size={16} sx={{ color: "white" }} /> : null}
              onClick={() => void save()}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                px: 2.5,
                bgcolor: "#0F6CBD",
                borderRadius: 1.5,
                boxShadow: "0 2px 4px rgba(15, 108, 189, 0.25)",
                "&:hover": { bgcolor: "#0B5594" },
                "&.Mui-disabled": {
                  bgcolor: "#CBD5E1",
                  color: "#94A3B8",
                },
              }}
            >
              {isSaving ? "Đang lưu…" : "Lưu khung chương trình"}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Confirm Sync Dialog */}
      <Dialog
        open={syncConfirmOpen}
        onClose={() => setSyncConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700, fontSize: 17 }}>
          <Sync color="primary" /> Đồng bộ sang Cấu trúc môn học
        </DialogTitle>
        <DialogContent dividers sx={{ display: "grid", gap: 2 }}>
          <Alert severity="warning" sx={{ fontSize: 13 }}>
            Level <strong>{selectedStage?.level.title}</strong> hiện đã có <strong>{existingTopics.length} chủ đề</strong> trong cấu trúc môn học.
            Vui lòng chọn phương thức đồng bộ:
          </Alert>

          <RadioGroup
            value={syncMode}
            onChange={(e) => setSyncMode(e.target.value as "append" | "overwrite")}
          >
            <Box
              sx={{
                p: 1.5,
                mb: 1.5,
                border: "1px solid",
                borderColor: syncMode === "append" ? "#0F6CBD" : "#E2E8F0",
                borderRadius: 1.5,
                bgcolor: syncMode === "append" ? "#F0F7FF" : "#FFFFFF",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onClick={() => setSyncMode("append")}
            >
              <FormControlLabel
                value="append"
                control={<Radio size="small" />}
                label={
                  <Box>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#1E293B" }}>
                      Thêm tiếp vào sau cấu trúc hiện có (Khuyên dùng)
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: "#64748B", mt: 0.25 }}>
                      Giữ nguyên các chủ đề và bài học cũ. Chỉ tạo thêm các chủ đề và bài học mới từ khung chương trình nếu chưa có.
                    </Typography>
                  </Box>
                }
              />
            </Box>

            <Box
              sx={{
                p: 1.5,
                border: "1px solid",
                borderColor: syncMode === "overwrite" ? "#EF4444" : "#E2E8F0",
                borderRadius: 1.5,
                bgcolor: syncMode === "overwrite" ? "#FEF2F2" : "#FFFFFF",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onClick={() => setSyncMode("overwrite")}
            >
              <FormControlLabel
                value="overwrite"
                control={<Radio size="small" color="error" />}
                label={
                  <Box>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#991B1B" }}>
                      Xóa cấu trúc cũ và tạo mới toàn bộ theo khung chương trình
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: "#64748B", mt: 0.25 }}>
                      Toàn bộ {existingTopics.length} chủ đề và các bài học cũ của level này sẽ được xóa để thay thế chính xác 100% theo khung chương trình.
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </RadioGroup>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 1.5 }}>
          <Button onClick={() => setSyncConfirmOpen(false)} sx={{ textTransform: "none" }}>
            Hủy
          </Button>
          <Button
            variant="contained"
            color={syncMode === "overwrite" ? "error" : "primary"}
            onClick={() => {
              setSyncConfirmOpen(false);
              void executeSync(syncMode);
            }}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            {syncMode === "overwrite" ? "Xóa & Tạo mới toàn bộ" : "Tiến hành đồng bộ"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Excel Import Modal */}
      <CurriculumExcelImportDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onApply={handleApplyImportedRows}
        currentLevelTitle={selectedStage?.level.title}
      />
    </>
  );
}

function buildTopicGroups(rows: EditableCurriculumRow[]) {
  const groups: Array<{ topic: string; start: number; end: number; count: number }> = [];
  rows.forEach((row, index) => {
    if (index === 0 || row.topic !== rows[index - 1]?.topic) {
      groups.push({ topic: row.topic, start: index, end: index + 1, count: 1 });
    } else {
      const current = groups[groups.length - 1];
      current.end = index + 1;
      current.count += 1;
    }
  });
  return groups;
}

function generateTopicCode(label: string): string {
  const slug = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "topic"}-${Math.random().toString(36).substring(2, 6)}`;
}

function cleanTaxonomyId(id: string): string {
  return id.replace(/^(lesson|topic|group-category|group|category|level)-/, "");
}
