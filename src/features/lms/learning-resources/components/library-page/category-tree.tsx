import { useEffect, useMemo, useState } from "react";
import Stack from "@mui/material/Stack";

import {
  LearningResourceExplorerTreePane,
  LearningResourceExplorerTreeRow,
  WindowsFolderIcon,
} from "@/components/learning-resources/explorer-ui";
import type { LearningResourceCategory, LearningResourceResource } from "@/features/lms/learning-resources/api/learning-resource-data";
import { displayText } from "@/features/lms/learning-resources/components/learning-resource-library-utils";
import { getCategoryChildrenFrom, getTopLevelCategoriesFrom } from "@/features/lms/learning-resources/components/library-page/library-model";
import { ResourceExplorerIcon } from "@/features/lms/learning-resources/components/library-page/resource-explorer-icon";

export function CategoryTree({
  activeCategoryId,
  categories,
  onOpenResource,
  onSelectCategory,
  resources,
}: {
  activeCategoryId: string;
  categories: LearningResourceCategory[];
  onOpenResource: (resource: LearningResourceResource) => void;
  onSelectCategory: (categoryId: string) => void;
  resources: LearningResourceResource[];
}) {
  const topLevelCategories = useMemo(() => getTopLevelCategoriesFrom(categories), [categories]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(topLevelCategories.map((category) => category.id)));
  const resourcesByCategory = useMemo(() => {
    const grouped = new Map<string, LearningResourceResource[]>();
    resources.forEach((resource) => {
      const bucket = grouped.get(resource.categoryId) ?? [];
      bucket.push(resource);
      grouped.set(resource.categoryId, bucket);
    });
    return grouped;
  }, [resources]);
  const resourcesBySection = useMemo(() => {
    const grouped = new Map<string, LearningResourceResource[]>();
    resources.forEach((resource) => {
      const bucket = grouped.get(resource.sectionId) ?? [];
      bucket.push(resource);
      grouped.set(resource.sectionId, bucket);
    });
    return grouped;
  }, [resources]);

  useEffect(() => {
    if (!activeCategoryId) return;
    const nextParents = new Set<string>();
    let parent = categories.find((cat) => cat.id === activeCategoryId)?.parentId;
    while (parent) {
      nextParents.add(parent);
      parent = categories.find((cat) => cat.id === parent)?.parentId;
    }
    if (!nextParents.size) return;
    setExpandedIds((prev) => {
      const next = new Set(prev);
      nextParents.forEach((id) => next.add(id));
      return next;
    });
  }, [activeCategoryId, categories]);

  useEffect(() => {
    if (!topLevelCategories.length) return;
    setExpandedIds((prev) => {
      if (prev.size) return prev;
      return new Set(topLevelCategories.map((category) => category.id));
    });
  }, [topLevelCategories]);

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

  function renderCategory(category: LearningResourceCategory, depth = 0) {
    const children = getCategoryChildrenFrom(categories, category.id);
    const categoryResources = children.length > 0 ? [] : [...(resourcesBySection.get(category.id) ?? []), ...(resourcesByCategory.get(category.id) ?? [])];
    const hasChildren = children.length > 0 || categoryResources.length > 0;
    const isSelected = category.id === activeCategoryId;
    const isExpanded = expandedIds.has(category.id);

    return (
      <div key={category.id}>
        <LearningResourceExplorerTreeRow
          label={displayText(category.label)}
          title={displayText(category.label)}
          depth={depth}
          selected={isSelected}
          expanded={isExpanded}
          hasChildren={hasChildren}
          icon={<WindowsFolderIcon open={isExpanded} />}
          onSelect={() => {
            onSelectCategory(category.id);
            if (hasChildren) {
              setExpandedIds((prev) => {
                if (prev.has(category.id)) return prev;
                const next = new Set(prev);
                next.add(category.id);
                return next;
              });
            }
          }}
          onToggle={() => toggleExpand(category.id)}
        />

        {hasChildren && isExpanded ? (
          <Stack spacing={0.25} sx={{ mt: 0.25 }}>
            {children.map((child) => renderCategory(child, depth + 1))}
            {categoryResources.map((resource) => (
              <LearningResourceExplorerTreeRow
                key={resource.id}
                label={displayText(resource.title)}
                title={displayText(resource.title)}
                depth={depth + 1}
                icon={<ResourceExplorerIcon resource={resource} />}
                onSelect={() => onOpenResource(resource)}
              />
            ))}
          </Stack>
        ) : null}
      </div>
    );
  }

  return (
    <LearningResourceExplorerTreePane>
      {topLevelCategories.map((category) => renderCategory(category))}
    </LearningResourceExplorerTreePane>
  );
}
