import { useMemo, useState, type MouseEvent as ReactMouseEvent } from "react";
import { ArrowDown as ArrowDownwardIcon } from "@/components/mui-icon-shim";
import { ArrowUp as ArrowUpwardIcon } from "@/components/mui-icon-shim";
import { Copy as ContentCopyIcon } from "@/components/mui-icon-shim";
import { Scissors as ContentCutIcon } from "@/components/mui-icon-shim";
import { Clipboard as ContentPasteIcon } from "@/components/mui-icon-shim";
import { Trash2 as DeleteOutlinedIcon } from "@/components/mui-icon-shim";
import { Minus as RemoveIcon } from "@/components/mui-icon-shim";
import { Eye as VisibilityIcon } from "@/components/mui-icon-shim";
import { Plus as AddIcon } from "@/components/mui-icon-shim";

import {
  OfficeChevronDownSmallIcon,
  OfficeSearchSmallIcon,
} from "@/features/lcms/quiz/quiz-editor/components/classic-editor-art";
import {
  QuizEditorContextMenu,
  type QuizEditorContextMenuItem,
} from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-context-menu";
import { useI18n } from "@/platform/i18n";
import type {
  QuestionManagerFilter,
  QuestionManagerGrouping,
  QuizEditorGroup,
  SelectedEditorNode,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { cn } from "@/utils/cn";
import { AppSelect } from "@/components/ui/app-select";

type OutlineProps = {
  quizTitle: string;
  groups: QuizEditorGroup[];
  selectedNode: SelectedEditorNode;
  questionCounts: Record<string, number>;
  collapsedGroupIds: string[];
  canPaste: boolean;
  searchValue: string;
  activeFilter: QuestionManagerFilter;
  groupingMode: QuestionManagerGrouping;
  filterOptions: Array<{ value: QuestionManagerFilter; label: string; count: number }>;
  onChangeFilter: (value: QuestionManagerFilter) => void;
  onChangeGroupingMode: (value: QuestionManagerGrouping) => void;
  onChangeSearch: (value: string) => void;
  onSelectGroup: (groupId: string) => void;
  onToggleGroupCollapsed: (groupId: string) => void;
  onCollapseAll: () => void;
  onExpandAll: () => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onMove: (direction: "up" | "down") => void;
};

type OpenGroupMenuHandler = (event: ReactMouseEvent, groupId: string) => void;

export function QuizEditorOutline({
  quizTitle,
  groups,
  selectedNode,
  questionCounts,
  collapsedGroupIds,
  canPaste,
  searchValue,
  activeFilter,
  groupingMode,
  filterOptions,
  onChangeFilter,
  onChangeGroupingMode,
  onChangeSearch,
  onSelectGroup,
  onToggleGroupCollapsed,
  onCollapseAll,
  onExpandAll,
  onCopy,
  onCut,
  onPaste,
  onDuplicate,
  onRemove,
  onMove,
}: OutlineProps) {
  const { t } = useI18n();
  const [contextMenu, setContextMenu] = useState<{
    position: { x: number; y: number };
    target: { type: "group"; groupId: string };
  } | null>(null);

  const activeMenuItems = useMemo(() => {
    if (!contextMenu) return [];

    const group = groups.find((entry) => entry.id === contextMenu.target.groupId);
    const isGroup = contextMenu.target.type === "group";
    const groupIndex = groups.findIndex((entry) => entry.id === contextMenu.target.groupId);
    const canRemoveGroup = Boolean(group && group.id !== "group-intro");

    if (isGroup) {
      return [
        { label: t("quiz.previewGroup"), icon: <VisibilityIcon className="h-3.5 w-3.5" size="1em" />, onSelect: () => onSelectGroup(contextMenu.target.groupId) },
        { label: t("common.cut"), icon: <ContentCutIcon className="h-3.5 w-3.5" size="1em" />, dividerBefore: true, disabled: !canRemoveGroup, onSelect: onCut },
        { label: t("common.copy"), icon: <ContentCopyIcon className="h-3.5 w-3.5" size="1em" />, onSelect: onCopy },
        { label: t("common.paste"), icon: <ContentPasteIcon className="h-3.5 w-3.5" size="1em" />, disabled: !canPaste, onSelect: onPaste },
        { label: t("common.duplicate"), icon: <ContentCopyIcon className="h-3.5 w-3.5" size="1em" />, dividerBefore: true, onSelect: onDuplicate },
        { label: t("common.remove"), icon: <DeleteOutlinedIcon className="h-3.5 w-3.5" size="1em" />, disabled: !canRemoveGroup, onSelect: onRemove },
        { label: t("quiz.moveUp"), icon: <ArrowUpwardIcon className="h-3.5 w-3.5" size="1em" />, dividerBefore: true, disabled: groupIndex <= 1, onSelect: () => onMove("up") },
        {
          label: t("quiz.moveDown"),
          icon: <ArrowDownwardIcon className="h-3.5 w-3.5" size="1em" />,
          disabled: groupIndex < 1 || groupIndex >= groups.length - 1,
          onSelect: () => onMove("down"),
        },
        { label: t("quiz.collapseAll"), icon: <RemoveIcon className="h-3.5 w-3.5" size="1em" />, dividerBefore: true, onSelect: onCollapseAll },
        { label: t("quiz.expandAll"), icon: <AddIcon className="h-3.5 w-3.5" size="1em" />, onSelect: onExpandAll },
      ] satisfies QuizEditorContextMenuItem[];
    }

    return [] satisfies QuizEditorContextMenuItem[];
  }, [
    canPaste,
    contextMenu,
    groups,
    t,
    onCollapseAll,
    onCopy,
    onCut,
    onDuplicate,
    onExpandAll,
    onMove,
    onPaste,
    onRemove,
    onSelectGroup,
  ]);

  function handleOpenGroupMenu(event: ReactMouseEvent, groupId: string) {
    event.preventDefault();
    onSelectGroup(groupId);
    setContextMenu({
      position: { x: event.clientX, y: event.clientY },
      target: { type: "group", groupId },
    });
  }

  return (
    <aside className="classic-editor__outline">
      <div className="classic-editor__mode-switcher is-manager">
        <div className="classic-editor__manager-header">
          <span className="classic-editor__manager-title">{t("quiz.questionManager")}</span>
          <span className="classic-editor__manager-subtitle">
            {quizTitle}
          </span>
        </div>
      </div>

      <div className="classic-editor__manager-filter">
        <label className="classic-editor__manager-filter-label">{t("quiz.sortQuestionsBy")}</label>
        <AppSelect
          value={groupingMode}
          onChange={(event) => onChangeGroupingMode(event.target.value as QuestionManagerGrouping)}
          className="classic-editor__select classic-editor__manager-filter-select"
        >
          <option value="type">{t("quiz.sortModeType")}</option>
          <option value="group">{t("quiz.sortModeGroup")}</option>
        </AppSelect>
      </div>

      <FormOutline
        quizTitle={quizTitle}
        groups={groups}
        selectedNode={selectedNode}
        questionCounts={questionCounts}
        collapsedGroupIds={collapsedGroupIds}
        searchValue={searchValue}
        activeFilter={activeFilter}
        groupingMode={groupingMode}
        filterOptions={filterOptions}
        onChangeFilter={onChangeFilter}
        onChangeSearch={onChangeSearch}
        onSelectGroup={onSelectGroup}
        onToggleGroupCollapsed={onToggleGroupCollapsed}
        onOpenGroupMenu={handleOpenGroupMenu}
      />

      <QuizEditorContextMenu
        key={contextMenu ? `${contextMenu.position.x}-${contextMenu.position.y}` : "closed"}
        open={Boolean(contextMenu)}
        position={contextMenu?.position ?? null}
        items={activeMenuItems}
        onClose={() => setContextMenu(null)}
      />
    </aside>
  );
}

function FormOutline({
  quizTitle,
  groups,
  selectedNode,
  questionCounts,
  collapsedGroupIds,
  searchValue,
  activeFilter,
  groupingMode,
  filterOptions,
  onChangeFilter,
  onChangeSearch,
  onSelectGroup,
  onToggleGroupCollapsed,
  onOpenGroupMenu,
}: {
  quizTitle: string;
  groups: QuizEditorGroup[];
  selectedNode: SelectedEditorNode;
  questionCounts: Record<string, number>;
  collapsedGroupIds: string[];
  searchValue: string;
  activeFilter: QuestionManagerFilter;
  groupingMode: QuestionManagerGrouping;
  filterOptions: Array<{ value: QuestionManagerFilter; label: string; count: number }>;
  onChangeFilter: (value: QuestionManagerFilter) => void;
  onChangeSearch: (value: string) => void;
  onSelectGroup: (groupId: string) => void;
  onToggleGroupCollapsed: (groupId: string) => void;
  onOpenGroupMenu: OpenGroupMenuHandler;
}) {
  const { t } = useI18n();

  return (
    <>
      <div className="classic-editor__search">
        <label className="classic-editor__search-field">
          <OfficeSearchSmallIcon className="h-4 w-4" />
          <input
            type="text"
            value={searchValue}
            onChange={(event) => onChangeSearch(event.target.value)}
            placeholder={t("quiz.searchPlaceholder")}
            className="classic-editor__search-input"
          />
        </label>
      </div>

      <div className="classic-editor__tree">
        <div className="classic-editor__taxonomy-root">
          <OfficeChevronDownSmallIcon className="h-3.5 w-3.5" />
          <span>{quizTitle}</span>
        </div>

        {groupingMode === "type" ? (
          <div className="classic-editor__taxonomy-list">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onChangeFilter(option.value)}
                className={cn(
                  "classic-editor__taxonomy-row",
                  activeFilter === option.value && "is-active",
                )}
              >
                <span>{option.label}</span>
                <span className="classic-editor__count">{option.count}</span>
              </button>
            ))}
          </div>
        ) : null}

        {groupingMode === "group"
          ? groups.map((group) => {
              const isGroupSelected =
                selectedNode.type !== "result" && selectedNode.groupId === group.id;
              const isCollapsed = collapsedGroupIds.includes(group.id);

              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => onSelectGroup(group.id)}
                  onDoubleClick={() => onToggleGroupCollapsed(group.id)}
                  onContextMenu={(event) => onOpenGroupMenu(event, group.id)}
                  className={cn("classic-editor__taxonomy-row", isGroupSelected && "is-active")}
                >
                  <span className="classic-editor__group-left">
                    <OfficeChevronDownSmallIcon
                      className={cn("h-3.5 w-3.5", isCollapsed && "-rotate-90")}
                    />
                    <span>{group.title}</span>
                  </span>
                  <span className="classic-editor__count">{questionCounts[group.id] ?? 0}</span>
                </button>
              );
            })
          : null}

      </div>
    </>
  );
}
