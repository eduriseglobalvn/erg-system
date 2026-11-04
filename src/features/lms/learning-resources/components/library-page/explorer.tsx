import { useMemo, useState } from "react";
import CommandCopy from "@mui/icons-material/ContentCopy";
import CommandFileQuestion from "@mui/icons-material/HelpOutlineOutlined";
import CommandAssign from "@mui/icons-material/AssignmentTurnedInOutlined";
import CommandDownload from "@mui/icons-material/FileDownloadOutlined";
import CommandPresentation from "@mui/icons-material/Slideshow";

import {
  LearningResourceExplorerCardGrid,
  LearningResourceExplorerCommandBar,
  LearningResourceExplorerShell,
  LearningResourceExplorerTopBar,
  LearningResourceFolderTile,
  WindowsFolderIcon,
  type LearningResourceExplorerCommand,
  type ExplorerViewMode,
} from "@/components/learning-resources/explorer-ui";
import { LEARNING_RESOURCE_WORKSPACE_LABEL } from "@/components/learning-resources/learning-resource-workspace-labels";
import {
  LEARNING_RESOURCE_GRADES,
  type LearningResourceCategory,
  type LearningResourceResource,
  type LearningResourceResourceSection,
  type LearningResourceSubject,
} from "@/features/lms/learning-resources/api/learning-resource-data";
import { displayText } from "@/features/lms/learning-resources/components/learning-resource-library-utils";
import { useLmsMobileBreakpoint } from "@/features/lms/mobile/hooks/use-lms-mobile-breakpoint";
import { CategoryTree } from "@/features/lms/learning-resources/components/library-page/category-tree";
import { EmptyState } from "@/features/lms/learning-resources/components/library-page/empty-state";
import { LearningActivityCard } from "@/features/lms/learning-resources/components/library-page/learning-activity-card";
import {
  getCategoryChildrenFrom,
  getCategoryPathFrom,
  getExplorerSize,
  getExplorerType,
  getStableDate,
} from "@/features/lms/learning-resources/components/library-page/library-model";
import { MobileLearningResourceExplorer } from "@/features/lms/learning-resources/components/library-page/mobile-explorer";
import { ResourceExplorerIcon } from "@/features/lms/learning-resources/components/library-page/resource-explorer-icon";

export function LearningResourceExplorer({
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
  treeResources,
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
  treeResources: LearningResourceResource[];
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
  const explorerBreadcrumbItems = useMemo(() => (
    breadcrumbItems.map((item) => ({
      label: displayText(item.label),
      onClick: () => onSelectCategory(item.categoryId),
    }))
  ), [breadcrumbItems, onSelectCategory]);
  const selectedExplorerUrl = explorerBreadcrumbItems.map((item) => item.label).join(" / ");
  const parentCategoryId = categoryPath.length > 1 ? categoryPath[categoryPath.length - 2]?.id : undefined;

  const paneResources = childCategories.length ? [] : resources;
  const itemCount = childCategories.length + paneResources.length;
  const [viewMode, setViewMode] = useState<ExplorerViewMode>("grid");
  const isMobile = useLmsMobileBreakpoint("(max-width: 767px)");
  const commandActions = useMemo<LearningResourceExplorerCommand[]>(() => [
    { disabled: true, icon: <CommandPresentation className="h-4 w-4" />, label: "Thêm bài giảng" },
    { disabled: true, icon: <CommandFileQuestion className="h-4 w-4" />, label: "Thêm bài tập" },
    { icon: null, label: "separator-primary", variant: "separator" },
    { disabled: true, icon: <CommandAssign className="h-4 w-4" />, label: "Giao cho lớp", title: "Mở một học liệu để giao cho lớp" },
    { disabled: true, icon: <CommandDownload className="h-4 w-4" />, label: "Tải xuống", title: "Mở một học liệu để tải xuống" },
    {
      icon: <CommandCopy className="h-4 w-4" />,
      label: "Sao chép liên kết",
      onClick: () => {
        if (typeof window !== "undefined" && navigator.clipboard) {
          void navigator.clipboard.writeText(window.location.href);
        }
      },
      title: "Sao chép liên kết",
    },
  ], []);

  function openContextMenu(event: { preventDefault: () => void; stopPropagation: () => void }) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (isMobile) {
    return (
      <MobileLearningResourceExplorer
        activeCategory={activeCategory}
        activeGrade={activeGrade}
        activeSubject={activeSubject}
        breadcrumbItems={breadcrumbItems}
        childCategories={childCategories}
        keyword={keyword}
        libraryError={libraryError}
        onKeywordChange={onKeywordChange}
        onOpenResource={onOpenResource}
        onRefresh={onRefresh}
        onSelectCategory={onSelectCategory}
        resources={paneResources}
        totalVisibleResources={totalVisibleResources}
        viewerLoadingResourceId={viewerLoadingResourceId}
      />
    );
  }

  return (
    <LearningResourceExplorerShell className="flex h-full flex-col">
      <LearningResourceExplorerTopBar
        breadcrumbItems={explorerBreadcrumbItems}
        canGoBack={Boolean(parentCategoryId)}
        onBack={() => {
          if (parentCategoryId) onSelectCategory(parentCategoryId);
        }}
        onRefresh={onRefresh}
        searchLabel={`Tìm trong ${LEARNING_RESOURCE_WORKSPACE_LABEL.toLocaleLowerCase("vi-VN")}`}
        searchPlaceholder={`Tìm trong ${displayText(activeSubject?.label) || "học liệu"}`}
        searchValue={keyword}
        title={selectedExplorerUrl}
        onSearchChange={onKeywordChange}
      />
      <LearningResourceExplorerCommandBar actions={commandActions} viewMode={viewMode} onViewModeChange={setViewMode} />

      <div className="grid min-h-0 flex-1 grid-cols-[250px_minmax(0,1fr)] overflow-hidden">
        <CategoryTree
          activeCategoryId={activeCategoryId}
          categories={categories}
          onOpenResource={onOpenResource}
          onSelectCategory={onSelectCategory}
          resources={treeResources}
        />

        <section className="min-h-0 min-w-0 overflow-hidden bg-white" onContextMenu={(event) => openContextMenu(event)}>
          {viewMode === "list" ? (
            <>
              <div className="grid grid-cols-[minmax(260px,1fr)_145px_120px_90px] border-b border-[#d1d5db] bg-white text-[13px] text-[#27364a]">
                <span className="border-r border-[#e5e7eb] px-4 py-1.5">Tên</span>
                <span className="border-r border-[#e5e7eb] px-3 py-1.5">Cập nhật</span>
                <span className="border-r border-[#e5e7eb] px-3 py-1.5">Loại</span>
                <span className="px-3 py-1.5">Dung lượng</span>
              </div>
              <div className="h-[calc(100%-31px)] overflow-y-auto [scrollbar-gutter:stable]">
                {childCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => onSelectCategory(category.id)}
                    onContextMenu={openContextMenu}
                    className="grid w-full grid-cols-[minmax(260px,1fr)_145px_120px_90px] items-center border-b border-transparent text-left text-[13px] hover:bg-[#eef6ff]"
                  >
                    <span className="flex min-w-0 items-center gap-2 px-4 py-1.5">
                      <WindowsFolderIcon />
                      <span className="truncate font-medium text-[#111827]">{displayText(category.label)}</span>
                    </span>
                    <span className="truncate px-3 text-[#4b5563]">{getStableDate(category.id)}</span>
                    <span className="truncate px-3 text-[#4b5563]">Thư mục</span>
                    <span className="truncate px-3 text-[#4b5563]" />
                  </button>
                ))}

                {paneResources.map((resource) => (
                  <button
                    key={resource.id}
                    type="button"
                    onClick={() => onOpenResource(resource)}
                    onContextMenu={openContextMenu}
                    className="grid w-full grid-cols-[minmax(260px,1fr)_145px_120px_90px] items-center border-b border-transparent text-left text-[13px] hover:bg-[#eef6ff]"
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
            <LearningResourceExplorerCardGrid className="p-5" contentClassName="lms-resource-card-grid">
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

              {paneResources.map((resource) => (
                <div
                  key={resource.id}
                  className="lms-resource-activity-card"
                  onContextMenu={openContextMenu}
                >
                  <LearningActivityCard resource={resource} onOpen={onOpenResource} />
                </div>
              ))}
            </LearningResourceExplorerCardGrid>
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

    </LearningResourceExplorerShell>
  );
}
