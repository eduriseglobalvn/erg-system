import { useEffect, useMemo, useState } from "react";
import { useParams } from "@/routes/router-compat";
import {
  ChevronLeft,
  ChevronRight,
  FileQuestion,
  FileText,
  Folder,
  Monitor,
  MonitorPlay,
  Presentation,
  RefreshCw,
  Search,
  type LucideIcon,
} from "lucide-react";

import {
  ExplorerViewToggle,
  LearningResourceFolderTile,
  LearningResourceSquareCard,
  WindowsFolderIcon,
  type ExplorerViewMode,
} from "@/components/learning-resources/explorer-ui";
import { AUTH_ACCOUNT_CHANGED_EVENT, getCurrentAccount } from "@/platform/auth";
import {
  loadLearningResourceLibrarySections,
  loadLearningResourceResourceForViewer,
  getMockLearningResourceLibrarySubjects,
  getMockLearningResourceLibraryCategories,
  getDefaultMockLearningResourceLibrarySelection,
} from "@/features/lms/learning-resources/api/learning-resource-api";
import { USE_LEARNING_RESOURCE_AUTHORING_MOCK } from "@/features/lcms/admin-operations/api/mock-learning-resource-authoring-data";
import {
  DEFAULT_LEARNING_RESOURCE_SELECTION,
  LEARNING_RESOURCE_GRADES,
  LEARNING_RESOURCE_LIBRARY_SECTIONS,
  type LearningResourceCategory,
  type LearningResourceFileType,
  type LearningResourceResource,
  type LearningResourceResourceSection,
  type LearningResourceSubject,
} from "@/features/lms/learning-resources/api/learning-resource-data";
import { displayText } from "@/features/lms/learning-resources/components/learning-resource-library-utils";
import { ResourceViewerModal } from "@/features/lms/learning-resources/components/learning-resource-viewer-modal";
import { usePacedStateBatch } from "@/hooks/use-paced-state-batch";

const fileIcons: Record<LearningResourceFileType, LucideIcon> = {
  PDF: FileText,
  PPTX: Presentation,
  VIDEO: MonitorPlay,
  AUDIO: FileText,
  HTML5: MonitorPlay,
  LINK: FileText,
  QUIZ: FileQuestion,
  ZIP: Folder,
  DOCX: FileText,
  XLSX: FileText,
  IMAGE: FileText,
};

function matchesResource(
  resource: LearningResourceResource,
  selected: { gradeId: string; subjectId: string; categoryId: string; keyword: string },
) {
  const categoryMatches = resource.categoryId === selected.categoryId;
  const categoryOwnsSubject = ["giao-duc-stem", "ic3-digital-literacy", "mos", "tin-hoc-pho-thong"].includes(selected.categoryId);
  const subjectMatches = categoryOwnsSubject || selected.subjectId === "all" || resource.subjectId === selected.subjectId;
  const gradeMatches =
    !resource.gradeId ||
    resource.gradeId === selected.gradeId ||
    ["ic3", "mos", "tin-hoc"].includes(resource.subjectId) ||
    resource.subjectId.startsWith("mock-");
  const keyword = selected.keyword.trim().toLowerCase();
  const keywordMatches =
    keyword.length === 0 ||
    [resource.title, resource.subtitle, resource.formatBadge, resource.viewer.title]
      .join(" ")
      .toLowerCase()
      .includes(keyword);

  return categoryMatches && subjectMatches && gradeMatches && keywordMatches;
}

function getDefaultSelectionForGrade(gradeId: string) {
  return {
    gradeId,
    subjectId: "tieng-anh",
    categoryId: "sgk-tieng-anh",
  };
}

function getLearningResourceExplorerSubjects() {
  return [
    { id: "all", label: "Tất cả" },
    { id: "toan", label: "Toán" },
    { id: "tieng-viet", label: "Tiếng Việt" },
    { id: "tu-nhien-xa-hoi", label: "Tự nhiên và Xã hội", gradeIds: ["1", "2", "3"] },
    { id: "ngu-van", label: "Ngữ văn" },
    { id: "tieng-anh", label: "Tiếng Anh" },
    { id: "khoa-hoc-tu-nhien", label: "Khoa học tự nhiên" },
    { id: "lich-su-dia-li", label: "Lịch sử và Địa lí" },
    { id: "giao-duc-stem", label: "Giáo dục STEM" },
    { id: "giao-duc-ki-nang-cong-dan-so", label: "Giáo dục Kĩ năng Công dân số" },
    { id: "tin-hoc", label: "Tin học" },
    { id: "ic3", label: "IC3" },
    { id: "mos", label: "MOS" },
  ];
}

function getLearningResourceExplorerCategories() {
  return [
    { id: "nhat-ki-ngay-he-vui", label: "Nhật kí ngày hè vui", icon: "document" as const },
    { id: "sgk-tieng-anh", label: "Học liệu SGK Tiếng Anh", icon: "book" as const },
    { id: "sach-mem-2", label: "Sách Mềm 2.0", parentId: "sgk-tieng-anh", icon: "document" as const },
    { id: "hop-phan-bo-tro", label: "Hợp phần bổ trợ", parentId: "sgk-tieng-anh", icon: "document" as const },
    { id: "tieng-anh-tang-cuong", label: "Tiếng Anh Tăng Cường", icon: "book" as const },
    { id: "global-maths", label: "Global Maths", parentId: "tieng-anh-tang-cuong", icon: "document" as const },
    { id: "global-science", label: "Global Science", parentId: "tieng-anh-tang-cuong", icon: "document" as const },
    { id: "hoc-lieu-thong-minh", label: "Học liệu Thông minh", icon: "smart" as const },
    { id: "ket-noi-tri-thuc", label: "Kết nối tri thức với cuộc sống", parentId: "hoc-lieu-thong-minh", icon: "document" as const },
    { id: "chan-troi-sang-tao", label: "Chân trời sáng tạo", parentId: "hoc-lieu-thong-minh", icon: "document" as const },
    { id: "cung-hoc-phat-trien", label: "Cùng học để phát triển năng lực", parentId: "hoc-lieu-thong-minh", icon: "document" as const },
    { id: "theo-sgk-khac", label: "Theo SGK khác", parentId: "hoc-lieu-thong-minh", icon: "document" as const },
    { id: "hoc-lieu-giao-duc-khac", label: "Học liệu Giáo dục khác", icon: "stem" as const },
    { id: "giao-duc-stem", label: "Học liệu Giáo dục STEM", parentId: "hoc-lieu-giao-duc-khac", icon: "stem" as const },
    { id: "hoc-lieu-sach-tham-khao", label: "Học liệu Sách tham khảo", parentId: "hoc-lieu-giao-duc-khac", icon: "document" as const },
    { id: "hoc-lieu-hanh-trang-cong-dan-so", label: "Học liệu Hành trang công dân số", parentId: "hoc-lieu-giao-duc-khac", icon: "document" as const },
    { id: "hoc-lieu-tin-hoc", label: "Học liệu Tin học", icon: "computer" as const },
    { id: "tin-hoc-pho-thong", label: "Tin học phổ thông", parentId: "hoc-lieu-tin-hoc", icon: "computer" as const },
    { id: "scratch-python", label: "Scratch & Python", parentId: "hoc-lieu-tin-hoc", icon: "computer" as const },
    { id: "chung-chi-tin-hoc", label: "Chứng chỉ Tin học", icon: "certificate" as const },
    { id: "ic3-digital-literacy", label: "IC3 Digital Literacy", parentId: "chung-chi-tin-hoc", icon: "certificate" as const },
    { id: "mos", label: "MOS", parentId: "chung-chi-tin-hoc", icon: "certificate" as const },
  ];
}


function getTopLevelCategoriesFrom(categories: LearningResourceCategory[]) {
  return categories.filter((category) => !category.parentId);
}

function getCategoryChildrenFrom(categories: LearningResourceCategory[], parentId: string) {
  return categories.filter((category) => category.parentId === parentId);
}

function getCategoryPathFrom(categories: LearningResourceCategory[], categoryId: string): LearningResourceCategory[] {
  const category = categories.find((cat) => cat.id === categoryId);
  if (!category) return [];
  if (!category.parentId) return [category];
  return [...getCategoryPathFrom(categories, category.parentId), category];
}

function CategoryTree({
  activeCategoryId,
  categories,
  onSelectCategory,
}: {
  activeCategoryId: string;
  categories: LearningResourceCategory[];
  onSelectCategory: (categoryId: string) => void;
}) {
  const topLevelCategories = getTopLevelCategoriesFrom(categories);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!activeCategoryId) return;
    const parent = categories.find((cat) => cat.id === activeCategoryId)?.parentId;
    if (parent) {
      setExpandedIds((prev) => {
        if (prev.has(parent)) return prev;
        const next = new Set(prev);
        next.add(parent);
        return next;
      });
    }
  }, [activeCategoryId, categories]);

  function toggleExpand(id: string, event?: React.MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <aside className="min-h-0 overflow-y-auto border-r border-[#e5e5e5] bg-[#fafafa] px-1.5 py-2 [scrollbar-gutter:stable]">
      <nav className="space-y-0.5 pt-1">
        {topLevelCategories.map((category) => {
          const children = getCategoryChildrenFrom(categories, category.id);
          const isSelected = category.id === activeCategoryId;
          const isExpanded = expandedIds.has(category.id);

          return (
            <div key={category.id}>
              <button
                type="button"
                onClick={() => {
                  onSelectCategory(category.id);
                  setExpandedIds((prev) => {
                    if (prev.has(category.id)) return prev;
                    const next = new Set(prev);
                    next.add(category.id);
                    return next;
                  });
                }}
                className={`relative flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition ${
                  isSelected ? "bg-[var(--erg-blue-light)] font-medium text-slate-950 before:absolute before:left-0 before:top-1.5 before:h-5 before:w-0.5 before:rounded-full before:bg-[var(--erg-blue)]" : "text-slate-800 hover:bg-white"
                }`}
              >
                <span
                  onClick={(e) => toggleExpand(category.id, e)}
                  className="grid h-5 w-5 place-items-center rounded hover:bg-black/5"
                >
                  <ChevronRight className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                </span>
                <WindowsFolderIcon open={isExpanded} />
                <span className="min-w-0 flex-1 truncate">{displayText(category.label)}</span>
              </button>
              {children.length > 0 && isExpanded ? (
                <div className="ml-5 space-y-0.5">
                  {children.map((child) => {
                    const isChildActive = child.id === activeCategoryId;

                    return (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => onSelectCategory(child.id)}
                        className={`relative flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition ${
                          isChildActive ? "bg-[var(--erg-blue-light)] font-medium text-slate-950 before:absolute before:left-0 before:top-1.5 before:h-5 before:w-0.5 before:rounded-full before:bg-[var(--erg-blue)]" : "text-slate-800 hover:bg-white"
                        }`}
                      >
                        <span className="w-3.5" />
                        <WindowsFolderIcon open={isChildActive} />
                        <span className="min-w-0 flex-1 truncate">{displayText(child.label)}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

function getStableDate(seed: string) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) % 100_000;
  const month = (hash % 12) + 1;
  const day = (hash % 26) + 1;
  const hour = (hash % 12) + 1;
  const minute = hash % 60;
  return `${month}/${day}/2026 ${hour}:${String(minute).padStart(2, "0")} ${hash % 2 ? "AM" : "PM"}`;
}

function getExplorerSize(resource: LearningResourceResource) {
  if (resource.fileType === "AUDIO" || resource.fileType === "VIDEO") return resource.viewer.duration ?? "";
  let hash = 0;
  for (const char of resource.id) hash = (hash * 17 + char.charCodeAt(0)) % 240_000;
  return `${Math.max(24, hash).toLocaleString("en-US")} KB`;
}

function getExplorerType(resource: LearningResourceResource) {
  if (resource.fileType === "PPTX") return "Bài giảng";
  if (resource.fileType === "AUDIO") return "Audio";
  if (resource.fileType === "VIDEO") return "Video";
  if (resource.fileType === "QUIZ") return "Bài tập";
  if (resource.fileType === "IMAGE") return "Ảnh";
  if (resource.fileType === "ZIP") return "Tệp nén";
  return resource.formatBadge;
}

function ResourceExplorerIcon({ resource }: { resource: LearningResourceResource }) {
  const FileIcon = fileIcons[resource.fileType];
  return <FileIcon className="h-4 w-4 shrink-0 text-[var(--erg-blue)]" />;
}

function getLearningCardMeta(resource: LearningResourceResource) {
  let hash = 0;
  for (const char of resource.id) hash = (hash * 29 + char.charCodeAt(0)) % 997;
  const testNo = (hash % 7) + 1;
  const unitNo = (hash % 6) + 1;
  const minutes = resource.resourceType === "slide" ? 35 + (hash % 3) * 5 : 45 + (hash % 2) * 15;
  const questions = resource.resourceType === "slide" ? 18 + (hash % 8) : 40 + (hash % 3) * 5;
  const isLesson = resource.resourceType === "slide" || resource.fileType === "PPTX";
  const isExercise = resource.resourceType === "quiz" || resource.fileType === "QUIZ";

  return {
    action: isLesson ? "Mở bài" : isExercise ? "Làm bài" : "Mở file",
    heading: isLesson ? "Bài giảng" : isExercise ? "Luyện tập" : "Học liệu",
    tag: isLesson ? "BG" : isExercise ? `Đề ${testNo}` : resource.fileType,
    unit: `Unit ${String(unitNo).padStart(2, "0")}`,
    minutes,
    questions,
  };
}

function LearningActivityCard({ resource, onOpen }: { resource: LearningResourceResource; onOpen: (resource: LearningResourceResource) => void }) {
  const meta = getLearningCardMeta(resource);

  return (
    <LearningResourceSquareCard
      actionLabel={meta.action}
      heading={meta.heading}
      minutes={meta.minutes}
      questions={meta.questions}
      tag={meta.tag}
      title={displayText(resource.title)}
      unit={meta.unit}
      onOpen={() => onOpen(resource)}
    />
  );
}

function LearningResourceExplorer({
  activeCategoryId,
  activeGradeId,
  activeSubjectId,
  categories,
  keyword,
  libraryError,
  onKeywordChange,
  onOpenResource,
  onRefresh,
  onSelectCategory,
  sections,
  subjects,
  totalVisibleResources,
  viewerLoadingResourceId,
}: {
  activeCategoryId: string;
  activeGradeId: string;
  activeSubjectId: string;
  categories: LearningResourceCategory[];
  keyword: string;
  libraryError: string | null;
  onKeywordChange: (value: string) => void;
  onOpenResource: (resource: LearningResourceResource) => void;
  onRefresh: () => void;
  onSelectCategory: (categoryId: string) => void;
  sections: LearningResourceResourceSection[];
  subjects: LearningResourceSubject[];
  totalVisibleResources: number;
  viewerLoadingResourceId: string | null;
}) {
  const activeCategory = categories.find((category) => category.id === activeCategoryId);
  const activeSubject = subjects.find((subject) => subject.id === activeSubjectId);
  const activeGrade = LEARNING_RESOURCE_GRADES.find((grade) => grade.id === activeGradeId);
  const categoryPath = getCategoryPathFrom(categories, activeCategoryId);
  const childCategories = getCategoryChildrenFrom(categories, activeCategoryId);
  const resources = sections.flatMap((section) => section.resources).sort((left, right) => left.sortOrder - right.sortOrder);
  const breadcrumbItems = useMemo(() => {
    const items: { label: string; categoryId: string }[] = [];
    if (activeSubject) {
      const rootCategoryId = categoryPath[0]?.id || activeCategoryId;
      items.push({
        label: activeSubject.label,
        categoryId: rootCategoryId,
      });
    }
    categoryPath.forEach((cat) => {
      if (activeSubject && cat.label === activeSubject.label && !cat.parentId) {
        return;
      }
      items.push({
        label: cat.label,
        categoryId: cat.id,
      });
    });
    return items;
  }, [activeSubject, categoryPath, activeCategoryId]);

  const itemCount = childCategories.length + resources.length;
  const [viewMode, setViewMode] = useState<ExplorerViewMode>("grid");

  function openContextMenu(event: { preventDefault: () => void; stopPropagation: () => void }) {
    event.preventDefault();
    event.stopPropagation();
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-[#d1d1d1] bg-white text-[13px] text-slate-900 shadow-sm">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-[#e5e5e5] bg-[#f7f8fa] px-3">
        <button type="button" className="grid h-8 w-8 place-items-center rounded-md text-slate-600 hover:bg-white disabled:opacity-45" disabled>
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button type="button" className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-white disabled:opacity-45" disabled>
          <ChevronRight className="h-4 w-4" />
        </button>
        <button type="button" className="grid h-8 w-8 place-items-center rounded-md text-slate-600 hover:bg-white" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4" />
        </button>
        <div className="flex h-8 min-w-0 flex-1 items-center overflow-hidden rounded-md border border-[#d1d1d1] bg-white px-2 shadow-sm">
          <Monitor className="mx-2 h-4 w-4 shrink-0 text-slate-500" />
          {breadcrumbItems.map((item, index) => (
            <span key={`${item.label}-${index}`} className="flex min-w-0 items-center">
              {index > 0 ? <ChevronRight className="mx-1 h-3.5 w-3.5 shrink-0 text-[#6b7280]" /> : null}
              <button
                type="button"
                onClick={() => onSelectCategory(item.categoryId)}
                className={`cursor-pointer truncate rounded px-1.5 py-0.5 text-[13px] outline-none transition-colors duration-150 hover:bg-slate-100 ${
                  index === breadcrumbItems.length - 1 ? "font-medium text-slate-950" : "text-slate-700 hover:text-slate-950"
                }`}
              >
                {displayText(item.label)}
              </button>
            </span>
          ))}
        </div>
        <div className="flex h-8 w-[280px] max-w-[30vw] items-center rounded-md border border-[#d1d1d1] bg-white px-3 shadow-sm focus-within:border-[var(--erg-blue)] focus-within:ring-2 focus-within:ring-[var(--erg-blue-ring)]">
          <Search className="mr-2 h-4 w-4 text-slate-500" />
          <input
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
            placeholder={`Search ${displayText(activeSubject?.label) || "Resources"}`}
            className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#64748b]"
            type="search"
          />
        </div>
      </div>

      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-[#e5e5e5] bg-white px-3">
        <span className="text-[13px] font-semibold text-slate-800">{displayText(activeCategory?.label) || "Kho học liệu"}</span>
        <span className="rounded-md border border-[#d1d1d1] bg-[#f7f8fa] px-2 py-1 text-[12px] font-medium text-slate-600">{itemCount} mục</span>
        <ExplorerViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[250px_minmax(0,1fr)] overflow-hidden">
        <CategoryTree activeCategoryId={activeCategoryId} categories={categories} onSelectCategory={onSelectCategory} />

        <section className="min-h-0 min-w-0 overflow-hidden bg-white" onContextMenu={(event) => openContextMenu(event)}>
          {viewMode === "list" ? (
            <>
              <div className="grid grid-cols-[minmax(260px,1fr)_155px_120px_95px] border-b border-[#e5e5e5] bg-[#fafafa] text-[12px] font-semibold text-slate-600">
                <span className="border-r border-[#e5e5e5] px-4 py-2">Tên</span>
                <span className="border-r border-[#e5e5e5] px-3 py-2">Cập nhật</span>
                <span className="border-r border-[#e5e5e5] px-3 py-2">Loại</span>
                <span className="px-3 py-2">Dung lượng</span>
              </div>
              <div className="h-[calc(100%-33px)] overflow-y-auto [scrollbar-gutter:stable]">
                {childCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => onSelectCategory(category.id)}
                    onContextMenu={openContextMenu}
                    className="grid h-9 w-full grid-cols-[minmax(260px,1fr)_155px_120px_95px] items-center border-b border-transparent text-left text-[13px] hover:bg-[#f7f8fa]"
                  >
                    <span className="flex min-w-0 items-center gap-2 px-4 py-1.5">
                      <WindowsFolderIcon />
                      <span className="truncate font-medium text-slate-900">{displayText(category.label)}</span>
                    </span>
                    <span className="truncate px-3 text-slate-600">{getStableDate(category.id)}</span>
                    <span className="truncate px-3 text-slate-600">Thư mục</span>
                    <span className="truncate px-3 text-slate-600" />
                  </button>
                ))}

                {resources.map((resource) => (
                  <button
                    key={resource.id}
                    type="button"
                    onClick={() => onOpenResource(resource)}
                    onContextMenu={openContextMenu}
                    className="grid h-9 w-full grid-cols-[minmax(260px,1fr)_155px_120px_95px] items-center border-b border-transparent text-left text-[13px] hover:bg-[#f7f8fa]"
                  >
                    <span className="flex min-w-0 items-center gap-2 px-4 py-1.5">
                      <ResourceExplorerIcon resource={resource} />
                      <span className="truncate text-slate-900">{displayText(resource.title)}</span>
                    </span>
                    <span className="truncate px-3 text-slate-600">{getStableDate(resource.id)}</span>
                    <span className="truncate px-3 text-slate-600">{getExplorerType(resource)}</span>
                    <span className="truncate px-3 text-slate-600">{getExplorerSize(resource)}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="h-full overflow-y-auto p-4 [scrollbar-gutter:stable]">
              <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
                {childCategories.map((category) => (
                  <div
                    key={category.id}
                    onContextMenu={openContextMenu}
                  >
                    <LearningResourceFolderTile
                      label={displayText(category.label)}
                      onClick={() => onSelectCategory(category.id)}
                    />
                  </div>
                ))}

                {resources.map((resource) => (
                  <div
                    key={resource.id}
                    onContextMenu={openContextMenu}
                  >
                    <LearningActivityCard resource={resource} onOpen={onOpenResource} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {libraryError ? (
            <p className="m-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
              {displayText(libraryError)}
            </p>
          ) : null}
          {viewerLoadingResourceId ? (
            <p className="m-3 rounded-md border border-[#b8d6fa] bg-[var(--erg-blue-light)] px-3 py-2 text-sm font-medium text-[var(--erg-blue)]">
              Đang mở học liệu...
            </p>
          ) : null}
          {!itemCount ? <EmptyState /> : null}
        </section>
      </div>

      <div className="flex h-7 shrink-0 items-center justify-between border-t border-[#e5e5e5] bg-[#fafafa] px-3 text-[12px] text-slate-600">
        <span>{itemCount} mục</span>
        <span>{displayText(activeGrade?.label) || "-"} / {displayText(activeCategory?.label) || "Kho học liệu"} / {totalVisibleResources} học liệu</span>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-slate-100 text-slate-400">
        <Search className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-950">Không tìm thấy tài liệu phù hợp</h3>
      <p className="mt-2 text-sm text-slate-500">Hãy đổi bộ lọc lớp, môn, nhóm học liệu hoặc từ khóa tìm kiếm.</p>
    </div>
  );
}

export function LearningResourceLibraryPage() {
  const { gradeId: routeGradeId } = useParams<{ gradeId?: string }>();
  const initialGradeId = LEARNING_RESOURCE_GRADES.some((grade) => grade.id === routeGradeId)
    ? routeGradeId ?? DEFAULT_LEARNING_RESOURCE_SELECTION.gradeId
    : DEFAULT_LEARNING_RESOURCE_SELECTION.gradeId;
  const initialSelection = useMemo(() => {
    if (USE_LEARNING_RESOURCE_AUTHORING_MOCK) {
      return getDefaultMockLearningResourceLibrarySelection(initialGradeId);
    }
    return getDefaultSelectionForGrade(initialGradeId);
  }, [initialGradeId]);
  const [account, setAccount] = useState(() => getCurrentAccount());
  const [activeGradeId, setActiveGradeId] = useState(initialSelection.gradeId);
  const [activeSubjectId, setActiveSubjectId] = useState(initialSelection.subjectId);
  const [activeCategoryId, setActiveCategoryId] = useState(initialSelection.categoryId);
  const [keyword, setKeyword] = useState("");
  const categories = useMemo(() => {
    if (USE_LEARNING_RESOURCE_AUTHORING_MOCK) {
      return getMockLearningResourceLibraryCategories();
    }
    return getLearningResourceExplorerCategories();
  }, []);
  const subjects = useMemo(() => {
    if (USE_LEARNING_RESOURCE_AUTHORING_MOCK) {
      return getMockLearningResourceLibrarySubjects();
    }
    return getLearningResourceExplorerSubjects();
  }, []);
  const [librarySections, setLibrarySections] = useState(LEARNING_RESOURCE_LIBRARY_SECTIONS);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [viewerLoadingResourceId, setViewerLoadingResourceId] = useState<string | null>(null);
  const [activeResource, setActiveResource] = useState<LearningResourceResource | null>(null);
  const paceStateUpdate = usePacedStateBatch();

  useEffect(() => {
    function handleAuthChanged() {
      setAccount(getCurrentAccount());
    }

    window.addEventListener(AUTH_ACCOUNT_CHANGED_EVENT, handleAuthChanged);
    return () => window.removeEventListener(AUTH_ACCOUNT_CHANGED_EVENT, handleAuthChanged);
  }, []);

  useEffect(() => {
    if (!routeGradeId || !LEARNING_RESOURCE_GRADES.some((grade) => grade.id === routeGradeId)) return;
    const nextSelection = USE_LEARNING_RESOURCE_AUTHORING_MOCK
      ? getDefaultMockLearningResourceLibrarySelection(routeGradeId)
      : getDefaultSelectionForGrade(routeGradeId);
    paceStateUpdate(() => {
      setActiveGradeId(nextSelection.gradeId);
      setActiveSubjectId(nextSelection.subjectId);
      setActiveCategoryId(nextSelection.categoryId);
    });
  }, [paceStateUpdate, routeGradeId]);

  useEffect(() => {
    if (!account) return undefined;

    let isCancelled = false;

    async function loadLibrary() {
      try {
        setLibraryError(null);
        const sections = await loadLearningResourceLibrarySections();
        if (!isCancelled) setLibrarySections(sections);
      } catch {
        if (!isCancelled) {
          setLibrarySections(LEARNING_RESOURCE_LIBRARY_SECTIONS);
          setLibraryError(null);
        }
      }
    }

    void loadLibrary();

    return () => {
      isCancelled = true;
    };
  }, [account]);

  const visibleSections = useMemo(() => {
    return librarySections.map((section) => ({
      ...section,
      resources: section.resources.filter((resource) =>
        matchesResource(resource, {
          gradeId: activeGradeId,
          subjectId: activeSubjectId,
          categoryId: activeCategoryId,
          keyword,
        }),
      ),
    })).filter((section) => section.resources.length > 0);
  }, [activeCategoryId, activeGradeId, activeSubjectId, keyword, librarySections]);

  const totalVisibleResources = visibleSections.reduce((total, section) => total + section.resources.length, 0);

  async function handleOpenResource(resource: LearningResourceResource) {
    setActiveResource(resource);
    setLibraryError(null);

    if (!account) return;

    setViewerLoadingResourceId(resource.id);

    try {
      const hydratedResource = await loadLearningResourceResourceForViewer(resource);
      setActiveResource((currentResource) => (currentResource?.id === resource.id ? hydratedResource : currentResource));
    } catch (error) {
      setLibraryError(error instanceof Error ? error.message : "Không thể mở viewer từ API.");
    } finally {
      setViewerLoadingResourceId(null);
    }
  }

  return (
    <div className="flex h-[calc(100vh-64px)] min-h-0 flex-col overflow-hidden bg-[#f7f8fa]">
      <div className="min-h-0 flex-1 p-3">
        <LearningResourceExplorer
          activeCategoryId={activeCategoryId}
          activeGradeId={activeGradeId}
          activeSubjectId={activeSubjectId}
          categories={categories}
          keyword={keyword}
          libraryError={libraryError}
          onKeywordChange={setKeyword}
          onOpenResource={(resource) => void handleOpenResource(resource)}
          onRefresh={() => setKeyword((value) => value)}
          onSelectCategory={setActiveCategoryId}
          sections={visibleSections}
          subjects={subjects}
          totalVisibleResources={totalVisibleResources}
          viewerLoadingResourceId={viewerLoadingResourceId}
        />
      </div>

      {activeResource ? <ResourceViewerModal resource={activeResource} onClose={() => setActiveResource(null)} /> : null}
    </div>
  );
}
