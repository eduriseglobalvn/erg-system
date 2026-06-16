import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Search as SearchIcon } from "@/components/mui-icon-shim";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

import {
  DashboardPageShell,
  DashboardSectionCard,
  DashboardSegmentedControl,
} from "@/components/dashboard/dashboard-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePacedStateBatch } from "@/hooks/use-paced-state-batch";
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
import { AppSelect } from "@/components/ui/app-select";

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
  const debouncedSearchValue = useDebouncedValue(searchValue);
  const paceStateUpdate = usePacedStateBatch();

  const questionBankQuery = useQuery({
    queryKey: queryKeys.questionBank.workspace(),
    queryFn: loadQuestionBankData,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const data = questionBankQuery.data;
    if (!data) return;

    paceStateUpdate(() => {
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
  }, [levelId, paceStateUpdate, questionBankQuery.data, subjectId]);

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
    const keyword = debouncedSearchValue.trim().toLowerCase();

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
  }, [activeLevel.id, contentScope, debouncedSearchValue, questions, subjectId, topicId]);

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
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
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
    <div className="space-y-3">
      <div className="grid gap-3 xl:grid-cols-[minmax(360px,520px)_minmax(0,1fr)] xl:items-end">
        <div className="grid flex-1 gap-3 md:grid-cols-2">
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

        <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-xl border border-slate-200/80 bg-[#f8fbff] px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm">
          <span className="font-bold text-slate-400 uppercase tracking-wider">{copy.currentPathLabel}:</span>
          <span className="text-slate-900">{activeSubject.label}</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900">{activeLevel.label}</span>
          <span className="hidden h-4 w-px bg-slate-200 sm:block mx-1" />
          <Badge tone={contentScope.type === "global" ? "primary" : "secondary"} className="rounded-full px-2.5 py-0.5">
            {copy.scopeLabel(contentScope)}
          </Badge>
          <span className="hidden text-slate-400 font-medium italic 2xl:inline">
            ({contentScope.type === "global" ? copy.globalScopeDescription : copy.centerScopeDescription})
          </span>
          {canManageGlobalContent ? (
            <Badge tone="outline" className="rounded-full px-2 py-0.5 border-blue-200 text-blue-600 bg-blue-50/30">
              {copy.canManageGlobalScope}
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="border-t border-slate-100 pt-3 select-none">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="shrink-0 text-xs font-bold text-slate-400 uppercase tracking-wider">{copy.topicGroupLabel}:</div>
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
    <Card className="border-slate-200/60 shadow-sm bg-white overflow-hidden">
      <CardHeader className="border-b border-slate-100 p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">{copy.libraryTitle}</CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-1">
              {copy.libraryDescription(visibleQuestions.length)}
            </CardDescription>
          </div>
          <div className="relative w-full min-w-[220px] max-w-[340px]">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={copy.searchPlaceholder}
              className="pl-10 border-slate-200 focus:border-blue-300 transition shadow-sm rounded-lg"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3 text-center w-[56px]">{copy.table.select}</th>
                <th className="px-3 py-3">{copy.table.question}</th>
                <th className="px-3 py-3 w-[120px]">{copy.table.scope}</th>
                <th className="px-5 py-3 w-[180px]">{copy.table.topic}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {visibleQuestions.map((question) => {
                const selected = selectedIds.includes(question.id);
                return (
                  <tr
                    key={question.id}
                    className={cn(
                      "group cursor-pointer transition-colors duration-150 hover:bg-slate-50/30",
                      selected ? "bg-blue-50/20" : "bg-white"
                    )}
                    onClick={() => onQuestionToggle(question.id)}
                  >
                    <td className="px-5 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <label className="flex items-center justify-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => onQuestionToggle(question.id)}
                          aria-label={copy.selectQuestionLabel(question.stem)}
                          className="size-4.5 rounded border-slate-300 text-[var(--erg-blue)] accent-[var(--erg-blue)] focus:ring-[var(--erg-blue-ring)] focus:ring-2"
                        />
                      </label>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="font-semibold text-slate-800 text-sm leading-relaxed line-clamp-2" title={question.stem}>
                        {question.stem}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 line-clamp-1 max-w-[500px]">
                        {question.objective}
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <Badge tone={getScopeTone(question.scope, contentScope)} className="rounded-full px-2 py-0.5 text-xs font-semibold">
                        {copy.scopeLabel(question.scope)}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 text-sm">
                      {question.categoryLabel}
                    </td>
                  </tr>
                );
              })}
              {visibleQuestions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-400 italic">
                    {copy.noResults}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
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
  const hasSelection = selectedQuestions.length > 0;
  return (
    <Card className="sticky top-4 border-slate-200/60 shadow-sm bg-white overflow-hidden flex flex-col h-fit gap-3 p-4">
      <div>
        <CardTitle className="text-base font-bold text-slate-900">{copy.builderTitle}</CardTitle>
        <CardDescription className="text-xs text-slate-500 mt-0.5">{copy.builderDescription}</CardDescription>
      </div>

      <div className="rounded-xl border border-blue-100 bg-[#f8fbff] p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-2xl font-extrabold text-slate-900 leading-none">{selectedQuestions.length}</div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">{copy.selectedQuestionCount}</div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClearSelection} 
            disabled={!hasSelection}
            className="h-8 rounded-lg border-slate-200 hover:bg-slate-50 font-semibold text-xs"
          >
            {copy.clearSelection}
          </Button>
        </div>
        <Button 
          className={cn(
            "mt-3 w-full font-bold py-2 rounded-lg text-white shadow-sm transition-all",
            hasSelection ? "bg-[var(--erg-blue)] hover:bg-[var(--erg-blue-hover)] cursor-pointer hover:shadow-md" : "bg-slate-300 text-slate-500 cursor-not-allowed"
          )} 
          onClick={onCreateQuiz} 
          disabled={!hasSelection}
        >
          {copy.createQuizAction(selectedQuestions.length)}
        </Button>
      </div>

      <SelectedQuestionList copy={copy} questions={selectedQuestions} />

      <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-3.5 space-y-3">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700">{copy.autoBuilderTitle}</div>
        
        <div className="space-y-3">
          <SelectControl
            label={copy.autoCountLabel}
            value={String(autoCount)}
            onChange={(value) => onAutoCountChange(Number(value))}
            options={[
              { value: "5", label: "5 câu" },
              { value: "10", label: "10 câu" },
              { value: "15", label: "15 câu" },
              { value: "20", label: "20 câu" },
            ]}
          />
          
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{copy.autoTopicLabel}</div>
            <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto pr-1 select-none">
              {levelTopics.map((topic) => (
                <TopicChip key={topic.id} active={autoTopicIds.includes(topic.id)} onClick={() => onTopicToggle(topic.id)}>
                  {topic.label}
                </TopicChip>
              ))}
            </div>
          </div>
          
          <div className="text-xs leading-relaxed text-slate-500 pt-1 border-t border-slate-100">
            {copy.autoPreview(autoPickedQuestions.length)}
          </div>
          
          <Button 
            className={cn(
              "w-full font-semibold py-2 rounded-lg text-white shadow-sm transition-all",
              autoPickedQuestions.length > 0 && autoTopicIds.length > 0
                ? "bg-slate-800 hover:bg-slate-900 cursor-pointer"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            )} 
            onClick={onAutoPick} 
            disabled={autoPickedQuestions.length === 0 || autoTopicIds.length === 0}
          >
            {copy.autoPickAction}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function SelectedQuestionList({ copy, questions }: { copy: QuestionBankCopy; questions: QuestionBankQuestion[] }) {
  if (questions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/40 px-4 py-5 text-center text-xs leading-relaxed text-slate-400">
        {copy.emptySelection}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-100 bg-white overflow-hidden divide-y divide-slate-100 shadow-inner max-h-[150px] overflow-y-auto">
      {questions.slice(0, 3).map((question) => (
        <div key={question.id} className="px-4 py-2.5 hover:bg-slate-50/50 transition">
          <div className="line-clamp-2 text-xs font-semibold leading-relaxed text-slate-700">{question.stem}</div>
          <div className="mt-0.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{question.categoryLabel}</div>
        </div>
      ))}
      {questions.length > 3 ? (
        <div className="px-4 py-2.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
          + {questions.length - 3} {copy.moreQuestions}
        </div>
      ) : null}
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
    <Card className="border-slate-200/60 shadow-sm bg-white overflow-hidden">
      <CardHeader className="border-b border-slate-100 p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">{copy.quizBankTitle}</CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-1">
              {copy.quizBankDescription(subjectLabel, activeLevelLabel, quizzes.length)}
            </CardDescription>
          </div>
          <DashboardSegmentedControl
            options={[
              { value: "all", label: copy.allQuizKinds },
              { value: "train", label: copy.quizKind.train },
              { value: "test", label: copy.quizKind.test },
            ]}
            value={quizKind}
            onChange={(value) => onKindChange(value as QuizKindFilter)}
          />
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">{copy.quizTable.title}</th>
                <th className="px-3 py-3">{copy.quizTable.scope}</th>
                <th className="px-3 py-3">{copy.quizTable.kind}</th>
                <th className="px-3 py-3">{copy.quizTable.count}</th>
                <th className="px-3 py-3">{copy.quizTable.duration}</th>
                <th className="px-5 py-3 text-right">{copy.quizTable.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {quizzes.map((quiz) => {
                const isReady = quiz.status === "ready";
                const isReviewing = quiz.status === "reviewing";
                return (
                  <tr
                    key={quiz.id}
                    className="group hover:bg-slate-50/35 transition-colors duration-150"
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900 group-hover:text-[var(--erg-blue)] transition-colors text-sm">
                        {quiz.title}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {quiz.topicLabels.join(", ") || copy.otherTopic}
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <Badge tone={getScopeTone(quiz.scope, contentScope)} className="rounded-full px-2 py-0.5 text-xs font-semibold">
                        {copy.scopeLabel(quiz.scope)}
                      </Badge>
                    </td>
                    <td className="px-3 py-3.5">
                      <Badge tone={quiz.kind === "test" ? "warning" : "secondary"} className="rounded-full px-2 py-0.5 text-xs font-semibold">
                        {copy.quizKind[quiz.kind]}
                      </Badge>
                    </td>
                    <td className="px-3 py-3.5 text-sm font-semibold text-slate-800">
                      {copy.questionCount(quiz.questionCount)}
                    </td>
                    <td className="px-3 py-3.5 text-sm text-slate-600">
                      {quiz.durationLabel}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Badge 
                        tone={isReady ? "success" : isReviewing ? "warning" : "outline"}
                        className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      >
                        {copy.quizStatus[quiz.status]}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
              {quizzes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400 italic">
                    {copy.noQuizzes}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
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
    <label className="block select-none">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      <AppSelect
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 h-10 w-full rounded-lg border border-[#d7e0ec] bg-white px-3 text-sm font-semibold text-[#242424] shadow-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-[var(--erg-blue-ring)] hover:border-slate-300"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </AppSelect>
      {!hideDescription && selectedOption?.description ? (
        <span className="mt-1.5 block truncate text-[11px] font-medium text-slate-500">{selectedOption.description}</span>
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
        "rounded-full border px-2.5 py-1 text-xs font-semibold transition shadow-sm",
        active 
          ? "border-[#0f6cbd] bg-[#0f6cbd] text-white hover:bg-[#0b5cab]" 
          : "border-slate-200/80 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50/50",
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
  libraryTitle: "Danh sách câu hỏi",
  libraryDescription: (count: number): string => `${count} câu phù hợp. Chọn câu để đóng gói quiz.`,
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
