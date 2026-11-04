import { ChevronRight, RefreshCw, Search } from "lucide-react";

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
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[20px] border border-white bg-[#f3f6fb] text-slate-900 shadow-[0_12px_34px_rgba(96,165,250,0.10)] md:hidden">
      <header className="shrink-0 border-b border-[#dbe4f0] bg-white/95 px-3 py-3 shadow-[0_10px_28px_rgba(96,165,250,0.06)] backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[12px] font-bold uppercase text-[var(--erg-blue)]">{displayText(activeSubject?.label) || LEARNING_RESOURCE_WORKSPACE_LABEL}</p>
            <h2 className="truncate text-base font-extrabold text-slate-950">{displayText(activeCategory?.label) || LEARNING_RESOURCE_WORKSPACE_LABEL}</h2>
          </div>
          <button type="button" onClick={onRefresh} className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] border border-[#dce6f1] bg-[#f8fbff] text-slate-700 shadow-[var(--shadow-xs)]" aria-label="Làm mới học liệu">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex h-11 items-center rounded-[14px] border border-[#d7e0ec] bg-[#f8fbff] px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] focus-within:border-[var(--erg-blue)] focus-within:ring-2 focus-within:ring-[var(--erg-blue-ring)]">
          <Search className="mr-2 h-4 w-4 text-[var(--erg-blue)]" />
          <input
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
            placeholder="Tìm học liệu"
            className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold outline-none placeholder:text-[#64748b]"
            type="search"
          />
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {breadcrumbItems.map((item, index) => (
            <button
              key={`${item.label}-${index}`}
              type="button"
              onClick={() => onSelectCategory(item.categoryId)}
              className="min-h-9 max-w-[220px] shrink-0 truncate rounded-full border border-[#dce6f1] bg-[#f8fbff] px-3 text-[13px] font-bold text-slate-700 shadow-[var(--shadow-xs)]"
            >
              {displayText(item.label)}
            </button>
          ))}
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto p-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="mb-3 flex items-center justify-between gap-2 text-[13px] font-bold text-slate-600">
          <span>{itemCount} mục</span>
          <span className="truncate">{displayText(activeGrade?.label) || "-"} · {totalVisibleResources} học liệu</span>
        </div>

        {childCategories.length ? (
          <section className="mb-4 space-y-3">
            {childCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => onSelectCategory(category.id)}
                className="flex min-h-14 w-full items-center gap-3 rounded-[16px] border border-white bg-white px-3 text-left shadow-[0_10px_26px_rgba(96,165,250,0.08)]"
              >
                <WindowsFolderIcon />
                <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-slate-950">{displayText(category.label)}</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
            ))}
          </section>
        ) : null}

        <section className="space-y-3">
          {resources.map((resource) => (
            <button
              key={resource.id}
              type="button"
              onClick={() => onOpenResource(resource)}
              className="w-full rounded-[16px] border border-white bg-white p-3 text-left shadow-[0_10px_26px_rgba(96,165,250,0.08)] transition active:scale-[0.99]"
            >
              <div className="flex items-start gap-3">
                <ResourceExplorerIcon resource={resource} />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[14px] font-bold text-slate-950">{displayText(resource.title)}</p>
                  <p className="mt-1 text-[13px] font-semibold text-slate-600">{getExplorerType(resource)} · {getExplorerSize(resource)}</p>
                </div>
                <span className="rounded-full border border-[#b8d6fa] bg-[var(--erg-blue-light)] px-2.5 py-1 text-[12px] font-bold text-[var(--erg-blue)]">{displayText(resource.formatBadge)}</span>
              </div>
            </button>
          ))}
        </section>

        {libraryError ? (
          <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
            {displayText(libraryError)}
          </p>
        ) : null}
        {viewerLoadingResourceId ? (
          <p className="mt-3 rounded-md border border-[#b8d6fa] bg-[var(--erg-blue-light)] px-3 py-2 text-sm font-medium text-[var(--erg-blue)]">
            Đang mở học liệu...
          </p>
        ) : null}
        {!itemCount ? <EmptyState /> : null}
      </main>
    </div>
  );
}
