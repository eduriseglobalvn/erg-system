import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Search as SearchIcon } from "@/components/mui-icon-shim";

import {
  DashboardPageShell,
} from "@/components/dashboard/dashboard-page-shell";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import OutlinedInput from "@mui/material/OutlinedInput";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { CreateQuizFromBankOptions } from "@/features/lcms/create-quiz-from-bank";
import {
  getQuestionBankPackageTotalPoints,
} from "@/features/lcms/quiz/question-bank/api/question-bank-to-quiz";
import {
  QuizCreatePackageDialog,
  type QuizCreateDraft,
} from "@/features/lcms/quiz/question-bank/components/quiz-create-package-dialog";
import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
import { useI18n } from "@/platform/i18n";
import {
  useCreateQuestionBankQuestionMutation,
  useQuestionBankWorkspaceQuery,
  useUpdateQuestionBankQuestionMutation,
} from "@/features/lcms/quiz/question-bank/api/question-bank-query";
import { useDeleteQuizEditorQuizMutation } from "@/features/lcms/quiz/quiz-editor";
import type { QuestionBankApiData, QuestionBankSaveQuestionInput } from "@/features/lcms/quiz/question-bank/api/question-bank-api";
import type {
  QuestionBankCategory,
  QuestionBankLevel,
  QuestionBankQuestion,
  QuestionBankSubject,
  QuestionBankSubjectId,
  QuizBankItem,
  QuizBankKind,
} from "@/features/lcms/quiz/question-bank/types/question-bank-types";
import { cn } from "@/lib/utils";
import type { ContentScope } from "@/types/scope-types";
import { toast } from "sonner";

type QuizKindFilter = "all" | QuizBankKind;

type BadgeTone = "primary" | "secondary" | "success" | "warning" | "danger" | "outline";

type QuestionFormMode = "create" | "edit";

type QuestionFormDraft = {
  stem: string;
  objective: string;
  type: QuestionBankQuestion["type"];
  difficulty: QuestionBankQuestion["difficulty"];
  status: QuestionBankQuestion["status"];
  tagsText: string;
  choiceA: string;
  choiceB: string;
  choiceC: string;
  choiceD: string;
  answer: string;
};

type QuizPackageEditDraft = {
  draft: QuizCreateDraft;
  quiz: QuizBankItem;
};

const EMPTY_QUESTION_BANK_DATA: QuestionBankApiData = {
  questions: [],
  questionPage: {
    page: 0,
    size: 50,
    totalItems: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  },
  quizzes: [],
  subjects: [],
};
const EMPTY_SUBJECT: QuestionBankSubject = {
  id: "",
  label: "",
  description: "",
  companyScopeLabel: "",
  levels: [],
  categories: [],
};

const EMPTY_LEVEL: QuestionBankLevel = {
  id: "",
  label: "",
  description: "",
  categoryIds: [],
};

const QUESTION_BANK_SELECT_MENU_PROPS = {
  disableScrollLock: true,
  keepMounted: true,
  slotProps: {
    paper: {
      sx: {
        border: `1px solid ${alpha("#0f172a", 0.08)}`,
        borderRadius: 2,
        boxShadow: "0 18px 40px rgba(15,23,42,0.12)",
        maxHeight: 340,
        mt: 0.5,
      },
    },
  },
  transitionDuration: 90,
};

const ERG_SHEET_COLORS = {
  frame: "#f8fafc",
  header: "#f1f5f9",
  rowOdd: "#ffffff",
  rowEven: "#fbfdff",
  hover: "#f0f7ff",
  hoverBorder: "#e11d48",
  selected: "#eef6ff",
  selectedHover: "#e6f2ff",
};

function toChipProps(tone: BadgeTone) {
  if (tone === "outline") {
    return { variant: "outlined" as const, color: "default" as const };
  }
  const colorMap: Record<Exclude<BadgeTone, "outline">, "primary" | "secondary" | "success" | "warning" | "error"> = {
    primary: "primary",
    secondary: "secondary",
    success: "success",
    warning: "warning",
    danger: "error",
  };
  return { variant: "filled" as const, color: colorMap[tone] };
}

function Badge({ tone, className, children }: { tone: BadgeTone; className?: string; children: ReactNode }) {
  return <Chip size="small" label={children} className={className} {...toChipProps(tone)} />;
}

function CardHeader({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={className}>{children}</div>;
}

function CardTitle({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={className}>{children}</div>;
}

function CardDescription({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={className}>{children}</div>;
}

export function QuestionBankWorkspace({
  activeLeaf,
  contentScope,
  onCreateQuiz,
}: {
  activeLeaf: DashboardLeaf;
  contentScope: ContentScope;
  onCreateQuiz: (questions: QuestionBankQuestion[], options?: CreateQuizFromBankOptions) => void;
  onOpenQuiz?: (quizId: string) => void;
}) {
  const { locale } = useI18n();
  const copy: QuestionBankCopy = locale === "vi"
    ? {
        ...enCopy,
        ...viCopy,
        ...viPackageCopy,
        table: { ...enCopy.table, ...viCopy.table, ...viPackageCopy.table },
        quizTable: { ...enCopy.quizTable, ...viCopy.quizTable },
      }
    : enCopy;
  const view = activeLeaf.variant === "quiz-bank" ? "quizzes" : "questions";
  const [subjectId, setSubjectId] = useState<QuestionBankSubjectId>("");
  const [levelId, setLevelId] = useState("");
  const [topicId, setTopicId] = useState("all");
  const [quizKind, setQuizKind] = useState<QuizKindFilter>("all");
  const [questionPage, setQuestionPage] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [questionCache, setQuestionCache] = useState<Record<string, QuestionBankQuestion>>({});
  const [quizPackageEdit, setQuizPackageEdit] = useState<QuizPackageEditDraft | null>(null);
  const [autoTopicIds, setAutoTopicIds] = useState<string[]>([]);
  const [autoCount, setAutoCount] = useState(10);
  const deleteQuizMutation = useDeleteQuizEditorQuizMutation();
  const createQuestionMutation = useCreateQuestionBankQuestionMutation();
  const updateQuestionMutation = useUpdateQuestionBankQuestionMutation();
  const [questionForm, setQuestionForm] = useState<{
    mode: QuestionFormMode;
    question?: QuestionBankQuestion;
    draft: QuestionFormDraft;
  } | null>(null);
  const [quizCreateDraft, setQuizCreateDraft] = useState<QuizCreateDraft | null>(null);
  const debouncedSearchValue = useDebouncedValue(searchValue);

  const questionBankFilters = useMemo(
    () => ({
      includeQuestions: true,
      levelId: view === "questions" ? levelId || undefined : undefined,
      page: view === "questions" ? questionPage : 0,
      quizKind: view === "quizzes" && quizKind !== "all" ? quizKind : undefined,
      search: debouncedSearchValue || undefined,
      size: 50,
      status: view === "questions" ? "ready" : undefined,
      subjectId: view === "questions" ? subjectId || undefined : undefined,
      topicId: view === "questions" && topicId !== "all" ? topicId : undefined,
    }),
    [debouncedSearchValue, levelId, questionPage, quizKind, subjectId, topicId, view],
  );
  const questionBankQuery = useQuestionBankWorkspaceQuery(undefined, questionBankFilters);
  const questionBankData = questionBankQuery.isError ? EMPTY_QUESTION_BANK_DATA : questionBankQuery.data ?? EMPTY_QUESTION_BANK_DATA;
  const { questions, quizzes, subjects } = questionBankData;
  const isQuestionBankFetching = questionBankQuery.isFetching;

  useEffect(() => {
    if (!questions.length) return;
    setQuestionCache((current) => {
      const next = { ...current };
      questions.forEach((question) => {
        next[question.id] = question;
      });
      return next;
    });
  }, [questions]);

  useEffect(() => {
    setQuestionPage(0);
  }, [debouncedSearchValue, levelId, subjectId, topicId, view]);

  useEffect(() => {
    const nextSubject = subjects.find((subject) => subject.id === subjectId) ?? subjects[0];
    if (!nextSubject) return;

    const nextLevel = nextSubject.levels.find((level) => level.id === levelId) ?? nextSubject.levels[0];
    const nextLevelId = nextLevel?.id ?? "";
    const topicStillExists =
      topicId === "all" ||
      nextSubject.categories.some((category) => category.id === topicId && category.levelId === nextLevelId);

    if (nextSubject.id !== subjectId) {
      setSubjectId(nextSubject.id);
    }
    if (nextLevelId !== levelId) {
      setLevelId(nextLevelId);
    }
    if (!topicStillExists) {
      setTopicId("all");
    }

    const nextAutoTopicIds = getDefaultAutoTopicIds(subjects, nextSubject.id, nextLevelId);
    setAutoTopicIds((current) => {
      const currentStillValid =
        current.length > 0 &&
        current.every((id) =>
          nextSubject.categories.some((category) => category.id === id && category.levelId === nextLevelId),
        );
      return currentStillValid || arraysEqual(current, nextAutoTopicIds) ? current : nextAutoTopicIds;
    });
  }, [levelId, subjectId, subjects, topicId]);

  const activeSubject = useMemo(() => findQuestionBankSubject(subjects, subjectId), [subjectId, subjects]);
  const activeLevel = useMemo(() => findQuestionBankLevel(activeSubject, levelId), [activeSubject, levelId]);
  const levelTopics = useMemo(
    () => activeSubject.categories.filter((category) => category.levelId === activeLevel.id),
    [activeLevel.id, activeSubject.categories],
  );
  const visibleQuestions = useMemo(() => {
    return questions.filter((question) => {
      const matchesSubject = !subjectId || question.subjectId === subjectId;
      const matchesLevel = !activeLevel.id || question.levelId === activeLevel.id;
      const matchesTopic = topicId === "all" || question.categoryId === topicId;
      const matchesScope = canUseInScope(question.scope, contentScope);

      return matchesSubject && matchesLevel && matchesTopic && matchesScope;
    });
  }, [activeLevel.id, contentScope, questions, subjectId, topicId]);
  const selectedQuestions = useMemo(
    () => selectedIds.map((id) => questionCache[id]).filter((question): question is QuestionBankQuestion => Boolean(question) && canUseInScope(question.scope, contentScope)),
    [contentScope, questionCache, selectedIds],
  );

  const autoPickedQuestions = useMemo(() => {
    const candidates = questions
      .filter(
        (question) =>
          question.subjectId === subjectId &&
          question.levelId === activeLevel.id &&
          question.status === "ready" &&
          canUseInScope(question.scope, contentScope) &&
          autoTopicIds.includes(question.categoryId),
      )
      .sort((left, right) => pseudoRandomScore(left.id) - pseudoRandomScore(right.id));

    return candidates.slice(0, autoCount);
  }, [activeLevel.id, autoCount, autoTopicIds, contentScope, questions, subjectId]);

  const visibleQuizzes = useMemo(
    () =>
      quizzes.filter((quiz) => {
        const matchesKind = quizKind === "all" || quiz.kind === quizKind;
        const normalizedSearch = debouncedSearchValue.trim().toLowerCase();
        const matchesSearch =
          !normalizedSearch ||
          `${quiz.title} ${quiz.subjectLabel} ${quiz.levelLabel} ${quiz.topicLabels.join(" ")}`
            .toLowerCase()
            .includes(normalizedSearch);
        const matchesScope = canUseInScope(quiz.scope, contentScope);

        return matchesKind && matchesSearch && matchesScope;
      }),
    [contentScope, debouncedSearchValue, quizKind, quizzes],
  );

  const quizPackageEditQuestions = useMemo(
    () =>
      quizPackageEdit
        ? getQuizPackageQuestions(quizPackageEdit.quiz, questionCache)
        : [],
    [questionCache, quizPackageEdit],
  );

  const getTopicQuestionCount = (categoryId: string, targetLevelId = activeLevel.id) =>
    questions.filter(
      (question) =>
        question.subjectId === subjectId &&
        question.levelId === targetLevelId &&
        question.categoryId === categoryId &&
        canUseInScope(question.scope, contentScope),
    ).length;

  function pickSubject(nextSubjectId: string) {
    const nextSubject = findQuestionBankSubject(subjects, nextSubjectId);
    const nextLevel = nextSubject.levels[0];

    setSubjectId(nextSubject.id);
    setLevelId(nextLevel.id);
    setTopicId("all");
    setAutoTopicIds(getDefaultAutoTopicIds(subjects, nextSubject.id, nextLevel.id));
    setSelectedIds([]);
  }

  function pickLevel(nextLevelId: string) {
    setLevelId(nextLevelId);
    setTopicId("all");
    setAutoTopicIds(getDefaultAutoTopicIds(subjects, subjectId, nextLevelId));
    setSelectedIds([]);
  }

  function pickTopic(nextTopicId: string) {
    setTopicId(nextTopicId);
    setSelectedIds([]);
  }

  function changeSearch(nextSearchValue: string) {
    setSearchValue(nextSearchValue);
    setSelectedIds([]);
  }

  function toggleQuestion(questionId: string) {
    setSelectedIds((current) =>
      current.includes(questionId) ? current.filter((id) => id !== questionId) : [...current, questionId],
    );
  }

  function toggleVisibleQuestions() {
    const visibleIds = visibleQuestions.map((question) => question.id);
    if (!visibleIds.length) return;
    setSelectedIds((current) => {
      const visibleIdSet = new Set(visibleIds);
      const allVisibleSelected = visibleIds.every((questionId) => current.includes(questionId));
      if (allVisibleSelected) {
        return current.filter((questionId) => !visibleIdSet.has(questionId));
      }
      return Array.from(new Set([...current, ...visibleIds]));
    });
  }

  function toggleAutoTopic(topicIdToToggle: string) {
    setAutoTopicIds((current) =>
      current.includes(topicIdToToggle)
        ? current.filter((id) => id !== topicIdToToggle)
        : [...current, topicIdToToggle],
    );
  }

  function useAutoPick() {
    if (autoPickedQuestions.length < autoCount) return;
    setSelectedIds(autoPickedQuestions.map((question) => question.id));
  }

  function createQuizFromSelection() {
    if (selectedQuestions.length === 0) return;
    const firstQuestion = selectedQuestions[0];
    const totalPoints = getQuestionBankPackageTotalPoints(selectedQuestions);
    setQuizCreateDraft({
      kind: "train",
      title: firstQuestion ? `${firstQuestion.subjectLabel} - ${firstQuestion.levelLabel}` : "",
      passingRate: 80,
      passingScoreMode: "percent",
      passingScorePoints: Math.round(totalPoints * 0.8 * 100) / 100,
      playerSize: "standard",
      shuffleAnswers: true,
      shuffleQuestions: false,
      templateLayout: "classic",
      timeLimitEnabled: true,
      timeLimitMinutes: 20,
    });
  }

  function openUpdateQuizPackage(quiz: QuizBankItem) {
    const questionsInPackage = getQuizPackageQuestions(quiz, questionCache);
    const totalPoints = getQuestionBankPackageTotalPoints(questionsInPackage);
    const timeLimitMinutes = parseDurationMinutes(quiz.durationLabel);

    setQuizPackageEdit({
      quiz,
      draft: {
        kind: quiz.kind,
        title: quiz.title,
        passingRate: 80,
        passingScoreMode: "percent",
        passingScorePoints: Math.round(totalPoints * 0.8 * 100) / 100,
        playerSize: "standard",
        shuffleAnswers: true,
        shuffleQuestions: quiz.sourceMode === "auto-random",
        templateLayout: "classic",
        timeLimitEnabled: timeLimitMinutes > 0,
        timeLimitMinutes: timeLimitMinutes || 20,
      },
    });
  }

  function submitCreateQuizFromSelection(draft: QuizCreateDraft) {
    const title = draft.title.trim();
    if (!title) {
      toast.error(copy.quizTitleRequired);
      return;
    }
    if (selectedQuestions.length === 0) return;
    onCreateQuiz(selectedQuestions, {
      kind: draft.kind,
      title,
      passingScoreMode: draft.passingScoreMode,
      passingScorePoints: draft.passingScorePoints,
      passingRate: draft.passingRate,
      playerSize: draft.playerSize,
      shuffleAnswers: draft.shuffleAnswers,
      shuffleQuestions: draft.shuffleQuestions,
      templateLayout: draft.templateLayout,
      timeLimitMinutes: draft.timeLimitEnabled ? draft.timeLimitMinutes : 0,
    });
    setQuizCreateDraft(null);
  }

  function submitUpdateQuizPackage() {
    if (!quizPackageEdit?.draft.title.trim()) {
      toast.error(copy.quizTitleRequired);
      return;
    }
    toast.success(copy.updatePackageSuccess);
    setQuizPackageEdit(null);
  }

  function openEditQuestionForm(question: QuestionBankQuestion) {
    onCreateQuiz([question], {
      kind: "train",
      title: `${question.subjectLabel} - ${question.levelLabel} - ${question.categoryLabel}`,
      passingScoreMode: "percent",
      passingScorePoints: 1000,
      passingRate: 100,
      shuffleAnswers: false,
      shuffleQuestions: false,
      templateLayout: "classic",
      timeLimitMinutes: 0,
    });
  }

  async function submitQuestionForm(draft: QuestionFormDraft) {
    const targetTopicId = topicId === "all" ? levelTopics[0]?.id : topicId;
    if (!activeSubject.id || !activeLevel.id || !targetTopicId) {
      toast.error(copy.questionSaveMissingTaxonomy);
      return;
    }

    const payload: QuestionBankSaveQuestionInput = {
      questionId: questionForm?.question?.id,
      scopeType: contentScope.type === "global" ? "global" : "center",
      scopeId: contentScope.type === "center" ? contentScope.centerId : undefined,
      subjectId: activeSubject.id,
      levelId: activeLevel.id,
      topicId: targetTopicId,
      categoryId: targetTopicId,
      type: draft.type,
      stem: draft.stem.trim(),
      objective: draft.objective.trim(),
      difficulty: draft.difficulty,
      status: draft.status,
      tags: draft.tagsText.split(",").map((tag) => tag.trim()).filter(Boolean),
      choices: buildQuestionChoices(draft),
      answer: draft.answer.trim(),
    };

    if (!payload.stem) {
      toast.error(copy.questionSaveMissingStem);
      return;
    }

    try {
      if (questionForm?.mode === "edit") {
        await updateQuestionMutation.mutateAsync(payload);
        toast.success(copy.updateQuestionSuccess);
      } else {
        await createQuestionMutation.mutateAsync(payload);
        toast.success(copy.createQuestionSuccess);
      }
      setQuestionForm(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.saveQuestionError);
    }
  }

  async function deleteQuiz(quiz: QuizBankItem) {
    if (!window.confirm(copy.confirmDeleteQuiz(quiz.title))) return;
    try {
      await deleteQuizMutation.mutateAsync(quiz.id);
      toast.success(copy.deleteQuizSuccess);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.deleteQuizError);
    }
  }

  return (
    <DashboardPageShell
      title={activeLeaf.title}
      description={view === "questions" ? undefined : copy.description}
      breadcrumbs={view === "questions" ? [] : activeLeaf.breadcrumb}
      hideHeader={view === "questions" || view === "quizzes"}
      contentClassName={
        view === "questions" || view === "quizzes"
          ? "mx-0 w-full !max-w-none px-3 sm:px-4 lg:px-4 2xl:px-5"
          : undefined
      }
    >
      {questionBankQuery.isError ? (
        <QuestionBankSyncNotice
          message={copy.syncError}
          detail={questionBankQuery.error instanceof Error ? questionBankQuery.error.message : copy.syncErrorDetail}
        />
      ) : null}

      {view === "questions" ? (
        <div className="space-y-3">
          <QuestionBankCompactHeader
            title={activeLeaf.title}
          >
            <QuestionStructurePanel
              activeLevel={activeLevel}
              activeSubject={activeSubject}
              copy={copy}
              getTopicQuestionCount={getTopicQuestionCount}
              levelTopics={levelTopics}
              onLevelChange={pickLevel}
              onSubjectChange={pickSubject}
              onTopicChange={pickTopic}
              subjectId={subjectId}
              subjects={subjects}
              topicId={topicId}
            />
          </QuestionBankCompactHeader>
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px] 2xl:grid-cols-[minmax(0,1fr)_320px]">
            <QuestionLibrary
              copy={copy}
              contentScope={contentScope}
              onQuestionSelectAll={toggleVisibleQuestions}
              onQuestionToggle={toggleQuestion}
              isLoading={isQuestionBankFetching}
              onEditQuestion={openEditQuestionForm}
              onSearchChange={changeSearch}
              onPageChange={setQuestionPage}
              page={questionBankData.questionPage}
              searchValue={searchValue}
              selectedIds={selectedIds}
              visibleQuestions={visibleQuestions}
            />
            <QuizBuilderPanel
              autoCount={autoCount}
              autoPickedQuestions={autoPickedQuestions}
              autoTopicIds={autoTopicIds}
              copy={copy}
              getTopicQuestionCount={(topicId) => getTopicQuestionCount(topicId, activeLevel.id)}
              levelTopics={levelTopics}
              onAutoCountChange={(value) => setAutoCount(normalizeAutoCount(value))}
              onAutoPick={useAutoPick}
              onCreateQuiz={createQuizFromSelection}
              onTopicToggle={toggleAutoTopic}
              selectedQuestions={selectedQuestions}
            />
          </div>
        </div>
      ) : (
        <QuizBankPanel
          contentScope={contentScope}
          copy={copy}
          onKindChange={setQuizKind}
          onDeleteQuiz={deleteQuiz}
          onPreviewQuiz={openUpdateQuizPackage}
          onSearchChange={changeSearch}
          isLoading={isQuestionBankFetching}
          quizKind={quizKind}
          deletingQuizId={deleteQuizMutation.isPending ? deleteQuizMutation.variables : undefined}
          quizzes={visibleQuizzes}
          searchValue={searchValue}
        />
      )}
      {questionForm ? (
        <QuestionFormDialog
          copy={copy}
          draft={questionForm.draft}
          mode={questionForm.mode}
          onChange={(draft) => setQuestionForm((current) => (current ? { ...current, draft } : current))}
          onClose={() => setQuestionForm(null)}
          onSubmit={() => void submitQuestionForm(questionForm.draft)}
          saving={createQuestionMutation.isPending || updateQuestionMutation.isPending}
        />
      ) : null}
      {quizCreateDraft ? (
        <QuizCreatePackageDialog
          copy={copy}
          draft={quizCreateDraft}
          questions={selectedQuestions}
          onChange={setQuizCreateDraft}
          onClose={() => setQuizCreateDraft(null)}
          onSubmit={() => submitCreateQuizFromSelection(quizCreateDraft)}
        />
      ) : null}
      {quizPackageEdit ? (
        <QuizCreatePackageDialog
          copy={copy}
          description={copy.updatePackageDialogDescription(quizPackageEdit.quiz.questionCount)}
          draft={quizPackageEdit.draft}
          questions={quizPackageEditQuestions}
          submitLabel={copy.updatePackageConfirm}
          title={copy.updatePackageDialogTitle}
          onChange={(draft) => setQuizPackageEdit((current) => (current ? { ...current, draft } : current))}
          onClose={() => setQuizPackageEdit(null)}
          onSubmit={submitUpdateQuizPackage}
        />
      ) : null}
    </DashboardPageShell>
  );
}

function QuestionBankCompactHeader({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  const titleLines = splitCompactTitle(title);

  return (
    <Paper
      variant="outlined"
      sx={{
        borderColor: alpha("#0f172a", 0.08),
        borderRadius: 3,
        boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
        overflow: "hidden",
        position: "sticky",
        top: 0,
        zIndex: 12,
      }}
    >
      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={2}
        sx={{ alignItems: { xs: "stretch", lg: "center" }, p: { xs: 2, lg: 1.75 } }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: "center", justifyContent: "space-between", minWidth: { lg: 152 }, width: { lg: 152 } }}
        >
          <Typography
            component="h1"
            sx={{
              color: "#111827",
              fontSize: 16,
              fontWeight: 900,
              lineHeight: 1.12,
              letterSpacing: 0,
            }}
          >
            <Box component="span" sx={{ display: "block" }}>{titleLines[0]}</Box>
            {titleLines[1] ? <Box component="span" sx={{ display: "block" }}>{titleLines[1]}</Box> : null}
          </Typography>
        </Stack>
        <Box sx={{ minWidth: 0, flex: 1 }}>{children}</Box>
      </Stack>
    </Paper>
  );
}

function splitCompactTitle(title: string) {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 2) return [title, ""];
  const splitIndex = Math.ceil(words.length / 2);
  return [words.slice(0, splitIndex).join(" "), words.slice(splitIndex).join(" ")];
}

function QuestionStructurePanel({
  activeLevel,
  activeSubject,
  copy,
  getTopicQuestionCount,
  levelTopics,
  onLevelChange,
  onSubjectChange,
  onTopicChange,
  subjectId,
  subjects,
  topicId,
}: {
  activeLevel: QuestionBankLevel;
  activeSubject: QuestionBankSubject;
  copy: QuestionBankCopy;
  getTopicQuestionCount: (categoryId: string, targetLevelId?: string) => number;
  levelTopics: QuestionBankCategory[];
  onLevelChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onTopicChange: (value: string) => void;
  subjectId: QuestionBankSubjectId;
  subjects: QuestionBankSubject[];
  topicId: string;
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 1.25,
        gridTemplateColumns: {
          xs: "1fr",
          md: "repeat(3, minmax(0, 1fr))",
        },
      }}
    >
      <SelectControl
        label={copy.subjectLabel}
        value={subjectId}
        onChange={onSubjectChange}
        hideDescription
        options={subjects.map((subject) => ({
          value: subject.id,
          label: subject.label,
          description: subject.description,
        }))}
      />
      <SelectControl
        label={copy.levelLabel}
        value={activeLevel.id}
        onChange={onLevelChange}
        hideDescription
        options={activeSubject.levels.map((level) => ({
          value: level.id,
          label: level.label,
          description: level.description,
        }))}
      />
      <SelectControl
        label={copy.topicLabel}
        value={topicId}
        onChange={onTopicChange}
        hideDescription
        options={[
          { value: "all", label: copy.allTopics, description: copy.allTopicsDescription },
          ...levelTopics.map((topic) => ({
            value: topic.id,
            label: topic.label,
            description: copy.questionCount(getTopicQuestionCount(topic.id, activeLevel.id)),
          })),
        ]}
      />
    </Box>
  );
}

function QuestionLibrary({
  copy,
  isLoading,
  onEditQuestion,
  onPageChange,
  onQuestionSelectAll,
  onQuestionToggle,
  onSearchChange,
  page,
  searchValue,
  selectedIds,
  visibleQuestions,
}: {
  copy: QuestionBankCopy;
  contentScope: ContentScope;
  isLoading: boolean;
  onEditQuestion: (question: QuestionBankQuestion) => void;
  onPageChange: (page: number) => void;
  onQuestionSelectAll: () => void;
  onQuestionToggle: (questionId: string) => void;
  onSearchChange: (value: string) => void;
  page: QuestionBankApiData["questionPage"];
  searchValue: string;
  selectedIds: string[];
  visibleQuestions: QuestionBankQuestion[];
}) {
  const visibleQuestionIds = visibleQuestions.map((question) => question.id);
  const allVisibleSelected =
    visibleQuestionIds.length > 0 && visibleQuestionIds.every((questionId) => selectedIds.includes(questionId));
  const someVisibleSelected = visibleQuestionIds.some((questionId) => selectedIds.includes(questionId));

  return (
    <Paper
      variant="outlined"
      sx={{
        bgcolor: "transparent",
        borderColor: "transparent",
        borderRadius: 0,
        boxShadow: "none",
        overflow: "hidden",
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{
          alignItems: { xs: "stretch", md: "center" },
          borderBottom: `1px solid ${alpha("#0f172a", 0.06)}`,
          justifyContent: "space-between",
          px: 2.5,
          py: 2,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: "#111827", fontSize: 16, fontWeight: 850, lineHeight: 1.2 }}>
            {copy.libraryTitle}
          </Typography>
          <Typography sx={{ color: "#64748b", fontSize: 12.5, fontWeight: 650, mt: 0.35 }}>
            {copy.libraryDescription(page.totalItems)}
          </Typography>
        </Box>
        <TextField
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={copy.searchPlaceholder}
          size="small"
          sx={{
            width: { xs: "100%", md: 360 },
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              bgcolor: "#fff",
              boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
            },
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon style={{ color: "#94a3b8", height: 18, width: 18 }} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Stack>

      <Box sx={{ bgcolor: ERG_SHEET_COLORS.frame, p: 0 }}>
        <Box
          sx={{
            alignItems: "center",
            bgcolor: ERG_SHEET_COLORS.header,
            color: "#64748b",
            display: "grid",
            fontSize: 11,
            fontWeight: 850,
            gap: 0,
            gridTemplateColumns: {
              xs: "40px minmax(0,1fr) 70px",
              md: "40px minmax(0,1fr) minmax(140px,190px) 78px",
            },
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            "& > *": {
              alignItems: "center",
              borderRight: "2px solid #fff",
              display: "flex",
              minHeight: 40,
              px: 1.5,
            },
            "& > *:last-child": { borderRight: 0 },
          }}
        >
          <Checkbox
            checked={allVisibleSelected}
            indeterminate={!allVisibleSelected && someVisibleSelected}
            disabled={!visibleQuestionIds.length || isLoading}
            onChange={onQuestionSelectAll}
            slotProps={{ input: { "aria-label": copy.selectAllVisible } }}
            size="small"
            sx={{ justifySelf: "center", p: 0.5 }}
          />
          <span>{copy.table.question}</span>
          <Box
            component="span"
            sx={{
              alignItems: "center",
              display: { xs: "none", md: "flex" },
              justifyContent: "center",
              minHeight: 40,
              textAlign: "center",
            }}
          >
            {copy.table.topic}
          </Box>
          <Box
            component="span"
            sx={{
              alignItems: "center",
              display: "flex",
              justifyContent: "center",
              minHeight: 40,
              textAlign: "center",
            }}
          >
            {copy.table.actions}
          </Box>
        </Box>

        <Stack spacing={0}>
          {isLoading ? (
            <QuestionSheetSkeletonRows rowCount={Math.max(visibleQuestions.length || 0, 8)} />
          ) : visibleQuestions.map((question, index) => {
            const selected = selectedIds.includes(question.id);

            return (
              <Box
                key={question.id}
                role="button"
                tabIndex={0}
                onClick={() => onQuestionToggle(question.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onQuestionToggle(question.id);
                  }
                }}
                sx={{
                  alignItems: "center",
                  bgcolor: selected ? ERG_SHEET_COLORS.selected : index % 2 === 0 ? ERG_SHEET_COLORS.rowOdd : ERG_SHEET_COLORS.rowEven,
                  borderBottom: "2px solid #fff",
                  boxShadow: selected ? "inset 3px 0 0 #0f6cbd" : "none",
                  cursor: "pointer",
                  display: "grid",
                  gap: 0,
                  gridTemplateColumns: {
                    xs: "40px minmax(0,1fr) 70px",
                    md: "40px minmax(0,1fr) minmax(140px,190px) 78px",
                  },
                  transition: "background-color 140ms ease, border-color 140ms ease, box-shadow 140ms ease",
                  "& > *": {
                    borderRight: "2px solid #fff",
                    minHeight: 58,
                    px: 1.5,
                    py: 1.2,
                  },
                  "& > *:last-child": { borderRight: 0 },
                  "&:hover": {
                    bgcolor: selected ? ERG_SHEET_COLORS.selectedHover : ERG_SHEET_COLORS.hover,
                    boxShadow: `inset 3px 0 0 ${ERG_SHEET_COLORS.hoverBorder}`,
                  },
                }}
              >
                <Box onClick={(event) => event.stopPropagation()} sx={{ justifySelf: "center" }}>
                  <Checkbox
                    checked={selected}
                    onChange={() => onQuestionToggle(question.id)}
                    slotProps={{ input: { "aria-label": copy.selectQuestionLabel(question.stem) } }}
                    size="small"
                    sx={{ p: 0.5 }}
                  />
                </Box>

                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    title={question.stem}
                    sx={{
                      color: "#111827",
                      display: "-webkit-box",
                      fontSize: 14,
                      fontWeight: 760,
                      lineHeight: 1.45,
                      overflow: "hidden",
                      WebkitBoxOrient: "vertical",
                      WebkitLineClamp: 2,
                    }}
                  >
                    {question.stem}
                  </Typography>
                  <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", mt: 0.5, minWidth: 0 }}>
                    <Typography
                      sx={{
                        color: "#64748b",
                        flex: "0 1 auto",
                        fontSize: 12.5,
                        fontWeight: 550,
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {question.objective}
                    </Typography>
                    <Chip
                      label={copy.scopeLabel(question.scope)}
                      size="small"
                      sx={{
                        bgcolor: alpha("#0f6cbd", 0.08),
                        color: "#0f5f9f",
                        flexShrink: 0,
                        fontSize: 11,
                        fontWeight: 800,
                        height: 22,
                      }}
                    />
                    <Chip
                      label={question.categoryLabel}
                      size="small"
                      sx={{
                        display: { xs: "inline-flex", md: "none" },
                        flexShrink: 0,
                        fontSize: 11,
                        fontWeight: 750,
                        height: 22,
                      }}
                    />
                  </Stack>
                </Box>

                <Box sx={{ alignItems: "center", display: { xs: "none", md: "flex" }, justifyContent: "center", minWidth: 0 }}>
                  <Chip
                    label={question.categoryLabel}
                    size="small"
                    sx={{
                      bgcolor: "#fff",
                      border: `1px solid ${alpha("#64748b", 0.16)}`,
                      color: "#475569",
                      fontSize: 12,
                      fontWeight: 750,
                      maxWidth: "100%",
                    }}
                  />
                </Box>

                <Box onClick={(event) => event.stopPropagation()} sx={{ alignItems: "center", display: "flex", justifyContent: "center" }}>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => onEditQuestion(question)}
                    sx={{ borderRadius: 2, fontSize: 12, fontWeight: 800, minWidth: 0, px: 1 }}
                  >
                    {copy.editQuestion}
                  </Button>
                </Box>
              </Box>
            );
          })}
          {!isLoading && visibleQuestions.length === 0 ? (
            <Paper
              variant="outlined"
              sx={{
                alignItems: "center",
                borderColor: alpha("#64748b", 0.18),
                borderRadius: 0,
                borderStyle: "dashed",
                color: "#94a3b8",
                display: "flex",
                fontSize: 14,
                fontStyle: "italic",
                fontWeight: 650,
                justifyContent: "center",
                minHeight: 116,
              }}
            >
              {copy.noResults}
            </Paper>
          ) : null}
        </Stack>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{
            alignItems: { xs: "stretch", sm: "center" },
            bgcolor: "#fff",
            borderTop: "2px solid #fff",
            justifyContent: "space-between",
            px: 2,
            py: 1.5,
          }}
        >
          <Typography sx={{ color: "#64748b", fontSize: 12.5, fontWeight: 650 }}>
            {copy.pageSummary(page.page + 1, Math.max(page.totalPages, 1), page.totalItems)}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
            <Button
              size="small"
              variant="outlined"
              disabled={!page.hasPrevious}
              onClick={() => onPageChange(Math.max(0, page.page - 1))}
              sx={{ borderRadius: 2, fontWeight: 750 }}
            >
              {copy.previousPage}
            </Button>
            <Button
              size="small"
              variant="outlined"
              disabled={!page.hasNext}
              onClick={() => onPageChange(page.page + 1)}
              sx={{ borderRadius: 2, fontWeight: 750 }}
            >
              {copy.nextPage}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Paper>
  );
}

function QuestionSheetSkeletonRows({ rowCount }: { rowCount: number }) {
  return (
    <>
      {Array.from({ length: Math.min(Math.max(rowCount, 6), 12) }).map((_, index) => (
        <Box
          key={`question-skeleton-${index}`}
          sx={{
            alignItems: "center",
            bgcolor: index % 2 === 0 ? ERG_SHEET_COLORS.rowOdd : ERG_SHEET_COLORS.rowEven,
            borderBottom: "2px solid #fff",
            display: "grid",
            gap: 0,
            gridTemplateColumns: {
              xs: "40px minmax(0,1fr) 70px",
              md: "40px minmax(0,1fr) minmax(140px,190px) 78px",
            },
            "& > *": {
              borderRight: "2px solid #fff",
              minHeight: 58,
              px: 1.5,
              py: 1.2,
            },
            "& > *:last-child": { borderRight: 0 },
          }}
        >
          <Box sx={{ alignItems: "center", display: "flex", justifyContent: "center" }}>
            <Skeleton variant="rounded" width={18} height={18} sx={{ borderRadius: 1 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Skeleton variant="text" width="62%" height={20} />
            <Stack direction="row" spacing={0.75} sx={{ mt: 0.5 }}>
              <Skeleton variant="text" width="38%" height={16} />
              <Skeleton variant="rounded" width={56} height={20} sx={{ borderRadius: 10 }} />
            </Stack>
          </Box>
          <Box sx={{ alignItems: "center", display: { xs: "none", md: "flex" }, justifyContent: "center" }}>
            <Skeleton variant="rounded" width={92} height={24} sx={{ borderRadius: 10 }} />
          </Box>
          <Box sx={{ alignItems: "center", display: "flex", justifyContent: "center" }}>
            <Skeleton variant="text" width={36} height={20} />
          </Box>
        </Box>
      ))}
    </>
  );
}

function QuizSheetSkeletonRows({ columnCount, rowCount }: { columnCount: number; rowCount: number }) {
  return (
    <>
      {Array.from({ length: Math.min(Math.max(rowCount, 6), 12) }).map((_, rowIndex) => (
        <tr key={`quiz-skeleton-${rowIndex}`}>
          {Array.from({ length: columnCount }).map((__, columnIndex) => (
            <td key={`quiz-skeleton-${rowIndex}-${columnIndex}`}>
              <Skeleton
                variant={columnIndex === 0 ? "text" : "rounded"}
                width={columnIndex === 0 ? "76%" : columnIndex === columnCount - 1 ? 48 : 84}
                height={columnIndex === 0 ? 22 : 24}
                sx={{ borderRadius: columnIndex === 0 ? 1 : 10 }}
              />
              {columnIndex === 0 ? <Skeleton variant="text" width="46%" height={16} /> : null}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function LegacyQuestionLibrary({
  copy,
  contentScope,
  onEditQuestion,
  onPageChange,
  onQuestionSelectAll,
  onQuestionToggle,
  onSearchChange,
  page,
  searchValue,
  selectedIds,
  visibleQuestions,
}: {
  copy: QuestionBankCopy;
  contentScope: ContentScope;
  onEditQuestion: (question: QuestionBankQuestion) => void;
  onPageChange: (page: number) => void;
  onQuestionSelectAll: () => void;
  onQuestionToggle: (questionId: string) => void;
  onSearchChange: (value: string) => void;
  page: QuestionBankApiData["questionPage"];
  searchValue: string;
  selectedIds: string[];
  visibleQuestions: QuestionBankQuestion[];
}) {
  const visibleQuestionIds = visibleQuestions.map((question) => question.id);
  const allVisibleSelected =
    visibleQuestionIds.length > 0 && visibleQuestionIds.every((questionId) => selectedIds.includes(questionId));
  const someVisibleSelected = visibleQuestionIds.some((questionId) => selectedIds.includes(questionId));

  return (
    <Card className="overflow-hidden border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_18px_40px_rgba(15,23,42,0.05)]">
      <CardHeader className="border-b border-slate-100 bg-white px-4 py-3.5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="md:pl-[72px]">
            <CardTitle className="text-base font-bold text-slate-900">{copy.libraryTitle}</CardTitle>
            <CardDescription className="mt-0.5 text-xs text-slate-500">
              {copy.libraryDescription(page.totalItems)}
            </CardDescription>
          </div>
          <div className="relative w-full min-w-[220px] max-w-[340px]">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={copy.searchPlaceholder}
              className="h-10 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm shadow-sm transition focus:border-blue-300 focus:outline-none"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="bg-slate-50/55 p-3">
        <div className="mb-2 grid grid-cols-[44px_minmax(0,1fr)_64px] items-center gap-3 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 sm:grid-cols-[44px_minmax(0,1fr)_minmax(140px,190px)_72px]">
          <button
            type="button"
            aria-label={copy.selectAllVisible}
            disabled={!visibleQuestionIds.length}
            onClick={onQuestionSelectAll}
            className={cn(
              "mx-auto grid size-5 place-items-center rounded border border-slate-300 bg-white text-[11px] font-extrabold text-[var(--erg-blue)] shadow-sm transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40",
              allVisibleSelected ? "border-[var(--erg-blue)] bg-blue-50" : "",
            )}
          >
            {allVisibleSelected ? "âœ“" : someVisibleSelected ? "âˆ’" : ""}
          </button>
          <span className="pl-0">{copy.table.question}</span>
          <span className="hidden text-center sm:block">{copy.table.topic}</span>
          <span className="text-center">{copy.table.actions}</span>
        </div>
        <div className="space-y-1.5">
          {visibleQuestions.map((question, index) => {
            const selected = selectedIds.includes(question.id);
            const rowTone = getQuestionRowTone(question.scope, contentScope, selected, index);

            return (
              <div
                key={question.id}
                role="button"
                tabIndex={0}
                className={cn(
                  "group grid w-full cursor-pointer grid-cols-[44px_minmax(0,1fr)_64px] gap-3 rounded-xl border px-3 py-3 text-left transition-all duration-150 sm:grid-cols-[44px_minmax(0,1fr)_minmax(140px,190px)_72px]",
                  rowTone.className,
                )}
                onClick={() => onQuestionToggle(question.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onQuestionToggle(question.id);
                  }
                }}
              >
                <span className="flex items-center justify-center" onClick={(event) => event.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => onQuestionToggle(question.id)}
                    aria-label={copy.selectQuestionLabel(question.stem)}
                    className="size-4.5 rounded border-slate-300 text-[var(--erg-blue)] accent-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                  />
                </span>

                <span className="min-w-0">
                  <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                    <span className="line-clamp-2 text-sm font-semibold leading-relaxed text-slate-900" title={question.stem}>
                      {question.stem}
                    </span>
                  </span>
                  <span className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5">
                    <span className="line-clamp-1 max-w-full text-xs leading-relaxed text-slate-500">
                      {question.objective}
                    </span>
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", rowTone.badgeClassName)}>
                      {copy.scopeLabel(question.scope)}
                    </span>
                    <span className="rounded-full bg-white/75 px-2 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200/70 sm:hidden">
                      {question.categoryLabel}
                    </span>
                  </span>
                </span>

                <span className="hidden min-w-0 items-center justify-center sm:flex">
                  <span className="max-w-full truncate rounded-full bg-white/75 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200/70">
                    {question.categoryLabel}
                  </span>
                </span>

                <span className="flex items-center justify-center gap-1" onClick={(event) => event.stopPropagation()}>
                  <Button size="small" variant="text" onClick={() => onEditQuestion(question)} className="min-w-0 px-2 text-xs">
                    {copy.editQuestion}
                  </Button>
                </span>
              </div>
            );
          })}
          {visibleQuestions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm italic text-slate-400">
              {copy.noResults}
            </div>
          ) : null}
        </div>
        <div className="mt-3 flex flex-col gap-2 border-t border-slate-200/70 pt-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {copy.pageSummary(page.page + 1, Math.max(page.totalPages, 1), page.totalItems)}
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="small"
              variant="outlined"
              disabled={!page.hasPrevious}
              onClick={() => onPageChange(Math.max(0, page.page - 1))}
            >
              {copy.previousPage}
            </Button>
            <Button
              size="small"
              variant="outlined"
              disabled={!page.hasNext}
              onClick={() => onPageChange(page.page + 1)}
            >
              {copy.nextPage}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuestionFormDialog({
  copy,
  draft,
  mode,
  onChange,
  onClose,
  onSubmit,
  saving,
}: {
  copy: QuestionBankCopy;
  draft: QuestionFormDraft;
  mode: QuestionFormMode;
  onChange: (draft: QuestionFormDraft) => void;
  onClose: () => void;
  onSubmit: () => void;
  saving: boolean;
}) {
  const update = <K extends keyof QuestionFormDraft>(key: K, value: QuestionFormDraft[K]) => {
    onChange({ ...draft, [key]: value });
  };

  return (
    <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>{mode === "edit" ? copy.editQuestionTitle : copy.createQuestionTitle}</DialogTitle>
      <DialogContent className="space-y-4 pt-2">
        <TextField
          label={copy.questionStemLabel}
          value={draft.stem}
          onChange={(event) => update("stem", event.target.value)}
          fullWidth
          required
          multiline
          minRows={2}
        />
        <TextField
          label={copy.questionObjectiveLabel}
          value={draft.objective}
          onChange={(event) => update("objective", event.target.value)}
          fullWidth
          multiline
          minRows={2}
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <SelectControl
            label={copy.questionTypeLabel}
            value={draft.type}
            onChange={(value) => update("type", value as QuestionFormDraft["type"])}
            options={[
              { value: "multiple-choice", label: "Multiple choice" },
              { value: "multiple-response", label: "Multiple response" },
              { value: "true-false", label: "True/false" },
              { value: "short-answer", label: "Short answer" },
            ]}
          />
          <SelectControl
            label={copy.questionDifficultyLabel}
            value={draft.difficulty}
            onChange={(value) => update("difficulty", value as QuestionFormDraft["difficulty"])}
            options={[
              { value: "core", label: copy.difficulty.core },
              { value: "stretch", label: copy.difficulty.stretch },
              { value: "challenge", label: copy.difficulty.challenge },
            ]}
          />
          <SelectControl
            label={copy.questionStatusLabel}
            value={draft.status}
            onChange={(value) => update("status", value as QuestionFormDraft["status"])}
            options={[
              { value: "ready", label: copy.status.ready },
              { value: "reviewing", label: copy.status.reviewing },
              { value: "pilot", label: copy.status.pilot },
            ]}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="A" value={draft.choiceA} onChange={(event) => update("choiceA", event.target.value)} fullWidth />
          <TextField label="B" value={draft.choiceB} onChange={(event) => update("choiceB", event.target.value)} fullWidth />
          <TextField label="C" value={draft.choiceC} onChange={(event) => update("choiceC", event.target.value)} fullWidth />
          <TextField label="D" value={draft.choiceD} onChange={(event) => update("choiceD", event.target.value)} fullWidth />
        </div>
        <div className="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
          <TextField
            label={copy.questionAnswerLabel}
            value={draft.answer}
            onChange={(event) => update("answer", event.target.value)}
            fullWidth
          />
          <TextField
            label={copy.questionTagsLabel}
            value={draft.tagsText}
            onChange={(event) => update("tagsText", event.target.value)}
            fullWidth
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>{copy.cancel}</Button>
        <Button onClick={onSubmit} disabled={saving || !draft.stem.trim()} variant="contained">
          {saving ? copy.savingQuestion : copy.saveQuestion}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function buildQuestionChoices(draft: QuestionFormDraft) {
  const answer = draft.answer.trim().toLowerCase();
  return [
    ["a", draft.choiceA],
    ["b", draft.choiceB],
    ["c", draft.choiceC],
    ["d", draft.choiceD],
  ]
    .filter(([, label]) => label.trim())
    .map(([id, label]) => ({ id, label: label.trim(), correct: id === answer }));
}

function QuestionBankSyncNotice({ detail, message }: { detail: string; message: string }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm"
    >
      <div className="font-semibold">{message}</div>
      <div className="mt-1 text-xs leading-relaxed text-amber-900">{detail}</div>
    </div>
  );
}

function LabeledNumberField({
  disabled,
  label,
  onChange,
  value,
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <TextField
      disabled={disabled}
      fullWidth
      label={label}
      type="number"
      size="small"
      value={Number.isFinite(value) ? value : 0}
      onChange={(event) => onChange(Number(event.target.value))}
      sx={{
        "& .MuiOutlinedInput-root": {
          bgcolor: "#fff",
          borderRadius: 2,
          boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
        },
        "& .MuiInputLabel-root": {
          fontSize: 12,
          fontWeight: 800,
        },
      }}
    />
  );
}

function QuizBuilderPanel({
  autoCount,
  autoPickedQuestions,
  autoTopicIds,
  copy,
  getTopicQuestionCount,
  levelTopics,
  onAutoCountChange,
  onAutoPick,
  onCreateQuiz,
  onTopicToggle,
  selectedQuestions,
}: {
  autoCount: number;
  autoPickedQuestions: QuestionBankQuestion[];
  autoTopicIds: string[];
  copy: QuestionBankCopy;
  getTopicQuestionCount: (topicId: string) => number;
  levelTopics: Array<{ id: string; label: string }>;
  onAutoCountChange: (value: number) => void;
  onAutoPick: () => void;
  onCreateQuiz: () => void;
  onTopicToggle: (topicId: string) => void;
  selectedQuestions: QuestionBankQuestion[];
}) {
  const hasSelection = selectedQuestions.length > 0;
  const canAutoPick = autoTopicIds.length > 0 && autoPickedQuestions.length >= autoCount;
  return (
    <Paper
      variant="outlined"
      sx={{
        borderColor: alpha("#0f172a", 0.08),
        borderRadius: 3,
        boxShadow: "0 12px 32px rgba(15,23,42,0.045)",
        height: "fit-content",
        overflow: "visible",
        p: 2,
        position: { xl: "sticky" },
        top: { xl: 16 },
      }}
    >
      <Stack spacing={1.5}>
        <Box>
          <Typography sx={{ color: "#111827", fontSize: 16, fontWeight: 850, lineHeight: 1.2 }}>
            {copy.builderTitle}
          </Typography>
          <Typography sx={{ color: "#64748b", fontSize: 12.5, fontWeight: 550, mt: 0.5 }}>
            {copy.builderDescription}
          </Typography>
        </Box>

        <Box
          sx={{
            bgcolor: alpha("#0f6cbd", 0.045),
            border: `1px solid ${alpha("#0f6cbd", 0.14)}`,
            borderRadius: 2.5,
            p: 2,
          }}
        >
          <Typography sx={{ color: "#111827", fontSize: 40, fontWeight: 900, lineHeight: 1 }}>
            {selectedQuestions.length}
          </Typography>
          <Typography sx={{ color: "#64748b", fontSize: 11, fontWeight: 850, mt: 1, textTransform: "uppercase" }}>
            {copy.selectedQuestionCount}
          </Typography>
          <Button
            fullWidth
            variant="contained"
            onClick={onCreateQuiz}
            disabled={!hasSelection}
            sx={{ borderRadius: 2, fontSize: 14, fontWeight: 850, mt: 2, py: 1.2 }}
          >
            {copy.createQuizAction(selectedQuestions.length)}
          </Button>
        </Box>

        <Box
          sx={{
            bgcolor: "#f8fafc",
            border: `1px solid ${alpha("#0f172a", 0.07)}`,
            borderRadius: 2.5,
            p: 1.5,
          }}
        >
          <Typography sx={{ color: "#475569", fontSize: 11, fontWeight: 850, mb: 1.5, textTransform: "uppercase" }}>
            {copy.autoBuilderTitle}
          </Typography>
          <Stack spacing={1.5}>
          <LabeledNumberField
            label={copy.autoCountLabel}
            value={autoCount}
            onChange={onAutoCountChange}
          />
          
          <AutoTopicDropdown
            copy={copy}
            getTopicQuestionCount={getTopicQuestionCount}
            levelTopics={levelTopics}
            selectedTopicIds={autoTopicIds}
            onTopicToggle={onTopicToggle}
          />
          
          <Button
            fullWidth
            variant="contained"
            onClick={onAutoPick}
            disabled={!canAutoPick}
            sx={{
              bgcolor: canAutoPick ? "#111827" : "#e2e8f0",
              borderRadius: 2,
              boxShadow: "none",
              color: canAutoPick ? "#fff" : "#94a3b8",
              fontWeight: 800,
              py: 1.1,
              "&:hover": {
                bgcolor: canAutoPick ? "#1f2937" : "#e2e8f0",
                boxShadow: "none",
              },
            }}
          >
            {copy.autoPickAction}
          </Button>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}

function AutoTopicDropdown({
  copy,
  getTopicQuestionCount,
  levelTopics,
  onTopicToggle,
  selectedTopicIds,
}: {
  copy: QuestionBankCopy;
  getTopicQuestionCount: (topicId: string) => number;
  levelTopics: Array<{ id: string; label: string }>;
  onTopicToggle: (topicId: string) => void;
  selectedTopicIds: string[];
}) {
  const selectedTopics = levelTopics.filter((topic) => selectedTopicIds.includes(topic.id));
  const selectedTopicIdSet = new Set(selectedTopicIds);
  const summaryLabel = selectedTopics.length
    ? copy.autoTopicSelectedSummary(selectedTopics.length)
    : copy.autoTopicDropdownPlaceholder;

  function handleTopicChange(value: unknown) {
    const nextTopicIds = Array.isArray(value) ? value.map(String) : String(value).split(",").filter(Boolean);
    const nextTopicIdSet = new Set(nextTopicIds);

    levelTopics.forEach((topic) => {
      const currentlySelected = selectedTopicIdSet.has(topic.id);
      const shouldBeSelected = nextTopicIdSet.has(topic.id);
      if (currentlySelected !== shouldBeSelected) {
        onTopicToggle(topic.id);
      }
    });
  }

  return (
    <div className="space-y-3">
      <FormControl fullWidth size="small" className="bg-white">
        <InputLabel id="auto-topic-select-label">{copy.autoTopicLabel}</InputLabel>
        <Select
          labelId="auto-topic-select-label"
          multiple
          value={selectedTopicIds}
          MenuProps={QUESTION_BANK_SELECT_MENU_PROPS}
          onChange={(event) => handleTopicChange(event.target.value)}
          input={<OutlinedInput label={copy.autoTopicLabel} />}
          renderValue={() => (
            <span className={cn("font-bold", selectedTopics.length ? "text-slate-900" : "text-slate-400")}>
              {summaryLabel}
            </span>
          )}
          sx={{
            borderRadius: "12px",
            backgroundColor: "#fff",
            boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#d7e0ec" },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#93c5fd" },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#1976d2", borderWidth: 2 },
            "& .MuiSelect-select": {
              minHeight: "28px",
              display: "flex",
              alignItems: "center",
              paddingTop: "10px",
              paddingBottom: "10px",
              fontSize: "14px",
            },
          }}
        >
          {levelTopics.map((topic) => {
            const checked = selectedTopicIdSet.has(topic.id);
            const questionCount = getTopicQuestionCount(topic.id);

            return (
              <MenuItem key={topic.id} value={topic.id} className="gap-2 rounded-lg py-1.5">
                <Checkbox checked={checked} size="small" />
                <ListItemText
                  primary={
                    <span className={cn("block truncate", checked ? "font-bold text-blue-800" : "font-semibold text-slate-700")}>
                      {topic.label}
                    </span>
                  }
                />
                <span
                  className={cn(
                    "ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold",
                    checked ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100" : "bg-slate-100 text-slate-500",
                  )}
                >
                  {copy.questionCount(questionCount)}
                </span>
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>

    </div>
  );
}

function QuizBankPanel({
  contentScope,
  copy,
  deletingQuizId,
  isLoading,
  onDeleteQuiz,
  onKindChange,
  onPreviewQuiz,
  onSearchChange,
  quizKind,
  quizzes,
  searchValue,
}: {
  contentScope: ContentScope;
  copy: QuestionBankCopy;
  deletingQuizId?: string;
  isLoading: boolean;
  onDeleteQuiz: (quiz: QuizBankItem) => void;
  onKindChange: (value: QuizKindFilter) => void;
  onPreviewQuiz: (quiz: QuizBankItem) => void;
  onSearchChange: (value: string) => void;
  quizKind: QuizKindFilter;
  quizzes: QuizBankItem[];
  searchValue: string;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        bgcolor: "transparent",
        borderColor: "transparent",
        borderRadius: 0,
        boxShadow: "none",
        overflow: "hidden",
        width: "100%",
      }}
    >
      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={2}
        sx={{
          alignItems: { xs: "stretch", lg: "center" },
          bgcolor: "#fff",
          borderBottom: `1px solid ${alpha("#0f172a", 0.06)}`,
          borderRadius: 3,
          justifyContent: "space-between",
          mb: 1.5,
          px: 2.5,
          py: 2,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: "#111827", fontSize: 17, fontWeight: 850, lineHeight: 1.2 }}>
            {copy.quizBankTitle}
          </Typography>
          <Typography sx={{ color: "#64748b", fontSize: 12.5, fontWeight: 650, mt: 0.35 }}>
            {copy.quizBankDescription(quizzes.length)}
          </Typography>
        </Box>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.25}
          sx={{ alignItems: { xs: "stretch", md: "center" }, minWidth: { lg: 620 } }}
        >
          <TextField
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={copy.searchQuizPlaceholder}
            size="small"
            sx={{
              flex: 1,
              minWidth: { md: 320 },
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                bgcolor: "#fff",
                boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
              },
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon style={{ color: "#94a3b8", height: 18, width: 18 }} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <ToggleButtonGroup
            exclusive
            value={quizKind}
            onChange={(_, value) => {
              if (value) onKindChange(value as QuizKindFilter);
            }}
            size="small"
            sx={{
              alignSelf: { xs: "stretch", md: "center" },
              bgcolor: "#f8fafc",
              border: `1px solid ${alpha("#64748b", 0.16)}`,
              borderRadius: 999,
              boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
              gap: 0.5,
              p: 0.35,
              "& .MuiToggleButtonGroup-grouped": {
                border: 0,
                borderRadius: "999px !important",
                color: "#64748b",
                fontSize: 13,
                fontWeight: 800,
                minHeight: 32,
                minWidth: 84,
                px: 1.5,
                textTransform: "none",
                transition: "background-color 140ms ease, color 140ms ease, box-shadow 140ms ease",
                "&:hover": {
                  bgcolor: alpha("#0f6cbd", 0.07),
                  color: "#0f5f9f",
                },
                "&.Mui-selected": {
                  bgcolor: "#fff",
                  boxShadow: "0 6px 16px rgba(15,23,42,0.08)",
                  color: "#0f6cbd",
                },
                "&.Mui-selected:hover": {
                  bgcolor: "#fff",
                },
              },
            }}
          >
            <ToggleButton value="all">{copy.allQuizKinds}</ToggleButton>
            <ToggleButton value="train">{copy.quizKind.train}</ToggleButton>
            <ToggleButton value="test">{copy.quizKind.test}</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Stack>

      <Box sx={{ bgcolor: ERG_SHEET_COLORS.frame, overflowX: "auto" }}>
        <Box
          component="table"
          sx={{
            borderCollapse: "separate",
            borderSpacing: 0,
            minWidth: 980,
            tableLayout: "fixed",
            width: "100%",
            "& th": {
              bgcolor: ERG_SHEET_COLORS.header,
              borderBottom: "2px solid #fff",
              borderRight: "2px solid #fff",
              color: "#64748b",
              fontSize: 11,
              fontWeight: 850,
              height: 42,
              letterSpacing: "0.08em",
              px: 1.5,
              textAlign: "left",
              textTransform: "uppercase",
            },
            "& th:last-child, & td:last-child": { borderRight: 0 },
            "& td": {
              borderBottom: "2px solid #fff",
              borderRight: "2px solid #fff",
              color: "#334155",
              fontSize: 13,
              px: 1.5,
              py: 1.2,
              verticalAlign: "middle",
            },
            "& tbody tr": {
              bgcolor: ERG_SHEET_COLORS.rowOdd,
              cursor: "pointer",
              transition: "background-color 140ms ease",
            },
            "& tbody tr:nth-of-type(even)": { bgcolor: ERG_SHEET_COLORS.rowEven },
            "& tbody tr:hover": {
              bgcolor: ERG_SHEET_COLORS.hover,
              boxShadow: `inset 3px 0 0 ${ERG_SHEET_COLORS.hoverBorder}`,
            },
          }}
        >
          <Box component="colgroup">
            <Box component="col" sx={{ width: "38%" }} />
            <Box component="col" sx={{ width: "12%" }} />
            <Box component="col" sx={{ width: "11%" }} />
            <Box component="col" sx={{ width: "11%" }} />
            <Box component="col" sx={{ width: "11%" }} />
            <Box component="col" sx={{ width: "10%" }} />
            <Box component="col" sx={{ width: "7%" }} />
          </Box>
          <thead>
            <tr>
              <th>{copy.quizTable.title}</th>
              <th>{copy.quizTable.scope}</th>
              <th>{copy.quizTable.kind}</th>
              <th>{copy.quizTable.count}</th>
              <th>{copy.quizTable.duration}</th>
              <th>{copy.quizTable.status}</th>
              <th>{copy.quizTable.actions}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <QuizSheetSkeletonRows columnCount={7} rowCount={Math.max(quizzes.length || 0, 8)} />
            ) : quizzes.map((quiz) => {
              const isReady = quiz.status === "ready";
              const isReviewing = quiz.status === "reviewing";
              return (
                <tr
                  key={quiz.id}
                  aria-label={`${copy.openQuiz}: ${quiz.title}`}
                  onClick={() => onPreviewQuiz(quiz)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    onPreviewQuiz(quiz);
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <td>
                    <Typography sx={{ color: "#111827", fontSize: 13.5, fontWeight: 800, lineHeight: 1.35 }}>
                      {quiz.title}
                    </Typography>
                    <Typography noWrap sx={{ color: "#64748b", fontSize: 12, fontWeight: 550, mt: 0.4 }}>
                      {quiz.topicLabels.join(", ") || copy.otherTopic}
                    </Typography>
                    <Typography sx={{ color: "#94a3b8", fontSize: 11.5, fontWeight: 600, mt: 0.3 }}>
                      {quiz.subjectLabel} / {quiz.levelLabel}
                    </Typography>
                  </td>
                  <td>
                    <Badge tone={getScopeTone(quiz.scope, contentScope)}>
                      {copy.scopeLabel(quiz.scope)}
                    </Badge>
                  </td>
                  <td>
                    <Badge tone={quiz.kind === "test" ? "warning" : "secondary"}>
                      {copy.quizKind[quiz.kind]}
                    </Badge>
                  </td>
                  <td>
                    <Typography sx={{ color: "#111827", fontSize: 13, fontWeight: 800 }}>
                      {copy.questionCount(quiz.questionCount)}
                    </Typography>
                  </td>
                  <td>{quiz.durationLabel}</td>
                  <td>
                    <Badge tone={isReady ? "success" : isReviewing ? "warning" : "outline"}>
                      {copy.quizStatus[quiz.status]}
                    </Badge>
                  </td>
                  <td>
                    <Button
                      color="error"
                      disabled={deletingQuizId === quiz.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteQuiz(quiz);
                      }}
                      size="small"
                      variant="text"
                      sx={{ borderRadius: 2, fontSize: 12, fontWeight: 800, minWidth: 0, px: 1 }}
                    >
                      {deletingQuizId === quiz.id ? copy.deletingQuiz : copy.deleteQuiz}
                    </Button>
                  </td>
                </tr>
              );
            })}
            {!isLoading && quizzes.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <Box sx={{ color: "#94a3b8", fontSize: 14, fontStyle: "italic", fontWeight: 650, py: 6, textAlign: "center" }}>
                    {copy.noQuizzes}
                  </Box>
                </td>
              </tr>
            ) : null}
          </tbody>
        </Box>
      </Box>
    </Paper>
  );
}

function SelectControl({
  hideDescription = false,
  label,
  onChange,
  options,
  value,
}: {
  hideDescription?: boolean;
  label: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; description?: string }>;
  value: string;
}) {
  const selectedOption = options.find((option) => option.value === value);

  return (
    <Box>
      <FormControl fullWidth size="small">
        <InputLabel id={`${label}-select-label`}>{label}</InputLabel>
        <Select
          labelId={`${label}-select-label`}
          label={label}
          value={value}
          MenuProps={QUESTION_BANK_SELECT_MENU_PROPS}
          onChange={(event) => onChange(String(event.target.value))}
          sx={{
            borderRadius: 2,
            bgcolor: "#fff",
            fontSize: 14,
            fontWeight: 750,
            boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: alpha("#64748b", 0.22) },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: alpha("#0f6cbd", 0.45) },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#0f6cbd" },
          }}
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              <Stack spacing={0.25}>
                <Typography sx={{ fontSize: 14, fontWeight: 750 }}>{option.label}</Typography>
                {!hideDescription && option.description ? (
                  <Typography sx={{ color: "#64748b", fontSize: 12 }}>{option.description}</Typography>
                ) : null}
              </Stack>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {!hideDescription && selectedOption?.description ? (
        <Typography sx={{ mt: 0.75, color: "#64748b", fontSize: 11.5, fontWeight: 600 }} noWrap>
          {selectedOption.description}
        </Typography>
      ) : null}
    </Box>
  );
}

function canUseInScope(itemScope: ContentScope, activeScope: ContentScope) {
  if (activeScope.type === "global") {
    return itemScope.type === "global";
  }

  return itemScope.type === "global" || itemScope.centerId === activeScope.centerId;
}

function getScopeTone(itemScope: ContentScope, activeScope: ContentScope) {
  if (itemScope.type === "global") {
    return "primary";
  }

  return itemScope.type === activeScope.type && itemScope.centerId === activeScope.centerId ? "secondary" : "outline";
}

function getQuestionRowTone(itemScope: ContentScope, activeScope: ContentScope, selected: boolean, index: number) {
  if (selected) {
    return {
      className: "border-blue-200 bg-blue-50/75 shadow-[inset_3px_0_0_#0f6cbd] hover:bg-blue-50",
      badgeClassName: "bg-blue-100 text-blue-700 ring-1 ring-blue-200/70",
    };
  }

  if (itemScope.type === "global") {
    return {
      className: "border-sky-100/80 bg-sky-50/45 hover:border-sky-200 hover:bg-sky-50/70",
      badgeClassName: "bg-sky-100/80 text-sky-700 ring-1 ring-sky-200/70",
    };
  }

  if (itemScope.type === activeScope.type && itemScope.centerId === activeScope.centerId) {
    return {
      className: "border-emerald-100/80 bg-emerald-50/45 hover:border-emerald-200 hover:bg-emerald-50/70",
      badgeClassName: "bg-emerald-100/80 text-emerald-700 ring-1 ring-emerald-200/70",
    };
  }

  return {
    className: index % 2 === 0
      ? "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
      : "border-slate-100 bg-slate-50/70 hover:border-slate-200 hover:bg-slate-50",
    badgeClassName: "bg-slate-100 text-slate-600 ring-1 ring-slate-200/70",
  };
}

function pseudoRandomScore(value: string) {
  return value.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % 97;
}

function arraysEqual(left: string[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function normalizeAutoCount(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(100, Math.max(1, Math.round(value)));
}

function parseDurationMinutes(durationLabel: string) {
  const match = durationLabel.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function getQuizPackageQuestions(quiz: QuizBankItem, questionCache: Record<string, QuestionBankQuestion>) {
  return quiz.questionIds.map((questionId, index) => questionCache[questionId] ?? createQuizPackageQuestionFallback(quiz, questionId, index));
}

function createQuizPackageQuestionFallback(quiz: QuizBankItem, questionId: string, index: number): QuestionBankQuestion {
  const categoryLabel = quiz.topicLabels[0] ?? "Chủ đề";

  return {
    id: questionId,
    scope: quiz.scope,
    subjectId: quiz.subjectId,
    subjectLabel: quiz.subjectLabel,
    levelId: quiz.levelId,
    levelLabel: quiz.levelLabel,
    categoryId: quiz.categoryId ?? "",
    categoryLabel,
    gradeLabel: quiz.levelLabel,
    type: "multiple-choice",
    difficulty: "core",
    status: "ready",
    stem: `Câu hỏi ${index + 1}`,
    objective: "",
    tags: [],
    masteryRate: 0,
    usageCount: 0,
    schoolsUsing: 0,
    lastUsedAt: "",
    recommendedCluster: categoryLabel,
  };
}

function findQuestionBankSubject(subjects: QuestionBankSubject[], subjectId: QuestionBankSubjectId) {
  return subjects.find((subject) => subject.id === subjectId) ?? subjects[0] ?? EMPTY_SUBJECT;
}

function findQuestionBankLevel(subject: QuestionBankSubject, levelId: string) {
  return subject.levels.find((level) => level.id === levelId) ?? subject.levels[0] ?? EMPTY_LEVEL;
}

function getDefaultAutoTopicIds(subjects: QuestionBankSubject[], subjectId: QuestionBankSubjectId, levelId: string) {
  return findQuestionBankSubject(subjects, subjectId)
    .categories.filter((category) => category.levelId === levelId)
    .slice(0, 2)
    .map((category) => category.id);
}

type QuestionBankCopy = typeof enCopy;

const viCopy = {
  badge: "Học liệu công ty",
  description: "Chọn đúng môn, level và chủ đề. Câu hỏi là nguồn gốc; bài luyện tập/kiểm tra là nội dung đã đóng gói để giáo viên giao lại.",
  createQuizAction: (count: number): string => (count > 0 ? `Tạo quiz từ ${count} câu` : "Tạo quiz"),
  workspaceTitle: "Bộ lọc chính",
  workspaceDescription: "Lọc theo môn, level và chủ đề.",
  subjectLabel: "Môn học",
  levelLabel: "Level",
  topicLabel: "Chủ đề",
  currentPathLabel: "Đang xem",
  scopeLabel: (scope: ContentScope): string => (scope.type === "global" ? "Toàn ERG" : scope.centerName),
  globalScopeDescription: "chỉ hiện học liệu dùng chung toàn công ty",
  centerScopeDescription: "hiện học liệu toàn ERG và riêng trung tâm",
  canManageGlobalScope: "Có quyền tạo global",
  topicGroupLabel: "Chủ đề",
  allTopics: "Tất cả",
  allTopicsDescription: "Toàn bộ chủ đề",
  questionCount: (count: number): string => `${count} câu`,
  quizCount: (count: number): string => `${count} bài tập`,
  libraryTitle: "Danh sách câu hỏi",
  libraryDescription: (count: number): string => `${count} câu phù hợp. Chọn câu để đóng gói quiz.`,
  pageSummary: (page: number, totalPages: number, totalItems: number): string => `Trang ${page}/${totalPages} - ${totalItems} câu`,
  previousPage: "Trước",
  nextPage: "Tiếp",
  searchPlaceholder: "Tìm câu hỏi...",
  table: {
    select: "Chọn",
    question: "Câu hỏi",
    scope: "Phạm vi",
    topic: "Chủ đề",
  },
  selectQuestionLabel: (question: string): string => `Chọn câu hỏi: ${question}`,
  difficulty: {
    core: "Cơ bản",
    stretch: "Nâng cao",
    challenge: "Khó",
  },
  status: {
    ready: "Sẵn sàng",
    reviewing: "Đang duyệt",
    pilot: "Thử nghiệm",
  },
  selectAction: "Chọn",
  selectedAction: "Đã chọn",
  noResults: "Không có câu hỏi phù hợp.",
  builderTitle: "Tạo quiz",
  builderDescription: "Đóng gói nhanh từ câu đã chọn.",
  createQuizDialogTitle: "Tạo bài tập",
  createQuizDialogDescription: (count: number): string => `Đặt tên và chế độ cho bài tập gồm ${count} câu đã chọn.`,
  quizTitleLabel: "Tên bài tập",
  quizKindLabel: "Chế độ làm bài",
  createQuizConfirm: "Tạo bài tập",
  quizTitleRequired: "Nhập tên bài tập trước khi tạo.",
  selectedQuestionCount: "câu đã chọn",
  clearSelection: "Bỏ chọn",
  emptySelection: "Chưa chọn câu nào.",
  moreQuestions: "câu khác",
  autoBuilderTitle: "Bốc tự động",
  autoCountLabel: "Số câu",
  autoTopicLabel: "Chủ đề dùng để bốc",
  autoTopicDropdownPlaceholder: "Chọn chủ đề",
  autoTopicSelectedSummary: (count: number): string => `${count} chủ đề đã chọn`,
  autoPreview: (count: number): string => `Hệ thống sẽ lấy ${count} câu sẵn sàng từ các chủ đề đã chọn.`,
  autoPickAction: "Bốc vào danh sách",
  quizBankTitle: "Danh sách quiz/bài tập",
  quizBankDescription: (subject: string, level: string, count: number): string => `${count} bài ${subject} / ${level} dùng chung trong công ty.`,
  allQuizKinds: "Tất cả",
  quizKind: {
    train: "Luyện tập",
    test: "Kiểm tra",
  },
  quizStatus: {
    ready: "Sẵn sàng",
    draft: "Nháp",
    reviewing: "Đang duyệt",
  },
  quizTable: {
    title: "Bài",
    scope: "Phạm vi",
    kind: "Loại",
    count: "Số câu",
    duration: "Thời gian",
    status: "Trạng thái",
    actions: "Thao tác",
  },
  otherTopic: "Khác",
  noQuizzes: "Chưa có quiz phù hợp.",
  searchQuizPlaceholder: "Tìm bài tập...",
  openQuiz: "Mở quiz",
  deleteQuiz: "Xóa",
  deletingQuiz: "Đang xóa...",
  deleteQuizSuccess: "Đã xóa quiz.",
  deleteQuizError: "Không thể xóa quiz.",
  confirmDeleteQuiz: (title: string): string => `Xóa quiz "${title}"?`,
  syncError: "Không tải được dữ liệu từ BE",
  syncErrorDetail: "Vui lòng kiểm tra kết nối, phiên đăng nhập hoặc quyền truy cập. FE không dùng mock khi API đã bật.",
};

const viPackageCopy = {
  description: "Chọn môn, level và chủ đề để quản lý ngân hàng câu hỏi. Giáo viên có thể chọn nhiều câu rồi đóng gói thành bài luyện tập hoặc bài kiểm tra.",
  createQuestion: "Tạo câu hỏi",
  createQuizAction: (count: number): string => (count > 0 ? `Tạo gói ${count} câu` : "Tạo gói"),
  libraryDescription: (count: number): string => `${count} câu phù hợp`,
  selectAllVisible: "Chọn tất cả câu đang hiển thị",
  table: {
    points: "Điểm",
  },
  builderTitle: "Tạo gói bài tập",
  builderDescription: "Chọn câu hỏi để đóng gói thành bài luyện tập hoặc bài kiểm tra.",
  createQuizDialogTitle: "Tạo gói bài tập",
  createQuizDialogDescription: (count: number): string => `Kiểm tra ${count} câu đã chọn và thiết lập cấu hình trước khi tạo gói.`,
  packageInfoTitle: "Thông tin gói",
  packageSettingsTitle: "Cài đặt khi làm bài",
  packagePreviewTitle: "Câu hỏi đã chọn",
  packagePreviewDescription: (count: number): string => `${count} câu sẽ được đưa vào gói bài tập.`,
  quizTitleLabel: "Tên gói bài tập",
  quizKindLabel: "Chế độ",
  timeLimitLabel: "Thời gian (phút)",
  noTimeLimitLabel: "Không giới hạn thời gian",
  totalPointsLabel: "Tổng điểm",
  requiredPointsPreviewLabel: "Cần đạt",
  passingScoreModeLabel: "Điểm yêu cầu đạt",
  passingScoreMode: {
    percent: "Theo %",
    points: "Theo điểm",
  },
  passingRateLabel: "Điểm đạt (%)",
  passingPointsLabel: "Điểm cần đạt",
  pointsValue: (points: number): string => `${points} điểm`,
  templateLayoutLabel: "Giao diện câu hỏi",
  playerSizeLabel: "Khổ hiển thị",
  shuffleQuestionsLabel: "Đảo thứ tự câu hỏi",
  shuffleAnswersLabel: "Đảo thứ tự đáp án",
  templateLayout: {
    classic: "Cổ điển",
    focus: "Tập trung",
    split: "Chia đôi",
  },
  playerSize: {
    standard: "Tiêu chuẩn",
    wide: "Rộng",
  },
  createQuizConfirm: "Tạo gói bài tập",
  updatePackageDialogTitle: "Cập nhật gói bài tập",
  updatePackageDialogDescription: (count: number): string => `Kiểm tra ${count} câu trong gói và cập nhật cấu hình trước khi lưu.`,
  updatePackageConfirm: "Cập nhật gói bài tập",
  updatePackageSuccess: "Đã cập nhật gói bài tập.",
  quizTitleRequired: "Nhập tên gói bài tập trước khi tạo.",
  quizBankTitle: "Danh sách gói bài tập",
  quizBankDescription: (count: number): string => `${count} gói bài tập trong ngân hàng. Nhấn vào một gói để xem cài đặt và danh sách câu hỏi.`,
  packageDetailTitle: "Chi tiết gói bài tập",
  packageDetailDescription: "Xem nhanh cấu hình và danh sách câu hỏi trong gói.",
  packageSettingsPreviewTitle: "Cài đặt gói",
  packageQuestionListTitle: "Danh sách câu hỏi",
  close: "Đóng",
  openPackage: "Mở gói bài tập",
  sourceModeLabel: "Nguồn câu hỏi",
  sourceMode: {
    manual: "Chọn thủ công",
    "auto-random": "Bốc tự động",
  },
  ownerLabel: "Người tạo",
  updatedAtLabel: "Cập nhật",
  subjectLevelLabel: "Môn / Level",
  topicsLabel: "Chủ đề",
  noTopicLabel: "Chưa gắn chủ đề",
  noQuestionDetails: "Chưa có nội dung câu hỏi trong dữ liệu hiện tại.",
  packageQuestionFallback: (id: string): string => `Câu hỏi ${id}`,
} satisfies Partial<Omit<QuestionBankCopy, "table">> & { table: Partial<QuestionBankCopy["table"]> };

const enCopy = {
  badge: "Company assets",
  description: "Pick subject, level, and topic. Questions are source items; Train/Test quizzes are packaged assignments teachers can reuse.",
  createQuizAction: (count: number): string => (count > 0 ? `Create package from ${count}` : "Create assignment package"),
  workspaceTitle: "Main filters",
  workspaceDescription: "Choose in order to filter the list.",
  subjectLabel: "Subject",
  levelLabel: "Level",
  topicLabel: "Topic",
  currentPathLabel: "Current path",
  scopeLabel: (scope: ContentScope): string => (scope.type === "global" ? "All ERG" : scope.centerName),
  globalScopeDescription: "only company-wide assets are shown",
  centerScopeDescription: "shows ERG-wide and center-only assets",
  canManageGlobalScope: "Can create global",
  topicGroupLabel: "Topics",
  allTopics: "All topics",
  allTopicsDescription: "show all",
  questionCount: (count: number): string => `${count} questions`,
  quizCount: (count: number): string => `${count} quizzes`,
  libraryTitle: "Question list",
  libraryDescription: (count: number): string => `${count} matching questions. Select questions to package an assignment.`,
  selectAllVisible: "Select all visible questions",
  pageSummary: (page: number, totalPages: number, totalItems: number): string => `Page ${page}/${totalPages} Â· ${totalItems} questions`,
  previousPage: "Previous",
  nextPage: "Next",
  searchPlaceholder: "Search questions...",
  table: {
    select: "Select",
    question: "Question",
    scope: "Scope",
    topic: "Topic",
    points: "Points",
    actions: "Actions",
  },
  selectQuestionLabel: (question: string): string => `Select question: ${question}`,
  difficulty: {
    core: "Core",
    stretch: "Stretch",
    challenge: "Hard",
  },
  status: {
    ready: "Ready",
    reviewing: "Reviewing",
    pilot: "Pilot",
  },
  selectAction: "Select",
  selectedAction: "Selected",
  createQuestion: "Create question",
  editQuestion: "Edit",
  deleteQuestion: "Delete",
  deletingQuestion: "Deleting...",
  createQuestionTitle: "Create question",
  editQuestionTitle: "Edit question",
  questionStemLabel: "Question text",
  questionObjectiveLabel: "Objective",
  questionTypeLabel: "Question type",
  questionDifficultyLabel: "Difficulty",
  questionStatusLabel: "Status",
  questionAnswerLabel: "Answer",
  questionTagsLabel: "Tags, comma-separated",
  saveQuestion: "Save question",
  savingQuestion: "Saving...",
  cancel: "Cancel",
  createQuestionSuccess: "Question created.",
  updateQuestionSuccess: "Question updated.",
  deleteQuestionSuccess: "Question deleted.",
  saveQuestionError: "Cannot save question.",
  deleteQuestionError: "Cannot delete question.",
  questionSaveMissingTaxonomy: "Choose subject, level, and topic before saving.",
  questionSaveMissingStem: "Enter the question text before saving.",
  confirmDeleteQuestion: (stem: string): string => `Delete question "${stem}"?`,
  noResults: "No questions match the current filters.",
  builderTitle: "Create assignment package",
  builderDescription: "Select questions to package a practice set or test.",
  createQuizDialogTitle: "Create assignment package",
  createQuizDialogDescription: (count: number): string => `Review ${count} selected questions and configure the package before creating it.`,
  packageInfoTitle: "Package info",
  packageSettingsTitle: "Attempt settings",
  packagePreviewTitle: "Selected questions",
  packagePreviewDescription: (count: number): string => `${count} questions will be included in this package.`,
  quizTitleLabel: "Package name",
  quizKindLabel: "Mode",
  timeLimitLabel: "Time limit (minutes)",
  noTimeLimitLabel: "No time limit",
  totalPointsLabel: "Total points",
  requiredPointsPreviewLabel: "Required",
  passingScoreModeLabel: "Passing score",
  passingScoreMode: {
    percent: "By percentage",
    points: "By points",
  },
  passingRateLabel: "Passing score (%)",
  passingPointsLabel: "Passing points",
  pointsValue: (points: number): string => `${points} pts`,
  templateLayoutLabel: "Question template",
  playerSizeLabel: "Player size",
  shuffleQuestionsLabel: "Shuffle questions",
  shuffleAnswersLabel: "Shuffle answers",
  templateLayout: {
    classic: "Classic",
    focus: "Focus",
    split: "Split",
  },
  playerSize: {
    standard: "Standard",
    wide: "Wide",
  },
  createQuizConfirm: "Create package",
  updatePackageDialogTitle: "Update assignment package",
  updatePackageDialogDescription: (count: number): string => `Review ${count} questions in this package and update its settings before saving.`,
  updatePackageConfirm: "Update package",
  updatePackageSuccess: "Assignment package updated.",
  quizTitleRequired: "Enter a package name before creating it.",
  selectedQuestionCount: "selected questions",
  clearSelection: "Clear",
  emptySelection: "No question selected yet.",
  moreQuestions: "more questions",
  autoBuilderTitle: "Auto-pick",
  autoCountLabel: "Question count",
  autoTopicLabel: "Topics to sample",
  autoTopicDropdownPlaceholder: "Choose topics",
  autoTopicSelectedSummary: (count: number): string => `${count} topics selected`,
  autoPreview: (count: number): string => `${count} ready questions will be picked from selected topics.`,
  autoPickAction: "Pick into list",
  quizBankTitle: "Assignment package list",
  quizBankDescription: (count: number): string => `${count} assignment packages in the bank. Select one to review settings and questions.`,
  allQuizKinds: "All",
  quizKind: {
    train: "Train",
    test: "Test",
  },
  quizStatus: {
    ready: "Ready",
    draft: "Draft",
    reviewing: "Reviewing",
  },
  quizTable: {
    title: "Item",
    scope: "Scope",
    kind: "Kind",
    count: "Questions",
    duration: "Time",
    status: "Status",
    actions: "Actions",
  },
  otherTopic: "Other",
  noQuizzes: "No quiz matches the current filters.",
  searchQuizPlaceholder: "Search quizzes...",
  openQuiz: "Open quiz",
  deleteQuiz: "Delete",
  deletingQuiz: "Deleting...",
  deleteQuizSuccess: "Quiz deleted.",
  deleteQuizError: "Cannot delete quiz.",
  confirmDeleteQuiz: (title: string): string => `Delete quiz "${title}"?`,
  packageDetailTitle: "Assignment package detail",
  packageDetailDescription: "Review settings and the included question list.",
  packageSettingsPreviewTitle: "Package settings",
  packageQuestionListTitle: "Question list",
  close: "Close",
  openPackage: "Open package",
  sourceModeLabel: "Question source",
  sourceMode: {
    manual: "Manual selection",
    "auto-random": "Auto picked",
  },
  ownerLabel: "Owner",
  updatedAtLabel: "Updated",
  subjectLevelLabel: "Subject / Level",
  topicsLabel: "Topics",
  noTopicLabel: "No topic",
  noQuestionDetails: "Question details are not available in the current data.",
  packageQuestionFallback: (id: string): string => `Question ${id}`,
  syncError: "Cannot load BE question-bank data",
  syncErrorDetail: "Check connection, session, or permissions. FE does not use mock data when the API is configured.",
};
