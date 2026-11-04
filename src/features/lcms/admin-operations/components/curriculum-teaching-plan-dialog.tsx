import { useEffect, useMemo, useState } from "react";
import CalendarMonth from "@mui/icons-material/CalendarMonth";
import ContentPaste from "@mui/icons-material/ContentPaste";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Skeleton from "@mui/material/Skeleton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { toast } from "sonner";

import { useCurriculumProgramQuery, useSaveCurriculumProgramMutation } from "@/features/lcms/admin-operations/api/curriculum-program-query";
import { buildEditableCurriculumProgramRows } from "@/features/lcms/admin-operations/utils/curriculum-schedule-model";
import type { CurriculumRoadmapStage } from "@/features/lcms/admin-operations/utils/learning-resource-curriculum-view-model";
import type { StudioSubject } from "@/features/lcms/admin-operations/types/learning-resource-authoring";
import { CurriculumExcelImportDialog } from "@/features/lcms/admin-operations/components/curriculum-excel-import-dialog";
import { planCurriculumSync } from "@/features/lcms/admin-operations/utils/curriculum-structure-sync";
import { buildTopicGroups, cleanTaxonomyId } from "./curriculum-teaching-plan/helpers";
import { TeachingPlanActions } from "./curriculum-teaching-plan/teaching-plan-actions";
import { TeachingPlanSummary } from "./curriculum-teaching-plan/teaching-plan-summary";
import { TeachingPlanSyncConfirmDialog } from "./curriculum-teaching-plan/teaching-plan-sync-confirm-dialog";
import { TeachingPlanTable } from "./curriculum-teaching-plan/teaching-plan-table";
import { TeachingPlanToolbar } from "./curriculum-teaching-plan/teaching-plan-toolbar";
import type { EditableCurriculumRow } from "./curriculum-teaching-plan/types";
import { useTeachingPlanRowEditing } from "./curriculum-teaching-plan/use-teaching-plan-row-editing";
import { useTeachingPlanSync } from "./curriculum-teaching-plan/use-teaching-plan-sync";

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


  const {
    updateRow,
    updateTopicGroup,
    addNewTopic,
    addRowToSelectedTopic,
    removeTopicGroup,
    renumberPeriods,
    moveRow,
    removeRow,
    handleApplyImportedRows,
  } = useTeachingPlanRowEditing({ rows, setRows, topicGroups, uniqueTopics, selectedTopic, setSelectedTopic });

  const { isSyncing, syncStatusText, executeSync } = useTeachingPlanSync({
    subject,
    canonicalLevelId,
    selectedStage,
    rows,
    setRows,
    existingTopics,
    saveProgramMutation,
    programQuery,
    onRefreshStructure,
    onClose,
  });

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
            <TeachingPlanSummary rows={rows} totalSessions={totalSessions} />
          </Box>

          {programQuery.isLoading ? <Skeleton height={180} variant="rounded" /> : null}
          {!programQuery.isLoading && canonicalLevelId && !programQuery.data ? (
            <Alert severity="info" sx={{ fontSize: 13, py: 0.5 }}>
              Level này chưa có khung chương trình riêng. Bạn có thể bấm <strong>&quot;Nhập nhanh từ Excel&quot;</strong> để dán toàn bộ khung chương trình hoặc nhập trực tiếp bên dưới.
            </Alert>
          ) : null}

          <TeachingPlanTable
            subject={subject}
            selectedStage={selectedStage}
            academicYear={academicYear}
            rows={rows}
            topicGroups={topicGroups}
            selectedTopic={selectedTopic}
            setSelectedTopic={setSelectedTopic}
            updateTopicGroup={updateTopicGroup}
            updateRow={updateRow}
            removeTopicGroup={removeTopicGroup}
            moveRow={moveRow}
            removeRow={removeRow}
            addNewTopic={addNewTopic}
            setImportDialogOpen={setImportDialogOpen}
          />

          {/* Quick Action Toolbar */}
          <TeachingPlanToolbar
            rows={rows}
            uniqueTopics={uniqueTopics}
            selectedTopic={selectedTopic}
            setSelectedTopic={setSelectedTopic}
            isSaving={isSaving}
            isSyncing={isSyncing}
            addNewTopic={addNewTopic}
            addRowToSelectedTopic={addRowToSelectedTopic}
            renumberPeriods={renumberPeriods}
          />

          {saveProgramMutation.error ? (
            <Alert severity="error">{saveProgramMutation.error instanceof Error ? saveProgramMutation.error.message : "Không thể lưu khung chương trình."}</Alert>
          ) : null}
        </DialogContent>

        <TeachingPlanActions
          onClose={onClose}
          isSaving={isSaving}
          isSyncing={isSyncing}
          canSyncStructure={canSyncStructure}
          canSaveProgram={canSaveProgram}
          syncStatusText={syncStatusText}
          handleSyncClick={handleSyncClick}
          save={save}
        />
      </Dialog>

      {/* Confirm Sync Dialog */}
      <TeachingPlanSyncConfirmDialog
        syncConfirmOpen={syncConfirmOpen}
        setSyncConfirmOpen={setSyncConfirmOpen}
        selectedStage={selectedStage}
        existingTopics={existingTopics}
        syncMode={syncMode}
        setSyncMode={setSyncMode}
        executeSync={executeSync}
      />

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
