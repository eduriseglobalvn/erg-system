import { useState, useMemo, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { ErgSelect } from "@/components/erg-mui";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Clock3,
  Dices,
  FileText,
  HelpCircle,
  RotateCcw,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  mockQuestionBankData,
  type QuestionBankApiData,
} from "@/features/lcms/quiz/question-bank/api/question-bank-api";
import { useQuestionBankWorkspaceQuery } from "@/features/lcms/quiz/question-bank/api/question-bank-query";
import {
  difficultyLabels,
  statusLabels,
  typeLabels,
  type Exercise,
  type ExerciseDifficulty,
  type ExerciseStatus,
  type ExerciseType,
} from "./exercise-bank-model";

interface FilterDropdownProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  children: React.ReactNode;
  className?: string;
  isFiltered?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

function FilterDropdown({
  value,
  onChange,
  children,
  className,
  isFiltered,
  icon: Icon,
}: FilterDropdownProps) {
  return (
    <div className={cn("relative inline-flex items-center", className)}>
      <TextField
        select
        fullWidth
        size="small"
        value={value}
        onChange={onChange}
        sx={{ "& .MuiSelect-select": { fontSize: 12, fontWeight: isFiltered ? 600 : 500, py: 0.75, pl: Icon ? 4 : 1.25 } }}
      >
        {children}
      </TextField>
      {Icon && (
        <Icon className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#0F6CBD] shrink-0" />
      )}
    </div>
  );
}

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

  // BỘ LỌC NGANG: CẤP ĐỘ, CHỦ ĐỀ, ĐỘ KHÓ, TÌM KIẾM
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [questionSearch, setQuestionSearch] = useState("");

  // DANH SÁCH ID CÂU HỎI ĐÃ BỐC
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [customPickCount, setCustomPickCount] = useState("");

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
  }, [open, initialExercise, subjects]);

  const currentSubject = useMemo(() => {
    return (
      subjects.find((s) => s.id === selectedSubjectId || s.label === selectedSubjectId) ??
      subjects[0]
    );
  }, [selectedSubjectId, subjects]);

  const subjectName = currentSubject?.label ?? "IC3 GS6";

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

  // Danh sách các Topic có sẵn (tự động lọc theo Level đang chọn)
  const availableTopics = useMemo(() => {
    if (!currentSubject) return [];
    if (selectedLevel === "all") return currentSubject.categories;
    return currentSubject.categories.filter((c) => c.levelId === selectedLevel);
  }, [currentSubject, selectedLevel]);

  // Tổng số câu hỏi của môn học hiện tại
  const totalSubjectQuestions = useMemo(() => {
    if (!currentSubject) return 0;
    return allQuestions.filter(
      (q) => q.subjectId === currentSubject.id || q.subjectLabel === currentSubject.label
    ).length;
  }, [allQuestions, currentSubject]);

  // Lọc câu hỏi hiển thị
  const displayedQuestions = useMemo(() => {
    if (!currentSubject) return [];
    return allQuestions.filter((q) => {
      const matchSubject =
        q.subjectId === currentSubject.id || q.subjectLabel === currentSubject.label;
      const matchLevel =
        selectedLevel === "all" ||
        q.levelId === selectedLevel ||
        q.levelLabel === selectedLevel;
      const matchTopic =
        selectedTopic === "all" ||
        q.categoryId === selectedTopic ||
        q.categoryLabel === selectedTopic;
      const matchDifficulty =
        selectedDifficulty === "all" || q.difficulty === selectedDifficulty;
      const matchSearch =
        !questionSearch.trim() ||
        q.stem.toLowerCase().includes(questionSearch.toLowerCase()) ||
        q.categoryLabel.toLowerCase().includes(questionSearch.toLowerCase()) ||
        q.levelLabel.toLowerCase().includes(questionSearch.toLowerCase()) ||
        q.tags?.some((t) => t.toLowerCase().includes(questionSearch.toLowerCase()));

      return matchSubject && matchLevel && matchTopic && matchDifficulty && matchSearch;
    });
  }, [allQuestions, currentSubject, questionSearch, selectedDifficulty, selectedLevel, selectedTopic]);

  // Danh sách các object câu hỏi đã bốc
  const selectedQuestions = useMemo(() => {
    return allQuestions.filter((q) => selectedQuestionIds.includes(q.id));
  }, [allQuestions, selectedQuestionIds]);

  function toggleQuestion(id: string) {
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function pickRandomQuestions(count: number) {
    if (count <= 0 || displayedQuestions.length === 0) return;
    const effectiveCount = Math.min(count, displayedQuestions.length);
    const shuffled = [...displayedQuestions].sort(() => 0.5 - Math.random());
    const picked = shuffled.slice(0, effectiveCount).map((q) => q.id);
    setSelectedQuestionIds(picked);
  }

  function handleCustomPick() {
    const count = parseInt(customPickCount, 10);
    if (isNaN(count) || count <= 0) return;
    pickRandomQuestions(count);
    setCustomPickCount("");
  }

  function selectAllCurrentView() {
    const ids = displayedQuestions.map((q) => q.id);
    setSelectedQuestionIds((prev) => Array.from(new Set([...prev, ...ids])));
  }

  function deselectAllCurrentView() {
    const ids = displayedQuestions.map((q) => q.id);
    setSelectedQuestionIds((prev) => prev.filter((id) => !ids.includes(id)));
  }

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

  function handleLevelChange(newLevelId: string) {
    setSelectedLevel(newLevelId);
    setSelectedTopic("all");
  }

  function resetFilters() {
    setSelectedLevel("all");
    setSelectedTopic("all");
    setSelectedDifficulty("all");
    setQuestionSearch("");
  }

  const hasActiveFilters =
    selectedLevel !== "all" ||
    selectedTopic !== "all" ||
    selectedDifficulty !== "all" ||
    questionSearch.trim() !== "";

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
        {/* ================================================================ */}
        {/* HEADER: GỌN GÀNG, ĐƠN GIẢN, RÕ NÉT, TỰ CO GIÃN THÔNG MINH       */}
        {/* ================================================================ */}
        <DialogTitle
          sx={{
            m: 0,
            px: { xs: 2, sm: 3.5 },
            py: { xs: 1.25, sm: 1.5 },
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #E2E8F0",
            bgcolor: "#FFFFFF",
            gap: 1.5,
          }}
        >
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="grid h-8 w-8 sm:h-8.5 sm:w-8.5 shrink-0 place-items-center rounded-lg bg-blue-50/80 text-[#0F6CBD] border border-blue-200/60 shadow-2xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <h2 className="text-[14px] sm:text-[15.5px] font-bold text-slate-900 leading-tight truncate tracking-tight">
                {initialExercise ? "Chỉnh sửa bài tập" : "Tạo bài tập mới"}
              </h2>
              <span className="shrink-0 rounded-md bg-blue-50 text-[#0F6CBD] px-2 py-0.5 text-[10.5px] sm:text-[11px] font-bold border border-blue-200/70">
                {subjectName}
              </span>
              {initialExercise && (
                <span className="shrink-0 rounded-md bg-amber-50 text-amber-700 px-2 py-0.5 text-[10.5px] font-bold border border-amber-200">
                  Chỉnh sửa
                </span>
              )}
            </div>
          </div>

          {/* Stepper chuyển bước & Nút đóng */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100/90 p-0.5 sm:p-1 border border-slate-200/80">
              <button
                type="button"
                onClick={() => setActiveStep("pick")}
                className={cn(
                  "flex items-center gap-1.5 sm:gap-2 rounded-md px-2.5 sm:px-3 py-1 text-[11.5px] sm:text-[12px] font-medium transition-colors select-none cursor-pointer",
                  activeStep === "pick"
                    ? "bg-white text-[#0F6CBD] font-bold shadow-xs border border-slate-200/70"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <span
                  className={cn(
                    "grid h-4 w-4 sm:h-4.5 sm:w-4.5 place-items-center rounded-full text-[9.5px] sm:text-[10px] font-bold",
                    activeStep === "pick"
                      ? "bg-[#0F6CBD] text-white"
                      : "bg-slate-200 text-slate-700"
                  )}
                >
                  1
                </span>
                <span className="hidden xs:inline sm:inline">Bốc câu hỏi</span>
                {selectedQuestionIds.length > 0 && (
                  <span className="rounded-full bg-blue-100 text-[#0F6CBD] px-1.5 sm:px-2 py-0.2 text-[10px] font-bold leading-none">
                    {selectedQuestionIds.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (selectedQuestionIds.length === 0) {
                    setError("Vui lòng chọn ít nhất 1 câu hỏi từ ngân hàng trước khi cấu hình bài tập");
                    return;
                  }
                  if (!title.trim()) {
                    setTitle(`${subjectName} - Bài tập luyện tập (${selectedQuestionIds.length} câu)`);
                  }
                  setError("");
                  setActiveStep("setup");
                }}
                className={cn(
                  "flex items-center gap-1.5 sm:gap-2 rounded-md px-2.5 sm:px-3 py-1 text-[11.5px] sm:text-[12px] font-medium transition-colors select-none cursor-pointer",
                  activeStep === "setup"
                    ? "bg-white text-[#0F6CBD] font-bold shadow-xs border border-slate-200/70"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <span
                  className={cn(
                    "grid h-4 w-4 sm:h-4.5 sm:w-4.5 place-items-center rounded-full text-[9.5px] sm:text-[10px] font-bold",
                    activeStep === "setup"
                      ? "bg-[#0F6CBD] text-white"
                      : "bg-slate-200 text-slate-700"
                  )}
                >
                  2
                </span>
                <span className="hidden xs:inline sm:inline">Cấu hình bài tập</span>
              </button>
            </div>

            <div className="h-4 w-px bg-slate-200 mx-0.5" />

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              title="Đóng"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogTitle>

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
            /* ============================================================ */
            /* BƯỚC 2: THIẾT LẬP THÔNG TIN BÀI TẬP — 2 CỘT CHUYÊN NGHIỆP     */
            /* ============================================================ */
            <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50/50">
              <div className="grid grid-cols-1 lg:grid-cols-12 min-h-full">
                {/* CỘT TRÁI (7 CỘT): FORM THIẾT LẬP CHI TIẾT */}
                <div className="lg:col-span-7 p-4 sm:p-6 lg:p-7 space-y-4 sm:space-y-5 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white">
                  {/* TIÊU ĐỀ SECTION */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h3 className="text-[14px] font-bold text-slate-900">
                        Thông tin cấu hình bài tập
                      </h3>
                      <p className="text-[12px] text-slate-500 mt-0.5">
                        Thiết lập thông số cơ bản cho bài luyện tập hoặc đề thi
                      </p>
                    </div>
                    <span className="rounded-full bg-blue-50 text-[#0F6CBD] px-2.5 py-0.5 text-[11px] font-bold border border-blue-200/80">
                      Bước 2 / 2
                    </span>
                  </div>

                  {/* KHỐI 1: TÊN BÀI TẬP & GỢI Ý NHANH */}
                  <div className="space-y-1.5">
                    <label className="flex items-center justify-between text-[12px] font-bold text-slate-800">
                      <span>
                        Tên bài tập <span className="text-rose-500">*</span>
                      </span>
                      <span className="text-[11px] font-normal text-slate-400">
                        {title.length}/120 ký tự
                      </span>
                    </label>
                    <div className="relative">
                      <FileText className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => {
                          setTitle(e.target.value);
                          if (error) setError("");
                        }}
                        maxLength={120}
                        placeholder="vd: IC3 GS6 - Kiểm tra kiến thức máy tính căn bản"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSubmit();
                          }
                        }}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-[13px] text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-[#0F6CBD] focus:ring-2 focus:ring-[#0F6CBD]/10 font-medium"
                        autoFocus
                      />
                    </div>
                    {/* Gợi ý mẫu */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px]">
                      <span className="text-slate-500 font-medium">Gợi ý nhanh:</span>
                      {["Kiểm tra 15 phút", "Ôn tập định kỳ", "Bài tập cuối tuần"].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setTitle(`${subjectName} - ${preset}`)}
                          className="rounded-md border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 hover:text-[#0F6CBD] px-2 py-0.5 text-slate-600 transition-colors cursor-pointer"
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* KHỐI 2: MÔN HỌC & CẤP ĐỘ */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-[12px] font-bold text-slate-800">
                        Môn học
                      </label>
                      <ErgSelect
                        size="small"
                        value={selectedSubjectId}
                        onChange={(e) => handleSubjectChange(String(e.target.value))}
                        options={subjects.map((sub) => ({ value: sub.id, label: sub.label }))}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[12px] font-bold text-slate-800">
                        Cấp độ (Level)
                      </label>
                      <ErgSelect
                        size="small"
                        value={level}
                        onChange={(e) => setLevel(String(e.target.value))}
                        options={subjectLevels.map((lvl) => ({ value: lvl.label, label: lvl.label }))}
                      />
                    </div>
                  </div>

                  {/* KHỐI 3: PHÂN LOẠI & ĐỘ KHÓ */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-[12px] font-bold text-slate-800">
                        Phân loại bài
                      </label>
                      <ErgSelect
                        size="small"
                        value={type}
                        onChange={(e) => setType(e.target.value as ExerciseType)}
                        options={[
                          { value: "quiz", label: "Trắc nghiệm" },
                          { value: "practice", label: "Tự luyện" },
                          { value: "project", label: "Dự án" },
                          { value: "exam", label: "Đề kiểm tra" },
                        ]}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[12px] font-bold text-slate-800">
                        Độ khó mục tiêu
                      </label>
                      <ErgSelect
                        size="small"
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as ExerciseDifficulty)}
                        options={[
                          { value: "easy", label: "Cơ bản (Dễ)" },
                          { value: "medium", label: "Nâng cao (Trung bình)" },
                          { value: "hard", label: "Thử thách (Khó)" },
                        ]}
                      />
                    </div>
                  </div>

                  {/* KHỐI 4: LỚP ÁP DỤNG & TRẠNG THÁI PHÁT HÀNH */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-[12px] font-bold text-slate-800">
                        Lớp / nhóm phù hợp
                      </label>
                      <div className="relative">
                        <Users className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          value={classTargets}
                          onChange={(e) => setClassTargets(e.target.value)}
                          placeholder="vd: Lớp 6A1, Nhóm bồi dưỡng"
                          className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-[13px] text-slate-900 outline-none transition-colors hover:border-slate-300 focus:border-[#0F6CBD] focus:ring-2 focus:ring-[#0F6CBD]/10 font-medium"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[12px] font-bold text-slate-800">
                        Trạng thái phát hành
                      </label>
                      <ErgSelect
                        size="small"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as ExerciseStatus)}
                        options={[
                          { value: "published", label: "Đã xuất bản (Sẵn sàng giao)" },
                          { value: "draft", label: "Bản nháp (Đang biên soạn)" },
                        ]}
                      />
                    </div>
                  </div>

                  {/* BANNER THÔNG TIN TIẾN ĐỘ CÂU HỎI */}
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <span className="block text-[13px] font-bold text-slate-900">
                          {selectedQuestionIds.length > 0
                            ? `Đã bốc ${selectedQuestionIds.length} câu hỏi từ Ngân hàng (${subjectName})`
                            : `Chưa bốc câu hỏi từ Ngân hàng (${subjectName})`}
                        </span>
                        <span className="block text-[11.5px] text-slate-600">
                          {selectedQuestionIds.length > 0
                            ? `Thời lượng làm bài dự kiến: ~${Math.round(selectedQuestionIds.length * 2)} phút`
                            : "Vui lòng chọn ít nhất 1 câu hỏi để tạo bài tập"}
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={() => setActiveStep("pick")}
                      startIcon={<ArrowLeft className="h-4 w-4" />}
                      sx={{
                        height: 34,
                        borderRadius: "8px",
                        px: 2,
                        fontSize: "12px",
                        fontWeight: 600,
                        textTransform: "none",
                        borderColor: "#A7F3D0",
                        color: "#047857",
                        bgcolor: "#FFFFFF",
                        "&:hover": { bgcolor: "#F0FDF4", borderColor: "#6EE7B7" },
                      }}
                    >
                      Chọn thêm / Đổi câu
                    </Button>
                  </div>
                </div>

                {/* CỘT PHẢI (5 CỘT): LIVE PREVIEW & TỔNG QUAN NGÂN HÀNG CÂU HỎI */}
                <div className="lg:col-span-5 p-4 sm:p-6 lg:p-7 space-y-4 bg-slate-50/70 border-t lg:border-t-0">
                  {/* TIÊU ĐỀ CỘT PHẢI */}
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200/80">
                    <span className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">
                      Xem trước thẻ bài tập
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Cập nhật trực tiếp
                    </span>
                  </div>

                  {/* THẺ PREVIEW CARD */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded bg-blue-50 text-[#0F6CBD] px-2 py-0.5 text-[11px] font-bold border border-blue-200">
                          {subjectName} • {level || "Level 1"}
                        </span>
                        <span className="rounded bg-slate-100 text-slate-600 px-2 py-0.5 text-[11px] font-medium">
                          {typeLabels[type]}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold border",
                          status === "published"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            status === "published" ? "bg-emerald-500" : "bg-amber-500"
                          )}
                        />
                        {statusLabels[status]}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-[14px] font-bold text-slate-900 leading-snug line-clamp-2">
                        {title.trim() ? title : "Chưa đặt tên bài tập..."}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Áp dụng: {classTargets || "Chưa gán lớp cụ thể"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                      <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                        <span className="block text-slate-500">Độ khó mục tiêu</span>
                        <span className="block font-bold text-slate-800 mt-0.5">
                          {difficultyLabels[difficulty]}
                        </span>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                        <span className="block text-slate-500">Thời lượng dự tính</span>
                        <span className="block font-bold text-slate-800 mt-0.5">
                          ~{Math.max(15, Math.round(Math.max(1, selectedQuestionIds.length) * 2))} phút
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* THẺ TỔNG QUAN CÂU HỎI ĐÃ BỐC */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <h4 className="text-[13px] font-bold text-slate-900">
                          Câu hỏi đã chọn ({selectedQuestionIds.length})
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveStep("pick")}
                        className="text-[11.5px] font-semibold text-[#0F6CBD] hover:underline cursor-pointer"
                      >
                        ← Đổi câu hỏi
                      </button>
                    </div>

                    {selectedQuestionIds.length > 0 ? (
                      <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
                        {selectedQuestions.map((q, idx) => (
                          <div
                            key={q.id}
                            className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 text-[11.5px] space-y-1"
                          >
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-bold text-slate-400 shrink-0">#{idx + 1}</span>
                              <p className="font-medium text-slate-800 line-clamp-1">{q.stem}</p>
                            </div>
                            <div className="flex items-center gap-2 text-[10.5px] text-slate-500">
                              <span className="rounded bg-white px-1.5 py-0.2 border border-slate-200 font-medium">
                                {q.categoryLabel}
                              </span>
                              {q.answer && (
                                <>
                                  <span>•</span>
                                  <span className="text-emerald-700 font-medium">
                                    Đ/a: {q.answer}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-4 text-center">
                        <p className="text-[12px] text-slate-500 italic mb-2">
                          Chưa có câu hỏi nào được chọn từ ngân hàng.
                        </p>
                        <Button
                          type="button"
                          variant="outlined"
                          size="small"
                          onClick={() => setActiveStep("pick")}
                          sx={{ textTransform: "none", fontSize: "11.5px", borderColor: "#0F6CBD", color: "#0F6CBD" }}
                        >
                          Bốc câu hỏi từ ngân hàng ngay →
                        </Button>
                      </div>
                    )}

                    {/* NÚT THAO TÁC BỐC THÊM */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11.5px]">
                      <span className="text-slate-500">
                        Thời lượng: <strong>~{Math.round(selectedQuestionIds.length * 2)} phút</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveStep("pick")}
                        className="font-bold text-[#0F6CBD] hover:underline cursor-pointer"
                      >
                        + Chọn thêm câu hỏi
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ============================================================ */
            /* BƯỚC 1: BỐC CÂU HỎI — CO GIÃN THÔNG MINH, KHÔNG TRÀN VIỀN    */
            /* ============================================================ */
            <div className="flex flex-1 flex-col min-h-0 overflow-hidden bg-slate-50/50">
              {/* THANH BỘ LỌC NGANG THÔNG MINH */}
              <div className="shrink-0 border-b border-slate-200/90 bg-[#F8FAFC] p-3 sm:px-6 sm:py-3 space-y-2.5">
                {/* Hàng 1: Môn học + Ô tìm kiếm + Cấp độ + Chủ đề + Độ khó */}
                <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
                  {/* Cụm Môn học + Tìm kiếm */}
                  <div className="flex items-center gap-2 w-full lg:w-auto lg:flex-1">
                    <FilterDropdown
                      value={selectedSubjectId || currentSubject?.id || ""}
                      onChange={(e) => handleSubjectChange(e.target.value)}
                      icon={BookOpen}
                      className="min-w-[125px] shrink-0 font-bold"
                    >
                      {subjects.map((sub) => (
                        <MenuItem key={sub.id} value={sub.id}>
                          {sub.label}
                        </MenuItem>
                      ))}
                    </FilterDropdown>

                    <div className="relative flex-1 min-w-[170px]">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={questionSearch}
                        onChange={(e) => setQuestionSearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.preventDefault();
                        }}
                        placeholder="Tìm kiếm nội dung câu hỏi, từ khóa..."
                        className={cn(
                          "h-8.5 w-full rounded-lg border pl-8 text-[12px] text-slate-900 placeholder:text-slate-400 outline-none transition-colors",
                          questionSearch.trim()
                            ? "border-[#0F6CBD] bg-white ring-2 ring-[#0F6CBD]/10 pr-7"
                            : "border-slate-200 bg-white hover:border-slate-300 focus:border-[#0F6CBD] focus:ring-2 focus:ring-[#0F6CBD]/10 pr-3"
                        )}
                      />
                      {questionSearch && (
                        <button
                          type="button"
                          onClick={() => setQuestionSearch("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                          title="Xóa tìm kiếm"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Cụm Cấp độ + Chủ đề + Độ khó */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 w-full lg:w-auto shrink-0">
                    <FilterDropdown
                      value={selectedLevel}
                      onChange={(e) => handleLevelChange(e.target.value)}
                      isFiltered={selectedLevel !== "all"}
                      className="flex-1 sm:flex-initial min-w-[130px]"
                    >
                      <MenuItem value="all">Tất cả cấp độ ({subjectLevels.length})</MenuItem>
                      {subjectLevels.map((lvl) => (
                        <MenuItem key={lvl.id} value={lvl.id}>
                          {lvl.label}
                        </MenuItem>
                      ))}
                    </FilterDropdown>

                    <FilterDropdown
                      value={selectedTopic}
                      onChange={(e) => setSelectedTopic(e.target.value)}
                      isFiltered={selectedTopic !== "all"}
                      className="flex-1 sm:flex-initial min-w-[135px] max-w-[210px]"
                    >
                      <MenuItem value="all">Tất cả chủ đề ({availableTopics.length})</MenuItem>
                      {availableTopics.map((tpc) => (
                        <MenuItem key={tpc.id} value={tpc.id}>
                          {tpc.label}
                        </MenuItem>
                      ))}
                    </FilterDropdown>

                    <FilterDropdown
                      value={selectedDifficulty}
                      onChange={(e) => setSelectedDifficulty(e.target.value)}
                      isFiltered={selectedDifficulty !== "all"}
                      className="flex-1 sm:flex-initial min-w-[115px]"
                    >
                      <MenuItem value="all">Tất cả độ khó</MenuItem>
                      <MenuItem value="core">Cơ bản</MenuItem>
                      <MenuItem value="stretch">Nâng cao</MenuItem>
                      <MenuItem value="challenge">Thử thách</MenuItem>
                    </FilterDropdown>

                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 px-2 py-1 rounded-md hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                        title="Đặt lại bộ lọc"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Đặt lại
                      </button>
                    )}
                  </div>
                </div>

                {/* Hàng 2: Thao tác bốc nhanh & Thống kê */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-[12px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-500 font-semibold text-[11.5px] uppercase tracking-wider shrink-0 flex items-center gap-1.5">
                      <Dices className="h-3.5 w-3.5 text-[#0F6CBD]" />
                      Bốc ngẫu nhiên:
                    </span>
                    <div className="inline-flex items-center h-8 rounded-lg border border-slate-200 bg-white shadow-2xs hover:border-slate-300 focus-within:border-[#0F6CBD] focus-within:ring-2 focus-within:ring-[#0F6CBD]/10 transition-colors">
                      <input
                        type="number"
                        min={1}
                        max={displayedQuestions.length}
                        value={customPickCount}
                        onChange={(e) => setCustomPickCount(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleCustomPick();
                          }
                        }}
                        placeholder="Nhập số câu..."
                        className="w-24 h-full px-2.5 text-[12px] text-slate-900 placeholder:text-slate-400 outline-none font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        onClick={handleCustomPick}
                        disabled={!customPickCount || parseInt(customPickCount, 10) <= 0}
                        className="h-full px-3 text-[12px] font-semibold bg-blue-50/80 border-l border-slate-200 text-[#0F6CBD] hover:bg-[#0F6CBD] hover:text-white disabled:opacity-40 disabled:hover:bg-blue-50/80 disabled:hover:text-[#0F6CBD] disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1.5"
                        title="Bốc đúng số lượng random câu"
                      >
                        <Dices className="h-3.5 w-3.5" />
                        Bốc câu hỏi
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-2.5 text-[11.5px] sm:text-[12px]">
                    <button
                      type="button"
                      onClick={selectAllCurrentView}
                      className="font-semibold text-[#0F6CBD] hover:text-[#0B5CAB] hover:underline cursor-pointer"
                    >
                      Chọn tất cả ({displayedQuestions.length})
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={deselectAllCurrentView}
                      className="font-medium text-slate-500 hover:text-rose-600 cursor-pointer"
                    >
                      Bỏ chọn
                    </button>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-500 text-[11.5px]">
                      Hiển thị <strong className="text-slate-900 font-semibold">{displayedQuestions.length}</strong> / {totalSubjectQuestions} câu
                    </span>
                  </div>
                </div>
              </div>

              {/* DANH SÁCH CÂU HỎI */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 sm:px-6 space-y-2.5">
                {isQuestionsLoading && displayedQuestions.length === 0 ? (
                  <div className="space-y-3 py-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="h-4 w-6 bg-slate-200 rounded" />
                          <div className="h-4 bg-slate-200 rounded w-3/5" />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-16 bg-slate-100 rounded" />
                          <div className="h-4 w-28 bg-slate-100 rounded" />
                          <div className="h-4 w-16 bg-slate-100 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : displayedQuestions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 sm:p-12 text-center text-[13px] text-slate-500">
                    <HelpCircle className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    Không tìm thấy câu hỏi phù hợp với bộ lọc hiện tại.
                  </div>
                ) : (
                  displayedQuestions.map((q, idx) => {
                    const isSelected = selectedQuestionIds.includes(q.id);

                    return (
                      <div
                        key={q.id}
                        onClick={() => toggleQuestion(q.id)}
                        className={cn(
                          "cursor-pointer rounded-xl border p-3 sm:p-3.5 sm:px-4 transition-colors select-none flex items-start gap-3 bg-white",
                          isSelected
                            ? "border-[#0F6CBD] bg-blue-50/40 ring-1 ring-[#0F6CBD]/20"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                        )}
                      >
                        {/* Checkbox vuông tinh gọn */}
                        <div className="pt-0.5">
                          <div
                            className={cn(
                              "grid h-5 w-5 place-items-center rounded-md border transition-colors",
                              isSelected
                                ? "border-[#0F6CBD] bg-[#0F6CBD] text-white shadow-2xs"
                                : "border-slate-300 bg-white hover:border-slate-400"
                            )}
                          >
                            {isSelected ? <Check className="h-3 w-3 stroke-[3]" /> : null}
                          </div>
                        </div>

                        {/* Nội dung câu hỏi gọn gàng */}
                        <div className="flex-1 min-w-0">
                          {/* Câu hỏi chính */}
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-[12px] font-bold text-slate-400 shrink-0">
                              #{idx + 1}
                            </span>
                            <p className="text-[13px] sm:text-[13.5px] font-semibold text-slate-900 leading-snug">
                              {q.stem}
                            </p>
                          </div>

                          {/* Dòng tags phân loại & Đáp án ngắn gọn */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px]">
                            <span className="rounded bg-slate-100 text-slate-700 px-1.5 py-0.2 font-medium border border-slate-200">
                              {q.levelLabel}
                            </span>
                            <span className="rounded bg-slate-100 text-slate-600 px-1.5 py-0.2 font-medium">
                              {q.categoryLabel}
                            </span>
                            <span
                              className={cn(
                                "rounded px-1.5 py-0.2 font-semibold border",
                                q.difficulty === "core"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                  : q.difficulty === "stretch"
                                  ? "bg-amber-50 text-amber-800 border-amber-300"
                                  : "bg-rose-50 text-rose-800 border-rose-300"
                              )}
                            >
                              {q.difficulty === "core"
                                ? "Cơ bản"
                                : q.difficulty === "stretch"
                                ? "Nâng cao"
                                : "Thử thách"}
                            </span>
                            <span className="rounded bg-slate-100 text-slate-500 px-1.5 py-0.2 font-medium">
                              {q.type === "multiple-choice" ? "Trắc nghiệm" : q.type}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </DialogContent>

        {/* ================================================================ */}
        {/* FOOTER BAR: TIẾN ĐỘ & NÚT HÀNH ĐỘNG CO GIÃN THÔNG MINH          */}
        {/* ================================================================ */}
        <DialogActions
          sx={{
            px: { xs: 2, sm: 3.5 },
            py: { xs: 1.5, sm: 1.8 },
            borderTop: "1px solid #E2E8F0",
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between",
            gap: 1.5,
            bgcolor: "#FFFFFF",
          }}
        >
          {/* Thống kê số câu đã chọn */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {selectedQuestionIds.length > 0 ? (
              <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                <span className="flex items-center gap-1.5 rounded-full bg-blue-50 text-[#0F6CBD] border border-blue-200 px-2.5 sm:px-3 py-1 text-[11.5px] sm:text-[12px] font-bold">
                  <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#0F6CBD]" />
                  Đã chọn {selectedQuestionIds.length} câu
                </span>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <span className="flex items-center gap-1 text-[11.5px] sm:text-[12px] font-medium text-slate-600">
                  <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                  Thời lượng: ~{Math.round(selectedQuestionIds.length * 2)} phút
                </span>
              </div>
            ) : (
              <span className="text-[11.5px] sm:text-[12px] text-slate-400 font-medium italic">
                * Chưa bốc câu hỏi nào (chọn ít nhất 1 câu)
              </span>
            )}
          </div>

          {/* Nút hành động */}
          <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
            {activeStep === "pick" ? (
              <>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={onClose}
                  sx={{
                    height: 36,
                    borderRadius: "8px",
                    px: 2,
                    fontSize: "12px",
                    textTransform: "none",
                    borderColor: "#CBD5E1",
                    color: "#334155",
                    fontWeight: 600,
                    flex: { xs: 1, sm: "initial" },
                    "&:hover": { borderColor: "#94A3B8", bgcolor: "#F8FAFC" },
                  }}
                >
                  Hủy bỏ
                </Button>

                <Button
                  type="button"
                  variant="contained"
                  disabled={selectedQuestionIds.length === 0}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (selectedQuestionIds.length === 0) {
                      setError("Vui lòng chọn ít nhất 1 câu hỏi từ ngân hàng trước khi cấu hình");
                      return;
                    }
                    if (!title.trim()) {
                      setTitle(`${subjectName} - Bài tập ôn luyện (${selectedQuestionIds.length} câu)`);
                    }
                    setError("");
                    setActiveStep("setup");
                  }}
                  endIcon={<ArrowRight className="h-4 w-4" />}
                  sx={{
                    height: 36,
                    borderRadius: "8px",
                    px: { xs: 2, sm: 2.5 },
                    fontSize: "12px",
                    fontWeight: 700,
                    textTransform: "none",
                    flex: { xs: 2, sm: "initial" },
                    bgcolor: selectedQuestionIds.length > 0 ? "#0F6CBD" : "#94A3B8",
                    boxShadow:
                      selectedQuestionIds.length > 0
                        ? "0 1px 3px rgba(15, 108, 189, 0.25)"
                        : "none",
                    "&:hover": {
                      bgcolor: selectedQuestionIds.length > 0 ? "#0B5CAB" : "#94A3B8",
                    },
                  }}
                >
                  {selectedQuestionIds.length > 0
                    ? `Tiếp tục (${selectedQuestionIds.length} câu) →`
                    : "Chọn câu hỏi để tiếp tục"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => setActiveStep("pick")}
                  startIcon={<ArrowLeft className="h-4 w-4" />}
                  sx={{
                    height: 36,
                    borderRadius: "8px",
                    px: 2,
                    fontSize: "12px",
                    textTransform: "none",
                    borderColor: "#CBD5E1",
                    color: "#334155",
                    fontWeight: 600,
                    flex: { xs: 1, sm: "initial" },
                    "&:hover": { borderColor: "#94A3B8", bgcolor: "#F8FAFC" },
                  }}
                >
                  Quay lại chọn câu
                </Button>

                <Button
                  type="button"
                  variant="contained"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSubmit();
                  }}
                  endIcon={<Check className="h-4 w-4 stroke-[3]" />}
                  sx={{
                    height: 36,
                    borderRadius: "8px",
                    px: { xs: 2, sm: 2.5 },
                    fontSize: "12px",
                    fontWeight: 700,
                    textTransform: "none",
                    flex: { xs: 2, sm: "initial" },
                    bgcolor: "#0F6CBD",
                    boxShadow: "0 1px 3px rgba(15, 108, 189, 0.25)",
                    "&:hover": { bgcolor: "#0B5CAB" },
                  }}
                >
                  {initialExercise ? "Lưu thay đổi bài tập" : `Tạo bài tập (${selectedQuestionIds.length} câu)`}
                </Button>
              </>
            )}
          </div>
        </DialogActions>
      </div>
    </Dialog>
  );
}
