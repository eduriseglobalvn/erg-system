import { useEffect, useMemo, useState } from "react";
import Checkbox from "@mui/material/Checkbox";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import PublishIcon from "@mui/icons-material/Publish";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import CloudDoneOutlinedIcon from "@mui/icons-material/CloudDoneOutlined";
import CloudOffOutlinedIcon from "@mui/icons-material/CloudOffOutlined";

import { useI18n, type MessageKey } from "@/platform/i18n";
import type {
  QuestionCreationPreset,
  QuestionType,
  QuizEditorGroup,
  QuizEditorSlide,
  SlideKind,
  SelectedEditorNode,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import {
  getSlideKindLabelKey,
  isQuestionManagerSlideKind,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
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

type Translate = (key: MessageKey, params?: Record<string, string | number>) => string;

const managerQuestionTypeLabels: Partial<Record<SlideKind, string>> = {
  "instruction-slide": "Trang hướng dẫn",
  "intro-slide": "Trang giới thiệu",
  "user-info": "Thông tin học viên",
  "true-false": "Đúng / Sai",
  "multiple-choice": "Trắc nghiệm (1 đáp án)",
  "multiple-response": "Trắc nghiệm (Nhiều đáp án)",
  "fill-in-the-blanks": "Điền chỗ trống",
  matching: "Ghép nối",
  sequence: "Sắp xếp thứ tự",
  hotspot: "Điểm nóng ảnh",
  "drag-and-drop": "Kéo thả",
  "drag-the-words": "Kéo từ vào chỗ trống",
  "select-from-lists": "Chọn từ danh sách",
  numeric: "Số học",
  "short-answer": "Trả lời ngắn",
  "likert-scale": "Thang đo Likert",
  essay: "Tự luận",
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
  const [statusFilter, setStatusFilter] = useState<"all" | "unsaved" | "draft" | "published">("all");

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
                <span>+ Tạo câu hỏi</span>
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
                <div className="classic-editor__manager-empty">
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: "50%",
                      backgroundColor: "rgba(15, 108, 189, 0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#0F6CBD",
                      marginBottom: 12,
                    }}
                  >
                    <QuizOutlinedIcon sx={{ fontSize: 28 }} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "15.5px", color: "#0F172A", marginBottom: 6 }}>
                    {statusFilter === "all"
                      ? "Chưa có câu hỏi nào trong bài kiểm tra này"
                      : `Không có câu hỏi nào thuộc mục "${
                          statusFilter === "unsaved"
                            ? "Chưa lưu máy chủ"
                            : statusFilter === "draft"
                              ? "Bản nháp"
                              : "Đã xuất bản"
                        }"`}
                  </div>
                  <div style={{ color: "#64748B", fontSize: "13px", maxWidth: 440, textAlign: "center", marginBottom: 18 }}>
                    {statusFilter === "all"
                      ? "Bắt đầu thêm câu hỏi mới để xây dựng nội dung bài kiểm tra"
                      : "Chuyển sang bộ lọc 'Tất cả' hoặc thêm câu hỏi mới"}
                  </div>
                  <button
                    type="button"
                    onClick={() => onAddNewQuestion?.("multiple-choice")}
                    className="classic-editor__manager-action is-primary"
                    style={{
                      height: 38,
                      padding: "0 22px",
                      fontSize: "13.5px",
                      fontWeight: 700,
                      borderRadius: "9px",
                      boxShadow: "0 4px 14px rgba(15, 108, 189, 0.22)",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <AddRoundedIcon sx={{ fontSize: 18 }} />
                    <span>+ Tạo câu hỏi mới</span>
                  </button>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 16, flexWrap: "wrap", justifyContent: "center" }}>
                    <span style={{ fontSize: "11.5px", color: "#94A3B8", marginRight: 2 }}>Dạng câu hỏi:</span>
                    {[
                      { label: "Trắc nghiệm (1 đáp án)", type: "multiple-choice" as const },
                      { label: "Trắc nghiệm (Nhiều đáp án)", type: "multiple-response" as const },
                      { label: "Đúng / Sai", type: "true-false" as const },
                      { label: "Điền chỗ trống", type: "fill-in-the-blanks" as const },
                      { label: "Ghép nối", type: "matching" as const },
                    ].map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => onAddNewQuestion?.(item.type)}
                        style={{
                          border: "1px solid #E2E8F0",
                          borderRadius: "999px",
                          background: "#F8FAFC",
                          padding: "3px 10px",
                          fontSize: "11.5px",
                          fontWeight: 600,
                          color: "#334155",
                          cursor: "pointer",
                          transition: "all 120ms ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#0F6CBD";
                          e.currentTarget.style.color = "#0F6CBD";
                          e.currentTarget.style.background = "rgba(15, 108, 189, 0.06)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#E2E8F0";
                          e.currentTarget.style.color = "#334155";
                          e.currentTarget.style.background = "#F8FAFC";
                        }}
                      >
                        + {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function renderStatusBadge(status?: "unsaved" | "draft" | "published", isSavedOnServer?: boolean) {
  if (status === "published") {
    return (
      <span className="classic-editor__status-badge is-published" title="Câu hỏi đã xuất bản chính thức vào đề thi">
        <span className="classic-editor__status-dot" />
        <span>Đã xuất bản</span>
      </span>
    );
  }

  if (status === "unsaved" || (!status && !isSavedOnServer)) {
    return (
      <span className="classic-editor__status-badge is-unsaved" title="Mới lưu tạm trên máy này (localStorage), chưa lưu lên cơ sở dữ liệu máy chủ">
        <span className="classic-editor__status-dot" />
        <span>Chưa lưu máy chủ</span>
      </span>
    );
  }

  return (
    <span className="classic-editor__status-badge is-draft" title="Bản nháp đã lưu trên cơ sở dữ liệu máy chủ">
      <span className="classic-editor__status-dot" />
      <span>Bản nháp</span>
    </span>
  );
}

function formatManagerQuestionType(slide: QuizEditorSlide, t: Translate) {
  if (slide.kind === "true-false" && isYesNoSlide(slide)) {
    return "Yes/No";
  }

  const kind = slide.kind;
  return managerQuestionTypeLabels[kind] ?? t(getSlideKindLabelKey(kind));
}

function getManagerRowKindClass(kind: SlideKind) {
  return `is-kind-${kind.replaceAll("-", "_")}`;
}

function isYesNoSlide(slide: QuizEditorSlide) {
  const normalizedChoices = (slide.choices ?? [])
    .map((choice) => choice.label.trim().toLowerCase())
    .filter(Boolean);

  if (normalizedChoices.length !== 2) return false;

  return (
    normalizedChoices.some((label) => ["yes", "y", "có", "co"].includes(label)) &&
    normalizedChoices.some((label) => ["no", "n", "không", "khong"].includes(label))
  );
}
