import { useEffect, useMemo, useState } from "react";
import Checkbox from "@mui/material/Checkbox";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import PublishIcon from "@mui/icons-material/Publish";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import CloudDoneOutlinedIcon from "@mui/icons-material/CloudDoneOutlined";
import CloudOffOutlinedIcon from "@mui/icons-material/CloudOffOutlined";

import { useI18n } from "@/platform/i18n";
import type {
  QuestionCreationPreset,
  QuestionType,
  QuizEditorGroup,
  QuizEditorSlide,
  SelectedEditorNode,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { isQuestionManagerSlideKind } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import {
  formatManagerQuestionType,
  getManagerRowKindClass,
  QuestionManagerEmptyState,
  renderStatusBadge,
  type QuestionManagerStatusFilter,
} from "@/features/lcms/quiz/quiz-editor/components/question-manager-table-parts";
import { cn } from "@/utils/cn";

type QuestionManagerTableProps = {
  quizTitle: string;
  groups: QuizEditorGroup[];
  selectedNode: SelectedEditorNode;
  lessonLabel: string;
  lessonMeta: string;
  topicLabel: string;
  onOpenEditor: () => void;
  onOpenEditorFor: (groupId: string, slideId: string) => void;
  onDuplicateSelected: () => void;
  onRemoveSelected: () => void;
  onAddNewQuestion?: (type?: QuestionType, preset?: QuestionCreationPreset) => void;
  onPublishSelected?: (slideIds: string[]) => void;
  onSaveDraft?: () => void;
  isSavingDraft?: boolean;
  isSavedOnServer?: boolean;
  lastSavedTime?: string | null;
  onDeleteSlides?: (slideIds: string[]) => void;
  onDuplicateSlides?: (slideIds: string[]) => void;
  onSelectSlide?: (groupId: string, slideId: string) => void;
};

type QuestionManagerRow = {
  id: string;
  index: number;
  groupId: string;
  slide: QuizEditorSlide;
};

export function QuestionManagerTable({
  quizTitle,
  groups,
  selectedNode,
  lessonLabel,
  lessonMeta: _lessonMeta,
  topicLabel,
  onOpenEditor,
  onOpenEditorFor,
  onDuplicateSelected,
  onRemoveSelected,
  onAddNewQuestion,
  onPublishSelected,
  onSaveDraft,
  isSavingDraft,
  isSavedOnServer,
  lastSavedTime,
  onDeleteSlides,
  onDuplicateSlides,
  onSelectSlide,
}: QuestionManagerTableProps) {
  const { t } = useI18n();
  const [statusFilter, setStatusFilter] = useState<QuestionManagerStatusFilter>("all");

  const rows = useMemo<QuestionManagerRow[]>(() => {
    const flattened = groups.flatMap((group) =>
      group.slides
        .filter((slide) => isQuestionManagerSlideKind(slide.kind))
        .map((slide) => ({
          id: slide.id,
          groupId: group.id,
          slide,
        })),
    );

    return flattened.map((row, index) => ({
      ...row,
      index: index + 1,
    }));
  }, [groups]);

  const unsavedCount = useMemo(
    () => rows.filter((r) => r.slide.status === "unsaved" || (!r.slide.status && !isSavedOnServer)).length,
    [isSavedOnServer, rows],
  );
  const draftCount = useMemo(
    () => rows.filter((r) => r.slide.status === "draft" || (!r.slide.status && isSavedOnServer)).length,
    [isSavedOnServer, rows],
  );
  const publishedCount = useMemo(
    () => rows.filter((r) => r.slide.status === "published").length,
    [rows],
  );

  const filteredRows = useMemo(() => {
    if (statusFilter === "unsaved") return rows.filter((r) => r.slide.status === "unsaved" || (!r.slide.status && !isSavedOnServer));
    if (statusFilter === "draft") return rows.filter((r) => r.slide.status === "draft" || (!r.slide.status && isSavedOnServer));
    if (statusFilter === "published") return rows.filter((r) => r.slide.status === "published");
    return rows;
  }, [isSavedOnServer, rows, statusFilter]);

  const allSlideIds = useMemo(() => rows.map((r) => r.slide.id), [rows]);
  const visibleSlideIds = useMemo(() => filteredRows.map((r) => r.slide.id), [filteredRows]);
  const [selectedSlideIds, setSelectedSlideIds] = useState<string[]>([]);

  useEffect(() => {
    setSelectedSlideIds((current) => {
      if (current.length === 0 && allSlideIds.length > 0) {
        return allSlideIds;
      }
      return current.filter((id) => allSlideIds.includes(id));
    });
  }, [allSlideIds]);

  const selectedSlideId = selectedNode.type === "slide" ? selectedNode.slideId : null;
  const selectedRow = rows.find((row) => row.slide.id === selectedSlideId) ?? null;

  const isAllSelected = visibleSlideIds.length > 0 && visibleSlideIds.every((id) => selectedSlideIds.includes(id));
  const isSomeSelected = visibleSlideIds.some((id) => selectedSlideIds.includes(id)) && !isAllSelected;

  function handleToggleAll(checked: boolean) {
    if (checked) {
      setSelectedSlideIds((current) => Array.from(new Set([...current, ...visibleSlideIds])));
    } else {
      setSelectedSlideIds((current) => current.filter((id) => !visibleSlideIds.includes(id)));
    }
  }

  function handleToggleRow(slideId: string) {
    setSelectedSlideIds((current) =>
      current.includes(slideId) ? current.filter((id) => id !== slideId) : [...current, slideId],
    );
  }

  function handleBatchDuplicate() {
    if (selectedSlideIds.length > 0 && onDuplicateSlides) {
      onDuplicateSlides(selectedSlideIds);
    } else {
      onDuplicateSelected();
    }
  }

  function handleBatchDelete() {
    if (selectedSlideIds.length > 0 && onDeleteSlides) {
      onDeleteSlides(selectedSlideIds);
      setSelectedSlideIds([]);
    } else {
      onRemoveSelected();
    }
  }

  return (
    <main className="classic-editor__manager-canvas">
      <div className="classic-editor__manager-scroll">
        <div className="classic-editor__manager-shell">
          <div className="classic-editor__manager-strip">
            <div className="classic-editor__manager-strip-left">
              <span className="classic-editor__manager-strip-dot" />
              <strong className="classic-editor__manager-strip-title">{quizTitle}</strong>
              <span className="classic-editor__manager-strip-count">
                {selectedSlideIds.length > 0
                  ? `Đã chọn ${selectedSlideIds.length}/${rows.length} câu`
                  : t("quiz.questionCount", { count: rows.length })}
              </span>
              {lessonLabel ? (
                <>
                  <span className="classic-editor__manager-strip-divider">•</span>
                  <span className="classic-editor__manager-strip-scope">{lessonLabel}</span>
                </>
              ) : null}
              {topicLabel && topicLabel !== "Tất cả chủ đề" ? (
                <>
                  <span className="classic-editor__manager-strip-divider">•</span>
                  <span className="classic-editor__manager-strip-scope">{topicLabel}</span>
                </>
              ) : null}

              <span className="classic-editor__manager-strip-divider">•</span>
              {unsavedCount > 0 ? (
                <span className="classic-editor__sync-badge is-unsaved" title="Có câu hỏi mới tạo hoặc sửa chỉ mới lưu ở máy này (localStorage), bấm Lưu nháp để đồng bộ lên máy chủ">
                  <CloudOffOutlinedIcon sx={{ fontSize: 14 }} />
                  <span>Chưa lưu máy chủ ({unsavedCount})</span>
                </span>
              ) : isSavedOnServer || lastSavedTime ? (
                <span className="classic-editor__sync-badge is-saved" title={lastSavedTime ? `Đã đồng bộ an toàn với máy chủ lúc ${lastSavedTime}` : "Đã đồng bộ an toàn với máy chủ"}>
                  <CloudDoneOutlinedIcon sx={{ fontSize: 14 }} />
                  <span>Đã lưu máy chủ</span>
                </span>
              ) : (
                <span className="classic-editor__sync-badge is-unsaved" title="Bản ghi chưa được lưu lên cơ sở dữ liệu máy chủ">
                  <CloudOffOutlinedIcon sx={{ fontSize: 14 }} />
                  <span>Chưa lưu máy chủ</span>
                </span>
              )}
            </div>

            <div className="classic-editor__manager-toolbar">
              <button
                type="button"
                className="classic-editor__manager-action is-primary"
                onClick={() => onAddNewQuestion?.("multiple-choice")}
              >
                <AddRoundedIcon sx={{ fontSize: 18 }} />
                <span>Tạo câu hỏi</span>
              </button>

              {onSaveDraft ? (
                <button
                  type="button"
                  className={cn(
                    "classic-editor__manager-action is-save-draft",
                    unsavedCount > 0 && "has-unsaved",
                  )}
                  disabled={isSavingDraft || rows.length === 0}
                  onClick={onSaveDraft}
                  title="Lưu tất cả thay đổi vào bản nháp trên cơ sở dữ liệu máy chủ"
                >
                  <SaveOutlinedIcon sx={{ fontSize: 16 }} />
                  <span>
                    {isSavingDraft
                      ? "Đang lưu..."
                      : unsavedCount > 0
                        ? `Lưu nháp (${unsavedCount})`
                        : "Lưu nháp"}
                  </span>
                </button>
              ) : null}

              {onPublishSelected ? (
                <button
                  type="button"
                  className="classic-editor__manager-action is-publish"
                  disabled={selectedSlideIds.length === 0}
                  onClick={() => onPublishSelected(selectedSlideIds)}
                  title="Xuất bản các câu hỏi đã chọn vào bài thi"
                >
                  <PublishIcon sx={{ fontSize: 16 }} />
                  <span>Xuất bản ({selectedSlideIds.length})</span>
                </button>
              ) : null}

              <button
                type="button"
                className="classic-editor__manager-action"
                disabled={!selectedRow}
                onClick={onOpenEditor}
              >
                <OpenInFullIcon className="h-4 w-4" sx={{ fontSize: "1em" }} />
                <span>{t("quiz.openEditor")}</span>
              </button>

              <button
                type="button"
                className="classic-editor__manager-action"
                disabled={selectedSlideIds.length === 0 && !selectedRow}
                onClick={handleBatchDuplicate}
                title="Nhân bản các câu đã chọn"
              >
                <ContentCopyIcon className="h-4 w-4" sx={{ fontSize: "1em" }} />
                <span>{selectedSlideIds.length > 1 ? `Nhân bản (${selectedSlideIds.length})` : t("common.duplicate")}</span>
              </button>

              <button
                type="button"
                className="classic-editor__manager-action"
                disabled={selectedSlideIds.length === 0 && !selectedRow}
                onClick={handleBatchDelete}
                title="Xóa các câu đã chọn"
              >
                <DeleteOutlinedIcon className="h-4 w-4" sx={{ fontSize: "1em" }} />
                <span>{selectedSlideIds.length > 1 ? `Xóa (${selectedSlideIds.length})` : t("common.remove")}</span>
              </button>
            </div>
          </div>

          <div className="classic-editor__manager-filter-bar">
            <div className="classic-editor__manager-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={statusFilter === "all"}
                className={cn("classic-editor__filter-tab", statusFilter === "all" && "is-active")}
                onClick={() => setStatusFilter("all")}
              >
                <span>Tất cả</span>
                <span className="classic-editor__filter-tab-count">{rows.length}</span>
              </button>

              {unsavedCount > 0 ? (
                <button
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === "unsaved"}
                  className={cn("classic-editor__filter-tab is-unsaved-tab", statusFilter === "unsaved" && "is-active")}
                  onClick={() => setStatusFilter("unsaved")}
                  title="Các câu hỏi mới tạo hoặc sửa chỉ mới lưu ở máy này (localStorage)"
                >
                  <span className="classic-editor__filter-tab-dot is-unsaved" />
                  <span>Chưa lưu máy chủ</span>
                  <span className="classic-editor__filter-tab-count is-unsaved">{unsavedCount}</span>
                </button>
              ) : null}

              <button
                type="button"
                role="tab"
                aria-selected={statusFilter === "draft"}
                className={cn("classic-editor__filter-tab", statusFilter === "draft" && "is-active")}
                onClick={() => setStatusFilter("draft")}
                title="Các câu hỏi đã lưu trên database máy chủ nhưng chưa xuất bản"
              >
                <span className="classic-editor__filter-tab-dot is-draft" />
                <span>Bản nháp</span>
                <span className="classic-editor__filter-tab-count">{draftCount}</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={statusFilter === "published"}
                className={cn("classic-editor__filter-tab", statusFilter === "published" && "is-active")}
                onClick={() => setStatusFilter("published")}
                title="Các câu hỏi đã xuất bản chính thức vào đề thi"
              >
                <span className="classic-editor__filter-tab-dot is-published" />
                <span>Đã xuất bản</span>
                <span className="classic-editor__filter-tab-count">{publishedCount}</span>
              </button>
            </div>
          </div>

          <div className="classic-editor__manager-list-wrap">
            <div className="classic-editor__manager-list-head" aria-hidden="true">
              <span className="classic-editor__manager-list-head-check">
                <Checkbox
                  size="small"
                  checked={isAllSelected}
                  indeterminate={isSomeSelected}
                  onChange={(e) => handleToggleAll(e.target.checked)}
                  sx={{
                    p: 0,
                    color: "#94A3B8",
                    "&.Mui-checked, &.MuiCheckbox-indeterminate": { color: "#0F6CBD" },
                  }}
                  aria-label="Chọn tất cả câu hỏi"
                />
              </span>
              <span>Loại câu hỏi</span>
              <span>Nội dung</span>
              <span>Chủ đề</span>
              <span>Trạng thái</span>
            </div>

            <div className="classic-editor__manager-list">
              {filteredRows.length ? (
                filteredRows.map((row) => {
                  const isChecked = selectedSlideIds.includes(row.slide.id);
                  const isActive = row.slide.id === selectedSlideId;

                  return (
                    <div
                      key={row.slide.id}
                      role="row"
                      tabIndex={0}
                      className={cn(
                        "classic-editor__manager-list-row",
                        getManagerRowKindClass(row.slide.kind),
                        isChecked && "is-checked",
                        isActive && "is-active",
                      )}
                      aria-selected={isChecked}
                      onClick={() => {
                        if (onSelectSlide) {
                          onSelectSlide(row.groupId, row.slide.id);
                        } else {
                          onOpenEditorFor(row.groupId, row.slide.id);
                        }
                      }}
                      onDoubleClick={() => onOpenEditorFor(row.groupId, row.slide.id)}
                    >
                      <span
                        className="classic-editor__manager-list-check"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleRow(row.slide.id);
                        }}
                      >
                        <Checkbox
                          size="small"
                          checked={isChecked}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggleRow(row.slide.id);
                          }}
                          sx={{
                            p: 0,
                            color: "#CBD5E1",
                            "&.Mui-checked": { color: "#0F6CBD" },
                          }}
                          aria-label={`Chọn câu ${row.index}`}
                        />
                      </span>
                      <span className="classic-editor__manager-list-main">
                        <span className="classic-editor__manager-list-type">
                          {formatManagerQuestionType(row.slide, t)}
                        </span>
                        <span className="classic-editor__manager-list-question">
                          {row.slide.title}
                        </span>
                        {row.slide.description ? (
                          <span className="classic-editor__manager-list-description">
                            {row.slide.description}
                          </span>
                        ) : null}
                      </span>
                      <span className="classic-editor__manager-list-topic">
                        {topicLabel}
                      </span>
                      <span className="classic-editor__manager-list-status">
                        {renderStatusBadge(row.slide.status, isSavedOnServer)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <QuestionManagerEmptyState statusFilter={statusFilter} onAddNewQuestion={onAddNewQuestion} />
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
