import { useMemo, useState } from "react";
import CommandCopy from "@mui/icons-material/ContentCopy";
import CommandFileQuestion from "@mui/icons-material/HelpOutlineOutlined";
import CommandAssign from "@mui/icons-material/AssignmentTurnedInOutlined";
import CommandDownload from "@mui/icons-material/FileDownloadOutlined";
import CommandPresentation from "@mui/icons-material/Slideshow";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import { alpha, type SxProps, type Theme } from "@mui/material/styles";

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
    { disabled: true, icon: <CommandPresentation fontSize="small" />, label: "Thêm bài giảng" },
    { disabled: true, icon: <CommandFileQuestion fontSize="small" />, label: "Thêm bài tập" },
    { icon: null, label: "separator-primary", variant: "separator" },
    { disabled: true, icon: <CommandAssign fontSize="small" />, label: "Giao cho lớp", title: "Mở một học liệu để giao cho lớp" },
    { disabled: true, icon: <CommandDownload fontSize="small" />, label: "Tải xuống", title: "Mở một học liệu để tải xuống" },
    {
      icon: <CommandCopy fontSize="small" />,
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
    <LearningResourceExplorerShell>
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
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

        <Box sx={{ display: "grid", flex: 1, gridTemplateColumns: "250px minmax(0, 1fr)", minHeight: 0, overflow: "hidden" }}>
          <CategoryTree
            activeCategoryId={activeCategoryId}
            categories={categories}
            onOpenResource={onOpenResource}
            onSelectCategory={onSelectCategory}
            resources={treeResources}
          />

          <Box
            component="section"
            sx={{ bgcolor: "background.paper", minHeight: 0, minWidth: 0, overflow: "hidden" }}
            onContextMenu={(event) => openContextMenu(event)}
          >
            {viewMode === "list" ? (
              <>
                <Box sx={{ ...listGridSx, borderBottom: 1, borderColor: "divider", color: "text.primary" }}>
                  <Box component="span" sx={{ ...headerCellSx, px: 2 }}>Tên</Box>
                  <Box component="span" sx={headerCellSx}>Cập nhật</Box>
                  <Box component="span" sx={headerCellSx}>Loại</Box>
                  <Box component="span" sx={{ px: 1.5, py: 0.75 }}>Dung lượng</Box>
                </Box>
                <Box sx={{ height: "calc(100% - 31px)", overflowY: "auto", scrollbarGutter: "stable" }}>
                  {childCategories.map((category) => (
                    <ButtonBase
                      key={category.id}
                      onClick={() => onSelectCategory(category.id)}
                      onContextMenu={openContextMenu}
                      sx={listRowSx}
                    >
                      <Box component="span" sx={nameCellSx}>
                        <WindowsFolderIcon />
                        <Typography component="span" variant="body2" noWrap sx={{ fontWeight: "fontWeightMedium" }}>
                          {displayText(category.label)}
                        </Typography>
                      </Box>
                      <Box component="span" sx={cellSx}>{getStableDate(category.id)}</Box>
                      <Box component="span" sx={cellSx}>Thư mục</Box>
                      <Box component="span" sx={cellSx} />
                    </ButtonBase>
                  ))}

                  {paneResources.map((resource) => (
                    <ButtonBase
                      key={resource.id}
                      onClick={() => onOpenResource(resource)}
                      onContextMenu={openContextMenu}
                      sx={listRowSx}
                    >
                      <Box component="span" sx={nameCellSx}>
                        <ResourceExplorerIcon resource={resource} />
                        <Typography component="span" variant="body2" noWrap>
                          {displayText(resource.title)}
                        </Typography>
                      </Box>
                      <Box component="span" sx={cellSx}>{getStableDate(resource.id)}</Box>
                      <Box component="span" sx={cellSx}>{getExplorerType(resource)}</Box>
                      <Box component="span" sx={cellSx}>{getExplorerSize(resource)}</Box>
                    </ButtonBase>
                  ))}
                </Box>
              </>
            ) : (
              <LearningResourceExplorerCardGrid>
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
                    onContextMenu={openContextMenu}
                  >
                    <LearningActivityCard resource={resource} onOpen={onOpenResource} />
                  </div>
                ))}
              </LearningResourceExplorerCardGrid>
            )}

            {libraryError ? (
              <Typography variant="body2" sx={{ ...noticeSx, bgcolor: "warning.light", borderColor: "warning.main", color: "warning.dark" }}>
                {displayText(libraryError)}
              </Typography>
            ) : null}
            {viewerLoadingResourceId ? (
              <Typography
                variant="body2"
                sx={{ ...noticeSx, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08), borderColor: "primary.main", color: "primary.main" }}
              >
                Đang mở học liệu...
              </Typography>
            ) : null}
            {!itemCount ? <EmptyState /> : null}
          </Box>
        </Box>
      </Box>
    </LearningResourceExplorerShell>
  );
}

const listGridSx = {
  display: "grid",
  gridTemplateColumns: "minmax(260px, 1fr) 145px 120px 90px",
  typography: "body2",
} as const;

const headerCellSx = { borderColor: "divider", borderRight: 1, px: 1.5, py: 0.75 } as const;

const listRowSx: SxProps<Theme> = {
  ...listGridSx,
  alignItems: "center",
  borderBottom: 1,
  borderColor: "transparent",
  justifyContent: "stretch",
  textAlign: "left",
  width: "100%",
  "&:hover": { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06) },
};

const nameCellSx = { alignItems: "center", display: "flex", gap: 1, minWidth: 0, px: 2, py: 0.75 } as const;

const cellSx = { color: "text.secondary", overflow: "hidden", px: 1.5, textOverflow: "ellipsis", whiteSpace: "nowrap" } as const;

const noticeSx = { border: 1, borderRadius: 0.75, fontWeight: "fontWeightMedium", m: 1.5, px: 1.5, py: 1 } as const;
