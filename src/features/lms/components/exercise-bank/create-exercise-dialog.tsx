import { useState, useMemo, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import { X } from "lucide-react";

import {
  mockQuestionBankData,
  type QuestionBankApiData,
} from "@/features/lcms/quiz/question-bank/api/question-bank-api";
import { useQuestionBankWorkspaceQuery } from "@/features/lcms/quiz/question-bank/api/question-bank-query";
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

  // Luôn đảm bảo có dữ liệu dự phòng chuẩn mực khi API backend chưa seed hoặc quyền teacher bị giới hạn
  const fallbackData: QuestionBankApiData = useMemo(() => mockQuestionBankData(), []);
  const activeQbData: QuestionBankApiData = useMemo(() => {
    if (qbData && (qbData.subjects.length > 0 || qbData.questions.length > 0)) {
      return qbData;
    }
    return fallbackData;
  }, [qbData, fallbackData]);

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
            backgroundColor: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(2px)",
          },
        },
        paper: {
          sx: {
            borderRadius: { xs: "12px", sm: "16px", md: "20px" },
            boxShadow: "0 25px 70px rgba(0, 0, 0, 0.2)",
            height: { xs: "94vh", sm: "90vh", md: "88vh" },
            maxHeight: { xs: "96vh", md: 840 },
            width: { xs: "calc(100% - 16px)", sm: "calc(100% - 32px)", md: "92vw" },
            maxWidth: 1140,
            m: { xs: 1, sm: 2 },
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            bgcolor: "#FFFFFF",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", system-ui, sans-serif',
          },
        },
      }}
    >
      <div className="flex flex-col min-h-0 flex-1">
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
            bgcolor: "#F8FAFC",
          }}
        >
          {error ? (
            <div className="m-4 mb-0 rounded-xl bg-rose-50 px-4 py-3 text-[12px] font-semibold text-rose-700 border border-rose-200 flex items-center justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError("")}
                className="text-rose-700 hover:opacity-75"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}

          {activeStep === "setup" ? (
            <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50/50">
              <div className="grid grid-cols-1 lg:grid-cols-12 min-h-full">
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
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col min-h-0 overflow-hidden bg-slate-50/50">
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
            </div>
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
      </div>
    </Dialog>
  );
}
