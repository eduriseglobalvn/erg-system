import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, Search } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import type { HocLieuResource } from "@/features/hoclieu/api/library-data";
import { useHocLieuLibraryCatalog } from "@/features/hoclieu/hooks/use-hoclieu-library-catalog";

const themeStyles: Record<HocLieuResource["thumbnailTheme"], { banner: string; accent: string }> = {
  blue: {
    banner: "bg-[linear-gradient(135deg,#2c6678_0%,#3f879f_55%,#79b8cf_100%)]",
    accent: "text-sky-700",
  },
  green: {
    banner: "bg-[linear-gradient(135deg,#51a37b_0%,#66c196_55%,#9ce1ba_100%)]",
    accent: "text-emerald-700",
  },
  orange: {
    banner: "bg-[linear-gradient(135deg,#d56c46_0%,#e48a52_55%,#f7c47e_100%)]",
    accent: "text-orange-700",
  },
  purple: {
    banner: "bg-[linear-gradient(135deg,#7566d8_0%,#9584f2_55%,#bcb2fa_100%)]",
    accent: "text-violet-700",
  },
  teal: {
    banner: "bg-[linear-gradient(135deg,#29a0ad_0%,#47c7c3_55%,#8be5d8_100%)]",
    accent: "text-teal-700",
  },
  rose: {
    banner: "bg-[linear-gradient(135deg,#d76682_0%,#eb8799_55%,#f7c8d1_100%)]",
    accent: "text-rose-700",
  },
  yellow: {
    banner: "bg-[linear-gradient(135deg,#d89c24_0%,#e8ba3f_55%,#f6dc88_100%)]",
    accent: "text-amber-700",
  },
  slate: {
    banner: "bg-[linear-gradient(135deg,#476177_0%,#658298_55%,#a2b8c8_100%)]",
    accent: "text-slate-700",
  },
};

function formatProgressRate(value?: number) {
  return `${Math.round(Math.max(0, Math.min(100, value ?? 0)))}%`;
}

function SubjectRail({
  subjects,
  selectedSubjectId,
  selectedSectionId,
  expandedSubjectIds,
  onSelectSubject,
  onSelectSection,
  onToggleSubject,
}: {
  subjects: ReturnType<typeof useHocLieuLibraryCatalog>["subjects"];
  selectedSubjectId: string;
  selectedSectionId: string;
  expandedSubjectIds: string[];
  onSelectSubject: (subjectId: string) => void;
  onSelectSection: (sectionId: string) => void;
  onToggleSubject: (subjectId: string) => void;
}) {
  return (
    <aside className="border-r border-slate-200 bg-white">
      <div className="px-5 py-6">
        <div className="border-b border-slate-200 pb-5">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Danh mục</p>
          <h2 className="mt-2 text-[19px] font-black tracking-tight text-slate-950">Kho học liệu</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Chọn môn học và nhóm học liệu để mở nhanh đúng nội dung cần dùng.</p>
        </div>

        <div className="mt-5 space-y-3">
          {subjects.map((subject) => {
            const isActive = subject.id === selectedSubjectId;
            const isExpanded = expandedSubjectIds.includes(subject.id);

            return (
              <div key={subject.id} className="border-b border-slate-100 pb-3 last:border-b-0">
                <div className="flex items-start gap-3">
                  <button type="button" onClick={() => onSelectSubject(subject.id)} className="min-w-0 flex-1 text-left">
                    <p className={`truncate text-[15px] font-black ${isActive ? "text-[#091f80]" : "text-slate-900"}`}>{subject.label}</p>
                    <p className="mt-1 text-xs text-slate-500">{subject.resourceCount} học liệu</p>
                  </button>

                  <div className="flex items-center gap-1">
                    <span className="px-1 text-[11px] font-black text-slate-400">{subject.groupCount}</span>
                    <button
                      type="button"
                      aria-label={isExpanded ? "Thu gọn nhóm học liệu" : "Mở nhóm học liệu"}
                      onClick={() => onToggleSubject(subject.id)}
                      className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                        isExpanded ? "bg-slate-100 text-[#091f80]" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      }`}
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                </div>

                {isExpanded ? (
                  <div className="mt-3 pl-2">
                    <div className="relative ml-2 pl-4 before:absolute before:bottom-2 before:left-0 before:top-2 before:w-px before:border-l before:border-dashed before:border-slate-300 before:content-['']">
                      <div className="space-y-1">
                        {subject.sections.map((section) => {
                          const isSelected = section.id === selectedSectionId;

                          return (
                            <button
                              key={section.id}
                              type="button"
                              onClick={() => onSelectSection(section.id)}
                              className={`relative flex w-full items-center justify-between gap-3 px-2 py-2 text-left text-sm transition before:absolute before:-left-4 before:top-1/2 before:w-3 before:-translate-y-1/2 before:border-t before:border-dashed before:border-slate-300 before:content-[''] ${
                                isSelected ? "font-bold text-[#091f80]" : "text-slate-600 hover:text-slate-900"
                              }`}
                            >
                              <span className="flex min-w-0 items-center gap-2">
                                <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-[#091f80]" : "bg-slate-300"}`} />
                                <span className="truncate">{section.title}</span>
                              </span>
                              <span className="shrink-0 text-[11px] font-bold text-slate-400">{section.lessonCount}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

function SubjectRailSkeleton() {
  return (
    <aside className="border-r border-slate-200 bg-white">
      <div className="px-5 py-6">
        <div className="border-b border-slate-200 pb-5">
          <Skeleton className="h-3 w-16 rounded-full" />
          <Skeleton className="mt-3 h-8 w-36" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-4/5" />
        </div>

        <div className="mt-5 space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="border-b border-slate-100 pb-3">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="mt-2 h-4 w-16" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function LessonCard({
  lesson,
  onOpen,
}: {
  lesson: NonNullable<ReturnType<typeof useHocLieuLibraryCatalog>["activeSection"]>["lessons"][number];
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-[0_16px_38px_-32px_rgba(15,23,42,0.45)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_26px_54px_-34px_rgba(15,23,42,0.35)]"
    >
      <div className="relative h-36 overflow-hidden bg-[linear-gradient(135deg,#dce8ff_0%,#edf3ff_55%,#ffffff_100%)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(9,31,128,0.08),transparent_36%)]" />
        <div className="absolute left-4 top-4 rounded-full bg-white/85 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#091f80]">Bài học</div>
      </div>

      <div className="min-h-[150px] px-4 py-4">
        <h3 className="line-clamp-2 text-[19px] font-black leading-7 text-slate-950">{lesson.title}</h3>
        <div className="mt-5 flex items-center justify-between text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          <span>Hoàn thành</span>
          <span>{formatProgressRate(lesson.progress.progressRate)}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-[#091f80]" style={{ width: formatProgressRate(lesson.progress.progressRate) }} />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
        <span className="text-sm font-bold text-slate-500">{lesson.resourceCount} học liệu</span>
        <span className="text-xs font-black uppercase tracking-[0.12em] text-[#091f80] transition group-hover:translate-x-0.5">Xem bài</span>
      </div>
    </button>
  );
}

function ResourceCard({
  resource,
  progressRate,
  kindLabel,
  onOpen,
}: {
  resource: HocLieuResource;
  progressRate?: number;
  kindLabel: string;
  onOpen: (resource: HocLieuResource) => void;
}) {
  const theme = themeStyles[resource.thumbnailTheme];

  return (
    <button
      type="button"
      onClick={() => onOpen(resource)}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-[0_16px_38px_-32px_rgba(15,23,42,0.45)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_26px_54px_-34px_rgba(15,23,42,0.35)]"
    >
      <div className={`relative h-36 overflow-hidden ${theme.banner}`}>
        {resource.thumbnailUrl ? <img src={resource.thumbnailUrl} alt={resource.title} className="h-full w-full object-cover" /> : null}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.24),transparent_34%)]" />
        <div className="absolute left-3 top-3 rounded-full bg-white/88 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-slate-900">
          {kindLabel}
        </div>
      </div>

      <div className="min-h-[136px] px-4 py-4">
        <h3 className="line-clamp-3 text-[19px] font-black leading-7 text-slate-950">{resource.title}</h3>
        <div className="mt-5 flex items-center justify-between text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          <span>Hoàn thành</span>
          <span>{formatProgressRate(progressRate)}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-[#091f80]" style={{ width: formatProgressRate(progressRate) }} />
        </div>
      </div>
    </button>
  );
}

function LessonGridSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-10 w-40" />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <Skeleton className="h-36 w-full rounded-none" />
            <div className="space-y-4 px-4 py-4">
              <Skeleton className="h-7 w-4/5" />
              <Skeleton className="h-3 w-full rounded-full" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-14" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResourceGridSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-9 w-72" />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <Skeleton className="h-36 w-full rounded-none" />
            <div className="space-y-4 px-4 py-4">
              <Skeleton className="h-7 w-5/6" />
              <Skeleton className="h-3 w-full rounded-full" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function partitionLessonResources(resources: HocLieuResource[]) {
  const lectureResources = resources.filter((resource) =>
    ["slide", "lecture_bank", "lesson_plan", "external_link"].includes(resource.resourceType) || ["PPTX", "LINK", "PDF", "VIDEO"].includes(resource.fileType),
  );
  const exerciseResources = resources.filter((resource) =>
    ["quiz", "test_bank", "interactive", "download_package"].includes(resource.resourceType) || ["QUIZ", "ZIP", "XLSX", "DOCX"].includes(resource.fileType),
  );

  return { lectureResources, exerciseResources };
}

export function HocLieuTeacherDashboardPage() {
  const {
    activeLesson,
    activeSection,
    error,
    loading,
    loadingSubject,
    onOpenResource,
    onSelectLesson,
    onSelectSection,
    onSelectSubject,
    searchValue,
    sections,
    selectedSectionId,
    selectedSubjectId,
    setSearchValue,
    subjects,
  } = useHocLieuLibraryCatalog();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [expandedSubjectIds, setExpandedSubjectIds] = useState<string[]>([]);
  const [isLessonDetailOpen, setIsLessonDetailOpen] = useState(false);

  useEffect(() => {
    function handleFocusSearch() {
      searchInputRef.current?.focus();
    }

    window.addEventListener("hoclieu-dashboard-focus-search", handleFocusSearch);
    return () => window.removeEventListener("hoclieu-dashboard-focus-search", handleFocusSearch);
  }, []);

  useEffect(() => {
    if (!selectedSubjectId) return;
    setExpandedSubjectIds((current) => (current.includes(selectedSubjectId) ? current : [...current, selectedSubjectId]));
  }, [selectedSubjectId]);

  useEffect(() => {
    setIsLessonDetailOpen(false);
  }, [selectedSectionId, selectedSubjectId]);

  function handleToggleSubject(subjectId: string) {
    setExpandedSubjectIds((current) => (current.includes(subjectId) ? current.filter((id) => id !== subjectId) : [...current, subjectId]));
  }

  const totalVisibleResources = useMemo(
    () => sections.reduce((total, section) => total + section.lessons.reduce((lessonTotal, lesson) => lessonTotal + lesson.resources.length, 0), 0),
    [sections],
  );

  const lessonResourceBuckets = useMemo(() => partitionLessonResources(activeLesson?.resources ?? []), [activeLesson]);

  function handleOpenLesson(lessonId: string) {
    onSelectLesson(lessonId);
    setIsLessonDetailOpen(true);
  }

  function handleBackToLessonGrid() {
    setIsLessonDetailOpen(false);
  }

  return (
    <div className="min-h-full bg-[#f7f9fc]">
      <div className="w-full">
        <div className="grid gap-0 xl:grid-cols-[264px_minmax(0,1fr)]">
          {loading && subjects.length === 0 ? (
            <SubjectRailSkeleton />
          ) : (
            <SubjectRail
              subjects={subjects}
              selectedSubjectId={selectedSubjectId}
              selectedSectionId={selectedSectionId}
              expandedSubjectIds={expandedSubjectIds}
              onSelectSubject={onSelectSubject}
              onSelectSection={onSelectSection}
              onToggleSubject={handleToggleSubject}
            />
          )}

          <section className="min-w-0 px-7 py-5">
            <div className="flex flex-col gap-5 border-b border-slate-200 pb-4 lg:flex-row lg:items-center lg:justify-end">
              <div className="w-full max-w-[390px]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    placeholder="Tìm học liệu, nhóm hoặc bài học"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#091f80] focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>

            <div className="pt-5">
              {error ? <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 text-sm font-bold text-amber-700">{error}</div> : null}

              {loading ? (
                <LessonGridSkeleton />
              ) : (
                <div className="space-y-12">
                  {sections.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                      <p className="text-lg font-black text-slate-950">Chưa có học liệu phù hợp</p>
                      <p className="mt-2 text-sm text-slate-500">
                        {searchValue ? "Thử đổi từ khóa tìm kiếm hoặc chọn nhóm học liệu khác." : "Môn học này chưa có học liệu để hiển thị."}
                      </p>
                    </div>
                  ) : activeSection ? (
                    <section className="space-y-5">
                      {!isLessonDetailOpen ? (
                        loadingSubject ? (
                          <LessonGridSkeleton />
                        ) : (
                          <div className="space-y-5">
                            <h2 className="text-[32px] font-black tracking-tight text-slate-950">{activeSection.title}</h2>
                            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                              {activeSection.lessons.map((lesson) => (
                                <LessonCard key={lesson.id} lesson={lesson} onOpen={() => handleOpenLesson(lesson.id)} />
                              ))}
                            </div>
                          </div>
                        )
                      ) : activeLesson ? (
                        <div className="space-y-8">
                          <div>
                            <button
                              type="button"
                              onClick={handleBackToLessonGrid}
                              className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-900"
                            >
                              <ChevronLeft className="h-4 w-4" />
                              Quay lại
                            </button>
                            <h3 className="mt-3 text-[28px] font-black tracking-tight text-slate-950">{activeLesson.title}</h3>
                          </div>

                          {loadingSubject ? (
                            <ResourceGridSkeleton />
                          ) : lessonResourceBuckets.lectureResources.length > 0 || lessonResourceBuckets.exerciseResources.length > 0 ? (
                            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                              {lessonResourceBuckets.lectureResources.map((resource) => (
                                <ResourceCard
                                  key={resource.id}
                                  resource={resource}
                                  progressRate={activeLesson.progress.progressRate}
                                  kindLabel="Bài giảng"
                                  onOpen={onOpenResource}
                                />
                              ))}
                              {lessonResourceBuckets.exerciseResources.map((resource) => (
                                <ResourceCard
                                  key={resource.id}
                                  resource={resource}
                                  progressRate={activeLesson.progress.progressRate}
                                  kindLabel="Bài tập"
                                  onOpen={onOpenResource}
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-sm text-slate-500">
                              Chưa có học liệu trong bài học này.
                            </div>
                          )}
                        </div>
                      ) : null}
                    </section>
                  ) : null}
                </div>
              )}

              {!loading && sections.length > 0 && !isLessonDetailOpen ? <div className="pt-4 text-sm text-slate-400">{totalVisibleResources} học liệu đang hiển thị</div> : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
