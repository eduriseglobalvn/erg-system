import { useEffect, useMemo, useState, lazy, Suspense, type FormEvent } from "react";
import { useParams, useLocation, Navigate } from "react-router-dom";
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
  Download,
  ArrowLeft,
  X,
  Lock,
  FileAudio,
  Play,
  FileArchive,
} from "lucide-react";

import {
  ExplorerViewToggle,
  LearningResourceFolderTile,
  LearningResourceSquareCard,
  WindowsFolderIcon,
  type ExplorerViewMode,
} from "@/components/learning-resources/explorer-ui";
import { AUTH_ACCOUNT_CHANGED_EVENT, getCurrentAccount } from "@/platform/auth";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
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
  type LearningResourceViewerUnit,
} from "@/features/lms/learning-resources/api/learning-resource-data";

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

function displayText(value?: string) {
  if (!value) return "";

  if (!/[ÃÄÂº»¼½¾\u0080-\u009f]/.test(value)) {
    return value;
  }

  try {
    return new TextDecoder("utf-8", { fatal: false }).decode(
      Uint8Array.from(Array.from(value, (character) => character.charCodeAt(0) & 0xff)),
    );
  } catch {
    return value;
  }
}

function getFormatBadgeClass(fileType: LearningResourceFileType) {
  switch (fileType) {
    case "PDF":
      return "bg-slate-500 text-white";
    case "PPTX":
      return "bg-orange-500 text-white";
    case "VIDEO":
      return "bg-rose-500 text-white";
    case "AUDIO":
      return "bg-emerald-500 text-white";
    case "HTML5":
      return "bg-cyan-600 text-white";
    case "QUIZ":
      return "bg-violet-500 text-white";
    case "ZIP":
      return "bg-slate-700 text-white";
    case "DOCX":
      return "bg-blue-600 text-white";
    case "XLSX":
      return "bg-emerald-600 text-white";
    case "IMAGE":
      return "bg-cyan-600 text-white";
    case "LINK":
      return "bg-blue-500 text-white";
    default:
      return "bg-slate-500 text-white";
  }
}

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

const PdfFullScreenPreview = lazy(() =>
  import("./pdf-resource-viewer").then((module) => ({ default: module.PdfFullScreenPreview })),
);

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
    <aside className="min-h-0 overflow-y-auto border-r border-[#e5e7eb] bg-[#fbfbfb] px-1.5 py-2 [scrollbar-gutter:stable]">
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
                className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[13px] transition ${
                  isSelected ? "bg-[#dceeff] text-[#111827] font-semibold" : "text-[#111827] hover:bg-[#eef6ff]"
                }`}
              >
                <span
                  onClick={(e) => toggleExpand(category.id, e)}
                  className="grid h-5 w-5 place-items-center rounded hover:bg-black/5"
                >
                  <ChevronRight className={`h-3.5 w-3.5 shrink-0 text-[#6b7280] transition-transform ${isExpanded ? "rotate-90" : ""}`} />
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
                        className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[13px] transition ${
                          isChildActive ? "bg-[#dceeff] text-[#111827] font-semibold" : "text-[#111827] hover:bg-[#eef6ff]"
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
  return <FileIcon className="h-4 w-4 shrink-0 text-[#2563eb]" />;
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
  const activeGrade = { id: "1", label: "Lớp 1" }; // Mock or fallback
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-[13px] text-slate-900 shadow-sm">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-slate-200 bg-slate-50 px-3">
        <button type="button" className="grid h-8 w-8 place-items-center rounded text-[#374151] hover:bg-white" disabled>
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button type="button" className="grid h-8 w-8 place-items-center rounded text-[#9aa5b1]" disabled>
          <ChevronRight className="h-4 w-4" />
        </button>
        <button type="button" className="grid h-8 w-8 place-items-center rounded text-[#374151] hover:bg-white" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4" />
        </button>
        <div className="flex h-8 min-w-0 flex-1 items-center overflow-hidden rounded-md bg-white px-2 shadow-[inset_0_0_0_1px_#e5e7eb]">
          <Monitor className="mx-2 h-4 w-4 shrink-0 text-[#52616f]" />
          {breadcrumbItems.map((item, index) => (
            <span key={`${item.label}-${index}`} className="flex min-w-0 items-center">
              {index > 0 ? <ChevronRight className="mx-1 h-3.5 w-3.5 shrink-0 text-[#6b7280]" /> : null}
              <button
                type="button"
                onClick={() => onSelectCategory(item.categoryId)}
                className={`truncate rounded px-1.5 py-0.5 text-[13px] transition-colors duration-150 outline-none hover:bg-slate-200/60 cursor-pointer ${
                  index === breadcrumbItems.length - 1 ? "font-medium text-[#111827]" : "text-[#1f2937] hover:text-[#111827]"
                }`}
              >
                {displayText(item.label)}
              </button>
            </span>
          ))}
        </div>
        <div className="flex h-8 w-[280px] max-w-[30vw] items-center rounded-md bg-white px-3 shadow-[inset_0_0_0_1px_#e5e7eb]">
          <Search className="mr-2 h-4 w-4 text-[#52616f]" />
          <input
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
            placeholder={`Search ${displayText(activeSubject?.label) || "Resources"}`}
            className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#64748b]"
            type="search"
          />
        </div>
      </div>

      <div className="flex h-12 shrink-0 items-center gap-1 border-b border-slate-200 bg-white px-3">
        <ExplorerViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[250px_minmax(0,1fr)] overflow-hidden">
        <CategoryTree activeCategoryId={activeCategoryId} categories={categories} onSelectCategory={onSelectCategory} />

        <section className="min-h-0 min-w-0 overflow-hidden bg-white" onContextMenu={(event) => openContextMenu(event)}>
          {viewMode === "list" ? (
            <>
              <div className="grid grid-cols-[minmax(260px,1fr)_155px_120px_95px] border-b border-[#d1d5db] bg-white text-[13px] text-[#27364a]">
                <span className="border-r border-[#e5e7eb] px-4 py-1.5">Name</span>
                <span className="border-r border-[#e5e7eb] px-3 py-1.5">Date modified</span>
                <span className="border-r border-[#e5e7eb] px-3 py-1.5">Type</span>
                <span className="px-3 py-1.5">Size</span>
              </div>
              <div className="h-[calc(100%-31px)] overflow-y-auto [scrollbar-gutter:stable]">
                {childCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => onSelectCategory(category.id)}
                    onContextMenu={openContextMenu}
                    className="grid w-full grid-cols-[minmax(260px,1fr)_155px_120px_95px] items-center text-left text-[13px] hover:bg-[#eef6ff]"
                  >
                    <span className="flex min-w-0 items-center gap-2 px-4 py-1.5">
                      <WindowsFolderIcon />
                      <span className="truncate text-[#111827]">{displayText(category.label)}</span>
                    </span>
                    <span className="truncate px-3 text-[#4b5563]">{getStableDate(category.id)}</span>
                    <span className="truncate px-3 text-[#4b5563]">File folder</span>
                    <span className="truncate px-3 text-[#4b5563]" />
                  </button>
                ))}

                {resources.map((resource) => (
                  <button
                    key={resource.id}
                    type="button"
                    onClick={() => onOpenResource(resource)}
                    onContextMenu={openContextMenu}
                    className="grid w-full grid-cols-[minmax(260px,1fr)_155px_120px_95px] items-center text-left text-[13px] hover:bg-[#eef6ff]"
                  >
                    <span className="flex min-w-0 items-center gap-2 px-4 py-1.5">
                      <ResourceExplorerIcon resource={resource} />
                      <span className="truncate text-[#111827]">{displayText(resource.title)}</span>
                    </span>
                    <span className="truncate px-3 text-[#4b5563]">{getStableDate(resource.id)}</span>
                    <span className="truncate px-3 text-[#4b5563]">{getExplorerType(resource)}</span>
                    <span className="truncate px-3 text-[#4b5563]">{getExplorerSize(resource)}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="h-full overflow-y-auto p-5 [scrollbar-gutter:stable]">
              <div className="grid grid-cols-[repeat(auto-fill,210px)] gap-4">
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
            <p className="m-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-700">
              {displayText(libraryError)}
            </p>
          ) : null}
          {viewerLoadingResourceId ? (
            <p className="m-3 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">
              Đang mở học liệu...
            </p>
          ) : null}
          {!itemCount ? <EmptyState /> : null}
        </section>
      </div>

      <div className="flex h-6 shrink-0 items-center justify-between border-t border-[#e5e7eb] bg-white px-3 text-[12px] text-[#334155]">
        <span>{itemCount} items</span>
        <span>{displayText(activeGrade?.label) || "-"} / {displayText(activeCategory?.label) || "Kho học liệu"} / {totalVisibleResources} học liệu</span>
      </div>
    </div>
  );
}

function FormatBadge({ resource }: { resource: LearningResourceResource }) {
  return (
    <span className={`rounded-md px-2 py-1 text-[11px] font-black leading-none ${getFormatBadgeClass(resource.fileType)}`}>
      {displayText(resource.formatBadge)}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Search className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-lg font-black text-slate-950">Không tìm thấy tài liệu phù hợp</h3>
      <p className="mt-2 text-sm text-slate-500">Hãy đổi bộ lọc lớp, môn, nhóm học liệu hoặc từ khóa tìm kiếm.</p>
    </div>
  );
}

function formatLessonTitle(value: string) {
  const text = displayText(value);
  const match = text.match(/Lesson\s+(\d+).*Period\s+(\d+)/i);

  if (match) {
    const lessonTitles: Record<string, string> = {
      "1": "GETTING STARTED",
      "2": "A CLOSER LOOK 1",
      "3": "A CLOSER LOOK 2",
      "4": "COMMUNICATION",
      "5": "SKILLS 1",
      "6": "SKILLS 2",
    };

    return `Lesson ${match[1]} - ${lessonTitles[match[1]] ?? `Period ${match[2]}`}`;
  }

  return text.replaceAll("_", " ");
}

function getLectureDeckLabel(resource: LearningResourceResource) {
  if (resource.subjectId === "giao-duc-stem") return resource.gradeId ? `STEM ${resource.gradeId}` : "STEM";
  if (resource.subjectId === "ic3") return "IC3 GS6";
  if (resource.subjectId === "mos") return "MOS Office";
  if (resource.subjectId === "tin-hoc") return resource.gradeId ? `Tin học ${resource.gradeId}` : "Tin học";
  if (resource.subjectId === "tieng-anh") return resource.gradeId ? `Tiếng Anh ${resource.gradeId}` : "Tiếng Anh";

  return displayText(resource.subtitle ?? resource.title);
}

function getLectureDeckTheme(resource: LearningResourceResource) {
  switch (resource.subjectId) {
    case "giao-duc-stem":
      return {
        background: "from-[#062d2f] via-[#0b6b72] to-[#50c8d8]",
        panel: "from-[#48c5d3] to-[#0d8795]",
        unit: "bg-[#d9f5f7] text-[#147180]",
        active: "bg-[#147f90]",
      };
    case "ic3":
      return {
        background: "from-[#061738] via-[#123c8c] to-[#6aa2ff]",
        panel: "from-[#5b8dff] to-[#153f96]",
        unit: "bg-[#e6edff] text-[#1a3f96]",
        active: "bg-[#153f96]",
      };
    case "mos":
      return {
        background: "from-[#082018] via-[#10643f] to-[#71d6a0]",
        panel: "from-[#4fc482] to-[#127648]",
        unit: "bg-[#dcf8e9] text-[#17774e]",
        active: "bg-[#127648]",
      };
    default:
      return {
        background: "from-[#0d75a8] via-[#29b8da] to-[#85ddf0]",
        panel: "from-[#58c9e9] to-[#20b2db]",
        unit: "bg-[#d8f1fb] text-[#08749b]",
        active: "bg-[#1284a3]",
      };
  }
}

function LectureUnitCard({
  unit,
  index,
  theme,
  onOpenLesson,
}: {
  unit: LearningResourceViewerUnit;
  index: number;
  theme: ReturnType<typeof getLectureDeckTheme>;
  onOpenLesson: (title: string) => void;
}) {
  const unitTitle = displayText(unit.title);
  const hasChildren = Boolean(unit.children?.length);

  if (!hasChildren) {
    return (
      <button
        type="button"
        onClick={() => onOpenLesson(unitTitle)}
        className={`flex min-h-14 w-full items-center rounded-lg px-7 text-left text-2xl font-black leading-tight ${theme.unit}`}
      >
        {unitTitle}
      </button>
    );
  }

  return (
    <article className="overflow-hidden rounded-lg bg-white shadow-lg shadow-slate-950/10 ring-1 ring-slate-900/10">
      <button
        type="button"
        onClick={() => onOpenLesson(unitTitle)}
        className={`flex min-h-16 w-full items-center px-8 text-left text-2xl font-black leading-tight text-white transition hover:brightness-105 ${theme.active}`}
      >
        {unitTitle}
      </button>
      <div className="max-h-[340px] overflow-y-auto">
        {unit.children?.map((child) => (
          <button
            key={child.id}
            type="button"
            onClick={() => onOpenLesson(formatLessonTitle(child.title))}
            className="block w-full border-t border-slate-200 px-10 py-4 text-left text-base font-bold text-[#05739d] transition hover:bg-sky-50 hover:text-[var(--erg-blue)]"
          >
            {formatLessonTitle(child.title)}
          </button>
        ))}
      </div>
      {index === 0 ? <div className="h-3 bg-white" /> : null}
    </article>
  );
}

function LectureBankView({
  resource,
  onClose,
  onOpenLesson,
}: {
  resource: LearningResourceResource;
  onClose: () => void;
  onOpenLesson: (title: string) => void;
}) {
  const units = resource.viewer.units ?? [];
  const theme = getLectureDeckTheme(resource);
  const deckLabel = getLectureDeckLabel(resource);
  const title = displayText(resource.viewer.title);

  return (
    <div className={`fixed inset-0 z-[240] overflow-y-auto bg-gradient-to-br ${theme.background}`}>
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 14%, rgb(255 255 255 / 0.7), transparent 13%), radial-gradient(circle at 82% 24%, rgb(255 255 255 / 0.45), transparent 15%), radial-gradient(circle at 20% 86%, rgb(7 89 133 / 0.55), transparent 18%), linear-gradient(115deg, transparent 0 58%, rgb(255 255 255 / 0.18) 58% 60%, transparent 60%)",
        }}
      />
      <button
        type="button"
        onClick={onClose}
        className="fixed left-0 top-7 z-10 flex h-16 w-24 items-center justify-center rounded-r-full bg-white/95 text-[var(--erg-blue)] shadow-lg shadow-slate-950/15 transition hover:w-28"
        aria-label="Quay lại kho học liệu"
      >
        <span className="text-center text-xs font-black leading-4">
          ERG
          <br />
          Hub
        </span>
      </button>
      <main className="relative mx-auto my-8 w-[min(1350px,calc(100vw-120px))] overflow-hidden rounded-xl bg-white shadow-md">
        <header className={`relative min-h-[200px] overflow-hidden bg-gradient-to-r ${theme.panel} px-7 py-7 text-white`}>
          <div className="absolute right-10 top-5 hidden h-36 w-48 rounded-lg border-4 border-white/70 bg-white/25 rotate-3 lg:block" />
          <div className="absolute right-6 top-9 hidden rounded-2xl bg-white px-4 py-2 text-2xl font-black text-orange-500 shadow-xl lg:block">
            Global
            <br />
            Success
          </div>
          <button
            type="button"
            className="absolute bottom-6 right-6 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--erg-blue)] shadow-sm"
            aria-label="Tải bài giảng"
          >
            <Download className="h-5 w-5" />
          </button>
          <div className="relative max-w-3xl">
            <p className="text-5xl font-black uppercase leading-none text-white drop-shadow-sm sm:text-6xl">{deckLabel}</p>
            <h1 className="mt-8 text-3xl font-black uppercase leading-tight text-white sm:text-4xl">{title}</h1>
          </div>
        </header>

        <section className="grid gap-8 p-8 lg:grid-cols-2">
          {units.length > 0 ? (
            units.map((unit, index) => (
              <LectureUnitCard key={unit.id} unit={unit} index={index} theme={theme} onOpenLesson={onOpenLesson} />
            ))
          ) : (
            <button
              type="button"
              onClick={() => onOpenLesson(displayText(resource.viewer.presentationTitle ?? resource.viewer.title))}
              className={`flex min-h-16 w-full items-center rounded-lg px-8 text-left text-2xl font-black text-white ${theme.active}`}
            >
              {displayText(resource.viewer.presentationTitle ?? resource.viewer.title)}
            </button>
          )}
        </section>
      </main>
    </div>
  );
}

function SlideDeckPreview({ resource, onClose }: { resource: LearningResourceResource; onClose: () => void }) {
  const [activeLessonTitle, setActiveLessonTitle] = useState<string | null>(null);
  const canEmbed = Boolean(resource.viewer.embedUrl && resource.viewer.embedUrl !== "about:blank");
  const presentationTitle = activeLessonTitle ?? displayText(resource.viewer.presentationTitle ?? resource.viewer.title);

  if (!activeLessonTitle) {
    return <LectureBankView resource={resource} onClose={onClose} onOpenLesson={setActiveLessonTitle} />;
  }

  if (canEmbed) {
    return (
      <div className="fixed inset-0 z-[240] bg-white">
        <div className="flex h-12 items-center gap-3 bg-[#3b3b3b] px-5 text-white shadow-sm">
          <button
            type="button"
            onClick={() => setActiveLessonTitle(null)}
            className="-ml-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-white/90 transition hover:bg-white/10 hover:text-white"
            aria-label="Quay lại danh sách bài giảng"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="truncate text-sm font-black tracking-tight">{presentationTitle}</h1>
        </div>
        <div className="h-[calc(100vh-48px)] bg-white px-3 py-5">
          <iframe
            title={presentationTitle}
            src={resource.viewer.embedUrl ?? ""}
            className="h-full w-full border-0 bg-black"
            loading="lazy"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[240] bg-white">
      <div className="flex h-12 items-center gap-3 bg-[#3b3b3b] px-5 text-white shadow-sm">
        <button
          type="button"
          onClick={() => setActiveLessonTitle(null)}
          className="-ml-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-white/90 transition hover:bg-white/10 hover:text-white"
          aria-label="Quay lại danh sách bài giảng"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="truncate text-sm font-black tracking-tight">{presentationTitle}</h1>
      </div>
      <div className="flex h-[calc(100vh-48px)] items-center justify-center bg-slate-50 p-8">
        <div className="max-w-xl rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-xl">
          <Presentation className="mx-auto h-12 w-12 text-[var(--erg-blue)]" />
          <h4 className="mt-5 text-2xl font-black text-slate-950">{displayText(resource.viewer.title)}</h4>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Chưa có `embedUrl` cho bài giảng này. BE cần trả viewer URL hoặc token URL để FE mở trình chiếu.
          </p>
        </div>
      </div>
    </div>
  );
}

const thumbnailThemes = {
  blue: "from-sky-100 via-blue-200 to-blue-500 text-blue-950",
  green: "from-emerald-100 via-emerald-200 to-emerald-500 text-emerald-950",
  orange: "from-orange-100 via-amber-200 to-orange-500 text-orange-950",
  purple: "from-violet-100 via-purple-200 to-indigo-500 text-violet-950",
  teal: "from-cyan-100 via-teal-200 to-teal-500 text-teal-950",
  rose: "from-rose-100 via-orange-200 to-rose-500 text-rose-950",
  yellow: "from-yellow-100 via-amber-100 to-yellow-500 text-yellow-950",
  slate: "from-slate-100 via-slate-200 to-slate-500 text-slate-950",
} satisfies Record<LearningResourceResource["thumbnailTheme"], string>;

function MediaPreview({ resource }: { resource: LearningResourceResource }) {
  const isAudio = resource.launchMode === "audio_player";

  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-6">
      <div className={`flex min-h-[360px] items-center justify-center rounded-[20px] bg-gradient-to-br ${thumbnailThemes[resource.thumbnailTheme]}`}>
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-xl">
          {isAudio ? <FileAudio className="h-8 w-8" /> : <Play className="h-9 w-9 translate-x-0.5 fill-current" />}
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between gap-4">
        <div>
          <h4 className="text-lg font-black text-slate-950">{displayText(resource.viewer.title)}</h4>
          <p className="mt-1 text-sm text-slate-500">{displayText(resource.viewer.description)}</p>
        </div>
        {resource.viewer.duration ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">{displayText(resource.viewer.duration)}</span>
        ) : null}
      </div>
    </div>
  );
}

function FallbackPreview({ resource }: { resource: LearningResourceResource }) {
  const Icon =
    resource.launchMode === "quiz_runtime"
      ? FileQuestion
      : resource.launchMode === "download_only"
        ? FileArchive
        : Lock;

  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <Icon className="h-7 w-7" />
      </div>
      <h4 className="mt-5 text-2xl font-black text-slate-950">{displayText(resource.viewer.title)}</h4>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">{displayText(resource.viewer.description)}</p>
      <button
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--erg-blue)] px-4 py-2 text-sm font-bold text-white"
        type="button"
      >
        {resource.launchMode === "download_only" ? "Tải gói tài liệu" : "Mở khi tích hợp BE"}
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function ResourceViewerModal({ resource, onClose }: { resource: LearningResourceResource; onClose: () => void }) {
  if (resource.launchMode === "pdf_reader" || resource.launchMode === "ebook_reader") {
    return (
      <Suspense fallback={null}>
        <PdfFullScreenPreview resource={resource} onClose={onClose} />
      </Suspense>
    );
  }

  if (resource.launchMode === "google_slide_embed" || resource.launchMode === "slide_image_proxy") {
    return <SlideDeckPreview resource={resource} onClose={onClose} />;
  }

  return (
    <div className="fixed inset-0 z-[220] overflow-y-auto bg-slate-950/55 p-4">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[24px] bg-slate-50 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại kho học liệu
          </button>
          <div className="flex items-center gap-2">
            <FormatBadge resource={resource} />
            {resource.isDownloadable ? (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 hover:border-[var(--erg-blue)] hover:text-[var(--erg-blue)]"
              >
                <Download className="h-4 w-4" />
                Tải xuống
              </button>
            ) : null}
            <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="p-5">
          {resource.launchMode === "video_player" || resource.launchMode === "audio_player" ? <MediaPreview resource={resource} /> : null}
          {["quiz_runtime", "download_only", "external", "html5_embed"].includes(resource.launchMode) ? (
            <FallbackPreview resource={resource} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function LibraryAccessGate({ onAuthenticated }: { onAuthenticated: () => void }) {
  const auth = useAuthSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await auth.actions.login();
      onAuthenticated();
    } catch (error) {
      auth.setNotice({
        tone: "error",
        message: error instanceof Error ? displayText(error.message) : "Không thể đăng nhập tài khoản giáo viên.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleProviderLogin(provider: "google") {
    setIsSubmitting(true);

    try {
      await auth.actions.loginByProvider(provider);
      onAuthenticated();
    } catch (error) {
      auth.setNotice({
        tone: "error",
        message: error instanceof Error ? displayText(error.message) : "Không thể đăng nhập tài khoản giáo viên.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-96px)] bg-[#f4f7fb]">
      <div className="border-b border-[#cdeefa] bg-[#eaf8ff]">
        <div className="mx-auto flex max-w-[92rem] flex-wrap items-center justify-center gap-2 px-4 py-5 sm:px-6 lg:px-8">
          {["Mầm non", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].map((grade) => (
            <span
              key={grade}
              className={`rounded-lg px-3 py-2 text-sm font-black ${
                grade === "7" ? "bg-white text-[#5d79ff] shadow-sm" : "text-slate-500"
              }`}
            >
              {grade}
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-[92rem] gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-[#70c9e5] to-[#3d96ad] px-6 py-8 text-white">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-white/75">Kho học liệu ERG</p>
                <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight tracking-tight md:text-5xl">
                  Đăng nhập để mở kho học liệu.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-white/88">
                  Trang chủ có thể xem công khai. Các tài liệu, bài giảng điện tử, file PDF, video, IC3, MOS và Tin học chỉ mở sau khi xác thực tài khoản giáo viên.
                </p>
              </div>
              <div className="hidden h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-white/20 md:flex">
                <Lock className="h-9 w-9" />
              </div>
            </div>
          </div>

          <div className="grid gap-0 md:grid-cols-3">
            {[
              { label: "Sách và PDF", value: "PDF" },
              { label: "Bài giảng điện tử", value: "PPTX" },
              { label: "IC3 / MOS / Tin học", value: "API thật" },
            ].map((item) => (
              <div key={item.label} className="border-t border-slate-100 p-6 md:border-r md:last:border-r-0">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                <p className="mt-3 text-2xl font-black text-slate-950">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#5d79ff]/10 text-[#5d79ff]">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-950">Đăng nhập giáo viên</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">Sử dụng tài khoản được cấp quyền Học liệu hoặc LMS để tiếp tục.</p>
            </div>
          </div>

          {auth.notice ? (
            <div className="mt-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
              {displayText(auth.notice.message)}
            </div>
          ) : null}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Email</span>
              <input
                className="mt-2 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#5d79ff] focus:ring-4 focus:ring-[#5d79ff]/10"
                type="email"
                value={auth.loginForm.email}
                onChange={(event) => auth.setLoginForm({ ...auth.loginForm, email: event.target.value })}
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Mật khẩu</span>
              <input
                className="mt-2 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#5d79ff] focus:ring-4 focus:ring-[#5d79ff]/10"
                type="password"
                value={auth.loginForm.password}
                onChange={(event) => auth.setLoginForm({ ...auth.loginForm, password: event.target.value })}
              />
            </label>

            <button
              className="inline-flex h-11 w-full items-center justify-center rounded-md bg-[#00008b] px-4 text-sm font-black text-white transition hover:bg-[#cc0022] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              Đăng nhập và mở kho học liệu
            </button>
          </form>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              className="h-10 rounded-md border border-slate-200 bg-white text-sm font-bold text-slate-700 transition hover:border-[#5d79ff] hover:text-[#5d79ff]"
              disabled={isSubmitting}
              type="button"
              onClick={() => void handleProviderLogin("google")}
            >
              Google
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export function LearningResourceLoginPage() {
  const location = useLocation();
  const [account, setAccount] = useState(() => getCurrentAccount());
  const redirectPath = new URLSearchParams(location.search).get("redirect") || "/kho-hoc-lieu/1";
  const safeRedirectPath = redirectPath.startsWith("/") && !redirectPath.startsWith("//") ? redirectPath : "/kho-hoc-lieu/1";

  useEffect(() => {
    function handleAuthChanged() {
      setAccount(getCurrentAccount());
    }

    window.addEventListener(AUTH_ACCOUNT_CHANGED_EVENT, handleAuthChanged);
    return () => window.removeEventListener(AUTH_ACCOUNT_CHANGED_EVENT, handleAuthChanged);
  }, []);

  if (account) {
    return <Navigate to={safeRedirectPath} replace />;
  }

  return <LibraryAccessGate onAuthenticated={() => setAccount(getCurrentAccount())} />;
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
    const frameId = window.requestAnimationFrame(() => {
      setActiveGradeId(nextSelection.gradeId);
      setActiveSubjectId(nextSelection.subjectId);
      setActiveCategoryId(nextSelection.categoryId);
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [routeGradeId]);

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
    <div className="flex h-[calc(100vh-64px)] min-h-0 flex-col overflow-hidden bg-[#f8fafc]">
      <div className="min-h-0 flex-1 p-3">
        <LearningResourceExplorer
          activeCategoryId={activeCategoryId}
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
