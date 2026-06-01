import { useEffect, useMemo, useRef, useState } from "react";

import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
import { PlayerTemplateDialog } from "@/features/lcms/quiz/quiz-editor/components/player-template-dialog";
import { QuestionEditorDialog } from "@/features/lcms/quiz/quiz-editor/components/question-editor-dialog";
import { QuestionManagerTable } from "@/features/lcms/quiz/quiz-editor/components/question-manager-table";
import { QuizEditorOutline } from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-outline";
import { QuizEditorRibbon } from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-ribbon";
import { QuizPropertiesDialog, type QuizPropertiesTab } from "@/features/lcms/quiz/quiz-editor/components/quiz-properties-dialog";
import {
  SlidePreviewDialog,
  type SlidePreviewDialogMode,
} from "@/features/lcms/quiz/quiz-editor/components/slide-preview-dialog";
import { useQuizEditorState } from "@/features/lcms/quiz/quiz-editor/hooks/use-quiz-editor-state";
import { useI18n } from "@/platform/i18n";
import type {
  QuestionManagerFilter,
  QuestionManagerGrouping,
  QuizEditorSlide,
  QuizProjectSettings,
  SlideKind,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import type { QuestionBankQuestion } from "@/features/lcms/quiz/question-bank/types/question-bank-types";
import {
  getSlideKindLabelKey,
  isQuestionManagerSlideKind,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import "@/features/lcms/quiz/quiz-editor/styles/classic-editor.css";

export function QuizEditorWorkspace({
  activeLeaf,
  pendingImportedQuestions = [],
  onImportedQuestionsHandled,
}: {
  activeLeaf: DashboardLeaf;
  pendingImportedQuestions?: QuestionBankQuestion[];
  onImportedQuestionsHandled?: () => void;
}) {
  void activeLeaf;
  const { t } = useI18n();
  const [activeFilter, setActiveFilter] = useState<QuestionManagerFilter>("all");
  const [groupingMode, setGroupingMode] = useState<QuestionManagerGrouping>("type");
  const [questionEditorOpen, setQuestionEditorOpen] = useState(false);
  const [quizPropertiesOpen, setQuizPropertiesOpen] = useState(false);
  const [quizPropertiesTab, setQuizPropertiesTab] = useState<QuizPropertiesTab>("quiz-information");
  const [playerTemplateOpen, setPlayerTemplateOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<SlidePreviewDialogMode | null>(null);
  const [importNoticeCount, setImportNoticeCount] = useState(0);
  const importedSignatureRef = useRef("");

  const {
    filteredGroups,
    groups,
    resultSlide,
    quizProject,
    playerTemplate,
    questionCounts,
    selectedThemeId,
    searchValue,
    selectedGroup,
    selectedNode,
    selectedSlide,
    totalSlides,
    collapsedGroupIds,
    clipboard,
    setSearchValue,
    selectGroup,
    selectSlide,
    importQuestionBankQuestions,
    toggleGroupCollapsed,
    collapseAllGroups,
    expandAllGroups,
    addQuestion,
    addIntroduction,
    addQuestionGroup,
    copySelected,
    cutSelected,
    pasteIntoSelected,
    duplicateSelected,
    deleteSelected,
    moveSelected,
    replaceSelectedSlide,
    updateQuizProject,
    updatePlayerTemplate,
    setSelectedThemeId,
  } = useQuizEditorState();

  const pendingImportSignature = pendingImportedQuestions.map((question) => question.id).join("|");

  useEffect(() => {
    if (!pendingImportedQuestions.length) {
      return;
    }

    if (pendingImportSignature === importedSignatureRef.current) {
      return;
    }

    importedSignatureRef.current = pendingImportSignature;
    importQuestionBankQuestions(pendingImportedQuestions);
    setImportNoticeCount(pendingImportedQuestions.length);
    onImportedQuestionsHandled?.();
  }, [importQuestionBankQuestions, onImportedQuestionsHandled, pendingImportSignature, pendingImportedQuestions]);

  const questionManagerGroups = useMemo(
    () =>
      groups.map((group) => ({
        ...group,
        slides: group.slides.filter((slide) => isQuestionManagerSlideKind(slide.kind)),
      })),
    [groups],
  );

  const filteredQuestionManagerGroups = useMemo(
    () =>
      filteredGroups.map((group) => ({
        ...group,
        slides: group.slides.filter((slide) => isQuestionManagerSlideKind(slide.kind)),
      })),
    [filteredGroups],
  );

  const questionManagerSlides = useMemo(
    () => questionManagerGroups.flatMap((group) => group.slides),
    [questionManagerGroups],
  );

  const filterOptions = useMemo(() => {
    const counts = new Map<SlideKind, number>();
    questionManagerSlides.forEach((slide) => {
      counts.set(slide.kind, (counts.get(slide.kind) ?? 0) + 1);
    });

    return [
      {
        value: "all" as const,
        label: t("quiz.allQuestionTypes"),
        count: questionManagerSlides.length,
      },
      ...Array.from(counts.entries()).map(([kind, count]) => ({
        value: kind,
        label: t(getSlideKindLabelKey(kind)),
        count,
      })),
    ];
  }, [questionManagerSlides, t]);

  const questionEntries = useMemo(
    () =>
      questionManagerGroups.flatMap((group) =>
        group.slides.map((slide) => ({
          groupId: group.id,
          slideId: slide.id,
          title: slide.title,
        })),
      ),
    [questionManagerGroups],
  );

  const quizInformationSlide = useMemo(
    () => createQuizInformationSlide(quizProject),
    [quizProject],
  );

  const configuredResultSlide = useMemo(
    () => createConfiguredResultSlide(resultSlide, quizProject),
    [quizProject, resultSlide],
  );

  const previewSlides = useMemo(
    () => [
      ...(quizInformationSlide ? [quizInformationSlide] : []),
      ...questionManagerSlides,
      configuredResultSlide,
    ],
    [configuredResultSlide, questionManagerSlides, quizInformationSlide],
  );

  const managerGroups = useMemo(() => {
    if (groupingMode === "type") {
      return filteredQuestionManagerGroups;
    }

    const selectedGroupId =
      selectedNode.type === "result"
        ? questionManagerGroups.find((group) => group.id !== "group-intro")?.id ?? questionManagerGroups[0]?.id
        : selectedNode.groupId;

    return selectedGroupId
      ? filteredQuestionManagerGroups.filter((group) => group.id === selectedGroupId)
      : filteredQuestionManagerGroups;
  }, [filteredQuestionManagerGroups, groupingMode, questionManagerGroups, selectedNode]);

  const exportPayload = useMemo(
    () => ({
      quizProject,
      playerTemplate,
      themeId: selectedThemeId,
      groups,
      quizInformationSlide,
      resultSlide: configuredResultSlide,
    }),
    [configuredResultSlide, groups, playerTemplate, quizInformationSlide, quizProject, selectedThemeId],
  );

  const selectedGroupSlides = selectedGroup?.slides.filter((slide) => isQuestionManagerSlideKind(slide.kind)) ?? [];
  const selectedSlideIndex =
    selectedSlide ? selectedGroupSlides.findIndex((slide) => slide.id === selectedSlide.id) + 1 : 1;
  const selectedGroupSlideTotal = selectedGroupSlides.length || questionManagerSlides.length || totalSlides;

  const statusText =
    selectedNode.type === "group" && selectedGroup
      ? t("quiz.groupStatus", {
          current: extractSelectedGroupIndex(groups, selectedGroup.id),
          total: groups.length,
        })
      : selectedNode.type === "result"
        ? t("quiz.resultStatus")
        : selectedSlide
          ? t("quiz.questionStatus", {
              current: selectedSlideIndex,
              total: selectedGroupSlideTotal,
            })
          : t("quiz.noQuestions");

  return (
    <div className="classic-editor flex h-full max-h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <QuizEditorRibbon
        onAddQuestionGroup={addQuestionGroup}
        onAddQuestion={addQuestion}
        onAddIntroduction={addIntroduction}
        onOpenQuizProperties={() => {
          setQuizPropertiesTab("quiz-information");
          setQuizPropertiesOpen(true);
        }}
        onOpenResults={() => {
          setQuizPropertiesTab("quiz-result");
          setQuizPropertiesOpen(true);
        }}
        onOpenPlayerTemplate={() => setPlayerTemplateOpen(true)}
        onOpenPreview={() => setPreviewMode("preview")}
        onOpenPublish={() => setPreviewMode("publish")}
      />

      {importNoticeCount > 0 ? (
        <div className="border-b border-[#d7e0eb] bg-[#fff8ee] px-6 py-3 text-sm text-[#8d4a12]">
          {t("sidebar.questionBank")}: {importNoticeCount} {t("common.questions").toLowerCase()} đã được đưa vào đề nháp hiện tại.
        </div>
      ) : null}

      <div className="classic-editor__layout">
        <QuizEditorOutline
          quizTitle={quizProject.info.title}
          groups={filteredQuestionManagerGroups}
          questionCounts={questionCounts}
          searchValue={searchValue}
          selectedNode={selectedNode}
          collapsedGroupIds={collapsedGroupIds}
          canPaste={Boolean(clipboard)}
          activeFilter={activeFilter}
          groupingMode={groupingMode}
          filterOptions={filterOptions}
          onChangeFilter={setActiveFilter}
          onChangeGroupingMode={(nextMode) => {
            setGroupingMode(nextMode);
            if (nextMode === "group") {
              setActiveFilter("all");
            }
          }}
          onChangeSearch={setSearchValue}
          onSelectGroup={selectGroup}
          onToggleGroupCollapsed={toggleGroupCollapsed}
          onCollapseAll={collapseAllGroups}
          onExpandAll={expandAllGroups}
          onCopy={copySelected}
          onCut={cutSelected}
          onPaste={pasteIntoSelected}
          onDuplicate={duplicateSelected}
          onRemove={deleteSelected}
          onMove={moveSelected}
        />

        <QuestionManagerTable
          quizTitle={quizProject.info.title}
          groups={managerGroups}
          selectedNode={selectedNode}
          activeFilter={groupingMode === "type" ? activeFilter : "all"}
          onSelectSlide={selectSlide}
          onOpenEditor={() => setQuestionEditorOpen(true)}
          onOpenEditorFor={(groupId, slideId) => {
            selectSlide(groupId, slideId);
            setQuestionEditorOpen(true);
          }}
          onDuplicateSelected={duplicateSelected}
          onRemoveSelected={deleteSelected}
        />
      </div>

      <div className="classic-editor__status">
        <span>{statusText}</span>
        <div className="classic-editor__status-summary">
          <span>{quizProject.info.title}</span>
          <span>{t("quiz.groupCount", { count: groups.length })}</span>
          <span>{t("quiz.questionCount", { count: questionManagerSlides.length })}</span>
          <span>{selectedGroup?.title ?? (selectedNode.type === "result" ? t("common.results") : t("common.question"))}</span>
        </div>
      </div>

      {questionEditorOpen && selectedNode.type === "slide" && selectedSlide ? (
        <QuestionEditorDialog
          key={`question-editor-${selectedSlide.id}`}
          open
          slide={selectedSlide}
          groupTitle={selectedGroup?.title ?? null}
          entries={questionEntries}
          onClose={() => setQuestionEditorOpen(false)}
          onSave={replaceSelectedSlide}
          onNavigate={selectSlide}
          onPreview={(nextSlide) => {
            replaceSelectedSlide(nextSlide);
            setPreviewMode("preview");
          }}
        />
      ) : null}

      {quizPropertiesOpen ? (
        <QuizPropertiesDialog
          key={`quiz-properties-${quizProject.info.title}-${quizPropertiesTab}`}
          open
          value={quizProject}
          initialTab={quizPropertiesTab}
          selectedThemeId={selectedThemeId}
          onClose={() => setQuizPropertiesOpen(false)}
          onSave={updateQuizProject}
        />
      ) : null}

      {playerTemplateOpen ? (
        <PlayerTemplateDialog
          key={`player-template-${selectedThemeId}`}
          open
          selectedThemeId={selectedThemeId}
          value={playerTemplate}
          infoPage={quizProject.info.page}
          previewQuestion={questionManagerSlides[0] ?? null}
          questionCount={questionManagerSlides.length}
          passingRate={quizProject.settings.passingRate}
          onClose={() => setPlayerTemplateOpen(false)}
          onSave={(themeId, nextTemplate) => {
            setSelectedThemeId(themeId);
            updatePlayerTemplate(nextTemplate);
          }}
        />
      ) : null}

      {previewMode ? (
        <SlidePreviewDialog
          open
          mode={previewMode}
          slides={previewSlides}
          selectedSlideId={selectedNode.type === "result" ? configuredResultSlide.id : selectedSlide?.id}
          selectedThemeId={selectedThemeId}
          exportPayload={exportPayload}
          onClose={() => setPreviewMode(null)}
        />
      ) : null}
    </div>
  );
}

function extractSelectedGroupIndex(groups: Array<{ id: string }>, groupId: string) {
  const index = groups.findIndex((group) => group.id === groupId);
  return index >= 0 ? index + 1 : 1;
}

function createQuizInformationSlide(quizProject: QuizProjectSettings): QuizEditorSlide | null {
  if (!quizProject.info.showIntroductionPage) {
    return null;
  }

  return {
    id: "quiz-information-slide",
    title: quizProject.info.page.courseTitle || quizProject.info.title,
    kind: "info-slide",
    description: quizProject.info.introduction,
    instructions: quizProject.info.introduction ? [quizProject.info.introduction] : [],
    infoPage: quizProject.info.page,
  };
}

function createConfiguredResultSlide(
  resultSlide: QuizEditorSlide,
  quizProject: QuizProjectSettings,
): QuizEditorSlide {
  return {
    ...resultSlide,
    feedbackRows: [
      {
        id: "result-pass-message",
        kind: "correct",
        feedback: quizProject.result.passMessage,
        score: 0,
        branching: "By Result",
      },
      {
        id: "result-fail-message",
        kind: "incorrect",
        feedback: quizProject.result.failMessage,
        score: 0,
        branching: "By Result",
      },
    ],
  };
}
