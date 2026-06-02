import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import SearchIcon from "@mui/icons-material/Search";
import { useQuery } from "@tanstack/react-query";

import {
  DashboardPageShell,
  DashboardSectionCard,
  DashboardSegmentedControl,
} from "@/components/dashboard/dashboard-page-shell";
import { Badge, Button, Input } from "@/components/ui/dashboard-kit";
import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
import { useI18n } from "@/platform/i18n";
import {
  questionBankQuestions,
  questionBankSubjects,
  quizBankItems,
} from "@/features/lcms/quiz/question-bank/api/mock-question-bank";
import { loadQuestionBankData } from "@/features/lcms/quiz/question-bank/api/question-bank-api";
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

type QuizKindFilter = "all" | QuizBankKind;

export function QuestionBankWorkspace({
  activeLeaf,
  canManageGlobalContent,
  contentScope,
  onCreateQuiz,
}: {
  activeLeaf: DashboardLeaf;
  canManageGlobalContent: boolean;
  contentScope: ContentScope;
  onCreateQuiz: (questions: QuestionBankQuestion[]) => void;
}) {
  const { locale } = useI18n();
  const copy = locale === "vi" ? viCopy : enCopy;
  const view = activeLeaf.variant === "quiz-bank" ? "quizzes" : "questions";
  const initialSubject = findQuestionBankSubject(questionBankSubjects, "ic3-gs6");
  const initialLevelId = initialSubject.levels[0]?.id ?? "";

  const [subjects, setSubjects] = useState<QuestionBankSubject[]>(questionBankSubjects);
  const [questions, setQuestions] = useState<QuestionBankQuestion[]>(questionBankQuestions);
  const [quizzes, setQuizzes] = useState<QuizBankItem[]>(quizBankItems);
  const [subjectId, setSubjectId] = useState<QuestionBankSubjectId>("ic3-gs6");
  const [levelId, setLevelId] = useState(initialLevelId);
  const [topicId, setTopicId] = useState("all");
  const [quizKind, setQuizKind] = useState<QuizKindFilter>("all");
  const [searchValue, setSearchValue] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [autoTopicIds, setAutoTopicIds] = useState<string[]>(() =>
    getDefaultAutoTopicIds(questionBankSubjects, "ic3-gs6", initialLevelId),
  );
  const [autoCount, setAutoCount] = useState(10);
  const deferredSearchValue = useDeferredValue(searchValue);

  const questionBankQuery = useQuery({
    queryKey: ["question-bank", "workspace"],
    queryFn: loadQuestionBankData,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const data = questionBankQuery.data;
    if (!data) return;

    const frameId = window.requestAnimationFrame(() => {
      const nextSubjects = data.subjects.length ? data.subjects : questionBankSubjects;
      const nextSubject = nextSubjects.find((subject) => subject.id === subjectId) ?? nextSubjects[0];
      const nextLevel = nextSubject.levels.find((level) => level.id === levelId) ?? nextSubject.levels[0];

      setSubjects(nextSubjects);
      setQuestions(data.questions.length ? data.questions : questionBankQuestions);
      setQuizzes(data.quizzes.length ? data.quizzes : quizBankItems);
      setSubjectId(nextSubject.id);
      setLevelId(nextLevel?.id ?? "");
      setTopicId("all");
      setAutoTopicIds(getDefaultAutoTopicIds(nextSubjects, nextSubject.id, nextLevel?.id ?? ""));
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [levelId, questionBankQuery.data, subjectId]);

  const activeSubject = useMemo(() => findQuestionBankSubject(subjects, subjectId), [subjectId, subjects]);
  const activeLevel = useMemo(() => findQuestionBankLevel(activeSubject, levelId), [activeSubject, levelId]);
  const levelTopics = useMemo(
    () => activeSubject.categories.filter((category) => category.levelId === activeLevel.id),
    [activeLevel.id, activeSubject.categories],
  );
  const activeTopic = useMemo(
    () => levelTopics.find((topic) => topic.id === topicId),
    [levelTopics, topicId],
  );

  const visibleQuestions = useMemo(() => {
    const keyword = deferredSearchValue.trim().toLowerCase();

    return questions.filter((question) => {
      const matchesSubject = question.subjectId === subjectId;
      const matchesLevel = question.levelId === activeLevel.id;
      const matchesTopic = topicId === "all" || question.categoryId === topicId;
      const matchesScope = canUseInScope(question.scope, contentScope);
      const haystack = [
        question.stem,
        question.objective,
        question.subjectLabel,
        question.levelLabel,
        question.categoryLabel,
        question.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      const matchesSearch = !keyword || haystack.includes(keyword);

      return matchesSubject && matchesLevel && matchesTopic && matchesScope && matchesSearch;
    });
  }, [activeLevel.id, contentScope, deferredSearchValue, questions, subjectId, topicId]);

  const selectedQuestions = useMemo(
    () => questions.filter((question) => selectedIds.includes(question.id) && canUseInScope(question.scope, contentScope)),
    [contentScope, questions, selectedIds],
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
        const matchesSubject = quiz.subjectId === subjectId;
        const matchesLevel = quiz.levelId === activeLevel.id;
        const matchesTopic = topicId === "all" || (activeTopic ? quiz.topicLabels.includes(activeTopic.label) : true);
        const matchesKind = quizKind === "all" || quiz.kind === quizKind;
        const matchesScope = canUseInScope(quiz.scope, contentScope);

        return matchesSubject && matchesLevel && matchesTopic && matchesKind && matchesScope;
      }),
    [activeLevel.id, activeTopic, contentScope, quizKind, quizzes, subjectId, topicId],
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

  function toggleQuestion(questionId: string) {
    setSelectedIds((current) =>
      current.includes(questionId) ? current.filter((id) => id !== questionId) : [...current, questionId],
    );
  }

  function toggleAutoTopic(topicIdToToggle: string) {
    setAutoTopicIds((current) =>
      current.includes(topicIdToToggle)
        ? current.filter((id) => id !== topicIdToToggle)
        : [...current, topicIdToToggle],
    );
  }

  function useAutoPick() {
    setSelectedIds(autoPickedQuestions.map((question) => question.id));
  }

  function createQuizFromSelection() {
    if (selectedQuestions.length === 0) return;
    onCreateQuiz(selectedQuestions);
  }

  return (
    <DashboardPageShell
      badge={copy.badge}
      title={activeLeaf.title}
      description={copy.description}
      breadcrumbs={activeLeaf.breadcrumb}
      actions={
        view === "questions" && selectedQuestions.length > 0 ? (
          <Button onClick={createQuizFromSelection} disabled={selectedQuestions.length === 0}>
            {copy.createQuizAction(selectedQuestions.length)}
          </Button>
        ) : null
      }
      headerContent={
        view === "questions" ? (
        <QuestionStructurePanel
          activeLevel={activeLevel}
          activeSubject={activeSubject}
          canManageGlobalContent={canManageGlobalContent}
          contentScope={contentScope}
          copy={copy}
          getTopicQuestionCount={getTopicQuestionCount}
          levelTopics={levelTopics}
          onLevelChange={pickLevel}
          onSubjectChange={pickSubject}
          onTopicChange={setTopicId}
          subjectId={subjectId}
          subjects={subjects}
          topicId={topicId}
        />
        ) : null
      }
    >
      {view === "quizzes" ? (
        <DashboardSectionCard title={copy.workspaceTitle} description={copy.workspaceDescription}>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[220px_220px_minmax(220px,1fr)]">
            <SelectControl
              label={copy.subjectLabel}
              value={subjectId}
              onChange={pickSubject}
              options={subjects.map((subject) => ({
                value: subject.id,
                label: subject.label,
                description: subject.description,
              }))}
            />
            <SelectControl
              label={copy.levelLabel}
              value={activeLevel.id}
              onChange={pickLevel}
              options={activeSubject.levels.map((level) => ({
                value: level.id,
                label: level.label,
                description: level.description,
              }))}
            />
            <SelectControl
              label={copy.topicLabel}
              value={topicId}
              onChange={setTopicId}
              options={[
                { value: "all", label: copy.allTopics, description: copy.allTopicsDescription },
                ...levelTopics.map((topic) => ({
                  value: topic.id,
                  label: topic.label,
                  description: copy.questionCount(getTopicQuestionCount(topic.id, activeLevel.id)),
                })),
              ]}
            />
          </div>
        </DashboardSectionCard>
      ) : null}

      {view === "questions" ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <QuestionLibrary
            copy={copy}
            contentScope={contentScope}
            onQuestionToggle={toggleQuestion}
            onSearchChange={setSearchValue}
            searchValue={searchValue}
            selectedIds={selectedIds}
            visibleQuestions={visibleQuestions}
          />
          <QuizBuilderPanel
            autoCount={autoCount}
            autoPickedQuestions={autoPickedQuestions}
            autoTopicIds={autoTopicIds}
            copy={copy}
            levelTopics={levelTopics}
            onAutoCountChange={setAutoCount}
            onAutoPick={useAutoPick}
            onClearSelection={() => setSelectedIds([])}
            onCreateQuiz={createQuizFromSelection}
            onTopicToggle={toggleAutoTopic}
            selectedQuestions={selectedQuestions}
          />
        </div>
      ) : (
        <QuizBankPanel
          activeLevelLabel={activeLevel.label}
          contentScope={contentScope}
          copy={copy}
          onKindChange={setQuizKind}
          quizKind={quizKind}
          quizzes={visibleQuizzes}
          subjectLabel={activeSubject.label}
        />
      )}
    </DashboardPageShell>
  );
}

function QuestionStructurePanel({
  activeLevel,
  activeSubject,
  canManageGlobalContent,
  contentScope,
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
  canManageGlobalContent: boolean;
  contentScope: ContentScope;
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
    <div className="space-y-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="grid flex-1 gap-3 md:grid-cols-2 xl:max-w-[520px]">
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
        </div>

        <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm">
          <span className="font-medium text-slate-500">{copy.currentPathLabel}</span>
          <span className="font-semibold text-slate-950">{activeSubject.label}</span>
          <span className="text-slate-300">/</span>
          <span className="font-semibold text-slate-950">{activeLevel.label}</span>
          <span className="hidden h-4 w-px bg-slate-200 sm:block" />
          <Badge tone={contentScope.type === "global" ? "primary" : "secondary"}>
            {copy.scopeLabel(contentScope)}
          </Badge>
          <span className="text-slate-500">
            {contentScope.type === "global" ? copy.globalScopeDescription : copy.centerScopeDescription}
          </span>
          {canManageGlobalContent ? <Badge tone="outline">{copy.canManageGlobalScope}</Badge> : null}
        </div>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="shrink-0 text-sm font-semibold text-slate-950">{copy.topicGroupLabel}</div>
          <div className="flex flex-wrap gap-2">
            <TopicChip active={topicId === "all"} onClick={() => onTopicChange("all")}>
              {copy.allTopics}
            </TopicChip>
            {levelTopics.map((topic) => (
              <TopicChip key={topic.id} active={topicId === topic.id} onClick={() => onTopicChange(topic.id)}>
                {topic.label} ({getTopicQuestionCount(topic.id, activeLevel.id)})
              </TopicChip>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionLibrary({
  copy,
  contentScope,
  onQuestionToggle,
  onSearchChange,
  searchValue,
  selectedIds,
  visibleQuestions,
}: {
  copy: QuestionBankCopy;
  contentScope: ContentScope;
  onQuestionToggle: (questionId: string) => void;
  onSearchChange: (value: string) => void;
  searchValue: string;
  selectedIds: string[];
  visibleQuestions: QuestionBankQuestion[];
}) {
  return (
    <DashboardSectionCard
      title={copy.libraryTitle}
      description={copy.libraryDescription(visibleQuestions.length)}
      action={
        <div className="relative w-full min-w-[220px] max-w-[340px]">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={copy.searchPlaceholder}
            className="pl-10"
          />
        </div>
      }
    >
      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <div className="hidden grid-cols-[56px_minmax(0,1fr)_170px_190px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 lg:grid">
          <span className="text-center">{copy.table.select}</span>
          <span>{copy.table.question}</span>
          <span>{copy.table.scope}</span>
          <span>{copy.table.topic}</span>
        </div>
        <div className="max-h-[620px] divide-y divide-slate-200 overflow-y-auto bg-white">
          {visibleQuestions.map((question) => {
            const selected = selectedIds.includes(question.id);

            return (
              <div
                key={question.id}
                className={cn(
                  "grid gap-3 px-4 py-4 transition lg:grid-cols-[56px_minmax(0,1fr)_170px_190px] lg:items-center",
                  selected ? "bg-blue-50/70" : "hover:bg-slate-50",
                )}
              >
                <label className="flex items-center gap-2 lg:justify-center">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => onQuestionToggle(question.id)}
                    aria-label={copy.selectQuestionLabel(question.stem)}
                    className="size-4 rounded border-slate-300 text-slate-950 accent-slate-950 focus:ring-slate-300"
                  />
                  <span className="text-sm font-medium text-slate-700 lg:hidden">
                    {selected ? copy.selectedAction : copy.selectAction}
                  </span>
                </label>
                <div className="min-w-0">
                  <div className="line-clamp-2 text-sm font-semibold leading-6 text-slate-950">{question.stem}</div>
                  <div className="mt-1 line-clamp-1 text-sm text-slate-500">{question.objective}</div>
                </div>
                <div>
                  <span className="font-medium text-slate-500 lg:hidden">{copy.table.scope}: </span>
                  <Badge tone={getScopeTone(question.scope, contentScope)}>{copy.scopeLabel(question.scope)}</Badge>
                </div>
                <div className="text-sm text-slate-600">
                  <span className="font-medium text-slate-950 lg:hidden">{copy.table.topic}: </span>
                  {question.categoryLabel}
                </div>
              </div>
            );
          })}
          {visibleQuestions.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">{copy.noResults}</div>
          ) : null}
        </div>
      </div>
    </DashboardSectionCard>
  );
}

function QuizBuilderPanel({
  autoCount,
  autoPickedQuestions,
  autoTopicIds,
  copy,
  levelTopics,
  onAutoCountChange,
  onAutoPick,
  onClearSelection,
  onCreateQuiz,
  onTopicToggle,
  selectedQuestions,
}: {
  autoCount: number;
  autoPickedQuestions: QuestionBankQuestion[];
  autoTopicIds: string[];
  copy: QuestionBankCopy;
  levelTopics: Array<{ id: string; label: string }>;
  onAutoCountChange: (value: number) => void;
  onAutoPick: () => void;
  onClearSelection: () => void;
  onCreateQuiz: () => void;
  onTopicToggle: (topicId: string) => void;
  selectedQuestions: QuestionBankQuestion[];
}) {
  return (
    <DashboardSectionCard title={copy.builderTitle} description={copy.builderDescription}>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">{selectedQuestions.length}</div>
            <div className="mt-1 text-sm text-slate-500">{copy.selectedQuestionCount}</div>
          </div>
          <Button variant="outline" size="sm" onClick={onClearSelection} disabled={selectedQuestions.length === 0}>
            {copy.clearSelection}
          </Button>
        </div>
        <Button className="mt-4 w-full" onClick={onCreateQuiz} disabled={selectedQuestions.length === 0}>
          {copy.createQuizAction(selectedQuestions.length)}
        </Button>
      </div>

      <SelectedQuestionList copy={copy} questions={selectedQuestions} />

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-semibold text-slate-950">{copy.autoBuilderTitle}</div>
        <div className="mt-3 grid gap-3">
          <SelectControl
            label={copy.autoCountLabel}
            value={String(autoCount)}
            onChange={(value) => onAutoCountChange(Number(value))}
            options={[
              { value: "5", label: "5" },
              { value: "10", label: "10" },
              { value: "15", label: "15" },
              { value: "20", label: "20" },
            ]}
          />
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{copy.autoTopicLabel}</div>
            <div className="mt-2 flex max-h-28 flex-wrap gap-2 overflow-y-auto pr-1">
              {levelTopics.map((topic) => (
                <TopicChip key={topic.id} active={autoTopicIds.includes(topic.id)} onClick={() => onTopicToggle(topic.id)}>
                  {topic.label}
                </TopicChip>
              ))}
            </div>
          </div>
          <div className="text-sm leading-6 text-slate-500">{copy.autoPreview(autoPickedQuestions.length)}</div>
          <Button className="w-full" onClick={onAutoPick} disabled={autoPickedQuestions.length === 0 || autoTopicIds.length === 0}>
            {copy.autoPickAction}
          </Button>
        </div>
      </div>
    </DashboardSectionCard>
  );
}

function SelectedQuestionList({ copy, questions }: { copy: QuestionBankCopy; questions: QuestionBankQuestion[] }) {
  if (questions.length === 0) {
    return <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm leading-6 text-slate-500">{copy.emptySelection}</div>;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      {questions.slice(0, 3).map((question) => (
        <div key={question.id} className="border-b border-slate-100 px-4 py-3 last:border-b-0">
          <div className="line-clamp-2 text-sm font-semibold leading-6 text-slate-950">{question.stem}</div>
          <div className="mt-1 text-xs text-slate-500">{question.categoryLabel}</div>
        </div>
      ))}
      {questions.length > 3 ? <div className="px-4 py-3 text-xs font-medium text-slate-500">+{questions.length - 3} {copy.moreQuestions}</div> : null}
    </div>
  );
}

function QuizBankPanel({
  activeLevelLabel,
  contentScope,
  copy,
  onKindChange,
  quizKind,
  quizzes,
  subjectLabel,
}: {
  activeLevelLabel: string;
  contentScope: ContentScope;
  copy: QuestionBankCopy;
  onKindChange: (value: QuizKindFilter) => void;
  quizKind: QuizKindFilter;
  quizzes: QuizBankItem[];
  subjectLabel: string;
}) {
  return (
    <DashboardSectionCard
      title={copy.quizBankTitle}
      description={copy.quizBankDescription(subjectLabel, activeLevelLabel, quizzes.length)}
      action={
        <DashboardSegmentedControl
          options={[
            { value: "all", label: copy.allQuizKinds },
            { value: "train", label: copy.quizKind.train },
            { value: "test", label: copy.quizKind.test },
          ]}
          value={quizKind}
          onChange={(value) => onKindChange(value as QuizKindFilter)}
        />
      }
    >
      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <div className="hidden grid-cols-[minmax(0,1.2fr)_110px_130px_100px_120px_120px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 lg:grid">
          <span>{copy.quizTable.title}</span>
          <span>{copy.quizTable.scope}</span>
          <span>{copy.quizTable.kind}</span>
          <span>{copy.quizTable.count}</span>
          <span>{copy.quizTable.duration}</span>
          <span>{copy.quizTable.status}</span>
        </div>
        <div className="max-h-[620px] divide-y divide-slate-200 overflow-y-auto bg-white">
          {quizzes.map((quiz) => (
            <article
              key={quiz.id}
              className="grid gap-3 px-4 py-4 transition hover:bg-slate-50 lg:grid-cols-[minmax(0,1.2fr)_110px_130px_100px_120px_120px] lg:items-center"
            >
              <div className="min-w-0">
                <h3 className="line-clamp-2 text-sm font-semibold leading-6 text-slate-950">{quiz.title}</h3>
                <p className="mt-1 line-clamp-1 text-sm text-slate-500">{quiz.topicLabels.join(", ") || copy.otherTopic}</p>
              </div>
              <div>
                <Badge tone={getScopeTone(quiz.scope, contentScope)}>{copy.scopeLabel(quiz.scope)}</Badge>
              </div>
              <div>
                <Badge tone={quiz.kind === "test" ? "warning" : "secondary"}>{copy.quizKind[quiz.kind]}</Badge>
              </div>
              <div className="text-sm font-semibold text-slate-950">
                <span className="font-medium text-slate-500 lg:hidden">{copy.quizTable.count}: </span>
                {copy.questionCount(quiz.questionCount)}
              </div>
              <div className="text-sm text-slate-600">
                <span className="font-medium text-slate-500 lg:hidden">{copy.quizTable.duration}: </span>
                {quiz.durationLabel}
              </div>
              <div>
                <Badge tone={quiz.status === "ready" ? "success" : quiz.status === "reviewing" ? "warning" : "outline"}>
                  {copy.quizStatus[quiz.status]}
                </Badge>
              </div>
            </article>
          ))}
          {quizzes.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">{copy.noQuizzes}</div>
          ) : null}
        </div>
      </div>
    </DashboardSectionCard>
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
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {!hideDescription && selectedOption?.description ? (
        <span className="mt-1 block truncate text-xs font-medium text-slate-500">{selectedOption.description}</span>
      ) : null}
    </label>
  );
}

function TopicChip({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition",
        active ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-600 hover:text-slate-950",
      )}
    >
      {children}
    </button>
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

function pseudoRandomScore(value: string) {
  return value.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % 97;
}

function findQuestionBankSubject(subjects: QuestionBankSubject[], subjectId: QuestionBankSubjectId) {
  return subjects.find((subject) => subject.id === subjectId) ?? subjects[0] ?? questionBankSubjects[0];
}

function findQuestionBankLevel(subject: QuestionBankSubject, levelId: string) {
  return subject.levels.find((level) => level.id === levelId) ?? subject.levels[0] ?? questionBankSubjects[0].levels[0];
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
  description: "Chọn đúng môn, level và chủ đề. Câu hỏi là nguồn gốc; quiz Train/Test là bài đã đóng gói để giáo viên giao lại.",
  createQuizAction: (count: number): string => (count > 0 ? `Tạo quiz từ ${count} câu` : "Tạo quiz"),
  workspaceTitle: "Bộ lọc chính",
  workspaceDescription: "Chọn lần lượt để lọc danh sách.",
  subjectLabel: "Môn học",
  levelLabel: "Level",
  topicLabel: "Chủ đề",
  currentPathLabel: "Đang xem",
  scopeLabel: (scope: ContentScope): string => (scope.type === "global" ? "Toàn ERG" : scope.centerName),
  globalScopeDescription: "chỉ hiện học liệu dùng chung toàn công ty",
  centerScopeDescription: "hiện học liệu toàn ERG và riêng trung tâm",
  canManageGlobalScope: "Có quyền tạo global",
  topicGroupLabel: "Chủ đề",
  allTopics: "Tất cả chủ đề",
  allTopicsDescription: "xem toàn bộ",
  questionCount: (count: number): string => `${count} câu`,
  libraryTitle: "Danh sách câu hỏi",
  libraryDescription: (count: number): string => `${count} câu phù hợp. Chọn câu cần dùng hoặc bấm bóc tự động.`,
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
  builderDescription: "Chọn câu hoặc bóc tự động.",
  selectedQuestionCount: "câu đã chọn",
  clearSelection: "Bỏ chọn",
  emptySelection: "Chưa chọn câu nào.",
  moreQuestions: "câu khác",
  autoBuilderTitle: "Bóc tự động",
  autoCountLabel: "Số câu",
  autoTopicLabel: "Chủ đề dùng để bóc",
  autoPreview: (count: number): string => `Hệ thống sẽ lấy ${count} câu sẵn sàng từ các chủ đề đã chọn.`,
  autoPickAction: "Bóc vào danh sách",
  quizBankTitle: "Danh sách quiz/bài tập",
  quizBankDescription: (subject: string, level: string, count: number): string => `${count} bài ${subject} / ${level} dùng chung trong công ty.`,
  allQuizKinds: "Tất cả",
  quizKind: {
    train: "Train",
    test: "Test",
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
  },
  otherTopic: "Khác",
  noQuizzes: "Chưa có quiz phù hợp.",
};

const enCopy = {
  badge: "Company assets",
  description: "Pick subject, level, and topic. Questions are source items; Train/Test quizzes are packaged assignments teachers can reuse.",
  createQuizAction: (count: number): string => (count > 0 ? `Create quiz from ${count}` : "Create quiz"),
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
  libraryTitle: "Question list",
  libraryDescription: (count: number): string => `${count} matching questions. Select items or use auto-pick.`,
  searchPlaceholder: "Search questions...",
  table: {
    select: "Select",
    question: "Question",
    scope: "Scope",
    topic: "Topic",
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
  noResults: "No questions match the current filters.",
  builderTitle: "Create quiz",
  builderDescription: "Select items or auto-pick.",
  selectedQuestionCount: "selected questions",
  clearSelection: "Clear",
  emptySelection: "No question selected yet.",
  moreQuestions: "more questions",
  autoBuilderTitle: "Auto-pick",
  autoCountLabel: "Question count",
  autoTopicLabel: "Topics to sample",
  autoPreview: (count: number): string => `${count} ready questions will be picked from selected topics.`,
  autoPickAction: "Pick into list",
  quizBankTitle: "Quiz/activity list",
  quizBankDescription: (subject: string, level: string, count: number): string => `${count} reusable ${subject} / ${level} items across the company.`,
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
  },
  otherTopic: "Other",
  noQuizzes: "No quiz matches the current filters.",
};
