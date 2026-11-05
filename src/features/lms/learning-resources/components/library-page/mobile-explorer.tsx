import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import RefreshIcon from "@mui/icons-material/Refresh";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";

import { ErgButton, ErgIconButton, ErgSearchField } from "@/components/erg-mui";
import { WindowsFolderIcon } from "@/components/learning-resources/explorer-ui";
import { LEARNING_RESOURCE_WORKSPACE_LABEL } from "@/components/learning-resources/learning-resource-workspace-labels";
import type {
  LearningResourceCategory,
  LearningResourceResource,
  LearningResourceSubject,
} from "@/features/lms/learning-resources/api/learning-resource-data";
import { displayText } from "@/features/lms/learning-resources/components/learning-resource-library-utils";
import { EmptyState } from "@/features/lms/learning-resources/components/library-page/empty-state";
import { getExplorerSize, getExplorerType } from "@/features/lms/learning-resources/components/library-page/library-model";
import { ResourceExplorerIcon } from "@/features/lms/learning-resources/components/library-page/resource-explorer-icon";

export function MobileLearningResourceExplorer({
  activeCategory,
  activeGrade,
  activeSubject,
  breadcrumbItems,
  childCategories,
  keyword,
  libraryError,
  onKeywordChange,
  onOpenResource,
  onRefresh,
  onSelectCategory,
  resources,
  totalVisibleResources,
  viewerLoadingResourceId,
}: {
  activeCategory?: LearningResourceCategory;
  activeGrade?: { label: string };
  activeSubject?: LearningResourceSubject;
  breadcrumbItems: { label: string; categoryId: string }[];
  childCategories: LearningResourceCategory[];
  keyword: string;
  libraryError: string | null;
  onKeywordChange: (value: string) => void;
  onOpenResource: (resource: LearningResourceResource) => void;
  onRefresh: () => void;
  onSelectCategory: (categoryId: string) => void;
  resources: LearningResourceResource[];
  totalVisibleResources: number;
  viewerLoadingResourceId: string | null;
}) {
  const itemCount = childCategories.length + resources.length;

  return (
    <Box
      sx={{
        bgcolor: "background.default",
        border: 1,
        borderColor: "divider",
        borderRadius: 2.5,
        boxShadow: 1,
        color: "text.primary",
        display: { xs: "flex", md: "none" },
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <Box component="header" sx={{ bgcolor: "background.paper", borderBottom: 1, borderColor: "divider", flexShrink: 0, px: 1.5, py: 1.5 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" sx={{ color: "primary.main", display: "block", fontWeight: "fontWeightBold", textTransform: "uppercase" }}>
              {displayText(activeSubject?.label) || LEARNING_RESOURCE_WORKSPACE_LABEL}
            </Typography>
            <Typography component="h1" variant="h5" noWrap>
              {displayText(activeCategory?.label) || LEARNING_RESOURCE_WORKSPACE_LABEL}
            </Typography>
          </Box>
          <ErgIconButton
            label="Làm mới học liệu"
            onClick={onRefresh}
            sx={{ bgcolor: "background.default", border: 1, borderColor: "divider", borderRadius: 1.5, flexShrink: 0, height: 44, width: 44 }}
          >
            <RefreshIcon fontSize="small" />
          </ErgIconButton>
        </Stack>
        <ErgSearchField
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder="Tìm học liệu"
          type="search"
          sx={{ mt: 1.5, "& .MuiOutlinedInput-root": { minHeight: 44 } }}
        />
        <Stack direction="row" spacing={1} sx={{ mt: 1.5, overflowX: "auto", pb: 0.5, scrollbarWidth: "none" }}>
          {breadcrumbItems.map((item, index) => (
            <ErgButton
              key={`${item.label}-${index}`}
              variant="outlined"
              color="inherit"
              onClick={() => onSelectCategory(item.categoryId)}
              sx={{
                borderColor: "divider",
                borderRadius: 999,
                display: "block",
                flexShrink: 0,
                maxWidth: 220,
                minHeight: 44,
                overflow: "hidden",
                px: 1.5,
                textOverflow: "ellipsis",
                typography: "subtitle2",
                whiteSpace: "nowrap",
              }}
            >
              {displayText(item.label)}
            </ErgButton>
          ))}
        </Stack>
      </Box>

      <Box component="main" sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: 1.5, pb: "calc(1rem + env(safe-area-inset-bottom))" }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", color: "text.secondary", justifyContent: "space-between", mb: 1.5 }}>
          <Typography component="span" variant="subtitle2">{itemCount} mục</Typography>
          <Typography component="span" variant="subtitle2" noWrap>
            {displayText(activeGrade?.label) || "-"} · {totalVisibleResources} học liệu
          </Typography>
        </Stack>

        {childCategories.length ? (
          <Stack component="section" spacing={1.5} sx={{ mb: 2 }}>
            {childCategories.map((category) => (
              <ButtonBase
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                sx={{ ...cardSx, gap: 1.5, justifyContent: "flex-start", minHeight: 56, px: 1.5 }}
              >
                <WindowsFolderIcon />
                <Typography component="span" variant="subtitle2" noWrap sx={{ flex: 1, fontWeight: "fontWeightBold", minWidth: 0 }}>
                  {displayText(category.label)}
                </Typography>
                <ChevronRightIcon fontSize="small" sx={{ color: "text.disabled" }} />
              </ButtonBase>
            ))}
          </Stack>
        ) : null}

        <Stack component="section" spacing={1.5}>
          {resources.map((resource) => (
            <ButtonBase
              key={resource.id}
              onClick={() => onOpenResource(resource)}
              sx={{ ...cardSx, alignItems: "flex-start", gap: 1.5, p: 1.5, "&:active": { transform: "scale(0.99)" } }}
            >
              <ResourceExplorerIcon resource={resource} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ WebkitBoxOrient: "vertical", WebkitLineClamp: 2, display: "-webkit-box", fontWeight: "fontWeightBold", overflow: "hidden" }}
                >
                  {displayText(resource.title)}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                  {getExplorerType(resource)} · {getExplorerSize(resource)}
                </Typography>
              </Box>
              <Typography
                component="span"
                variant="caption"
                sx={{
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                  border: 1,
                  borderColor: (theme) => alpha(theme.palette.primary.main, 0.3),
                  borderRadius: 999,
                  color: "primary.main",
                  fontWeight: "fontWeightBold",
                  px: 1.25,
                  py: 0.5,
                }}
              >
                {displayText(resource.formatBadge)}
              </Typography>
            </ButtonBase>
          ))}
        </Stack>

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
  );
}

const cardSx = {
  bgcolor: "background.paper",
  border: 1,
  borderColor: "divider",
  borderRadius: 2,
  boxShadow: 1,
  display: "flex",
  textAlign: "left",
  transition: "transform 0.15s ease",
  width: "100%",
} as const;

const noticeSx = {
  border: 1,
  borderRadius: 0.75,
  fontWeight: "fontWeightMedium",
  mt: 1.5,
  px: 1.5,
  py: 1,
} as const;
