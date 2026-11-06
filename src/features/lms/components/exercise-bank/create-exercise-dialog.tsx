import { useState, useMemo, useEffect } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";

import {
  emptyQuestionBankData,
  type QuestionBankApiData,
} from "@/features/question-bank/api/question-bank-api";
import { useQuestionBankWorkspaceQuery } from "@/features/question-bank/api/question-bank-query";
import {
  type Exercise,
  type ExerciseDifficulty,
  type ExerciseStatus,
  type ExerciseType,
} from "./exercise-bank-model";
import { CreateExerciseHeader } from "./create-exercise/create-exercise-header";
import { CreateExerciseFooter } from "./create-exercise/create-exercise-footer";
import { SetupForm } from "./create-exercise/setup-form";
import { SetupPreview } from "./create-exercise/setup-preview";
import { PickFilterBar } from "./create-exercise/pick-filter-bar";
import { PickQuestionList } from "./create-exercise/pick-question-list";
import { useQuestionPicker } from "./create-exercise/use-question-picker";

interface CreateExerciseDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Exercise, "id" | "updatedAt" | "assignedCount">) => void;
  initialExercise?: Exercise | null;
  onUpdate?: (updated: Exercise) => void;
}

export function CreateExerciseDialog({
  open,
  onClose,
  onSubmit,
  initialExercise,
  onUpdate,
}: CreateExerciseDialogProps) {
  // Lấy dữ liệu thật từ Ngân hàng câu hỏi của hệ thống ERG
  const { data: qbData, isLoading: isQuestionsLoading } = useQuestionBankWorkspaceQuery(undefined, {
    includeQuestions: true,
    size: 100,
  });

  const emptyData = useMemo(() => emptyQuestionBankData(), []);
  const activeQbData: QuestionBankApiData = qbData ?? emptyData;

  const subjects = useMemo(() => activeQbData.subjects ?? [], [activeQbData.subjects]);
  const allQuestions = useMemo(() => activeQbData.questions ?? [], [activeQbData.questions]);

  // Flow: Bốc câu hỏi trước -> Cấu hình bài tập sau
  const [activeStep, setActiveStep] = useState<"pick" | "setup">("pick");
  const [title, setTitle] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [level, setLevel] = useState("Level 1");
  const [type, setType] = useState<ExerciseType>("quiz");
  const [difficulty, setDifficulty] = useState<ExerciseDifficulty>("easy");
  const [status, setStatus] = useState<ExerciseStatus>("published");
  const [classTargets, setClassTargets] = useState("Lớp 6A1 - Nhóm bồi dưỡng");
  const [error, setError] = useState("");

  const currentSubject = useMemo(() => {
    return (
      subjects.find((s) => s.id === selectedSubjectId || s.label === selectedSubjectId) ??
      subjects[0]
    );
  }, [selectedSubjectId, subjects]);

  const subjectName = currentSubject?.label ?? "IC3 GS6";

  const {
    selectedLevel,
    setSelectedLevel,
    selectedTopic,
    setSelectedTopic,
    selectedDifficulty,
    setSelectedDifficulty,
    questionSearch,
    setQuestionSearch,
    selectedQuestionIds,
    setSelectedQuestionIds,
    customPickCount,
    setCustomPickCount,
    availableTopics,
    totalSubjectQuestions,
    displayedQuestions,
    selectedQuestions,
    toggleQuestion,
    handleCustomPick,
    selectAllCurrentView,
    deselectAllCurrentView,
    handleLevelChange,
    resetFilters,
    hasActiveFilters,
  } = useQuestionPicker(allQuestions, currentSubject);

  // Tự động khởi tạo hoặc đổ dữ liệu khi mở dialog hoặc đổi bài tập cần sửa
  useEffect(() => {
    if (!open) return;

    if (initialExercise) {
      setTitle(initialExercise.title);
      setLevel(initialExercise.level);
      setType(initialExercise.type);
      setDifficulty(initialExercise.difficulty);
      setStatus(initialExercise.status);
      setClassTargets(
        initialExercise.classTargets && initialExercise.classTargets.length > 0
          ? initialExercise.classTargets.join(", ")
          : "Lớp phụ trách"
      );
      setSelectedQuestionIds(initialExercise.questionIds ?? []);

      const foundSub = subjects.find(
        (s) =>
          s.label.toLowerCase() === initialExercise.subject.toLowerCase() ||
          s.id.toLowerCase() === initialExercise.subject.toLowerCase()
      );
      if (foundSub) {
        setSelectedSubjectId(foundSub.id);
      }
      setError("");
      setActiveStep("setup");
    } else {
      setTitle("");
      setSelectedQuestionIds([]);
      setError("");
      setActiveStep("pick");
      if (!selectedSubjectId && subjects.length > 0) {
        setSelectedSubjectId(subjects[0].id);
      }
    }
  }, [open, initialExercise, subjects, setSelectedQuestionIds]);

  // Cập nhật level khi đổi subject
  useEffect(() => {
    if (currentSubject?.levels?.[0]) {
      setLevel(currentSubject.levels[0].label);
    }
  }, [currentSubject]);

  // Danh sách các Level thuộc Môn học đang chọn
  const subjectLevels = useMemo(() => {
    return currentSubject?.levels ?? [];
  }, [currentSubject]);


  function handleSubjectChange(newSubjectId: string) {
    setSelectedSubjectId(newSubjectId);
    setSelectedLevel("all");
    setSelectedTopic("all");
    setSelectedDifficulty("all");
    setSelectedQuestionIds([]);
    const foundSub = subjects.find((s) => s.id === newSubjectId);
    if (foundSub?.levels?.[0]) {
      setLevel(foundSub.levels[0].label);
    }
  }


  function handleSubmit(event?: React.FormEvent) {
    if (event) event.preventDefault();
    if (!title.trim()) {
      setError("Vui lòng nhập tên bài tập");
      setActiveStep("setup");
      return;
    }

    const questionCount = Math.max(1, selectedQuestionIds.length);
    const durationMinutes = Math.max(15, Math.round(questionCount * 2));

    const targetsList = classTargets
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (initialExercise && onUpdate) {
      onUpdate({
        ...initialExercise,
        title: title.trim(),
        subject: subjectName,
        level,
        type,
        difficulty,
        status,
        durationMinutes,
        questionCount,
        classTargets: targetsList.length > 0 ? targetsList : ["Lớp phụ trách"],
        tags: [subjectName, level, "Tự tạo từ ngân hàng"],
        questionIds: selectedQuestionIds,
      });
    } else {
      onSubmit({
        title: title.trim(),
        subject: subjectName,
        level,
        type,
        difficulty,
        status,
        durationMinutes,
        questionCount,
        classTargets: targetsList.length > 0 ? targetsList : ["Lớp phụ trách"],
        tags: [subjectName, level, "Tự tạo từ ngân hàng"],
        source: "teacher",
        authorName: "Giáo viên tự tạo",
        questionIds: selectedQuestionIds,
      });
    }

    // Reset & close
    setTitle("");
    setSelectedQuestionIds([]);
    setError("");
    setActiveStep("pick");
  }

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason === "backdropClick") return;
        onClose();
      }}
      maxWidth="lg"
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
            borderRadius: { xs: 1.5, sm: 2, md: 2.5 },
            boxShadow: 24,
            height: { xs: "94vh", sm: "90vh", md: "88vh" },
            maxHeight: { xs: "96vh", md: 840 },
            width: { xs: "calc(100% - 16px)", sm: "calc(100% - 32px)", md: "92vw" },
            maxWidth: 1140,
            m: { xs: 1, sm: 2 },
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            bgcolor: "background.paper",
          },
        },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}>
        <CreateExerciseHeader
          initialExercise={initialExercise}
          subjectName={subjectName}
          activeStep={activeStep}
          setActiveStep={setActiveStep}
          selectedQuestionIds={selectedQuestionIds}
          title={title}
          setTitle={setTitle}
          setError={setError}
          onClose={onClose}
        />

        {/* ================================================================ */}
        {/* BODY                                                             */}
        {/* ================================================================ */}
        <DialogContent
          sx={{
            p: 0,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            overflow: "hidden",
            bgcolor: "background.default",
          }}
        >
          {error ? (
            <Alert severity="error" onClose={() => setError("")} sx={{ m: 2, mb: 0 }}>
              {error}
            </Alert>
          ) : null}

          {activeStep === "setup" ? (
            <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0,1fr)", lg: "minmax(0,7fr) minmax(0,5fr)" }, minHeight: "100%" }}>
                <SetupForm
                  title={title}
                  setTitle={setTitle}
                  error={error}
                  setError={setError}
                  handleSubmit={handleSubmit}
                  subjectName={subjectName}
                  subjects={subjects}
                  selectedSubjectId={selectedSubjectId}
                  handleSubjectChange={handleSubjectChange}
                  level={level}
                  setLevel={setLevel}
                  subjectLevels={subjectLevels}
                  type={type}
                  setType={setType}
                  difficulty={difficulty}
                  setDifficulty={setDifficulty}
                  classTargets={classTargets}
                  setClassTargets={setClassTargets}
                  status={status}
                  setStatus={setStatus}
                  selectedQuestionIds={selectedQuestionIds}
                  setActiveStep={setActiveStep}
                />
                <SetupPreview
                  subjectName={subjectName}
                  level={level}
                  type={type}
                  status={status}
                  title={title}
                  classTargets={classTargets}
                  difficulty={difficulty}
                  selectedQuestionIds={selectedQuestionIds}
                  selectedQuestions={selectedQuestions}
                  setActiveStep={setActiveStep}
                />
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flex: 1, flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
              <PickFilterBar
                subjects={subjects}
                selectedSubjectId={selectedSubjectId}
                currentSubject={currentSubject}
                handleSubjectChange={handleSubjectChange}
                questionSearch={questionSearch}
                setQuestionSearch={setQuestionSearch}
                selectedLevel={selectedLevel}
                handleLevelChange={handleLevelChange}
                subjectLevels={subjectLevels}
                selectedTopic={selectedTopic}
                setSelectedTopic={setSelectedTopic}
                availableTopics={availableTopics}
                selectedDifficulty={selectedDifficulty}
                setSelectedDifficulty={setSelectedDifficulty}
                hasActiveFilters={hasActiveFilters}
                resetFilters={resetFilters}
                customPickCount={customPickCount}
                setCustomPickCount={setCustomPickCount}
                handleCustomPick={handleCustomPick}
                displayedQuestions={displayedQuestions}
                totalSubjectQuestions={totalSubjectQuestions}
                selectAllCurrentView={selectAllCurrentView}
                deselectAllCurrentView={deselectAllCurrentView}
              />
              <PickQuestionList
                isQuestionsLoading={isQuestionsLoading}
                displayedQuestions={displayedQuestions}
                selectedQuestionIds={selectedQuestionIds}
                toggleQuestion={toggleQuestion}
              />
            </Box>
          )}
        </DialogContent>

        <CreateExerciseFooter
          selectedQuestionIds={selectedQuestionIds}
          activeStep={activeStep}
          setActiveStep={setActiveStep}
          initialExercise={initialExercise}
          title={title}
          setTitle={setTitle}
          subjectName={subjectName}
          setError={setError}
          handleSubmit={handleSubmit}
          onClose={onClose}
        />
      </Box>
    </Dialog>
  );
}
